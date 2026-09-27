import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « J'aimerai que quand on clique en dehors du popup d'info le popup devienne tout petit
 * mais continue à joueur la voix. Si on reclique dessus, il reprend sa taille normale. Ca permettra de pouvoir
 * continuer à jouer tout en écoutant. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");

// --- La classe .reduit ne touche jamais display/visibility/opacity de la RACINE : tutorial-tts-v202.js (visible_)
//     ne doit jamais croire que le popup a disparu pendant que la narration continue. ---
{
  const i = ui.indexOf(".soreal-idle-tuto-flottant-v1.reduit{");
  assert.ok(i > 0, "règle .reduit introuvable");
  const bloc = ui.slice(i, ui.indexOf("}", i) + 1);
  assert.ok(!/display\s*:|visibility\s*:|opacity\s*:/.test(bloc), "la racine réduite ne doit jamais recevoir display/visibility/opacity");
  assert.match(bloc, /width:52px/);
  assert.match(bloc, /height:52px/);
  assert.match(ui, /\.soreal-idle-tuto-flottant-v1\.reduit \.soreal-idle-tuto-flottant-drag-v1,[\s\S]{0,400}display:none;/, "seul le CONTENU est masqué (pas la racine)");
}
assert.match(tts, /function visible_\(el\)\{[\s\S]{0,200}display!=='none'&&[\s\S]{0,40}visibility!=='hidden'&&[\s\S]{0,40}opacity/, "confirme ce que .reduit doit éviter de toucher");

// --- Comportement : extraction + exécution isolée de l'installateur ---
{
  const debut = ui.indexOf("let idleTutoFlottantReductionInstalleeV1=false;");
  const fin = ui.indexOf("function retirerChromeTutorielV1_(){", debut);
  assert.ok(debut > 0 && fin > debut, "bloc d'installation introuvable");
  const source = ui.slice(debut, fin);

  function fabriquerRoot() {
    const classes = new Set();
    return {
      id: "sorealIdleTutorielFlottantV1",
      classList: {
        contains: (c) => classes.has(c),
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c)
      },
      _classes: classes
    };
  }

  const ecouteurs = [];
  const root = fabriquerRoot();
  const document = {
    addEventListener(type, fn, options) { ecouteurs.push({ type, fn, options }); },
    getElementById: (id) => (id === root.id ? root : null)
  };
  const sandbox = { document };
  vm.runInNewContext(source + "\ninstallerReductionTutoFlottantV1_();", sandbox);

  assert.equal(ecouteurs.length, 1, "un seul écouteur global posé");
  assert.equal(ecouteurs[0].type, "click");
  const gestionnaire = ecouteurs[0].fn;

  const evenement = (dedans) => ({ target: { closest: (sel) => (sel === "#sorealIdleTutorielFlottantV1" && dedans ? {} : null) } });

  // Clic en dehors : le popup se réduit.
  gestionnaire(evenement(false));
  assert.ok(root.classList.contains("reduit"), "clic en dehors -> réduit");

  // Reclic DEDANS pendant qu'il est réduit : reprend sa taille normale.
  gestionnaire(evenement(true));
  assert.ok(!root.classList.contains("reduit"), "reclic dessus -> taille normale");

  // Un clic dedans alors qu'il n'est PAS réduit ne fait rien (les boutons internes gardent leur propre onclick).
  gestionnaire(evenement(true));
  assert.ok(!root.classList.contains("reduit"), "clic dedans sans être réduit : aucun effet, jamais un blocage des boutons internes");

  // Un appel répété n'installe jamais un second écouteur (pas de doublon à chaque rendu).
  vm.runInNewContext(source + "\ninstallerReductionTutoFlottantV1_();installerReductionTutoFlottantV1_();", { document });
}

// --- Câblage : posé à chaque rendu (idempotent) ; le changement de page rouvre le popup en taille normale ---
assert.match(ui, /root\.classList\.remove\('reduit'\);\/\* changer de page rouvre le popup en taille normale \*\//);
assert.match(ui, /installerReductionTutoFlottantV1_\(\);/);

console.log("idle-tuto-flottant-reduction-v1: OK");
