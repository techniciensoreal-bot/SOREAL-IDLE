import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-10) : plus de bulles d'aide du navigateur ; plus de cadre résiduel quand les barres sont épuisées ; corbeille en case ; coffre lisible sur PC ; étoiles NGU légères. */
const lire = (f) => readFileSync(f, "utf8");

// 1. Bulles : l'attribut title est retiré avant que le navigateur n'affiche quoi que ce soit.
const html = lire("cloudflare/public/index.html");
assert.ok(/<script defer src="\/modules\/sans-bulles-v1\.js\?v=\d+"><\/script>/.test(html), "module chargé");
const ecouteurs = {};
const doc = { addEventListener: (n, f) => { ecouteurs[n] = f; } };
const win = {};
vm.runInNewContext(lire("cloudflare/public/modules/sans-bulles-v1.js"), { window: win, document: doc });
for (const evt of ["mouseover", "pointerover", "pointerdown", "focusin", "touchstart"]) assert.equal(typeof ecouteurs[evt], "function", evt);
function el(attrs, texte, parent) {
  const e = {
    attrs: { ...attrs }, textContent: texte, parentElement: parent || null,
    getAttribute(n) { return n in this.attrs ? this.attrs[n] : null; },
    hasAttribute(n) { return n in this.attrs; },
    setAttribute(n, v) { this.attrs[n] = v; },
    removeAttribute(n) { delete this.attrs[n]; },
    closest(sel) { let c = this; while (c) { if ("title" in c.attrs) return c; c = c.parentElement; } return null; }
  };
  return e;
}
const parent = el({ title: "Adventure - Explorer" }, "");
const enfant = el({}, "", parent);
ecouteurs.mouseover({ target: enfant });
assert.ok(!("title" in parent.attrs), "la bulle du menu est retirée");
assert.equal(parent.attrs["aria-label"], "Adventure - Explorer", "texte conservé pour l'accessibilité d'un bouton sans texte");
const bouton = el({ title: "Aide" }, "Texte visible");
ecouteurs.focusin({ target: bouton });
assert.ok(!("title" in bouton.attrs) && !("aria-label" in bouton.attrs), "pas d'étiquette en double quand il y a du texte");

// 2. Barres : plus de cliquet de hauteur du bandeau.
const ui = lire("cloudflare/public/soreal-idle-ui.js");
assert.ok(!ui.includes("min-height:var(--hud-min-v2") && !ui.includes("hauteurMax"), "plus de hauteur réservée pour les barres épuisées");

// 3. Corbeille : mêmes cadre, fond et ombre qu'une case du sac.
const css = lire("cloudflare/public/soreal-idle-itopod.css");
const liste = css.split("\n").find((l) => l.includes(".soreal-idle-bt-panel-v120,.soreal-idle-aug-piste-v1"));
assert.ok(liste && liste.includes(".soreal-idle-v138-trash-slot"), "la corbeille partage le style des cases du sac");
assert.ok(css.includes(".soreal-idle-v138-trash-slot{border-style:solid!important"), "plus de cadre rouge en pointillés");

// 4. Coffre : cases et textes agrandis sur PC.
const pc = css.slice(css.indexOf("Coffre lisible sur PC"));
assert.ok(pc.includes("@media (min-width:701px)") && pc.includes("repeat(auto-fill,88px)") && /collection-card-name-v1\{font-size:12px/.test(pc), "coffre lisible");
console.log("idle-sans-bulles-et-interface-v1: OK");
