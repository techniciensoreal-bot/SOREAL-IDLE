import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  normaliserGuideV1, lireGuidesV1, enregistrerGuideV1, supprimerGuideV1, guidesPourJoueurV1,
  ancienTutorielActifV1, reglerAncienTutorielV1, ancienMenusActifV1, reglerAncienMenusV1, IDLE_TUTO_MAX_ETAPES_V1, IDLE_TUTORIEL_SEED_V1
} from "../src/idle-tutoriel-v1.js";

/*
 * Tutoriel éditable (Norman, 2026-10-14) : les guides vivent dans la base du serveur, l'administrateur les modifie depuis le menu Admin ; le joueur ne reçoit que le guide du déclencheur demandé.
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };

const etape = (extra) => Object.assign({ titre: "Ton énergie", texte: "Place de l'énergie ici.", menu: "entrainement", cible: { selecteur: "#sorealIdleTrainingInputV120", libelle: "Input" }, placement: "haut", surbrillance: true }, extra);
const guide = (extra) => Object.assign({ id: "g-energie", titre: "Énergie", declencheur: { type: "menu", menu: "entrainement" }, actif: true, ordre: 0, etapes: [etape()] }, extra);

// --- validation ---
{
  const g = normaliserGuideV1(guide());
  assert.deepEqual(g.declencheur, { type: "menu", menu: "entrainement" });
  assert.equal(g.vuId, "tuto:g-energie", "identifiant « vu » par défaut");
  assert.equal(g.etapes[0].placement, "haut");
  assert.equal(normaliserGuideV1(guide({ etapes: [etape({ placement: "n'importe" })] })).etapes[0].placement, "auto", "placement inconnu : automatique");
  assert.equal(normaliserGuideV1(guide({ etapes: [etape({ cible: { selecteur: "", libelle: "x" } })] })).etapes[0].cible, null, "sélecteur vide : pas de cible (fenêtre centrée)");
  assert.equal(normaliserGuideV1(guide({ etapes: [etape({ surbrillance: false })] })).etapes[0].surbrillance, false);
  assert.deepEqual(normaliserGuideV1(guide({ declencheur: { type: "debut" } })).declencheur, { type: "debut" });
  assert.deepEqual(normaliserGuideV1(guide({ declencheur: { type: "boss", boss: "17" } })).declencheur, { type: "boss", boss: 17 });
  for (const [mauvais, code] of [
    [{ id: "a b" }, /TUTO_ID_INVALIDE/], [{ titre: "  " }, /TUTO_TITRE_REQUIS/], [{ declencheur: { type: "autre" } }, /TUTO_DECLENCHEUR_INVALIDE/],
    [{ declencheur: { type: "menu", menu: "a b" } }, /TUTO_MENU_INVALIDE/], [{ declencheur: { type: "boss", boss: 0 } }, /TUTO_BOSS_INVALIDE/], [{ etapes: [] }, /TUTO_ETAPES_REQUISES/],
    [{ etapes: [etape({ texte: "", titre: "" })] }, /TUTO_ETAPES_VIDES/],
    [{ etapes: Array.from({ length: IDLE_TUTO_MAX_ETAPES_V1 + 1 }, () => etape()) }, /TUTO_TROP_D_ETAPES/],
    [{ etapes: [etape({ cible: { selecteur: "<script>alert(1)</script>", libelle: "x" } })] }, /TUTO_SELECTEUR_INVALIDE/],
    [{ etapes: [etape({ cible: { selecteur: "a{background:url(x)}", libelle: "x" } })] }, /TUTO_SELECTEUR_INVALIDE/],
    [{ etapes: [etape({ menu: "../x" })] }, /TUTO_MENU_INVALIDE/]
  ]) assert.throws(() => normaliserGuideV1(guide(mauvais)), code);
  assert.equal(normaliserGuideV1(guide({ etapes: [etape({ texte: "x".repeat(5000) })] })).etapes[0].texte.length, 1500, "texte borné");
}

// --- stockage ---
{
  /* Premier jet de Claude (graine) : cinq guides, TOUS désactivés, jamais servis aux joueurs tant que Norman ne les a pas activés. */
  const graine = lireGuidesV1(sql);
  assert.deepEqual(graine.map((g) => g.id).sort(), ["aventure", "bienvenue", "combat", "premier-boss", "renaissance"], "premier jet");
  assert.ok(graine.every((g) => g.actif === false), "tous désactivés au départ");
  assert.deepEqual(guidesPourJoueurV1(sql, { debut: true }), [], "rien n'est joué aux joueurs avant l'activation");
  assert.deepEqual(guidesPourJoueurV1(sql, { menu: "aventure" }), []);
  assert.deepEqual(guidesPourJoueurV1(sql, { boss: 1 }), []);
  assert.equal(IDLE_TUTORIEL_SEED_V1.length, 5);
  for (const g of IDLE_TUTORIEL_SEED_V1) normaliserGuideV1(g);
  for (const id of graine.map((g) => g.id)) supprimerGuideV1(sql, id);
  assert.deepEqual(lireGuidesV1(sql), [], "supprimer la graine ne la recrée pas");
  assert.equal(ancienTutorielActifV1(sql), true, "l'ancien tutoriel reste actif tant que l'administrateur ne dit rien");
  assert.equal(ancienMenusActifV1(sql), true, "les anciennes fenêtres des menus aussi");
  assert.equal(reglerAncienMenusV1(sql, false), false);
  assert.equal(ancienMenusActifV1(sql), false);
  assert.equal(ancienTutorielActifV1(sql), true, "les deux réglages sont indépendants");
  reglerAncienMenusV1(sql, true);
  const e1 = enregistrerGuideV1(sql, guide({ id: "b", titre: "B", ordre: 2 }), 1000);
  enregistrerGuideV1(sql, guide({ id: "a", titre: "A", ordre: 1, declencheur: { type: "debut" } }), 1000);
  enregistrerGuideV1(sql, guide({ id: "c", titre: "C", ordre: 3, actif: false, declencheur: { type: "boss", boss: 5 } }), 1000);
  assert.deepEqual(lireGuidesV1(sql).map((g) => g.id), ["a", "b", "c"], "triés par ordre");
  assert.equal(e1.maj, 1000);
  /* Modifier un guide ne change jamais son identifiant « vu » (ceux qui l'ont vu ne le revoient pas). */
  const vu = lireGuidesV1(sql).find((g) => g.id === "b").vuId;
  const modifie = enregistrerGuideV1(sql, guide({ id: "b", titre: "B renommé", ordre: 2, vuId: "tuto:autre" }), 2000);
  assert.equal(modifie.vuId, vu, "vuId conservé à la modification");
  assert.equal(lireGuidesV1(sql).find((g) => g.id === "b").titre, "B renommé");
  supprimerGuideV1(sql, "c");
  assert.deepEqual(lireGuidesV1(sql).map((g) => g.id), ["a", "b"]);
  assert.equal(reglerAncienTutorielV1(sql, false), false);
  assert.equal(ancienTutorielActifV1(sql), false);
  assert.equal(reglerAncienTutorielV1(sql, true), true);
  assert.equal(ancienTutorielActifV1(sql), true);
}

