# Audit : APK hors ligne sans menu Admin ni journal de fluidite (2026-11-01)

Phase d'analyse, aucun code modifie.

## Symptome
Dans l'APK hors ligne, Norman (technicien.soreal@gmail.com) joue sa partie mais n'a ni menu Admin ni bouton « Journal de fluidite » ; un message dit « pas connecte ».

## Cause probable (confirmee par lecture du code, sauf mention)

**Dans l'APK, le moteur et la session tournent sur un compte LOCAL factice, jamais sur le compte Google de Norman.**

1. `cloudflare/local/sw-android.js:17` : `const JOUEUR = { email: "joueur@soreal-idle.local", prenom: "Joueur" }`.
   Aux lignes 273-282 le service worker cree une session pour cet e-mail (`coord.createGoogleSessionV1({email: JOUEUR.email...})`), et `scriptSession()` (l. 310-372) injecte ce jeton dans la page (`soreal_idle_google_session_v1`).
2. L'ecran de connexion Google (`public/modules/apk-connexion-v1.js`) ne fait que **relayer** un jeton de PRODUCTION : il le range dans `idle_apk_jeton_v1` (l. ~140, `ecrire(CLE_JETON...)`) et recopie la partie. Ce jeton n'est utilise que pour : verifier/reserver le pseudo (`verifierPseudo`, l. 222) et le profil de badavatar (`acces()`, l. 214, lu par `profil-badavatar-v1.js:59-60`). Il n'est **jamais** mis en `sessionStorage soreal_idle_session_v1` ni `soreal_idle_google_session_v1` : `standalone-bridge.js:86-94` (`sessionV1`) rend donc toujours le jeton local.
3. La restauration de la partie (`apk-connexion-v1.js` `restaurer` -> `ML.chargerFichier` -> Worker `importer`, `local/moteur-local-worker.js:126-146`) passe par `preparerLignePartieV1` (`src/idle-partie-fichier-v1.js:16,81`) : `COLS_IDENTITE_PARTIE_V1 = [0,1,16,17,18,19,35]` = **ID, Nom, rang, EMAIL PRINCIPAL, EMAIL CONNEXION restent ceux du compte qui charge**, soit `joueur@soreal-idle.local`. La partie de Norman est donc jouee avec une identite locale : c'est ce qu'il appelle « ma partie normale » (voir plus bas).
4. Decision d'admin cote moteur : `estAdministrateurSorealIdle_(emailPrincipal, emailConnexion)` (`src/idle-runtime-joueurs.js:370`) compare a `ADMIN_SOREAL_IDLE_EMAIL = 'technicien.soreal@gmail.com'` (l. 932). Elle remplit `reglages` dans l'etat (`src/idle-runtime-etat.js:919`) : `reglages` vaut `null` pour tout autre e-mail. `estAdminSorealIdle` (l. 947) et toutes les operations admin utilisent `acces.emailAutorise === ADMIN_SOREAL_IDLE_EMAIL` (`idle-runtime-admin.js:62,82,225` ; `idle-sqlite-runtime.js:913-1034`). Avec `joueur@soreal-idle.local`, c'est faux partout.
5. Decision d'admin cote client : `modules/ui-admin-v1.js:19-31` (`estAdminSorealIdle_`) ; `rafraichirEstAdminSorealIdle_` (l. 33-57) lit `REG.idleEtat.reglages` : `null` -> `idleEstAdminV1 = false`, et ce faux est **memorise** (`!==null` -> plus jamais reverifie). Le repli sur `SOREAL_USER.email` n'est jamais utilise (le drapeau est deja pose).
6. Consommateurs : onglet Admin (`ui-navigation-v1.js:84`), bouton Journal de fluidite (`bug-report-v1.js:138`, uniquement `estAdmin`), et tout `diag-fluidite-v1.js` (`estAdmin_()` l. 501 = `window.__SOREAL_IDLE_EST_ADMIN_V1__()` ; sonde, journal des operations, 🐞).
   Le journal de fluidite est **100 % local** (aucun appel reseau, `diag-fluidite-v1.js` n'a pas de `fetch`, pas de chaine « connecte ») : il lui suffit de `estAdmin_()`.

Donc : menu Admin et journal absents = `reglages === null` parce que l'identite locale n'est pas l'administrateur.

### Le message « pas connecte »
HYPOTHESE (non confirmee) : le texte exact n'existe ni dans le journal ni dans `diag-fluidite-v1.js`. Les seuls messages « Ton compte n'est pas connecte : ferme puis rouvre l'application » sont `apk-connexion-v1.js:224` (`verifierPseudo`, si `idle_apk_jeton_v1` est absent) et `profil-badavatar-v1.js:60` (profil, si `acces().jeton` est vide : jeton absent OU `expire` depasse, `apk-connexion-v1.js:214-216`). Norman l'a probablement vu dans Reglages > Profil / pseudo, a cote de l'absence du journal. Cela indique que **`idle_apk_jeton_v1` est absent ou echu** : TTL d'une session Google = 14 jours (`src/index-idle-coordinator-v1.js:38`), et un jeton de ticket APP/TV = 8 h (l. 36). Si l'APK a ete relie via un chemin donnant un jeton de ticket, il a expire en 8 h. A verifier sur le telephone (voir fin).
Aussi : un APK installe AVANT la connexion Google (version 10-28) ou mis a jour sans repasser par l'ecran de connexion n'a jamais de `idle_apk_compte_v1`/jeton.

## « Partie normale »
- Les parties A/B/C (`idle-dev-save-slots-v1.js`, `definirPartieDevSorealIdle`, `preparerPartieTestSorealIdle`) sont des emplacements memorises **sur la session** (`idle_sessions.user_json.slot`), pas sur le compte : la partie A est celle par defaut. « Normale » = la partie A, celle restauree depuis le serveur par `apk-connexion` (export `lecture=1`).
- Oui, l'APK affiche tres bien la partie normale sans identification administrateur : l'identite locale `joueur@soreal-idle.local` suffit pour jouer ; la ligne du joueur (38 colonnes) vient du serveur, seules les colonnes d'identite sont locales. Ce n'est pas un bug de partie, c'est l'identite.

## Correctif propose (le plus sur, minimal)
Principe : l'identite administrateur doit etre **prouvee par le serveur de production avec le jeton reel**, jamais lue dans un texte local.

1. Dans `apk-connexion-v1.js`, ajouter `verifierAdmin()` : si APK et `acces().jeton` valide, `POST PROD/api/v1/call` avec `Authorization: Bearer <jeton>`, `{operation:"estAdminSorealIdle", args:[jeton]}` (meme operation que `idleEstAdminV1` du Worker, `idle-worker-entry-v1.js:277-285`). Le serveur compare l'e-mail de la session a `ADMIN_SOREAL_IDLE_EMAIL` : aucun secret nouveau, aucun autre compte ne peut obtenir `isAdmin:true`.
2. Exposer le resultat via un petit drapeau memoire + cache borne `idle_apk_admin_v1 = {ok:true, verifieA, jusqua:min(expiration du jeton, +14 j)}` (cle SANS prefixe `soreal_idle_` : propre a l'appareil, non recopiee sur le compte, regle n°6). Hors ligne : on reutilise la derniere verification tant que le jeton n'est pas echu ; sinon faux.
3. `ui-admin-v1.js` : dans `estAdminSorealIdle_()` / `rafraichirEstAdminSorealIdle_()`, en APK, `idleEstAdminV1 = reglages ? true : (verifierAdmin() prouve)`. Ne PAS memoriser un faux definitif tant que la verification n'a pas eu de reponse (aujourd'hui le faux est colle). `window.__SOREAL_IDLE_EST_ADMIN_V1__` suit donc, et le journal de fluidite redevient disponible sans autre changement.
4. Menu Admin : l'onglet apparait, mais les operations d'administration du jeu partent au service worker LOCAL (`/api/v1/call` relatif) dont la session est `joueur@soreal-idle.local` : elles seraient refusees (`SOREAL_IDLE_ADMIN_REQUIS`), et la plupart agissent sur des donnees PARTAGEES (textes, bugs, histoires, sauvegardes). Pour que le menu serve vraiment : router les operations d'administration vers PROD avec le jeton reel (liste fermee d'operations `*Admin*`, jamais les operations de jeu), uniquement si le jeton est verifie administrateur. A decider avec Norman : (a) etape 1-3 seule = journal de fluidite + menu visible, fonctions locales ; (b) + etape 4 = menu pleinement operationnel (necessite Internet).
5. Option complementaire : a la restauration, ne pas toucher aux colonnes d'identite (inchange). Ne surtout PAS ecrire `technicien.soreal@gmail.com` dans la ligne locale ni dans `JOUEUR` du service worker : la ligne et la session locales sont modifiables par n'importe quel porteur du telephone et, via `push`, pourraient atteindre le serveur.

