import assert from "node:assert/strict";
import { idleItopodSansDoublonsV1, idleItopodRosterV1 } from "../src/idle-itopod-roster-v1.js";
/* Norman (2026-11-21) : « supprime le Norman et le Sébastien en double dans l'ITOPOD, ceux qui ne sont pas liés à nos comptes principaux ». */
const noms = (l) => l.map((w) => w.nom);
{
  const liste = [{ nom: "Alexis" }, { nom: "Norman" }, { nom: "Redrum (Norman)" }, { nom: "Saka (Sébastien)" }, { nom: "Sébastien" }, { nom: "Dylan J." }];
  assert.deepEqual(noms(idleItopodSansDoublonsV1(liste)), ["Alexis", "Redrum (Norman)", "Saka (Sébastien)", "Dylan J."], "les prénoms seuls disparaissent quand le compte principal est là");
}
{
  /* sans libellé de compte, rien ne disparaît (jamais d'entrée retirée sans son double) ; casse et accents ignorés */
  assert.deepEqual(noms(idleItopodSansDoublonsV1([{ nom: "Norman" }, { nom: "Sébastien" }])), ["Norman", "Sébastien"]);
  assert.deepEqual(noms(idleItopodSansDoublonsV1([{ nom: "SEBASTIEN" }, { nom: "Saka (Sébastien)" }])), ["Saka (Sébastien)"]);
  assert.deepEqual(idleItopodSansDoublonsV1(null), []);
}
{
  /* chaîne réelle : les deux « toujours présents » du roster de base sont retirés dès que les comptes existent */
  const base = idleItopodRosterV1(null).concat([{ nom: "Redrum (Norman)", avatar: "" }, { nom: "Saka (Sébastien)", avatar: "" }]);
  assert.deepEqual(noms(idleItopodSansDoublonsV1(base)), ["Redrum (Norman)", "Saka (Sébastien)"]);
}
console.log("idle-itopod-sans-doublons-v1: OK");
