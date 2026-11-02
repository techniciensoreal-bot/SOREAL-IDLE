// Norman (2026-11-02) : « reprends les descriptions des challenges du wiki ; pour l'anglais tu prends tel quel, en français tu traduis ».
// Source : https://ngu-idle.fandom.com/wiki/Challenges (rubrique « Challenge Description » de chaque défi, relue le 2026-11-02).
// L'anglais affiché est le texte du wiki MOT POUR MOT (coquilles comprises : « up to to », « of the of numbers »), sans la note de bas de page « [1] » ; le français est une traduction (clé du dictionnaire anglais).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const norm = (t) => t.split(String.fromCharCode(13)).join("");
const BS = String.fromCharCode(92);
const client = norm(readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8"));
const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));

// description française d'un défi : toutes les entrées `desc:{normal:'...',difficile:'...',extreme:'...'}` de challenges-v1.js, découpées en paragraphes
function descriptions(id) {
  const a = client.indexOf("\n  " + id + ":{\n    nom:");
  assert.ok(a > 0, "défi présent : " + id);
  const d0 = client.indexOf("\n    desc:{", a), d1 = client.indexOf("},\n    restriction:", d0);
  const corps = client.slice(d0 + "\n    desc:{".length, d1);
  const out = {};
  for (const m of corps.matchAll(/(normal|difficile|extreme):'((?:[^'\\]|\\.)*)'/g)) out[m[1]] = m[2].split(BS + "n" + BS + "n");
  return out;
}

const WIKI = {
  basic: { normal: ["A simple, basic challenge. Lose all of your Attack and Defense, and revert your NUMBER back to 1 and work your way from boss 1 back up to to boss 58! NOTE: this loss of NUMBER is permanent, but you'll regain NUMBER a lot faster than it took to get here in the first place, I promise. Nothing but your number is reset during this challenge, you keep all of your purchased EXP upgrades, NGU skills, Adventure stats etc."],
    difficile: ["Your number is reset to 1 and you must make your way back to boss 58 to complete the challenge. Nothing but your number is reset during this challenge, you keep all of your purchased EXP upgrades, NGU skills, Adventure stats etc."] },
  noAugmentations: { normal: ["No augs for you! Revert to a NUMBER of 1, and work your way back up as usual. However, the augmentations feature is entirely off-limits for the duration of this challenge!"] },
  twentyFourHours: { normal: ["Your NUMBER is reset to 1, and you have 24 hours of in-game time to reach the target boss! Each successful challenge raises the target boss for the next challenge."] },
  hundredLevels: { normal: ["Revert back to a NUMBER of 1 and work your way back up! Except, this time you have 100 levels you can gain at most from Augments, Blood Magic, Time Machine, Wandoos and Beards combined during each rebirth."] },
  noEquipment: { normal: ["Equipment helps you do everything better, so let's take that away from you."] },
  troll: { normal: ["You will fight me, 4G, as you climb up the bosses. Every so often I'm gonna mess with you in some way. Maybe I wipe all your augment progress. Maybe I disable Wandoos. Maybe I spam you with popups. But whatever I do, it'll be bad."] },
  noRebirth: { normal: ["Man, aren't rebirths fun?", "I hate fun.", "NO. REBIRTHS. EVER! Your number is reset to 1 and you must reach the target boss without ever rebirthing."] },
  laserSword: { normal: ["The augment guy Jensen wants a 2/2 Laser Sword Augmentation. Go make him one. Do that and he'll make your augmentations kick more ass. NOTE: YOU DO NOT HAVE ANYTHING RESET IN THIS CHALLENGE! It just performs a normal rebirth!"],
    difficile: ["The augment guy Jensen wants a 2/2 Laser Sword Augmentation. Go make him one. Do that and he'll make your augmentations kick more ass. NOTE: YOU DO NOT HAVE ANYTHING RESET IN THIS CHALLENGE! It just performs a normal rebirth!(No Number reset)"] },
  blind: { normal: ["You will revert back to a NUMBER of 1, and make the climb back up to the target boss. But, oh no! Most of the of numbers displayed in the game are invisible now! Are you properly training? Did you set up your augs correctly? Are you even rebirthing to a higher or lower NUMBER? Better hope you can remember."] },
  noNgu: { normal: ["These NGU's sure are powerful! Let's see how well you do without them."], difficile: ["You get no bonuses from NGU!"] },
  noTimeMachine: { normal: ["You're now poor. Good luck!"] }
};

let verifies = 0;
for (const [id, tiers] of Object.entries(WIKI)) {
  const fr = descriptions(id);
  for (const [palier, paragraphes] of Object.entries(tiers)) {
    assert.ok(fr[palier], `${id} / ${palier} : description présente`);
    assert.equal(fr[palier].length, paragraphes.length, `${id} / ${palier} : même nombre de paragraphes que le wiki`);
    paragraphes.forEach((en, i) => {
      assert.equal(dico[fr[palier][i]], en, `${id} / ${palier} / paragraphe ${i + 1} : l'anglais affiché est le texte du wiki, tel quel`);
      assert.ok(fr[palier][i] !== en && /[éèàùôîç’]|\b(le|la|les|tu|ton|ta|un|une)\b/i.test(fr[palier][i]), `${id} : le français est une traduction`);
      verifies += 1;
    });
  }
}
// Evil et Sadistic reprennent le texte Evil quand le wiki en donne un propre ; sinon celui du Normal (le wiki n'a qu'un texte)
for (const id of ["basic", "laserSword", "noNgu"]) {
  const fr = descriptions(id);
  assert.deepEqual(fr.extreme, fr.difficile, `${id} : Sadistic = Evil (mêmes textes sur le wiki)`);
}
assert.ok(client.includes("desc.split('" + BS + "n" + BS + "n').map(function(p){return '<p>'+h(p)+'</p>';}).join('')"), "un paragraphe par ligne vide (No Rebirth : trois paragraphes)");
assert.ok(!Object.values(dico).some((v) => /\[1\]/.test(v) && /Wandoos and Beards/.test(v)), "la note de bas de page « [1] » du wiki n'est pas recopiée");

console.log("idle-defis-descriptions-wiki-v1 : OK (" + verifies + " paragraphes)");