// --- ce que reçoit le joueur : jamais la liste complète (anti-spoil, AGENTS.md règle n°2) ---
{
  enregistrerGuideV1(sql, guide({ id: "ngu", titre: "NGU secret", declencheur: { type: "menu", menu: "ngu" }, etapes: [etape({ texte: "Texte du menu NGU" })] }), 3000);
  enregistrerGuideV1(sql, guide({ id: "off", titre: "Désactivé", actif: false, declencheur: { type: "menu", menu: "entrainement" } }), 3000);
  assert.deepEqual(guidesPourJoueurV1(sql, {}), [], "sans déclencheur : aucun guide");
  assert.deepEqual(guidesPourJoueurV1(sql, null), []);
  const entrainement = guidesPourJoueurV1(sql, { menu: "entrainement" });
  assert.deepEqual(entrainement.map((g) => g.id), ["b"], "seulement les guides ACTIFS du menu demandé");
  assert.ok(!JSON.stringify(guidesPourJoueurV1(sql, { menu: "entrainement" })).includes("Texte du menu NGU"), "le texte d'un autre menu ne sort jamais");
  assert.deepEqual(guidesPourJoueurV1(sql, { debut: true }).map((g) => g.id), ["a"]);
  assert.deepEqual(guidesPourJoueurV1(sql, { boss: 5 }), [], "guide de boss désactivé supprimé : rien");
  assert.deepEqual(guidesPourJoueurV1(sql, { menu: "inconnu" }), []);
  const donnee = entrainement[0];
  assert.deepEqual(Object.keys(donnee).sort(), ["declencheur", "etapes", "id", "titre", "vuId"], "ce dont la fenêtre a besoin, rien de plus");
}

