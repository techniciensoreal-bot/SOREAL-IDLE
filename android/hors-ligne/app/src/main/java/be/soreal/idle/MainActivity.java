package be.soreal.idle;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import android.content.ContentValues;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.widget.Toast;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/*
 * SOREAL IDLE hors ligne (Norman, 2026-10-28) : une WebView plein écran sur https://appassets.androidplatform.net (adresse fictive : aucune requête ne part sur le réseau, tout est servi ICI).
 *  /                  -> demarrage.html (enregistre le service worker, qui fait tourner le vrai Worker du jeu, puis ouvre le jeu)
 *  /__medias/<clé>    -> assets/medias/<clé>   (images, voix, musiques : mêmes clés que le bucket de production)
 *  /__graine.json     -> assets/graine/catalogue.json
 *  tout le reste      -> assets/public/<chemin> (le dossier cloudflare/public du dépôt)
 * Les requêtes du jeu (/api/...) ne passent pas ici : le service worker les prend.
 */
public class MainActivity extends Activity {
    private static final String HOTE = "appassets.androidplatform.net";
    private static final String ORIGINE = "https://" + HOTE;
    private WebView vue;
    private Maj maj;

    private static final Map<String, String> TYPES = new HashMap<>();
    static {
        TYPES.put("html", "text/html"); TYPES.put("js", "text/javascript"); TYPES.put("mjs", "text/javascript"); TYPES.put("css", "text/css");
        TYPES.put("json", "application/json"); TYPES.put("webmanifest", "application/manifest+json"); TYPES.put("wasm", "application/wasm");
        TYPES.put("svg", "image/svg+xml"); TYPES.put("png", "image/png"); TYPES.put("jpg", "image/jpeg"); TYPES.put("jpeg", "image/jpeg");
        TYPES.put("webp", "image/webp"); TYPES.put("gif", "image/gif"); TYPES.put("ico", "image/x-icon");
        TYPES.put("woff2", "font/woff2"); TYPES.put("woff", "font/woff"); TYPES.put("ttf", "font/ttf");
        TYPES.put("m4a", "audio/mp4"); TYPES.put("mp3", "audio/mpeg"); TYPES.put("opus", "audio/ogg"); TYPES.put("ogg", "audio/ogg"); TYPES.put("wav", "audio/wav");
        TYPES.put("onnx", "application/octet-stream"); TYPES.put("mp4", "video/mp4"); TYPES.put("webm", "video/webm"); TYPES.put("txt", "text/plain");
    }

    private static String typeDe(String chemin) {
        int p = chemin.lastIndexOf('.');
        String t = p >= 0 ? TYPES.get(chemin.substring(p + 1).toLowerCase(Locale.ROOT)) : null;
        return t == null ? "application/octet-stream" : t;
    }

    private static WebResourceResponse reponse(int code, String raison, String type, Map<String, String> entetes, InputStream corps) {
        boolean texte = type.startsWith("text/") || type.contains("json") || type.contains("javascript");
        return new WebResourceResponse(type, texte ? "utf-8" : null, code, raison, entetes, corps);
    }

