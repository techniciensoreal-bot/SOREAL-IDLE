import { readFileSync, writeFileSync } from 'node:fs';

// Adds the "rare" tier (unique flavor monster + named legendary drop) to
// zones 7-46, matching the hand-written pattern already live for zones 1-6
// (e.g. Z1_RARE "Le Gerbeur Fantome" -> "Pendentif du Gerbeur Fantome").
// This tier is a SOREAL-original mechanic (not present on the NGU wiki --
// confirmed by grep across ngu-wiki-reference/, no "legendary"/"rare enemy"
// hits), so there is nothing to wiki-verify here beyond keeping the numeric
// scale consistent with the already wiki-derived zone/boss/normal-monster
// stats already pushed.
//
// PV/Attaque: interpolated between the zone's normal and boss monster
// stats (already computed in idle-zones-full-v2.json), using the same
// interpolation fractions observed on live zones 1-6 (PV ~50% of the way
// from normal to boss, Attaque ~70% of the way -- zones 1-6 average 0.47
// and 0.69 respectively, rounded to clean constants here).
//
// BaseLegendaire: PuissanceRecommandee(z) * multiplier(z), multiplier
// rising smoothly from 0.7 (zone 1's real ratio) to a 3.0x plateau via
// 3 - 2.3*exp(-(z-1)/8) -- matches the live zone-1 ratio exactly and stays
// bounded at the high end instead of extrapolating the small 6-zone sample
// geometrically (which would blow up to absurd numbers by zone 46).

