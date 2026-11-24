/*
 * SOREAL IDLE : lecteur de sauvegarde SCUMM (ScummVM) pour le gain d'AP « par progrès » du menu Énigmes (Norman, 2026-11-22).
 * Expose window.__SOREAL_IDLE_SCUMMVM_SAVE_V1__ = { PROFILS, decompresser, lire, unites, ... }.
 *
 * SOURCE DU FORMAT : scummvm/scummvm, engines/scumm/saveload.cpp (CURRENT_VER 124, `ScummEngine::loadState` puis `saveLoadWithSerializer`), actor.cpp (`Actor::saveLoadWithSerializer`),
 * sound.cpp, charset.cpp, resource.cpp / scumm.h (types de ressources, tailles). Rien n'est deviné : chaque taille ci-dessous est une ligne de ce code, relue le 2026-11-22 sur la version 124.
 * Le fichier est du gzip (ou zlib) : ScummVM écrit ses sauvegardes par `wrapCompressedWriteStream` (en-tête 1f 8b mesuré sur une vraie sauvegarde du moteur du jeu).
 *
 * Disposition (version 124, SCUMM v6 = Day of the Tentacle) :
 *   en-tête 44 octets (« SCVM », taille, version, nom) ; vignette « THMB » (taille dans l'en-tête) ; section « INFO » (26 octets) ;
 *   état principal (MD5, salle, variables locales 80x26x4, caméra, curseur, palettes, gfxUsageBits…) ; 13 acteurs ; son (4 octets) ; 80 scripts ; 200 objets locaux ; 50 verbes ;
 *   imbrications, phrases, chaînes, cycles de couleurs, échelles ; RESSOURCES dynamiques (type u16, [index u16, taille u32, octets, (+u16 pour inventaire et noms d'objets)]*, 0xFFFF) ; 0xFFFF ;
 *   propriétaires des objets (800 octets), états (800 octets), classData (800 x u32) ; variables de salle (0 en SCUMM v6) ; variables globales (800 x i32 LE) ; bitVars (2048 bits = 256 octets) ; la suite ne sert pas.
 * La position des variables n'est établie que si TOUT l'amont se lit sans incohérence (marqueurs de fin de ressources, objets, bornes) : sinon lire() renvoie une erreur, jamais une valeur devinée.
 *
 * UNITÉS DE PROGRÈS (voir unites). Une unité est un fait qui, une fois vrai, est mémorisé par le client (ensemble « déjà vu », jamais redescendant) :
 *   - « objet possédé » : un objet global dont le propriétaire est un acteur (1 à 14 ; 15 = dans une salle, 0 = personne) ; vu au moins une fois = ramassé ou reçu au moins une fois (800 possibles).
 *   - « indicateur » : un bit de bitVars à 1, vu au moins une fois (2048 possibles). SCUMM v6 s'en sert comme drapeaux de scénario persistants (les temporaires d'un script sont des variables locales, 26 par script).
 *   NON RETENUES (TODO documenté, rien d'inventé) : les variables globales (_scummVars, 800 x i32). Les mesures sur de vraies sauvegardes montrent des variables moteur qui changent à chaque pas
 *   (minuteurs 11, 12, 13, 14, 47 ; aléa 118 ; temps 119, 125, 126, 128, 129 d'après vars.cpp) mais aussi des variables du script du jeu qui passent de 0 à une valeur puis retombent (228, 247) : sans les
 *   scripts du jeu, aucune règle vérifiable ne sépare « fait de scénario » et « variable de travail ». Elles pourront entrer quand une liste sûre sera établie (parties jouées jusqu'au bout) ;
 *   le lecteur les décode déjà (champ vars), seul le choix d'unités manque. Exclus aussi : positions, caméra, curseur, texte à l'écran (aucun n'est lu).
 * DÉPART DE PARTIE : les unités déjà vraies au tout début du jeu (profil.depart, mesurées sur la sauvegarde de référence du début de partie, cloudflare/tests/references) ne comptent pas : aucun AP gratuit.
 */
