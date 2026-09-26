# Portraits du joueur : noms de fichiers R2

Dossier R2 : `soreal/idle/player/`. Format : **webp**. Nom : `portrait-<id>.webp` (tout en minuscules, tirets). Dès qu'un fichier porte ce nom, le jeu le trouve tout seul (sélecteur des Achievements, portrait automatique d'un set équipé, Fight Boss). Un fichier portant ce nom l'emporte sur l'ancien fichier du même portrait, s'il existe.

Généré le 2026-09-26 à partir de `cloudflare/src/idle-portraits-v1.js` (fonction `idlePortraitNomFichierV1`).

## Ajoutés (32 portraits : tous présents dans R2 depuis le 2026-09-26, format webp, vérifiés en ligne)

| Portrait | Nom du fichier à créer |
|---|---|
| Training | `portrait-training.webp` |
| Sewers | `portrait-sewers.webp` |
| HSB | `portrait-hsb.webp` |
| Clock | `portrait-clock.webp` |
| 2D | `portrait-2d.webp` |
| Spoopy | `portrait-spoopy.webp` |
| Gaudy | `portrait-gaudy.webp` |
| Mega | `portrait-mega.webp` |
| Beardverse | `portrait-beardverse.webp` |
| Badly Drawn | `portrait-badly.webp` |
| Stealth | `portrait-stealth.webp` |
| Choco | `portrait-choco.webp` |
| Edgy | `portrait-edgy.webp` |
| Pretty Pink Princess | `portrait-pinkprincess.webp` |
| Meta | `portrait-meta.webp` |
| Party | `portrait-party.webp` |
| Typo | `portrait-typo.webp` |
| JRPG | `portrait-jrpg.webp` |
| Rad | `portrait-rad.webp` |
| Back To School | `portrait-backtoschool.webp` |
| Western | `portrait-western.webp` |
| Space | `portrait-space.webp` |
| Bread | `portrait-bread.webp` |
| Disco | `portrait-disco.webp` |
| Rock | `portrait-rock.webp` |
| Construction | `portrait-construction.webp` |
| Duck | `portrait-duck.webp` |
| Dutch | `portrait-dutch.webp` |
| Amalgamate | `portrait-amalgamate.webp` |
| Pirate | `portrait-pirate.webp` |
| SEXY ! | `portrait-sexy.webp` |
| SMART | `portrait-smart.webp` |

## Non renommés (décision de Norman, 2026-09-26 : « laisse comme ça, tant pis pour les noms »)

18 fichiers gardent leur ancien nom ; le jeu les retrouve très bien. Le tableau ne sert que de référence si tu veux les renommer un jour.

Relevé le 2026-09-26 (nom réel lu dans R2 par le jeu). Le jeu accepte toute extension : inutile de convertir en webp, renomme seulement (`portrait-<id>.png` fonctionne). Dès que le nouveau nom existe, il l'emporte sur l'ancien.

| Portrait | Nom actuel dans R2 | Nouveau nom |
|---|---|---|
| Portrait par défaut | `Portrait_PlayerAPportrait16.png` | `portrait-default.png` |
| Forest | `Portrait_PlayerAPportrait19.png` | `portrait-forest.png` |
| Forest (bonus 1) | `Portrait_PlayerAPportrait20.png` | `portrait-forest-bonus-1.png` |
| Forest (bonus 2) | `Portrait_PlayerAPportrait21.png` | `portrait-forest-bonus-2.png` |
| Cave | `Portrait_PlayerAPportrait22.png` | `portrait-cave.png` |
| GRB | `Portrait_PlayerAPportrait24.png` | `portrait-grb.png` |
| Jake | `Portrait_PlayerAPportrait28.png` | `portrait-jake.png` |
| Wanderer's | `Portrait_PlayerPortrait-Wanderer.png` | `portrait-wanderer.png` |
| S'rerednaW | `Portrait_PlayerPortrait-Rerednaw.png` | `portrait-rerednaw.png` |
| Slimy | `Portrait_PlayerPortrait-Slimy.png` | `portrait-slimy.png` |
| Greasy Nerd | `Portrait_PlayerPortrait-GreasyNerd.png` | `portrait-greasynerd.png` |
| Mobster | `Portrait_PlayerPortrait-Mobster.png` | `portrait-mobster.png` |
| Fad | `Portrait_PlayerPortrait-Fadzone.png` | `portrait-fad.png` |
| Exile | `Portrait_PlayerPortrait-Exile.png` | `portrait-exile.png` |
| Halloweenie | `Portrait_PlayerPortrait_Halloween.png` | `portrait-halloweenie.png` |
| Souhait « Sneak Preview » | `Portrait_Player_portrait_-_sneak_preview.png` | `portrait-wish-sneak-preview.png` |
| Souhait « Oscar Meyer Weiner » | `Portrait_PlayerPortrait-Weiner.png` | `portrait-wish-weiner.png` |
| Souhait « Mayo » | `Portrait_PlayerPortrait-Mayo.png` | `portrait-wish-mayo.png` |

Tous les autres portraits ont déjà leur nom `portrait-<id>.webp`.

Le joli chaton (Special Prize) reste `idle/Kitty/BadKittyDaycareBow.webp`.
