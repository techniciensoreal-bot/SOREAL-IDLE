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
/*
 * INTERRUPTEUR DU GAIN D'AP (Norman, 2026-11-23 : « je ne veux pas le gain avant qu'on ait terminé de calculer ») : tant qu'il est FAUX, les deux actions ne créditent RIEN et ne changent
 * pas l'état (le suivi des trophées côté client n'envoie rien non plus : scummvm-progres-v1.js, AP_ACTIF). Le passer à vrai = une ligne ici et une dans le client, une fois les montants arrêtés.
 * Les fonctions de test peuvent le forcer avec idleScummvmDefinirApActifV1.
 */
let apActifV1 = true;   /* 2026-11-23 : calcul terminé (Norman : « chaque objet ramassé, utilisé, donné, poussé donne de l'AP, de façon exponentielle »), gain ACTIVÉ */
export function idleScummvmApActifV1() { return apActifV1; }
export function idleScummvmDefinirApActifV1(v) { apActifV1 = Boolean(v); }
/*
 * ANNULATION des crédits déjà faits (Norman, 2026-11-23, « 1 » : retirer l'AP déjà gagné) : tant que le gain est coupé, chaque synchronisation retranche des AP du joueur ce qu'Énigmes lui avait crédité
 * (jeux[id].apCredite, la seule trace des crédits : les AP ne se réécrivent pas autrement) et efface ces enregistrements (idempotent : une 2e synchronisation ne retire plus rien). Quand le gain sera
 * réactivé, la fonction ne fait plus rien et les trophées déjà obtenus seront recrédités par le suivi du client (rien n'est perdu : il garde l'ensemble déjà vu). Renvoie vrai si elle a retiré quelque chose.
 */
export function idleScummvmAnnulerCreditsV1(state) {
  if (apActifV1) return false;
  const sys = state && state.systems && state.systems.scummvm;
  const jeux = sys && sys.data && sys.data.jeux;
  if (!jeux || typeof jeux !== "object" || !Object.keys(jeux).length) return false;
  let total = 0;
  for (const id of Object.keys(jeux)) {
    const j = jeux[id];
    if (j && typeof j === "object") total += Math.max(0, Math.floor(Number.isFinite(Number(j.apCredite)) ? Number(j.apCredite) : 0));
  }
  sys.data.jeux = {};
  if (total > 0 && state.currencies) state.currencies.ap = Math.max(0, (Number.isFinite(Number(state.currencies.ap)) ? Number(state.currencies.ap) : 0) - total);
  return true;
}
/*
 * REMISE À ZÉRO UNIQUE (Norman, 2026-11-23 : « je veux que ma partie soit à 0, je ne veux pas les AP, je les aurai de manière légitime ») : les crédits d'Énigmes faits AVANT cette version (enregistrement de jeu sans la marque v = 2) sont retirés une fois
 * des AP du joueur et l'enregistrement est effacé ; tout crédit fait ensuite porte v = 2 et n'est jamais retiré. Doit s'exécuter AVANT toute action de progrès (syncIdleNguState, qui précède chaque opération) : sinon un ancien enregistrement bloquerait les nouveaux gains.
 * Idempotent. Renvoie vrai si quelque chose a été retiré.
 */
export const IDLE_SCUMMVM_VERSION_CREDITS_V1 = 3;   /* 2026-11-24 : version 3 = remise à zéro demandée par Norman (« supprime l’AP que j’ai eu avec le jeu et reset le menu Énigmes, comme si je venais de le débloquer ») : tout crédit sans v = 3 est retiré une fois */
export function idleScummvmCorrectionUniqueV1(state) {
  const sys = state && state.systems && state.systems.scummvm;
  const jeux = sys && sys.data && sys.data.jeux;
  if (!jeux || typeof jeux !== "object") return false;
  let total = 0, change = false;
  for (const id of Object.keys(jeux)) {
    const j = jeux[id];
    if (!j || typeof j !== "object" || j.v === IDLE_SCUMMVM_VERSION_CREDITS_V1) continue;
    const pris = Math.max(0, Math.floor(Number.isFinite(Number(j.apCredite)) ? Number(j.apCredite) : 0)) + Math.max(0, Math.floor(Number.isFinite(Number(j.bonus)) ? Number(j.bonus) : 0));
    if (!(pris > 0)) continue;
    total += pris; delete jeux[id]; change = true;
  }
  if (total > 0 && state.currencies) state.currencies.ap = Math.max(0, (Number.isFinite(Number(state.currencies.ap)) ? Number(state.currencies.ap) : 0) - total);
  return change;
}
const RIEN_V1 = (extra) => Object.assign({ ap: 0, apCredite: 0, unites: 0, nouveaux: [], ignore: true, desactive: true }, extra || {});
/* Garde-fous de forme : identifiant de jeu court, nombre d'unités plausible (une sauvegarde SCUMM ne dépasse pas quelques milliers de faits). */
const UNITES_MAX_V1 = 100000;
const JEUX_MAX_V1 = 64;
const ID_JEU_V1 = /^[A-Za-z0-9_-]{1,40}$/;

