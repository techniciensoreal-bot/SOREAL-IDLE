import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import vm from "node:vm";
import { DatabaseSync } from "node:sqlite";
import {
  idleBadavatarValiderPiecesV1, idleBadavatarValiderImageV1, idleBadavatarEnregistrerV1, idleBadavatarLireV1, idleBadavatarListePubliqueV1,
  idleBadavatarReinitialiserV1, idleBadavatarReinitialiserParNomV1, idleBadavatarPhotoV1, idleBadavatarCleNomV1, IDLE_BADAVATAR_PIECES_V1, IDLE_BADAVATAR_PHOTO_MAX_V1
} from "../src/idle-profil-badavatar-v1.js";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";

/* Profil de badavatar (Réglages > Profil, 2026-11-01) : validation stricte côté serveur, écriture réservée au propriétaire, liste publique sans adresse e-mail, rendu partagé avec l'ITOPOD. */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };

/* ---- pièces : liste fixe, bornes, visible obligatoire ---- */
const bonne = { visible: true, dx: 0.05, dy: -0.05, k: 1.2, rot: 3 };
assert.deepEqual([...IDLE_BADAVATAR_PIECES_V1].sort(), ["Barbe", "Bouche", "Cheveux", "Nez", "Oreille_Droite", "Oreille_Gauche", "Yeux"]);
assert.equal(idleBadavatarValiderPiecesV1({ Nez: bonne }).ok, true);
assert.equal(idleBadavatarValiderPiecesV1({ Chapeau: bonne }).code, "BADAVATAR_PIECE_INCONNUE", "une pièce inconnue est refusée (on ne choisit pas d'autres éléments)");
assert.equal(idleBadavatarValiderPiecesV1({ Vetements: bonne }).ok, false);
assert.equal(idleBadavatarValiderPiecesV1({ Nez: { ...bonne, visible: "oui" } }).code, "BADAVATAR_VISIBLE");
for (const [champ, valeur] of [["dx", 0.6], ["dy", -0.6], ["k", 5], ["k", 0.1], ["rot", 181], ["rot", -181], ["dx", NaN], ["k", "1"], ["dy", Infinity]]) {
  assert.equal(idleBadavatarValiderPiecesV1({ Nez: { ...bonne, [champ]: valeur } }).ok, false, "hors bornes refusé : " + champ + "=" + valeur);
}
assert.equal(idleBadavatarValiderPiecesV1([]).ok, false);
assert.equal(idleBadavatarValiderPiecesV1({ Nez: null }).ok, false);

/* ---- image : webp / png réels seulement, taille bornée, jamais de SVG ni de HTML ---- */
const webp = "data:image/webp;base64," + Buffer.concat([Buffer.from("RIFF"), Buffer.from([40, 0, 0, 0]), Buffer.from("WEBPVP8 "), Buffer.alloc(60, 1)]).toString("base64");
const png = "data:image/png;base64," + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(60, 2)]).toString("base64");
assert.equal(idleBadavatarValiderImageV1(webp).ok, true);
assert.equal(idleBadavatarValiderImageV1(png).ok, true);
assert.equal(idleBadavatarValiderImageV1("data:image/svg+xml;base64," + Buffer.from("<svg onload=alert(1)>").toString("base64").padEnd(100, "A")).code, "BADAVATAR_PHOTO_TYPE");
assert.equal(idleBadavatarValiderImageV1("data:text/html;base64,PGh0bWw+").ok, false);
assert.equal(idleBadavatarValiderImageV1(png.replace("image/png", "image/webp")).ok, false, "le type annoncé doit être celui du fichier");
assert.equal(idleBadavatarValiderImageV1("data:image/webp;base64," + "A".repeat(IDLE_BADAVATAR_PHOTO_MAX_V1)).code, "BADAVATAR_PHOTO_GROSSE");
assert.equal(idleBadavatarValiderImageV1("https://exemple.test/x.webp").ok, false);
assert.equal(idleBadavatarValiderImageV1(null).ok, false);

