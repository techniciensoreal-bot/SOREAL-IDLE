package be.soreal.idle;

import android.content.Context;
import android.net.ConnectivityManager;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/*
 * Mises à jour de l'APK hors ligne (Norman, 2026-10-29 : « à l'avenir par mise à jour, pas par reconstruction »). Même principe que l'application Windows (desktop/src/maj.mjs) :
 *  - le propriétaire publie un manifeste SIGNÉ (node desktop/publier-maj.mjs --apk --publier) : idle/_maj-apk/manifeste.json {version, notes, code:{cle,taille,sha256}, medias:[[clé,taille,etag]…], signature} ;
 *  - l'application le lit au lancement (et au retour au premier plan, au plus toutes les 30 minutes), vérifie la signature Ed25519 avec la clé publique embarquée (assets/maj-cle-publique.pem), puis télécharge
 *    seulement ce qui a changé : les médias dont l'empreinte publiée diffère (posés tout de suite, fichier par fichier) et, si le code a changé, le paquet de code (zip « public/… »), vérifié par son SHA-256 ;
 *  - le nouveau code ne s'active qu'au lancement suivant (dialogue « Relancer maintenant ? ») ; il reste « à l'essai » tant que la page de démarrage n'a pas confirmé que le jeu démarre (Pont.demarrageOk) ;
 *    après 2 lancements sans confirmation, l'application revient au code précédent et ne reprend plus cette version.
 * Dossier : <données de l'application>/maj/{etat.json, pret.json, code/<empreinte>/public/…, medias/<clé>, medias-etags.json, medias-index.json}. Rien ici ne peut empêcher le jeu de démarrer : toute erreur est ignorée.
 */
final class Maj {
    static final String SERVEUR = "https://soreal-idle.technicien-soreal.workers.dev";
    static final String CLE_MANIFESTE = "idle/_maj-apk/manifeste.json";
    private static final long LIMITE_DONNEES_MOBILES = 40L * 1048576L;

    /* pretePourRelance : le code est téléchargé et prêt. bloqueMobile : le téléchargement attend le Wi-Fi (plus de LIMITE_DONNEES_MOBILES octets en réseau mobile) : le joueur peut le forcer (telechargerForce). */
    interface Ecouteur { void pretePourRelance(String notes); void bloqueMobile(long octets, String notes); }

    private final Context ctx;
    private final File racine;
    private final AtomicBoolean enCours = new AtomicBoolean(false);
    private long derniereVerification = 0;

    Maj(Context c) {
        ctx = c.getApplicationContext();
        racine = new File(ctx.getFilesDir(), "maj");
    }

    /* ---------- état ---------- */

    private JSONObject lireJson(File f) {
        try (InputStream is = new FileInputStream(f)) { return new JSONObject(new String(lireTout(is), "UTF-8")); }
        catch (Exception e) { return null; }
    }