const num = (v, defaut = 0) => (Number.isFinite(Number(v)) ? Number(v) : defaut);

/* Applique un crédit de progrès. Renvoie { ap, apCredite, unites, ignore } ; lève SYSTEME_VERROUILLE (menu fermé) ou PAYLOAD_INVALIDE (forme invalide). */
export function idleScummvmProgresV1(state, payload) {
  if (!state.systems.scummvm?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!apActifV1) return RIEN_V1();   /* gain d'AP coupé : aucun crédit, aucun changement d'état */
  const id = String(payload?.jeu ?? "");
  if (!ID_JEU_V1.test(id)) throw new Error("PAYLOAD_INVALIDE");
  const unites = Math.floor(num(payload.unites, -1));
  const plafond = Math.floor(num(payload.plafond, -1));
  const parUnite = Math.floor(num(payload.parUnite, -1));
  /* GAIN EXPONENTIEL (Norman, 2026-11-23) : { reference, croissance } = nombre d'unités d'une partie complète et rapport entre l'AP de la dernière unité et celui de la première ;
     choix SOREAL de conception (courbe non publiée, aucun équivalent dans NGU Idle), à valider par Norman. Sans ces deux nombres : ancien gain linéaire (parUnite). */
  const reference = Math.floor(num(payload.reference, 0));
  const croissance = num(payload.croissance, 0);
  const expo = reference >= 2 && reference <= 5000 && croissance > 1 && croissance <= 1e6;
  if (!(unites >= 0 && unites <= UNITES_MAX_V1) || !(plafond > 0) || !(expo || parUnite > 0)) throw new Error("PAYLOAD_INVALIDE");
  const sys = state.systems.scummvm;
  if (!sys.data || typeof sys.data !== "object") sys.data = {};
  if (!sys.data.jeux || typeof sys.data.jeux !== "object") sys.data.jeux = {};
  const jeux = sys.data.jeux;
  if (!jeux[id] && Object.keys(jeux).length >= JEUX_MAX_V1) throw new Error("PAYLOAD_INVALIDE");
  const jeu = jeux[id] && typeof jeux[id] === "object" ? jeux[id] : { unites: 0, apCredite: 0 };
  /* un jeu qui a une liste de trophées (scummvmTrophees) ne rapporte plus rien par unités : pas de double crédit */
  if (Array.isArray(jeu.ordre)) return { ap: 0, apCredite: Math.max(0, Math.floor(num(jeu.apCredite, 0))), unites: Math.max(0, Math.floor(num(jeu.unites, 0))), ignore: true };
  const dejaUnites = Math.max(0, Math.floor(num(jeu.unites, 0)));
  const dejaAp = Math.max(0, Math.floor(num(jeu.apCredite, 0)));
  /* plafond effectif : celui du catalogue, borné par la borne absolue du moteur */
  const limite = Math.min(plafond, IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1);
  const nouvelles = Math.max(0, unites - dejaUnites);
  /* exponentiel : cumul F(n) = plafond × (r^n − 1) / (r^N − 1), r = croissance^(1/(N−1)) ; on crédite F(unites) − déjà crédité (idempotent) ; n ≥ N → plafond */
  let cible = nouvelles * parUnite + dejaAp;
  if (expo) {
    const r = Math.pow(croissance, 1 / (reference - 1));
    const F = (n) => (n >= reference ? limite : Math.floor(limite * (Math.pow(r, n) - 1) / (Math.pow(r, reference) - 1)));
    const avant = Math.min(dejaUnites, reference);
    const apres = Math.min(Math.max(dejaUnites, unites), reference);
    /* GAIN INCRÉMENTAL (Norman, 2026-11-24 : « je suis passé de 67 à 68 découvertes mais l'AP n'est pas montée ») : chaque unité nouvelle rapporte F(après) − F(avant) sur la courbe ACTUELLE, ajouté à ce qui est déjà crédité. Avant, on visait F(après) − (déjà crédité) :
       après un changement de courbe (seuil de la partie complète passé de 200 à 190 puis 400), l'AP déjà crédité sur l'ancienne courbe dépassait F(après) et plus rien n'était crédité avant d'avoir rattrapé ce total. Idempotent comme avant (« avant » = meilleur total d'unités déjà vu) ; au seuil, le total est le plafond. */
    cible = apres >= reference ? limite : dejaAp + (F(apres) - F(avant));
  }
  const ap = Math.max(0, Math.min(cible - dejaAp, limite - dejaAp));
  jeux[id] = { unites: Math.max(dejaUnites, unites), apCredite: dejaAp + ap, v: IDLE_SCUMMVM_VERSION_CREDITS_V1 };
  if (jeu.bonus > 0) jeux[id].bonus = Math.floor(num(jeu.bonus, 0));   /* déjà reçu : conservé */
  if (ap > 0) state.currencies.ap = Math.max(0, num(state.currencies.ap, 0)) + ap;   /* AP brut : jamais de multiplicateur */
  /* BONUS DE FIN (Norman, 2026-11-23 : « 50 000 AP offerts à ceux qui débloquent les 150 000 ») : une seule fois, quand le plafond du jeu est atteint ; montant { bonus } du catalogue, borné par la borne absolue ; non compté dans le plafond ni dans le compteur « x / plafond ». */
  let bonusAp = 0;
  const bonus = Math.floor(num(payload.bonus, 0));
  if (!(jeux[id].bonus > 0) && jeux[id].apCredite >= limite && bonus > 0) {
    bonusAp = Math.min(bonus, IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1);
    jeux[id].bonus = bonusAp;
    state.currencies.ap = Math.max(0, num(state.currencies.ap, 0)) + bonusAp;
  }
  return { ap: ap + bonusAp, apCredite: jeux[id].apCredite, unites: jeux[id].unites, bonus: bonusAp, ignore: nouvelles === 0 && bonusAp === 0 };
}

