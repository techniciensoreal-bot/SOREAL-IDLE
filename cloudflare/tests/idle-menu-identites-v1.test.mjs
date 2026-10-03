import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-03) : « refais les boutons du menu en haut, je ne les aime pas ; ils doivent être beaucoup plus parlants par rapport à ce qu'ils font ; une identité par bouton ».
 * Chaque menu a : sa couleur, son icône, la forme de son badge et un verbe d'action.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const bloc = (debut, fin) => { const i = ui.indexOf(debut); return ui.slice(i, ui.indexOf(fin, i) + fin.length); };
const o = {};
vm.runInNewContext([
  bloc("const IDLE_MENUS_V1=[", "\n      ];"),
  bloc("const IDLE_NAV_FORMES_V1={", "\n      };"),
  bloc("const IDLE_NAV_IDENTITES_V1={", "\n      };"),
  bloc("const IDLE_NAV_COULEURS_V1={", "\n      };"),
  "this.menus=IDLE_MENUS_V1;this.formes=IDLE_NAV_FORMES_V1;this.identites=IDLE_NAV_IDENTITES_V1;this.couleurs=IDLE_NAV_COULEURS_V1;"
].join("\n"), o);

// 1. Chaque menu du jeu a une identité complète : forme existante, verbe, couleur, icône.
for (const m of o.menus) {
  const id = o.identites[m.id];
  assert.ok(id && id.verbe && id.verbe.length <= 20, m.id + " : un verbe court");
  assert.ok(o.formes[id.forme], m.id + " : forme connue (" + id.forme + ")");
  assert.ok(/^#[0-9a-f]{6}$/i.test(o.couleurs[m.id] || ""), m.id + " : une couleur");
  assert.ok(m.icon, m.id + " : une icône");
}
// 2. Une identité par bouton : jamais deux menus avec la même forme ET la même couleur, ni le même verbe.
const paires = o.menus.map((m) => o.identites[m.id].forme + "|" + o.couleurs[m.id]);
assert.equal(new Set(paires).size, paires.length, "forme + couleur uniques");
const verbes = o.menus.map((m) => o.identites[m.id].verbe.toLowerCase());
assert.equal(new Set(verbes).size, verbes.length, "verbes tous différents");
assert.ok(new Set(o.menus.map((m) => o.identites[m.id].forme)).size >= 10, "au moins 10 formes de badge différentes");
// 3. Les identités marquantes : le combat est un bouclier, le sang une goutte, le chat une bulle.
assert.equal(o.identites.combat.forme, "bouclier");
assert.equal(o.identites.sang.forme, "goutte");
assert.equal(o.identites.chat.forme, "bulle");
assert.equal(o.identites.combat.verbe, "Combattre");

// 4. Le bouton : badge + nom + verbe, comportements d'origine conservés (classes, couleur, gestes, nouveautés, disponibilité).
assert.ok(ui.includes('<span class="soreal-idle-nav-cadre-v2"><span class="soreal-idle-nav-badge-v2">${m.icon}</span></span>'));
assert.ok(ui.includes('<span class="soreal-idle-nav-texte-v2"><b>${m.nom}') && ui.includes("<small>${idleHtml_((IDLE_NAV_IDENTITES_V1[m.id]||{}).verbe||'')}</small>"));
assert.ok(ui.includes("data-menu-id-v1=\"${m.id}\"") && ui.includes("onclick=\"window.__menuIdleV28__('${m.id}')\"") && ui.includes("--forme:${IDLE_NAV_FORMES_V1["));
assert.ok(ui.includes("title=\"${idleHtml_(m.nom+"), "info-bulle : nom — verbe");
// 5. Style : badge à la forme du menu, carte pleine quand le menu est ouvert, états K.O. / disponibilité / nouveau conservés.
for (const regle of ["clip-path:var(--forme,inset(0 round 28%))", ".soreal-idle-nav-button-v28.active{", "@keyframes sorealNavKoV2", "@keyframes sorealNavBadgePalpiteV2", ".soreal-idle-nav-dispo-v1 .soreal-idle-nav-cadre-v2", ".soreal-idle-nav-new-v1 .soreal-idle-nav-cadre-v2", "@media (max-width:420px)"]) assert.ok(css.includes(regle), regle);
console.log("idle-menu-identites-v1 OK");