/* ---- enregistrement : base fixée par le serveur au premier enregistrement, jamais par le client ---- */
const placement = { visible: true, x: 0.1, y: -0.1, k: 1, rot: 0 };
let r = idleBadavatarEnregistrerV1(sql, "A@x.fr", idleBadavatarCleNomV1("Alice"), { pieces: { Nez: bonne, Yeux: { ...bonne, visible: false } }, cat: "1", photo: { ...placement, image: webp } }, 1000);
assert.equal(r.ok, true);
assert.equal(r.profil.base, "alice");
assert.equal(r.profil.pieces.Yeux.visible, false, "une pièce masquée reste masquée");
assert.equal(r.profil.photo.v, 1000);
assert.ok(!("image" in r.profil.photo), "la lecture publique ne porte pas l'image");
/* le joueur change de pseudo : même badavatar (base inchangée), nouveau nom dans la liste */
r = idleBadavatarEnregistrerV1(sql, "a@x.fr", "alicia", { pieces: { Nez: bonne }, cat: "1", photo: { ...placement, garder: true } }, 2000);
assert.equal(r.ok, true);
assert.equal(r.profil.base, "alice", "le badavatar désigné ne change pas avec le pseudo");
assert.equal(r.profil.nomCle, "alicia");
assert.equal(r.profil.photo.v, 2000);
assert.equal(idleBadavatarEnregistrerV1(sql, "a@x.fr", "alicia", { pieces: { Nez: bonne }, photo: { ...placement, x: 5 } }).code, "BADAVATAR_BORNES");
assert.equal(idleBadavatarEnregistrerV1(sql, "b@x.fr", "bob", { pieces: { Nez: bonne }, photo: { ...placement, garder: true } }).code, "BADAVATAR_PHOTO_ABSENTE", "garder une image qui n'existe pas est refusé");
assert.equal(idleBadavatarEnregistrerV1(sql, "b@x.fr", "bob", { pieces: { Nez: bonne }, photo: { ...placement, image: "data:image/webp;base64,xx" } }).ok, false);
assert.equal(idleBadavatarLireV1(sql, "b@x.fr"), null, "un enregistrement refusé n'écrit rien");
/* photo retirée */
r = idleBadavatarEnregistrerV1(sql, "a@x.fr", "alicia", { pieces: { Nez: bonne }, cat: "1", photo: null }, 3000);
assert.equal(r.profil.photo, null);
assert.equal(idleBadavatarPhotoV1(sql, "alicia"), null);
idleBadavatarEnregistrerV1(sql, "a@x.fr", "alicia", { pieces: { Nez: bonne }, cat: "1", photo: { ...placement, image: png } }, 4000);
const img = idleBadavatarPhotoV1(sql, "Alicia");
assert.equal(img.type, "image/png");
assert.equal(img.octets[1], 0x50);

/* ---- liste publique : pas d'adresse e-mail, pas d'image ; réinitialisation (joueur, administrateur) ---- */
const pub = idleBadavatarListePubliqueV1(sql);
assert.deepEqual(Object.keys(pub), ["alicia"]);
assert.ok(!JSON.stringify(pub).includes("@") && !JSON.stringify(pub).includes("data:image"));
assert.equal(idleBadavatarReinitialiserParNomV1(sql, "ALICIA").supprimes, 1);
assert.deepEqual(idleBadavatarListePubliqueV1(sql), {});
idleBadavatarEnregistrerV1(sql, "a@x.fr", "alicia", { pieces: { Nez: bonne }, cat: "1" });
assert.equal(idleBadavatarReinitialiserV1(sql, "a@x.fr").ok, true);
assert.equal(idleBadavatarLireV1(sql, "a@x.fr"), null);
assert.equal(idleBadavatarCleNomV1("  Élodie   Dupont "), "elodie dupont", "même normalisation que le client (nomNormalise)");

