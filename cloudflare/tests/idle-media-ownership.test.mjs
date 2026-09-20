import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/player?zone=tutorial"),
    {}
  );
  assert.equal(response.status, 503);
  assert.match(await response.text(), /joueur indisponible/i);
}

{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/boss?id=x"),
    {}
  );
  assert.equal(response.status, 400);
}

{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.test/not-idle-media"),
    {}
  );
  assert.equal(response, null);
}

{
  const response = await traiterRequeteIdleMedia(
    new Request("https://idle.test/api/idle/media/player", { method: "POST" }),
    {}
  );
  assert.equal(response.status, 405);
}

const workerSource = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");
assert.match(workerSource, /traiterRequeteIdleMedia/);
assert.match(workerSource, /if \(mediaResponse\) return mediaResponse/);

const wrangler = readFileSync("wrangler.jsonc", "utf8");
assert.match(wrangler, /"binding"\s*:\s*"SOREAL_R2"/);
assert.match(wrangler, /"bucket_name"\s*:\s*"soreal"/);

console.log("idle media ownership: ok");
