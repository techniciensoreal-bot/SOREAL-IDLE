import { writeFileSync } from 'node:fs';

const SUFFIX = { '': 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21, Sp: 1e24, Oc: 1e27, No: 1e30, Dc: 1e33 };
const n = (v, s) => v * SUFFIX[s];

// zone#, real name, real Idle/Manual/AutoKill Power anchor, isTitan, unlockBoss (real, kept 1:1 for SOREAL boss progression), draftSorealName, setThemeName
const zones = [
  [2, 'Tutorial Zone', n(13, ''), false, 4, 'Quai de Réception', 'Tenue Bénévole'],
  [3, 'Sewers', n(21, ''), false, 7, 'Sous-sol des Encombrants', 'Tenue Encombrants'],
  [4, 'Forest', n(53, ''), false, 17, 'Réserve des Palettes Perdues', 'Tenue Forestière'],
  [5, 'Cave of Many Things', n(200, ''), false, 37, 'Cave à Denrées Périmées', 'Tenue Cave'],
  [6, 'The Sky', n(750, ''), false, 48, "Quai d'Expédition Aérienne", 'Tenue Aérienne'],
  [7, 'High Security Base', n(750, ''), false, 58, 'Entrepôt Sécurisé', 'Tenue Sécurité'],
  [8, 'Gordon Ramsay Bolton', n(2300, ''), true, 58, '[TITAN] Le Chef Boulanger Furieux', 'Tenue Toque'],
  [9, 'Clock Dimension', n(4500, ''), false, 66, 'Zone des Horaires Impossibles', 'Tenue Horlogère'],
  [10, 'Grand Corrupted Tree', n(6000, ''), true, 66, '[TITAN] Le Grand Chêne Périmé', 'Tenue Racines'],
  [11, 'The 2D Universe', n(8000, ''), false, 74, 'Rayonnage à Plat', 'Tenue Carton Plat'],
  [12, 'Ancient Battlefield', n(17000, ''), false, 82, 'Entrepôt Abandonné', 'Tenue Poussiéreuse'],
  [13, 'Jake from Accounting', n(22000, ''), true, 82, '[TITAN] Le Comptable Hanté', 'Tenue Bureau'],
  [14, 'A Very Strange Place', n(48000, ''), false, 90, 'Le Quai Qui N’existe Pas', 'Tenue Improbable'],
  [15, 'Mega Lands', n(265000, ''), false, 100, 'Le Méga-Entrepôt', 'Tenue Méga'],
  [16, 'UUG, The Unmentionable', n(600000, ''), true, 100, '[TITAN] Le Congélateur Sans Nom', 'Tenue Givrée'],
  [17, 'The Beardverse', n(3, 'M'), false, 108, 'Le Local des Vieux Sacs', 'Tenue Barbue'],
  [18, 'Walderp', n(4, 'M'), true, 116, '[TITAN] Le Palettiseur Fou', 'Tenue Vagabonde'],
  [19, 'Badly Drawn World', n(45, 'M'), false, 116, 'Zone Mal Étiquetée', 'Tenue Griffonnée'],
  [20, 'Boring-Ass Earth', n(360, 'M'), false, 124, 'Le Parking Sans Fin', 'Tenue Discrète'],
  [21, 'The Beast', n(10, 'B'), true, 132, '[TITAN] La Bête du Quai 12', 'Tenue Gluante'],
  [22, 'Chocolate World', n(150, 'B'), false, 137, 'Le Rayon Confiserie Fondu', 'Tenue Chocolat'],
  [23, 'The Evilverse', n(24, 'T'), false, 58, 'Le Sous-sol Maudit', 'Tenue Sombre'],
  [24, 'Pretty Pink Princess Land', n(130, 'T'), false, 100, 'Le Rayon Jouets Roses', 'Tenue Princesse'],
  [25, 'Greasy Nerd', n(6, 'Qa'), true, 125, '[TITAN] Le Stagiaire Graisseux', 'Tenue Stagiaire'],
  [26, 'Meta Land', n(45, 'Qa'), false, 158, "L'Inventaire de l'Inventaire", 'Tenue Numérique'],
  [27, 'Interdimensional Party', n(480, 'Qa'), false, 166, 'La Fête du Personnel Inter-Dimensions', 'Tenue Fête'],
  [28, 'The Godmother', n(39, 'Qi'), true, 166, '[TITAN] La Marraine du Quai', 'Tenue Mafia'],
  [29, 'Typo Zonw', n(370, 'Qi'), false, 174, 'La Zoen des Fôtes de Frape', 'Tenue Mal Orthographiée'],
  [30, 'The Fad-lands', n(1.5, 'Sx'), false, 182, 'Le Rayon des Modes Passées', 'Tenue Tendance'],
  [31, 'JRPGVille', n(8, 'Sx'), false, 190, 'La Quête Finale du Quai', 'Tenue Héroïque'],
  [32, 'The Exile', n(372, 'Sx'), true, 190, "[TITAN] L'Ancien Responsable Banni", 'Tenue Exil'],
  [33, 'The Rad-Lands', n(9.1, 'Sp'), false, 200, 'La Zone Radioactive (Périmés+++)', 'Tenue Radioactive'],
  [34, 'Back To School', n(1.7, 'Oc'), false, 125, 'La Rentrée des Bénévoles', 'Tenue Écolier'],
  [35, 'The West World', n(8, 'Oc'), false, 150, 'Le Far Quai', 'Tenue Cowboy'],
  [36, 'IT HUNGERS', n(130, 'Oc'), true, 175, '[TITAN] La Faim qui Dévore le Stock', 'Tenue Spatiale'],
  [37, 'The Breadverse', n(431, 'Oc'), false, 208, 'Le Monde du Pain Rassis', 'Tenue Boulangère'],
  [38, "That 70's Zone", n(1.5, 'No'), false, 216, 'Le Local Disco', 'Tenue Disco'],
  [39, 'The Halloweenies', n(3.2, 'No'), false, 224, 'Le Quai Hanté', 'Tenue Fantôme'],
  [40, 'ROCK LOBSTER', n(60, 'No'), true, 224, '[TITAN] Le Homard Rocker', 'Tenue Rock'],
  [41, 'Construction Zone', n(113, 'No'), false, 232, 'Le Chantier Éternel', 'Tenue Chantier'],
  [42, 'DUCK DUCK ZONE', n(350, 'No'), false, 240, 'La Zone des Canards Égarés', 'Tenue Canard'],
  [43, 'The Nether Regions', n(690, 'No'), false, 248, 'Les Contrées Voisines', 'Tenue Voisine'],
  [44, 'AMALGAMATE', n(5.6, 'Dc'), true, 248, "[TITAN] L'Amas de Tout Ce Qui Traîne", 'Tenue Amalgame'],
  [45, 'The Aethereal Sea', n(47.6, 'Dc'), false, 269, 'La Mer des Invendus', 'Tenue Marine'],
  [46, 'TIPPI THE TUTORIAL', n(40, 'Dc'), true, 295, '[TITAN] Tippi, la Souris du Tuto', 'Tenue Tippi'],
  [47, 'THE TRAITOR', n(128, 'Dc'), true, 300, '[TITAN] Le Traître du Quai', 'Tenue Traître']
];

