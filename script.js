// Initialiser les graphiques
const tempCtx = document.getElementById('temperatureChart').getContext('2d');
const energyCtx = document.getElementById('energyChart').getContext('2d');
let tempChart, energyChart;

function runSimulation() {
    // Récupérer les entrées
    const G = parseFloat(document.getElementById('G').value) || 650;
    const D = parseFloat(document.getElementById('D').value) ||0.8;
    const V = parseFloat(document.getElementById('V').value) || 0.5;
    const T_init = parseFloat(document.getElementById('T_init').value) || 20;
    const T_ext = parseFloat(document.getElementById('T_ext').value) || 20;
    const eta_opt = parseFloat(document.getElementById('eta_opt').value) || 0.79;
    const eta_trans = parseFloat(document.getElementById('eta_trans').value) || 0.72;
    const k_pertes = parseFloat(document.getElementById('k_pertes').value) || 0.6;

    // Constantes
    const c = 1.163; // Wh/(kg·°C)
    const S = Math.PI * (D / 2) ** 2; // Surface parabole (m²)
    const m = V; // Masse eau (kg)
    let T_eau = T_init; // Température initiale (°C)
    const dt = 60; // Pas de temps (1 minute en secondes)
    const maxTime = 24 * 60 * 60; // 24h en secondes

    // Données pour graphiques
    const tempData = [];
    const energyData = {
        solar: [], // Énergie émise par le soleil
        captured: [], // Énergie captée
        losses: [] // Énergie perdue
    };
    let temps = 0;
    let totalSolar = 0;
    let totalCaptured = 0;
    let totalLosses = 0;

    // Simulation
    while (T_eau < 100 && temps < maxTime) {
        const Q_solaire = G * S; // W (énergie solaire incidente)
        const Q_capté = Q_solaire * eta_opt; // W (énergie captée)
        const Q_pertes = k_pertes * (T_eau - T_ext); // W
        const Q_net = (Q_capté * eta_trans - Q_pertes); // W
        const dT = Q_net * dt / (m * c * 3600); // °C
        T_eau += dT;

        // Cumuler l'énergie (convertir en Wh pour 1 minute)
        totalSolar += (Q_solaire * dt) / 3600; // Wh
        totalCaptured += (Q_capté * eta_trans * dt) / 3600; // Wh
        totalLosses += (Q_pertes * dt) / 3600; // Wh

        // Stocker les données toutes les minutes
        tempData.push({ x: temps / 60, y: T_eau.toFixed(2) });
        energyData.solar.push({ x: temps / 60, y: totalSolar.toFixed(2) });
        energyData.captured.push({ x: temps / 60, y: totalCaptured.toFixed(2) });
        energyData.losses.push({ x: temps / 60, y: totalLosses.toFixed(2) });

        temps += dt;
    }

    // Afficher le temps pour 100°C
    const resultDiv = document.getElementById('result');
    if (T_eau >= 100) {
        resultDiv.textContent = `Temps pour atteindre 100°C : ${(temps / 60).toFixed(2)} minutes`;
    } else {
        resultDiv.textContent = `100°C non atteint en 24h`;
    }

    // Mettre à jour le graphique de température
    if (tempChart) tempChart.destroy();
    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Température de l’eau (°C)',
                data: tempData,
                borderColor: '#007bff',
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Temps (minutes)' },
                    ticks: { stepSize: 1 }, // Étiquettes toutes les minutes
                    max: Math.ceil(temps / 60) // Ajuster l'échelle
                },
                y: {
                    title: { display: true, text: 'Température (°C)' },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: { display: true }
            }
        }
    });

    // Mettre à jour le graphique d'énergie
    if (energyChart) energyChart.destroy();
    energyChart = new Chart(energyCtx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Énergie solaire (Wh)',
                    data: energyData.solar,
                    borderColor: '#004085',
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Énergie captée (Wh)',
                    data: energyData.captured,
                    borderColor: '#28a745',
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Énergie perdue (Wh)',
                    data: energyData.losses,
                    borderColor: '#dc3545',
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Temps (minutes)' },
                    ticks: { stepSize: 1 },
                    max: Math.ceil(temps / 60)
                },
                y: {
                    title: { display: true, text: 'Énergie (Wh)' },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: { display: true }
            }
        }
    });
}