(function(){
  'use strict';
  const R=typeof window!=='undefined'?window:globalThis;
  if(R.__SOREAL_IDLE_SCUMMVM_SAVE_V1__)return;

  const VERSION_FORMAT=124;   /* la seule version relue et vérifiée */
  /* Paramètres propres à chaque jeu (valeurs lues dans TENTACLE.000, bloc MAXS de 38 octets lu par ScummEngine_v6::readMAXS : 800 variables, 2048 bits, 200 objets locaux, 50 verbes, 5 FlObjects, 80 emplacements d inventaire, 800 objets globaux ;
     scumm.cpp : 13 acteurs hors Maniac Mansion/v7/v8/HE ; script.h NUM_SCRIPT_SLOT = 80 ; scumm.h kMaxScriptNestingHE = 40). */
  const PROFILS={
    tentacle:{acteurs:13,objetsLocaux:200,verbes:50,objetsGlobaux:800,paletteOmbre:256,variablesSalle:0,variables:800,bits:2048,depart:{objets:[300,301,709,710,711],bits:[48,78,93,100,246,352]}}
  };

  function lecteur(oct){
    const dv=new DataView(oct.buffer,oct.byteOffset,oct.byteLength);
    return {
      p:0,n:oct.length,
      u8(){const v=dv.getUint8(this.p);this.p+=1;return v;},
      u16(){const v=dv.getUint16(this.p,true);this.p+=2;return v;},
      u32(){const v=dv.getUint32(this.p,true);this.p+=4;return v;},
      i32(){const v=dv.getInt32(this.p,true);this.p+=4;return v;},
      be32(){const v=dv.getUint32(this.p,false);this.p+=4;return v;},
      saute(k){this.p+=k;if(this.p>this.n||k<0)throw new Error('LIMITE');},
      pris(k){const a=oct.subarray(this.p,this.p+k);this.saute(k);return a;}
    };
  }

  /* Taille d'un acteur (actor.cpp, Actor::saveLoadWithSerializer, version 124). */
  const TAILLE_ACTEUR=(function(){
    let t=0;
    t+=4;      /* _pos x, y */
    t+=4;      /* _heOffsX, _heOffsY */
    t+=6;      /* _top, _bottom, _elevation */
    t+=2+2+2;  /* _width, _facing, _costume */
    t+=1+1;    /* _room, _talkColor */
    t+=2+2+2+2;/* _talkFrequency, _talkPan, _talkVolume, _boxscale */
    t+=1+1+1;  /* _scalex, _scaley, _charset */
    t+=32*2;   /* _sound (u16 x32) */
    t+=27*2;   /* _animVariable */
    t+=2;      /* _targetFacing */
    t+=8;      /* _moving, _ignoreBoxes, _forceClip, _initFrame, _walkFrame, _standFrame, _talkStartFrame, _talkStopFrame */
    t+=2+2+2+1;/* _speedx, _speedy, _cost.animCounter, _cost.soundCounter */
    t+=3;      /* _drawToBackBuf, _flip, _heSkipLimbs */
    t+=256*2;  /* _palette (u16 x256) */
    t+=9;      /* _shadowMode, _visible, _frame, _animSpeed, _animProgress, _walkbox, _needRedraw, _needBgReset, _costumeNeedsInit */
    t+=4+4+4;  /* _heCondMask, _hePaletteNum, _heShadow */
    t+=2+2+1;  /* _talkPosY, _talkPosX, _ignoreTurns */
    t+=4;      /* _layer (i32) */
    t+=2+2;    /* _talkScript, _walkScript */
    t+=4+1+2+1+4+4+4+4+2+2+2; /* _walkdata : dest, destbox, destdir, curbox, cur, next, deltaX, deltaY, xfrac, yfrac, facing */
    t+=4;      /* _walkdata.point3 */
    t+=16+2+16*2*4;          /* _cost : animType, stopped, curpos, start, end, frame */
    t+=16*2+16*2+16*4;       /* _cost : heJumpOffsetTable, heJumpCountTable, heCondMaskTable */
    return t;
  })();

  /* Types de ressources enregistrés avec leur contenu (mode « dynamique », resource.cpp allocateArrays) : octets + (inventaire, noms d'objets) un u16 de plus. */
  const RT_SON=4;
  const RT_DYNAMIQUES={5:1,7:1,8:1,9:1,11:1,13:1,14:1,16:1};
  const RT_AVEC_U16={5:1,16:1};

  /* Octets (déjà décompressés) -> { version, nom, proprietaires: Uint8Array(objetsGlobaux), vars: Int32Array, bits: Uint8Array(octets), salle, ... } ou { erreur }. */
  function lire(oct,profil){
    try{
      if(!oct||!oct.buffer||!(oct.length>=80))return {erreur:'COURT'};
      const P=profil;
      if(!P)return {erreur:'PROFIL'};
      const r=lecteur(oct);
      if(String.fromCharCode(oct[0],oct[1],oct[2],oct[3])!=='SCVM')return {erreur:'ENTETE'};
      r.p=8;const version=r.u32();
      if(version!==VERSION_FORMAT)return {erreur:'VERSION',version:version};
      let fin=12;while(fin<44&&oct[fin])fin++;
      const nom=String.fromCharCode.apply(null,Array.prototype.slice.call(oct,12,fin));
      r.p=44;
      /* vignette : 'THMB' + taille (grand-boutiste, taille totale de la vignette) */
      if(String.fromCharCode(oct[44],oct[45],oct[46],oct[47])!=='THMB')return {erreur:'VIGNETTE'};
      r.p=48;const tailleVignette=r.be32();r.p=44+tailleVignette;
      if(String.fromCharCode(oct[r.p],oct[r.p+1],oct[r.p+2],oct[r.p+3])!=='INFO')return {erreur:'INFO'};
      r.saute(4);r.be32();const tInfo=r.be32();
      if(tInfo!==26)return {erreur:'INFO_TAILLE'};
      r.saute(26-12);
      /* état principal */
      r.saute(16);                       /* _gameMD5 */
      r.saute(5);                        /* _curPalIndex, _currentRoom, _roomResource, _numObjectsInRoom, _currentScript */
      const salleCourante=oct[r.p-4];    /* _currentRoom (2e des 5 octets) */
      r.saute(80*26*4);                  /* vm.localvar */
      r.saute(128);                      /* _resourceMapper */
      r.saute(16);                       /* _charsetColorMap */
      r.saute(23*16);                    /* _charsetData */
      r.saute(16);                       /* caméra : dest, cur, last, accel (x,y en i16) */
      r.saute(2+2+1+1+2+2+2);            /* _screenStartStrip, _screenEndStrip, mode, follows, leftTrigger, rightTrigger, movingToActor */
      r.saute(1);                        /* _cameraIsFrozen */
      r.saute(1);                        /* _useMacScreenCorrectHeight */
      r.saute(1+1);                      /* _actorToPrintStrFor, _charsetColor */
      r.saute(2);                        /* _charsetBufPos */
      r.saute(1+1+1);                    /* _haveMsg, _haveActorSpeechMsg, _useTalkAnims */
      r.saute(2+2);                      /* _talkDelay, _defaultTextSpeed */
      r.saute(1);                        /* _sentenceNum */
      r.saute(1+5*4+5+5*2+2);            /* cutSceneStackPointer, cutScenePtr, cutSceneScript, cutSceneData, cutSceneScriptIndex */
      r.saute(1+1+2+1+1);                /* numNestedScripts, _userPut, _userState, _cursor.state, _currentCursor */
      r.saute(8192);                     /* _grabbedCursor */
      r.saute(4*2+1+1+2*2);              /* _cursor width, height, hotspotX, hotspotY, animate, animateIndex ; _mouse x, y */
      r.saute(256);                      /* _colorUsedByCycle */
      r.saute(5);                        /* _doEffect, _switchRoomEffect, _newEffect, _switchRoomEffect2, _bgNeedsRedraw */
      r.saute(2);const palManipCompteur=r.u16();   /* _palManipStart, _palManipEnd, puis _palManipCounter (u16) */
      r.saute(3*410*4);                  /* gfxUsageBits */
      r.saute(768+768);                  /* _currentPalette, _darkenPalette */
      r.saute(256);                      /* _charsetBuffer */
      r.saute(1);                        /* _egoPositioned */
      r.saute(1);                        /* _screenEffectFlag */
      r.saute(1+4);                      /* _shakeEnabled, _shakeFrame */
      r.saute(1);                        /* _keepText */
      r.saute(2+2);                      /* _screenB, _screenH */
      r.saute(2);                        /* _NESCostumeSet */
      r.saute(P.acteurs*TAILLE_ACTEUR);  /* acteurs */
      r.saute(2+2);                      /* son : _currentCDSound, _currentMusic */
      r.saute(80*(4+4+2+2+7+1));         /* vm.slot : offs, delay, number, delayFrameCount, 7 octets, cycle */
      r.saute(P.objetsLocaux*(4+4+2*7+6));/* _objs : OBIMoffset, OBCDoffset, walk_x, walk_y, obj_nr, x_pos, y_pos, width, height, 6 octets */
      r.saute(P.verbes*(8*2+2+11+2));    /* _verbs */
      r.saute(40*4);                     /* vm.nest */
      r.saute(6*7);                      /* _sentence */
      r.saute(6*(12+4+8));               /* _string */
      r.saute(16*8);                     /* _colorCycle */
      r.saute(20*12);                    /* _scaleSlots */
      /* ressources dynamiques */
      const debutRessources=r.p;
      const inventaire=[];   /* { idx, obj } : objet de l'emplacement d'inventaire idx (u16 écrit après les octets de la ressource) */
      let nbRes=0;
      for(;;){
        const type=r.u16();
        if(type===0xFFFF)break;
        if(type<1||type>21)return {erreur:'TYPE_RESSOURCE',type:type,pos:r.p,debutRessources:debutRessources};
        for(;;){
          const idx=r.u16();
          if(idx===0xFFFF)break;
          nbRes++;
          if(type===RT_SON)continue;
          if(RT_DYNAMIQUES[type]){
            const taille=r.u32();
            if(taille>2e6)return {erreur:'TAILLE_RESSOURCE'};
            r.saute(taille);
            if(RT_AVEC_U16[type]){const v=r.u16();if(type===5)inventaire.push({idx:idx,obj:v});}
          }
        }
      }
      const n=P.objetsGlobaux;
      const proprietaires=r.pris(n).slice();
      const etats=r.pris(n).slice();
      r.saute(P.paletteOmbre);           /* _shadowPalette (256 octets en SCUMM v6) */
      if(palManipCompteur)r.saute(0x300+0x600); /* _palManipPalette + _palManipIntermediatePal, seulement si _palManipCounter != 0 */
      r.saute(n*4);                      /* _classData */
      r.saute(P.variablesSalle*4);       /* _roomVars */
      const vars=new Int32Array(P.variables);
      for(let i=0;i<P.variables;i++)vars[i]=r.i32();
      const bits=r.pris(P.bits>>3).slice();
      /* VÉRIFICATION DE LA QUEUE : la position des variables n'est crédible que si le reste du fichier se lit jusqu'au dernier octet, exactement.
         Liste des ressources verrouillées (type u8, index u16, … puis 0xFF), état du CD audio (5 x u32), taille du bloc son (i32 grand-boutiste) + ce bloc, état du jeu de caractères (i32 + u8, version >= 74). */
      let verrouilles=0;
      for(;;){const t=r.u8();if(t===0xFF)break;r.saute(2);if(++verrouilles>5000)return {erreur:'QUEUE'};}
      r.saute(20);
      const tailleSon=r.be32();
      if(tailleSon>1e6)return {erreur:'QUEUE'};
      r.saute(tailleSon);
      r.saute(4+1);
      if(r.n-r.p!==0)return {erreur:'QUEUE',reste:r.n-r.p};
      return {version:version,nom:nom,salle:salleCourante,proprietaires:proprietaires,etats:etats,vars:vars,bits:bits,inventaire:inventaire,nbRessources:nbRes,verrouilles:verrouilles,tailleSon:tailleSon};
    }catch(e){return {erreur:String(e&&e.message||e)};}
  }


  /*
   * Décompresseur DEFLATE de secours (Norman, 2026-11-24 : « je ramasse des objets et je ne débloque pas d'AP sur téléphone »). La lecture de la sauvegarde s'appuyait sur DecompressionStream, absent de certains navigateurs de téléphone (Safari avant 16.4, anciens
   * navigateurs Android) : la lecture échouait EN SILENCE, donc aucun AP. Ici, un inflate complet en JavaScript (blocs stockés, Huffman fixe et dynamique), méthode de puff.c (zlib), vérifié contre zlib dans cloudflare/tests/idle-scummvm-inflate-v1.test.mjs.
   */
  const L_BASE=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],L_EXT=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const D_BASE=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],D_EXT=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  const ORDRE_LONGUEURS=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
  function tableHuffman(longueurs,n){
    const compte=new Uint16Array(16),symbole=new Uint16Array(n),offs=new Uint16Array(16);
    for(let i=0;i<n;i++)compte[longueurs[i]]++;
    for(let l=1;l<15;l++)offs[l+1]=offs[l]+compte[l];
    for(let i=0;i<n;i++)if(longueurs[i]!==0)symbole[offs[longueurs[i]]++]=i;
    return {compte:compte,symbole:symbole};
  }
  function inflateBrut(src,debut){
    let pos=debut,tampon=0,nbits=0,sortie=new Uint8Array(Math.max(1024,src.length*4)),n=0;
    function bits(k){
      let v=tampon;
      while(nbits<k){if(pos>=src.length)throw new Error('flux tronqué');v|=src[pos++]<<nbits;nbits+=8;}
      tampon=v>>>k;nbits-=k;
      return v&((1<<k)-1);
    }
    function reserver(plus){if(n+plus>sortie.length){const g=new Uint8Array(Math.max(sortie.length*2,n+plus));g.set(sortie.subarray(0,n));sortie=g;}}
    function decoder(h){
      let code=0,premier=0,index=0;
      for(let l=1;l<=15;l++){
        code|=bits(1);
        const c=h.compte[l];
        if(code-c<premier)return h.symbole[index+(code-premier)];
        index+=c;premier+=c;premier<<=1;code<<=1;
      }
      throw new Error('code invalide');
    }
    let fixeL=null,fixeD=null;
    function codes(hl,hd){
      for(;;){
        const s=decoder(hl);
        if(s<256){reserver(1);sortie[n++]=s;}
        else if(s===256)return;
        else{
          const i=s-257;if(i>=29)throw new Error('longueur invalide');
          const len=L_BASE[i]+bits(L_EXT[i]);
          const d=decoder(hd);if(d>=30)throw new Error('distance invalide');
          const dist=D_BASE[d]+bits(D_EXT[d]);
          if(dist>n)throw new Error('distance trop grande');
          reserver(len);
          for(let k=0;k<len;k++){sortie[n]=sortie[n-dist];n++;}
        }
      }
    }
    let dernier;
    do{
      dernier=bits(1);
      const type=bits(2);
      if(type===0){
        tampon=0;nbits=0;   /* alignement sur l'octet */
        if(pos+4>src.length)throw new Error('bloc stocké tronqué');
        const len=src[pos]|(src[pos+1]<<8),nlen=src[pos+2]|(src[pos+3]<<8);pos+=4;
        if((len^0xffff)!==nlen)throw new Error('bloc stocké invalide');
        if(pos+len>src.length)throw new Error('bloc stocké tronqué');
        reserver(len);sortie.set(src.subarray(pos,pos+len),n);n+=len;pos+=len;
      }else if(type===1){
        if(!fixeL){
          const l=new Uint8Array(288);for(let i=0;i<144;i++)l[i]=8;for(let i=144;i<256;i++)l[i]=9;for(let i=256;i<280;i++)l[i]=7;for(let i=280;i<288;i++)l[i]=8;
          const d=new Uint8Array(30).fill(5);fixeL=tableHuffman(l,288);fixeD=tableHuffman(d,30);
        }
        codes(fixeL,fixeD);
      }else if(type===2){
        const nl=bits(5)+257,nd=bits(5)+1,nc=bits(4)+4;
        if(nl>286||nd>30)throw new Error('table invalide');
        const lc=new Uint8Array(19);for(let i=0;i<nc;i++)lc[ORDRE_LONGUEURS[i]]=bits(3);
        const hc=tableHuffman(lc,19),lg=new Uint8Array(nl+nd);
        let i=0;
        while(i<nl+nd){
          const s=decoder(hc);
          if(s<16)lg[i++]=s;
          else{
            let rep,val=0;
            if(s===16){if(i===0)throw new Error('répétition sans précédent');val=lg[i-1];rep=3+bits(2);}
            else if(s===17)rep=3+bits(3);
            else rep=11+bits(7);
            if(i+rep>nl+nd)throw new Error('trop de longueurs');
            while(rep--)lg[i++]=val;
          }
        }
        codes(tableHuffman(lg.subarray(0,nl),nl),tableHuffman(lg.subarray(nl),nd));
      }else throw new Error('type de bloc invalide');
    }while(!dernier);
    return sortie.subarray(0,n);
  }
  /* En-tête gzip (1f 8b) ou zlib (78 xx) : retourne l'octet où commence le flux DEFLATE, ou -1. */
  function debutDeflate(b){
    if(b.length>=10&&b[0]===0x1f&&b[1]===0x8b){
      const fl=b[3];let p=10;
      if(fl&4){p+=2+(b[p]|(b[p+1]<<8));}
      if(fl&8){while(p<b.length&&b[p]!==0)p++;p++;}
      if(fl&16){while(p<b.length&&b[p]!==0)p++;p++;}
      if(fl&2)p+=2;
      return p;
    }
    if(b.length>=2&&(b[0]&0x0f)===8)return 2;
    return -1;
  }
  function inflater(octets){
    const b=octets instanceof Uint8Array?octets:new Uint8Array(octets);
    const p=debutDeflate(b);if(p<0)return null;
    return inflateBrut(b,p);
  }
  async function decompresser(octets){
    const b=octets instanceof Uint8Array?octets:new Uint8Array(octets);
    if(b.length<2)return null;
    /* gzip : 1f 8b ; zlib : 78 xx */
    const format=(b[0]===0x1f&&b[1]===0x8b)?'gzip':((b[0]&0x0f)===8?'deflate':'');
    if(!format)return null;
    /* DecompressionStream si le navigateur l'a ; sinon (ou en cas d'échec) le décompresseur de secours ci-dessus */
    try{
      if(typeof DecompressionStream==='function'&&typeof Blob==='function'&&Blob.prototype&&typeof Blob.prototype.stream==='function'){
        const flux=new Blob([b]).stream().pipeThrough(new DecompressionStream(format));
        return new Uint8Array(await new Response(flux).arrayBuffer());
      }
    }catch(_e){}
    try{return inflater(b);}catch(_e){return null;}
  }

  /* Unités de progrès atteintes dans une sauvegarde lue : tableau d'entiers triés, 0 à objetsGlobaux-1 = objet possédé par un acteur, objetsGlobaux + n = bit n de bitVars à 1.
     Les unités déjà vraies au départ de la partie (profil.depart) sont retirées. Voir l'en-tête pour le choix et les exclusions. */
  function unites(lu,profil){
    const liste=[];
    if(!lu||lu.erreur||!profil)return liste;
    const dep=profil.depart||{};
    const sauf={};
    (dep.objets||[]).forEach(function(i){sauf[i]=1;});
    (dep.bits||[]).forEach(function(i){sauf[profil.objetsGlobaux+i]=1;});
    for(let i=0;i<lu.proprietaires.length;i++){const o=lu.proprietaires[i];if(o>=1&&o<=14&&!sauf[i])liste.push(i);}
    for(let i=0;i<profil.bits;i++){if((lu.bits[i>>3]&(1<<(i&7)))&&!sauf[profil.objetsGlobaux+i])liste.push(profil.objetsGlobaux+i);}
    return liste;
  }
  /* Nombre d'unités POSSIBLES du lecteur (sert à calculer parUnite : plafond / possibles). */
  function unitesPossibles(profil){return profil.objetsGlobaux+profil.bits;}

  R.__SOREAL_IDLE_SCUMMVM_SAVE_V1__={PROFILS:PROFILS,VERSION_FORMAT:VERSION_FORMAT,TAILLE_ACTEUR:TAILLE_ACTEUR,lire:lire,decompresser:decompresser,inflater:inflater,unites:unites,unitesPossibles:unitesPossibles};
})();