/* ---- écriture réservée au propriétaire : par le coordinateur, avec de vraies sessions ---- */
const dbc = new DatabaseSync(":memory:");
const sqlc = { exec(q, ...b) { const st = dbc.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
dbc.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql: sqlc } }, {});
/* Audit 2026-11-14 : l'écriture d'un profil exige le droit de jouer (accès public ouvert pour ces comptes Google de test). */
sqlc.exec("CREATE TABLE IF NOT EXISTS idle_meta(meta_key TEXT PRIMARY KEY, meta_value TEXT)");
sqlc.exec("INSERT OR REPLACE INTO idle_meta(meta_key,meta_value) VALUES('acces_public','1')");
const appel = async (chemin, corps) => { const rep = await coord.internal(new Request("https://soreal-idle.invalid" + chemin, { method: "POST", body: JSON.stringify(corps) }), new URL("https://soreal-idle.invalid" + chemin)); return rep.headers.get("content-type").includes("json") ? rep.json() : rep; };
const tA = coord.createGoogleSessionV1({ email: "alice@soreal.test", nom: "Alice Martin" }).sessionToken, tB = coord.createGoogleSessionV1({ email: "bob@soreal.test", nom: "Bob Durand" }).sessionToken;
assert.equal((await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: "faux", action: "enregistrer", pieces: { Nez: bonne } })).ok, false, "sans session valide : refusé");
assert.equal((await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: "", action: "enregistrer", pieces: { Nez: bonne } })).ok, false);
sqlc.exec("UPDATE idle_meta SET meta_value='0' WHERE meta_key='acces_public'");
assert.equal((await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: tA, action: "enregistrer", pieces: { Nez: bonne } })).error, "SOREAL_IDLE_ACCES_REFUSE", "sans droit de jouer : aucun profil écrit");
assert.equal((await appel("/__soreal-idle-v1/local-textes", { sessionToken: tA })).error, "SOREAL_IDLE_ACCES_REFUSE", "sans droit de jouer : pas de textes d'administrateur");
sqlc.exec("UPDATE idle_meta SET meta_value='1' WHERE meta_key='acces_public'");
let moi = await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: tA, action: "lire" });
assert.equal(moi.ok, true); assert.equal(moi.nomCle, "alice"); assert.equal(moi.profil, null);
assert.equal((await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: tA, action: "enregistrer", pieces: { Nez: bonne }, cat: "1" })).ok, true);
assert.equal((await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: tA, action: "enregistrer", pieces: { Chapeau: bonne } })).ok, false);
/* Bob ne peut ni lire ni modifier le profil d'Alice : chaque jeton ne touche que son propre compte, et le nom n'est jamais pris dans la requête */
const bobEcrit = await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: tB, action: "enregistrer", pieces: { Nez: { ...bonne, dx: -0.1 } }, cat: "1", email: "alice@soreal.test", nomCle: "alice", base: "alice", nom: "Alice" });
assert.equal(bobEcrit.profil.nomCle, "bob"); assert.equal(bobEcrit.profil.base, "bob");
const pubC = (await appel("/__soreal-idle-v1/badavatar-publics", {})).profils;
assert.equal(pubC.alice.pieces.Nez.dx, 0.05, "le profil d'Alice n'a pas bougé");
assert.equal(pubC.bob.pieces.Nez.dx, -0.1);
assert.equal((await appel("/__soreal-idle-v1/badavatar-moi", { sessionToken: tB, action: "reinitialiser" })).ok, true);
assert.equal(Object.keys((await appel("/__soreal-idle-v1/badavatar-publics", {})).profils).join(), "alice", "la réinitialisation ne touche que son propre profil");
assert.equal((await appel("/__soreal-idle-v1/badavatar-photo", { nom: "alice" })).status, 404, "pas de visage enregistré : 404");

/* ---- routes du Worker : jeton exigé, administrateur pour la réinitialisation d'un nom, corps borné ---- */
const entree = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");
const bloc = entree.slice(entree.indexOf('url.pathname === "/api/v1/profil-badavatar"'), entree.indexOf('url.pathname === "/api/v1/local/export"'));
assert.ok(/idleBearerV1\(request\)/.test(bloc) && /LAUNCH_TICKET_REQUIRED/.test(bloc), "jeton de session exigé");
assert.ok(/admin-reinitialiser[\s\S]*idleEstAdminV1/.test(bloc), "la réinitialisation d'un nom est réservée à l'administrateur");
assert.ok(/idleLireJsonBorneV1\(request, 160000\)/.test(bloc) && /idleLimiteDepasseeV1/.test(bloc), "corps borné et débit limité");
assert.ok(!/corps\.(email|nom|base|nomCle)\b/.test(bloc.replace(/corps\.nom\b(?=\s*\}\s*\)\s*\}\);\s*\n\s*\}\n\s*const action)/, "")) || /admin-reinitialiser/.test(bloc), "le nom ne vient jamais du client pour une écriture");
assert.ok(/content-security-policy": "sandbox"/.test(entree) && /x-content-type-options": "nosniff"/.test(entree), "l'image du visage est servie en sandbox + nosniff");
const liaison = readFileSync("desktop/src/liaison.mjs", "utf8");
assert.ok(liaison.includes('"/api/v1/profil-badavatar"'), "l'exe relié transmet l'écriture du profil au serveur");