// --- serveur : opérations, contrôle d'administrateur, contrat ---
{
  const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  for (const op of ["listerTutorielAdminSorealIdle", "enregistrerTutorielAdminSorealIdle", "supprimerTutorielAdminSorealIdle", "reglerAncienTutorielAdminSorealIdle"]) {
    const debut = rt.indexOf("function " + op + "(");
    assert.ok(debut > 0, op + " existe");
    assert.ok(rt.slice(debut, debut + 200).includes("exigerAdminHistoiresSorealIdle_(sessionToken)"), op + " refuse tout autre compte que l'administrateur");
  }
  const joueur = rt.slice(rt.indexOf("function obtenirTutorielSorealIdle("), rt.indexOf("function listerTutorielAdminSorealIdle("));
  assert.ok(joueur.includes("exigerAccesSorealIdle_(sessionToken)") && joueur.includes("guidesPourJoueurV1(__idleSql, ctx)"), "joueur : accès vérifié, un seul déclencheur");
  assert.ok(/atteint \+ 1\) return \{ ok: true, ancienActif, ancienMenusActif, guides: \[\] \}/.test(joueur), "guide de boss : seulement si le joueur a atteint ce boss");
  const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));
  for (const op of ["obtenirTutorielSorealIdle", "listerTutorielAdminSorealIdle", "enregistrerTutorielAdminSorealIdle", "supprimerTutorielAdminSorealIdle", "reglerAncienTutorielAdminSorealIdle"]) assert.ok(contrat.operations.includes(op), "contrat : " + op);
}

