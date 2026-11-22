/*
 * Menu « Énigmes » (ScummVM) : AP gagnés par PROGRÈS dans le jeu (Norman, 2026-11-22 : « chaque progrès dans le jeu rapporte un peu d'AP, même ramasser un objet »).
 * Ajout SOREAL sans équivalent dans le jeu d'origine : aucune valeur du jeu NGU Idle n'est en cause (règle n°1 : rien à vérifier sur le wiki).
 *
 * Le client lit la sauvegarde du jeu ScummVM (modules/scummvm-sauvegarde-v1.js), compte les « unités de progrès » atteintes (jamais redescendantes) et envoie l'action
 * `scummvmProgres` { jeu, unites, plafond, parUnite } par l'opération générique d'actions (aucune nouvelle opération : le contrat du protocole ne change pas).
 *   - AP BRUT : le multiplicateur d'AP du joueur ne s'applique PAS (décision de Norman) ; on n'utilise ni apWithBonusV1 ni apBonusMultiplierV1.
 *   - Plafond PAR JEU (150 000 pour Day of the Tentacle, déclaré dans jeux.json) ; chaque jeu du catalogue a ses propres crédits.
 *   - Monotone : une valeur d'unités plus basse que celle déjà vue est ignorée ; le crédit ne dépasse jamais le plafond.
 *   - État léger, sans champ horodaté ni aléatoire (règle de performance du moteur) : systems.scummvm.data.jeux[id] = { unites, apCredite }.
 *   - Ignorée tant que le menu « Énigmes » n'est pas débloqué (règle n°2).
 */

/*
 * Borne absolue du moteur, au cas où le catalogue serait mal saisi (plafond ou parUnite démesurés) : aucun jeu ne peut rapporter plus de 1 000 000 AP.
 * choix SOREAL de conception (non publié, aucun équivalent dans NGU Idle ; décision du 2026-11-22), à valider par Norman.
 */
export const IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1 = 1000000;
/* Garde-fous de forme : identifiant de jeu court, nombre d'unités plausible (une sauvegarde SCUMM ne dépasse pas quelques milliers de faits). */
const UNITES_MAX_V1 = 100000;
const JEUX_MAX_V1 = 64;
const ID_JEU_V1 = /^[A-Za-z0-9_-]{1,40}$/;

const num = (v, defaut = 0) => (Number.isFinite(Number(v)) ? Number(v) : defaut);

/* Applique un crédit de progrès. Renvoie { ap, apCredite, unites, ignore } ; lève SYSTEME_VERROUILLE (menu fermé) ou PAYLOAD_INVALIDE (forme invalide). */
export function idleScummvmProgresV1(state, payload) {
  if (!state.systems.scummvm?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const id = String(payload?.jeu ?? "");
  if (!ID_JEU_V1.test(id)) throw new Error("PAYLOAD_INVALIDE");
  const unites = Math.floor(num(payload.unites, -1));
  const plafond = Math.floor(num(payload.plafond, -1));
  const parUnite = Math.floor(num(payload.parUnite, -1));
  if (!(unites >= 0 && unites <= UNITES_MAX_V1) || !(plafond > 0) || !(parUnite > 0)) throw new Error("PAYLOAD_INVALIDE");
  const sys = state.systems.scummvm;
  if (!sys.data || typeof sys.data !== "object") sys.data = {};
  if (!sys.data.jeux || typeof sys.data.jeux !== "object") sys.data.jeux = {};
  const jeux = sys.data.jeux;
  if (!jeux[id] && Object.keys(jeux).length >= JEUX_MAX_V1) throw new Error("PAYLOAD_INVALIDE");
  const jeu = jeux[id] && typeof jeux[id] === "object" ? jeux[id] : { unites: 0, apCredite: 0 };
  const dejaUnites = Math.max(0, Math.floor(num(jeu.unites, 0)));
  const dejaAp = Math.max(0, Math.floor(num(jeu.apCredite, 0)));
  /* plafond effectif : celui du catalogue, borné par la borne absolue du moteur */
  const limite = Math.min(plafond, IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1);
  const nouvelles = Math.max(0, unites - dejaUnites);
  const ap = Math.max(0, Math.min(nouvelles * parUnite, limite - dejaAp));
  jeux[id] = { unites: Math.max(dejaUnites, unites), apCredite: dejaAp + ap };
  if (ap > 0) state.currencies.ap = Math.max(0, num(state.currencies.ap, 0)) + ap;   /* AP brut : jamais de multiplicateur */
  return { ap, apCredite: jeux[id].apCredite, unites: jeux[id].unites, ignore: nouvelles === 0 };
}
