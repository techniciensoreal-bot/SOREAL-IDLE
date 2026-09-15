import { writeFileSync } from 'node:fs';

// Builds the complete 46-zone SOREAL IDLE progression from scratch (Norman,
// 2026-09-15 night: "tu dois repartir de 0 vu qu'elles n'ont certainement
// pas les bonnes données" -- discards/replaces the 6 zones that existed
// live before this pass too, not just adds new ones).
//
// basePuissance preserves the REAL wiki's zone-to-zone ratio (see
// ngu-wiki-reference/adventure-zones-master-table.md), log-compressed onto
// a manageable SOREAL range (zone1=10 -> zone46=150000). The other 8
// IDLE_ZONES columns (NiveauRequis, CoutEntree, PVEnnemi, AttaqueEnnemi,
// PVBoss, AttaqueBoss, Points, Pieces) use simple, clearly-stated formulas
// proportional to basePuissance or zone index -- all easy to retune by
// changing one constant and rerunning.

const SUFFIX = { '': 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21, Sp: 1e24, Oc: 1e27, No: 1e30, Dc: 1e33 };
const n = (v, s) => v * SUFFIX[s];

// SOREAL zone# (1-46) = real wiki zone# (2-47).
// [realWikiZone, realName, realPowerAnchor, isTitan, sorealName, setTheme, enemyName, bossName]
const zones = [
  [2, 'Tutorial Zone', n(13, ''), false, 'Quai de Réception', 'Tenue Bénévole', 'Carton Mal Fermé', 'Le Chariot Récalcitrant'],
  [3, 'Sewers', n(21, ''), false, 'Sous-sol des Encombrants', 'Tenue Encombrants', 'Frigo Qui Fuit', 'La Palette Infernale'],
  [4, 'Forest', n(53, ''), false, 'Réserve des Palettes Perdues', 'Tenue Forestière', 'Pile de Cagettes', 'Le Transpalette Sauvage'],
  [5, 'Cave of Many Things', n(200, ''), false, 'Cave à Denrées Périmées', 'Tenue Cave', 'Yaourt Explosif', 'Le Fromage Ambulant'],
  [6, 'The Sky', n(750, ''), false, "Quai d'Expédition Aérienne", 'Tenue Aérienne', 'Colis Volant', 'Le Camion sans Chauffeur'],
  [7, 'High Security Base', n(750, ''), false, 'Entrepôt Sécurisé', 'Tenue Sécurité', 'Vigile Trop Zélé', 'Le Digicode Vivant'],
  [8, 'Gordon Ramsay Bolton', n(2300, ''), true, '[TITAN] Le Chef Boulanger Furieux', 'Tenue Toque', '-', 'Le Chef Boulanger Furieux'],
  [9, 'Clock Dimension', n(4500, ''), false, 'Zone des Horaires Impossibles', 'Tenue Horlogère', 'Planning Contradictoire', "L'Horaire Qui Se Contredit"],
  [10, 'Grand Corrupted Tree', n(6000, ''), true, '[TITAN] Le Grand Chêne Périmé', 'Tenue Racines', '-', 'Le Grand Chêne Périmé'],
  [11, 'The 2D Universe', n(8000, ''), false, 'Rayonnage à Plat', 'Tenue Carton Plat', 'Carton Écrasé', 'Le Meuble IKEA Incompréhensible'],
  [12, 'Ancient Battlefield', n(17000, ''), false, 'Entrepôt Abandonné', 'Tenue Poussiéreuse', 'Toile d’Araignée Géante', "L'Inventaire Fantôme"],
  [13, 'Jake from Accounting', n(22000, ''), true, '[TITAN] Le Comptable Hanté', 'Tenue Bureau', '-', 'Le Comptable Hanté'],
  [14, 'A Very Strange Place', n(48000, ''), false, 'Le Quai Qui N’existe Pas', 'Tenue Improbable', 'Chose Indescriptible', 'Le Truc Qui Ne Devrait Pas Être Là'],
  [15, 'Mega Lands', n(265000, ''), false, 'Le Méga-Entrepôt', 'Tenue Méga', 'Rayonnage XXL', 'Le Monte-Charge Géant'],
  [16, 'UUG, The Unmentionable', n(600000, ''), true, '[TITAN] Le Congélateur Sans Nom', 'Tenue Givrée', '-', 'Le Congélateur Sans Nom'],
  [17, 'The Beardverse', n(3, 'M'), false, 'Le Local des Vieux Sacs', 'Tenue Barbue', 'Sac Plastique Barbu', 'Le Trieur de Vêtements Millénaire'],
  [18, 'Walderp', n(4, 'M'), true, '[TITAN] Le Palettiseur Fou', 'Tenue Vagabonde', '-', 'Le Palettiseur Fou'],
  [19, 'Badly Drawn World', n(45, 'M'), false, 'Zone Mal Étiquetée', 'Tenue Griffonnée', 'Étiquette Illisible', 'Le Formulaire Mal Rempli'],
  [20, 'Boring-Ass Earth', n(360, 'M'), false, 'Le Parking Sans Fin', 'Tenue Discrète', 'Place de Parking Fantôme', "L'Attente Interminable"],
  [21, 'The Beast', n(10, 'B'), true, '[TITAN] La Bête du Quai 12', 'Tenue Gluante', '-', 'La Bête du Quai 12'],
  [22, 'Chocolate World', n(150, 'B'), false, 'Le Rayon Confiserie Fondu', 'Tenue Chocolat', 'Tablette Fondue', 'Le Distributeur Détraqué'],
  [23, 'The Evilverse', n(24, 'T'), false, 'Le Sous-sol Maudit', 'Tenue Sombre', 'Ombre du Sous-sol', "L'Ascenseur Qui Descend Trop Loin"],
  [24, 'Pretty Pink Princess Land', n(130, 'T'), false, 'Le Rayon Jouets Roses', 'Tenue Princesse', 'Peluche Vengeresse', 'La Licorne Comptable'],
  [25, 'Greasy Nerd', n(6, 'Qa'), true, '[TITAN] Le Stagiaire Graisseux', 'Tenue Stagiaire', '-', 'Le Stagiaire Graisseux'],
  [26, 'Meta Land', n(45, 'Qa'), false, "L'Inventaire de l'Inventaire", 'Tenue Numérique', 'Ligne Excel Corrompue', 'Le Tableur Devenu Conscient'],
  [27, 'Interdimensional Party', n(480, 'Qa'), false, 'La Fête du Personnel Inter-Dimensions', 'Tenue Fête', 'Confetti Increvable', 'Le DJ Bénévole Possédé'],
  [28, 'The Godmother', n(39, 'Qi'), true, '[TITAN] La Marraine du Quai', 'Tenue Mafia', '-', 'La Marraine du Quai'],
  [29, 'Typo Zonw', n(370, 'Qi'), false, 'La Zoen des Fôtes de Frape', 'Tenue Mal Orthographiée', 'Corecteur Automqtique', 'Le Boss Que Presqno Ne Sait Pas Écrire'],
  [30, 'The Fad-lands', n(1.5, 'Sx'), false, 'Le Rayon des Modes Passées', 'Tenue Tendance', 'Legging Démodé', "L'Influenceur du Rayon Promo"],
  [31, 'JRPGVille', n(8, 'Sx'), false, 'La Quête Finale du Quai', 'Tenue Héroïque', 'PNJ Sans Réplique', 'Le Boss Final du Planning'],
  [32, 'The Exile', n(372, 'Sx'), true, "[TITAN] L'Ancien Responsable Banni", 'Tenue Exil', '-', "L'Ancien Responsable Banni"],
  [33, 'The Rad-Lands', n(9.1, 'Sp'), false, 'La Zone Radioactive (Périmés+++)', 'Tenue Radioactive', 'Yaourt Périmé Depuis 2019', 'Le Frigo Mutant'],
  [34, 'Back To School', n(1.7, 'Oc'), false, 'La Rentrée des Bénévoles', 'Tenue Écolier', 'Formulaire de Rentrée', 'Le Directeur Trop Strict'],
  [35, 'The West World', n(8, 'Oc'), false, 'Le Far Quai', 'Tenue Cowboy', 'Tumbleweed de Cartons', 'Le Shérif du Parking'],
  [36, 'IT HUNGERS', n(130, 'Oc'), true, '[TITAN] La Faim qui Dévore le Stock', 'Tenue Spatiale', '-', 'La Faim qui Dévore le Stock'],
  [37, 'The Breadverse', n(431, 'Oc'), false, 'Le Monde du Pain Rassis', 'Tenue Boulangère', 'Baguette Rassise', 'Le Pain Qui a Trouvé Conscience'],
  [38, "That 70's Zone", n(1.5, 'No'), false, 'Le Local Disco', 'Tenue Disco', 'Boule à Facettes Cassée', 'Le Vigile en Pattes d’Éph'],
  [39, 'The Halloweenies', n(3.2, 'No'), false, 'Le Quai Hanté', 'Tenue Fantôme', 'Colis Hanté', 'Le Fantôme du Dernier Inventaire'],
  [40, 'ROCK LOBSTER', n(60, 'No'), true, '[TITAN] Le Homard Rocker', 'Tenue Rock', '-', 'Le Homard Rocker'],
  [41, 'Construction Zone', n(113, 'No'), false, 'Le Chantier Éternel', 'Tenue Chantier', 'Cône de Chantier Baladeur', 'Le Marteau-Piqueur Autonome'],
  [42, 'DUCK DUCK ZONE', n(350, 'No'), false, 'La Zone des Canards Égarés', 'Tenue Canard', 'Canard Égaré', 'Le Canard Chef de Zone'],
  [43, 'The Nether Regions', n(690, 'No'), false, 'Les Contrées Voisines', 'Tenue Voisine', 'Voisin Curieux', 'Le Syndic Vengeur'],
  [44, 'AMALGAMATE', n(5.6, 'Dc'), true, "[TITAN] L'Amas de Tout Ce Qui Traîne", 'Tenue Amalgame', '-', "L'Amas de Tout Ce Qui Traîne"],
  [45, 'The Aethereal Sea', n(47.6, 'Dc'), false, 'La Mer des Invendus', 'Tenue Marine', 'Bouteille à la Mer (Invendue)', 'Le Capitaine des Retours Client'],
  [46, 'TIPPI THE TUTORIAL', n(40, 'Dc'), true, '[TITAN] Tippi, la Souris du Tuto', 'Tenue Tippi', '-', 'Tippi, la Souris du Tuto'],
  [47, 'THE TRAITOR', n(128, 'Dc'), true, '[TITAN] Le Traître du Quai', 'Tenue Traître', '-', 'Le Traître du Quai']
];