    /* Sert un fichier de l'APK, avec les plages d'octets (« Range ») dont la lecture des sons a besoin. */
    private WebResourceResponse servir(WebResourceRequest req) {
        Uri u = req.getUrl();
        if (!HOTE.equals(u.getHost())) return null;
        String chemin = u.getPath() == null ? "/" : u.getPath();
        String actif;
        if (chemin.equals("/") || chemin.isEmpty()) actif = "public/demarrage.html";
        else if (chemin.equals("/__graine.json")) actif = "graine/catalogue.json";
        else if (chemin.startsWith("/__medias/")) actif = "medias/" + chemin.substring("/__medias/".length());
        else actif = "public" + chemin;
        File sur = maj == null ? null : maj.fichier(actif);   /* un fichier mis à jour (Maj.java) prime sur celui de l'APK */
        Map<String, String> entetes = new HashMap<>();
        /* Images : gardées par la WebView (sinon chaque <img> recréé, par exemple en déplaçant un objet du sac, repartait en rechargement : clignotement, images tardives). Fichiers à ?v= : immuables. Le reste (page, état) : toujours revalidé. */
        String q = u.getQuery();
        if (chemin.startsWith("/__medias/") && typeDe(chemin).startsWith("image/")) entetes.put("Cache-Control", "public, max-age=600");
        else if (q != null && q.matches("(.*&)?v=[0-9]+(&.*)?") && !chemin.endsWith(".html")) entetes.put("Cache-Control", "public, max-age=31536000, immutable");
        else entetes.put("Cache-Control", "no-cache");
        entetes.put("Accept-Ranges", "bytes");
        String type = typeDe(actif);
        AssetManager am = getAssets();
        try {
            Map<String, String> h = req.getRequestHeaders();
            String plage = h == null ? null : (h.get("Range") != null ? h.get("Range") : h.get("range"));
            long taille = -1;
            if (sur != null) taille = sur.length();
            else try (AssetFileDescriptor fd = am.openFd(actif)) { taille = fd.getLength(); } catch (IOException e) { /* fichier compressé : taille inconnue */ }
            if ("HEAD".equals(req.getMethod())) {
                if (taille < 0) { try (InputStream is = am.open(actif)) { taille = is.available(); } }
                entetes.put("Content-Length", String.valueOf(taille));
                return reponse(200, "OK", type, entetes, new ByteArrayInputStream(new byte[0]));
            }
            InputStream flux = sur != null ? new FileInputStream(sur) : am.open(actif, AssetManager.ACCESS_STREAMING);
            if (plage != null && plage.startsWith("bytes=") && taille > 0) {
                String[] r = plage.substring(6).split(",")[0].split("-", -1);
                long debut, fin;
                if (r[0].isEmpty()) { long n = Long.parseLong(r[1]); debut = Math.max(0, taille - n); fin = taille - 1; }
                else { debut = Long.parseLong(r[0]); fin = (r.length < 2 || r[1].isEmpty()) ? taille - 1 : Math.min(taille - 1, Long.parseLong(r[1])); }
                if (debut >= taille || debut > fin) {
                    flux.close();
                    entetes.put("Content-Range", "bytes */" + taille);
                    return reponse(416, "Range Not Satisfiable", type, entetes, new ByteArrayInputStream(new byte[0]));
                }
                long reste = debut;
                while (reste > 0) { long s = flux.skip(reste); if (s <= 0) break; reste -= s; }
                entetes.put("Content-Range", "bytes " + debut + "-" + fin + "/" + taille);
                entetes.put("Content-Length", String.valueOf(fin - debut + 1));
                return reponse(206, "Partial Content", type, entetes, new Limite(flux, fin - debut + 1));
            }
            if (taille >= 0) entetes.put("Content-Length", String.valueOf(taille));
            return reponse(200, "OK", type, entetes, flux);
        } catch (IOException e) {
            return reponse(404, "Not Found", "text/plain", entetes, new ByteArrayInputStream("Not found".getBytes()));
        } catch (RuntimeException e) {
            return reponse(400, "Bad Request", "text/plain", entetes, new ByteArrayInputStream("Bad request".getBytes()));
        }
    }

    /* Flux limité à N octets. */
    private static final class Limite extends InputStream {
        private final InputStream in;
        private long reste;
        Limite(InputStream in, long n) { this.in = in; this.reste = n; }
        @Override public int read() throws IOException { if (reste <= 0) return -1; int c = in.read(); if (c >= 0) reste--; return c; }
        @Override public int read(byte[] b, int o, int l) throws IOException { if (reste <= 0) return -1; int n = in.read(b, o, (int) Math.min(l, reste)); if (n > 0) reste -= n; return n; }
        @Override public void close() throws IOException { in.close(); }
    }

    /* « Exporter ma partie » & co : la page fabrique un fichier (lien blob: avec l'attribut download) ; la WebView ne sait pas l'enregistrer, ce pont l'écrit dans Téléchargements. */
    private static final String SCRIPT_ENREGISTRER =
        "(function(){if(window.__soSauve)return;window.__soSauve=1;"
        + "function sauver(a){fetch(a.href).then(function(r){return r.blob();}).then(function(b){var fr=new FileReader();fr.onload=function(){var s=String(fr.result);"
        + "AndroidSoreal.enregistrer(a.download||'soreal-idle.bin',b.type||'application/octet-stream',s.slice(s.indexOf(',')+1));};fr.readAsDataURL(b);});}"
        + "var oc=HTMLAnchorElement.prototype.click;"
        + "HTMLAnchorElement.prototype.click=function(){if(this.download&&/^(blob:|data:)/.test(this.href)){sauver(this);return;}return oc.call(this);};"
        + "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');"
        + "if(a&&/^(blob:|data:)/.test(a.href)){e.preventDefault();e.stopPropagation();sauver(a);}},true);})();";
    private static final int CODE_FICHIER = 41;
    private ValueCallback<Uri[]> choixFichier;

