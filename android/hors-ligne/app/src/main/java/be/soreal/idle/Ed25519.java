package be.soreal.idle;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.Arrays;

/*
 * Vérification de signature Ed25519 (RFC 8032), sans bibliothèque : Android n'offre Ed25519 qu'à partir de la version 13. Sert à vérifier le manifeste des mises à jour (même clé que l'application Windows).
 * Seule la VÉRIFICATION existe ici (aucune clé privée ne touche l'application).
 */
final class Ed25519 {
    private static final BigInteger P = BigInteger.ONE.shiftLeft(255).subtract(BigInteger.valueOf(19));
    private static final BigInteger L = BigInteger.ONE.shiftLeft(252).add(new BigInteger("27742317777372353535851937790883648493"));
    private static final BigInteger D = BigInteger.valueOf(-121665).multiply(BigInteger.valueOf(121666).modInverse(P)).mod(P);
    private static final BigInteger I = BigInteger.valueOf(2).modPow(P.subtract(BigInteger.ONE).shiftRight(2), P);
    private static final BigInteger[] B = base();

    private static BigInteger[] base() {
        BigInteger y = BigInteger.valueOf(4).multiply(BigInteger.valueOf(5).modInverse(P)).mod(P);
        return new BigInteger[] { racineX(y, false), y };
    }

    private static BigInteger racineX(BigInteger y, boolean impair) {
        BigInteger y2 = y.multiply(y).mod(P);
        BigInteger x2 = y2.subtract(BigInteger.ONE).multiply(D.multiply(y2).add(BigInteger.ONE).modInverse(P)).mod(P);
        BigInteger x = x2.modPow(P.add(BigInteger.valueOf(3)).shiftRight(3), P);
        if (!x.multiply(x).subtract(x2).mod(P).equals(BigInteger.ZERO)) x = x.multiply(I).mod(P);
        if (!x.multiply(x).subtract(x2).mod(P).equals(BigInteger.ZERO)) return null;
        if (x.testBit(0) != impair) x = P.subtract(x).mod(P);
        return x;
    }

    private static BigInteger[] additionner(BigInteger[] a, BigInteger[] b) {
        BigInteger xx = a[0].multiply(b[0]).mod(P), yy = a[1].multiply(b[1]).mod(P);
        BigInteger dxy = D.multiply(xx).mod(P).multiply(yy).mod(P);
        BigInteger x3 = a[0].multiply(b[1]).add(b[0].multiply(a[1])).mod(P).multiply(BigInteger.ONE.add(dxy).mod(P).modInverse(P)).mod(P);
        BigInteger y3 = yy.add(xx).mod(P).multiply(BigInteger.ONE.subtract(dxy).mod(P).modInverse(P)).mod(P);
        return new BigInteger[] { x3, y3 };
    }

    private static BigInteger[] multiplier(BigInteger[] point, BigInteger n) {
        BigInteger[] r = { BigInteger.ZERO, BigInteger.ONE };
        BigInteger[] q = point;
        for (int i = 0; i < n.bitLength(); i++) {
            if (n.testBit(i)) r = additionner(r, q);
            q = additionner(q, q);
        }
        return r;
    }

    private static byte[] encoder(BigInteger[] p) {
        byte[] le = new byte[32];
        byte[] be = p[1].toByteArray();
        for (int i = 0; i < be.length && i < 33; i++) { int j = be.length - 1 - i; if (i < 32) le[i] = be[j]; }
        if (p[0].testBit(0)) le[31] |= (byte) 0x80;
        return le;
    }

    private static BigInteger entierLE(byte[] o, int debut, int fin) {
        byte[] be = new byte[fin - debut];
        for (int i = 0; i < be.length; i++) be[i] = o[fin - 1 - i];
        return new BigInteger(1, be);
    }

    private static BigInteger[] decoder(byte[] o) {
        if (o.length != 32) return null;
        byte[] c = o.clone();
        boolean impair = (c[31] & 0x80) != 0;
        c[31] &= 0x7f;
        BigInteger y = entierLE(c, 0, 32);
        if (y.compareTo(P) >= 0) return null;
        BigInteger x = racineX(y, impair);
        if (x == null) return null;
        if (x.equals(BigInteger.ZERO) && impair) return null;
        return new BigInteger[] { x, y };
    }

    /* vrai si `signature` (64 octets) est la signature Ed25519 de `message` par la clé publique `cle` (32 octets). */
    static boolean verifier(byte[] cle, byte[] message, byte[] signature) {
        try {
            if (cle == null || cle.length != 32 || signature == null || signature.length != 64) return false;
            byte[] r = Arrays.copyOfRange(signature, 0, 32);
            BigInteger s = entierLE(signature, 32, 64);
            if (s.compareTo(L) >= 0) return false;
            BigInteger[] a = decoder(cle);
            if (a == null || decoder(r) == null) return false;
            MessageDigest sha = MessageDigest.getInstance("SHA-512");
            sha.update(r); sha.update(cle); sha.update(message);
            BigInteger h = entierLE(sha.digest(), 0, 64).mod(L);
            BigInteger[] sb = multiplier(B, s);
            BigInteger[] ha = multiplier(a, h);
            BigInteger[] negHa = { P.subtract(ha[0]).mod(P), ha[1] };
            return Arrays.equals(encoder(additionner(sb, negHa)), r);
        } catch (Exception e) {
            return false;
        }
    }
}
