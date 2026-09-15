/*
 * SOREAL IDLE — BASIC TRAINING V41.1
 *
 * Boucle d'entraînement inspirée du modèle NGU :
 * - l'énergie est allouée, jamais consommée ;
 * - une barre plafonne à 50 niveaux/s ;
 * - Energy Power n'affecte PAS Basic Training ;
 * - le cap reste fixe pendant le run ;
 * - les niveaux du run préparent le prochain cap ;
 * - la réduction n'est appliquée qu'à la Renaissance ;
 * - maximum 10 % de réduction de cap par Renaissance ;
 * - les niveaux repartent à zéro à la Renaissance.
 */

export const BASIC_TRAINING_V411=Object.freeze({
  version:411,
  maxLevelsPerSecond:50,
  naturalAttack:100,
  naturalDefense:100,
  skills:Object.freeze([
    Object.freeze({
      id:"attaque_passive",
      group:"attack",
      name:"Attaque passive",
      baseCap:2500,
      baseValue:150,
      prerequisite:null,
      prerequisiteLevel:0
    }),
    Object.freeze({
      id:"attaque_reguliere",
      group:"attack",
      name:"Attaque régulière",
      baseCap:15000,
      baseValue:1000,
      prerequisite:"attaque_passive",
      prerequisiteLevel:5000
    }),
    Object.freeze({
      id:"attaque_renforcee",
      group:"attack",
      name:"Attaque renforcée",
      baseCap:30000,
      baseValue:2000,
      prerequisite:"attaque_reguliere",
      prerequisiteLevel:10000
    }),
    Object.freeze({
      id:"contre_palette",
      group:"attack",
      name:"Contre-palette",
      baseCap:50000,
      baseValue:10000,
      prerequisite:"attaque_renforcee",
      prerequisiteLevel:15000
    }),
    Object.freeze({
      id:"percee_quai",
      group:"attack",
      name:"Percée de quai",
      baseCap:70000,
      baseValue:50000,
      prerequisite:"contre_palette",
      prerequisiteLevel:20000
    }),
    Object.freeze({
      id:"ultime_soreal",
      group:"attack",
      name:"Ultime SOREAL",
      baseCap:100000,
      baseValue:200000,
      prerequisite:"percee_quai",
      prerequisiteLevel:25000
    }),

    Object.freeze({
      id:"blocage",
      group:"defense",
      name:"Blocage",
      baseCap:2500,
      baseValue:150,
      prerequisite:null,
      prerequisiteLevel:0
    }),
    Object.freeze({
      id:"defense_renforcee",
      group:"defense",
      name:"Défense renforcée",
      baseCap:15000,
      baseValue:1000,
      prerequisite:"blocage",
      prerequisiteLevel:5000
    }),
    Object.freeze({
      id:"recuperation",
      group:"defense",
      name:"Récupération",
      baseCap:30000,
      baseValue:2000,
      prerequisite:"defense_renforcee",
      prerequisiteLevel:10000
    }),
    Object.freeze({
      id:"boost_offensif",
      group:"defense",
      name:"Boost offensif",
      baseCap:50000,
      baseValue:10000,
      prerequisite:"recuperation",
      prerequisiteLevel:15000
    }),
    Object.freeze({
      id:"charge_logistique",
      group:"defense",
      name:"Charge logistique",
      baseCap:70000,
      baseValue:50000,
      prerequisite:"boost_offensif",
      prerequisiteLevel:20000
    }),
    Object.freeze({
      id:"ultime_logistique",
      group:"defense",
      name:"Ultime logistique",
      baseCap:100000,
      baseValue:200000,
      prerequisite:"charge_logistique",
      prerequisiteLevel:25000
    })
  ])
});

function num(v,d=0){
  const n=Number(v);
  return Number.isFinite(n)?n:Number(d||0);
}

function int(v,d=0){
  return Math.max(0,Math.floor(num(v,d)));
}

export function createBasicTrainingStateV411(now=Date.now()){
  const skills={};

  for(const def of BASIC_TRAINING_V411.skills){
    skills[def.id]={
      level:0,
      progress:0,
      allocation:0,
      cap:def.baseCap
    };
  }

  return {
    version:BASIC_TRAINING_V411.version,
    lastUpdateMs:Math.max(0,num(now,Date.now())),
    skills
  };
}

