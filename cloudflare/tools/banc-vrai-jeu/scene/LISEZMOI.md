# Lecture des valeurs de scène Unity (level0) — 2026-11-17

Les constantes posées dans l'éditeur Unity (pas dans le code IL) sont sérialisées dans `NGUIdle_Data/level0`. Ces outils les lisent :
- `sf.mjs` : parseur du fichier de scène (Unity 2019.4.22f1, format v21, sans typetree).
- `scene.mjs` : relie chaque MonoBehaviour à sa classe via la table MonoScript de `globalgamemanagers.assets`.
- `des.mjs` : désérialiseur générique ; lit les champs dans l'ORDRE de l'IL (via `../lecteur-il.mjs`). Règles : bool, char, short alignés sur 4 octets sauf éléments de tableau ; `List<List<>>`, dictionnaires et classes sans `[Serializable]` ne sont pas sérialisés.
- `dumpall.mjs` : `node dumpall.mjs` écrit `scene-dump.json` (dans le dossier courant) avec toutes les valeurs ; validé pour 200 classes sur 218 (la taille consommée égale celle de l'objet) ; `Character` ne se désérialise pas jusqu'au bout (champ `inventory`).
- `multi.mjs`, `il.mjs`, `ilgrep.mjs` : lecture d'une classe, désassemblage, recherche dans l'IL.
Ne jamais mettre `scene-dump.json` (560 Ko, dérivé du jeu) dans le dépôt : le régénérer. Chemins du jeu : ceux de la machine de Norman (comme `banc.mjs`).