const zones = JSON.parse(readFileSync(new URL('./idle-zones-full-v2.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(zones.map(z => [z.ID, z]));

const PV_FRAC = 0.5;
const ATT_FRAC = 0.7;
function legendaryMultiplier(z) {
  return 3 - 2.3 * Math.exp(-(z - 1) / 8);
}

const SLOTS = ['tete', 'torse', 'bottes', 'arme', 'bijou1', 'bijou2'];

// Zone-by-zone creative content: unique rare monster + unique legendary
// item per zone, in the same dark-office/logistics humor voice as zones 1-6.
const CONTENT = {
  7: { nom: 'Le Boulanger de Minuit', emoji: '🌙', obj: 'Toque en Or du Petit Matin', desc: "Personne ne l'a jamais vu enfourner quoi que ce soit, mais l'odeur de pain chaud le trahit toujours avant qu'il n'attaque." },
  8: { nom: "L'Horloge Qui Recule", emoji: '⏰', obj: 'Plastron à Rouages Inversés', desc: "Chaque fois qu'on la regarde, elle affiche une heure différente, toujours fausse, jamais la même erreur deux fois." },
  9: { nom: 'La Racine Qui Compte les Heures', emoji: '🌳', obj: 'Bottes Racinées du Vieux Chêne', desc: "Elle pousse d'un centimètre à chaque pause café manquée, et personne ne sait qui l'arrose." },
  10: { nom: 'Le Carton Increvable', emoji: '📦', obj: 'Cutter Rouillé du Stock Mort', desc: "On l'a écrasé, plié, recyclé trois fois. Il revient toujours au même endroit du rayonnage." },
  11: { nom: 'La Toile Qui Chuchote', emoji: '🕸️', obj: 'Perle de Poussière Ancienne', desc: "Elle tisse dans le noir depuis si longtemps que certains jurent l'entendre parler entre deux courants d'air." },
  12: { nom: 'Le Stylo Qui Ne S\'arrête Jamais', emoji: '🖊️', obj: 'Gants du Comptable Halluciné', desc: "Il remplit des colonnes de chiffres qui ne correspondent à aucun inventaire connu, jour et nuit." },
  13: { nom: 'La Chose Miniature Qu\'on Ne Peut Pas Décrire', emoji: '🌀', obj: "Casque de l'Endroit Qui N'existe Pas", desc: "Elle ressemble un peu à un bac, un peu à un chariot, et surtout à rien qu'on ait déjà vu." },
  14: { nom: 'Le Chariot Fantôme du Méga-Rayon', emoji: '🛒', obj: 'Plastron du Roi Déchu de la Ramasse', desc: "Il traverse les allées à toute vitesse, toujours vide, toujours pressé, jamais rattrapé." },
  15: { nom: 'Le Glaçon Qui Se Souvient', emoji: '🧊', obj: 'Bottes du Conteneur Interdit', desc: "Personne n'a ouvert ce congélateur depuis des années. Le glaçon, lui, garde toute sa mémoire." },
  16: { nom: 'Le Sac Barbu Errant', emoji: '🧔', obj: "Pince à Sacs de l'Abomination", desc: "Il flotte entre les étagères en traînant une barbe faite de sacs plastiques noués depuis 2004." },
  17: { nom: 'La Palette Vagabonde', emoji: '🪵', obj: 'Anneau du Colosse du Dépôt', desc: "Elle ne reste jamais deux fois au même endroit, comme si elle cherchait activement à échapper à l'inventaire." },
  18: { nom: 'L\'Étiquette Qui Ment', emoji: '🏷️', obj: 'Gants Griffonnés du Maître des Palettes', desc: "Elle annonce toujours le mauvais contenu, le mauvais poids, et parfois la mauvaise date de péremption." },
  19: { nom: 'La Place Qui N\'existe Que la Nuit', emoji: '🅿️', obj: 'Casquette du Gardien de SOREAL', desc: "Elle apparaît toujours libre sur le plan, jamais dans la réalité du parking." },
  20: { nom: 'La Flaque Qui Suit', emoji: '🟢', obj: 'Plastron Gluant du Quai 12', desc: "Elle avance un peu plus près à chaque fois qu'on tourne le dos, sans jamais faire de bruit." },
  21: { nom: 'La Tablette Qui Fond Sans Raison', emoji: '🍫', obj: 'Bottes Chocolatées du Distributeur', desc: "Elle reste liquide même au grand froid de la chambre voisine, et personne n'ose la nettoyer." },
  22: { nom: 'L\'Ombre Qui a un Badge', emoji: '🕶️', obj: "Lampe Torche de l'Ascenseur Interdit", desc: "Elle porte un badge SOREAL parfaitement valide. Personne ne sait à quel nom il est enregistré." },
  23: { nom: 'La Peluche Qui Compte les Stocks', emoji: '🧸', obj: 'Couronne de la Licorne Comptable', desc: "Elle chuchote des chiffres d'inventaire toute la nuit, toujours faux de trois unités." },
  24: { nom: 'Le Deuxième Stagiaire', emoji: '🙋', obj: 'Gants Graisseux du Deuxième Stagiaire', desc: "Personne ne l'a engagé officiellement, mais il est là tous les matins, plus graisseux que le premier." },
  25: { nom: 'La Cellule Qui Se Recalcule Seule', emoji: '🔢', obj: 'Casque du Tableur Devenu Conscient', desc: "Elle change de valeur à chaque fois qu'on regarde ailleurs, et refuse obstinément de faire =SOMME()." },
  26: { nom: 'Le Confetti Qui Ne Retombe Jamais', emoji: '🎉', obj: 'Plastron à Paillettes du DJ Possédé', desc: "Il flotte depuis la dernière fête du personnel, en 2019, et personne n'ose l'attraper." },
  27: { nom: 'Le Costume Qui Surveille', emoji: '🕴️', obj: 'Bottes Vernies de la Marraine', desc: "Il est suspendu dans le vestiaire du quai depuis toujours. Personne ne se souvient à qui il appartenait." },
  28: { nom: 'La Faute D\'ortograffe Ambulante', emoji: '✏️', obj: 'Corectteur du Boss Que Presqno Ne Sait Pas Écrire', desc: "Elle change d'orthographe à chaque phrase et pourtant, tout le monde comprend toujours ce qu'elle veut dire." },
  29: { nom: 'Le Legging Qui Revient à la Mode', emoji: '👖', obj: "Bijou Vintage de l'Influenceur", desc: "Il disparaît des rayons puis revient six mois plus tard, présenté comme une nouveauté." },
  30: { nom: 'Le PNJ Qui a Enfin une Réplique', emoji: '🗨️', obj: 'Gantelet du Boss Final du Planning', desc: "Il ne dit qu'une seule phrase, toujours la même : « Le planning n'est pas encore figé »." },
  31: { nom: 'Le Badge Désactivé Qui Fonctionne Encore', emoji: '🪪', obj: "Casque de l'Ancien Responsable Banni", desc: "Il ouvre encore certaines portes que même les responsables actuels ne peuvent plus ouvrir." },
  32: { nom: 'Le Yaourt Qui Brille dans le Noir', emoji: '☢️', obj: 'Plastron Plombé du Frigo Mutant', desc: "Périmé depuis 2019, il n'a jamais moisi. Certains y voient un signe, d'autres une menace." },
  33: { nom: 'Le Cartable Qui Pèse Trop Lourd', emoji: '🎒', obj: 'Bottes de la Rentrée du Directeur Trop Strict', desc: "Personne ne sait ce qu'il contient, mais il faut être deux pour le soulever du sol." },
  34: { nom: 'Le Tumbleweed Qui Roule à Contre-Sens', emoji: '🌵', obj: 'Étoile de Shérif du Parking', desc: "Il traverse le parking dans le sens interdit depuis des mois, et aucun panneau ne semble l'arrêter." },
  35: { nom: 'Le Trou Noir du Rayon Frais', emoji: '🕳️', obj: 'Anneau de la Faim qui Dévore le Stock', desc: "Tout ce qui s'en approche disparaît sans bruit, y compris les inventaires qui tentaient de le compter." },
  36: { nom: 'La Baguette Qui Réfléchit Trop', emoji: '🥖', obj: 'Gants de Boulangère du Pain Conscient', desc: "Elle se pose des questions existentielles sur son propre rassissement depuis trois semaines." },
  37: { nom: 'La Boule à Facettes Qui Tourne Encore', emoji: '🪩', obj: "Casque à Paillettes du Vigile en Pattes d'Éph", desc: "Elle n'a plus d'ampoule depuis 2010, et pourtant elle continue de tourner, toute seule, dans le noir." },
  38: { nom: 'Le Colis Qui Revient Toujours', emoji: '📮', obj: 'Plastron du Fantôme du Dernier Inventaire', desc: "Il a été livré, renvoyé, re-livré, et personne ne se souvient qui l'a commandé à l'origine." },
  39: { nom: 'La Pince Qui Fait des Riffs', emoji: '🦞', obj: 'Bottes Cloutées du Homard Rocker', desc: "Elle joue de la guitare avec ses pinces, très mal, mais avec une conviction absolue." },
  40: { nom: 'Le Cône Qui Se Déplace Tout Seul', emoji: '🚧', obj: 'Marteau du Chantier Éternel', desc: "Il change d'allée chaque nuit, bloquant toujours un passage différent, sans jamais finir le chantier." },
  41: { nom: 'Le Canard Qui a Pris le Mauvais Camion', emoji: '🦆', obj: 'Bague du Canard Chef de Zone', desc: "Il erre depuis trois zones, cherchant désespérément un point d'eau qui n'existe pas dans un entrepôt." },
  42: { nom: 'Le Voisin Qui Se Plaint du Bruit', emoji: '📢', obj: 'Gants du Syndic Vengeur', desc: "Il dépose une réclamation écrite à chaque livraison, même les nuits où rien n'a été livré." },
  43: { nom: 'Le Petit Tas Qui Grossit', emoji: '🗑️', obj: "Casque de l'Amas de Tout Ce Qui Traîne", desc: "Il commence toujours petit, dans un coin, et double de volume à chaque fois qu'on l'ignore." },
  44: { nom: 'La Bouteille Qui Dérive Depuis des Mois', emoji: '🍾', obj: 'Plastron du Capitaine des Retours Client', desc: "Le message à l'intérieur est un bon de retour jamais traité, daté de l'année dernière." },
  45: { nom: 'La Souris Qui Connaît Toutes les Astuces', emoji: '🐭', obj: 'Bottes de Tippi, la Souris du Tuto', desc: "Elle apparaît encore parfois pour expliquer des fonctionnalités qui n'existent plus depuis longtemps." },
  46: { nom: 'L\'Ombre du Traître d\'Autrefois', emoji: '🗡️', obj: 'Lame du Traître du Quai', desc: "Personne ne sait de quel côté elle a vraiment tourné. Elle-même semble l'avoir oublié." }
};

const rows = [];
for (let id = 7; id <= 46; id++) {
  const z = byId[id];
  const c = CONTENT[id];
  const pv = Math.round(z.PVEnnemi + (z.PVBoss - z.PVEnnemi) * PV_FRAC);
  const att = Math.round(z.AttaqueEnnemi + (z.AttaqueBoss - z.AttaqueEnnemi) * ATT_FRAC);
  const baseLegendaire = Math.max(1, Math.round(z.PuissanceRecommandee * legendaryMultiplier(id) * 10) / 10);
  rows.push({
    ID: `Z${id}_RARE`,
    ZoneID: id,
    Type: 'rare',
    Nom: c.nom,
    Emoji: c.emoji,
    PV: pv,
    Attaque: att,
    ChanceRencontre: '0,003',
    ChanceLegendaire: '0,25',
    ObjetLegendaire: c.obj,
    SlotLegendaire: SLOTS[(id - 7) % 6],
    BaseLegendaire: baseLegendaire,
    Description: c.desc,
    Image: '',
    Actif: 'TRUE'
  });
}

writeFileSync(new URL('./idle-monstres-rare-7-46.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log('wrote', rows.length, 'rare monster rows (zones 7-46)');
