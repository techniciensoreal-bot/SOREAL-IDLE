/*
 * Export des textes STATIQUES du jeu en anglais, pour voix-en-jeu-v1.py --categorie statiques.
 * Mode d'emploi : lancer le jeu en local (essai-local.mjs), passer le jeu en « English » (Réglages), recharger, ouvrir la console du navigateur, coller ce script,
 * puis copier le JSON affiche dans C:\Users\n0rma\soreal-voice-studio\voix-en-jeu\sources\statiques-en.json
 * Le script prend les MEMES blocs que le generateur francais (voice-generate.mjs : textes d'explication, nouveautes, systemes), les traduit avec le dictionnaire
 * anglais du jeu et marque d'un 1 les blocs ou du francais reste (a corriger dans le dictionnaire AVANT de voiser). Il faut remplacer SYSTEMES par la liste
 * {id,name,icon,kind} des systemes (IDLE_NGU_SYSTEMS) : voir voix-en-jeu-v1.py, en-tete.
 */
(function () {
  var SYSTEMES = window.__SYSTEMES_VOIX__ || [];
  var tts = window.__SOREAL_IDLE_TUTORIAL_TTS_V209__, tr = window.__SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__.traduire;
  var M = function (ms) { return " " + String.fromCharCode(0xe000) + ms + String.fromCharCode(0xe001) + " "; };
  var textes = ["Chroniques de boss." + M(1500)].concat(window.__sorealVoiceTextesIdleV1__(), window.__sorealVoiceTextesSystemesIdleV1__(SYSTEMES));
  var vus = {}, sortie = [];
  textes.forEach(function (t) {
    tts.planNarration(t).forEach(function (e) {
      if (e.chunk == null || vus[e.chunk]) return;
      vus[e.chunk] = 1;
      var en = tr(e.chunk);
      sortie.push([en, /[àâçéèêëîïôûùü]|\b(le|la|les|des|une|un|tu|ton|ta|tes|est|pas|que|qui|dans|pour|avec|sur|et|ou|de|du|ce|cette|vous|je|il|elle|nous)\b/i.test(en) ? 1 : 0]);
    });
  });
  console.log(JSON.stringify(sortie));
  return sortie.length;
})();
