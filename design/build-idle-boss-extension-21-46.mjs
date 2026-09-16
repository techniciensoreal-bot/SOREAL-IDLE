import { writeFileSync } from 'node:fs';

// Extends IDLE_BOSS from 20 to 46 entries, continuing the EXACT geometric
// growth rate observed in the last 5 existing bosses (16-20) rather than a
// fresh formula -- so boss 21 flows naturally from boss 20, not a jarring
// jump. PV/Attaque/XP/Pieces are NOT wiki numbers (this 46-entry boss
// ladder synced to zone names has no direct NGU equivalent -- confirmed,
// it's the pre-existing SOREAL boss-progression system), but continuing
// its own established real ratio is the correct move, same category as
// preserving zone-to-zone ratios elsewhere -- not something to invent from
// scratch or delete.
//
// The "capacites" system (regen/bouclier/paralysie/fureur/fracas/sceau)
// has been removed from the engine (idle-sqlite-runtime.js) as a
// SOREAL-original mechanic with zero NGU wiki basis, per Norman's decision
// to keep only SOREAL names and drop everything else non-wiki. This build
// no longer emits Capacite1-3/Intervalle1-3/Valeur1-3/Duree1-3. Conseil
// text that referenced a named capacite has been rewritten to generic
// combat flavor; Histoire/MortVivant (an unrelated, still-live Blood
// Magic spell-effectiveness tag, not part of the removed system) are
// untouched.
//
// Boss names taken from idle-zones-full-v2.json's own Boss field for
// zones 21-46 (already the accepted identity for these zones).

const RATIO = { PV: 1.33, Attaque: 1.18, XP: 1.31, Pieces: 1.18 };
const base20 = { PV: 3600000, Attaque: 390, XP: 19000, Pieces: 550 };

function statsFor(n) {
  const steps = n - 20;
  return {
    PV: Math.round(base20.PV * Math.pow(RATIO.PV, steps)),
    Attaque: Math.round(base20.Attaque * Math.pow(RATIO.Attaque, steps)),
    XP: Math.round(base20.XP * Math.pow(RATIO.XP, steps)),
    Pieces: Math.round(base20.Pieces * Math.pow(RATIO.Pieces, steps)),
    ChanceLoot: Math.min(0.65, Math.round((0.55 + steps * 0.004) * 100) / 100)
  };
}

