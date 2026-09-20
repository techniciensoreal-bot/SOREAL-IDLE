import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path=resolve(process.cwd(),"cloudflare/public/soreal-idle-ui.js");
const sha=String(process.env.GITHUB_SHA||"").trim();
const version=sha?sha.slice(0,12):"local";
let source=readFileSync(path,"utf8");
const pattern=/const IDLE_TEST_VERSION='[^']*';/;
if(!pattern.test(source)){
  throw new Error("IDLE_TEST_VERSION introuvable dans le frontend autonome.");
}
source=source.replace(pattern,"const IDLE_TEST_VERSION='Ver. Beta "+version+"';");
writeFileSync(path,source,"utf8");
console.log("SOREAL IDLE standalone UI: version "+version+".");