/* ---- client : même rendu que l'ITOPOD ---- */
const fenetre = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-catalogue-v1.js", "utf8"), { window: fenetre });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-badavatars-v1.js", "utf8"), { window: fenetre, Math, String, Object });
const B = fenetre.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__;
const d0 = B.tirerPourNom("Norman");
const h0 = B.rendreHtml(d0, {});
const reference = readFileSync("cloudflare/public/modules/itopod-badavatars-v1.js", "utf8");
assert.equal(JSON.stringify(B.appliquerProfil(d0, null)), JSON.stringify({ version: d0.version, gender: d0.gender, body: d0.body, parts: Object.fromEntries(Object.entries(d0.parts).map(([c, p]) => [c, { key: p.key, x: p.x, y: p.y, scale: p.scale, rotation: p.rotation, order: p.order, flip: p.flip }])) }), "sans réglage : le badavatar désigné, inchangé");
assert.equal(B.rendreHtml(B.appliquerProfil(d0, { pieces: {} }), {}), h0, "un profil vide donne exactement le même rendu que sans profil");
const modif = B.appliquerProfil(d0, { pieces: { Nez: { visible: true, dx: 0.1, dy: 0.05, k: 1.5, rot: 0 }, Bouche: { visible: false } } });
assert.ok(!modif.parts.Bouche, "pièce masquée : absente du rendu");
assert.ok(Math.abs(modif.parts.Nez.x - (d0.parts.Nez.x + 0.1)) < 1e-3 && Math.abs(modif.parts.Nez.scale - d0.parts.Nez.scale * 1.5) < 1e-3 && Math.abs(modif.parts.Nez.rotation - (d0.parts.Nez.rotation + 0)) < 1e-2);
assert.equal(B.appliquerProfil(d0, { pieces: { Nez: { visible: true, dx: 9, dy: 0, k: 99, rot: 0 } } }).parts.Nez.x, B.appliquerProfil(d0, { pieces: { Nez: { visible: true, dx: 0.5, dy: 0, k: 4, rot: 0 } } }).parts.Nez.x, "le client borne comme le serveur");
assert.ok(!Object.keys(modif.parts).some((c) => !Object.keys(d0.parts).includes(c)), "aucune pièce de plus que celles du badavatar désigné");
const hv = B.rendreHtml(d0, { photo: { url: "/api/idle/media/badavatar-photo?nom=norman&v=1", visible: true, x: 0, y: 0, k: 1, rot: 0 } });
assert.ok(hv.includes('data-visage="1"') && hv.indexOf("data-visage") < hv.indexOf("data-piece"), "le visage est posé sous les pièces (elles restent affichées par-dessus)");
assert.ok(!B.rendreHtml(d0, { photo: { url: "/x", visible: false } }).includes("data-visage"), "visage masqué : absent");
assert.ok(hv.includes("data-piece=\"Yeux\"") && hv.includes("data-piece=\"Bouche\""), "avec un visage, les pièces du badavatar restent affichées");
const boite = B.boiteVisage(d0, { x: 0, y: 0, k: 1, rot: 0 }), tete = B.corpsEntree(d0);
assert.equal(Math.round(boite.cote), Math.round(1.5 * tete[3]), "côté du visage = 1,5 largeur de tête (même convention que le détourage)");
/* mise à jour en place : mêmes pièces -> true ; pièces différentes -> false (redessin complet) */
const elementsImg = [{ n: "Cheveux" }];
const racineFaux = { querySelector(s) { return s === ".itopod-badavatar-pile" ? { querySelectorAll: (q) => q === "img[data-piece]" ? elementsImg.map((e) => ({ getAttribute: () => e.n, style: {} })) : [], querySelector: () => null, style: {} } : null; } };
assert.equal(B.miseAJour(racineFaux, d0, {}), false, "pièces différentes : il faut redessiner");

