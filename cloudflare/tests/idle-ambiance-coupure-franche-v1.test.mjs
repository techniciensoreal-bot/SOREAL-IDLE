import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-05) : « j'ai désactivé le son d'ambiance mais il ne se retire pas ». Sur iPhone / iPad le navigateur ignore audio.volume, et un fondu en cours remettait l'ancien volume : la case « Ambiance »
 * décochée doit COUPER (muted, respecté partout) et annuler tout fondu en cours ; recochée, le son revient.
 */
const amb = readFileSync("cloudflare/public/modules/ambient-audio-v1.js", "utf8");
assert.ok(amb.includes("audio.__fonduIdV1!==id"), "un fondu annulé ne touche plus au volume");
assert.ok(amb.includes("slot.audio.__fonduIdV1=(slot.audio.__fonduIdV1||0)+1;") && amb.includes("slot.audio.muted=!(v>0)"), "changement de réglage : fondu annulé et piste coupée (muted)");
assert.ok(amb.includes("audio.muted=!(volumeAmbiance_()>0)"), "une nouvelle piste démarre coupée si la case est décochée");
const musique = readFileSync("cloudflare/public/modules/shop-music-v1.js", "utf8");
assert.equal(musique.split("m.audio.muted=!(volume_()>0)").length - 1, 3, "musiques de menu : coupées à la création, au battement et au changement de réglage");

// Comportement : un faux élément audio avec fondu en cours.
const fenetre = { __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getAmbiance: () => 0, onChange() {} }, addEventListener() {}, AudioContext: undefined };
const fonduSrc = amb.slice(amb.indexOf("function fondu_(audio,cible,duree){"), amb.indexOf("/* Rampe douce du GainNode"));
let rafs = [];
const fondu = new Function("requestAnimationFrame", "Date", fonduSrc + "; return fondu_;")((fn) => rafs.push(fn), { now: () => 0 });
const audio = { volume: 0.2, paused: false };
fondu(audio, 0.75, 800);           // fondu vers l'ancien volume
audio.__fonduIdV1 += 1;             // changement de réglage : annulé
audio.volume = 0;
const suite = rafs.splice(0);
suite.forEach((fn) => fn());
assert.equal(audio.volume, 0, "le fondu annulé ne remonte pas le volume");
console.log("idle-ambiance-coupure-franche-v1: OK");
