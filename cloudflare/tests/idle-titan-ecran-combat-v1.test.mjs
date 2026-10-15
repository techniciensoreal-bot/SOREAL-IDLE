import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : écran spécial pour le combat de titan (tout sur un écran, sans défilement : image du titan, PV du joueur et du titan, attaques manuelles), on reste dans l'écran Titans ; cliquer sur Aventure arrête le combat (Zone sûre) ; popup « fais de la place dans l'inventaire » avant d'affronter. */
const ecran = readFileSync("cloudflare/public/modules/titans-combat-ecran-v1.js", "utf8");
const titans = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8").replace(/\r\n/g, "\n");
const index = readFileSync("cloudflare/public/index.html", "utf8");
const journal = readFileSync("cloudflare/public/modules/journal-attaques-v1.js", "utf8");

assert.ok(/<script defer src="\/modules\/titans-combat-ecran-v1\.js\?v=\d+"><\/script>/.test(index) && index.indexOf("/modules/titans-combat-ecran-v1.js") > index.indexOf("/modules/titans-v1.js"), "module chargé après la page des titans");
// plein écran, aucun défilement
assert.ok(ecran.includes("position:fixed;left:var(--tcv-left,0px);right:var(--tcv-right,0px);bottom:0;top:var(--tcv-top,0px);z-index:70;") && ecran.includes("overflow:hidden") && ecran.includes("body.tcv-actif{overflow:hidden}"), "écran fixe, sans défilement, page derrière verrouillée");
// mêmes id que la scène d'Aventure : le tick y écrit déjà les PV
for (const id of ["sorealIdleAdventureFightBarV1", "sorealIdleAdventureFightPvV1", "sorealIdleAdventureJoueurBarV1", "soreal-idle-adventure-player-pv-label-v1"]) assert.ok(ecran.includes(id), "barre de vie réutilisée : " + id);
assert.ok(ecran.includes("window.__rendreCommandesAdventureIdleV3__") && ui.includes("window.__rendreCommandesAdventureIdleV3__=function(){return rendreCommandesAdventureIdleV3_();};"), "attaques manuelles de l'Aventure réutilisées");
assert.ok(ecran.includes("setInterval(suivre,250)") && ecran.includes("if(f&&surPageTitans())afficher(f);else masquer();"), "l'écran apparaît tant qu'un combat de titan est actif, sur la page Aventure/Titans");
// on ne passe plus par l'Aventure pour combattre
const lancer = titans.slice(titans.indexOf("function lancerCombatTitan_(id){"), titans.indexOf("function lancerCombatTitan_(id){") + 1500);
assert.ok(lancer.includes("startTitanFight") && !lancer.includes("__vueAventureIdleV1__"), "plus de bascule vers la vue Aventure au lancement du combat");
// popup avant le combat
assert.ok(titans.includes("function demanderPlace_(t,suite){") && titans.includes("demanderPlace_(t,function(){lancerCombatTitan_(id);});"), "le combat ne part qu'après le popup");
assert.ok(/Libère de la place dans ton inventaire[^']*butin de/.test(titans) && titans.includes("Prépare ton sac !"), "texte du popup");
// Aventure arrête le combat de titan et laisse en Zone sûre
assert.ok(ui.includes("function arreterCombatTitanIdleV1_(){") && ui.includes("selectionnerZoneAdventureIdleV47_('safe');") && ui.includes("window.__arreterCombatTitanV1__=arreterCombatTitanIdleV1_;"), "arrêt du combat de titan = Zone sûre");
const menu = ui.slice(ui.indexOf("function menuIdleV28_(menu){"), ui.indexOf("function menuIdleV28_(menu){") + 6000);
assert.ok(menu.indexOf("arreterCombatTitanIdleV1_()") > 0 && menu.indexOf("arreterCombatTitanIdleV1_()") < menu.indexOf("Reclic sur le menu où l'on se trouve déjà"), "le clic sur Aventure arrête le combat avant même le test du reclic");
// Mises à jour du 2026-10-13 : boutons Aventure / Titans de la page conservés, police et couleur par titan, effets, journal
assert.ok(ecran.includes("document.querySelector('.soreal-idle-bascule-aventure-v1')") && ecran.includes("top:var(--tcv-top,0px)"), "l'écran se pose sous les vrais boutons Aventure / Titans de la page");
assert.ok(ecran.includes("body.tcv-actif #sorealIdleHudV2{max-height:0!important"), "le bandeau collant des ressources est replié pendant le combat");
assert.ok(ecran.includes('font-family:Georgia,"Palatino Linotype",serif') && ecran.includes("color:var(--tcv-c,#ffd166)") && /t1:'#ff8a1a'/.test(ecran) && ecran.includes("el.style.setProperty('--tcv-c',couleur(f.titanId))"), "nom dans la police de la page Titans, couleur propre à chaque titan (orange pour GRB)");
const couleurs = [...ecran.matchAll(/(\w+):'(#[0-9a-f]{6})'/g)].filter((m) => ecran.indexOf(m[0]) < ecran.indexOf("function couleur")).map((m) => m[2]);
assert.equal(new Set(couleurs).size, couleurs.length, "une couleur différente par titan");
assert.ok(ecran.includes('<img id="sorealIdleAdventureSceneMobV1"') && ecran.includes("document.body.insertBefore(el,document.body.firstChild)"), "l'image du titan porte l'id des effets de combat et passe avant la scène d'Aventure cachée (mêmes id)");
assert.ok(ecran.includes("journal:basculerJournal") && ecran.includes("__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__"), "l'écran de combat sait ouvrir le journal des attaques (fenêtre autonome)");
for (const id of ["regular", "strong", "parry", "piercing", "ultimate", "block", "defensiveBuff", "heal", "offensiveBuff", "charge", "ultimateBuff", "paralyze", "hyperRegen", "beastMode", "megaBuff", "ohShit", "move69"]) assert.ok(journal.includes("{id:'" + id + "',k:"), "journal : " + id);
assert.ok(ui.includes("if(v!=='titans')arreterCombatTitanIdleV1_();"), "le bouton Aventure de la page (retour aux zones) arrête le combat de titan");
console.log("idle-titan-ecran-combat-v1: OK");

// Journal des attaques accessible hors combat et sur la page Aventure (Norman, 2026-10-13) : « il doit être accessible même hors combat et en mode aventure également »
{
  const ui2 = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8").replace(/\r\n/g, "\n");
  const j = readFileSync("cloudflare/public/modules/journal-attaques-v1.js", "utf8");
  assert.ok(/<script defer src="\/modules\/journal-attaques-v1\.js\?v=\d+"><\/script>/.test(readFileSync("cloudflare/public/index.html", "utf8")), "module du journal chargé");
  assert.ok(ui2.includes('class="soreal-idle-adventure-idle-ligne-v1"') && ui2.includes('class="soreal-idle-journal-mini-v1"') && ui2.indexOf('soreal-idle-journal-mini-v1') > ui2.indexOf('data-adventure-idle-toggle'), "petit bouton 📖 discret sur la même ligne qu'Idle Mode (page Aventure ET écran de combat de titan)");
  assert.ok(!ui2.includes('boutonJournal'), "plus de grande ligne de bouton sous la bascule");
  assert.ok(ui2.includes("window.__competencesJournalIdleV1__=function(){") && j.includes("window.__competencesJournalIdleV1__"), "les compétences avancées verrouillées ne sont pas expliquées (anti-spoil)");
  assert.ok(j.includes("window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__={ouvrir:ouvrir,fermer:fermer,html:html};") && j.includes("position:fixed;inset:0;z-index:2000"), "fenêtre autonome, au-dessus de l'écran de combat");
}
// Secret et discrétion (Norman, 2026-10-13) : le journal ne parle ni des sets qui améliorent les attaques, ni de la source des chiffres
{
  const j = readFileSync("cloudflare/public/modules/journal-attaques-v1.js", "utf8");
  const donnees = j.slice(j.indexOf("var JOURNAL=["), j.indexOf("function h(x)"));
  for (const mot of [/wiki/i, /\bsets?\b/i, /JRPG/, /Slimy/, /Purple/, /Red Liquid/, /équipement/i]) assert.ok(!mot.test(donnees), "le journal ne mentionne pas : " + mot);
}
console.log("idle-titan-ecran-combat-v1 (journal): OK");

// Le journal ne mentionne que les raccourcis débloqués et ne cite pas, dans une explication, une autre attaque (Norman, 2026-10-13)
{
  const j = readFileSync("cloudflare/public/modules/journal-attaques-v1.js", "utf8");
  const ui3 = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8").replace(/\r\n/g, "\n");
  assert.ok(ui3.includes("return debloquees(IDLE_ADVENTURE_MANUAL_ATTACKS_V3,'attack')") && ui3.includes("competenceAdventureDisponibleIdleV4_(d,groupe,a)"), "seuls les raccourcis débloqués (même condition que le bouton actif) sont expliqués");
  assert.ok(!j.includes("var BASE=") && j.includes("var ids=[];"), "aucune liste de repli : état illisible = rien d'expliqué");
  const donnees = j.slice(j.indexOf("var JOURNAL=["), j.indexOf("var GENERAL="));
  for (const nom of ["Charge", "Parade", "Soin", "Paralyze", "Hyper Regen", "Bonus ultime", "Blocage"]) {
    const dans = [...donnees.matchAll(/\{id:'(\w+)',k:'\w+',t:'([^']+)'[^\n]*?d:'([^\n]*)'\}/g)].filter((m) => m[2] !== nom && m[3].includes(nom));
    assert.equal(dans.length, 0, "aucune explication ne cite « " + nom + " » (peut être verrouillée)");
  }
}
console.log("idle-titan-ecran-combat-v1 (journal débloqué): OK");