/* ---- profil enregistré -> design (profil-badavatar-v1.js) ---- */
const f2 = { __SOREAL_IDLE_ITOPOD_BADAVATARS_V1__: B };
vm.runInNewContext(readFileSync("cloudflare/public/modules/profil-badavatar-v1.js", "utf8"), { window: f2, document: { dispatchEvent() {} }, fetch: async () => ({ ok: false }), Date, JSON, Event: class {}, encodeURIComponent, sessionStorage: {}, localStorage: {}, String, Math });
const PB = f2.__SOREAL_IDLE_PROFIL_BADAVATAR_V1__;
const p = PB.preparer("norman", { base: "norman", cat: String(B.versionCatalogue), pieces: { Nez: { visible: true, dx: 0.1, dy: 0, k: 1, rot: 0 } }, photo: { v: 7, visible: true, x: 0, y: 0, k: 1, rot: 0 } });
assert.ok(p.design.parts.Nez.x > d0.parts.Nez.x && p.photo.url.includes("v=7") && p.photo.url.includes("nom=norman"));
assert.equal(PB.preparer("norman", { base: "norman", cat: "999", pieces: {} }), null, "catalogue changé depuis l'enregistrement : badavatar désigné par défaut");
assert.equal(PB.pour("Personne"), null, "sans profil enregistré : comportement inchangé");

