// Norman (2026-11-02) : en anglais, « Listen » d'une carte de chronique lisait la VOIX FRANÇAISE : les champs « parlés » (surcharges d'administrateur en français) étaient envoyés tels quels
// et le client lit nomParle/histoireParlee à la place du texte affiché. En anglais ils sont retirés (le client lit l'original anglais) ; en français rien ne change.
import assert from "node:assert/strict";
import { traduireReponseV1 } from "../src/idle-traductions-v1.js";

const etat = {
  bossActuel: "Un Petit Bout de Peluche", bossHistoireParlee: "Texte parlé FR", bossNomParle: "Nom parlé FR",
  entrees: [{ numero: 1, nom: "Un Petit Bout de Peluche", histoireParlee: "x", nomParle: "y" }, { numero: 2, nom: "Caca Flottant", histoireParlee: "", nomParle: "" }],
};
const en = traduireReponseV1(etat, "en");
assert.equal(en.bossHistoireParlee, "", "état : texte parlé retiré en anglais");
assert.equal(en.bossNomParle, "", "état : nom parlé retiré en anglais");
assert.deepEqual(en.entrees.map((e) => [e.histoireParlee, e.nomParle]), [["", ""], ["", ""]], "collection : champs parlés retirés en anglais");
assert.equal(en.entrees[0].nom, "A Small Piece of Fluff", "le nom affiché reste traduit");
const fr = traduireReponseV1(etat, "fr");
assert.equal(fr.bossHistoireParlee, "Texte parlé FR", "français : inchangé");
assert.equal(fr.entrees[0].nomParle, "y", "français : inchangé");
assert.equal(etat.bossNomParle, "Nom parlé FR", "l'objet d'origine n'est jamais modifié");
console.log("idle-voix-anglais-sans-parle-fr-v1 : OK");

// Norman (2026-11-02) : en anglais, la carte sous la borne ne lisait que le titre : le lecteur lisait le texte de la carte (empreinte inconnue). L'attribut data-soreal-tts-say est maintenant toujours posé en anglais : nom + récit original.
{
  const fs = await import("node:fs");
  const src = fs.readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8").split(String.fromCharCode(13)).join("");
  assert.ok(src.includes("carteEnAnglais=window.localStorage.getItem('soreal_idle_langue_v1')==='en'") && src.includes("(histoireParlee||nomParle||carteEnAnglais||attrHistoireVoixIdleV1_(histoire))"), "carte de chronique : texte lu fixé en anglais");
  console.log("idle-voix-anglais-sans-parle-fr-v1 (carte sous la borne) : OK");
}
