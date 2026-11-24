import assert from "node:assert/strict";
import vm from "node:vm";
import zlib from "node:zlib";
import { readFileSync } from "node:fs";

/*
 * Décompresseur DEFLATE de secours (Norman, 2026-11-24 : « je ramasse des objets et je ne débloque pas d'AP sur téléphone »). DecompressionStream manque à certains navigateurs de téléphone : la lecture de la sauvegarde échouait en silence, donc aucun AP.
 * Ce test vérifie le décompresseur de secours contre zlib sur des données variées (texte répétitif, aléatoire incompressible = blocs stockés, niveaux de compression 1 à 9, gzip et zlib, plus de 32 Ko pour la fenêtre glissante, les vraies sauvegardes du jeu),
 * et que `decompresser` s'en sert quand DecompressionStream est ABSENT.
 */
const code = readFileSync("cloudflare/public/modules/scummvm-sauvegarde-v1.js", "utf8");
function charger(avecFlux) {
  const sb = { Blob, Response, Uint8Array, DataView, Int32Array };
  if (avecFlux) sb.DecompressionStream = DecompressionStream;
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(code, sb);
  return sb.__SOREAL_IDLE_SCUMMVM_SAVE_V1__;
}
const S = charger(true), SANS = charger(false);
assert.equal(typeof S.inflater, "function");

// données de test, reproductibles
let graine = 12345;
const alea = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine; };
const aleatoire = (n) => Buffer.from(Array.from({ length: n }, () => alea() & 255));
const texte = Buffer.from("Day of the Tentacle — Bernard, Hoagie et Laverne voyagent dans le temps. ".repeat(900));
const melange = Buffer.concat([texte, aleatoire(3000), Buffer.alloc(5000, 7), texte.subarray(0, 20000), aleatoire(40000)]);
const cas = [["vide", Buffer.alloc(0)], ["un octet", Buffer.from([42])], ["texte répétitif", texte], ["aléatoire", aleatoire(70000)], ["zéros", Buffer.alloc(100000)], ["mélange", melange]];
let n = 0;
for (const [nom, donnees] of cas) {
  for (const niveau of [0, 1, 6, 9]) {
    for (const [formatNom, comp] of [["gzip", (d) => zlib.gzipSync(d, { level: niveau })], ["zlib", (d) => zlib.deflateSync(d, { level: niveau })], ["fixe", (d) => zlib.gzipSync(d, { level: niveau, strategy: zlib.constants.Z_FIXED })]]) {
      const c = comp(donnees);
      const sortie = Buffer.from(S.inflater(new Uint8Array(c)));
      assert.ok(sortie.equals(donnees), `${nom} niveau ${niveau} ${formatNom} : sortie identique`);
      n += 1;
    }
  }
}
// vraies sauvegardes du jeu
for (const f of ["debut", "apres"]) {
  const brut = readFileSync(`cloudflare/tests/references/scummvm-tentacle-${f}-v1.bin`);
  const attendu = zlib.gunzipSync(brut);
  assert.ok(Buffer.from(S.inflater(new Uint8Array(brut))).equals(attendu), "sauvegarde " + f + " décompressée comme zlib");
}
// flux tronqué ou corrompu : erreur franche, jamais une sortie fausse
const bon = zlib.gzipSync(texte);
assert.throws(() => S.inflater(new Uint8Array(bon.subarray(0, 100))), /tronqué|invalide/);
assert.equal(S.inflater(new Uint8Array([1, 2, 3, 4])), null, "ni gzip ni zlib : null");

// sans DecompressionStream : decompresser() passe par le secours
const brut = readFileSync("cloudflare/tests/references/scummvm-tentacle-debut-v1.bin");
const viaSecours = await SANS.decompresser(new Uint8Array(brut));
assert.ok(viaSecours && Buffer.from(viaSecours).equals(zlib.gunzipSync(brut)), "sans DecompressionStream : la sauvegarde est lue quand même");
const lu = SANS.lire(viaSecours, SANS.PROFILS.tentacle);
assert.ok(lu && !lu.erreur, "et elle se lit entièrement (sans DecompressionStream)");
assert.equal(await SANS.decompresser(new Uint8Array([0, 0, 0])), null);

// le suivi montre pourquoi il ne marche pas (au lieu d'échouer en silence)
const progres = readFileSync("cloudflare/public/modules/scummvm-progres-v1.js", "utf8");
assert.ok(progres.includes("décompression impossible sur cet appareil") && progres.includes("aucune sauvegarde lue") && progres.includes("format de sauvegarde non reconnu"), "raisons d'échec du suivi");
const page = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
assert.ok(page.includes("Suivi des AP indisponible : "), "la page affiche la raison");
console.log("idle-scummvm-inflate-v1: OK (" + n + " décompressions comparées à zlib)");