const P0 = 10, P_END = 150000;
const realZone1 = zones[0][2], realZoneEnd = zones[zones.length - 1][2];
const compression = Math.log(P_END / P0) / Math.log(realZoneEnd / realZone1);
function basePuissance(realValue) {
  return Math.exp(Math.log(P0) + Math.log(realValue / realZone1) * compression);
}

const emojiByTheme = {
  'Tenue Bénévole': '📦', 'Tenue Encombrants': '🧊', 'Tenue Forestière': '🪵', 'Tenue Cave': '🧀',
  'Tenue Aérienne': '✈️', 'Tenue Sécurité': '🔒', 'Tenue Toque': '🍳', 'Tenue Horlogère': '⏰',
  'Tenue Racines': '🌳', 'Tenue Carton Plat': '📦', 'Tenue Poussiéreuse': '🏚️', 'Tenue Bureau': '👔',
  'Tenue Improbable': '❓', 'Tenue Méga': '🏭', 'Tenue Givrée': '🥶', 'Tenue Barbue': '🧔',
  'Tenue Vagabonde': '🎒', 'Tenue Griffonnée': '✏️', 'Tenue Discrète': '🅿️', 'Tenue Gluante': '🟢',
  'Tenue Chocolat': '🍫', 'Tenue Sombre': '🕳️', 'Tenue Princesse': '🎀', 'Tenue Stagiaire': '🧴',
  'Tenue Numérique': '🔢', 'Tenue Fête': '🎉', 'Tenue Mafia': '🎩', 'Tenue Mal Orthographiée': '🔤',
  'Tenue Tendance': '👗', 'Tenue Héroïque': '⚔️', 'Tenue Exil': '🚪', 'Tenue Radioactive': '☢️',
  'Tenue Écolier': '🎒', 'Tenue Cowboy': '🤠', 'Tenue Spatiale': '🚀', 'Tenue Boulangère': '🥖',
  'Tenue Disco': '🕺', 'Tenue Fantôme': '👻', 'Tenue Rock': '🎸', 'Tenue Chantier': '🚧',
  'Tenue Canard': '🦆', 'Tenue Voisine': '🏘️', 'Tenue Amalgame': '🌀', 'Tenue Marine': '⚓',
  'Tenue Tippi': '🐭', 'Tenue Traître': '🗡️'
};