    public class Pont {
        /* La page de démarrage confirme que le jeu démarre : une mise à jour à l'essai devient définitive (Maj.valider). */
        @JavascriptInterface public void demarrageOk() { if (maj != null) maj.valider(); }
        /* Réglages : version du code actif (JSON {code, version, date, enAttente}). */
        @JavascriptInterface public String versionCode() { return maj == null ? "{\"code\":\"embarqué\",\"version\":\"\",\"date\":\"\",\"enAttente\":false}" : maj.versionCode(); }
        @JavascriptInterface public void enregistrer(String nom, String mime, String base64) {
            try {
                byte[] octets = Base64.decode(base64, Base64.DEFAULT);
                String propre = (nom == null || nom.isEmpty() ? "soreal-idle.bin" : nom).replaceAll("[^A-Za-z0-9._-]", "_");
                OutputStream os;
                String ou;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, propre);
                    cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    os = getContentResolver().openOutputStream(uri);
                    ou = "Téléchargements";
                } else {
                    File dossier = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    dossier.mkdirs();
                    os = new FileOutputStream(new File(dossier, propre));
                    ou = dossier.getAbsolutePath();
                }
                os.write(octets);
                os.close();
                final String msg = "Fichier enregistré (" + ou + ") : " + propre;
                runOnUiThread(new Runnable() { @Override public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); } });
            } catch (Exception e) {
                final String msg = "Enregistrement impossible : " + e.getMessage();
                runOnUiThread(new Runnable() { @Override public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); } });
            }
        }
    }

    @Override protected void onActivityResult(int code, int res, Intent data) {
        if (code == CODE_FICHIER && choixFichier != null) {
            choixFichier.onReceiveValue(res == RESULT_OK && data != null ? WebChromeClient.FileChooserParams.parseResult(res, data) : null);
            choixFichier = null;
            return;
        }
        super.onActivityResult(code, res, data);
    }

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.parseColor("#0B1B39"));
        getWindow().setNavigationBarColor(Color.parseColor("#0B1B39"));
        WebView.setWebContentsDebuggingEnabled(true);
        maj = new Maj(this);
        maj.demarrer();   /* active le code téléchargé au lancement précédent (ou revient en arrière s'il n'a jamais démarré) */
        vue = new WebView(this);
        vue.setBackgroundColor(Color.parseColor("#071226"));
        setContentView(vue);
        WebSettings s = vue.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        /* Le service worker (le Worker du jeu) demande ses fichiers à la WebView comme la page : même service. */
        ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) { return servir(request); }
        });
        vue.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest request) { return servir(request); }
            @Override public void onPageStarted(WebView v, String url, android.graphics.Bitmap icone) { v.evaluateJavascript(SCRIPT_ENREGISTRER, null); }
            @Override public void onPageFinished(WebView v, String url) { v.evaluateJavascript(SCRIPT_ENREGISTRER, null); }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                if (HOTE.equals(request.getUrl().getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl())); } catch (RuntimeException e) { /* aucune application pour ce lien */ }
                return true;
            }
        });
        vue.addJavascriptInterface(new Pont(), "AndroidSoreal");
        vue.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> rappel, FileChooserParams p) {
                if (choixFichier != null) choixFichier.onReceiveValue(null);
                choixFichier = rappel;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try { startActivityForResult(Intent.createChooser(i, "Choisir un fichier"), CODE_FICHIER); }
                catch (RuntimeException e) { choixFichier = null; return false; }
                return true;
            }
            @Override public boolean onConsoleMessage(ConsoleMessage m) { Log.i("SorealIdle", m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")"); return true; }
        });
        immersif();
        vue.loadUrl(ORIGINE + "/");
        verifierMiseAJour(8000);
        signalerRetourArriere();
    }

    private android.app.AlertDialog dialogueMaj;

    private Maj.Ecouteur ecouteurMaj() {
        return new Maj.Ecouteur() {
            @Override public void pretePourRelance(final String notes) {
                runOnUiThread(new Runnable() { @Override public void run() { proposerRelance(notes); } });
            }
            @Override public void bloqueMobile(final long octets, final String notes) {
                runOnUiThread(new Runnable() { @Override public void run() { proposerTelechargementMobile(octets, notes); } });
            }
        };
    }

    /* Le code précédent a été remis automatiquement (la version à l'essai n'a jamais démarré) : un seul dialogue, puis l'indicateur est consommé. */
    private void signalerRetourArriere() {
        if (maj == null || vue == null) return;
        final Maj m = maj;
        final String sha = m.retourArriere();
        if (sha == null) return;
        vue.postDelayed(new Runnable() { @Override public void run() {
            if (isFinishing()) return;
            new android.app.AlertDialog.Builder(MainActivity.this)
                .setTitle("Mise à jour")
                .setMessage("La dernière mise à jour n'a pas pu démarrer : l'ancienne version a été remise.")
                .setPositiveButton("Réessayer", new android.content.DialogInterface.OnClickListener() { @Override public void onClick(android.content.DialogInterface d, int w) {
                    m.reessayer(sha);
                    verifierMiseAJour(500);
                } })
                .setNegativeButton("Fermer", null)
                .show();
        } }, 4000);
    }

    /* Téléchargement bloqué (plus de 40 Mo en réseau mobile) : le joueur peut le lancer quand même. Hors du fil d'interface ; erreurs silencieuses. */
    private void proposerTelechargementMobile(long octets, String notes) {
        if (isFinishing() || (dialogueMaj != null && dialogueMaj.isShowing())) return;
        final Maj m = maj;
        if (m == null) return;
        String taille = octets >= 1048576L ? Math.round(octets / 1048576.0) + " Mo" : Math.max(1, octets / 1024) + " Ko";
        dialogueMaj = new android.app.AlertDialog.Builder(this)
            .setTitle("Mise à jour disponible")
            .setMessage((notes == null || notes.isEmpty() ? "" : notes + "\n\n") + "Une mise à jour de " + taille + " attend le Wi-Fi. Tu peux la télécharger maintenant avec ton réseau mobile.")
            .setPositiveButton("Télécharger maintenant (réseau mobile)", new android.content.DialogInterface.OnClickListener() { @Override public void onClick(android.content.DialogInterface d, int w) {
                new Thread(new Runnable() { @Override public void run() {
                    try { m.telechargerForce(ecouteurMaj()); } catch (Exception e) { /* silencieux : le jeu n'est pas concerné */ }
                } }, "maj-apk-forcee").start();
            } })
            .setNegativeButton("Plus tard", null)
            .show();
    }

    /* Cherche une mise à jour signée (hors ligne : rien ne se passe) ; si du code nouveau est prêt, propose de relancer. */
    private void verifierMiseAJour(long delai) {
        if (maj == null) return;
        final Maj m = maj;
        vue.postDelayed(new Runnable() { @Override public void run() {
            new Thread(new Runnable() { @Override public void run() {
                m.verifierEnLigne(ecouteurMaj(), false);
            } }, "maj-apk").start();
        } }, delai);
    }

    private void proposerRelance(String notes) {
        if (isFinishing() || (dialogueMaj != null && dialogueMaj.isShowing())) return;
        dialogueMaj = new android.app.AlertDialog.Builder(this)
            .setTitle("Mise à jour prête")
            .setMessage((notes == null || notes.isEmpty() ? "Une nouvelle version du jeu est prête." : notes) + "\n\nRelancer maintenant ? (Sinon elle s'activera à la prochaine ouverture.)")
            .setPositiveButton("Relancer", new android.content.DialogInterface.OnClickListener() { @Override public void onClick(android.content.DialogInterface d, int w) {
                if (vue != null) vue.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null);
                getWindow().getDecorView().postDelayed(new Runnable() { @Override public void run() { recreate(); } }, 1500);
            } })
            .setNegativeButton("Plus tard", null)
            .show();
    }

    /* Barre d'état (heure) et boutons de navigation TOUJOURS visibles, comme sur l'ancienne application (Norman, 2026-10-31) : plus de plein écran. */
    private void immersif() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersif(); }
    @Override protected void onPause() { super.onPause(); if (vue != null) vue.onPause(); }
    @Override protected void onResume() { super.onResume(); if (vue != null) { vue.onResume(); verifierMiseAJour(3000); } }
    /* Retour : l'application se FERME (comme l'ancienne version, Norman 2026-10-30 : « l'ancien se fermait ») ; la page a le temps d'enregistrer la partie (événement pagehide, comme avant une relance). */
    private boolean fermeture = false;
    @Override public void onBackPressed() {
        if (fermeture) return;
        fermeture = true;
        if (vue != null) vue.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null);
        getWindow().getDecorView().postDelayed(new Runnable() { @Override public void run() { finishAndRemoveTask(); } }, vue != null ? 700 : 0);
    }
    @Override protected void onDestroy() { if (vue != null) { vue.destroy(); vue = null; } super.onDestroy(); }
}
