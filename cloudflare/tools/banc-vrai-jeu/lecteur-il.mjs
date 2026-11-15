/* Lecteur minimal de métadonnées .NET et d'instructions IL (ECMA-335), pour lire des FAITS chiffrés dans un assembly. */
import fs from "node:fs";

export function charger(chemin) {
  const b = fs.readFileSync(chemin);
  const u16 = (o) => b.readUInt16LE(o), u32 = (o) => b.readUInt32LE(o);
  const pe = u32(0x3c);
  const nbSections = u16(pe + 6), tailleOpt = u16(pe + 20);
  const opt = pe + 24;
  const magic = u16(opt);
  const dd = opt + (magic === 0x20b ? 112 : 96);
  const cliRva = u32(dd + 14 * 8);
  const sections = [];
  let so = opt + tailleOpt;
  for (let i = 0; i < nbSections; i++) { sections.push({ va: u32(so + 12), vs: u32(so + 8), raw: u32(so + 20), rs: u32(so + 16) }); so += 40; }
  const rva2off = (rva) => { for (const s of sections) if (rva >= s.va && rva < s.va + Math.max(s.vs, s.rs)) return rva - s.va + s.raw; throw new Error("rva " + rva.toString(16)); };
  const cli = rva2off(cliRva);
  const mdRva = u32(cli + 8);
  const md = rva2off(mdRva);
  if (u32(md) !== 0x424a5342) throw new Error("pas de métadonnées");
  const verLen = u32(md + 12);
  let p = md + 16 + verLen + 2;
  const nbStreams = u16(p); p += 2;
  const flux = {};
  for (let i = 0; i < nbStreams; i++) {
    const off = u32(p), size = u32(p + 4); p += 8;
    let n = ""; while (b[p]) n += String.fromCharCode(b[p++]); p++; p = (p + 3) & ~3;
    flux[n] = { off: md + off, size };
  }
  const str = (i) => { let o = flux["#Strings"].off + i, s = ""; const e = o; while (b[o]) o++; return b.toString("utf8", e, o); };
  const us = (i) => { let o = flux["#US"].off + i; let len = b[o]; let h = 1; if ((len & 0x80) === 0) { } else if ((len & 0xc0) === 0x80) { len = ((len & 0x3f) << 8) | b[o + 1]; h = 2; } else { len = ((len & 0x1f) << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]; h = 4; } return b.toString("utf16le", o + h, o + h + Math.max(0, len - 1)); };
  // flux #~
  let t = flux["#~"].off;
  const heapSizes = b[t + 6];
  const valid = b.readBigUInt64LE(t + 8);
  t += 24;
  const rows = new Array(64).fill(0);
  for (let i = 0; i < 64; i++) if ((valid >> BigInt(i)) & 1n) { rows[i] = u32(t); t += 4; }
  const sI = heapSizes & 1 ? 4 : 2, gI = heapSizes & 2 ? 4 : 2, bI = heapSizes & 4 ? 4 : 2;
  const simple = (tab) => (rows[tab] > 65535 ? 4 : 2);
  const coded = (bits, tabs) => { const max = Math.max(...tabs.map((x) => rows[x])); return max < (1 << (16 - bits)) ? 2 : 4; };
  const CI = {
    TypeDefOrRef: coded(2, [2, 1, 27]), HasConstant: coded(2, [4, 8, 23]),
    HasCustomAttribute: coded(5, [6, 4, 1, 2, 8, 9, 10, 0, 14, 23, 20, 17, 26, 27, 32, 35, 38, 39, 40, 42, 44, 43]),
    HasFieldMarshal: coded(1, [4, 8]), HasDeclSecurity: coded(2, [2, 6, 32]), MemberRefParent: coded(3, [2, 1, 26, 6, 27]),
    HasSemantics: coded(1, [20, 23]), MethodDefOrRef: coded(1, [6, 10]), MemberForwarded: coded(1, [4, 6]),
    Implementation: coded(2, [38, 35, 39]), CustomAttributeType: coded(3, [6, 10]), ResolutionScope: coded(2, [0, 26, 35, 1]),
    TypeOrMethodDef: coded(1, [2, 6])
  };
  // schémas : S=string G=guid B=blob nombre=octets ; "t:N"=index simple de la table N ; "c:Nom"=index codé
  const sch = {
    0: [2, "S", "G", "G", "G"], 1: ["c:ResolutionScope", "S", "S"], 2: [4, "S", "S", "c:TypeDefOrRef", "t:4", "t:6"], 3: ["t:4"], 4: [2, "S", "B"], 5: ["t:6"],
    6: [4, 2, 2, "S", "B", "t:8"], 7: ["t:8"], 8: [2, 2, "S"], 9: ["t:2", "c:TypeDefOrRef"], 10: ["c:MemberRefParent", "S", "B"], 11: [2, "c:HasConstant", "B"],
    12: ["c:HasCustomAttribute", "c:CustomAttributeType", "B"], 13: ["c:HasFieldMarshal", "B"], 14: [2, "c:HasDeclSecurity", "B"], 15: [2, 4, "t:2"], 16: [4, "t:4"],
    17: ["B"], 18: ["t:2", "t:20"], 19: ["t:20"], 20: [2, "S", "c:TypeDefOrRef"], 21: ["t:2", "t:23"], 22: ["t:23"], 23: [2, "S", "B"], 24: [2, "t:6", "c:HasSemantics"],
    25: ["t:2", "c:MethodDefOrRef", "c:MethodDefOrRef"], 26: ["S"], 27: ["B"], 28: [2, "c:MemberForwarded", "S", "t:26"], 29: [4, "t:4"], 30: [4, 4], 31: [4],
    32: [4, 2, 2, 2, 2, 4, "B", "S", "S"], 33: [4], 34: [4, 4, 4], 35: [2, 2, 2, 2, 4, "B", "S", "S", "B"], 36: [4, "t:35"], 37: [4, 4, 4, "t:35"],
    38: [4, "S", "B"], 39: [4, 4, "S", "S", "c:Implementation"], 40: [4, 4, "S", "c:Implementation"], 41: ["t:2", "t:2"], 42: [2, 2, "c:TypeOrMethodDef", "S"],
    43: ["c:MethodDefOrRef", "B"], 44: ["t:42", "c:TypeDefOrRef"]
  };
  const taille = (c) => (typeof c === "number" ? c : c === "S" ? sI : c === "G" ? gI : c === "B" ? bI : c.startsWith("t:") ? simple(+c.slice(2)) : CI[c.slice(2)]);
  const tables = {};
  for (let i = 0; i < 45; i++) {
    if (!rows[i]) continue;
    const cols = sch[i].map(taille); const rs = cols.reduce((a, c) => a + c, 0);
    tables[i] = { start: t, rs, cols, n: rows[i] };
    t += rs * rows[i];
  }
  const cell = (tab, row, col) => { const T = tables[tab]; let o = T.start + (row - 1) * T.rs; for (let k = 0; k < col; k++) o += T.cols[k]; const w = T.cols[col]; return w === 1 ? b[o] : w === 2 ? u16(o) : u32(o); };
  // types, méthodes, champs
  const nomType = (i) => str(cell(2, i, 1));
  const types = [];
  for (let i = 1; i <= rows[2]; i++) {
    const fl = cell(2, i, 4), ml = cell(2, i, 5);
    const fEnd = i < rows[2] ? cell(2, i + 1, 4) : rows[4] + 1, mEnd = i < rows[2] ? cell(2, i + 1, 5) : rows[6] + 1;
    types.push({ id: i, ns: str(cell(2, i, 2)), nom: str(cell(2, i, 1)), champs: [fl, fEnd], methodes: [ml, mEnd] });
  }
  const typeDeMethode = new Map(), typeDeChamp = new Map();
  for (const ty of types) { for (let m = ty.methodes[0]; m < ty.methodes[1]; m++) typeDeMethode.set(m, ty); for (let f = ty.champs[0]; f < ty.champs[1]; f++) typeDeChamp.set(f, ty); }
  const nomMethode = (m) => { const ty = typeDeMethode.get(m); return (ty ? ty.nom : "?") + "::" + str(cell(6, m, 3)); };
  const nomChamp = (f) => { const ty = typeDeChamp.get(f); return (ty ? ty.nom : "?") + "." + str(cell(4, f, 1)); };
  const nomTypeRef = (i) => str(cell(1, i, 1));
  const resoudre = (tok) => {
    const tab = tok >>> 24, row = tok & 0xffffff;
    if (tab === 6) return nomMethode(row);
    if (tab === 4) return nomChamp(row);
    if (tab === 2) return nomType(row);
    if (tab === 1) return nomTypeRef(row);
    if (tab === 10) { const v = cell(10, row, 0); const tag = v & 7, idx = v >> 3; const par = tag === 0 ? nomType(idx) : tag === 1 ? nomTypeRef(idx) : tag === 3 ? nomMethode(idx) : "?"; return par + "::" + str(cell(10, row, 1)); }
    if (tab === 43) { const v = cell(43, row, 0); return (v & 1 ? resoudre((10 << 24) | (v >> 1)) : resoudre((6 << 24) | (v >> 1))) + "<>"; }
    if (tab === 27) return "typespec" + row;
    if (tab === 0x70) return JSON.stringify(us(row));
    return "tok" + tok.toString(16);
  };
  return { b, types, rows, cell, str, us, rva2off, resoudre, nomMethode, nomChamp, tables };
}

