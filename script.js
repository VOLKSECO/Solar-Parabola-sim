let translations = {};
let currentLang = 'fr';

// Charger les traductions
fetch('translations.json')
    .then(response => response.json())
    .then(data => {
        translations = data;
        updateLanguage(currentLang); // Appeler après chargement des traductions
    })
    .catch(error => console.error('Erreur chargement traductions:', error));

// Changer la langue
function changeLanguage() {
    currentLang = document.getElementById('language').value;
    document.documentElement.lang = currentLang;
    document.body.setAttribute('lang', currentLang);
    updateLanguage(currentLang);
}

// Mettre à jour tous les textes
function updateLanguage(lang) {
    // Vérifier si les traductions sont chargées
    if (!translations[lang]) return;

    // Textes statiques (DOM)
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });

    // Mettre à jour les valeurs des vcards
    updateVcardValues();

    // Mettre à jour les graphiques si existants
    if (window.tempChart && window.tempChart.data && window.tempChart.data.datasets) {
        window.tempChart.data.datasets[0].label = translations[lang]['temp-chart-title'];
        window.tempChart.options.scales.x.title.text = translations[lang]['time-axis'];
        window.tempChart.options.scales.y.title.text = translations[lang]['temp-axis'];
        window.tempChart.update();
    }
    if (window.energyChart && window.energyChart.data && window.energyChart.data.datasets) {
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
    document.getElementById('G-display').textContent = document.getElementById('G').value;
    document.getElementById('D-display').textContent = document.getElementById('D').value;
    document.getElementById('eta_opt-display').textContent = document.getElementById('eta_opt').value;
    document.getElementById('V-display').textContent = document.getElementById('V').value;
    document.getElementById('T_init-display').textContent = document.getElementById('T_init').value;
    document.getElementById('T_ext-display').textContent = document.getElementById('T_ext').value;
    document.getElementById('eta_trans-display').textContent = document.getElementById('eta_trans').value;
    document.getElementById('k_pertes-display').textContent = document.getElementById('k_pertes').value;
}

// Initialiser les contextes des graphiques
const tempCtx = document.getElementById('temperatureChart').getContext('2d');
const energyCtx = document.getElementById('energyChart').getContext('2d');

// Gérer l'affichage/masquage des champs
function toggleEdit(module) {
    const inputs = document.getElementById(`${module}-inputs`);
    const isVisible = inputs.style.display === 'block';
    inputs.style.display = isVisible ? 'none' : 'block';
    if (isVisible) updateVcardValues();
}

function runSimulation() {
    // Vérifier si Chart.js est chargé
    if (!window.Chart) {
        console.error('Chart.js n\'est pas chargé. Vérifiez le CDN.');
        document.getElementById('result').textContent = translations[currentLang]['error-chartjs'];
        return;
    }

    // Récupérer les entrées
    const G = parseFloat(document.getElementById('G').value) || 650;
    const D = parseFloat(document.getElementById('D').value) || 0.8;
    const V = parseFloat(document.getElementById('V').value) || 0.5;
    const T_init = parseFloat(document.getElementById('T_init').value) || 17;
    const T_ext = parseFloat(document.getElementById('T_ext').value) || 20;
    const eta_opt = parseFloat(document.getElementById('eta_opt').value) || 0.82;
    const eta_trans = parseFloat(document.getElementById('eta_trans').value) || 0.85;
    const k_pertes = parseFloat(document.getElementById('k_pertes').value) || 5;

    // Constantes
    const c = 1.163; // Wh/(kg·°C)
    const S = Math.PI * (D / 2) ** 2; // Surface parabole (m²)
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
    document.getElementById('result').textContent = resultText;

    // Générer le rapport
    document.getElementById('report-results-text').innerHTML = `
        ${resultText} ${translations[currentLang]['report-results-text'].replace('Lancez une simulation pour voir les résultats !', '')}
        ${translations[currentLang]['report-temp-change'].replace('{T_init}', T_init).replace('{T_eau}', T_eau.toFixed(1))}
    `;
    document.getElementById('report-interpretation-text').innerHTML = `
        ${translations[currentLang]['report-interpretation-text']}
        <ul>
            <li>${translations[currentLang]['report-energy-solar'].replace('{totalSolar}', totalSolar.toFixed(0))}</li>
            <li>${translations[currentLang]['report-energy-captured'].replace('{totalCaptured}', totalCaptured.toFixed(0))}</li>
            <li>${translations[currentLang]['report-energy-lost'].replace('{totalLosses}', totalLosses.toFixed(0))}</li>
        </ul>
    `;
    document.getElementById('report-advice-text').innerHTML = translations[currentLang]['report-advice-text'];

    // Mettre à jour le graphique de température
    try {
        if (window.tempChart && typeof window.tempChart.destroy === 'function') {
            window.tempChart.destroy();
        }
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
    } catch (error) {
        console.error('Erreur lors de la création du graphique de température:', error);
        document.getElementById('result').textContent = translations[currentLang]['error-chart'];
    }

    // Mettre à jour le graphique d'énergie
    try {
        if (window.energyChart && typeof window.energyChart.destroy === 'function') {
            window.energyChart.destroy();
        }
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
    } catch (error) {
        console.error('Erreur lors de la création du graphique d\'énergie:', error);
        document.getElementById('result').textContent = translations[currentLang]['error-chart'];
    }
}