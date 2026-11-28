import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-28) : « vérifie les barres d'Augmentations et de Blood Magic ». Mesuré en ligne (partie B, moteur local) : chaque lot de 10 clics d'énergie sur une piste d'Augmentations
 * ramenait la barre EN ARRIÈRE de 0,19 à 0,21 de cycle (6 recalages sur 12 lots) : l'écran accélère la barre clic après clic, le moteur reçoit l'allocation finale d'un seul coup et sa
 * réponse est en retard ; animerBarreCycliqueIdleV217_ (partagée avec Blood Magic) recalait alors la phase par `currentTime = cible`. Un écart de moins de 40 % du cycle est maintenant
 * rattrapé par la vitesse de lecture ; seul un grand écart (niveau gagné, autre appareil) cale la barre d'un coup.
 */
const src = fs.readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
const i = src.indexOf("Recalage de phase : la barre tourne seule");
assert.ok(i > 0, "le recalage de phase existe");
const bloc = src.slice(i, i + 3500);
assert.ok(bloc.includes("const grand=Math.abs(ecart)>duration*0.4;"), "seul un grand écart cale la barre d'un coup");
assert.ok(bloc.includes("if(grand){anim.currentTime=cible;"), "le calage immédiat est réservé au grand écart");
assert.ok(bloc.includes("anim.playbackRate=vitesse"), "un petit écart est rattrapé par la vitesse de lecture");
assert.ok(bloc.includes("else if(anim.playbackRate!==1)anim.playbackRate=1;"), "la vitesse revient à 1 dès que l'écart est dans la tolérance");
assert.equal(bloc.split("anim.currentTime=cible").length - 1, 1, "un seul calage immédiat dans le recalage");
/* un autre endroit ne doit pas recaler cette barre en arrière : la seule autre écriture de currentTime est la création de l'animation (phase de départ) */
assert.equal(src.split("anim.currentTime=cible").length - 1, 1, "aucun autre recalage par currentTime = cible dans tout le fichier");
console.log("idle-aug-recalage-phase-doux-v1: OK");
