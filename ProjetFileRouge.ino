#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// === CONFIGURATION wifi ===
const char* WIFI_SSID     = "Livebox-00F0";
const char* WIFI_PASSWORD = "7YJMHWrv9i2Zx69qJq";
const char* SERVER_IP     = "192.168.1.12";  // IP de ton PC sur le réseau local
const int   SERVER_PORT   = 3000;
// ================================

#define DHT_PIN  1          // GPIO4 connecté au DATA du DHT11
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Connexion WiFi
  Serial.print("Connexion WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connecté !");
    Serial.print("IP ESP32 : ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nÉchec connexion WiFi ! Vérifiez SSID/mot de passe.");
    // Ici, vous pouvez ajouter une logique pour redémarrer ou continuer sans WiFi
  }
}

void loop() {
  delay(2000);  // Lecture toutes les 2 secondes (minimum DHT11)

  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();  // Celsius

  // Vérification lecture valide
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Erreur lecture DHT11 !");
    return;
  }

  Serial.printf("Temp: %.1f°C  |  Humidité: %.1f%%\n", temperature, humidity);

  // Envoi des données à l'API REST
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/data";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // Corps JSON
    String json = "{\"temperature\":" + String(temperature, 1) +
                  ",\"humidity\":"    + String(humidity, 1)    +
                  ",\"timestamp\":"   + String(millis())       + "}";

    int httpCode = http.POST(json);

    if (httpCode == 200) {
      Serial.println("Données envoyées avec succès ✓");
    } else {
      Serial.printf("Erreur HTTP : %d\n", httpCode);
    }
    http.end();
  }
}
