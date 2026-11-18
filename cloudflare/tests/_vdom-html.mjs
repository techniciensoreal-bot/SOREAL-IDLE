/*
 * Aide des tests qui lisent le HTML d'une page migrée vers Preact (modules/vdom-pont-v1.js) : la page ne renvoie plus qu'un conteneur stable (<div id="vdom-CLE" data-vdom="CLE" data-morph-vivant></div>) ;
 * `deplierVdom` remplace chaque conteneur de la chaîne par le rendu synchrone (rendreHtml) de son composant, tel que le pont l'a enregistré.
 */
export function deplierVdom(fenetre, chaine) {
  const V = fenetre.__SOREAL_IDLE_VDOM_V1__;
  return String(chaine).replace(/<div id="vdom-([\w-]+)" data-vdom="[\w-]+" data-morph-vivant><\/div>/g, (m, cle) => {
    const e = V && V.registre && V.registre[cle];
    return e && e.comp ? V.rendreHtml(e.comp, e.props) : m;
  });
}
