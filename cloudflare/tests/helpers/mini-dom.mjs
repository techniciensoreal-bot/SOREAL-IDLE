/*
 * Mini-DOM de test (sans dépendance) : juste assez de DOM pour exécuter le vrai moteur de rendu sur place (modules/morph-v1.js) et vérifier son COMPORTEMENT
 * (identité des nœuds, attributs, ordre, blocs gardés) au lieu de chercher des chaînes dans le code. Analyseur HTML volontairement simple : balises, attributs entre guillemets, texte.
 */
const VIDES = new Set(["input", "br", "img", "hr"]);

class Noeud {
  constructor(type) { this.nodeType = type; this.parentNode = null; this.childNodes = []; }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get nextSibling() { const p = this.parentNode; if (!p) return null; return p.childNodes[p.childNodes.indexOf(this) + 1] || null; }
  _detacher() { if (this.parentNode) { const i = this.parentNode.childNodes.indexOf(this); if (i >= 0) this.parentNode.childNodes.splice(i, 1); this.parentNode = null; } }
  insertBefore(n, ref) {
    if (n.nodeType === 11) { [...n.childNodes].forEach((c) => this.insertBefore(c, ref)); return n; }
    n._detacher();
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    if (i < 0) this.childNodes.push(n); else this.childNodes.splice(i, 0, n);
    n.parentNode = this;
    return n;
  }
  appendChild(n) { return this.insertBefore(n, null); }
  removeChild(n) { n._detacher(); return n; }
  get isConnected() { let n = this; while (n.parentNode) n = n.parentNode; return n.nodeType === 9 || n.__racine === true; }
}
export class Texte extends Noeud {
  constructor(v) { super(3); this.nodeValue = String(v); }
  get textContent() { return this.nodeValue; }
}
export class Fragment extends Noeud { constructor() { super(11); } }

export class Element extends Noeud {
  constructor(tag) { super(1); this.tagName = String(tag).toUpperCase(); this._attrs = new Map(); this._valeur = ""; this._sale = false; this.checked = false; this.selected = false; this.selectedIndex = -1; }
  /* Comme un vrai champ : une fois modifiée (par le joueur ou par le code), la propriété value ne suit plus l attribut value. */
  get value() { return this._valeur; }
  set value(v) { this._valeur = String(v); this._sale = true; }
  get id() { return this._attrs.get("id") || ""; }
  get className() { return this._attrs.get("class") || ""; }
  get classList() { const el = this; return { contains: (c) => el.className.split(/\s+/).includes(c) }; }
  get attributes() { return [...this._attrs].map(([name, value]) => ({ name, value })); }
  getAttribute(n) { return this._attrs.has(n) ? this._attrs.get(n) : null; }
  setAttribute(n, v) { this._attrs.set(n, String(v)); if (n === "value" && !this._sale) this._valeur = String(v); if (n === "checked") this.checked = true; if (n === "selected") this.selected = true; }
  removeAttribute(n) { this._attrs.delete(n); }
  hasAttribute(n) { return this._attrs.has(n); }
  get children() { return this.childNodes.filter((c) => c.nodeType === 1); }
  get firstElementChild() { return this.children[0] || null; }
  get nextElementSibling() { const p = this.parentNode; if (!p) return null; const f = p.children; return f[f.indexOf(this) + 1] || null; }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(""); }
  set textContent(v) { this.childNodes.slice().forEach((c) => c._detacher()); if (String(v) !== "") this.appendChild(new Texte(v)); }
  matches(sel) {
    return String(sel).split(",").some((s) => {
      s = s.trim();
      if (s.startsWith(".")) return this.className.split(/\s+/).includes(s.slice(1));
      if (s.startsWith("#")) return this.id === s.slice(1);
      const m = /^\[([\w-]+)\]$/.exec(s); if (m) return this.hasAttribute(m[1]);
      return this.tagName.toLowerCase() === s.toLowerCase();
    });
  }
  querySelectorAll(sel) { const out = []; const aller = (n) => n.children.forEach((c) => { if (c.matches(sel)) out.push(c); aller(c); }); aller(this); return out; }
  getElementsByTagName(t) { return this.querySelectorAll(t); }
  get innerHTML() { return this.childNodes.map(serialiser).join(""); }
  set innerHTML(html) {
    this.childNodes.slice().forEach((c) => c._detacher());
    analyser(String(html)).forEach((n) => this.appendChild(n));
  }
}
function serialiser(n) {
  if (n.nodeType === 3) return n.nodeValue;
  const attrs = n.attributes.map((a) => " " + a.name + '="' + a.value + '"').join("");
  const tag = n.tagName.toLowerCase();
  return VIDES.has(tag) ? "<" + tag + attrs + ">" : "<" + tag + attrs + ">" + n.childNodes.map(serialiser).join("") + "</" + tag + ">";
}
function analyser(html) {
  const racine = new Fragment(); const pile = [racine];
  const re = /<\/([a-zA-Z0-9]+)>|<([a-zA-Z0-9]+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const haut = pile[pile.length - 1];
    if (m[1]) { if (pile.length > 1) pile.pop(); }
    else if (m[2]) {
      const el = new Element(m[2]);
      for (const a of m[3].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) el.setAttribute(a[1], a[2] === undefined ? "" : a[2]);
      haut.appendChild(el);
      if (!VIDES.has(m[2].toLowerCase())) pile.push(el);
    } else if (m[4]) haut.appendChild(new Texte(m[4]));
  }
  return racine.childNodes.slice();
}
function cloner(n) {
  if (n.nodeType === 3) return new Texte(n.nodeValue);
  const c = new Element(n.tagName);
  n._attrs.forEach((v, k) => c.setAttribute(k, v));
  n.childNodes.forEach((x) => c.appendChild(cloner(x)));
  return c;
}
/* « template » : son innerHTML produit un fragment dans .content (comme le vrai). */
class Modele extends Element {
  constructor() { super("template"); this.content = new Fragment(); }
  set innerHTML(html) { this.content.childNodes.slice().forEach((c) => c._detacher()); analyser(String(html)).forEach((n) => this.content.appendChild(n)); }
  get innerHTML() { return this.content.childNodes.map(serialiser).join(""); }
}
export function creerDocument() {
  const doc = { nodeType: 9, activeElement: null, createElement: (t) => (String(t).toLowerCase() === "template" ? new Modele() : new Element(t)), importNode: (n) => cloner(n) };
  return doc;
}
export function racine(html) { const r = new Element("div"); r.__racine = true; r.innerHTML = html; return r; }