const SOREAL_ZONE2_BASE = 2;
const SOREAL_ZONE47_TARGET = 250000;
const realZone2 = zones[0][2];
const realZone47 = zones[zones.length - 1][2];
const compressionFactor = Math.log(SOREAL_ZONE47_TARGET / SOREAL_ZONE2_BASE) / Math.log(realZone47 / realZone2);
function sorealValue(realValue) {
  const sorealLog = Math.log(SOREAL_ZONE2_BASE) + Math.log(realValue / realZone2) * compressionFactor;
  return Math.exp(sorealLog);
}

// Gold: same logarithmic compression, anchored on real Sewers normal-enemy gold (800-1000) -> SOREAL zone3 gold ~15-20,
// scaled to a target endgame gold-per-kill around 8,000-12,000 at zone 47 (SOREAL design choice, adjustable).
const GOLD_ZONE3_BASE = 15;
const GOLD_ZONE47_TARGET = 9000;
const realGoldZone3 = n(800, '');
// approximate real gold scaling as following the same relative curve as Power (no separate real gold table fully captured) -- use zone3's power ratio to zone47's power ratio as a stand-in, which keeps gold proportional to overall zone difficulty.
const goldCompression = Math.log(GOLD_ZONE47_TARGET / GOLD_ZONE3_BASE) / Math.log(zones[zones.length - 1][2] / zones[1][2]);
function sorealGold(realValueZone) {
  return Math.exp(Math.log(GOLD_ZONE3_BASE) + Math.log(realValueZone / zones[1][2]) * goldCompression);
}

const rows = zones.map(([num, realName, realPower, isTitan, unlockBoss, sorealName, setTheme]) => {
  const bp = sorealValue(realPower);
  const basePuissance = bp < 50 ? Math.round(bp * 10) / 10 : Math.round(bp);
  const goldMid = Math.round(sorealGold(realPower));
  const goldMin = Math.max(1, Math.round(goldMid * 0.85));
  const goldMax = Math.round(goldMid * 1.15);
  return { zone: num, realName, sorealName, unlockBoss, isTitan, basePuissance, goldMin, goldMax, setTheme };
});

writeFileSync(
  new URL('./soreal-zones-computed.json', import.meta.url),
  JSON.stringify(rows, null, 2)
);
console.log('wrote', rows.length, 'zones');
console.table(rows.map(r => ({ zone: r.zone, name: r.sorealName, bp: r.basePuissance, gold: `${r.goldMin}-${r.goldMax}`, titan: r.isTitan })));
