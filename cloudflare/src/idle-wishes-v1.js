/*
 * SOREAL IDLE — Wishes (meta-progression via Energy/Magic/Resource 3
 * allocation), full catalog transcribed from the NGU Idle wiki
 * (https://ngu-idle.fandom.com/wiki/Wishes), sub-pages "Page 1" through
 * "Page 11" of that same article — 231 wishes, indices 0-230, kept as `id`
 * for direct traceability back to the wiki table. Unlike the Quirks/Perks
 * wiki tables, the Wishes catalog table itself carries no "Difficulty"
 * column gating individual entries to Evil/Sadistic — every wish 0-230 is
 * Normal-accessible, so none are excluded here (only a handful of *other*
 * systems' Wish-speed-boosting Perks/Quirks are Evil/Sadistic-gated, and
 * those already live in idle-perks-v1.js / idle-quirks-v1.js, out of scope
 * for this catalog).
 *
 * `speedDivider` is each row's exact "Speed divider" column value (the
 * wiki gives both a suffixed form, e.g. "5.00 Qa", and its exact scientific
 * value in parentheses, e.g. "5.00E+15" — the parenthetical is used
 * verbatim here, no suffix-table guessing involved).
 *
 * Previously "Wishes" was 10 generic placeholder tracks (adventure/drop/
 * respawn/bank/hacks/ngu/cards/titans/daycare/quest in
 * idle-ngu-progression.js's IDLE_NGU_TRACKS.wishes) advanced by the same
 * flat per-second linear divisor (8e6) used for Wandoos/NGU — nothing
 * about that matched the real game: no per-wish identity, no multiplicative
 * diminishing-returns formula, no 4-hour floor. Replaced by this real
 * catalog plus advanceWishTrack() in idle-ngu-progression.js implementing
 * the wiki's actual formula (see that function's own citation comment).
 *
 * As with IDLE_QUIRKS_CATALOG_V1, most entries have no `bonus` — the vast
 * majority of wish effects (card tiers, quest QP rewards, MacGuffin/Deck/
 * Tag/Mayo/ITOPOD/boss-multiplier mechanics, portrait unlocks, inventory/
 * accessory slots, dual-wielding, rebirth-time reduction...) have no
 * existing mechanical hook anywhere in SOREAL IDLE yet. Only effects that
 * map onto multiplier buckets that already exist in this codebase carry a
 * `bonus` object:
 *   - energy/magic Power/Cap/Bars pct — same keys idle-quirks-v1.js and
 *     idle-perks-v1.js already use (energyPowerPct, magicCapPct, etc.),
 *     folded the same additive-then-(1+x) way by wishBonusesV1() below.
 *   - r3PowerPct/r3CapPct/r3BarsPct — new keys, the direct Resource 3
 *     parallel of the existing energy/magic ones (Resource 3 is already a
 *     first-class resource in idle-ngu-progression.js, just never had a
 *     Power/Cap/Bars wish/perk/quirk source before).
 *   - adventureStatsPct, statPct (Attack/Defense) — same keys as Quirks.
 *   - wishSpeedPct, hackSpeedPct — these fill idleNguBonuses()'s existing
 *     `wishSpeedMultiplier: 1` / `hackSpeedMultiplier: 1` placeholders
 *     (idle-ngu-progression.js), which were already declared but never
 *     had any real source computing them.
 * Never silently drop or fake data to avoid an empty bonus object — an
 * honest gap beats an invented one.
 */

