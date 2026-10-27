import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-27) : lancer un défi fait un Rebirth ; l'arrivée doit être la même (bruit de machine à voyager, borne d'arcade, page sous la bannière). */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("payload.action==='challenge'&&payload.mode==='start'&&res.resultat&&res.resultat.started"), "détecte le lancement réussi d'un défi");
assert.ok(meta.includes("regDefi.idleMenuActifV28='combat'") && meta.includes("regDefi.sauverMenuIdleV28_()"), "le menu Combat (borne) est ouvert");
assert.ok(meta.includes("toutEnHautDefi") && meta.includes("ban.getBoundingClientRect().bottom"), "page placée sous la bannière comme après un Rebirth");
const defis = readFileSync("cloudflare/public/modules/defis-page-v1.js", "utf8");
assert.ok(defis.includes("jouerEffetAudioIdleV199_('timeMachine')"), "même bruit que le Rebirth");
console.log("idle-defi-arrivee-rebirth-v1: OK");