export function normalizeBasicTrainingStateV411(raw,now=Date.now()){
  if(
    !raw ||
    typeof raw!=="object" ||
    Number(raw.version)!==BASIC_TRAINING_V411.version
  ){
    return createBasicTrainingStateV411(now);
  }

  const out=createBasicTrainingStateV411(now);
  out.lastUpdateMs=Math.max(0,num(raw.lastUpdateMs,now));

  const src=
    raw.skills&&
    typeof raw.skills==="object"
      ?raw.skills
      :{};

  for(const def of BASIC_TRAINING_V411.skills){
    const x=
      src[def.id]&&
      typeof src[def.id]==="object"
        ?src[def.id]
        :{};

    out.skills[def.id]={
      level:int(x.level,0),
      progress:Math.max(
        0,
        Math.min(
          0.999999999,
          num(x.progress,0)
        )
      ),
      allocation:int(x.allocation,0),
      cap:Math.max(
        1,
        int(x.cap,def.baseCap)
      )
    };
  }

  return out;
}

export function isBasicTrainingSkillUnlockedV411(
  state,
  defOrId
){
  const def=
    typeof defOrId==="string"
      ?BASIC_TRAINING_V411.skills.find(
          x=>x.id===defOrId
        )
      :defOrId;

  if(!def)return false;
  if(!def.prerequisite)return true;

  const previous=
    state&&
    state.skills
      ?state.skills[def.prerequisite]
      :null;

  return Boolean(
    previous&&
    int(previous.level,0)>=
      int(def.prerequisiteLevel,0)
  );
}

export function levelsPerSecondForBasicTrainingSkillV411(
  allocation,
  cap
){
  const a=Math.max(0,num(allocation,0));
  const c=Math.max(1,num(cap,1));

  return BASIC_TRAINING_V411.maxLevelsPerSecond*
    Math.min(
      1,
      a/c
    );
}

/*
 * La réduction est préparée par les niveaux du run.
 * 10 000 niveaux = réduction maximale de 10 %.
 * Elle est seulement appliquée à la Renaissance.
 *
 * Le -1 lorsque la compétence a réellement progressé permet aux caps très
 * bas d'atteindre 1 proprement sans asymptote d'arrondi.
 */
export function nextBasicTrainingCapV411(
  currentCap,
  levelsThisRun
){
  const cap=Math.max(1,int(currentCap,1));
  const levels=Math.max(0,num(levelsThisRun,0));

  if(cap<=1||levels<=0){
    return cap;
  }

  const reductionPct=
    Math.min(
      10,
      levels/1000
    );

  return Math.max(
    1,
    Math.ceil(
      cap*
      (
        1-
        reductionPct/100
      )
    )-
    1
  );
}

export function advanceBasicTrainingSkillV411(
  skill,
  seconds
){
  const source=
    skill&&
    typeof skill==="object"
      ?skill
      :{};

  let x=
    int(source.level,0)+
    Math.max(
      0,
      Math.min(
        0.999999999,
        num(source.progress,0)
      )
    );

  const allocation=int(source.allocation,0);
  const cap=Math.max(1,int(source.cap,1));
  const secondsSafe=Math.max(0,num(seconds,0));

  x+=
    levelsPerSecondForBasicTrainingSkillV411(
      allocation,
      cap
    )*
    secondsSafe;

  return {
    level:Math.max(0,Math.floor(x)),
    progress:Math.max(
      0,
      Math.min(
        0.999999999,
        x-Math.floor(x)
      )
    ),
    allocation,
    cap
  };
}

export function advanceBasicTrainingStateV411(
  raw,
  now,
  maxOfflineSeconds=12*60*60
){
  const current=Math.max(0,num(now,Date.now()));
  const state=normalizeBasicTrainingStateV411(raw,current);

  const elapsedMs=
    Math.max(
      0,
      current-
      Math.max(
        0,
        num(state.lastUpdateMs,current)
      )
    );

  const seconds=
    Math.min(
      Math.max(0,num(maxOfflineSeconds,0)),
      elapsedMs/1000
    );

  for(const def of BASIC_TRAINING_V411.skills){
    if(
      !isBasicTrainingSkillUnlockedV411(
        state,
        def
      )
    ){
      state.skills[def.id].allocation=0;
      continue;
    }

    state.skills[def.id]=
      advanceBasicTrainingSkillV411(
        state.skills[def.id],
        seconds
      );
  }

  state.lastUpdateMs=current;

  return {
    state,
    elapsedSeconds:seconds
  };
}

export function rebirthBasicTrainingStateV411(
  raw,
  now=Date.now()
){
  const before=
    normalizeBasicTrainingStateV411(
      raw,
      now
    );

  const after=
    createBasicTrainingStateV411(
      now
    );

  for(const def of BASIC_TRAINING_V411.skills){
    const oldSkill=before.skills[def.id];

    after.skills[def.id].cap=
      nextBasicTrainingCapV411(
        oldSkill.cap,
        oldSkill.level+
          oldSkill.progress
      );
  }

  return after;
}