    private void ecrireJson(File f, JSONObject o) {
        try {
            f.getParentFile().mkdirs();
            File tmp = new File(f.getPath() + ".tmp");
            try (FileOutputStream os = new FileOutputStream(tmp)) { os.write(o.toString().getBytes("UTF-8")); }
            if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f); }
        } catch (Exception e) { /* tant pis : l'état précédent reste */ }
    }

    private static byte[] lireTout(InputStream is) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] t = new byte[16384];
        int n;
        while ((n = is.read(t)) > 0) b.write(t, 0, n);
        return b.toByteArray();
    }

    private JSONObject etat() {
        JSONObject e = lireJson(new File(racine, "etat.json"));
        return e == null ? new JSONObject() : e;
    }

    private static boolean contient(JSONObject e, String liste, String valeur) {
        JSONArray a = e.optJSONArray(liste);
        if (a == null) return false;
        for (int i = 0; i < a.length(); i++) if (valeur.equals(a.optString(i))) return true;
        return false;
    }

    /* Au lancement, avant de charger la page : active le code téléchargé, ou revient en arrière si la version à l'essai n'a jamais démarré. */
    synchronized void demarrer() {
        try {
            JSONObject e = etat();
            File pret = new File(racine, "pret.json");
            JSONObject p = lireJson(pret);
            if (p != null) {
                String v = p.optString("version", "");
                if (!v.isEmpty() && new File(racine, "code/" + v).isDirectory()) {
                    e.put("precedent", e.optString("courant", ""));
                    e.put("precedentSha", e.optString("courantSha", ""));
                    e.put("precedentVersion", e.optString("courantVersion", ""));
                    e.put("precedentDate", e.optString("courantDate", ""));
                    e.put("courant", v);
                    e.put("courantSha", p.optString("sha256", ""));
                    e.put("courantVersion", p.optString("manifeste", ""));
                    e.put("courantDate", p.optString("date", ""));
                    e.put("enAttente", true);
                    e.put("tentatives", 0);
                }
                pret.delete();
            }
            if (e.optBoolean("enAttente", false)) {
                int t = e.optInt("tentatives", 0) + 1;
                if (t > 2) {
                    JSONArray refuse = e.optJSONArray("refuse");
                    if (refuse == null) refuse = new JSONArray();
                    refuse.put(e.optString("courantSha", ""));
                    e.put("refuse", refuse);
                    /* Indicateur lu au lancement suivant (dialogue unique, Maj.retourArriere) : l'ancienne version a été remise. */
                    e.put("retourArriere", true);
                    e.put("retourArriereDate", String.valueOf(System.currentTimeMillis()));
                    e.put("retourArriereSha", e.optString("courantSha", ""));
                    supprimer(new File(racine, "code/" + e.optString("courant", "")));
                    e.put("courant", e.optString("precedent", ""));
                    e.put("courantSha", e.optString("precedentSha", ""));
                    e.put("courantVersion", e.optString("precedentVersion", ""));
                    e.put("courantDate", e.optString("precedentDate", ""));
                    e.put("enAttente", false);
                    e.put("tentatives", 0);
                } else e.put("tentatives", t);
            }
            ecrireJson(new File(racine, "etat.json"), e);
        } catch (Exception ex) { /* le code embarqué sert */ }
    }

    /* Retour automatique à l'ancien code : renvoie l'empreinte refusée UNE seule fois (l'indicateur est consommé), sinon null. */
    synchronized String retourArriere() {
        try {
            JSONObject e = etat();
            if (!e.optBoolean("retourArriere", false)) return null;
            String sha = e.optString("retourArriereSha", "");
            e.put("retourArriere", false);
            ecrireJson(new File(racine, "etat.json"), e);
            return sha;
        } catch (Exception ex) { return null; }
    }

    /* « Réessayer » : retire l'empreinte de la liste des refusées ; la prochaine vérification retélécharge ce code. */
    synchronized void reessayer(String sha) {
        try {
            JSONObject e = etat();
            JSONArray refuse = e.optJSONArray("refuse");
            JSONArray reste = new JSONArray();
            if (refuse != null) for (int i = 0; i < refuse.length(); i++) if (!refuse.optString(i).equals(sha)) reste.put(refuse.optString(i));
            e.put("refuse", reste);
            ecrireJson(new File(racine, "etat.json"), e);
            derniereVerification = 0;
        } catch (Exception ex) { /* sans importance */ }
    }

    /* Pour les Réglages (Pont.versionCode) : {"code":"embarqué"|empreinte courte,"version":…,"date":…,"enAttente":…}. */
    synchronized String versionCode() {
        try {
            JSONObject e = etat();
            String sha = e.optString("courantSha", "");
            boolean actif = !e.optString("courant", "").isEmpty() && !sha.isEmpty();
            JSONObject o = new JSONObject();
            o.put("code", actif ? sha.substring(0, Math.min(8, sha.length())) : "embarqué");
            o.put("version", actif ? e.optString("courantVersion", "") : "");
            o.put("date", actif ? e.optString("courantDate", "") : "");
            o.put("enAttente", e.optBoolean("enAttente", false));
            return o.toString();
        } catch (Exception ex) { return "{\"code\":\"embarqué\",\"version\":\"\",\"date\":\"\",\"enAttente\":false}"; }
    }

    /* La page de démarrage a confirmé que le jeu démarre : la version à l'essai devient définitive et l'ancienne est supprimée. */
    synchronized void valider() {
        try {
            JSONObject e = etat();
            if (!e.optBoolean("enAttente", false)) return;
            e.put("enAttente", false);
            e.put("tentatives", 0);
            e.put("precedent", "");
            e.put("precedentSha", "");
            ecrireJson(new File(racine, "etat.json"), e);
            File[] dossiers = new File(racine, "code").listFiles();
            if (dossiers != null) for (File d : dossiers) if (!d.getName().equals(e.optString("courant", "")) && !d.getName().endsWith(".tmp")) supprimer(d);
        } catch (Exception ex) { /* sans importance */ }
    }

    private static void supprimer(File f) {
        if (f == null || !f.exists()) return;
        File[] fils = f.listFiles();
        if (fils != null) for (File x : fils) supprimer(x);
        f.delete();
    }

    /* ---------- lecture : le dossier de mise à jour prime sur les assets de l'APK ---------- */

    private static File dansDossier(File base, String relatif) {
        try {
            File f = new File(base, relatif);
            String b = base.getCanonicalPath() + File.separator;
            return f.getCanonicalPath().startsWith(b) && f.isFile() ? f : null;
        } catch (IOException e) { return null; }
    }

    /* `actif` : « public/… » (code) ou « medias/… ». Renvoie le fichier mis à jour, ou null (alors c'est l'APK qui sert). */
    File fichier(String actif) {
        try {
            if (actif.equals("medias/_index.json")) return dansDossier(racine, "medias-index.json");
            if (actif.startsWith("medias/")) return dansDossier(new File(racine, "medias"), actif.substring(7));
            if (actif.startsWith("public/")) {
                String courant = etat().optString("courant", "");
                if (courant.isEmpty()) return null;
                return dansDossier(new File(racine, "code/" + courant), actif);
            }
        } catch (Exception e) { /* l'APK sert */ }
        return null;
    }

    /* ---------- vérification en ligne ---------- */

    void verifierEnLigne(final Ecouteur ecouteur, boolean force) { verifierEnLigne(ecouteur, force, false); }

    /* « Télécharger maintenant (réseau mobile) » : ignore la limite de données mobiles. À appeler hors du fil d'interface. */
    void telechargerForce(final Ecouteur ecouteur) { verifierEnLigne(ecouteur, true, true); }

    private void verifierEnLigne(final Ecouteur ecouteur, boolean force, boolean ignorerLimite) {
        long maintenant = System.currentTimeMillis();
        if (!force && maintenant - derniereVerification < 30L * 60000L) return;
        if (!enCours.compareAndSet(false, true)) return;
        derniereVerification = maintenant;
        try { verifier(ecouteur, ignorerLimite); }
        catch (Exception e) { /* hors ligne ou serveur indisponible : on réessaiera */ }
        finally { enCours.set(false); }
    }

    private HttpURLConnection ouvrir(String cle) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(SERVEUR + "/api/v1/maj/fichier?cle=" + URLEncoder.encode(cle, "UTF-8")).openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(30000);
        return c;
    }

    private byte[] telecharger(String cle) throws IOException {
        HttpURLConnection c = ouvrir(cle);
        try {
            if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode());
            try (InputStream is = c.getInputStream()) { return lireTout(is); }
        } finally { c.disconnect(); }
    }

    /* Télécharge dans `dest` (écriture atomique) et renvoie ses empreintes {md5, sha256} en hexadécimal. */
    private String[] telechargerVers(String cle, File dest, long tailleAttendue) throws Exception {
        dest.getParentFile().mkdirs();
        File part = new File(dest.getPath() + ".part");
        MessageDigest md5 = MessageDigest.getInstance("MD5"), sha = MessageDigest.getInstance("SHA-256");
        long total = 0;
        HttpURLConnection c = ouvrir(cle);
        try {
            if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode());
            try (InputStream is = c.getInputStream(); FileOutputStream os = new FileOutputStream(part)) {
                byte[] t = new byte[65536];
                int n;
                while ((n = is.read(t)) > 0) { os.write(t, 0, n); md5.update(t, 0, n); sha.update(t, 0, n); total += n; }
            }
        } finally { c.disconnect(); }
        if (tailleAttendue >= 0 && total != tailleAttendue) { part.delete(); throw new IOException("taille inattendue : " + cle); }
        dest.delete();
        if (!part.renameTo(dest)) { part.delete(); throw new IOException("écriture impossible : " + cle); }
        return new String[] { hex(md5.digest()), hex(sha.digest()) };
    }

    private static String hex(byte[] o) {
        StringBuilder s = new StringBuilder();
        for (byte b : o) s.append(String.format("%02x", b & 0xff));
        return s.toString();
    }

    private byte[] cleManifeste() {
        try (InputStream is = ctx.getAssets().open("maj-cle-publique.pem")) {
            String pem = new String(lireTout(is), "UTF-8").replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
            byte[] der = Base64.decode(pem, Base64.DEFAULT);
            byte[] cle = new byte[32];
            System.arraycopy(der, der.length - 32, cle, 0, 32);
            return cle;
        } catch (Exception e) { return null; }
    }

    private boolean signatureValide(JSONObject m) {
        try {
            String sig = m.optString("signature", "");
            if (sig.isEmpty()) return false;
            JSONObject reste = new JSONObject(m.toString());
            reste.remove("signature");
            return Ed25519.verifier(cleManifeste(), canonique(reste).getBytes("UTF-8"), Base64.decode(sig, Base64.DEFAULT));
        } catch (Exception e) { return false; }
    }

    /* Même forme que desktop/src/maj.mjs (canonique) : clés triées, JSON.stringify pour les chaînes. */
    static String canonique(Object v) {
        if (v == null || v == JSONObject.NULL) return "null";
        if (v instanceof JSONObject) {
            JSONObject o = (JSONObject) v;
            List<String> cles = new ArrayList<>();
            for (Iterator<String> it = o.keys(); it.hasNext(); ) cles.add(it.next());
            Collections.sort(cles);
            StringBuilder s = new StringBuilder("{");
            for (int i = 0; i < cles.size(); i++) { if (i > 0) s.append(','); s.append(citer(cles.get(i))).append(':').append(canonique(o.opt(cles.get(i)))); }
            return s.append('}').toString();
        }
        if (v instanceof JSONArray) {
            JSONArray a = (JSONArray) v;
            StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < a.length(); i++) { if (i > 0) s.append(','); s.append(canonique(a.opt(i))); }
            return s.append(']').toString();
        }
        if (v instanceof String) return citer((String) v);
        if (v instanceof Number) {
            double d = ((Number) v).doubleValue();
            return d == Math.rint(d) && Math.abs(d) < 9e15 ? Long.toString(((Number) v).longValue()) : v.toString();
        }
        return String.valueOf(v);
    }

    private static String citer(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\b': b.append("\\b"); break;
                case '\f': b.append("\\f"); break;
                case '\n': b.append("\\n"); break;
                case '\r': b.append("\\r"); break;
                case '\t': b.append("\\t"); break;
                default: if (c < 0x20) b.append(String.format("\\u%04x", (int) c)); else b.append(c);
            }
        }
        return b.append('"').toString();
    }

    private String lireAsset(String nom) {
        try (InputStream is = ctx.getAssets().open(nom)) { return new String(lireTout(is), "UTF-8").trim(); }
        catch (Exception e) { return ""; }
    }

    private boolean donneesMobiles() {
        try {
            ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
            return cm != null && cm.isActiveNetworkMetered();
        } catch (Exception e) { return false; }
    }

    /* Supprime de medias/ tout fichier dont la clé n'est plus publiée, et l'oublie dans les deux index. Un manifeste sans médias ne supprime jamais rien. */
    private boolean nettoyerMedias(JSONArray medias, JSONObject etags, JSONObject index) {
        if (medias == null || medias.length() == 0) return false;
        boolean change = false;
        try {
            java.util.HashSet<String> publiees = new java.util.HashSet<>();
            for (int i = 0; i < medias.length(); i++) {
                JSONArray f = medias.optJSONArray(i);
                if (f != null && f.length() > 0) publiees.add(f.optString(0));
            }
            change = purgerDossier(new File(racine, "medias"), "", publiees);
            JSONObject[] tables = new JSONObject[] { etags, index };
            for (JSONObject o : tables) {
                List<String> aRetirer = new ArrayList<>();
                for (Iterator<String> it = o.keys(); it.hasNext(); ) { String k = it.next(); if (!publiees.contains(k)) aRetirer.add(k); }
                for (String k : aRetirer) { o.remove(k); change = true; }
            }
        } catch (Exception x) { /* sans importance */ }
        return change;
    }

    private boolean purgerDossier(File dossier, String prefixe, java.util.Set<String> publiees) {
        boolean change = false;
        File[] fils = dossier.listFiles();
        if (fils == null) return false;
        for (File x : fils) {
            String cle = prefixe + x.getName();
            if (x.isDirectory()) {
                if (purgerDossier(x, cle + "/", publiees)) change = true;
                String[] reste = x.list();
                if (reste != null && reste.length == 0) x.delete();
            } else if (!x.getName().endsWith(".part") && !publiees.contains(cle)) { if (x.delete()) change = true; }
        }
        return change;
    }

    private void verifier(Ecouteur ecouteur, boolean ignorerLimite) throws Exception {
        JSONObject m = new JSONObject(new String(telecharger(CLE_MANIFESTE), "UTF-8"));
        if (!signatureValide(m)) return;
        JSONObject e = etat();

        /* 1. médias : seulement ceux dont l'empreinte publiée diffère de celle que l'application a */
        JSONObject baseEtags = null;
        try { baseEtags = new JSONObject(lireAsset("medias/_etags.json")); } catch (Exception x) { baseEtags = new JSONObject(); }
        JSONObject etags = lireJson(new File(racine, "medias-etags.json"));
        if (etags == null) etags = new JSONObject();
        JSONObject index = lireJson(new File(racine, "medias-index.json"));
        if (index == null) { try { index = new JSONObject(lireAsset("medias/_index.json")); } catch (Exception x) { index = new JSONObject(); } }
        JSONArray medias = m.optJSONArray("medias");
        List<JSONArray> aTelecharger = new ArrayList<>();
        long octets = 0;
        if (medias != null) for (int i = 0; i < medias.length(); i++) {
            JSONArray f = medias.optJSONArray(i);
            if (f == null || f.length() < 3) continue;
            String cle = f.optString(0), etag = f.optString(2);
            String connu = etags.has(cle) ? etags.optString(cle) : baseEtags.optString(cle, "");
            if (!etag.isEmpty() && etag.equals(connu)) continue;
            if (etag.isEmpty() && index.has(cle) && index.optLong(cle) == f.optLong(1)) continue;
            aTelecharger.add(f);
            octets += f.optLong(1);
        }

        /* 2. code */
        JSONObject code = m.optJSONObject("code");
        String shaCode = code == null ? "" : code.optString("sha256", "");
        String shaConnu = e.optString("courantSha", "");
        if (shaConnu.isEmpty()) shaConnu = lireAsset("code-sha.txt");
        JSONObject pret = lireJson(new File(racine, "pret.json"));
        boolean codeNeuf = !shaCode.isEmpty() && !shaCode.equals(shaConnu) && !contient(e, "refuse", shaCode) && (pret == null || !shaCode.equals(pret.optString("sha256", "")));
        if (codeNeuf) octets += code.optLong("taille", 0);

        /* Espace disque : les médias retirés du manifeste (voix obsolètes…) sont supprimés du dossier de mise à jour (les assets de l'APK ne sont jamais touchés). */
        if (nettoyerMedias(medias, etags, index)) {
            ecrireJson(new File(racine, "medias-etags.json"), etags);
            ecrireJson(new File(racine, "medias-index.json"), index);
        }

        /* Code déjà téléchargé et prêt mais pas encore appliqué : on le re-propose à chaque lancement. */
        if (!codeNeuf && pret != null && !shaCode.isEmpty() && shaCode.equals(pret.optString("sha256", "")) && ecouteur != null) ecouteur.pretePourRelance(m.optString("notes", ""));

        if (aTelecharger.isEmpty() && !codeNeuf) return;
        if (!ignorerLimite && octets > LIMITE_DONNEES_MOBILES && donneesMobiles()) {   /* gros téléchargement : Wi-Fi seulement, sauf si le joueur le demande */
            if (ecouteur != null) ecouteur.bloqueMobile(octets, m.optString("notes", ""));
            return;
        }

        for (JSONArray f : aTelecharger) {
            String cle = f.optString(0), etag = f.optString(2);
            if (cle.isEmpty() || cle.contains("..") || cle.startsWith("/")) continue;
            try {
                String[] h = telechargerVers(cle, new File(racine, "medias/" + cle), f.optLong(1, -1));
                if (etag.matches("[0-9a-f]{32}") && !etag.equals(h[0])) { new File(racine, "medias/" + cle).delete(); continue; }
                etags.put(cle, etag);
                index.put(cle, f.optLong(1));
            } catch (Exception x) { /* ce fichier sera repris au prochain passage */ }
        }
        ecrireJson(new File(racine, "medias-etags.json"), etags);
        ecrireJson(new File(racine, "medias-index.json"), index);

        if (codeNeuf) {
            String dossier = shaCode.substring(0, 16);
            File zip = new File(racine, "code-" + dossier + ".zip");
            String[] h = telechargerVers(code.optString("cle"), zip, code.optLong("taille", -1));
            if (!h[1].equals(shaCode)) { zip.delete(); return; }
            File tmp = new File(racine, "code/" + dossier + ".tmp");
            supprimer(tmp);
            try (ZipInputStream z = new ZipInputStream(new FileInputStream(zip))) {
                ZipEntry en;
                while ((en = z.getNextEntry()) != null) {
                    String nom = en.getName();
                    if (en.isDirectory() || !nom.startsWith("public/") || nom.contains("..") || nom.contains("\\")) continue;
                    File dest = new File(tmp, nom);
                    dest.getParentFile().mkdirs();
                    try (FileOutputStream os = new FileOutputStream(dest)) { byte[] t = new byte[65536]; int n; while ((n = z.read(t)) > 0) os.write(t, 0, n); }
                }
            }
            zip.delete();
            File final_ = new File(racine, "code/" + dossier);
            supprimer(final_);
            if (!tmp.renameTo(final_)) return;
            JSONObject p = new JSONObject();
            p.put("version", dossier);
            p.put("sha256", shaCode);
            p.put("manifeste", m.optString("version", ""));
            p.put("date", String.valueOf(System.currentTimeMillis()));
            ecrireJson(new File(racine, "pret.json"), p);
            if (ecouteur != null) ecouteur.pretePourRelance(m.optString("notes", ""));
        }
    }
}
