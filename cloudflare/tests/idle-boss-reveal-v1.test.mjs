import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-17) : à la première rencontre d'un boss en Evil, on voit l'ancienne image qui fond vers la 3D ; en Sadistic : image normale, fondu vers
 * l'image Evil, puis fondu final vers la photo Sadistic. Uniquement la première fois ; ensuite, toujours l'image du mode en cours.
 * Ce test couvre la logique pure du module (adresse, calendrier, mémoire « déjà vu ») ; l'animation elle-même se vérifie dans un navigateur.
 */
const src = readFileSync("cloudflare/public/modules/boss-reveal-v1.js", "utf8");

function charger(nomJoueur = "Alice") {
  const stock = new Map();
  const win = {
    localStorage: {
      getItem: (k) => (stock.has(k) ? stock.get(k) : null),
      setItem: (k, v) => stock.set(k, String(v)),
    },
    __SOREAL_IDLE_REG__: { idleEtat: { nom: nomJoueur } },
  };
  new Function("window", src)(win);
  return { api: win.__SOREAL_IDLE_BOSS_REVEAL_V1__, win, stock };
}

// --- adresse : seules les images Evil et Sadistic du combat sont concernées ---
{
  const { api } = charger();
  assert.deepEqual(api.analyserUrl("/api/idle/media/boss?id=9&difficulty=difficile"), { id: "9", difficulte: "difficile" });
  assert.deepEqual(api.analyserUrl("/api/idle/media/boss?id=301&difficulty=extreme"), { id: "301", difficulte: "extreme" });
  assert.equal(api.analyserUrl("/api/idle/media/boss?id=9"), null, "En normal, aucune révélation.");
  assert.equal(api.analyserUrl("/api/idle/media/boss?id=9&difficulty=normal"), null);
  assert.equal(api.analyserUrl(""), null);
  assert.equal(api.analyserUrl(null), null);
}

// --- calendrier : Evil = normal -> final ; Sadistic = normal -> Evil -> final, dans l'ordre ---
{
  const { api } = charger();
  const evil = api.calendrier("difficile");
  assert.deepEqual(evil.couches, ["normal"], "En Evil, seule l'image normale est montrée avant l'image finale.");
  assert.ok(evil.debutFinale > 0 && evil.duree > evil.debutFinale, "En Evil, la tenue de l'ancienne image précède le fondu final.");
  const sad = api.calendrier("extreme");
  assert.deepEqual(sad.couches, ["normal", "evil"], "En Sadistic : normal puis Evil avant la photo finale.");
  assert.ok(sad.debutEvil > 0 && sad.debutFinale > sad.debutEvil && sad.duree > sad.debutFinale, "En Sadistic, le fondu vers Evil précède le fondu final.");
  assert.ok(sad.duree > evil.duree, "La révélation Sadistic est plus longue que celle d'Evil.");
  assert.equal(api.calendrier("normal"), null);
  assert.equal(api.calendrier("extreme").couches.includes("extreme"), false);
  // adresses des calques : normal sans paramètre, Evil avec difficulty=difficile
  assert.equal(api.urlCouche("7", "normal"), "/api/idle/media/boss?id=7");
  assert.equal(api.urlCouche("7", "evil"), "/api/idle/media/boss?id=7&difficulty=difficile");
}

// --- mémoire : une seule révélation par boss, par difficulté et par joueur ---
{
  const { api, win, stock } = charger("Alice");
  assert.equal(api.dejaVu("difficile", 5), false, "Jamais rencontré : la révélation doit jouer.");
  api.marquerVu("difficile", 5);
  assert.equal(api.dejaVu("difficile", 5), true, "Rencontré : plus de révélation.");
  assert.equal(api.dejaVu("difficile", "5"), true, "Numéro texte ou entier : même boss.");
  assert.equal(api.dejaVu("extreme", 5), false, "Evil vu ne dispense pas de la révélation Sadistic.");
  assert.equal(api.dejaVu("difficile", 6), false, "Chaque boss a sa propre révélation.");
  api.marquerVu("difficile", 5);
  assert.equal(JSON.parse(stock.get("soreal_idle_boss_reveal_v1"))["Alice|difficile"].length, 1, "Pas de doublon dans la mémoire.");
  win.__SOREAL_IDLE_REG__.idleEtat.nom = "Bob";
  assert.equal(api.dejaVu("difficile", 5), false, "Un autre joueur sur le même appareil voit sa propre révélation.");
}

// --- robustesse : stockage indisponible ou corrompu ---
{
  const win = {
    localStorage: { getItem() { throw new Error("bloqué"); }, setItem() { throw new Error("bloqué"); } },
  };
  new Function("window", src)(win);
  const api = win.__SOREAL_IDLE_BOSS_REVEAL_V1__;
  assert.equal(api.dejaVu("difficile", 1), false, "Stockage bloqué : pas d'erreur.");
  assert.doesNotThrow(() => api.marquerVu("difficile", 1));
  const win2 = { localStorage: { getItem: () => "{pas du json", setItem() {} } };
  new Function("window", src)(win2);
  assert.equal(win2.__SOREAL_IDLE_BOSS_REVEAL_V1__.dejaVu("difficile", 1), false, "Mémoire corrompue : repart de zéro sans erreur.");
}

// --- le module doit viser le bloc de combat et ne rien lancer sans navigateur ---
assert.ok(src.includes("sorealIdleBossImageHostV36"), "Le module doit viser l'image du boss de combat.");
assert.equal(/setInterval/.test(src), false, "Pas de minuteur permanent : le module s'appuie sur un MutationObserver.");

console.log("idle-boss-reveal-v1: OK");