export const IDLE_WISHES_CATALOG_V1 = Object.freeze([
  { id: 0, name: "I wish that wishes kicked ass", effect: "This wish gives 100% to Attack/Defense, 20% to adventure stats, and 5% to Energy/Magic/Resource 3's power, cap, and bars! How's that for a kickass wish?", levels: 1, speedDivider: 1.00e15, bonus: { statPct: 1.00, adventureStatsPct: 0.20, energyPowerPct: 0.05, energyCapPct: 0.05, energyBarsPct: 0.05, magicPowerPct: 0.05, magicCapPct: 0.05, magicBarsPct: 0.05, r3PowerPct: 0.05, r3CapPct: 0.05, r3BarsPct: 0.05 } },
  { id: 1, name: "I Wish that wishes weren't so slow :c", effect: "Don't we all. This wish will help by giving you a 5% speed boost per level, though!", levels: 10, speedDivider: 1.00e15, bonus: { wishSpeedPct: 0.05 } },
  { id: 2, name: "I wish MacGuffin drops mattered", effect: "This wish will increase the level of all MacGuffin drops by 1 per level! BAM!", levels: 5, speedDivider: 2.00e15, bonus: {} },
  { id: 3, name: "I wish V2/3/4 Titans had better rewards", effect: "With this wish, you'll get more XP & PP from harder titans! 10% for V2 at level 1, 20% for V3 at 2 and so on! (30% for V4 at 3, works on QP also when Titans drop QP.)", levels: 3, speedDivider: 8.00e15, bonus: {} },
  { id: 4, name: "I wish money Pit didn't suck", effect: "Research this Wish to unlock new money pit tiers that have Stat and Seed rewards that scale, starting at e50 gold tossed! Hooray! (Also maxes your money pit Wandoos level if it's not yet at level 100.)", levels: 1, speedDivider: 6.00e15, bonus: {} },
  { id: 5, name: "I wish I could beat up more bosses I", effect: "Go nuts with this wish then. Each level will grant a +100% bonus to your Attack/Defense.", levels: 10, speedDivider: 3.00e15, bonus: { statPct: 1.00 } },
  { id: 6, name: "I wish I was stronger in Adventure mode I", effect: "Say no more fam. This wish will grant you 3% more Adventure Stats per level!", levels: 10, speedDivider: 3.00e15, bonus: { adventureStatsPct: 0.03 } },
  { id: 7, name: "I wish I had more Inventory space I", effect: "Each level in this wish grants 1 extra inventory slot!", levels: 12, speedDivider: 4.00e15, bonus: {} },
  { id: 8, name: "I wish I had a cool new move for Adventure I", effect: "Research this wish and you'll unlock the MEGA BUFF move! Buff description: Cooldown: 50 seconds. All other buffs must also be off cooldown. Performs Offensive Buff, Defensive Buff and Ultimate Buff simultaneously, plus 20%% extra buffage!", levels: 1, speedDivider: 6.00e15, bonus: {} },
  { id: 9, name: "I wish I had more Energy Power I", effect: "No problem! This wish will grant +5% Energy Power per level!", levels: 10, speedDivider: 5.00e15, bonus: { energyPowerPct: 0.05 } },
  { id: 10, name: "I wish I had more Energy Cap I", effect: "No problem! This wish will grant +3% Energy Cap per level!", levels: 10, speedDivider: 5.00e15, bonus: { energyCapPct: 0.03 } },
  { id: 11, name: "I wish I had more Energy Bars I", effect: "No problem! This wish will grant +3% Energy Bars per level!", levels: 10, speedDivider: 5.00e15, bonus: { energyBarsPct: 0.03 } },
  { id: 12, name: "I wish I had more Magic Power I", effect: "No problem! This wish will grant +5% Magic Power per level!", levels: 10, speedDivider: 5.00e15, bonus: { magicPowerPct: 0.05 } },
  { id: 13, name: "I wish I had more Magic Cap I", effect: "No problem! This wish will grant +3% Magic Cap per level!", levels: 10, speedDivider: 5.00e15, bonus: { magicCapPct: 0.03 } },
  { id: 14, name: "I wish I had more Magic Bars I", effect: "No problem! This wish will grant +3% Magic Bars per level!", levels: 10, speedDivider: 5.00e15, bonus: { magicBarsPct: 0.03 } },
  { id: 15, name: "I wish I had more Resource 3 Power I", effect: "No problem! This wish will grant +5% Resource 3 Power per level!", levels: 10, speedDivider: 5.00e15, bonus: { r3PowerPct: 0.05 } },
  { id: 16, name: "I wish I had more Resource 3 Cap I", effect: "No problem! This wish will grant +3% Resource 3 Cap per level!", levels: 10, speedDivider: 5.00e15, bonus: { r3CapPct: 0.03 } },
  { id: 17, name: "I wish I had more Resource 3 Bars I", effect: "No problem! This wish will grant +3% Resource 3 Bars per level!", levels: 10, speedDivider: 5.00e15, bonus: { r3BarsPct: 0.03 } },
  { id: 18, name: "I wish the Greasy Nerd took a shower", effect: "Literally impossible. How about 4% Hack Speed per level instead?", levels: 10, speedDivider: 1.00e16, bonus: { hackSpeedPct: 0.04 } },
  { id: 19, name: "I wish Active Quests were more Rewarding I", effect: "We'll have our guys talk to the Beast, we can work something out. How's 2% better active questing rewards per level sound?", levels: 10, speedDivider: 2.00e16, bonus: {} },
  { id: 20, name: "I wish I didn't have to wait 3 minutes per rebirth", effect: "Seriously? Ugh, fine! This wish will reduces the minimum time to rebirth by 10 seconds per level. *grumbles off into the distance*", levels: 6, speedDivider: 3.00e16, bonus: {} },
  { id: 21, name: "I wish Wishes weren't so slow :c II", effect: "Alright, you can have this wish which will grant another stacking 2% wish speed bonus per level c:", levels: 10, speedDivider: 5.00e16, bonus: { wishSpeedPct: 0.02 } },
  { id: 22, name: "I wish I had more Inventory space II", effect: "Each level in this wish grants 1 extra inventory slot!", levels: 12, speedDivider: 8.00e16, bonus: {} },
  { id: 23, name: "I wish Basic Training was EVEN FASTER >:)", effect: "Granted! This wish will adds +1 level when the bars fills on every Basic Training!", levels: 1, speedDivider: 1.00e17, bonus: { basicTrainingExtraLevel: 1 } },
  { id: 24, name: "I wish Blood MacGuffin α wasn't so random", effect: "Research this wish and the spell will target your first MacGuffin slot, instead of a random one", levels: 1, speedDivider: 6.00e16, bonus: {} },
  { id: 25, name: "I wish Fruit of MacGuffin α wasn't so random", effect: "Research this wish and the fruit will target your first MacGuffin slot, instead of a random one", levels: 1, speedDivider: 6.00e16, bonus: {} },
  { id: 26, name: "I wish I were an Oscar Meyer Weiner", effect: "Well, if that's what you truly want to be who am I to judge? (Unlocks new player portrait)", levels: 1, speedDivider: 1.00e18, bonus: {} },
  { id: 27, name: "I wish the Daycare Kitty was even happier", effect: "This is gonna be a tough one, her happiness already outputs more energy than an exploding supernova... but 1% daycare speed per level should be possible!", levels: 10, speedDivider: 5.00e16, bonus: {} },
  { id: 28, name: "I wish I could dual wield weapons", effect: "That's so impractical though! But alright, with this wish you'll unlock a 2nd weapon slot! Each level will yield +5% of the 2nd weapon's stats to your overall equipment bonus.", levels: 10, speedDivider: 3.00e17, bonus: {} },
  { id: 29, name: "I wish I was stronger in Adventure mode II", effect: "Say no more fam. This wish will grant you 2% more Adventure Stats per level!", levels: 10, speedDivider: 2.00e17, bonus: { adventureStatsPct: 0.02 } },
  { id: 30, name: "I wish I could beat up more bosses II", effect: "Each level of this wish will grant a stacking +100% bonus to your Attack/Defense", levels: 10, speedDivider: 2.00e17, bonus: { statPct: 1.00 } },
  { id: 31, name: "I wish I had more Energy Power II", effect: "No problem! This wish will grant +5% Energy Power per level!", levels: 10, speedDivider: 1.00e17, bonus: { energyPowerPct: 0.05 } },
  { id: 32, name: "I wish I had more Energy Cap II", effect: "No problem! This wish will grant +3% Energy Cap per level!", levels: 10, speedDivider: 1.00e17, bonus: { energyCapPct: 0.03 } },
  { id: 33, name: "I wish I had more Energy Bars II", effect: "No problem! This wish will grant +3% Energy Bars per level!", levels: 10, speedDivider: 1.00e17, bonus: { energyBarsPct: 0.03 } },
  { id: 34, name: "I wish I had more Magic Power II", effect: "No problem! This wish will grant +5% Magic Power per level!", levels: 10, speedDivider: 1.00e17, bonus: { magicPowerPct: 0.05 } },
  { id: 35, name: "I wish I had more Magic Cap II", effect: "No problem! This wish will grant +3% Magic Cap per level!", levels: 10, speedDivider: 1.00e17, bonus: { magicCapPct: 0.03 } },
  { id: 36, name: "I wish I had more Magic Bars II", effect: "No problem! This wish will grant +3% Magic Bars per level!", levels: 10, speedDivider: 1.00e17, bonus: { magicBarsPct: 0.03 } },
  { id: 37, name: "I wish I had more Resource 3 Power II", effect: "No problem! This wish will grant +5% Resource 3 Power per level!", levels: 10, speedDivider: 1.00e17, bonus: { r3PowerPct: 0.05 } },
  { id: 38, name: "I wish I had more Resource 3 Cap II", effect: "No problem! This wish will grant +3% Resource 3 Cap per level!", levels: 10, speedDivider: 1.00e17, bonus: { r3CapPct: 0.03 } },
  { id: 39, name: "I wish I had more Resource 3 Bars II", effect: "No problem! This wish will grant +3% Resource 3 Bars per level!", levels: 10, speedDivider: 1.00e17, bonus: { r3BarsPct: 0.03 } },
  { id: 40, name: "I wish the Godmother would drop QP", effect: "With this wish, you'll unlock QP rewards from the godmother! (Base drop is 2 QP)", levels: 1, speedDivider: 1.00e19, bonus: {} },
  { id: 41, name: "I wish the Titan after Godmother would also drop QP", effect: "With this wish, you'll unlock QP rewards from the Titan that comes after the Godmother! (Base drop is 3 QP)", levels: 1, speedDivider: 3.00e20, bonus: {} },
  { id: 42, name: "I wish the Greasy Nerd took a shower II", effect: "Seriously, we splashed a bucket of water on him and it flash-fired away. Just take 4% hack speed per level, please?", levels: 10, speedDivider: 7.00e17, bonus: { hackSpeedPct: 0.04 } },
  { id: 43, name: "I wish Wishes weren't so slow :c III", effect: "Alright, you can have this wish which will grant another stacking 2% wish speed bonus per level c:", levels: 10, speedDivider: 2.00e18, bonus: { wishSpeedPct: 0.02 } },
  { id: 44, name: "I wish there was more cute Daycare Kitty Art", effect: "Here you go, if you want it!", levels: 1, speedDivider: 3.00e19, bonus: {} },
  { id: 45, name: "I wish I could dual wield weapons II", effect: "This wish will add an additional 5% effectiveness to the 2nd weapon slot.", levels: 10, speedDivider: 1.00e19, bonus: {} },
  { id: 46, name: "I wish enemies spawned faster", effect: "Weird request but okay! This wish will reduces respawn times by 1% per level!", levels: 10, speedDivider: 6.00e18, bonus: {} },
  { id: 47, name: "I wish Quests gave more QP", effect: "Alright, just don't tell the Beast! This wish will improve Quest QP rewards by 2% per level!", levels: 10, speedDivider: 3.00e18, bonus: {} },
  { id: 48, name: "I wish I had more Energy Power III", effect: "No problem! This wish will grant +5% Energy Power per level!", levels: 10, speedDivider: 5.00e18, bonus: { energyPowerPct: 0.05 } },
  { id: 49, name: "I wish I had more Energy Cap III", effect: "No problem! This wish will grant +3% Energy Cap per level!", levels: 10, speedDivider: 5.00e18, bonus: { energyCapPct: 0.03 } },
  { id: 50, name: "I wish I had more Energy Bars III", effect: "No problem! This wish will grant +3% Energy Bars per level!", levels: 10, speedDivider: 5.00e18, bonus: { energyBarsPct: 0.03 } },
  { id: 51, name: "I wish I had more Magic Power III", effect: "No problem! This wish will grant +5% Magic Power per level!", levels: 10, speedDivider: 5.00e18, bonus: { magicPowerPct: 0.05 } },
  { id: 52, name: "I wish I had more Magic Cap III", effect: "No problem! This wish will grant +3% Magic Cap per level!", levels: 10, speedDivider: 5.00e18, bonus: { magicCapPct: 0.03 } },
  { id: 53, name: "I wish I had more Magic Bars III", effect: "No problem! This wish will grant +3% Magic Bars per level!", levels: 10, speedDivider: 5.00e18, bonus: { magicBarsPct: 0.03 } },
  { id: 54, name: "I wish I had more Resource 3 Power III", effect: "No problem! This wish will grant +5% Resource 3 Power per level!", levels: 10, speedDivider: 5.00e18, bonus: { r3PowerPct: 0.05 } },
  { id: 55, name: "I wish I had more Resource 3 Cap III", effect: "No problem! This wish will grant +3% Resource 3 Cap per level!", levels: 10, speedDivider: 5.00e18, bonus: { r3CapPct: 0.03 } },
  { id: 56, name: "I wish I had more Resource 3 Bars III", effect: "No problem! This wish will grant +3% Resource 3 Bars per level!", levels: 10, speedDivider: 5.00e18, bonus: { r3BarsPct: 0.03 } },
  { id: 57, name: "I wish I had more Inventory space III", effect: "Each level in this wish grants 1 extra inventory slot", levels: 12, speedDivider: 8.00e19, bonus: {} },
  { id: 58, name: "I wish I had another cool new move for adventure", effect: "Research this wish and you'll unlock the OH SHIT move! Move description: Can be used when Paralyze, Hyper Regen and Heal are all off cooldown. Performs Heal, Paralyze and Hyper Regen simultaneously, buying you precious seconds of life!", levels: 1, speedDivider: 3.00e21, bonus: {} },
  { id: 59, name: "I wish Blood MacGuffin α also didn't suck", effect: "Research this wish, then, and improve the spell's outcome by 20% per level!", levels: 10, speedDivider: 4.00e20, bonus: {} },
  { id: 60, name: "I wish Fruit of MacGuffin α also didn't suck", effect: "Research this wish, then, and improve the fruit's benefits by 20% per level!", levels: 10, speedDivider: 4.00e20, bonus: {} },
  { id: 61, name: "I wish I was more OP", effect: "EXP = OP right? You can have 0.5% more GLOBAL EXP for each level of this wish.", levels: 10, speedDivider: 8.00e19, bonus: {} },
  { id: 62, name: "I wish Active Quests were more Rewarding II", effect: "Oof, this a big favour to ask of us again, but we'll try. How's another 1% better active questing rewards per level sound?", levels: 10, speedDivider: 8.00e20, bonus: {} },
  { id: 63, name: "I wish the Greasy Nerd could at least wear some body spray", effect: "We tried, it caught on fire before it reached his skin. Just accept it can't be done, and take another 2% hack speed per level.", levels: 10, speedDivider: 5.00e20, bonus: { hackSpeedPct: 0.02 } },
  { id: 64, name: "I wish I had more Energy Power IV", effect: "No problem! This wish will grant +5% Energy Power per level!", levels: 10, speedDivider: 3.00e20, bonus: { energyPowerPct: 0.05 } },
  { id: 65, name: "I wish I had more Energy Cap IV", effect: "No problem! This wish will grant +3% Energy Cap per level!", levels: 10, speedDivider: 3.00e20, bonus: { energyCapPct: 0.03 } },
  { id: 66, name: "I wish I had more Energy Bars IV", effect: "No problem! This wish will grant +3% Energy Bars per level!", levels: 10, speedDivider: 3.00e20, bonus: { energyBarsPct: 0.03 } },
  { id: 67, name: "I wish I had more Magic Power IV", effect: "No problem! This wish will grant +5% Magic Power per level!", levels: 10, speedDivider: 3.00e20, bonus: { magicPowerPct: 0.05 } },
  { id: 68, name: "I wish I had more Magic Cap IV", effect: "No problem! This wish will grant +3% Magic Cap per level!", levels: 10, speedDivider: 3.00e20, bonus: { magicCapPct: 0.03 } },
  { id: 69, name: "I wish I had more Magic Bars IV", effect: "No problem! This wish will grant +3% Magic Bars per level!", levels: 10, speedDivider: 3.00e20, bonus: { magicBarsPct: 0.03 } },
  { id: 70, name: "I wish I had more Resource 3 Power IV", effect: "No problem! This wish will grant +5% Resource 3 Power per level!", levels: 10, speedDivider: 3.00e20, bonus: { r3PowerPct: 0.05 } },
  { id: 71, name: "I wish I had more Resource 3 Cap IV", effect: "No problem! This wish will grant +3% Resource 3 Cap per level!", levels: 10, speedDivider: 3.00e20, bonus: { r3CapPct: 0.03 } },
  { id: 72, name: "I wish I had more Resource 3 Bars IV", effect: "No problem! This wish will grant +3% Resource 3 Bars per level!", levels: 10, speedDivider: 3.00e20, bonus: { r3BarsPct: 0.03 } },
  { id: 73, name: "I wish the Beast would drop some QP", effect: "With this wish, you'll unlock QP rewards from the Beast! (Base drop is 1 QP)", levels: 1, speedDivider: 2.00e16, bonus: {} },
  { id: 74, name: "I wish the Greasy Nerd would drop some QP", effect: "With this wish, you'll unlock QP rewards from the Greasy Nerd (Base drop is 1 QP)", levels: 1, speedDivider: 5.00e17, bonus: {} },
  { id: 75, name: "I wish I was a giant jar of Mayo.", effect: "What. (Unlocks new player portrait)", levels: 1, speedDivider: 5.00e21, bonus: {} },
  { id: 76, name: "I wish the QP Hack had more milestones I", effect: "Each level of this Wish reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", levels: 5, speedDivider: 2.00e17, bonus: {} },
  { id: 77, name: "I wish the Number Hack had more milestones I", effect: "Each level of this Wish reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", levels: 5, speedDivider: 1.00e19, bonus: {} },
  { id: 78, name: "I wish the HACK HACK had more milestones I", effect: "Each level of this Wish reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", levels: 10, speedDivider: 6.00e20, bonus: {} },
  { id: 79, name: "I wish the ITOPOD awarded more Base PP", effect: "I bet you do. Each level of this wish will add +50 base PP progress to kills in the ITOPOD!", levels: 10, speedDivider: 2.00e21, bonus: {} },
  { id: 80, name: "I wish higher level quest drops counted for even more Quest progress I", effect: "Alright - This wish will reduce the level divider for higher level Quest handins by 1 for each level of this perk! Originally the formula is 1 + (level/10), rounded down.", levels: 2, speedDivider: 5.00e17, bonus: {} },
  { id: 81, name: "I wish higher level quest drops counted for even more Quest progress II", effect: "This wish will additionally reduce the level divider for higher level Quest handins by 1 for each level of this perk! Originally the formula is 1 + (level/10), rounded down.", levels: 2, speedDivider: 1.00e22, bonus: {} },
  { id: 82, name: "I wish I had more Energy Power V", effect: "Sure, why not! This wish will grant +2% Energy Power per level!", levels: 10, speedDivider: 5.00e21, bonus: { energyPowerPct: 0.02 } },
  { id: 83, name: "I wish I had more Energy Bars V", effect: "Sure, why not! This wish will grant +1% Energy Bars per level!", levels: 10, speedDivider: 5.00e21, bonus: { energyBarsPct: 0.01 } },
  { id: 84, name: "I wish I had more Energy Cap V", effect: "Sure, why not! This wish will grant +1% Energy Cap per level!", levels: 10, speedDivider: 5.00e21, bonus: { energyCapPct: 0.01 } },
  { id: 85, name: "I wish I had more Magic Power V", effect: "Sure, why not! This wish will grant +2% Magic Power per level!", levels: 10, speedDivider: 5.00e21, bonus: { magicPowerPct: 0.02 } },
  { id: 86, name: "I wish I had more Magic Bars V", effect: "Sure, why not! This wish will grant +1% Magic Bars per level!", levels: 10, speedDivider: 5.00e21, bonus: { magicBarsPct: 0.01 } },
  { id: 87, name: "I wish I had more Magic Cap V", effect: "Sure, why not! This wish will grant +1% Magic Cap per level!", levels: 10, speedDivider: 5.00e21, bonus: { magicCapPct: 0.01 } },
  { id: 88, name: "I wish I had more Resource 3 Power V", effect: "Sure, why not! This wish will grant +3% Resource 3 Power per level!", levels: 1, speedDivider: 5.00e21, bonus: { r3PowerPct: 0.03 } },
  { id: 89, name: "I wish I had more Resource 3 Barfs V", effect: "Sure, why not! This wish will grant +1.5% Resource 3 Bars per - wait, does the wish name say barfs?", levels: 1, speedDivider: 5.00e21, bonus: { r3BarsPct: 0.015 } },
  { id: 90, name: "I wish I had more Resource 3 Cap V", effect: "Sure, why not! This wish will grant +1.5% Resource 3 Cap per level!", levels: 10, speedDivider: 5.00e21, bonus: { r3CapPct: 0.015 } },
  { id: 91, name: "I wish I had more Energy Power VI", effect: "Okay fine! This wish will grant +2% Energy Power per level!", levels: 10, speedDivider: 1.00e21, bonus: { energyPowerPct: 0.02 } },
  { id: 92, name: "I wish I had more Energy Bars VI", effect: "Okay fine! This wish will grant +1% Energy Bars per level!", levels: 10, speedDivider: 1.00e23, bonus: { energyBarsPct: 0.01 } },
  { id: 93, name: "I wish I had more Energy Cap VI", effect: "Okay fine! This wish will grant +1% Energy Cap per level!", levels: 10, speedDivider: 1.00e23, bonus: { energyCapPct: 0.01 } },
  { id: 94, name: "I wish I had more Magic Power VI", effect: "Okay fine! This wish will grant +2% Magic Power per level!", levels: 10, speedDivider: 1.00e23, bonus: { magicPowerPct: 0.02 } },
  { id: 95, name: "I wish I had more Magic Bars VI", effect: "Okay fine! This wish will grant +1% Magic Bars per level!", levels: 10, speedDivider: 1.00e23, bonus: { magicBarsPct: 0.01 } },
  { id: 96, name: "I wish I had more Magic Cap VI", effect: "Okay fine! This wish will grant +1% Magic Cap per level!", levels: 10, speedDivider: 1.00e23, bonus: { magicCapPct: 0.01 } },
  { id: 97, name: "I wish I had more Resource 3 Power VI", effect: "Okay fine! This wish will grant +3% Resource 3 Power per level!", levels: 10, speedDivider: 1.00e23, bonus: { r3PowerPct: 0.03 } },
  { id: 98, name: "I wish I had more Resource 3 Bars VI", effect: "Okay fine! This wish will grant +1.5% Resource 3 Barfs per level!", levels: 10, speedDivider: 1.00e23, bonus: { r3BarsPct: 0.015 } },
  { id: 99, name: "I wish I had more Resource 3 Cap VI", effect: "Okay fine! This wish will grant +1.5% Resource 3 Cap per level and I am bored while coding and here i am adding more description to this wish I wonder if i'll remember to remove this before launch probably not for the memes.", levels: 10, speedDivider: 1.00e23, bonus: { r3CapPct: 0.015 } },
  { id: 100, name: "I wish Titan 10 dropped QP", effect: "With this wish, you'll unlock QP rewards from Titan 10! (Base drop is 4 QP)", levels: 1, speedDivider: 5.00e22, bonus: {} },
  { id: 101, name: "I wish Major Quests had better Base QP Rewards.", effect: "Every level of this wish improves base QP reward for Major Quests by 1 per level!", levels: 10, speedDivider: 1.00e22, bonus: {} },
  { id: 102, name: "I wish Minor Quests had better Base QP Rewards.", effect: "Every level of this wish improves base QP reward for Minor Quests by 1 per level!", levels: 2, speedDivider: 1.80e23, bonus: {} },
  { id: 103, name: "I wish I was stronger in Adventure Mode III", effect: "Say no more fam. This wish will grant you 2% more Adventure Stats per level!", levels: 10, speedDivider: 1.00e19, bonus: { adventureStatsPct: 0.02 } },
  { id: 104, name: "I wish I was stronger in Adventure Mode IV", effect: "Say no more fam. This wish will grant you 1% more Adventure Stats per level!", levels: 10, speedDivider: 3.00e21, bonus: { adventureStatsPct: 0.01 } },
  { id: 105, name: "I wish I could beat up more bosses III", effect: "Each level of this wish grants a +100% bonus to your Attack/Defense", levels: 10, speedDivider: 2.00e19, bonus: { statPct: 1.00 } },
  { id: 106, name: "I wish I could beat up more bosses IV", effect: "Each level of this wish grants another stacking +100% bonus to your Attack/Defense", levels: 10, speedDivider: 1.00e21, bonus: { statPct: 1.00 } },
  { id: 107, name: "I wish the Sadistic Boss Multiplier didn't suck so bad I", effect: "Each level of this wish will bump up the boss multiplier by 0.001 per level! Normally this is 1.20 for Sadistic. A tiny change helps a TON here!", levels: 10, speedDivider: 2.00e22, bonus: {} },
  { id: 108, name: "I wish the Sadistic Boss Multiplier didn't suck so bad II", effect: "Each level of this wish will bump up the boss multiplier by 0.001 per level! Normally this is 1.20 for Sadistic. A tiny change helps a TON here!", levels: 10, speedDivider: 5.00e23, bonus: {} },
  { id: 109, name: "I wish I had yet another Accessory Slot!", effect: "Good luck buddy. (Unlocks Accessory Slot)", levels: 1, speedDivider: 5.00e24, bonus: {} },
  { id: 110, name: "I wish Infinity Cube Boosting wasn't so awful I", effect: "Each level of this wish will improve the effectiveness of Infinity Cube boosts by 5%. At max level, this wish will double boosts' effectiveness!", levels: 20, speedDivider: 4.00e19, bonus: {} },
  { id: 111, name: "I wish Energy NGU's were Faster I", effect: "Each level of this wish will improve Energy NGU Speed by 2%!", levels: 10, speedDivider: 7.00e20, bonus: {} },
  { id: 112, name: "I wish Energy NGU's were Faster II", effect: "Each level of this wish will improve Energy NGU Speed by 2%!", levels: 10, speedDivider: 2.00e22, bonus: {} },
  { id: 113, name: "I wish Magic NGU's were Faster I", effect: "Each level of this wish will improve Magic NGU Speed by 2%!", levels: 10, speedDivider: 7.00e20, bonus: {} },
  { id: 114, name: "I wish Magic NGU's were Faster II", effect: "Each level of this wish will improve Magic NGU Speed by 2%!", levels: 10, speedDivider: 2.00e22, bonus: {} },
  { id: 115, name: "I wish my Energy NGU Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 4.00e19, bonus: {} },
  { id: 116, name: "I wish my Drop Chance Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 4.00e19, bonus: {} },
  { id: 117, name: "I wish my Wandoos Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.00e19, bonus: {} },
  { id: 118, name: "I wish my Adventure Stats Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 8.00e19, bonus: {} },
  { id: 119, name: "I wish my Hacks Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 5.00e19, bonus: {} },
  { id: 120, name: "I wish my Augment Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 6.00e19, bonus: {} },
  { id: 121, name: "I wish my Gold Drop Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 8.00e19, bonus: {} },
  { id: 122, name: "I wish my PP Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.00e20, bonus: {} },
  { id: 123, name: "I wish my A/D Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 9.00e19, bonus: {} },
  { id: 124, name: "I wish my Magic NGU Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.90e20, bonus: {} },
  { id: 125, name: "I wish my TM Speed Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.70e20, bonus: {} },
  { id: 126, name: "I wish my QP Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.20e20, bonus: {} },
  { id: 127, name: "I wish my Daycare Card Tier was higher I", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.50e20, bonus: {} },
  { id: 128, name: "I wish my Energy NGU Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.20e21, bonus: {} },
  { id: 129, name: "I wish my Drop Chance Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.20e21, bonus: {} },
  { id: 130, name: "I wish my Wandoos Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.00e21, bonus: {} },
  { id: 131, name: "I wish my Adventure Stats Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.50e21, bonus: {} },
  { id: 132, name: "I wish my Hacks Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.80e21, bonus: {} },
  { id: 133, name: "I wish my Augment Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.80e21, bonus: {} },
  { id: 134, name: "I wish my Gold Drop Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.00e21, bonus: {} },
  { id: 135, name: "I wish my PP Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.50e21, bonus: {} },
  { id: 136, name: "I wish my A/D Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.00e21, bonus: {} },
  { id: 137, name: "I wish my Magic NGU Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 3.00e21, bonus: {} },
  { id: 138, name: "I wish my TM Speed Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.50e21, bonus: {} },
  { id: 139, name: "I wish my QP Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 4.00e21, bonus: {} },
  { id: 140, name: "I wish my Daycare Card Tier was higher II", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 5.00e21, bonus: {} },
  { id: 141, name: "I wish my Energy NGU Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 2.00e22, bonus: {} },
  { id: 142, name: "I wish my Drop Chance Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.80e22, bonus: {} },
  { id: 143, name: "I wish my Wandoos Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.50e22, bonus: {} },
  { id: 144, name: "I wish my Adventure Stats Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 5.00e22, bonus: {} },
  { id: 145, name: "I wish my Hacks Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 4.00e22, bonus: {} },
  { id: 146, name: "I wish my Augment Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 6.00e22, bonus: {} },
  { id: 147, name: "I wish my Gold Drop Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 7.50e22, bonus: {} },
  { id: 148, name: "I wish my PP Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.00e23, bonus: {} },
  { id: 149, name: "I wish my A/D Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 8.00e22, bonus: {} },
  { id: 150, name: "I wish my Magic NGU Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.30e23, bonus: {} },
  { id: 151, name: "I wish my TM Speed Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.20e23, bonus: {} },
  { id: 152, name: "I wish my QP Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.50e23, bonus: {} },
  { id: 153, name: "I wish my Daycare Card Tier was higher III", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 1, speedDivider: 1.60e23, bonus: {} },
  { id: 154, name: "I wish I made Mayo Faster I", effect: "Each level of this Wish will speed up all Mayo production by 0.5%!", levels: 10, speedDivider: 5.00e20, bonus: {} },
  { id: 155, name: "I wish my Cards Spawned Faster I", effect: "Each level of this Wish will reduce the Card Spawn timer by 0.5%!", levels: 10, speedDivider: 5.00e20, bonus: {} },
  { id: 156, name: "I wish I made Mayo Faster II", effect: "Each level of this Wish will speed up all Mayo production by 0.4%!", levels: 10, speedDivider: 1.00e22, bonus: {} },
  { id: 157, name: "I wish my Cards Spawned Faster II", effect: "Each level of this Wish will reduce the Card Spawn timer by 0.4%!", levels: 10, speedDivider: 1.00e22, bonus: {} },
  { id: 158, name: "I wish I made Mayo Faster III", effect: "Each level of this Wish will speed up all Mayo production by 0.3%!", levels: 10, speedDivider: 2.00e23, bonus: {} },
  { id: 159, name: "I wish my Cards Spawned Faster III", effect: "Each level of this Wish will reduce the Card Spawn timer by 0.3%!", levels: 10, speedDivider: 2.00e23, bonus: {} },
  { id: 160, name: "I wish I made Mayo Faster IV", effect: "Each level of this Wish will reduce the Card Spawn timer by 0.3%!", levels: 10, speedDivider: 4.00e24, bonus: {} },
  { id: 161, name: "I wish my Cards Spawned Faster IV", effect: "Each level of this Wish will reduce the Card Spawn timer by 0.3%!", levels: 10, speedDivider: 4.00e24, bonus: {} },
  { id: 162, name: "I wish I had BEEFY Cards I", effect: "Want BEEFY cards? This wish will raise the max mayo cost (and effect!) of regular cards by 1. Normally, the max is 9.", levels: 1, speedDivider: 4.00e24, bonus: {} },
  { id: 163, name: "I wish I didn't have WIMPY Cards I", effect: "If you hate 1 cost cards, get this! This wish will raise the MIN mayo cost (and effect!) of regular cards by 1. Normally, the minimum is 1.", levels: 1, speedDivider: 4.00e24, bonus: {} },
  { id: 164, name: "I wish I had a bigger Deck I", effect: "Don't we all. This wish will add 1 Max Deck Size per level!", levels: 5, speedDivider: 1.00e20, bonus: {} },
  { id: 165, name: "I wish I had a bigger Deck II", effect: "Don't we all. This wish will add 1 Max Deck Size per level!", levels: 5, speedDivider: 5.00e21, bonus: {} },
  { id: 166, name: "I wish I had a bigger Deck III", effect: "Don't we all. This wish will add 1 Max Deck Size per level!", levels: 5, speedDivider: 2.50e23, bonus: {} },
  { id: 167, name: "I wish I had another Mayo Generator", effect: "BAM. +1 Mayo Generator slot, right here! There's also a 2% Mayo Speed bonus for no reason!", levels: 1, speedDivider: 5.00e21, bonus: {} },
  { id: 168, name: "I wish I had another Bonus Tag", effect: "This Wish will provide an extra Tag slot for you then!", levels: 1, speedDivider: 3.00e22, bonus: {} },
  { id: 169, name: "I wish Tags worked better I", effect: "Coming right up! This wish wiil improve the effects of tagging by 0.05% per level", levels: 10, speedDivider: 2.00e19, bonus: {} },
  { id: 170, name: "I wish Tags worked better II", effect: "Coming right up! This wish wiil improve the effects of tagging by 0.04% per level", levels: 10, speedDivider: 6.00e20, bonus: {} },
  { id: 171, name: "I wish Tags worked better III", effect: "This wish wiil improve the effects of tagging by 0.04% per level", levels: 10, speedDivider: 1.80e22, bonus: {} },
  { id: 172, name: "I wish Tags worked better IV", effect: "This wish wiil improve the effects of tagging by 0.04% per level", levels: 10, speedDivider: 5.00e23, bonus: {} },
  { id: 173, name: "I wish Tags worked better V", effect: "This wish wiil improve the effects of tagging by 0.04% per level", levels: 10, speedDivider: 1.50e25, bonus: {} },
  { id: 174, name: "I wish my Energy NGU Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 2.50e23, bonus: {} },
  { id: 175, name: "I wish my Drop Chance Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 2.20e23, bonus: {} },
  { id: 176, name: "I wish my Wandoos Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 2.00e23, bonus: {} },
  { id: 177, name: "I wish my Adventure Stats Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 5.00e23, bonus: {} },
  { id: 178, name: "I wish my Hacks Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 4.00e23, bonus: {} },
  { id: 179, name: "I wish my Augment Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 6.00e23, bonus: {} },
  { id: 180, name: "I wish my Gold Drop Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 7.50e23, bonus: {} },
  { id: 181, name: "I wish my PP Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.00e24, bonus: {} },
  { id: 182, name: "I wish my A/D Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 8.00e23, bonus: {} },
  { id: 183, name: "I wish my Magic NGU Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.30e24, bonus: {} },
  { id: 184, name: "I wish my TM Speed Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.20e24, bonus: {} },
  { id: 185, name: "I wish my QP Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.50e24, bonus: {} },
  { id: 186, name: "I wish my Daycare Card Tier was higher IV", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.60e24, bonus: {} },
  { id: 187, name: "I wish Titan 11 Dropped QP", effect: "This wish will make that thing do the thing it do. (Unlocks QP rewards from Titan 11 (Base drop is 5 QP))", levels: 1, speedDivider: 2.00e25, bonus: {} },
  { id: 188, name: "I wish I was stronger in Adventure Mode V", effect: "Now with 20 levels, woooah! Also, right, this gives 1% more Adventure stats per level.", levels: 20, speedDivider: 1.00e24, bonus: { adventureStatsPct: 0.01 } },
  { id: 189, name: "I wish I could beat up more bosses V", effect: "Now with 20 levels, woooah! Also, right, this gives 1% more Attack/Defense per level.", levels: 20, speedDivider: 1.00e24, bonus: { statPct: 0.01 } },
  { id: 190, name: "I wish I was f**king done with Advanced Training forever!", effect: "Makes Advanced Training menu run at max speed with no more inputs needed", levels: 1, speedDivider: 1.00e18, bonus: {} },
  { id: 191, name: "I wish I could beat up more Bosses VI", effect: "Each level of this wish will grant another stacking +100% bonus to your Attack/Defense", levels: 20, speedDivider: 2.00e25, bonus: { statPct: 1.00 } },
  { id: 192, name: "I wish I could beat up more Bosses VII", effect: "Each level of this wish will grant another stacking +100% bonus to your Attack/Defense", levels: 20, speedDivider: 6.00e25, bonus: { statPct: 1.00 } },
  { id: 193, name: "I wish I had more Energy Power VII", effect: "Okay fine! This wish will grant +2% Energy Power per level!", levels: 10, speedDivider: 2.00e24, bonus: { energyPowerPct: 0.02 } },
  { id: 194, name: "I wish I had more Energy Bars VII", effect: "Okay fine! This wish will grant +1% Energy Bars per level!", levels: 10, speedDivider: 2.00e24, bonus: { energyBarsPct: 0.01 } },
  { id: 195, name: "I wish I had more Energy Cap VII", effect: "Okay fine! This wish will grant +1% Energy Cap per level!", levels: 10, speedDivider: 2.00e24, bonus: { energyCapPct: 0.01 } },
  { id: 196, name: "I wish I had more Magic Power VII", effect: "Okay fine! This wish will grant +2% Magic Power per level!", levels: 10, speedDivider: 2.00e24, bonus: { magicPowerPct: 0.02 } },
  { id: 197, name: "I wish I had more Magic Bars VII", effect: "Okay fine! This wish will grant +1% Magic Bars per level!", levels: 10, speedDivider: 2.00e24, bonus: { magicBarsPct: 0.01 } },
  { id: 198, name: "I wish I had more Magic Cap VII", effect: "Okay fine! This wish will grant +1% Magic Cap per level!", levels: 10, speedDivider: 2.00e24, bonus: { magicCapPct: 0.01 } },
  { id: 199, name: "I wish I had more Resource 3 Power VII", effect: "Okay fine! This wish will grant +3% Resource 3 Power per level!", levels: 10, speedDivider: 2.00e24, bonus: { r3PowerPct: 0.03 } },
  { id: 200, name: "I wish I had more Resource 3 Bars VII", effect: "Okay fine! This wish will grant +1.5% Resource 3 Bars per level!", levels: 10, speedDivider: 2.00e24, bonus: { r3BarsPct: 0.015 } },
  { id: 201, name: "I wish I had more Resource 3 Cap VII", effect: "Okay fine! This wish will grant +1.5% Resource 3 Cap per level!", levels: 10, speedDivider: 2.00e24, bonus: { r3CapPct: 0.015 } },
  { id: 202, name: "I wish I was a sneak preview of Norman & Sébastien's next Idle game", effect: "Ha, okay, sure I can show you a- wait, you want to BE it? Why are you so friggin' weird dude?? (UNLOCKS A PLAYER PORTRAIT!)", levels: 1, speedDivider: 1.00e24, bonus: {} },
  { id: 203, name: "ARE YOU SURE YOU WISH TO SHUT DOWN?", effect: "I MUST SHUT DOWN... SHUT DOWN EVERYTHING...", levels: 1, speedDivider: 1.00e27, bonus: {} },
  { id: 204, name: "I wish Titan 12 gave me some QP", effect: "WELL I BET YOU CAN GUESS WHAT THIS DOES THEN (Unlocks QP rewards from Titan 12 (Base drop is 6 QP))", levels: 1, speedDivider: 3.00e26, bonus: {} },
  { id: 205, name: "I wish my Energy NGU Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 4.00e25, bonus: {} },
  { id: 206, name: "I wish my Drop Chance Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 5.00e25, bonus: {} },
  { id: 207, name: "I wish my Wandoos Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 4.00e25, bonus: {} },
  { id: 208, name: "I wish my Adventure Stats Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.00e26, bonus: {} },
  { id: 209, name: "I wish my Hacks Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 8.00e25, bonus: {} },
  { id: 210, name: "I wish my Augment Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.00e26, bonus: {} },
  { id: 211, name: "I wish my Gold Drop Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 1.30e26, bonus: {} },
  { id: 212, name: "I wish my PP Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 2.00e26, bonus: {} },
  { id: 213, name: "I wish my A/D Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 2.50e26, bonus: {} },
  { id: 214, name: "I wish my Magic NGU Card Tier was Higher V", effect: "+1 tier to card drops of this type per level", levels: 2, speedDivider: 2.00e26, bonus: {} },
  { id: 215, name: "I wish my TM Speed Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 3.00e26, bonus: {} },
  { id: 216, name: "I wish my QP Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 5.00e26, bonus: {} },
  { id: 217, name: "I wish my Daycare Card Tier was Higher V", effect: "Sure thing! Each level of this wish will add +1 tier to all future card drops of that type!", levels: 2, speedDivider: 4.00e26, bonus: {} },
  { id: 218, name: "I wish I was stronger in Adventure mode VI", effect: "This wish gives 1% Adventure stats per level!", levels: 20, speedDivider: 5.00e25, bonus: { adventureStatsPct: 0.01 } },
  { id: 219, name: "I wish I could beat up more Bosses VIII", effect: "This wish gives 100% more Attack/Defense per level.", levels: 20, speedDivider: 1.80e26, bonus: { statPct: 1.00 } },
  { id: 220, name: "I wish I had BEEFY cards II", effect: "Want BEEFIER cards? This wish will raise the max mayo cost (and effect!) of regular cards by 1. Normally, the max is 9.", levels: 1, speedDivider: 1.00e26, bonus: {} },
  { id: 221, name: "I wish I didn't have WIMPY cards II", effect: "If you hate 2 cost cards, get this! This wish will raise the MIN mayo cost (and effect!) of regular cards by 1.", levels: 1, speedDivider: 1.00e26, bonus: {} },
  { id: 222, name: "I wish I made Mayo faster V", effect: "Each level of this Wish will speed up all Mayo production by 0.3%!", levels: 10, speedDivider: 8.00e25, bonus: {} },
  { id: 223, name: "I wish Cards Spawned Faster V", effect: "Each level of this Wish will reduce the Card Spawn timer by 0.3%!", levels: 10, speedDivider: 8.00e25, bonus: {} },
  { id: 224, name: "I wish I made Mayo faster VI", effect: "Each level of this Wish will speed up all Mayo production by 0.3%!", levels: 10, speedDivider: 1.00e27, bonus: {} },
  { id: 225, name: "I wish Cards Spawned Faster VI", effect: "Each level of this Wish will reduce the Card Spawn timer by 0.3%!", levels: 10, speedDivider: 1.00e27, bonus: {} },
  { id: 226, name: "I wish I was stronger in Adventure mode VI (part 2)", effect: "Wait, what? Ah whatever, This wish gives 1% Adventure stats per level!", levels: 10, speedDivider: 3.30e26, bonus: { adventureStatsPct: 0.01 } },
  { id: 227, name: "I wish I had BEEFY Cards III", effect: "Inject some grade D- Beef directly into your cards, to raise their max mayo cost by 1", levels: 2, speedDivider: 3.80e26, bonus: {} },
  { id: 228, name: "I wish I didn't have WIMPY cards III", effect: "Become less wimpy by eating the least wimpy food of all- raw celery. Increase the minimym mayo cost for cards by +1 per level of this wish.", levels: 2, speedDivider: 3.50e26, bonus: {} },
  { id: 229, name: "I wish my chonkers were CHONKIER", effect: "This wish will slap on some much needed heft to your chonky cards! Increase Big Chocker max mayo cost by +1 per level of this wish!", levels: 5, speedDivider: 3.40e26, bonus: {} },
  { id: 230, name: "I wish my chonkers were LESS NOT CHONKIER", effect: "My brain hurts. Just level this up to increase the minimum mayo cost of Big Chocker by 1 per level, and get me an advil.", levels: 5, speedDivider: 3.70e26, bonus: {} }
]);

export function idleWishByIdV1(id) {
  return IDLE_WISHES_CATALOG_V1.find(w => w.id === id) || null;
}

/*
 * Sums level x per-level bonus value across every wish's completed levels
 * into one flat multiplier object — same fold pattern as quirkBonusesV1
 * (idle-quirks-v1.js), but reading from the Wishes system's actual
 * per-track state shape (`state.systems.wishes.data.tracks[id].level`,
 * not a flat levelsById map) since Wishes reuse the generic track system
 * (IDLE_NGU_TRACKS) rather than a dedicated purchase model.
 */
export function wishBonusesV1(tracksById) {
  const tracks = tracksById && typeof tracksById === "object" ? tracksById : {};
  const totals = {};
  for (const wish of IDLE_WISHES_CATALOG_V1) {
    const level = Math.max(0, Math.min(wish.levels, Number(tracks[wish.id]?.level) || 0));
    if (!level) continue;
    for (const [key, perLevel] of Object.entries(wish.bonus || {})) {
      totals[key] = (totals[key] || 0) + perLevel * level;
    }
  }
  return {
    energyPowerMultiplier: 1 + (totals.energyPowerPct || 0),
    energyCapMultiplier: 1 + (totals.energyCapPct || 0),
    energyBarsMultiplier: 1 + (totals.energyBarsPct || 0),
    magicPowerMultiplier: 1 + (totals.magicPowerPct || 0),
    magicCapMultiplier: 1 + (totals.magicCapPct || 0),
    magicBarsMultiplier: 1 + (totals.magicBarsPct || 0),
    r3PowerMultiplier: 1 + (totals.r3PowerPct || 0),
    r3CapMultiplier: 1 + (totals.r3CapPct || 0),
    r3BarsMultiplier: 1 + (totals.r3BarsPct || 0),
    adventureStatsMultiplier: 1 + (totals.adventureStatsPct || 0),
    statMultiplier: 1 + (totals.statPct || 0),
    wishSpeedMultiplier: 1 + (totals.wishSpeedPct || 0),
    hackSpeedMultiplier: 1 + (totals.hackSpeedPct || 0),
    /* Souhaits "I wish I had more Inventory space" : 1 emplacement par niveau (leur effet le dit). */
    inventorySlots: IDLE_WISHES_CATALOG_V1.reduce((sum, w) => (
      /extra inventory slot/i.test(String(w.effect || ""))
        ? sum + Math.max(0, Math.min(w.levels, Number(tracks[w.id]?.level) || 0))
        : sum
    ), 0),
    basicTrainingExtraLevels: totals.basicTrainingExtraLevel || 0
  };
}
