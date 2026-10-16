import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { join } from "node:path";

/*
 * Norman (2026-10-16) : « je n'arrive pas à lancer le studio : une fenêtre s'ouvre et se ferme ; c'est au moins la 5e fois qu'on a ce souci avec les ports ». Cause : un programme qui n'était PAS le studio écoutait
 * sur le port 8765 ; le lanceur par lien et le pilote prenaient « quelque chose écoute » pour « le studio tourne ». Désormais : le studio se reconnaît à sa ligne de commande (serveur.py), un intrus de
 * développement est arrêté, tout autre programme est signalé sans être touché (tools/voice-studio/liberer_port.py, partagé par lancer.bat et le pilote).
 */
const dossier = "cloudflare/tools/voice-studio/";
const lire = (f) => readFileSync(dossier + f, "utf8");

// 1. Branchements (texte) : plus aucun « quelque chose écoute » pris pour le studio.
const lanceurLien = lire("lancer_depuis_lien.bat"), lancer = lire("lancer.bat"), pilote = lire("pilote.py"), lib = lire("liberer_port.py");
assert.ok(!/findstr[^\n]*8765/.test(lanceurLien) && !/netstat[^\n]*8765/.test(lanceurLien), "le lanceur par lien ne ferme plus la fenêtre dès que le port est pris");
assert.ok(/liberer_port\.py" 8765/.test(lancer) && lancer.indexOf("liberer_port.py") < lancer.indexOf('"%PY%" "%~dp0serveur.py"'), "lancer.bat libère le port avant de lancer le studio");
assert.ok(lancer.includes("errorlevel 9") && lancer.includes("errorlevel 2") && lancer.indexOf("errorlevel 9") < lancer.indexOf("errorlevel 2"), "codes 9 (déjà lancé) puis 2 (port gardé par un autre programme)");
assert.ok(pilote.includes("import liberer_port") && pilote.includes("liberer_port.liberer(PORT_STUDIO)") && !/def studio_repond\(\):[\s\S]{0,260}create_connection/.test(pilote), "le pilote ne prend plus n'importe quel programme du port pour le studio");
assert.ok(/def est_le_studio[\s\S]{0,160}serveur\.py/.test(lib), "le studio se reconnaît à serveur.py");
assert.ok(/SERVEURS_DE_DEV/.test(lib) && lib.includes("jamais arrêté") || lib.includes("n'est jamais arrêté"), "les autres programmes ne sont jamais arrêtés");

// 2. Comportement réel, sur un port libre choisi au hasard (jamais 8765 : le vrai studio n'est pas dérangé). Nécessite un Python ; sinon cette partie est sautée (dit clairement).
const candidats = [process.env.PYTHON, join(process.env.APPDATA || "", "uv/python/cpython-3.12-windows-x86_64-none/python.exe"), "python3", "python"].filter(Boolean);
const python = candidats.find((p) => { try { return spawnSync(p, ["-c", "import sys;print(sys.version_info[0])"], { encoding: "utf8" }).stdout.trim() === "3"; } catch (_e) { return false; } });
/* Le studio de voix est un outil Windows (netstat, powershell, taskkill) : la CI Linux ne rejoue que les branchements. */
if (process.platform !== "win32" || !python) {
  console.log("idle-studio-port-libre-v1: partie comportement sautée (Windows et Python 3 requis) ; branchements OK");
  process.exit(0);
}
const portLibre = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const ecoute = (port) => new Promise((res) => { const c = net.connect(port, "127.0.0.1"); c.on("connect", () => { c.destroy(); res(true); }); c.on("error", () => res(false)); c.setTimeout(700, () => { c.destroy(); res(false); }); });
const attendre = async (cond, ms = 6000) => { const fin = Date.now() + ms; while (Date.now() < fin) { if (await cond()) return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
const lancerLib = (port) => spawnSync(python, [dossier + "liberer_port.py", String(port)], { encoding: "utf8" });
const serveurNode = (port, ...marques) => spawn(process.execPath, ["-e", `require("net").createServer(()=>{}).listen(${port},"127.0.0.1");setInterval(()=>{},1000)`, ...marques], { stdio: "ignore", windowsHide: true });

// Port libre : rien à faire.
{
  const p = await portLibre();
  const r = lancerLib(p);
  assert.equal(r.status, 0, "port libre : code 0");
}
// Un serveur d'aperçu (node) occupe le port : il est arrêté, le port est libéré, le message le dit.
{
  const p = await portLibre();
  const intrus = serveurNode(p);
  assert.ok(await attendre(() => ecoute(p)), "l'intrus écoute");
  const r = lancerLib(p);
  assert.equal(r.status, 0, "intrus arrêté : code 0 (" + r.stdout + r.stderr + ")");
  assert.ok(/arrete pour laisser la place/.test(r.stdout) && /node\.exe/i.test(r.stdout), "le message nomme le programme arrêté : " + r.stdout);
  assert.ok(await attendre(async () => !(await ecoute(p))), "le port est libre ensuite");
  intrus.kill();
}
// Le studio (ligne de commande contenant serveur.py) : on n'y touche JAMAIS, code 9.
{
  const p = await portLibre();
  const studio = serveurNode(p, "serveur.py");
  assert.ok(await attendre(() => ecoute(p)), "le faux studio écoute");
  const r = lancerLib(p);
  assert.equal(r.status, 9, "studio déjà lancé : code 9 (" + r.stdout + ")");
  assert.ok(await ecoute(p), "le studio est toujours là, intact");
  studio.kill();
}
// Un programme qui n'est pas un serveur de développement : jamais arrêté, code 2, message clair.
{
  const p = await portLibre();
  const autre = spawn("powershell.exe", ["-NoProfile", "-Command", `$l=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,${p});$l.Start();Start-Sleep 30`], { stdio: "ignore", windowsHide: true });
  assert.ok(await attendre(() => ecoute(p), 12000), "l'autre programme écoute");
  const r = lancerLib(p);
  assert.equal(r.status, 2, "programme inconnu : code 2 (" + r.stdout + ")");
  assert.ok(/powershell\.exe/i.test(r.stdout) && /que je n'arrete pas/.test(r.stdout), "dit lequel : " + r.stdout);
  assert.ok(await ecoute(p), "il n'a pas été arrêté");
  spawnSync("taskkill", ["/PID", String(autre.pid), "/T", "/F"]);
}
console.log("idle-studio-port-libre-v1: OK");
