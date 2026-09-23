import assert from "node:assert/strict";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

/*
 * 2026-09-23 (audit de sécurité, 3 dépôts) : /api/idle/media/avatar
 * relayait n'importe quelle requête vers un fichier Google Drive
 * arbitraire (via son id) sans la moindre authentification --
 * accessible à quiconque sur Internet, qui pouvait ainsi faire
 * télécharger/mettre en cache par le Worker (facturé sur le compte
 * Cloudflare) n'importe quel fichier dont il connaît l'id. Aucun
 * appelant frontend trouvé nulle part dans les 3 dépôts (recherche
 * exhaustive).
 *
 * Fix : même clé interne que idleCallV1 (idle-worker-entry-v1.js) et
 * debug-list (corrigé le même jour) -- SOREAL_IDLE_INTERNAL_KEY /
 * header x-soreal-idle-internal-key.
 */

const env={SOREAL_IDLE_INTERNAL_KEY:"test-only-internal-key-v1"};

// --- Sans clé : refusé, jamais un relais vers Google Drive ---
{
  let fetchCalled=false;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{fetchCalled=true;return new Response("ne devrait jamais être appelé",{status:200});};
  try{
    const response=await traiterRequeteIdleMedia(
      new Request("https://idle.invalid/api/idle/media/avatar?id=AAAAAAAAAAAAAAAAAAAA&w=200"),
      env
    );
    assert.equal(response.status,401,"Sans clé interne, la route doit refuser (401), jamais relayer vers Google Drive.");
    assert.equal(fetchCalled,false,"Aucun appel réseau vers Google Drive ne doit partir sans la clé interne.");
  }finally{
    globalThis.fetch=originalFetch;
  }
}

// --- Secret absent de env (rien de configuré côté Cloudflare) : toujours refusé, jamais un accès par défaut ---
{
  const response=await traiterRequeteIdleMedia(
    new Request("https://idle.invalid/api/idle/media/avatar?id=AAAAAAAAAAAAAAAAAAAA"),
    {}
  );
  assert.equal(response.status,401,"Si le secret n'est pas provisionné, la route doit rester fermée par défaut.");
}

// --- Bonne clé : continue de fonctionner pour un usage interne légitime ---
{
  let fetchedUrl=null;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url)=>{
    fetchedUrl=String(url);
    return new Response(new Uint8Array([1,2,3]),{status:200,headers:{"content-type":"image/webp"}});
  };
  try{
    const response=await traiterRequeteIdleMedia(
      new Request("https://idle.invalid/api/idle/media/avatar?id=AAAAAAAAAAAAAAAAAAAA&w=200",{
        headers:{"x-soreal-idle-internal-key":"test-only-internal-key-v1"}
      }),
      env
    );
    assert.equal(response.status,200,"Avec la bonne clé, le relais doit continuer de fonctionner.");
    assert.ok(fetchedUrl&&fetchedUrl.includes("AAAAAAAAAAAAAAAAAAAA"),"Doit relayer vers Google Drive avec le bon id.");
  }finally{
    globalThis.fetch=originalFetch;
  }
}

console.log("idle-media-avatar-requires-internal-key: OK");