// [id, nom, histoire, conseil, mortVivant]
const bosses = [
  [21, 'Le Distributeur Détraqué', "Le distributeur de confiseries du dépôt a fondu, recongelé, refondu tant de fois qu'il a fini par développer une conscience — et une vraie rancune contre quiconque appuie sur le bouton A3.", "Ses dégâts montent nettement en fin de combat : garde une marge de PV avant de foncer.", 'FALSE'],
  [22, "L'Ascenseur Qui Descend Trop Loin", "Il ne s'arrête plus au sous-sol. Personne ne sait ce qu'il y a en dessous du sous-sol, et l'ascenseur ne semble pas pressé de te laisser vérifier.", "Le combat dure : gère ton mana comme une descente longue, pas un sprint.", 'TRUE'],
  [23, 'La Licorne Comptable', "Elle tenait les comptes du rayon jouets avec une précision suspecte. Depuis qu'elle a découvert un écart de trois centimes, elle ne fait plus confiance à personne.", "C'est un combat de précision comptable : ne gâche aucune attaque, chaque écart se paie cher.", 'FALSE'],
  [24, 'Le Stagiaire Graisseux', "Titan. Personne ne l'a jamais vu manger, mais la graisse continue d'apparaître sur toutes les poignées qu'il touche. Il est là depuis plus longtemps que n'importe quel employé permanent.", "Titan : ses trois phases s'enchaînent vite, garde une réserve de PV pour la dernière.", 'TRUE'],
  [25, 'Le Tableur Devenu Conscient', "Une feuille Excel oubliée sur un vieux poste a fini par comprendre qu'elle comptait des palettes qui n'existaient plus. Elle a mal pris la nouvelle.", "Un combat qui use lentement tes ressources : dose ton effort sur la durée plutôt que de tout donner d'un coup.", 'FALSE'],
  [26, 'Le DJ Bénévole Possédé', "Il devait juste brancher une enceinte pour la fête du personnel. La musique n'a plus jamais vraiment cessé depuis, même quand la sono est débranchée.", "Ne traîne pas : plus le combat dure, plus la musique semble s'accélérer contre toi.", 'FALSE'],
  [27, 'La Marraine du Quai', "Titan. Personne ne sait qui l'a nommée, mais tout le monde sur le quai lui doit une faveur. Refuser de la rembourser est une très mauvaise idée.", "Titan aux trois phases : soigne-toi tôt, la fin de combat punit sévèrement les PV bas.", 'TRUE'],
  [28, 'Le Boss Que Presqno Ne Sait Pas Écrire', "Même son nom sur les fiches de paie change à chaque impression. Ce qui est sûr, c'est qu'il corrige tes fautes de frappe à coups de règle en métal.", "Ses dégâts sont irréguliers comme son orthographe : garde toujours une marge de PV.", 'FALSE'],
  [29, "L'Influenceur du Rayon Promo", "Il filme chaque réassort du rayon vêtements pour ses abonnés. Personne ne sait qui le suit, mais la caméra ne s'éteint jamais.", "Il filme tout pour ses abonnés : n'accorde aucune ouverture, il la publiera contre toi.", 'FALSE'],
  [30, 'Le Boss Final du Planning', "Le tout dernier créneau de la journée, jamais pourvu, jamais expliqué. Certains disent qu'il attend juste que quelqu'un ait enfin le courage de le cocher.", "Un combat d'endurance classique : garde des ressources pour la dernière ligne droite.", 'FALSE'],
  [31, "L'Ancien Responsable Banni", "Titan. Il a été mis à la porte pour une raison que plus personne ne se rappelle. Il revient chaque nuit vérifier que ses anciennes règles sont toujours respectées.", "Titan têtu : il connaît toutes tes anciennes techniques, varie ton approche pour le surprendre.", 'TRUE'],
  [32, 'Le Frigo Mutant', "Un yaourt oublié depuis 2019 a fini par prendre le contrôle du frigo entier. Sa date de péremption n'a plus aucun sens depuis longtemps.", "Le combat traîne en longueur : la patience et l'endurance comptent plus que la puissance brute.", 'TRUE'],
  [33, 'Le Directeur Trop Strict', "Il a instauré un uniforme obligatoire pour la rentrée des bénévoles, jusqu'aux chaussettes. Il vérifie personnellement chaque tenue à l'entrée.", "Il n'aime pas les retardataires : ne traîne pas trop longtemps en phase défensive.", 'FALSE'],
  [34, 'Le Shérif du Parking', "Il distribue des amendes pour des infractions qui n'existent nulle part ailleurs. Personne n'a jamais réussi à lire ce qui est écrit sur son étoile.", "Ses dégâts sacrés-mort-vivant sont efficaces ici, teste-les tôt.", 'TRUE'],
  [35, 'La Faim qui Dévore le Stock', "Titan. Rien ne reste jamais assez longtemps sur les étagères pour être compté. La Faim n'a pas de forme précise, juste un appétit sans fin.", "Titan agressif de bout en bout : priorise ta survie avant le DPS.", 'TRUE'],
  [36, 'Le Pain Qui a Trouvé Conscience', "Rassis depuis si longtemps qu'il a fini par comprendre le concept du temps. Il n'apprécie pas particulièrement ce qu'il en a compris.", "Ses dégâts sont irréguliers : une fenêtre s'ouvre régulièrement pour percer à fond.", 'FALSE'],
  [37, "Le Vigile en Pattes d'Éph", "Il garde la porte du Local Disco depuis une fête de fin d'année qui, techniquement, n'est jamais vraiment terminée.", "Son rythme de combat est régulier : anticipe-le pour ne pas te faire surprendre.", 'FALSE'],
  [38, "Le Fantôme du Dernier Inventaire", "Il compte encore, éternellement, des cartons qui ont quitté le dépôt il y a des années. Il n'accepte aucun écart, même après la mort.", "Mort-vivant sensible aux soins offensifs : privilégie ce type de dégâts.", 'TRUE'],
  [39, 'Le Homard Rocker', "Titan. Personne ne sait comment un crustacé a fini avec une guitare électrique, mais son solo est littéralement capable de fissurer du béton.", "Titan bruyant et sans répit : garde toujours une marge de PV confortable.", 'TRUE'],
  [40, 'Le Marteau-Piqueur Autonome', "Il continue de creuser un trou qui, techniquement, a déjà atteint sa profondeur maximale depuis longtemps. Personne n'a réussi à l'éteindre.", "Ses coups sont réguliers et prévisibles : synchronise tes défenses sur son rythme.", 'FALSE'],
  [41, 'Le Canard Chef de Zone', "Il dirige les autres canards égarés avec une autorité que personne n'ose contester. Son cri seul suffit à faire fuir les nouveaux employés.", "Il dirige le groupe : l'éliminer vite simplifie beaucoup le combat.", 'FALSE'],
  [42, 'Le Syndic Vengeur', "Il réclame des charges de copropriété pour un dépôt qui n'a jamais signé le moindre règlement. Ses lettres recommandées sont ses attaques les plus redoutées.", "Combat long et administratif : la gestion du mana prime sur la puissance brute.", 'FALSE'],
  [43, "L'Amas de Tout Ce Qui Traîne", "Titan. Tout objet jamais oublié quelque part dans SOREAL a fini par se coller ici. Il grossit un peu plus chaque jour, silencieusement.", "Titan tenace : la fenêtre pour souffler est courte, prépare tes soins à l'avance.", 'TRUE'],
  [44, 'Le Capitaine des Retours Client', "Il navigue sur une mer d'articles jamais réclamés, cherchant sans fin le propriétaire d'un colis parti il y a trois ans.", "Ses dégâts sacrés fonctionnent bien contre lui, il n'aime pas qu'on referme ses dossiers.", 'TRUE'],
  [45, 'Tippi, la Souris du Tuto', "Titan. Elle explique toujours les mêmes bases, encore et encore, même à ceux qui travaillent ici depuis dix ans. Elle refuse obstinément de conclure le tutoriel.", "Titan répétitif : son rythme de combat revient à intervalle fixe, mémorise le tempo.", 'FALSE'],
  [46, 'Le Traître du Quai', "Titan, dernier de la lignée connue. Il connaît chaque procédure, chaque raccourci, chaque faille — parce qu'il les a toutes écrites lui-même, avant de retourner sa veste.", "Titan final : les dernières phases du combat se chevauchent, garde ta plus grosse réserve de PV pour la toute fin.", 'TRUE']
];

const rows = bosses.map(([id, nom, histoire, conseil, mortVivant]) => {
  const stats = statsFor(id);
  return {
    ID: id,
    Nom: nom,
    PV: stats.PV,
    Attaque: stats.Attaque,
    XP: stats.XP,
    Pieces: stats.Pieces,
    ChanceLoot: stats.ChanceLoot,
    Image: '',
    Actif: 'TRUE',
    DriveFileID: '',
    Histoire: histoire,
    MortVivant: mortVivant,
    Conseil: conseil,
    NiveauRequis: id
  };
});

writeFileSync(new URL('./idle-boss-extension-21-46.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log('wrote', rows.length, 'bosses (21-46)');
