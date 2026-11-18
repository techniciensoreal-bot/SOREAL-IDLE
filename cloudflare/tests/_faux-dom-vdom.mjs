/*
 * Faux DOM minimal pour exécuter VRAIMENT Preact (modules/vendor/preact-*.min.js) et le pont (modules/vdom-pont-v1.js) dans les tests Node, sans jsdom (absent des dépendances du dépôt).
 * Il implémente ce que Preact et les modules de page utilisent : arbre de nœuds (éléments, texte, bloc brut pour innerHTML), attributs, classList, style (variables CSS comprises), écouteurs d'événements,
 * querySelector(All) pour les sélecteurs simples du jeu (balise, .classe, [attr], [attr="v"], combinateur « descendant »), sérialisation HTML (innerHTML / outerHTML).
 * Les identités de nœuds sont celles d'un vrai navigateur : un test peut comparer `===` avant et après un rendu.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const VIDES = new Set(["img", "br", "input", "hr"]);
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (t) => esc(t).replace(/"/g, "&quot;");

class Noeud {
  constructor() { this.parentNode = null; this.childNodes = []; }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get nextSibling() { const p = this.parentNode; if (!p) return null; return p.childNodes[p.childNodes.indexOf(this) + 1] || null; }
  get previousSibling() { const p = this.parentNode; if (!p) return null; return p.childNodes[p.childNodes.indexOf(this) - 1] || null; }
  get nextElementSibling() { let n = this.nextSibling; while (n && n.nodeType !== 1) n = n.nextSibling; return n; }
  get previousElementSibling() { let n = this.previousSibling; while (n && n.nodeType !== 1) n = n.previousSibling; return n; }
  get firstElementChild() { return this.childNodes.find((c) => c.nodeType === 1) || null; }
  get isConnected() { let n = this; while (n) { if (n.estRacine) return true; n = n.parentNode; } return false; }
  appendChild(n) { return this.insertBefore(n, null); }
  insertBefore(n, ref) {
    if (n.parentNode) n.parentNode.removeChild(n);
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    if (i < 0) this.childNodes.push(n); else this.childNodes.splice(i, 0, n);
    n.parentNode = this;
    return n;
  }
  removeChild(n) {
    const i = this.childNodes.indexOf(n);
    if (i < 0) throw new Error("removeChild : pas un enfant");
    this.childNodes.splice(i, 1); n.parentNode = null; return n;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(""); }
  set textContent(t) { this.childNodes.forEach((c) => { c.parentNode = null; }); this.childNodes = []; if (t) this.appendChild(new Texte(t)); }
  contains(n) { while (n) { if (n === this) return true; n = n.parentNode; } return false; }
}

class Texte extends Noeud {
  constructor(t) { super(); this.nodeType = 3; this.data = String(t); }
  get nodeValue() { return this.data; }
  set nodeValue(v) { this.data = String(v); }
  get textContent() { return this.data; }
  get html() { return esc(this.data); }
}
class Brut extends Noeud {
  constructor(t) { super(); this.nodeType = 3; this.data = String(t); this.brut = true; }
  get textContent() { return this.data.replace(/<[^>]*>/g, ""); }
  get html() { return this.data; }
}

function kebab(k) { return k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()); }
function creerStyle() {
  const m = new Map();
  const api = {
    setProperty(k, v) { if (v === "" || v == null) m.delete(k); else m.set(k, String(v)); },
    getPropertyValue(k) { return m.get(k) || ""; },
    removeProperty(k) { const v = m.get(k) || ""; m.delete(k); return v; },
    get cssText() { return [...m].map(([k, v]) => k + ":" + v).join(";"); },
    set cssText(t) { m.clear(); String(t).split(";").forEach((d) => { const i = d.indexOf(":"); if (i > 0) m.set(d.slice(0, i).trim(), d.slice(i + 1).trim()); }); }
  };
  return new Proxy(api, {
    get(o, k) { if (typeof k === "symbol") return undefined; return k in o ? o[k] : (m.get(kebab(k)) || ""); },
    set(o, k, v) { if (k === "cssText") { o.cssText = v; return true; } api.setProperty(kebab(k), v); return true; }
  });
}

const REFLETS_BOOL = ["disabled", "checked"];
const REFLETS_TEXTE = ["src", "alt", "title", "type"];
class Element extends Noeud {
  constructor(tag) {
    super(); this.nodeType = 1; this.tagName = String(tag).toUpperCase(); this.localName = String(tag).toLowerCase(); this.nodeName = this.tagName;
    this._attrs = new Map(); this.style = creerStyle(); this._ecouteurs = {};
  }
  get attributes() { return [...this._attrs].map(([name, value]) => ({ name, value })); }
  setAttribute(k, v) { this._attrs.set(k, String(v)); }
  getAttribute(k) { return this._attrs.has(k) ? this._attrs.get(k) : null; }
  removeAttribute(k) { this._attrs.delete(k); }
  hasAttribute(k) { return this._attrs.has(k); }
  get id() { return this.getAttribute("id") || ""; }
  set id(v) { this.setAttribute("id", v); }
  get className() { return this.getAttribute("class") || ""; }
  set className(v) { this.setAttribute("class", v); }
  get classList() {
    const el = this, liste = () => el.className.split(/\s+/).filter(Boolean);
    return { contains: (c) => liste().includes(c), add: (c) => { if (!liste().includes(c)) el.className = liste().concat(c).join(" "); }, remove: (c) => { el.className = liste().filter((x) => x !== c).join(" "); },
      toggle: (c, f) => { const a = liste().includes(c); const v = f === undefined ? !a : f; if (v) this.add(c); else this.remove(c); return v; } };
  }
  get draggable() { return this.getAttribute("draggable") === "true"; }
  set draggable(v) { this.setAttribute("draggable", String(Boolean(v))); }
  get loading() { return this.getAttribute("loading") || ""; }
  set loading(v) { this.setAttribute("loading", v); }
  get innerHTML() { return this.childNodes.map(serialiserNoeud).join(""); }
  set innerHTML(h) { this.childNodes.forEach((c) => { c.parentNode = null; }); this.childNodes = []; if (h) this.appendChild(new Brut(h)); }
  get outerHTML() { return serialiserNoeud(this); }
  addEventListener(t, f) { (this._ecouteurs[t] || (this._ecouteurs[t] = [])).push(f); }
  removeEventListener(t, f) { this._ecouteurs[t] = (this._ecouteurs[t] || []).filter((x) => x !== f); }
  /* Un événement qui remonte jusqu'à la racine (click, change) ; load / error ne remontent pas. */
  dispatchEvent(e) {
    e.target = e.target || this;
    for (let n = this; n; n = n.parentNode) {
      e.currentTarget = n;
      (n._ecouteurs && n._ecouteurs[e.type] || []).slice().forEach((f) => f.call(n, e));
      if (e.bubbles === false) break;
    }
    return true;
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: 10, height: 10 }; }
  cloneNode(profond) {
    const c = new Element(this.localName);
    this._attrs.forEach((v, k) => c._attrs.set(k, v));
    c.style.cssText = this.style.cssText;
    if (profond) this.childNodes.forEach((n) => c.appendChild(n.nodeType === 1 ? n.cloneNode(true) : new Texte(n.data)));
    return c;
  }
  animate() { return { onfinish: null, cancel() {} }; }
  querySelectorAll(sel) { const o = []; sel.split(",").forEach((s) => { const sels = analyser(s.trim()); parcourir(this, (e) => { if (correspond(e, sels, this)) o.push(e); }); }); return o; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  closest(sel) { const sels = analyser(sel.trim()); for (let n = this; n && n.nodeType === 1; n = n.parentNode) if (correspond(n, sels, null)) return n; return null; }
  matches(sel) { return correspond(this, analyser(sel.trim()), null); }
}
for (const k of REFLETS_BOOL) Object.defineProperty(Element.prototype, k, { get() { return this.hasAttribute(k); }, set(v) { if (v) this.setAttribute(k, ""); else this.removeAttribute(k); } });
for (const k of REFLETS_TEXTE) Object.defineProperty(Element.prototype, k, { get() { return this.getAttribute(k) || ""; }, set(v) { this.setAttribute(k, v); } });