### Securite
- Aucune confiance dans `localStorage`/`idle_apk_compte_v1` seul : le drapeau n'a de valeur que s'il vient d'une reponse de production a un jeton valide. Un utilisateur qui falsifie `idle_apk_admin_v1` obtient au pire l'affichage de l'interface locale (journal, sonde) ; toute operation reelle reste refusee par le serveur (verification `emailAutorise` sur chaque operation admin).
- Ne pas exposer le jeton (jamais dans les journaux ni dans le texte du doc/diagnostic).
- Un autre compte Google : `isAdmin:false` du serveur -> rien ne change.

### Reconstruction de l'APK ?
Non. Tout est dans `cloudflare/public/modules/*.js` (et au besoin `local/sw-android.js`, embarque dans le paquet de code). Ni Java ni manifeste. Chemin : `node cloudflare/tools/maj-pins.mjs`, tests, puis `node desktop/publier-maj.mjs --apk … --publier` (README android, « Mises a jour »). Activation au lancement suivant (dialogue « Relancer ? »).

### Risques
- Si `idle_apk_jeton_v1` est echu/absent (cause du message « pas connecte »), la verification echoue : il faut reconnecter (le relais Google ne se redeclenche aujourd'hui que si `idle_apk_compte_v1` est vide, `apk-connexion-v1.js:requis()`). Prevoir un bouton « Reconnecter mon compte » (Reglages) ou un renouvellement quand le jeton est echu : hors du perimetre minimal mais necessaire sinon le correctif ne marche qu'a la premiere connexion.
- Premiere verification : necessite Internet une fois.
- Ne pas casser la regle n°4 (redessin) : poser le drapeau puis redessiner une fois, comme `rafraichirEstAdminSorealIdle_` le fait deja.
- Les sauvegardes et envois (`/api/v1/local/push`) de l'APK restent relies a l'identite locale : aucun changement de ce cote.

## Ce que Norman peut verifier lui-meme (sans reveler de secret)
Dans la WebView (ou via le journal/console si accessible) :
- `idle_apk_compte_v1` : doit exister (`{at, pseudo, partie}`) ; `pseudo` doit etre « Redrum » ; ne pas copier `idle_apk_jeton_v1`.
- `idle_apk_jeton_v1.expire` (date seulement) : si dans le passe ou valeur absente, c'est la cause du message « pas connecte » ; le jeton n'est pas a partager.
- Version du code actif : Reglages (note de version/numero de version). Si l'APK n'a pas la mise a jour du 2026-11-01 ou celle de l'ecran de connexion (10-30), la connexion Google n'etait peut-etre pas proposee.
- Preuve de l'hypothese principale : dans l'etat du jeu, `reglages` est `null` ; dans Reglages, le compte affiche n'est pas Norman.

## Non confirme / a verifier
- Le texte « pas connecte » exact et son emplacement (hypothese ci-dessus).
- Si Norman a vraiment un `idle_apk_jeton_v1` valide ou non (impossible a lire d'ici).
- Si l'APK installe contient `apk-connexion-v1.js` (APK/mise a jour d'apres le 2026-10-30).
