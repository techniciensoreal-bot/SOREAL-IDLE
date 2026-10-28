/*
 * Lecture et écriture de fichiers ZIP, sans aucune dépendance (zlib de Node) : le paquet de mise à jour du jeu (sources, pages, scripts) voyage dans UN seul fichier.
 * Pas de ZIP64 (le paquet fait quelques Mo), pas de chiffrement. Les noms sont en UTF-8 (indicateur 0x0800).
 */
import zlib from "node:zlib";

const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32Octets(tampon) {
  let c = 0xffffffff;
  for (let i = 0; i < tampon.length; i += 1) c = TABLE[(c ^ tampon[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* entrees : [{ nom: "cloudflare/src/a.js", donnees: Buffer }] -> Buffer */
export function ecrireZip(entrees) {
  const locaux = [], centraux = [];
  let decalage = 0;
  for (const e of entrees) {
    const nom = Buffer.from(e.nom, "utf8");
    const brut = Buffer.isBuffer(e.donnees) ? e.donnees : Buffer.from(e.donnees);
    const comprime = zlib.deflateRawSync(brut, { level: 9 });
    const utiliser = comprime.length < brut.length;
    const donnees = utiliser ? comprime : brut;
    const crc = crc32Octets(brut);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(utiliser ? 8 : 0, 8);
    local.writeUInt16LE(0, 10); local.writeUInt16LE(0x21, 12);   /* date : 1980-01-01 (déterminisme : un même contenu donne un même paquet) */
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(donnees.length, 18); local.writeUInt32LE(brut.length, 22); local.writeUInt16LE(nom.length, 26); local.writeUInt16LE(0, 28);
    locaux.push(local, nom, donnees);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(utiliser ? 8 : 0, 10);
    central.writeUInt16LE(0, 12); central.writeUInt16LE(0x21, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(donnees.length, 20); central.writeUInt32LE(brut.length, 24);
    central.writeUInt16LE(nom.length, 28); central.writeUInt32LE(decalage, 42);
    centraux.push(central, nom);
    decalage += 30 + nom.length + donnees.length;
  }
  const centralTaille = centraux.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(entrees.length, 8); fin.writeUInt16LE(entrees.length, 10); fin.writeUInt32LE(centralTaille, 12); fin.writeUInt32LE(decalage, 16);
  return Buffer.concat([...locaux, ...centraux, fin]);
}

/* Buffer -> [{ nom, donnees }] ; vérifie la taille et le CRC de chaque entrée ; refuse tout nom qui sortirait du dossier de destination. */
export function lireZip(tampon) {
  let fin = -1;
  for (let i = tampon.length - 22; i >= Math.max(0, tampon.length - 65557); i -= 1) { if (tampon.readUInt32LE(i) === 0x06054b50) { fin = i; break; } }
  if (fin < 0) throw new Error("ZIP_INVALIDE");
  const nb = tampon.readUInt16LE(fin + 10);
  let p = tampon.readUInt32LE(fin + 16);
  const sortie = [];
  for (let n = 0; n < nb; n += 1) {
    if (tampon.readUInt32LE(p) !== 0x02014b50) throw new Error("ZIP_INVALIDE");
    const methode = tampon.readUInt16LE(p + 10), crc = tampon.readUInt32LE(p + 16), taille = tampon.readUInt32LE(p + 24);
    const lnom = tampon.readUInt16LE(p + 28), lextra = tampon.readUInt16LE(p + 30), lcom = tampon.readUInt16LE(p + 32), decalage = tampon.readUInt32LE(p + 42);
    const nom = tampon.toString("utf8", p + 46, p + 46 + lnom);
    p += 46 + lnom + lextra + lcom;
    if (nom.endsWith("/")) continue;
    if (!nom || nom.startsWith("/") || nom.includes("\\") || nom.split("/").some((s) => s === ".." || s === "") || /^[A-Za-z]:/.test(nom)) throw new Error("ZIP_NOM_REFUSE:" + nom);
    if (tampon.readUInt32LE(decalage) !== 0x04034b50) throw new Error("ZIP_INVALIDE");
    const debut = decalage + 30 + tampon.readUInt16LE(decalage + 26) + tampon.readUInt16LE(decalage + 28);
    const comprimeTaille = tampon.readUInt32LE(decalage + 18);
    const bloc = tampon.subarray(debut, debut + comprimeTaille);
    const donnees = methode === 8 ? zlib.inflateRawSync(bloc) : methode === 0 ? Buffer.from(bloc) : null;
    if (!donnees) throw new Error("ZIP_METHODE_INCONNUE");
    if (donnees.length !== taille || crc32Octets(donnees) !== crc) throw new Error("ZIP_CORROMPU:" + nom);
    sortie.push({ nom, donnees });
  }
  return sortie;
}