function parcourir(racine, f) { for (const c of racine.childNodes) if (c.nodeType === 1) { f(c); parcourir(c, f); } }
/* Sélecteur « a b.c[d="e"] » : liste de composés séparés par des espaces. */
function analyser(s) {
  return s.split(/\s+/).filter(Boolean).map((c) => {
    const o = { tag: null, classes: [], attrs: [] };
    const re = /^([a-zA-Z][\w-]*)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/;
    let r = c, m;
    while (r && (m = re.exec(r))) { if (m[1]) o.tag = m[1].toLowerCase(); else if (m[2]) o.classes.push(m[2]); else o.attrs.push([m[3], m[4]]); r = r.slice(m[0].length); }
    return o;
  });
}
function composeOk(e, c) {
  if (c.tag && e.localName !== c.tag) return false;
  const k = e.className.split(/\s+/);
  if (!c.classes.every((x) => k.includes(x))) return false;
  return c.attrs.every(([n, v]) => e.hasAttribute(n) && (v === undefined || e.getAttribute(n) === v));
}
function correspond(e, sels, borne) {
  if (!composeOk(e, sels[sels.length - 1])) return false;
  let i = sels.length - 2, n = e.parentNode;
  while (i >= 0 && n && n !== borne && n.nodeType === 1) { if (composeOk(n, sels[i])) i -= 1; n = n.parentNode; }
  return i < 0;
}

