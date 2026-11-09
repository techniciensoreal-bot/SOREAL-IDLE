import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

/*
 * T3 de l'audit de coherence du 2026-11-09 (AGENTS.md regle n°6) : toute cle `localStorage` doit etre rangee sous `soreal_idle_…` ou `sorealIdle…`
 * pour etre recopiee sur le compte par modules/prefs-compte-v1.js (qui ne suit QUE ce prefixe). Une cle hors prefixe reste sur l'appareil
 * sans que personne l'ait decide : ce test l'attrape.
 *
 * Analyse STATIQUE de tous les `.setItem(` de cloudflare/public/modules/*.js et de soreal-idle-ui.js (commentaires retires) :
 *   - premier argument = chaine litterale, ou constante (`const/var/let NOM='…'`, dans le meme fichier, sinon dans n'importe quel autre fichier
 *     scanne pour `REG.NOM`), eventuellement suivie de `+…` (seul le debut compte : c'est le prefixe) ;
 *   - la cle resolue doit commencer par un prefixe suivi, ou figurer dans EXCEPTIONS (justifiee ci-dessous) ;
 *   - les cles CALCULEES non resolues (parametre `cle`, appel de fonction, propriete…) sont comptees et listees dans le message d'echec ;
 *     leur nombre est une borne haute (CALCULEES_NON_RESOLUES_MAX) : le test echoue si elles AUGMENTENT. En ajouter une nouvelle = la
 *     rendre litterale ou constante, ou la verifier a la main puis relever la borne ici avec la raison.
 * Le test lit aussi la liste d'exclusion de prefs-compte-v1.js (EXCLUES) : une cle exclue doit rester sous le prefixe (sinon l'exclusion est
 * inutile) et chaque exclusion visee par une constante doit exister.
 */
const DOSSIER = "cloudflare/public/modules/";
const PREFIXES = ["soreal_idle_", "sorealIdle"];

/* Cles volontairement hors prefixe : (cle exacte ou prefixe, raison). */
const EXCEPTIONS = [
  { debut: "horsligne_soreal_jeton_v1", raison: "Jeton de l'application hors ligne : donnee d'appareil et secrete, ne doit jamais etre envoyee au compte." },
  { debut: "idle_apk_", raison: "Cles propres a l'application Android (adresse, jeton, etat de l'appareil) : par nature liees a l'appareil." },
];
const CALCULEES_NON_RESOLUES_MAX = 23; // valeur figee le 2026-11-09 (voir le message d'echec pour la liste) ; ne doit pas augmenter

function sansCommentaires(src) {
  let code = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { const f = src.indexOf("*/", i + 2); i = f < 0 ? n : f + 2; continue; }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") { j += 2; continue; }
        if (c !== "`" && src[j] === "\n") break;
        j++;
      }
      code += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    code += c;
    i++;
  }
  return code;
}

const fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith(".js")).map((f) => DOSSIER + f).concat(["cloudflare/public/soreal-idle-ui.js"]);
const codes = new Map(fichiers.map((f) => [f, sansCommentaires(readFileSync(f, "utf8"))]));

/* NOM = 'valeur' (const/var/let ou virgule de declaration, ou propriete d'objet NOM:'valeur'). */
function valeurConstante(nom, fichier, viaReg) {
  if (nom === "cle") return null; // parametre generique (une autre variable « cle » du fichier n'est pas la cle de stockage) : compte parmi les calculees
  const n = nom.replace(/\$/g, "\\$");
  // declaration locale : const/var/let NOM='…' ou NOM='…' apres une virgule de declaration (jamais un parametre par defaut)
  const local = new RegExp("(?:(?:const|var|let)\\s+|,\\s*)" + n + "\\s*=\\s*(['\"])([^'\"\\n]*)\\1");
  const l = codes.get(fichier).match(local);
  if (l) return l[2];
  if (!viaReg) return null;
  // REG.NOM : pose dans un autre fichier (REG.NOM=… ou NOM:'…' dans un objet de constantes)
  const ailleurs = new RegExp("(?:REG\\." + n + "|(?:const|var|let)\\s+" + n + "|[{,]\\s*" + n + "\\s*:)\\s*=?\\s*(['\"])([^'\"\\n]*)\\1");
  for (const [f, c] of codes) {
    const m = c.match(ailleurs);
    if (m) return m[2];
  }
  return null;
}

const suivi = (cle) => PREFIXES.some((p) => cle.startsWith(p));
const exception = (cle) => EXCEPTIONS.find((e) => cle.startsWith(e.debut));

const hors = [];
const calculees = [];
let total = 0;
let litterales = 0;
for (const [fichier, code] of codes) {
  for (const m of code.matchAll(/\.setItem\(\s*([^,)]*)/g)) {
    const arg = m[1].trim();
    if (!arg) continue;
    total++;
    let cle = null;
    const lit = arg.match(/^(['"`])([^'"`$]*)\1?/);
    if (lit && /^['"`]/.test(arg)) cle = lit[2];
    else {
      const ident = arg.match(/^(?:REG\.|window\.)?([A-Za-z_$][\w$]*)\s*(?:\+|$)/);
      if (ident) cle = valeurConstante(ident[1], fichier, /^REG\./.test(arg));
    }
    if (cle === null) { calculees.push(fichier.split("/").pop() + " : setItem(" + arg.slice(0, 60) + ")"); continue; }
    litterales++;
    if (!suivi(cle) && !exception(cle)) hors.push(fichier.split("/").pop() + " : « " + cle + " » (setItem(" + arg.slice(0, 40) + "))");
  }
}
assert.ok(total > 80, "le test voit bien les setItem (" + total + ")");
assert.ok(litterales > 40, "assez de cles resolues (" + litterales + ")");
assert.deepEqual(hors, [], "cle localStorage hors prefixe soreal_idle_/sorealIdle (non liee au compte, règle n°6) — la ranger sous soreal_idle_<nom>_v1 ou la justifier dans EXCEPTIONS :\n" + hors.join("\n"));
assert.ok(
  calculees.length <= CALCULEES_NON_RESOLUES_MAX,
  "clés calculées non vérifiables statiquement : " + calculees.length + " > " + CALCULEES_NON_RESOLUES_MAX + "\n" + calculees.join("\n"),
);

/* La liste d'exclusion lue dans prefs-compte-v1.js : chaque exclusion reste sous le prefixe suivi (sinon elle ne sert a rien). */
const prefs = readFileSync(DOSSIER + "prefs-compte-v1.js", "utf8");
const exclues = prefs.match(/var EXCLUES=\/\^\(([^)]*)\)\//);
assert.ok(exclues, "liste EXCLUES trouvee dans prefs-compte-v1.js");
const motifs = exclues[1].split("|");
assert.ok(motifs.length >= 10, "liste d'exclusion lisible");
for (const motif of motifs) assert.ok(suivi(motif), "exclusion hors prefixe (inutile) : " + motif);
/* Decision de Norman (2026-11-05) : volumes, sons, voix auto et effets sont propres a chaque appareil. */
for (const motif of ["soreal_idle_volume_", "soreal_idle_son_actif_", "soreal_idle_tutorial_tts_auto_", "soreal_idle_effet_", "soreal_idle_session_v1"]) {
  assert.ok(motifs.includes(motif), "exclusion attendue : " + motif);
}

console.log("idle-prefs-compte-cles-v1 OK (" + total + " setItem, " + litterales + " cles resolues, " + calculees.length + " calculees non resolues, " + motifs.length + " exclusions)");