const OP1 = {};
const def = (code, nom, op = "") => { OP1[code] = { nom, op }; };
const L = [[0, "nop"], [1, "break"], [2, "ldarg.0"], [3, "ldarg.1"], [4, "ldarg.2"], [5, "ldarg.3"], [6, "ldloc.0"], [7, "ldloc.1"], [8, "ldloc.2"], [9, "ldloc.3"], [10, "stloc.0"], [11, "stloc.1"], [12, "stloc.2"], [13, "stloc.3"]];
for (const [c, n] of L) def(c, n);
def(0x0e, "ldarg.s", "u1"); def(0x0f, "ldarga.s", "u1"); def(0x10, "starg.s", "u1"); def(0x11, "ldloc.s", "u1"); def(0x12, "ldloca.s", "u1"); def(0x13, "stloc.s", "u1");
def(0x14, "ldnull"); def(0x15, "ldc.i4.m1"); for (let i = 0; i <= 8; i++) def(0x16 + i, "ldc.i4." + i);
def(0x1f, "ldc.i4.s", "i1"); def(0x20, "ldc.i4", "i4"); def(0x21, "ldc.i8", "i8"); def(0x22, "ldc.r4", "r4"); def(0x23, "ldc.r8", "r8");
def(0x25, "dup"); def(0x26, "pop"); def(0x27, "jmp", "tok"); def(0x28, "call", "tok"); def(0x29, "calli", "tok"); def(0x2a, "ret");
const BR = ["br", "brfalse", "brtrue", "beq", "bge", "bgt", "ble", "blt", "bne.un", "bge.un", "bgt.un", "ble.un", "blt.un"];
BR.forEach((n, i) => { def(0x2b + i, n + ".s", "b1"); def(0x38 + i, n, "b4"); });
def(0x45, "switch", "sw");
["ldind.i1", "ldind.u1", "ldind.i2", "ldind.u2", "ldind.i4", "ldind.u4", "ldind.i8", "ldind.i", "ldind.r4", "ldind.r8", "ldind.ref", "stind.ref", "stind.i1", "stind.i2", "stind.i4", "stind.i8", "stind.r4", "stind.r8", "add", "sub", "mul", "div", "div.un", "rem", "rem.un", "and", "or", "xor", "shl", "shr", "shr.un", "neg", "not", "conv.i1", "conv.i2", "conv.i4", "conv.i8", "conv.r4", "conv.r8", "conv.u4", "conv.u8"].forEach((n, i) => def(0x46 + i, n));
def(0x6f, "callvirt", "tok"); def(0x70, "cpobj", "tok"); def(0x71, "ldobj", "tok"); def(0x72, "ldstr", "tok"); def(0x73, "newobj", "tok"); def(0x74, "castclass", "tok"); def(0x75, "isinst", "tok"); def(0x76, "conv.r.un");
def(0x79, "unbox", "tok"); def(0x7a, "throw"); def(0x7b, "ldfld", "tok"); def(0x7c, "ldflda", "tok"); def(0x7d, "stfld", "tok"); def(0x7e, "ldsfld", "tok"); def(0x7f, "ldsflda", "tok"); def(0x80, "stsfld", "tok"); def(0x81, "stobj", "tok");
["conv.ovf.i1.un", "conv.ovf.i2.un", "conv.ovf.i4.un", "conv.ovf.i8.un", "conv.ovf.u1.un", "conv.ovf.u2.un", "conv.ovf.u4.un", "conv.ovf.u8.un", "conv.ovf.i.un", "conv.ovf.u.un"].forEach((n, i) => def(0x82 + i, n));
def(0x8c, "box", "tok"); def(0x8d, "newarr", "tok"); def(0x8e, "ldlen"); def(0x8f, "ldelema", "tok");
["ldelem.i1", "ldelem.u1", "ldelem.i2", "ldelem.u2", "ldelem.i4", "ldelem.u4", "ldelem.i8", "ldelem.i", "ldelem.r4", "ldelem.r8", "ldelem.ref", "stelem.i", "stelem.i1", "stelem.i2", "stelem.i4", "stelem.i8", "stelem.r4", "stelem.r8", "stelem.ref"].forEach((n, i) => def(0x90 + i, n));
def(0xa3, "ldelem", "tok"); def(0xa4, "stelem", "tok"); def(0xa5, "unbox.any", "tok");
["conv.ovf.i1", "conv.ovf.u1", "conv.ovf.i2", "conv.ovf.u2", "conv.ovf.i4", "conv.ovf.u4", "conv.ovf.i8", "conv.ovf.u8"].forEach((n, i) => def(0xb3 + i, n));
def(0xc2, "refanyval", "tok"); def(0xc3, "ckfinite"); def(0xc6, "mkrefany", "tok"); def(0xd0, "ldtoken", "tok");
["conv.u2", "conv.u1", "conv.i", "conv.ovf.i", "conv.ovf.u", "add.ovf", "add.ovf.un", "mul.ovf", "mul.ovf.un", "sub.ovf", "sub.ovf.un", "endfinally"].forEach((n, i) => def(0xd1 + i, n));
def(0xdd, "leave", "b4"); def(0xde, "leave.s", "b1"); def(0xdf, "stind.i"); def(0xe0, "conv.u");
const OP2 = { 0: ["arglist", ""], 1: ["ceq", ""], 2: ["cgt", ""], 3: ["cgt.un", ""], 4: ["clt", ""], 5: ["clt.un", ""], 6: ["ldftn", "tok"], 7: ["ldvirtftn", "tok"], 9: ["ldarg", "u2"], 10: ["ldarga", "u2"], 11: ["starg", "u2"], 12: ["ldloc", "u2"], 13: ["ldloca", "u2"], 14: ["stloc", "u2"], 15: ["localloc", ""], 17: ["endfilter", ""], 18: ["unaligned.", "u1"], 19: ["volatile.", ""], 20: ["tail.", ""], 21: ["initobj", "tok"], 22: ["constrained.", "tok"], 23: ["cpblk", ""], 24: ["initblk", ""], 26: ["rethrow", ""], 28: ["sizeof", "tok"], 29: ["refanytype", ""], 30: ["readonly.", ""] };

