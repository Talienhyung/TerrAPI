#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHT_PIN     4
#define DHT_TYPE    DHT11
#define RESET_PIN   0     // Bouton BOOT intégré sur la plupart des ESP32
#define LED_PIN     2     // LED bleue intégrée sur la plupart des ESP32

// ── Durée de veille entre deux mesures ───────────────────────────────────────
// Calcul : temps actif estimé par cycle ≈ 6 s (boot + WiFi + DHT + POST)
//   300 s → ~282 cycles/jour → ~28 min actif/jour  (~2 % du temps)
//    60 s → ~1235 cycles/jour → ~123 min actif/jour (~9 % du temps)
#define SLEEP_SECONDS 300ULL
// ─────────────────────────────────────────────────────────────────────────────

DHT         dht(DHT_PIN, DHT_TYPE);
Preferences prefs;
WebServer   portalServer(80);
DNSServer   dnsServer;

String savedSSID, savedPassword, savedServerIP;
int    savedServerPort;
bool   isConfigured = false;

// ── Page HTML du portail ─────────────────────────────────────────────────────
const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TerrAPI - Configuration</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto;
           padding: 24px; background: #1a1a2e; color: #eee; }
    h1   { color: #e94560; text-align: center; margin-bottom: 24px; }
    label { display: block; margin: 12px 0 4px; font-size: 14px; color: #aaa; }
    input { width: 100%; padding: 10px; border: 1px solid #444; border-radius: 6px;
            background: #16213e; color: #eee; font-size: 15px; }
    input:focus { outline: none; border-color: #e94560; }
    button { width: 100%; padding: 12px; margin-top: 24px; background: #e94560;
             color: white; border: none; border-radius: 6px; cursor: pointer;
             font-size: 16px; font-weight: bold; }
    button:hover { background: #c73652; }
    .hint { font-size: 12px; color: #888; margin-top: 2px; }
  </style>
</head>
<body>
  <h1>TerrAPI Setup</h1>
  <form action="/save" method="POST">
    <label>WiFi SSID</label>
    <input type="text" name="ssid" required placeholder="Nom du réseau WiFi">

    <label>WiFi Password</label>
    <input type="password" name="password" placeholder="Laisser vide si réseau ouvert">

    <label>IP du serveur</label>
    <input type="text" name="server_ip" required placeholder="ex: 192.168.1.100">
    <div class="hint">IP locale du PC qui fait tourner TerrAPI</div>

    <label>Port du serveur</label>
    <input type="number" name="server_port" value="3000" required min="1" max="65535">

    <button type="submit">Enregistrer et redémarrer</button>
  </form>
</body>
</html>
)rawliteral";

const char SAVED_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>TerrAPI</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 420px; margin: 60px auto;
           padding: 24px; background: #1a1a2e; color: #eee; text-align: center; }
    h1   { color: #4caf50; }
    p    { color: #aaa; }
  </style>
</head>
<body>
  <h1>Configuration sauvegardée !</h1>
  <p>L'ESP32 redémarre et se connecte au WiFi...</p>
</body>
</html>
)rawliteral";
// ─────────────────────────────────────────────────────────────────────────────

void ledBlink(int times, int onMs, int offMs = -1) {
  if (offMs < 0) offMs = onMs;
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(onMs);
    digitalWrite(LED_PIN, LOW);
    if (i < times - 1) delay(offMs);
  }
}

void ledSOS() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH); delay(400);
    digitalWrite(LED_PIN, LOW);  delay(150);
  }
}

void goToSleep() {
  float activeS     = (float)millis() / 1000.0;
  float cycleS      = activeS + SLEEP_SECONDS;
  float cyclesDay   = 86400.0 / cycleS;
  float activeMinDay = (cyclesDay * activeS) / 60.0;

  Serial.printf("Temps actif ce cycle : %.1f s\n", activeS);
  Serial.printf("Cycles/jour estimés  : %.0f\n", cyclesDay);
  Serial.printf("Temps actif/jour     : %.1f min (%.1f %%)\n",
                activeMinDay, (activeMinDay * 100.0) / 1440.0);
  Serial.printf("Mise en veille pour %llu s...\n\n", SLEEP_SECONDS);
  Serial.flush();

  esp_sleep_enable_timer_wakeup(SLEEP_SECONDS * 1000000ULL);
  esp_deep_sleep_start();
}

void startCaptivePortal() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP("TerrAPI-Setup");

  dnsServer.start(53, "*", WiFi.softAPIP());

  portalServer.on("/", HTTP_GET, []() {
    portalServer.send(200, "text/html; charset=utf-8", PORTAL_HTML);
  });

  portalServer.on("/save", HTTP_POST, []() {
    String ssid       = portalServer.arg("ssid");
    String password   = portalServer.arg("password");
    String serverIP   = portalServer.arg("server_ip");
    int    serverPort = portalServer.arg("server_port").toInt();

    if (ssid.length() == 0 || serverIP.length() == 0) {
      portalServer.send(400, "text/plain", "SSID et IP serveur requis");
      return;
    }

    prefs.begin("terrapi", false);
    prefs.putString("ssid",        ssid);
    prefs.putString("password",    password);
    prefs.putString("server_ip",   serverIP);
    prefs.putInt   ("server_port", serverPort);
    prefs.end();

    portalServer.send(200, "text/html; charset=utf-8", SAVED_HTML);
    delay(2000);
    ESP.restart();
  });

  portalServer.onNotFound([]() {
    portalServer.sendHeader("Location", "http://192.168.4.1/");
    portalServer.send(302, "text/plain", "");
  });

  portalServer.begin();
  Serial.println("=== Portail de configuration actif ===");
  Serial.println("Connectez-vous au WiFi : TerrAPI-Setup");
  Serial.println("Puis ouvrez : http://192.168.4.1");
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  ledBlink(1, 100); // réveil

  // Maintenir BOOT (GPIO 0) au démarrage 3 s → reset config
  pinMode(RESET_PIN, INPUT_PULLUP);
  if (digitalRead(RESET_PIN) == LOW) {
    Serial.println("Bouton BOOT détecté — attente 3 s pour confirmer le reset...");
    delay(3000);
    if (digitalRead(RESET_PIN) == LOW) {
      Serial.println("Reset de la configuration !");
      prefs.begin("terrapi", false);
      prefs.clear();
      prefs.end();
      Serial.println("Config effacée. Redémarrage...");
      delay(500);
      ESP.restart();
    }
  }

  // Lecture des credentials sauvegardés
  prefs.begin("terrapi", true);
  savedSSID       = prefs.getString("ssid",        "");
  savedPassword   = prefs.getString("password",    "");
  savedServerIP   = prefs.getString("server_ip",   "");
  savedServerPort = prefs.getInt   ("server_port", 3000);
  prefs.end();

  if (savedSSID.length() == 0) {
    Serial.println("Aucune configuration. Lancement du portail...");
    startCaptivePortal();
    return;
  }

  // ── Connexion WiFi ──────────────────────────────────────────────────────────
  Serial.printf("Connexion au réseau '%s'...\n", savedSSID.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(savedSSID.c_str(), savedPassword.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    // Clignotement rapide pendant la connexion WiFi
    digitalWrite(LED_PIN, HIGH); delay(100);
    digitalWrite(LED_PIN, LOW);  delay(400);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nÉchec WiFi. Lancement du portail...");
    ledSOS();
    startCaptivePortal();
    return;
  }

  Serial.println("\nWiFi connecté !");
  ledBlink(2, 150, 100); // WiFi OK
  isConfigured = true;

  // ── Lecture DHT11 (2 s de stabilisation) ───────────────────────────────────
  delay(2000);
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Erreur lecture DHT11 — mise en veille quand même.");
    ledBlink(5, 80, 80); // erreur capteur
    goToSleep();
    return;
  }

  Serial.printf("Temp: %.1f°C  |  Humidité: %.1f%%\n", temperature, humidity);

  // ── Envoi à l'API ───────────────────────────────────────────────────────────
  HTTPClient http;
  String url = "http://" + savedServerIP + ":" + String(savedServerPort) + "/api/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"temperature\":" + String(temperature, 1) +
                ",\"humidity\":"    + String(humidity, 1)    +
                ",\"timestamp\":"   + String(millis())       + "}";

  int httpCode = http.POST(json);
  if (httpCode == 200) {
    Serial.println("Données envoyées avec succès ✓");
    ledBlink(3, 80, 80); // envoi OK
  } else {
    Serial.printf("Erreur HTTP : %d\n", httpCode);
    ledSOS(); // erreur serveur
  }
  http.end();

  goToSleep();
}

void loop() {
  // Uniquement actif en mode portail (pas de deep sleep dans ce cas)
  if (!isConfigured) {
    dnsServer.processNextRequest();
    portalServer.handleClient();
  }
}
