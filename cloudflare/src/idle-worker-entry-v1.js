export { SorealIdleCoordinatorV1 } from "./index-idle-coordinator-v1.js";

/*
 * Ce Worker n'est jamais appelé directement par un navigateur — seul le
 * binding Durable Object cross-script depuis "soreal-tv" (SOREAL_IDLE)
 * l'atteint. Aucune route publique stable n'est nécessaire ici.
 */
export default {
  async fetch() {
    return new Response("SOREAL Idle Worker", { status: 404 });
  }
};