function serialiserNoeud(n) {
  if (n.nodeType === 3) return n.html;
  const attrs = n.attributes.map((a) => " " + a.name + '="' + escAttr(a.value) + '"').join("");
  const css = n.style.cssText;
  const st = css ? ' style="' + escAttr(css) + '"' : "";
  if (VIDES.has(n.localName)) return "<" + n.localName + attrs + st + ">";
  return "<" + n.localName + attrs + st + ">" + n.childNodes.map(serialiserNoeud).join("") + "</" + n.localName + ">";
}

export function creerDocument() {
  const document = {
    createElement: (t) => new Element(t),
    createElementNS: (_ns, t) => new Element(t),
    createTextNode: (t) => new Texte(t),
    getElementById: (id) => { let r = null; parcourir(document.documentElement, (e) => { if (!r && e.id === id) r = e; }); return r; },
    querySelector: (s) => document.body.querySelector(s) || document.head.querySelector(s),
    querySelectorAll: (s) => document.body.querySelectorAll(s),
    importNode: (n) => n,
    hidden: false
  };
  document.documentElement = new Element("html"); document.documentElement.estRacine = true;
  document.head = new Element("head"); document.body = new Element("body");
  document.documentElement.appendChild(document.head); document.documentElement.appendChild(document.body);
  return document;
}

export const evenement = (el, type, extra = {}) => el.dispatchEvent({ type, bubbles: type !== "load" && type !== "error", ...extra });
export const serialiser = (n) => serialiserNoeud(n);
export const trouverTous = (racine, sel) => racine.querySelectorAll(sel);

/* Charge Preact (le vrai fichier du jeu) dans un contexte vm où `window`, `self` et `document` sont les nôtres. */
export function chargerPreact(contexte) {
  contexte.self = contexte.self || contexte.window || contexte;
  vm.runInNewContext(readFileSync("cloudflare/public/modules/vendor/preact-10.28.4.min.js", "utf8"), contexte);
  if (contexte.window && !contexte.window.preact) contexte.window.preact = contexte.preact || contexte.self.preact;
  return contexte.window ? contexte.window.preact : contexte.preact;
}
export function chargerPont(contexte) {
  vm.runInNewContext(readFileSync("cloudflare/public/modules/vdom-pont-v1.js", "utf8"), contexte);
  return contexte.window.__SOREAL_IDLE_VDOM_V1__;
}
