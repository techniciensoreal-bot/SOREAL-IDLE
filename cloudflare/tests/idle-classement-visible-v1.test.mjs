import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « J'aimerai ne pas apparaitre dans le classement pour les autres. Uniquement moi. Et
 * avoir une case dans parametres pour pouvoir apparaitre ou disparaitre. J'ai un trop haut niveau et je ne veux
 * pas décourager les autres joueurs. »
 *
 * Préférence personnelle (jamais réservée à l'administrateur, contrairement à accesOuvert/accesPublic) : voir
 * idle-leaderboard-v1.test.mjs pour le comportement serveur (filtrage, toujours visible de soi-même).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. La case n'apparaît QUE si le classement est débloqué pour ce joueur (anti-spoil : jamais un indice du
//    système à quelqu'un qui ne l'a pas encore).
{
  const start = ui.indexOf("htmlProfilPseudoIdleV1_(j)+");
  const end = ui.indexOf("(j&&j.reglages", start);
  const bloc = ui.slice(start, end);
  assert.ok(bloc.includes("j&&j.classement&&j.classement.debloque"), "la case ne doit apparaître que si le classement est débloqué");
  assert.ok(bloc.includes("Apparaître dans le classement pour les autres joueurs"));
  assert.match(bloc, /type="checkbox"\s+'\+\(j\.classement\.visible!==false\?'checked '/, "cochée par défaut (visible), reflète l'état serveur");
  assert.ok(bloc.includes("onchange=\"window.__basculerClassementVisibleIdleV1__(this.checked)\""));
}

// 2. Le gestionnaire appelle la bonne opération serveur et met à jour l'état local sans reconstruire toute la page
//    en cas de succès (la case affiche déjà, nativement, ce que le joueur vient de cocher/décocher).
{
  const start = ui.indexOf("function basculerClassementVisibleIdleV1_(");
  const end = ui.indexOf("window.__basculerClassementVisibleIdleV1__=", start);
  const fn = ui.slice(start, end);
  assert.ok(start >= 0, "basculerClassementVisibleIdleV1_ doit exister");
  assert.ok(fn.includes(".definirClassementVisibleSorealIdle(SOREAL_SESSION,Boolean(voulu));"), "doit appeler la bonne opération serveur");
  assert.ok(fn.includes("idleEtat.classement.visible=Boolean(res.classementVisible);"), "doit refléter la valeur confirmée par le serveur");
  assert.ok(
    fn.includes("if(root&&idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();"),
    "en cas d'échec seulement, la case doit revenir à l'état serveur réel (rendu protégé, sans saut)"
  );
}

// 3. L'opération existe côté serveur et fait partie du contrat public (voir idle-protocol-contract.test.mjs pour
//    l'égalité exacte avec IDLE_OPERATIONS).
{
  const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  assert.ok(runtime.includes("function definirClassementVisibleSorealIdle("), "l'opération serveur doit exister");
  assert.ok(runtime.includes("definirClassementVisibleSorealIdle\n};") || runtime.includes("definirClassementVisibleSorealIdle,"), "doit être exposée dans IDLE_OPERATIONS");
  const contract = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));
  assert.ok(contract.operations.includes("definirClassementVisibleSorealIdle"), "doit être listée dans le contrat machine-readable");
}

console.log("idle-classement-visible-v1: OK");
