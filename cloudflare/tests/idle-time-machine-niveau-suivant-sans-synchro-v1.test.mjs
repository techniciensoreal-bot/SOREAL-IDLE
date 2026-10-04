import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « Quand j'ajoute de l'énergie à la barre Vitesse de la machine, la barre avance plus vite, mais une fois arrivée à la fin du niveau (0 s) ça n'est pas passé au niveau suivant ; j'ai dû ajouter de
 * l'énergie pour voir la barre reprendre là où elle était censée être. » À 0 s, le client passe au niveau suivant (N fois plus long que le niveau 1) et la barre repart du reste, sans attendre la synchro.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("      function actualiserCompteReboursTimeMachineIdleV1_(){");
const fin = ui.indexOf("      function patcherBarresTimeMachineIdleV1_(j){");
assert.ok(debut > 0 && fin > debut);
const source = ui.slice(debut, fin);

function lancer({ base, fill0, niveau, ecouleMs }) {
  const maintenant = 1_000_000;
  const barre = { dataset: { tmFill0: String(fill0) }, style: { width: "" } };
  const niveauEl = { textContent: "" };
  const piste = { querySelector: () => barre };
  const eta = {
    dataset: { tmEtaSeconds: String(base), tmEtaAt: String(maintenant - ecouleMs), tmEtaLast: "" },
    textContent: "",
    closest: () => piste,
    getAttribute: (n) => (n === "data-tm-eta-track" ? "vitesse" : null)
  };
  let syncs = 0;
  const idleEtat = { systemes: { systems: [{ id: "timeMachine", state: { data: { speedLevel: niveau, goldLevel: 0 } } }] } };
  const doc = { querySelectorAll: () => [eta], querySelector: (sel) => (sel.includes("data-tm-niveau") ? niveauEl : null) };
  const realNow = Date.now;
  Date.now = () => maintenant;
  try {
    const f = new Function("document", "idleEtat", "idleMenuActifV28", "idleNombre_", "idleEntier_", "formatGrandNombreIdleV70_", "formaterEtaTimeMachineIdleV1_", "synchroniserJeuIdleV7_",
      "let idleTmSyncNiveauV1=0;\n" + source + "\nreturn actualiserCompteReboursTimeMachineIdleV1_;")(doc, idleEtat, "machine", (v) => Number(v) || 0, (v) => Math.floor(Number(v) || 0), (v) => String(v), (s) => s.toFixed(2) + " s", () => { syncs += 1; });
    f();
  } finally { Date.now = realNow; }
  return { largeur: barre.style.width, niveau: niveauEl.textContent, texte: eta.textContent, syncs };
}

// Avant la fin du niveau : comportement habituel (aucun niveau franchi, aucune synchro).
{
  const r = lancer({ base: 10, fill0: 0.5, niveau: 4, ecouleMs: 2000 });
  assert.equal(r.niveau, "");
  assert.equal(r.syncs, 0);
  assert.equal(r.texte, "Fin de la barre dans 8.00 s");
  assert.equal(r.largeur, "60.00%"); // 0,5 + 2 s / 20 s de palier
}
// Fin du niveau dépassée : niveau suivant (palier x (N+2)/(N+1)), la barre repart du reste, une synchro est demandée.
{
  // palier du niveau 5 (speedLevel 4) = 10 / (1-0.5) = 20 s ; 12 s écoulées sur 10 restantes -> 2 s de reste dans le niveau suivant (24 s)
  const r = lancer({ base: 10, fill0: 0.5, niveau: 4, ecouleMs: 12000 });
  assert.equal(r.niveau, "5", "niveau affiché +1");
  assert.equal(r.syncs, 1, "synchro demandée tout de suite");
  assert.equal(r.texte, "Fin de la barre dans 22.00 s", "reste = 24 s de palier - 2 s déjà écoulées");
  assert.equal(r.largeur, "8.33%", "2 s / 24 s");
}
// Plusieurs niveaux d'un coup (longue absence de synchro).
{
  const r = lancer({ base: 1, fill0: 0, niveau: 0, ecouleMs: 60000 });
  assert.ok(Number(r.niveau) > 3, "plusieurs niveaux franchis : " + r.niveau);
}
console.log("idle-time-machine-niveau-suivant-sans-synchro-v1: OK");
