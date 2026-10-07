import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « Les boutons dans Augmentation et dans blood magic sont énormes. Je les
 * voulais comme dans basic training. [...] Je veux des sons différents pour le + et - de Time
 * machine et pareil pour Blood magic. Ca doit être en rapport avec le theme du menu. Décore la page
 * blood magic pour qu'elle ait l'air plus sanglante sans pour autant qu'elle soit toute rouge. »
 */
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

/*
 * --- 1. Boutons : taille strictement identique à Basic Training, pas une variante réduite. ---
 * Norman (2026-09-29, répété le même jour) : « J'ai demandé des boutons de la même taille que ceux
 * de Basic training pour + - et Cap. Ils sont toujours énormes dans Augmentations et Blood magic. »
 * Une variante .compact-v1 (30px/15px, plus petite que les 44px/22px de Basic Training) avait été
 * introduite ici -- jamais demandée, retirée : Augmentation et Blood Magic utilisent maintenant
 * exactement .soreal-idle-bt-actions-v120, sans aucun modificateur.
 */
{
  assert.ok(!css.includes("compact-v1"), "la variante de taille réduite ne doit plus exister dans la feuille de style");
  assert.ok(!meta.includes("compact-v1"), "ni être appliquée par le module (Augmentation/Blood Magic)");
  assert.match(meta, /class="soreal-idle-bt-actions-v120"[^>]*>'\+\[\['plus','\+'\],\['moins','−'\],\['max','Max'\]\]/, "Augmentation utilise la classe EXACTE de Basic Training");
  assert.ok(meta.includes('class="soreal-idle-bt-actions-v120" style="margin-top:9px"><button type="button" title="Placer la valeur de Input en Magic sur ce rituel (les autres rituels gardent la leur)" onclick="window.__ajusterRituelBloodMagicIdleV1__'), "Blood Magic aussi");
}

// --- 2. Sons thématiques : Time Machine (horloge) et Blood Magic (pouls grave) distincts de Basic Training. ---
{
  for (const cle of ["tmPlus", "tmMinus", "tmCap", "bloodPlus", "bloodMinus", "bloodCap"]) {
    assert.match(audio, new RegExp(cle + ":\\{group:\"bt-adjust\""), cle + " doit être déclaré dans DEFINITIONS (même famille de priorité que Basic Training)");
    assert.match(audio, new RegExp(cle + ":" + cle.replace(/Minus$/, "") + "(Moins_|_)"), cle + " doit être branché sur une fonction de synthèse dédiée");
    assert.match(audio, new RegExp(cle + ":function\\(\\)\\{return demander_\\(\"" + cle + "\"\\);\\}"), cle + " doit être exposé sur l'API publique");
  }
  // Les fonctions de synthèse existent réellement et ne sont pas de simples alias de btPlus/btMinus/btCap.
  assert.match(audio, /function tmPlus_\(\)\{/);
  assert.match(audio, /function tmMoins_\(\)\{/);
  assert.match(audio, /function tmCap_\(\)\{/);
  assert.match(audio, /function bloodPlus_\(\)\{/);
  assert.match(audio, /function bloodMoins_\(\)\{/);
  assert.match(audio, /function bloodCap_\(\)\{/);

  // Time Machine et Blood Magic appellent bien leurs propres sons, jamais ceux de Basic Training.
  assert.match(meta, /mode==='plus'\?'tmPlus':mode==='moins'\?'tmMinus':'tmCap'/, "ajusterTimeMachineIdleV1_ doit jouer ses propres sons");
  assert.match(meta, /mode==='plus'\?'bloodPlus':mode==='moins'\?'bloodMinus':'bloodCap'/, "ajusterBloodMagicIdleV1_ doit jouer ses propres sons");
  assert.match(meta, /if\(H\.jouerEffetAudioIdleV199_\)H\.jouerEffetAudioIdleV199_\('bloodMinus'\);/, "viderBloodMagicIdleV1_ (Tout retirer) doit aussi utiliser le thème Blood Magic");

  // Basic Training/Augmentation gardent leurs sons d'origine, jamais renommés par erreur.
  assert.match(readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8"), /action==='plus'\?'btPlus':action==='moins'\?'btMinus':'btCap'/);
  assert.match(meta, /mode==='plus'\?'btPlus':mode==='moins'\?'btMinus':'btCap'/, "Augmentation garde les sons Basic Training (jamais renommée)");
}

// --- 3. Thème visuel de Blood Magic : lie-de-vin sombre, jamais un aplat rouge. ---
{
  assert.match(meta, /return '<div class="soreal-idle-bloodmagic-v1">'\+/, "la page doit être enveloppée dans son propre conteneur thématique");
  assert.match(css, /\.soreal-idle-bloodmagic-v1\{/, "règle de thème introuvable dans le CSS");
  const debut = css.indexOf(".soreal-idle-bloodmagic-v1{");
  const fin = css.indexOf("}", debut);
  const regle = css.slice(debut, fin);
  assert.ok(!/#f00|#ff0000|red[^-]/i.test(regle), "jamais un rouge vif ni un mot-clé \"red\" -- une palette sombre et désaturée seulement");
  assert.match(regle, /background:/, "un fond dégradé propre à la page, pas un simple aplat");

  // Les gouttes décoratives et le liseré des cartes sont bien scopés à cette seule page.
  assert.match(css, /\.soreal-idle-bloodmagic-v1 \.soreal-idle-section-v8::before,/, "gouttes décoratives sur les cartes de rituel/sort");
  assert.match(css, /\.soreal-idle-bloodmagic-v1 \.soreal-idle-section-v8\{[\s\S]{0,200}?border-top:2px solid #6b1f2b;/, "liseré grenat en haut de carte");
  // Rien de tout ça ne doit fuiter vers Augmentation ou Basic Training (mêmes cartes .soreal-idle-section-v8 ailleurs).
  assert.ok(!/^\.soreal-idle-section-v8::before/m.test(css), "les gouttes ne doivent jamais s'appliquer à .soreal-idle-section-v8 hors de Blood Magic");
}

console.log("idle-meta-progression-polish-v1: OK");
