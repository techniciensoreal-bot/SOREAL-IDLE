# Refonte du menu Chroniques — liste de contrôle (tenue à jour par l'agent)

Mission (Norman, 2026-11-02) : refaire TOUT le menu Chroniques en beaucoup plus beau, façon Diablo (couleurs, boutons, formes, tout). Puis : l'orchestrateur pousse, publie, et éteint le PC.

- [x] 0. Inventaire : onglets = Collection (Boss / Équipement / Sets), Classement, Succès, Cinématiques (`chroniquesOngletsIdleV1_`) ; fichiers : ui-chroniques-v1.js, page-chroniques-v1.js (nouveau), profile-v1.js (Succès), ui-inventaire-v1.js (Équipement), soreal-idle-chroniques.css (nouveau)
- [x] 1. Design commun + barre d'onglets du menu (plaques biseautées, gemme, reflet)
- [x] 2. Collection > Boss (cadre sang + gouttes, bouton doré ; l'album intérieur est inchangé)
- [x] 3. Collection > Équipement (cadre forge/rivets, cartes acier)
- [x] 4. Collection > Sets (cartes ornées, 8 motifs, 6 teintes, sceau, jauges)
- [x] 5. Succès (CSS seulement : tuiles, groupes, cases)
- [x] 6. Classement (sous-onglets, lignes, médailles SVG)
- [x] 7. Cinématiques (carte pellicule, bouton doré)
- [x] 8. Autres onglets : aucun autre dans le menu Chroniques (le profil/pseudo est dans Réglages, non touché)
- [ ] 9. Tests (suite complète en cours), audit vert, pins montés deux fois
- [x] 10. Note du jour (2 lignes + traductions) + marquer-nouveautes-push
- [ ] 11. Rapport final

## Journal
- 2026-11-02 : étapes 0 à 8 et 10 faites (maquette vérifiée PC + téléphone), commit à faire après la suite complète.

## RESTE À FAIRE
- Valider dans le vrai jeu (vraie sauvegarde) ; l'en-tête interne de la page est masqué par le système des 4 barres (non retouché).
