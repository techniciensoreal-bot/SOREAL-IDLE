/*
 * Worker de récolte (LECTURE SEULE) : lancé un court instant par desktop/recolter.mjs avec « wrangler dev --remote », donc avec la connexion wrangler de l'administrateur (jamais un jeton manipulé par un script).
 * Il ne sait que lister et lire le bucket « soreal » ; aucune écriture, aucune suppression.
 */
export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    if (u.pathname === "/ping") return new Response("ok");
    if (u.pathname === "/liste") {
      const options = { prefix: u.searchParams.get("prefix") || "", limit: 1000 };
      const curseur = u.searchParams.get("curseur");
      if (curseur) options.cursor = curseur;
      const r = await env.SOREAL_R2.list(options);
      return Response.json({ objets: r.objects.map((o) => ({ cle: o.key, taille: o.size, etag: o.etag })), tronque: r.truncated, curseur: r.truncated ? r.cursor : null });
    }
    if (u.pathname === "/objet") {
      const o = await env.SOREAL_R2.get(u.searchParams.get("cle") || "");
      if (!o) return new Response("absent", { status: 404 });
      return new Response(o.body, { headers: { "content-length": String(o.size) } });
    }
    return new Response("Not found", { status: 404 });
  }
};
