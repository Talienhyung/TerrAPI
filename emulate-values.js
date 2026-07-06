setInterval(() => {
    const values = {
        temperature: (Math.random() * 30 + 10).toFixed(2), // Random temperature between 10 and 40
        humidity: (Math.random() * 50 + 30).toFixed(2), // Random humidity between 30 and 80
        pressure: (Math.random() * 20 + 980).toFixed(2) // Random pressure between 980 and 1000
    };


    const humidity = values.humidity;
    const temperature = values.temperature;  // Celsius

    // Vérification lecture valide
    if (Number.isNaN(humidity) || Number.isNaN(temperature)) {
        console.log("Erreur lecture DHT11 !");
        return;
    }

    // Envoi des données à l'API REST
    const api = new URL("http://localhost:3000/api/data")
    api.searchParams.append("temperature", temperature);
    api.searchParams.append("humidity", humidity);

    // Header HTTP
    const headers = { "Content-Type": "application/json" }
    // Corps JSON
    const body = JSON.stringify({ humidity: parseFloat(humidity), temperature: parseFloat(temperature), timestamp: Math.floor(process.uptime() * 1000) });
    // Requête POST
    const req = { method: "POST", headers, body }
    const send = async () => {
        try {
            const response = await fetch(api, req);
            if (response.ok) console.log("Données envoyées avec succès ✓");
            else console.log("Erreur HTTP : %d\n", response.status);
        } catch (error) { console.log("Erreur lors de l'envoi des données :", error); }
    }

    send();
}, 2000);