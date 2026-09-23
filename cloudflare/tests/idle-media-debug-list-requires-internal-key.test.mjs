import assert from "node:assert/strict";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

/*
 * 2026-09-23 (audit de sécurité, 3 dépôts) : /api/idle/media/debug-list
 * énumérait jusqu'à 5000 clés R2 (noms + tailles) sous n'importe quel
 * préfixe "idle/" sans la moindre authentification -- accessible à
 * quiconque sur Internet. Aucun appelant frontend (recherche exhaustive
 * dans SOREAL-IDLE et SOREAL-APP, qui héberge une copie identique de ce
 * fichier) : pur outil de diagnostic manuel.
 *
 * Fix : même clé interne que idleCallV1 (idle-worker-entry-v1.js),
 * SOREAL_IDLE_INTERNAL_KEY / header x-soreal-idle-internal-key.
 */

const env={SOREAL_IDLE_INTERNAL_KEY:"test-only-internal-key-v1"};

// --- Sans clé : refusé, jamais un listing ---
{
  const response=await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/debug-list?prefix=idle/"),
    env
  );
  assert.equal(response.status,401,"Sans clé interne, la route doit refuser (401), jamais lister le bucket.");
}

// --- Mauvaise clé : refusé ---
{
  const response=await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/debug-list?prefix=idle/",{
      headers:{"x-soreal-idle-internal-key":"mauvaise-cle"}
    }),
    env
  );
  assert.equal(response.status,401,"Une clé incorrecte doit être refusée.");
}

// --- Secret absent de env (rien de configuré côté Cloudflare) : toujours refusé, jamais un accès par défaut ---
{
  const response=await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/debug-list?prefix=idle/",{
      headers:{"x-soreal-idle-internal-key":""}
    }),
    {}
  );
  assert.equal(response.status,401,"Si le secret n'est pas provisionné, la route doit rester fermée par défaut, jamais s'ouvrir.");
}

// --- Bonne clé : fonctionne toujours pour un usage manuel légitime ---
{
  const listed=[{key:"idle/items/test.webp",size:42}];
  const fakeR2={
    async list(opts){
      assert.equal(opts.prefix,"idle/items/");
      return {objects:listed,truncated:false};
    }
  };
  const response=await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/debug-list?prefix=idle/items/",{
      headers:{"x-soreal-idle-internal-key":"test-only-internal-key-v1"}
    }),
    {...env,SOREAL_R2:fakeR2}
  );
  assert.equal(response.status,200,"Avec la bonne clé, l'outil de diagnostic doit continuer à fonctionner.");
  const data=await response.json();
  assert.equal(data.ok,true);
  assert.equal(data.count,1);
}

console.log("idle-media-debug-list-requires-internal-key: OK");
