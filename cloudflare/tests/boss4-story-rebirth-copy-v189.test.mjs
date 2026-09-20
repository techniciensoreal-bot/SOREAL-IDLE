import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const runtime=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

const histoireSouris=
  "Alors que tu te tournes vers la sortie de cette 'pièce', tu remarques une petite souris marron. D'une voix stridente, elle couine : BIENVENUE dans SOREAL IDLE ! Moi c'est Tippy... Si t'es prê-' Sa petite voix de merde, te donne envie de lui péter la gueule... le besoin de vaincre CHAQUE ennemi sur ton chemin, quoi qu'il arrive. Tu peux commencer avec cette souris et arracher sa tête de con.";

assert.ok(
  runtime.includes(histoireSouris),
  "Le boss n°4 doit utiliser la nouvelle histoire Une petite souris."
);
assert.match(
  runtime,
  /histoire:\s*index===3[\s\S]{0,700}Tippy/,
  "L'histoire personnalisée doit être attachée au boss n°4 dans le catalogue commun Fight Boss/Collection."
);

const start=ui.indexOf("const TUTORIEL_AVENTURE_PAGES_V1=[");
const end=ui.indexOf("const TUTORIEL_PREMIER_BOSS_PAGES_V1=[",start);
assert.ok(start>=0&&end>start,"Bloc tutoriel Adventure/Rebirth introuvable.");
const tuto=ui.slice(start,end);

assert.ok(
  tuto.includes("Rebirth (une renaissance en français)"),
  "Le tutoriel doit expliquer le terme Rebirth."
);
assert.ok(
  !tuto.includes("Renaissance")&&!tuto.includes("RENAISSANCES"),
  "L'ancien terme Renaissance ne doit plus être utilisé seul dans ce tutoriel."
);
assert.ok(
  tuto.includes("Genre, beaucoup plus énorme que ce que t’as dans le pantalon. Hein ptite bite ! (Si t’es une femme, c’est valable pour toi aussi)"),
  "La nouvelle blague du NOMBRE doit être présente."
);
assert.ok(
  tuto.includes("Tu peux vérifier depuis combien de temps ton Rebirth est en cours dans la barre au-dessus."),
  "Le tutoriel doit renvoyer vers la barre au-dessus pour la durée du Rebirth."
);

console.log("Boss 4 story and Rebirth tutorial copy: OK");