/*
 * TROPHÉES d'un jeu (Norman, 2026-11-22 : « une liste nous-mêmes, pour que le joueur puisse voir ce qu'il a débloqué et pour combien d'AP »).
 * Action `scummvmTrophees` { jeu, plafond, trophees: [{ id, ap }] } : le client n'envoie que les trophées NOUVELLEMENT remplis (liste du jeu : `soreal-trophees.json` sur R2).
 *   - AP BRUT (jamais le multiplicateur d'AP), un trophée n'est crédité qu'UNE fois : l'AP d'un trophée déjà crédité n'est jamais recrédité, même si le fichier change.
 *   - Même plafond par jeu que `scummvmProgres` (apCredite commun), borné aussi par IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1. Un trophée crédité à moitié (plafond atteint) compte comme obtenu.
 *   - État léger sans horodatage : jeux[id].trophees = { id: apCrédité } et jeux[id].ordre = [ids dans l'ordre d'obtention] (un objet seul réordonnerait les clés numériques).
 *   - Un jeu qui a une liste de trophées ne rapporte plus rien par `scummvmProgres` (pas de double crédit) : voir idleScummvmProgresV1.
 */
const TROPHEES_MAX_V1 = 500;
const ID_TROPHEE_V1 = /^[a-z0-9-]{1,60}$/;

/* Renvoie { ap, apCredite, nouveaux: [ids], ignore } ; lève SYSTEME_VERROUILLE ou PAYLOAD_INVALIDE. */
export function idleScummvmTropheesV1(state, payload) {
  if (!state.systems.scummvm?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!apActifV1) return RIEN_V1();   /* gain d'AP coupé : aucun crédit, aucun changement d'état */
  const id = String(payload?.jeu ?? "");
  if (!ID_JEU_V1.test(id)) throw new Error("PAYLOAD_INVALIDE");
  const plafond = Math.floor(num(payload.plafond, -1));
  const liste = Array.isArray(payload.trophees) ? payload.trophees : null;
  if (!(plafond > 0) || !liste || liste.length > 50) throw new Error("PAYLOAD_INVALIDE");
  const entrees = [];
  for (const t of liste) {
    const tid = String(t?.id ?? "");
    const ap = Math.floor(num(t?.ap, -1));
    if (!ID_TROPHEE_V1.test(tid) || !(ap > 0)) throw new Error("PAYLOAD_INVALIDE");
    entrees.push({ id: tid, ap });
  }
  const sys = state.systems.scummvm;
  if (!sys.data || typeof sys.data !== "object") sys.data = {};
  if (!sys.data.jeux || typeof sys.data.jeux !== "object") sys.data.jeux = {};
  const jeux = sys.data.jeux;
  if (!jeux[id] && Object.keys(jeux).length >= JEUX_MAX_V1) throw new Error("PAYLOAD_INVALIDE");
  const jeu = jeux[id] && typeof jeux[id] === "object" ? jeux[id] : { unites: 0, apCredite: 0 };
  const trophees = jeu.trophees && typeof jeu.trophees === "object" ? jeu.trophees : {};
  const ordre = Array.isArray(jeu.ordre) ? jeu.ordre.slice() : [];
  const limite = Math.min(plafond, IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1);
  let apCredite = Math.max(0, Math.floor(num(jeu.apCredite, 0)));
  let total = 0;
  const nouveaux = [];
  for (const e of entrees) {
    if (Object.prototype.hasOwnProperty.call(trophees, e.id) || ordre.length >= TROPHEES_MAX_V1) continue;   /* déjà crédité : jamais deux fois */
    const ap = Math.max(0, Math.min(e.ap, limite - apCredite));
    trophees[e.id] = ap;
    ordre.push(e.id);
    nouveaux.push(e.id);
    apCredite += ap;
    total += ap;
  }
  jeux[id] = { unites: Math.max(0, Math.floor(num(jeu.unites, 0))), apCredite, trophees, ordre, v: IDLE_SCUMMVM_VERSION_CREDITS_V1 };
  if (total > 0) state.currencies.ap = Math.max(0, num(state.currencies.ap, 0)) + total;   /* AP brut : jamais de multiplicateur */
  return { ap: total, apCredite, nouveaux, ignore: nouveaux.length === 0 };
}