export function totalBasicTrainingAllocationV411(raw){
  const state=
    normalizeBasicTrainingStateV411(
      raw,
      Date.now()
    );

  return BASIC_TRAINING_V411.skills.reduce(
    (sum,def)=>
      sum+
      (
        isBasicTrainingSkillUnlockedV411(
          state,
          def
        )
          ?int(
              state.skills[def.id].allocation,
              0
            )
          :0
      ),
    0
  );
}

export function deriveBasicTrainingStatsV411(raw){
  const state=
    normalizeBasicTrainingStateV411(
      raw,
      Date.now()
    );

  let attack=
    BASIC_TRAINING_V411.naturalAttack;

  let defense=
    BASIC_TRAINING_V411.naturalDefense;

  let attackLevels=0;
  let defenseLevels=0;

  for(const def of BASIC_TRAINING_V411.skills){
    const skill=state.skills[def.id];

    const level=
      int(skill.level,0)+
      Math.max(
        0,
        Math.min(
          0.999999999,
          num(skill.progress,0)
        )
      );

    const contribution=
      Math.pow(
        level,
        1.3
      )*
      Math.max(
        0,
        num(def.baseValue,0)
      );

    if(def.group==="attack"){
      attackLevels+=level;
      attack+=contribution;
    }else{
      defenseLevels+=level;
      defense+=contribution;
    }
  }

  return {
    attackLevels,
    defenseLevels,
    attack:Math.max(100,attack),
    defense:Math.max(100,defense)
  };
}

export function applyBasicTrainingAllocationsV411(
  raw,
  desired,
  idleEnergy,
  totalEnergyCap
){
  const state=
    normalizeBasicTrainingStateV411(
      raw,
      Date.now()
    );

  const before=
    totalBasicTrainingAllocationV411(
      state
    );

  const budget=
    Math.max(
      0,
      Math.min(
        int(totalEnergyCap,0),
        int(idleEnergy,0)+before
      )
    );

  const req=
    desired&&
    typeof desired==="object"
      ?desired
      :{};

  let remaining=budget;

  for(const def of BASIC_TRAINING_V411.skills){
    const skill=state.skills[def.id];

    if(
      !isBasicTrainingSkillUnlockedV411(
        state,
        def
      )
    ){
      skill.allocation=0;
      continue;
    }

    const wanted=
      Math.max(
        0,
        int(
          req[def.id],
          skill.allocation
        )
      );

    const assigned=
      Math.min(
        wanted,
        remaining
      );

    skill.allocation=assigned;
    remaining-=assigned;
  }

  const after=
    totalBasicTrainingAllocationV411(
      state
    );

  return {
    state,
    idleEnergy:
      Math.max(
        0,
        budget-after
      ),
    allocated:after,
    budget
  };
}

export function basicTrainingSnapshotV411(
  raw,
  totalEnergyCap=0,
  idleEnergy=0
){
  const state=
    normalizeBasicTrainingStateV411(
      raw,
      Date.now()
    );

  const skills=
    BASIC_TRAINING_V411.skills.map(
      def=>{
        const skill=
          state.skills[def.id];

        const unlocked=
          isBasicTrainingSkillUnlockedV411(
            state,
            def
          );

        return {
          id:def.id,
          group:def.group,
          name:def.name,
          level:skill.level,
          progress:skill.progress,
          allocation:skill.allocation,
          cap:skill.cap,
          nextCap:
            nextBasicTrainingCapV411(
              skill.cap,
              skill.level+
                skill.progress
            ),
          maxReductionReached:
            nextBasicTrainingCapV411(
              skill.cap,
              skill.level+
                skill.progress
            )<=
            Math.max(
              1,
              Math.ceil(
                skill.cap*.9
              )-
              1
            ),
          levelsPerSecond:
            unlocked
              ?levelsPerSecondForBasicTrainingSkillV411(
                  skill.allocation,
                  skill.cap
                )
              :0,
          unlocked,
          prerequisite:def.prerequisite,
          prerequisiteLevel:def.prerequisiteLevel,
          baseCap:def.baseCap,
          baseValue:def.baseValue
        };
      }
    );

  const allocated=
    totalBasicTrainingAllocationV411(
      state
    );

  const derived=
    deriveBasicTrainingStatsV411(
      state
    );

  return {
    version:BASIC_TRAINING_V411.version,
    maxLevelsPerSecond:
      BASIC_TRAINING_V411.maxLevelsPerSecond,
    energyPowerAffectsTraining:false,
    attack:derived.attack,
    defense:derived.defense,
    attackLevels:derived.attackLevels,
    defenseLevels:derived.defenseLevels,
    energy:{
      idle:Math.max(0,int(idleEnergy,0)),
      allocated,
      cap:Math.max(0,int(totalEnergyCap,0))
    },
    skills
  };
}