export function methodes(asm, motif) {
  const out = [];
  for (const ty of asm.types) for (let m = ty.methodes[0]; m < ty.methodes[1]; m++) { const n = ty.nom + "::" + asm.str(asm.cell(6, m, 3)); if (motif.test(n)) out.push({ id: m, nom: n }); }
  return out;
}

export function desassembler(asm, m) {
  const rva = asm.cell(6, m, 0);
  if (!rva) return "(sans corps)";
  const b = asm.b; let o = asm.rva2off(rva);
  const h = b[o]; let taille, code;
  if ((h & 3) === 2) { taille = h >> 2; code = o + 1; }
  else { taille = b.readUInt32LE(o + 4); code = o + ((b.readUInt16LE(o) >> 12) * 4); }
  const fin = code + taille; const lignes = []; let p = code;
  while (p < fin) {
    const off = p - code; let c = b[p++]; let d;
    if (c === 0xfe) { const c2 = b[p++]; d = OP2[c2] ? { nom: OP2[c2][0], op: OP2[c2][1] } : { nom: "fe" + c2.toString(16), op: "" }; } else d = OP1[c] || { nom: "?" + c.toString(16), op: "" };
    let arg = "";
    switch (d.op) {
      case "u1": arg = b[p]; p += 1; break; case "i1": arg = b.readInt8(p); p += 1; break; case "u2": arg = b.readUInt16LE(p); p += 2; break;
      case "i4": arg = b.readInt32LE(p); p += 4; break; case "i8": arg = b.readBigInt64LE(p).toString(); p += 8; break;
      case "r4": arg = b.readFloatLE(p); p += 4; break; case "r8": arg = b.readDoubleLE(p); p += 8; break;
      case "b1": { const r = b.readInt8(p); p += 1; arg = "IL_" + (p - code + r).toString(16); break; }
      case "b4": { const r = b.readInt32LE(p); p += 4; arg = "IL_" + (p - code + r).toString(16); break; }
      case "tok": { const tok = b.readUInt32LE(p); p += 4; arg = asm.resoudre(tok); break; }
      case "sw": { const n = b.readUInt32LE(p); p += 4; const base = p + 4 * n; const t = []; for (let i = 0; i < n; i++) { t.push("IL_" + (base - code + b.readInt32LE(p)).toString(16)); p += 4; } arg = t.join(","); break; }
    }
    lignes.push("IL_" + off.toString(16).padStart(4, "0") + " " + d.nom + (arg !== "" ? " " + arg : ""));
  }
  return lignes.join("\n");
}
