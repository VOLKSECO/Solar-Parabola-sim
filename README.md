# Simulation Parabole Solaire

Un outil web pour simuler une parabole solaire chauffant de l'eau, créé par **Marco Bernardo**, inspiré de [volkseco.github.io/peltier-energy-sim](https://volkseco.github.io/peltier-energy-sim/). Calcule la température de l'eau et les énergies (solaire, captée, perdue) à la minute, avec graphiques et rapport explicatif multilingue. Accessible sur PC, tablettes, et mobiles.

**Démo en ligne** : [https://volkseco.github.io/Solar-Parabola-sim/](https://volkseco.github.io/Solar-Parabola-sim/)

## Fonctionnalités

- Entrées (valeurs par défaut) :
  - Soleil : Radiation solaire (650 W/m²)
  - Parabole : Diamètre (0.8 m), Efficacité optique (0.82)
  - Casserole : Volume (0.5 L), Température initiale (17°C), Température extérieure (20°C), Efficacité transfert (0.85), Pertes (5 W/°C)
- Sorties :
  - Graphiques (température °C et énergies Wh) vs temps (minutes), légendes optimisées.
  - Temps pour atteindre 100°C.
  - Rapport explicatif vulgarisé avec conseils et équations.
- Interface : vcards interactives (clic pour éditer, explications simples), schéma SVG, images SVG.
- Multilingue : Français, anglais, portugais, espagnol, allemand, arabe (tous les textes traduits, y compris unités).
- Responsive : PC, tablettes, mobiles.
- Calculs à la minute, sans ébullition.
- Gestion d’erreurs : Messages traduits pour les problèmes de chargement de Chart.js ou de création des graphiques.

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/VOLKSECO/Solar-Parabola-sim.git
