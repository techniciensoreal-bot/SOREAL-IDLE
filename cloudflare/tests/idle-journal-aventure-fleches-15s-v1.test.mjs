// Norman (2026-11-01) : « scroller dans le journal de combat ne doit plus le faire remonter : il reste toujours en bas, sur la ligne la plus récente ; deux flèches (haut / bas) permettent de remonter ; après 15 secondes sans mouvement dans le journal il revient à sa position de base ;
// sur téléphone on ne peut plus le faire défiler avec le doigt. »
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const s = lire("cloudflare/public/modules/ui-aventure-1-v1.js");
const css = lire("cloudflare/public/soreal-idle-ui.css");
const titan = lire("cloudflare/public/modules/titans-combat-ecran-v1.js");
const mod = lire("cloudflare/public/modules/journal-fleches-v1.js");
const index = lire("cloudflare/public/index.html");

assert.ok(s.includes("const IDLE_ADVENTURE_LOG_RESUME_MS_V1=15000;"), "15 secondes");

// molette et doigt ne commandent plus le journal : seuls l'événement de défilement programmé et les flèches comptent
const a = s.indexOf("function attacherEcouteurScrollJournalAventureIdleV1_(host)");
const att = s.slice(a, a + 500);
assert.ok(att.includes("host.addEventListener('scroll',gererScrollJournalAventureIdleV1_,{passive:true})") && att.includes("installerFlechesJournalAventureIdleV1_(host)"), "écouteur de défilement + flèches");
assert.ok(!att.includes("'wheel'") && !att.includes("'touchstart'") && !att.includes("'pointerdown'"), "molette et doigt ne commandent plus le journal");

// le journal ne défile plus de lui-même sous la molette ni le doigt (la page, elle, défile)
const debut = css.indexOf(".soreal-idle-adventure-log-v1{");
assert.ok(css.slice(debut, debut + 500).includes("overflow-y:hidden"), "journal d'Aventure : overflow-y:hidden");
assert.ok(!/\.soreal-idle-adventure-log-v1\{[^}]*overflow-y:auto/.test(css), "aucun overflow-y:auto sur le journal");
assert.ok(titan.includes("overflow-y:hidden") && !/\.tcv-journal\{[^}]*overflow-y:auto/.test(titan), "écran de combat des titans : journal non défilant");

// les flèches (modules/journal-fleches-v1.js) : deux boutons, frères du journal, gardés par le morph, défilement doux
assert.ok(mod.includes('data-sens="-1"') && mod.includes('data-sens="1"') && mod.includes("data-morph-garder") && mod.includes("insertAdjacentElement('afterend',c)") && mod.includes("scrollBy({top:sens*pas,behavior:'smooth'})"), "deux flèches, frères du journal, data-morph-garder, défilement doux");
assert.ok(index.indexOf("journal-fleches-v1.js") > 0 && index.indexOf("journal-fleches-v1.js") < index.indexOf("ui-aventure-1-v1.js"), "module chargé avant ui-aventure-1");

// la flèche du haut fige la lecture ; chaque appui relance les 15 s ; le retour se fait tout en bas
const f = s.indexOf("function installerFlechesJournalAventureIdleV1_(host)");
assert.ok(s.slice(f, f + 600).includes("if(sens<0)idleAdventureLogAutoScrollV1_=false;armerRetourJournalAventureIdleV1_();"), "la flèche du haut fige la lecture et relance les 15 s");
const r = s.indexOf("function armerRetourJournalAventureIdleV1_()");
const arme = s.slice(r, r + 500);
assert.ok(arme.includes("clearTimeout(idleAdventureLogResumeTimerV1_)") && arme.includes("IDLE_ADVENTURE_LOG_RESUME_MS_V1") && arme.includes("hostActuel.scrollTop=hostActuel.scrollHeight"), "retour tout en bas après 15 s");
const i = s.indexOf("function gererScrollJournalAventureIdleV1_(event)");
assert.ok(s.slice(i, i + 1400).includes("if(enBas)clearTimeout(idleAdventureLogResumeTimerV1_);else if(direct)armerRetourJournalAventureIdleV1_();"), "minuterie relancée à chaque défilement voulu par le joueur (flèches) hors du bas ; un défilement du jeu ne coupe plus le suivi (idle-journal-aventure-suivi-v1)");

// style des flèches ; pas de flèches sur le voile du téléphone
assert.ok(css.includes(".soreal-idle-journal-fleches-v1{position:absolute") && titan.includes(".soreal-idle-journal-fleches-v1{display:none}"), "style des flèches ; pas de flèches sur le voile du téléphone");
console.log("idle-journal-aventure-fleches-15s-v1 : OK");