/* ---- sources : branchements et règles d'architecture ---- */
const lire = (f) => readFileSync("cloudflare/public/modules/" + f, "utf8");
const scene = lire("itopod-scene-v1.js"), editeur = lire("profil-badavatar-editeur-v1.js"), reglages = lire("ui-reglages-v1.js"), visage = lire("profil-visage-v1.js"), index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/PB\.pour\(ennemi\.nom\)/.test(scene) && /soreal-profils-badavatar/.test(scene), "l'ITOPOD affiche le profil enregistré de l'ennemi");
assert.ok(/id:'profil'/.test(reglages) && /profilBadavEditeurV1/.test(reglages), "Réglages > Profil");
for (const f of ["profil-badavatar-v1.js", "profil-visage-v1.js", "profil-badavatar-editeur-v1.js"]) assert.ok(index.includes("/modules/" + f + "?v="), f + " est chargé par index.html");
assert.ok(/data-profil-badavatar-editeur/.test(editeur) && /__SOREAL_IDLE_APRES_REDESSIN_V1__/.test(editeur), "règle n°4 : nœud persistant rattaché après chaque redessin");
assert.ok(/touch-action:none/.test(editeur) && /pointerdown/.test(editeur) && /setPointerCapture/.test(editeur), "glisser à la souris ET au doigt");
assert.ok(editeur.includes("soreal_idle_profil_badavatar_brouillon_v1"), "règle n°6 : brouillon sous une clé soreal_idle_");
assert.ok(!/setInterval/.test(editeur + visage), "aucune minuterie récurrente");
for (const [nom, src] of [["editeur", editeur], ["visage", visage], ["profil", lire("profil-badavatar-v1.js")]]) {
  assert.ok(!/!important/.test(src), nom + " : aucun !important");
  assert.ok(!/wiki/i.test(src), nom + " : jamais « wiki » dans un texte joueur");
}
/* anti-spoil : l'éditeur ne montre que les pièces du badavatar du joueur (jamais le catalogue entier ni un total) */
assert.ok(/Object\.keys\(E\.design\.parts\)\.map\(function \(c\) \{ return ligneHtml/.test(editeur) && !/catalogue\.parts/.test(editeur), "seules les pièces du badavatar désigné sont listées");
assert.ok(!/["'] ?\/ ?["']/.test(editeur), "aucun total « x / y » affiché");
/* vie privée : l'original ne quitte jamais la page ; consentement visible ; formulation neutre (le visage est facultatif) */
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(visage), "le module de détourage n'envoie rien");
assert.ok(visage.includes("Cette image sera visible par les autres joueurs.") && editeur.includes("Cette image sera visible par les autres joueurs."));
assert.ok(!/ton visage|ma photo|mon visage\b(?! personnalisé)/i.test(editeur.replace(/Mon visage personnalisé/g, "") + visage.replace(/\/\*[\s\S]*?\*\//g, "")), "formulation neutre : jamais « ton visage » ni « ma photo »");
assert.ok(/Ajouter un visage \(photo, personnage…\)/.test(editeur) && /Retirer le visage/.test(editeur));
/* modèle embarqué (Apache-2.0), chargé à la demande seulement */
assert.ok(!/mediapipe/.test(index), "le modèle n'est jamais chargé au démarrage du jeu");
const dossier = "cloudflare/public/modules/mediapipe-1.2.0/";
assert.ok(statSync(dossier + "selfie_segmenter.tflite").size > 100000 && statSync(dossier + "wasm/vision_wasm_internal.wasm").size > 1e6);
assert.ok(readdirSync(dossier).includes("LICENCE.txt") && /Apache License/.test(readFileSync(dossier + "LICENCE.txt", "utf8")));
assert.ok(/mjs: "text\/javascript/.test(readFileSync("cloudflare/local/sw-android.js", "utf8")), "l'APK sert le module .mjs avec le bon type");
/* ---- agrandissement du visage (retour de Norman : « on doit pouvoir agrandir l'image ») ---- */
const grand = (extra) => idleBadavatarEnregistrerV1(sql, "z@x.fr", "zoe", { pieces: { Nez: bonne }, cat: "1", photo: { ...placement, image: png, ...extra } }, 5000);
assert.equal(grand({ k: 4 }).ok, true, "taille jusqu'à 4");
assert.equal(grand({ k: 0.3 }).ok, true, "taille à partir de 0,3");
assert.equal(grand({ k: 4.5 }).code, "BADAVATAR_BORNES", "au-delà de 4 : refusé (résultat absurde)");
assert.equal(grand({ k: 0.2 }).code, "BADAVATAR_BORNES");
assert.equal(grand({ x: 1, y: -1 }).ok, true, "décalage de plusieurs largeurs de tête (toute la scène)");
assert.equal(grand({ x: 4.5 }).code, "BADAVATAR_BORNES", "décalage hors scène refusé");
assert.equal(grand({ k: NaN }).ok, false);
assert.equal(grand({ k: "4" }).ok, false);
assert.equal(idleBadavatarValiderPiecesV1({ Nez: { ...bonne, k: 4.5 } }).ok, false, "les PIÈCES : taille de 0,3 à 4");
const big = "data:image/webp;base64," + Buffer.concat([Buffer.from("RIFF"), Buffer.from([40, 0, 0, 0]), Buffer.from("WEBPVP8 "), Buffer.alloc(70000, 3)]).toString("base64");
assert.ok(big.length > 64000 && big.length <= IDLE_BADAVATAR_PHOTO_MAX_V1 && idleBadavatarValiderImageV1(big).ok, "une image de 384 px (environ 70 Ko) est acceptée");
assert.equal(IDLE_BADAVATAR_PHOTO_MAX_V1, 100000);
assert.ok(Math.abs(B.bornes.photoK[0] - 0.3) < 1e-9 && B.bornes.photoK[1] === 4 && B.bornes.photoX[1] === 4, "mêmes bornes côté client et serveur");
const grosVisage = B.boiteVisage(d0, { x: 0, y: 0, k: 9, rot: 0 }), maxVisage = B.boiteVisage(d0, { x: 0, y: 0, k: 4, rot: 0 });
assert.equal(grosVisage.cote, maxVisage.cote, "le client borne aussi la taille du visage");
const ed2 = editeur, vi2 = visage;
assert.ok(/data-poignee/.test(ed2) && /redimensionner/.test(ed2), "poignée de coin pour redimensionner");
assert.ok(ed2.includes('addEventListener("wheel"') && /pincement/.test(ed2), "molette et pincement sur l'aperçu");
assert.ok(/Agrandir l’aperçu/.test(ed2) && /pbe-plein/.test(ed2) && /Fermer l’aperçu/.test(ed2), "aperçu agrandi");
assert.ok(vi2.includes('addEventListener("wheel"') && /pvzZoom/.test(vi2) && vi2.includes('geste.type === "pince"'), "zoom de la photo source : curseur, molette, pincement");
assert.ok(/TAILLE = 384/.test(vi2), "visage stocké à 384 px");
/* ---- tête réglable en largeur et en hauteur (kx, ky), comme un élément du badavatar ---- */
assert.equal(grand({ k: 2, kx: 2, ky: 0.5 }).ok, true, "largeur x2 et hauteur x0,5 : tête étirée acceptée");
assert.equal(grand({ k: 2, kx: 2.1 }).code, "BADAVATAR_BORNES", "taille réelle de la largeur (k x kx) au-delà de 4 : refusée");
assert.equal(grand({ k: 4, ky: 1.1 }).code, "BADAVATAR_BORNES", "taille réelle de la hauteur au-delà de 4 : refusée");
assert.equal(grand({ k: 0.5, kx: 0.4 }).code, "BADAVATAR_BORNES", "tête quasi invisible : refusée");
assert.equal(grand({ kx: 0.3 }).code, "BADAVATAR_BORNES");
assert.equal(grand({ ky: 2.6 }).code, "BADAVATAR_BORNES");
assert.equal(grand({ kx: "2" }).ok, false);
assert.equal(grand({ ky: NaN }).ok, false);
const sansKx = idleBadavatarEnregistrerV1(sql, "z@x.fr", "zoe", { pieces: { Nez: bonne }, cat: "1", photo: { ...placement, image: png } }, 6000);
assert.equal(sansKx.profil.photo.kx, 1, "ancien profil sans kx / ky : 1 (compatibilité)");
assert.equal(sansKx.profil.photo.ky, 1);
const etire = grand({ k: 1.5, kx: 1.2, ky: 0.8 });
assert.equal(etire.profil.photo.kx, 1.2); assert.equal(etire.profil.photo.ky, 0.8); assert.equal(etire.profil.photo.k, 1.5);
const be = B.boiteVisage(d0, { x: 0, y: 0, k: 1, kx: 2, ky: 0.5, rot: 0 });
assert.ok(Math.abs(be.cw / be.ch - 4) < 1e-6, "largeur et hauteur indépendantes");
assert.equal(Math.round(be.cw), Math.round(2 * 1.5 * tete[3]));
const hs = B.rendreHtml(d0, { photo: { url: "/x.webp", visible: true, x: 0, y: 0, k: 1, kx: 2, ky: 0.5, rot: 0 } });
const lg = /data-visage="1"[^>]*width:([\d.]+)%;height:([\d.]+)%/.exec(hs);
assert.ok(lg && Number(lg[1]) * 480 / (Number(lg[2]) * 640) > 3.9, "rendu étiré : largeur 4 fois la hauteur en pixels");
assert.ok(Math.abs(B.boiteVisage(d0, { x: 0, y: 0, k: 4, kx: 2.5, ky: 1, rot: 0 }).cw - B.boiteVisage(d0, { x: 0, y: 0, k: 4, kx: 1, ky: 1, rot: 0 }).cw) < 1e-6, "le client borne aussi k x kx");
assert.ok(editeur.includes('"Largeur", "kx"') && editeur.includes('"Hauteur", "ky"') && editeur.includes("Position verticale") && editeur.includes("Position horizontale") && editeur.includes("Garder les proportions"), "réglages de la tête : largeur, hauteur, positions, proportions");
assert.ok(editeur.includes("libre = E.sel === \"visage\" && !E.verrou"), "poignée libre quand les proportions sont déverrouillées");
const ordre = editeur.slice(editeur.indexOf("  function construire() {"));
assert.ok(ordre.indexOf("visageBlocHtml() +") < ordre.indexOf("'<div class=\"pbe-liste\">'"), "avec un visage : la tête d'abord, puis la liste des éléments");
assert.ok(editeur.includes("Coche les éléments que tu gardes, décoche ceux que tu masques."), "section Éléments : garder ou masquer chaque pièce sans la sélectionner");
assert.ok(/data-visible="' \+ esc\(cle\)/.test(editeur), "une case Afficher par pièce");
/* l'ITOPOD respecte les pièces masquées : le profil enregistré passe par appliquerProfil */
assert.ok(!PB.preparer("norman", { base: "norman", cat: String(B.versionCatalogue), pieces: { Barbe: { visible: false, dx: 0, dy: 0, k: 1, rot: 0 }, Yeux: { visible: false, dx: 0, dy: 0, k: 1, rot: 0 } } }).design.parts.Yeux, "pièce masquée absente chez les autres joueurs");
console.log("idle-profil-badavatar-v1: ok");
