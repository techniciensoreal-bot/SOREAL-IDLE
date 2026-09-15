import { writeFileSync } from 'node:fs';

// Extends IDLE_BOSS from 20 to 46 entries, continuing the EXACT geometric
// growth rate observed in the last 5 existing bosses (16-20) rather than a
// fresh formula -- so boss 21 flows naturally from boss 20, not a jarring
// jump. Story/Conseil/Capacites written in the same voice as the existing
// 20 (SOREAL logistics-horror-comedy), one capacity set per boss reusing
// the same 6 named abilities already established (regen, bouclier,
// paralysie, fureur, fracas, sceau) -- no new mechanic invented.
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

// [id, nom, histoire, conseil, mortVivant, [cap1, int1, val1, dur1], [cap2,...], [cap3,...]]
const bosses = [
  [21, 'Le Distributeur Détraqué', "Le distributeur de confiseries du dépôt a fondu, recongelé, refondu tant de fois qu'il a fini par développer une conscience — et une vraie rancune contre quiconque appuie sur le bouton A3.", "Sa Fureur arrive vite : garde une marge de PV avant de foncer.", 'FALSE', ['fureur', 0, 85, 0], ['regen', 26, 0.3, 0], null],
  [22, "L'Ascenseur Qui Descend Trop Loin", "Il ne s'arrête plus au sous-sol. Personne ne sait ce qu'il y a en dessous du sous-sol, et l'ascenseur ne semble pas pressé de te laisser vérifier.", "Le combat dure : gère ton mana comme une descente longue, pas un sprint.", 'TRUE', ['paralysie', 22, 0, 2.5], ['regen', 24, 0.25, 0], null],
  [23, 'La Licorne Comptable', "Elle tenait les comptes du rayon jouets avec une précision suspecte. Depuis qu'elle a découvert un écart de trois centimes, elle ne fait plus confiance à personne.", "Son Bouclier tombe vite : enchaîne juste après pour ne pas le laisser se régénérer.", 'FALSE', ['bouclier', 20, 65, 6], ['fracas', 90, 40, 0], null],
  [24, 'Le Stagiaire Graisseux', "Titan. Personne ne l'a jamais vu manger, mais la graisse continue d'apparaître sur toutes les poignées qu'il touche. Il est là depuis plus longtemps que n'importe quel employé permanent.", "Titan : ses trois phases s'enchaînent vite, garde une réserve de PV pour la dernière.", 'TRUE', ['fureur', 0, 100, 0], ['paralysie', 20, 0, 3], ['regen', 22, 0.3, 0]],
  [25, 'Le Tableur Devenu Conscient', "Une feuille Excel oubliée sur un vieux poste a fini par comprendre qu'elle comptait des palettes qui n'existaient plus. Elle a mal pris la nouvelle.", "Attention à sa Barrière-Fracas combinée : ne dépense pas tout avant qu'elle tombe.", 'FALSE', ['bouclier', 18, 70, 6], ['fracas', 75, 42, 0], null],
  [26, 'Le DJ Bénévole Possédé', "Il devait juste brancher une enceinte pour la fête du personnel. La musique n'a plus jamais vraiment cessé depuis, même quand la sono est débranchée.", "Sa Fureur monte avec le rythme : ne prolonge pas le combat plus que nécessaire.", 'FALSE', ['fureur', 0, 95, 0], ['regen', 20, 0.28, 0], null],
  [27, 'La Marraine du Quai', "Titan. Personne ne sait qui l'a nommée, mais tout le monde sur le quai lui doit une faveur. Refuser de la rembourser est une très mauvaise idée.", "Titan aux trois phases : soigne-toi tôt, sa dernière capacité punit les PV bas.", 'TRUE', ['bouclier', 18, 75, 6], ['paralysie', 20, 0, 3], ['sceau', 0, 60, 0]],
  [28, 'Le Boss Que Presqno Ne Sait Pas Écrire', "Même son nom sur les fiches de paie change à chaque impression. Ce qui est sûr, c'est qu'il corrige tes fautes de frappe à coups de règle en métal.", "Ses dégâts sont irréguliers comme son orthographe : garde toujours une marge de PV.", 'FALSE', ['fracas', 70, 44, 0], ['regen', 18, 0.24, 0], null],
  [29, "L'Influenceur du Rayon Promo", "Il filme chaque réassort du rayon vêtements pour ses abonnés. Personne ne sait qui le suit, mais la caméra ne s'éteint jamais.", "Sa Barrière protège ses attaques suivantes : perce-la avant d'enchaîner tes gros sorts.", 'FALSE', ['bouclier', 20, 68, 6], ['fureur', 0, 90, 0], null],
  [30, 'Le Boss Final du Planning', "Le tout dernier créneau de la journée, jamais pourvu, jamais expliqué. Certains disent qu'il attend juste que quelqu'un ait enfin le courage de le cocher.", "Un combat d'endurance classique : ne gaspille rien avant sa phase de Fureur.", 'FALSE', ['regen', 20, 0.26, 0], ['fureur', 0, 100, 0], ['fracas', 65, 46, 0]],
  [31, "L'Ancien Responsable Banni", "Titan. Il a été mis à la porte pour une raison que plus personne ne se rappelle. Il revient chaque nuit vérifier que ses anciennes règles sont toujours respectées.", "Titan : son Sceau bloque tes meilleures attaques, il faut trouver comment le contourner.", 'TRUE', ['sceau', 0, 65, 0], ['bouclier', 18, 72, 6], ['paralysie', 18, 0, 3.2]],
  [32, 'Le Frigo Mutant', "Un yaourt oublié depuis 2019 a fini par prendre le contrôle du frigo entier. Sa date de péremption n'a plus aucun sens depuis longtemps.", "Régénération et poison combinés : le DPS pur ne suffit plus ici.", 'TRUE', ['regen', 16, 0.2, 0], ['paralysie', 18, 0, 3.5], null],
  [33, 'Le Directeur Trop Strict', "Il a instauré un uniforme obligatoire pour la rentrée des bénévoles, jusqu'aux chaussettes. Il vérifie personnellement chaque tenue à l'entrée.", "Sa Fureur punit les retards : ne traîne pas trop longtemps en phase défensive.", 'FALSE', ['fureur', 0, 105, 0], ['bouclier', 16, 76, 6], null],
  [34, 'Le Shérif du Parking', "Il distribue des amendes pour des infractions qui n'existent nulle part ailleurs. Personne n'a jamais réussi à lire ce qui est écrit sur son étoile.", "Ses dégâts sacrés-mort-vivant sont efficaces ici, teste-les tôt.", 'TRUE', ['fracas', 60, 48, 0], ['regen', 15, 0.18, 0], null],
  [35, 'La Faim qui Dévore le Stock', "Titan. Rien ne reste jamais assez longtemps sur les étagères pour être compté. La Faim n'a pas de forme précise, juste un appétit sans fin.", "Titan agressif : trois capacités actives en continu, priorise ta survie avant le DPS.", 'TRUE', ['fureur', 0, 110, 0], ['paralysie', 16, 0, 3.8], ['regen', 14, 0.16, 0]],
  [36, 'Le Pain Qui a Trouvé Conscience', "Rassis depuis si longtemps qu'il a fini par comprendre le concept du temps. Il n'apprécie pas particulièrement ce qu'il en a compris.", "Sa Barrière se recharge lentement : une fenêtre s'ouvre régulièrement pour percer à fond.", 'FALSE', ['bouclier', 16, 78, 6], ['fracas', 55, 50, 0], null],
  [37, "Le Vigile en Pattes d'Éph", "Il garde la porte du Local Disco depuis une fête de fin d'année qui, techniquement, n'est jamais vraiment terminée.", "Son rythme de Fureur est régulier : anticipe-le pour ne pas te faire surprendre.", 'FALSE', ['fureur', 0, 115, 0], ['regen', 14, 0.15, 0], null],
  [38, "Le Fantôme du Dernier Inventaire", "Il compte encore, éternellement, des cartons qui ont quitté le dépôt il y a des années. Il n'accepte aucun écart, même après la mort.", "Mort-vivant sensible aux soins offensifs : privilégie ce type de dégâts.", 'TRUE', ['paralysie', 15, 0, 4], ['regen', 13, 0.14, 0], null],
  [39, 'Le Homard Rocker', "Titan. Personne ne sait comment un crustacé a fini avec une guitare électrique, mais son solo est littéralement capable de fissurer du béton.", "Titan bruyant : sa Fureur et son Fracas s'enchaînent, garde toujours une marge de PV confortable.", 'TRUE', ['fureur', 0, 120, 0], ['fracas', 50, 52, 0], ['bouclier', 15, 80, 6]],
  [40, 'Le Marteau-Piqueur Autonome', "Il continue de creuser un trou qui, techniquement, a déjà atteint sa profondeur maximale depuis longtemps. Personne n'a réussi à l'éteindre.", "Ses coups sont réguliers et prévisibles : synchronise tes défenses sur son rythme.", 'FALSE', ['fracas', 45, 54, 0], ['regen', 12, 0.13, 0], null],
  [41, 'Le Canard Chef de Zone', "Il dirige les autres canards égarés avec une autorité que personne n'ose contester. Son cri seul suffit à faire fuir les nouveaux employés.", "Sa Barrière protège le groupe : élimine-la vite pour simplifier le combat.", 'FALSE', ['bouclier', 14, 82, 6], ['fureur', 0, 125, 0], null],
  [42, 'Le Syndic Vengeur', "Il réclame des charges de copropriété pour un dépôt qui n'a jamais signé le moindre règlement. Ses lettres recommandées sont ses attaques les plus redoutées.", "Combat long et administratif : la gestion du mana prime sur la puissance brute.", 'FALSE', ['regen', 12, 0.12, 0], ['paralysie', 14, 0, 4.2], null],
  [43, "L'Amas de Tout Ce Qui Traîne", "Titan. Tout objet jamais oublié quelque part dans SOREAL a fini par se coller ici. Il grossit un peu plus chaque jour, silencieusement.", "Titan tricapacité : la fenêtre entre ses trois attaques est courte, prépare tes soins à l'avance.", 'TRUE', ['bouclier', 14, 85, 7], ['paralysie', 13, 0, 4.5], ['fracas', 42, 56, 0]],
  [44, 'Le Capitaine des Retours Client', "Il navigue sur une mer d'articles jamais réclamés, cherchant sans fin le propriétaire d'un colis parti il y a trois ans.", "Ses dégâts sacrés fonctionnent bien contre lui, il n'aime pas qu'on referme ses dossiers.", 'TRUE', ['fureur', 0, 130, 0], ['regen', 11, 0.11, 0], null],
  [45, 'Tippi, la Souris du Tuto', "Titan. Elle explique toujours les mêmes bases, encore et encore, même à ceux qui travaillent ici depuis dix ans. Elle refuse obstinément de conclure le tutoriel.", "Titan répétitif : ses capacités reviennent à intervalle fixe, mémorise le tempo.", 'FALSE', ['paralysie', 12, 0, 5], ['bouclier', 12, 88, 7], ['fracas', 38, 58, 0]],
  [46, 'Le Traître du Quai', "Titan, dernier de la lignée connue. Il connaît chaque procédure, chaque raccourci, chaque faille — parce qu'il les a toutes écrites lui-même, avant de retourner sa veste.", "Titan final : les trois capacités se chevauchent en fin de combat, garde ta plus grosse réserve de PV pour la toute fin.", 'TRUE', ['fureur', 0, 140, 0], ['sceau', 0, 75, 0], ['regen', 10, 0.1, 0]]
];

const rows = bosses.map(([id, nom, histoire, conseil, mortVivant, cap1, cap2, cap3]) => {
  const stats = statsFor(id);
  const caps = [cap1, cap2, cap3].map(c => c || ['', '', '', '']);
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
    Capacite1: caps[0][0], Intervalle1: caps[0][1], Valeur1: caps[0][2], Duree1: caps[0][3],
    Capacite2: caps[1][0], Intervalle2: caps[1][1], Valeur2: caps[1][2], Duree2: caps[1][3],
    Capacite3: caps[2][0], Intervalle3: caps[2][1], Valeur3: caps[2][2], Duree3: caps[2][3],
    Histoire: histoire,
    MortVivant: mortVivant,
    Conseil: conseil,
    NiveauRequis: id
  };
});

writeFileSync(new URL('./idle-boss-extension-21-46.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log('wrote', rows.length, 'bosses (21-46)');
