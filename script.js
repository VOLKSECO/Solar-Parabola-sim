let translations = {};
let currentLang = 'fr';

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Charger les traductions
    fetch('./translations.json')
        .then(response => response.json())
        .then(data => {
            translations = data;
            updateLanguage(currentLang);
        })
        .catch(error => console.error('Erreur chargement traductions:', error));
});

// Changer la langue
function changeLanguage() {
    const languageSelect = document.getElementById('language');
    if (!languageSelect) return;
    currentLang = languageSelect.value;
    document.documentElement.lang = currentLang;
    document.body.setAttribute('lang', currentLang);
    updateLanguage(currentLang);
}

// Mettre à jour tous les textes
function updateLanguage(lang) {
    if (!translations[lang]) return;

    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });

    updateVcardValues();

    if (window.tempChart && typeof window.tempChart.destroy === 'function') {
        window.tempChart.data.datasets[0].label = translations[lang]['temp-chart-title'];
        window.tempChart.options.scales.x.title.text = translations[lang]['time-axis'];
        window.tempChart.options.scales.y.title.text = translations[lang]['temp-axis'];
        window.tempChart.update();
    }
    if (window.energyChart && typeof window.energyChart.destroy === 'function') {
        window.energyChart.data.datasets[0].label = translations[lang]['energy-solar-label'];
        window.energyChart.data.datasets[1].label = translations[lang]['energy-captured-label'];
        window.energyChart.data.datasets[2].label = translations[lang]['energy-lost-label'];
        window.energyChart.options.scales.x.title.text = translations[lang]['time-axis'];
        window.energyChart.options.scales.y.title.text = translations[lang]['energy-axis'];
        window.energyChart.update();
    }
}

// Mettre à jour les valeurs des vcards
function updateVcardValues() {
    const inputs = [
        { id: 'G', display: 'G-display' },
        { id: 'H', display: 'H-display' },
        { id: 'W', display: 'W-display' },
        { id: 'eta_opt', display: 'eta_opt-display' },
        { id: 'V', display: 'V-display' },
        { id: 'T_init', display: 'T_init-display' },
        { id: 'T_ext', display: 'T_ext-display' },
        { id: 'eta_trans', display: 'eta_trans-display' },
        { id: 'k_pertes', display: 'k_pertes-display' }
    ];

    inputs.forEach(({ id, display }) => {
        const input = document.getElementById(id);
        const displayElement = document.getElementById(display);
        if (input && displayElement) {
            displayElement.textContent = input.value || 'N/A';
        }
    });
}

// Initialiser les graphiques
const tempCtx = document.getElementById('temperatureChart')?.getContext('2d');
const energyCtx = document.getElementById('energyChart')?.getContext('2d');

// Gérer l'affichage/masquage des champs
function toggleEdit(module) {
    const inputs = document.getElementById(`${module}-inputs`);
    if (!inputs) return;
    const isVisible = inputs.style.display === 'block';
    inputs.style.display = isVisible ? 'none' : 'block';
    if (isVisible) updateVcardValues();
}