// --- client : moteur, éditeur, câblage ---
{
  const moteur = readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
  const editeur = readFileSync("cloudflare/public/modules/admin-tutoriel-v1.js", "utf8");
  const ui = lireUiComplet();
  const index = readFileSync("cloudflare/public/index.html", "utf8");
  assert.ok(moteur.includes("window.__SOREAL_IDLE_TUTORIEL_V1__={") && moteur.includes("choisirElement:choisirElement_") && moteur.includes("ancienPermis:function(){return etat.ancienActif===true;}"), "moteur exposé ; l'ancien tutoriel n'est jamais joué tant que le réglage est inconnu");
  assert.ok(moteur.includes("setInterval(function(){") && moteur.includes("considerer_(j)"), "vérification régulière (le rendu complet de la page n'a lieu qu'aux changements de menu)");
  assert.ok(moteur.includes("pointer-events:none") && !/#'\+ID\+'\{[^}]*pointer-events:none/.test(moteur), "la fenêtre est cliquable, le cadre lumineux laisse passer les clics (on peut cliquer sur l'élément montré)");
  assert.ok(moteur.includes("__soreal_idle_marquer_vu_v1__") && moteur.includes("opts.apercu") === false && moteur.includes("marquerVu:Boolean(o.marquerVu)&&!o.apercu"), "l'aperçu ne marque jamais un guide comme vu");
  assert.ok(moteur.includes("obtenirTutorielSorealIdle") && !moteur.includes("listerTutorielAdmin"), "le joueur n'appelle jamais la liste d'administration");
  for (const op of ["listerTutorielAdminSorealIdle", "enregistrerTutorielAdminSorealIdle", "supprimerTutorielAdminSorealIdle", "reglerAncienTutorielAdminSorealIdle"]) assert.ok(editeur.includes(op), "éditeur : " + op);
  assert.ok(editeur.includes("Placer sur l’écran") && editeur.includes("choisirElement()") && editeur.includes("Aperçu du guide") && editeur.includes("Voir cette étape"), "éditeur : placer sur l'écran, aperçu du guide et d'une étape");
  assert.ok(editeur.includes("background:#050810"), "panneau opaque");
  assert.ok(ui.includes("window.__SOREAL_IDLE_TUTORIEL_V1__.considerer(j)") && ui.includes("window.__SOREAL_IDLE_MENUS_LISTE_V1__=function()"), "jeu : moteur appelé, liste des menus fournie à l'éditeur");
  assert.equal((ui.match(/ancienTutorielPermisIdleV1_\(\)/g) || []).length >= 3, true, "ancien tutoriel : lanceur de pages et fenêtres de progression protégés (les popups de menu ont leur propre réglage)");
  assert.ok(ui.includes("function demarrerTutorielPagesIdleV1_(pages,cle){\n        if(!ancienTutorielPermisIdleV1_())return;") || ui.includes("function demarrerTutorielPagesIdleV1_(pages,cle){\r\n        if(!ancienTutorielPermisIdleV1_())return;"), "lanceur de pages de l'ancien tutoriel protégé");
  assert.ok(index.includes("/modules/tutoriel-v1.js") && index.includes("/modules/admin-tutoriel-v1.js"), "modules chargés par la page");
  assert.ok(readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8").includes("__SOREAL_IDLE_ADMIN_TUTORIEL_V1__.pageHtml()"), "section Tutoriel dans le menu Admin");
}
console.log("Tutoriel éditable: OK");

/* Premier jet : chaque repère d'écran cité existe encore dans l'interface (garde contre la dérive : si une classe disparaît, ce test le dit). */
{
  const { readdirSync } = await import("node:fs");
  const sources = [lireUiComplet(), ...readdirSync("cloudflare/public/modules").filter((f) => f.endsWith(".js")).map((f) => readFileSync("cloudflare/public/modules/" + f, "utf8"))].join("\n");
  const manquants = [];
  for (const g of IDLE_TUTORIEL_SEED_V1) for (const et of g.etapes) {
    assert.ok(et.texte.length <= 1500 && et.texte.length > 20, "texte de taille raisonnable : " + g.id);
    if (!et.cible) continue;
    for (const m of et.cible.selecteur.matchAll(/[#.]([A-Za-z][\w-]{3,})|\[(data-[\w-]+)/g)) {
      const jeton = m[1] || m[2];
      if (!sources.includes(jeton)) manquants.push(g.id + " : " + jeton);
    }
  }
  assert.deepEqual(manquants, [], "repères d'écran introuvables dans le jeu");
  /* Jamais de texte de spoil dans le premier jet : ni cadenas, ni « wiki », ni set secret. */
  const tout = JSON.stringify(IDLE_TUTORIEL_SEED_V1);
  assert.ok(!/🔒|wiki|verrouill|\?\?\?/i.test(tout), "premier jet sans spoil ni mention du wiki");
}

/* Deux réglages séparés pour les anciennes fenêtres. */
{
  const ui = lireUiComplet();
  assert.ok(ui.includes("function anciennesFenetresMenusPermisesIdleV1_()") && ui.includes("if(info&&anciennesFenetresMenusPermisesIdleV1_())"), "popups de menu : réglage « menus »");
  assert.ok(readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8").includes("ancienMenusPermis:function(){return etat.ancienMenus===true;}"), "le réglage des menus n'est jamais présumé actif pendant l'attente");
  const ed = readFileSync("cloudflare/public/modules/admin-tutoriel-v1.js", "utf8");
  assert.ok(ed.includes('data-at="ancienmenus"') && ed.includes("data-at=\"basculer\"") && ed.includes("function basculerGuide_(i)"), "éditeur : deux cases et bouton Activer / Désactiver");
}
console.log("Tutoriel éditable (premier jet, réglages): OK");

/* Étape « avance au clic » (Norman, 2026-10-14) : le guide avance quand le joueur clique sur l'élément montré. */
{
  const ok = normaliserGuideV1(guide({ etapes: [etape({ avanceAuClic: true })] }));
  assert.equal(ok.etapes[0].avanceAuClic, true, "conservé avec une cible");
  const sans = normaliserGuideV1(guide({ etapes: [etape({ avanceAuClic: true, cible: null })] }));
  assert.equal(sans.etapes[0].avanceAuClic, false, "sans cible, rien à cliquer : ignoré");
  assert.equal(normaliserGuideV1(guide({ etapes: [etape({})] })).etapes[0].avanceAuClic, false, "désactivé par défaut");
  const moteur = readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
  assert.ok(moteur.includes("var DELAI_SUIVANT_MS=30000;") && moteur.includes("s.attenteClic=Boolean(e.avanceAuClic&&e.cible&&e.cible.selecteur);"), "attente du clic, délai de 30 s");
  assert.ok(moteur.includes("cible.contains(ev.target)") && moteur.includes("},80);"), "un clic sur la cible fait avancer, après que le jeu a traité le clic");
  assert.ok(moteur.includes("(s.attenteClic?'hidden':'')") && moteur.includes("bs.hidden=false"), "le bouton Suivant est caché puis revient (jamais bloquant)");
  const editeur = readFileSync("cloudflare/public/modules/admin-tutoriel-v1.js", "utf8");
  assert.ok(editeur.includes('data-champ="avanceAuClic"') && editeur.includes("Passe à l’étape suivante quand le joueur clique sur l’élément montré"), "case dans l'éditeur");
}
console.log("Tutoriel éditable (avance au clic): OK");