const zoneRows = zones.map(([realWikiZone, realName, realPower, isTitan, sorealName, setTheme, enemyName, bossName], idx) => {
  const zoneId = idx + 1;
  const bp = basePuissance(realPower);
  const puissance = bp < 50 ? Math.round(bp * 10) / 10 : Math.round(bp);
  return {
    ID: zoneId,
    Nom: sorealName,
    Emoji: emojiByTheme[setTheme] || '🗺️',
    Description: `Zone ${zoneId} du parcours SOREAL IDLE (progression fidèle au wiki NGU Idle, thème ${setTheme}).`,
    Ennemi: enemyName,
    Boss: bossName,
    NiveauRequis: zoneId * 2,
    PuissanceRecommandee: puissance,
    CoutEntree: Math.round(12 * Math.pow(1.35, zoneId - 1)),
    PVEnnemi: Math.max(1, Math.round(puissance * 40)),
    AttaqueEnnemi: Math.max(1, Math.round(puissance * 1)),
    PVBoss: Math.max(1, Math.round(puissance * 320)),
    AttaqueBoss: Math.max(1, Math.round(puissance * 8)),
    Points: Math.max(1, Math.round(2 + zoneId * 0.35)),
    Pieces: Math.max(1, Math.round(3 + zoneId * 0.55)),
    Image: '',
    Actif: 'TRUE',
    ImageName: '',
    DriveFileID: '',
    _setTheme: setTheme,
    _isTitan: isTitan,
    _realWikiZone: realWikiZone
  };
});

writeFileSync(new URL('./idle-zones-full-v2.json', import.meta.url), JSON.stringify(zoneRows, null, 2));
console.log('wrote', zoneRows.length, 'zones (1-' + zoneRows.length + ')');
