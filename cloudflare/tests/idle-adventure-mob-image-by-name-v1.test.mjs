import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { choisirCleMobR2_, choisirCleMobR2ParNom_ } from "../src/idle-media-v1.js";
import { IDLE_ADVENTURE_MOB_BESTIARY_V1 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-24) : « Créatures d'Aventure : je veux les vrais noms ; je changerai les images. » Les noms affichés sont DÉJÀ les vrais noms NGU
 * (bestiaire) et les fichiers R2 portent déjà les vrais noms (Adv_<id>_<nom>.png) — mais l'image était choisie par INDEX dans le dossier trié : un
 * boss « normal », un fichier absent ou en trop décalait le pool (« Fairy » affichait l'image de « Rat of Unusual Size »). L'image est maintenant
 * choisie par le NOM du mob quand un fichier du même nom existe ; sinon, ancien choix par index.
 */
const P = "idle/aventure/";
const forest = ["Adv_008_Skeleton", "Adv_009_Goblin", "Adv_010_Orc", "Adv_011_Slow_Zombie", "Adv_013_Ent", "Adv_014_Giant", "Adv_015_Rat_of_Unusual_Size", "Adv_017_Gorgon"].map((n) => P + "Forest/" + n + ".png");
const cave = ["Adv_018_Gorgonzola", "Adv_023_Limburger_Cheese", "Adv_024_Mega-Rat", "Adv_025_Robot", "Adv_026_A_fluffy_Chair", "Adv_037_A_Fifth_Giant_Mole"].map((n) => P + "Cave_of_Many_Things/" + n + ".png");
const badly = [P + "Badly_Drawn_World/Adv_114_Loss.png.png", P + "Badly_Drawn_World/Adv_112_No_Enemy().png"];

const nom = (keys, name) => (choisirCleMobR2ParNom_(keys, name) || "").split("/").pop();
assert.equal(nom(forest, "Skeleton"), "Adv_008_Skeleton.png");
assert.equal(nom(forest, "Rat of Unusual Size"), "Adv_015_Rat_of_Unusual_Size.png", "un boss dont le fichier n'est pas le plus grand id est trouvé quand même");
assert.equal(nom(forest, "Fairy"), "", "pas de fichier « Fairy » : pas d'image d'un AUTRE mob (repli par index)");
assert.equal(nom(cave, "Robot"), "Adv_025_Robot.png");
assert.equal(nom(cave, "Limburger Cheese"), "Adv_023_Limburger_Cheese.png");
assert.equal(nom(cave, "Mega-Rat"), "Adv_024_Mega-Rat.png");
assert.equal(nom(cave, "A fluffy Chair"), "Adv_026_A_fluffy_Chair.png");
assert.equal(nom(cave, "a FLUFFY chair"), "Adv_026_A_fluffy_Chair.png", "casse et ponctuation ignorées");
assert.equal(nom(badly, "Loss.png"), "Adv_114_Loss.png.png");
assert.equal(nom(badly, "No Enemy(?)"), "Adv_112_No_Enemy().png");
assert.equal(nom(cave, ""), "");
assert.equal(nom(cave, undefined), "");

// choisirCleMobR2_ : nom d'abord ; sans nom (ou sans fichier) : ancien comportement par index, inchangé
assert.equal(choisirCleMobR2_(cave, false, 3, "Robot").split("/").pop(), "Adv_025_Robot.png");
assert.equal(choisirCleMobR2_(cave, false, 0).split("/").pop(), choisirCleMobR2_(cave, false, 0, "").split("/").pop());
assert.ok(choisirCleMobR2_(forest, false, 6, "Fairy"), "repli par index : une image est toujours servie");

// Le nom transmis par le jeu est bien celui du bestiaire (vrais noms NGU)
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.forest.normal[6].name, "Fairy");
const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
assert.match(media, /url\.searchParams\.get\("seed"\),\s*url\.searchParams\.get\("name"\)/);
assert.match(readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8"), /p\.set\('name',String\(fight\.mobName\)\)/, "combat : image par nom");
assert.match(readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8"), /urlMobR2IdleV1_\(e\.zone,e\.boss,e\.index,e\.nom\)/, "Collection : image par nom");

console.log("idle-adventure-mob-image-by-name-v1 OK");
