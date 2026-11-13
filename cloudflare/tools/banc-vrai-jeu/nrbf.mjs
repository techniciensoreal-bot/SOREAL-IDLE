/* Lecteur du format .NET BinaryFormatter (MS-NRBF), suffisant pour une sauvegarde NGU Idle. Lecture seule. */
export function lireNrbf(buf) {
  let p = 0;
  const u8 = () => buf[p++];
  const i32 = () => { const v = buf.readInt32LE(p); p += 4; return v; };
  const lenPrefixed = () => { let n = 0, s = 0, b; do { b = u8(); n |= (b & 0x7f) << s; s += 7; } while (b & 0x80); const v = buf.toString("utf8", p, p + n); p += n; return v; };
  const prim = (t) => {
    switch (t) {
      case 1: return u8() !== 0;
      case 2: return u8();
      case 3: { const v = buf.toString("utf16le", p, p + 2); p += 2; return v; }
      case 5: return lenPrefixed(); /* Decimal */
      case 6: { const v = buf.readDoubleLE(p); p += 8; return v; }
      case 7: { const v = buf.readInt16LE(p); p += 2; return v; }
      case 8: return i32();
      case 9: { const v = buf.readBigInt64LE(p); p += 8; return Number(v); }
      case 10: { const v = buf.readInt8(p); p += 1; return v; }
      case 11: { const v = buf.readFloatLE(p); p += 4; return v; }
      case 12: { const v = buf.readBigInt64LE(p); p += 8; return Number(v); } /* TimeSpan */
      case 13: { const v = buf.readBigUInt64LE(p); p += 8; return String(v); } /* DateTime */
      case 14: { const v = buf.readUInt16LE(p); p += 2; return v; }
      case 15: { const v = buf.readUInt32LE(p); p += 4; return v; }
      case 16: { const v = buf.readBigUInt64LE(p); p += 8; return Number(v); }
      case 18: return lenPrefixed();
      default: throw Error("primitif inconnu " + t + " à " + p);
    }
  };
  const objets = new Map(), classes = new Map(), refs = [];
  const lireInfoTypes = (n) => {
    const bt = []; for (let i = 0; i < n; i++) bt.push(u8());
    const add = bt.map((t) => { if (t === 0 || t === 7) return u8(); if (t === 3) return lenPrefixed(); if (t === 4) return { nom: lenPrefixed(), lib: i32() }; return null; });
    return { bt, add };
  };
  const valeurMembre = (bt, add) => (bt === 0 ? prim(add) : enregistrement());
  const lireMembres = (cls) => {
    const o = { __classe: cls.nom };
    const off = {}; Object.defineProperty(o, "__off", { value: off, enumerable: false });
    for (let i = 0; i < cls.membres.length; i++) {
      if (cls.types && cls.types.bt[i] === 0) off[cls.membres[i]] = { debut: p, type: cls.types.add[i] };
      const v = cls.types ? valeurMembre(cls.types.bt[i], cls.types.add[i]) : enregistrement();
      o[cls.membres[i]] = v;
    }
    return o;
  };
  const lireTableau = (n, lire) => {
    const a = [];
    while (a.length < n) {
      const v = lire();
      if (v && v.__nuls) { for (let k = 0; k < v.__nuls; k++) a.push(null); } else a.push(v);
    }
    return a;
  };
  function enregistrement() {
    const t = u8();
    switch (t) {
      case 0: p += 16; return enregistrement();
      case 12: { i32(); lenPrefixed(); return enregistrement(); }
      case 5: case 4: case 3: case 2: {
        const id = i32(); const nom = lenPrefixed(); const n = i32();
        const membres = []; for (let i = 0; i < n; i++) membres.push(lenPrefixed());
        const types = (t === 5 || t === 4) ? lireInfoTypes(n) : null;
        if (t === 5 || t === 3) i32();
        const cls = { nom, membres, types }; classes.set(id, cls);
        const o = {}; objets.set(id, o); const lu = lireMembres(cls); Object.assign(o, lu); Object.defineProperty(o, "__off", { value: lu.__off, enumerable: false }); return o;
      }
      case 1: {
        const id = i32(); const meta = i32(); const cls = classes.get(meta);
        if (!cls) throw Error("classe inconnue " + meta);
        classes.set(id, cls);
        const o = {}; objets.set(id, o); const lu = lireMembres(cls); Object.assign(o, lu); Object.defineProperty(o, "__off", { value: lu.__off, enumerable: false }); return o;
      }
      case 6: { const id = i32(); const v = lenPrefixed(); objets.set(id, v); return v; }
      case 7: {
        const id = i32(); const type = u8(); const rang = i32();
        const dims = []; for (let i = 0; i < rang; i++) dims.push(i32());
        if (type >= 3) for (let i = 0; i < rang; i++) i32();
        const bt = u8(); let add = null;
        if (bt === 0 || bt === 7) add = u8(); else if (bt === 3) add = lenPrefixed(); else if (bt === 4) add = { nom: lenPrefixed(), lib: i32() };
        const n = dims.reduce((a, b) => a * b, 1);
        const a = []; objets.set(id, a);
        const v = lireTableau(n, () => valeurMembre(bt, add)); a.push(...v); return a;
      }
      case 8: return prim(u8());
      case 9: { const r = { __ref: i32() }; refs.push(r); return r; }
      case 10: return null;
      case 11: return { __fin: true };
      case 13: return { __nuls: u8() };
      case 14: return { __nuls: i32() };
      case 15: { const id = i32(); const n = i32(); const pt = u8(); const a = []; objets.set(id, a); Object.defineProperty(a, "__pos", { value: { debut: p, type: pt, n }, enumerable: false }); for (let i = 0; i < n; i++) a.push(prim(pt)); return a; }
      case 16: case 17: { const id = i32(); const n = i32(); const a = []; objets.set(id, a); a.push(...lireTableau(n, enregistrement)); return a; }
      default: throw Error("enregistrement inconnu " + t + " à " + (p - 1));
    }
  }
  const racine = enregistrement();
  /* le reste du flux : objets référencés plus loin */
  while (p < buf.length) { const r = enregistrement(); if (r && r.__fin) break; }
  const vu = new Set();
  const resoudre = (v) => {
    if (v && typeof v === "object") {
      if (v.__ref !== undefined) return resoudre(objets.get(v.__ref));
      if (vu.has(v)) return v; vu.add(v);
      if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = resoudre(v[i]); }
      else for (const k of Object.keys(v)) v[k] = resoudre(v[k]);
      /* List<T> : _items + _size */
      if (!Array.isArray(v) && Array.isArray(v._items) && typeof v._size === "number") { const r = v._items.slice(0, v._size); if (v._items.__pos) Object.defineProperty(r, "__pos", { value: v._items.__pos, enumerable: false }); return r; }
    }
    return v;
  };
  return resoudre(racine);
}