function runSimulation() {
    // Vérifier que les inputs existent
    const inputIds = ['G', 'H', 'W', 'V', 'T_init', 'T_ext', 'eta_opt', 'eta_trans', 'k_pertes'];
    for (const id of inputIds) {
        if (!document.getElementById(id)) {
            console.error(`Input avec ID "${id}" non trouvé`);
            return;
        }
    }

    // Récupérer les entrées
    const G = parseFloat(document.getElementById('G').value) || 650;
    const H = parseFloat(document.getElementById('H').value) || 0.8;
    const W = parseFloat(document.getElementById('W').value) || 1.0;
    const V = parseFloat(document.getElementById('V').value) || 0.5;
    const T_init = parseFloat(document.getElementById('T_init').value) || 17;
    const T_ext = parseFloat(document.getElementById('T_ext').value) || 20;
    const eta_opt = parseFloat(document.getElementById('eta_opt').value) || 0.82;
    const eta_trans = parseFloat(document.getElementById('eta_trans').value) || 0.85;
    const k_pertes = parseFloat(document.getElementById('k_pertes').value) || 5;

    // Constantes
    const c = 1.163; // Wh/(kg·°C)
    const S = Math.PI * H * W / 4; // Surface parabole elliptique (m²)
    const m = V; // Masse eau (kg)
    let T_eau = T_init; // Température initiale (°C)
    const dt = 60; // Pas de temps (1 minute en secondes)
    const maxTime = 24 * 60 * 60; // 24h en secondes

    // Données pour graphiques
    const tempData = [];
    const energyData = { solar: [], captured: [], losses: [] };
    let temps = 0;
    let totalSolar = 0;
    let totalCaptured = 0;
    let totalLosses = 0;

    // Simulation
    while (T_eau < 100 && temps < maxTime) {
        const Q_solaire = G * S;
        const Q_capté = Q_solaire * eta_opt;
        const Q_pertes = k_pertes * (T_eau - T_ext);
        const Q_net = (Q_capté * eta_trans - Q_pertes);
        const dT = Q_net * dt / (m * c * 3600);
        T_eau += dT;

        totalSolar += (Q_solaire * dt) / 3600;
        totalCaptured += (Q_capté * eta_trans * dt) / 3600;
        totalLosses += (Q_pertes * dt) / 3600;

        tempData.push({ x: temps / 60, y: T_eau.toFixed(2) });
        energyData.solar.push({ x: temps / 60, y: totalSolar.toFixed(2) });
        energyData.captured.push({ x: temps / 60, y: totalCaptured.toFixed(2) });
        energyData.losses.push({ x: temps / 60, y: totalLosses.toFixed(2) });

        temps += dt;
    }

    // Afficher le résultat
    const resultText = T_eau >= 100
        ? translations[currentLang]['result'].replace('{time}', (temps / 60).toFixed(2))
        : translations[currentLang]['result-not-reached'];
    const resultElement = document.getElementById('result');
    if (resultElement) resultElement.textContent = resultText;

    // Générer le rapport
    const reportResults = document.getElementById('report-results-text');
    if (reportResults) {
        reportResults.innerHTML = `
            ${resultText} ${translations[currentLang]['report-results-text'].replace('Lancez une simulation pour voir les résultats !', '')}
            ${translations[currentLang]['report-temp-change'].replace('{T_init}', T_init).replace('{T_eau}', T_eau.toFixed(1))}
        `;
    }
    const reportInterpretation = document.getElementById('report-interpretation-text');
    if (reportInterpretation) {
        reportInterpretation.innerHTML = `
            ${translations[currentLang]['report-interpretation-text']}
            <ul>
                <li>${translations[currentLang]['report-energy-solar'].replace('{totalSolar}', totalSolar.toFixed(0))}</li>
                <li>${translations[currentLang]['report-energy-captured'].replace('{totalCaptured}', totalCaptured.toFixed(0))}</li>
                <li>${translations[currentLang]['report-energy-lost'].replace('{totalLosses}', totalLosses.toFixed(0))}</li>
            </ul>
        `;
    }
    const reportAdvice = document.getElementById('report-advice-text');
    if (reportAdvice) {
        reportAdvice.innerHTML = translations[currentLang]['report-advice-text'];
    }

    // Détruire les anciens graphiques si existants
    if (window.tempChart && typeof window.tempChart.destroy === 'function') {
        window.tempChart.destroy();
    }
    if (window.energyChart && typeof window.energyChart.destroy === 'function') {
        window.energyChart.destroy();
    }

    // Créer le graphique de température
    if (tempCtx) {
        window.tempChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                datasets: [{
                    label: translations[currentLang]['temp-chart-title'],
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
                        title: { display: true, text: translations[currentLang]['time-axis'] },
                        ticks: { stepSize: 10 },
                        max: Math.ceil(temps / 60)
                    },
                    y: {
                        title: { display: true, text: translations[currentLang]['temp-axis'] },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 12 } } }
                }
            }
        });
    }

    // Créer le graphique d'énergie
    if (energyCtx) {
        window.energyChart = new Chart(energyCtx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: translations[currentLang]['energy-solar-label'],
                        data: energyData.solar,
                        borderColor: '#004085',
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: translations[currentLang]['energy-captured-label'],
                        data: energyData.captured,
                        borderColor: '#28a745',
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: translations[currentLang]['energy-lost-label'],
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
                        title: { display: true, text: translations[currentLang]['time-axis'] },
                        ticks: { stepSize: 10 },
                        max: Math.ceil(temps / 60)
                    },
                    y: {
                        title: { display: true, text: translations[currentLang]['energy-axis'] },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 12 } } }
                }
            }
        });
    }
}