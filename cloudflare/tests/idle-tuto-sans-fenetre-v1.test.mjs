import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normaliserGuideV1 } from "../src/idle-tutoriel-v1.js";

/*
 * Norman (2026-10-27) : « pour le premier tuto, rien ne doit apparaître à l'écran : aucun texte, pas non plus la fenêtre rétrécie. Quand je crée le tuto, je dois pouvoir choisir si on doit cliquer sur l'endroit de la page que j'ai
 * désigné pour continuer l'étape (j'ai mis des zones à cliquer et il fallait cliquer sur Suivant). J'ai une case en le créant pour dire si oui ou non il apparaît à l'écran. »
 */
const brut = { id: "g1", titre: "T", declencheur: { type: "debut" }, etapes: [{ titre: "A", texte: "Texte", cible: { selecteur: "#x", libelle: "x" }, avanceAuClic: true }] };
assert.equal(normaliserGuideV1(brut).afficher, true, "par défaut le guide s'affiche");
assert.equal(normaliserGuideV1(Object.assign({}, brut, { afficher: false })).afficher, false, "la case « afficher » décochée est gardée");
assert.equal(normaliserGuideV1(brut).etapes[0].avanceAuClic, true);

const srv = readFileSync("cloudflare/src/idle-tutoriel-v1.js", "utf8");
assert.ok(srv.includes("afficher: g.afficher !== false, etapes: g.etapes"), "le joueur reçoit le réglage");

const moteur = readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
assert.ok(moteur.includes("s.cache=s.guide.afficher===false;") && moteur.includes("b.hidden=s.cache;"), "guide sans fenêtre : ni fenêtre, ni enceinte, ni texte");
assert.ok(moteur.includes("s.cache&&!s.attenteClic&&!voixParle_(s)&&Date.now()-s.debutEtape>=s.tempsLecture"), "sans clic demandé, l'étape finit quand la voix a fini");
assert.ok(moteur.includes("'#'+ID+'[hidden]{display:none}'"), "caché pour de bon");
// le verrou de clics (rien d'autre que la cible) reste actif sans fenêtre
assert.ok(moteur.includes("function clicRefuse_(ev)") && moteur.includes("s.attenteClic=Boolean(e.avanceAuClic&&e.cible&&e.cible.selecteur);"));

const admin = readFileSync("cloudflare/public/modules/admin-tutoriel-v1.js", "utf8");
assert.ok(admin.includes('data-g="afficher"') && admin.includes("Afficher la fenêtre et le texte à l’écran"), "case dans l'éditeur");
assert.ok(admin.includes("edition.afficher=af?af.checked:true;") && admin.includes("afficher:true,ordre:0"), "lue et enregistrée");
assert.ok(admin.includes("afficher:g.afficher!==false}"), "l'aperçu respecte la case");
assert.ok(admin.includes("e.cible={selecteur:res.selecteur,libelle:res.libelle};e.avanceAuClic=true;"), "placer une cible coche d'office « avance au clic »");
// case « attendre la fin de la phrase avant de cliquer » (Norman, 2026-10-27)
assert.equal(normaliserGuideV1(brut).etapes[0].attendreVoix, true, "par défaut : on attend la fin de la phrase");
assert.equal(normaliserGuideV1(Object.assign({}, brut, { etapes: [Object.assign({}, brut.etapes[0], { attendreVoix: false })] })).etapes[0].attendreVoix, false, "décochée : gardée");
assert.ok(moteur.includes("if(etapeCourante&&etapeCourante.attendreVoix===false)return false;"), "décochée : la cible se clique pendant la voix");
assert.ok(moteur.includes("!s.attenteClic&&!voixParle_(s)&&"), "sans fenêtre et sans clic, l'étape attend toujours la fin de la voix pour avancer seule");
assert.ok(admin.includes('data-champ="attendreVoix"') && admin.includes("Attendre la fin de la phrase avant de pouvoir cliquer") && admin.includes("e.attendreVoix=c('attendreVoix').checked;") && admin.includes("attendreVoix:e.attendreVoix!==false};}),afficher"), "case dans l'éditeur, lue, enregistrée, aperçue");
console.log("idle-tuto-sans-fenetre-v1: OK");
