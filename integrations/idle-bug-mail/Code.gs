/*
 * Passerelle mail « Signaler un bug » de SOREAL IDLE (2026-09-26).
 *
 * Reçoit le signalement du Worker SOREAL IDLE et l'envoie par MailApp à Norman :
 *   destinataire : reeeedruuuum@gmail.com   (fixe, jamais lu dans la requête)
 *   objet        : Soreal IDLE Bug signalé  (fixe)
 *   corps        : le message de la personne, puis son prénom, son adresse (Répondre lui répond) et le contexte.
 *
 * Voir README.md pour la mise en service (2 minutes).
 */
const DESTINATAIRE = 'reeeedruuuum@gmail.com';
const OBJET = 'Soreal IDLE Bug signalé';

function doGet() {
  return json_({ ok: true, service: 'SOREAL_IDLE_BUG_MAIL' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '{}');

    /* Secret partagé (propriété de script SECRET) : facultatif, mais recommandé. */
    const attendu = String(PropertiesService.getScriptProperties().getProperty('SECRET') || '').trim();
    if (attendu && String(payload.secret || '').trim() !== attendu) throw new Error('SECRET_INVALID');

    const r = payload.rapport || {};
    const message = String(r.message || '').trim().slice(0, 2000);
    if (!message) throw new Error('MESSAGE_VIDE');

    const ctx = r.contexte && typeof r.contexte === 'object' ? r.contexte : {};
    const lignes = [];
    lignes.push('De : ' + String(r.prenom || '?').slice(0, 60) + (r.email ? ' <' + String(r.email).slice(0, 120) + '>' : ''));
    if (ctx.version) lignes.push('Version : Beta ' + ctx.version);
    if (ctx.menu) lignes.push('Menu : ' + ctx.menu);
    if (ctx.appareil) lignes.push('Appareil : ' + ctx.appareil);
    if (ctx.ecran) lignes.push('Écran : ' + ctx.ecran);
    lignes.push('Envoyé : ' + (ctx.heure || new Date(Number(r.at) || Date.now()).toISOString()));
    lignes.push('N° de signalement : ' + (r.id || '?'));

    const options = { to: DESTINATAIRE, subject: OBJET, body: message + '\n\n————————————\n' + lignes.join('\n'), name: 'SOREAL IDLE' };
    if (r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(r.email))) options.replyTo = String(r.email);
    MailApp.sendEmail(options);

    return json_({ ok: true });
  } catch (erreur) {
    return json_({ ok: false, error: String(erreur && erreur.message ? erreur.message : erreur) });
  }
}

function json_(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}

/* À exécuter UNE fois à la main (menu Exécuter) pour autoriser l'envoi de mail. */
function autoriser() {
  MailApp.getRemainingDailyQuota();
}
