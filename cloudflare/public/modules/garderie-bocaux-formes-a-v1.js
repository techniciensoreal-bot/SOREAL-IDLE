/*
 * SOREAL IDLE — Garderie : récipients des rangs 2 à 6 pour les apparences DÉFAUT, CHAT COQUET (noeud), DORÉ et HALLOWEEN (chauvesouris). Un objet par récipient : pour en refaire un seul, ne toucher qu'à son entrée.
 * Rang 1 = la forme d'avant (bocal classique, flacon de parfum, lingot, chaudron à sang). Plus le rang monte, plus le dessin est riche (cadre, dorures, gemmes, reflets statiques). Aucune animation.
 */
(function(){
  'use strict';
  const R=window.__SOREAL_IDLE_GARDERIE_RANGS_V1__;
  if(!R)return;
  const G=R.aide,D=R.def;

  /* ===== Défaut : verre bleuté ===== */
  R.skins.defaut=[
    D('Bocal à bouchon de liège','M34 14H66V30Q94 34 94 56V140Q94 154 80 154H20Q6 154 6 140V56Q6 34 34 30Z',
      '<rect x="31" y="3" width="38" height="15" rx="4" fill="#c99a5a" stroke="#6b4a1e" stroke-width="1.5"/><circle cx="42" cy="9" r="1.3" fill="#6b4a1e"/><circle cx="58" cy="12" r="1.3" fill="#6b4a1e"/>',
      '#bfe1ff',48,148,50),
    D('Bocal de confiture','M16 10H84V30Q92 34 92 44V140Q92 154 78 154H22Q8 154 8 140V44Q8 34 16 30Z',
      '<rect x="12" y="2" width="76" height="22" rx="4" fill="#d9a441" stroke="#6b4a10" stroke-width="1.6"/><path d="M20 6V20M28 6V20M36 6V20M44 6V20M52 6V20M60 6V20M68 6V20M76 6V20" stroke="#8a5d0c" stroke-width="1.4" fill="none"/><path d="M13 27H87" stroke="#f1d88a" stroke-width="2" fill="none"/>',
      '#bfe1ff',44,148,52),
    D('Cloche de verre','M50 8C20 8 8 40 8 80V130H2V154H98V130H92V80C92 40 80 8 50 8Z',
      '<circle cx="50" cy="7" r="6" fill="#e2b84a" stroke="#6b4a10" stroke-width="1.4"/><rect x="0" y="132" width="100" height="22" rx="5" fill="#c99a3a" stroke="#6b4a10" stroke-width="1.6"/><path d="M8 140H92" stroke="#f8e29a" stroke-width="1.6" fill="none"/>'+G.reflet('M20 60Q22 34 40 20'),
      '#cfe8ff',40,128,52),
    D('Bocal facetté','M30 14H70L94 40V124L70 154H30L6 124V40Z',
      '<rect x="24" y="2" width="52" height="14" rx="4" fill="#e2b84a" stroke="#6b4a10" stroke-width="1.5"/><path d="M6 40H94M30 14L40 40L50 154M70 14L60 40L50 154M94 124L60 40M6 124L40 40" stroke="rgba(255,255,255,.55)" stroke-width="1.1" fill="none"/>'+G.gem(50,9,4,'#7fd0ff','#2a6a9a')+G.interieur('M30 14H70L94 40V124L70 154H30L6 124V40Z',.88,'#e8f6ff',1),
      '#d6ecff',48,146,46),
    D('Reliquaire de cristal','M38 16H62L66 28Q92 36 94 64V132Q94 154 72 154H28Q6 154 6 132V64Q8 36 34 28Z',
      '<path d="M28 18H72L68 6L60 12L50 2L40 12L32 6Z" fill="#e8c050" stroke="#6b4a10" stroke-width="1.5"/>'+G.gem(50,12,3.6,'#ff4a6a','#7a1020')+G.gem(36,15,2.6,'#6ae0ff','#1a5a7a')+G.gem(64,15,2.6,'#6ae0ff','#1a5a7a')+
      '<rect x="12" y="140" width="76" height="14" rx="5" fill="#e8c050" stroke="#6b4a10" stroke-width="1.5"/>'+G.gem(30,147,3,'#7affb0','#1a6a40')+G.gem(50,147,3.4,'#ff4a6a','#7a1020')+G.gem(70,147,3,'#7affb0','#1a6a40')+
      G.interieur('M38 16H62L66 28Q92 36 94 64V132Q94 154 72 154H28Q6 154 6 132V64Q8 36 34 28Z',.9,'#ffe9a0',1.4)+G.etincelle(80,52,5)+G.etincelle(22,100,3.4)+G.reflet('M18 60Q18 44 32 38'),
      '#f4d57a',48,136,50)
  ];

  /* ===== Chat coquet (noeud) : flacons de plus en plus luxueux ===== */
  R.skins.noeud=[
    D('Flacon à pulvérisateur','M36 24H64V34H88Q96 34 96 44V140Q96 154 82 154H18Q4 154 4 140V44Q4 34 12 34H36Z',
      '<rect x="40" y="10" width="20" height="14" rx="3" fill="#ff8fcf" stroke="#b02a78" stroke-width="1.4"/><rect x="30" y="3" width="34" height="8" rx="4" fill="#ff5fb8" stroke="#b02a78" stroke-width="1.4"/><path d="M64 7H74" stroke="#b02a78" stroke-width="2" stroke-linecap="round"/>'+G.reflet('M14 56V120'),
      '#ffd6ec',58,148,52),
    D('Vaporisateur à poire','M42 26H58V40C84 44 96 62 96 90V132Q96 154 74 154H26Q4 154 4 132V90C4 62 16 44 42 40Z',
      '<ellipse cx="50" cy="13" rx="15" ry="11" fill="#ff7fc3" stroke="#b02a78" stroke-width="1.4"/><path d="M40 8Q50 2 60 8M38 14Q50 8 62 14" stroke="#ffc2e4" stroke-width="1.4" fill="none"/><rect x="40" y="22" width="20" height="6" rx="2" fill="#f0c15a" stroke="#8a5d0c" stroke-width="1.2"/><path d="M64 20Q80 22 84 40" stroke="#f0c15a" stroke-width="2" fill="none"/><path d="M84 40V50" stroke="#ff5fb8" stroke-width="3" stroke-linecap="round"/><path d="M80 50L84 62L88 50Z" fill="#ff5fb8"/>'+G.reflet('M14 80Q14 62 26 54'),
      '#ffd6ec',64,148,50),
    D('Carafe de parfum','M44 22H56V50Q56 58 70 66Q96 80 96 112Q96 154 50 154Q4 154 4 112Q4 80 30 66Q44 58 44 50Z',
      '<circle cx="50" cy="12" r="9" fill="#ffc2e4" stroke="#b02a78" stroke-width="1.5"/><path d="M45 8Q48 5 52 6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="41" y="22" width="18" height="6" rx="2" fill="#f0c15a" stroke="#8a5d0c" stroke-width="1.2"/>'+G.interieur('M44 22H56V50Q56 58 70 66Q96 80 96 112Q96 154 50 154Q4 154 4 112Q4 80 30 66Q44 58 44 50Z',.86,'#fff0f8',1)+G.reflet('M14 100Q14 82 28 74'),
      '#ffd6ec',72,146,52),
    D('Flacon facetté à nœud','M34 22H66L72 36L96 54V132L78 154H22L4 132V54L28 36Z',
      '<path d="M4 54H96M28 36L50 70L72 36M50 70L22 154M50 70L78 154" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.1"/><rect x="33" y="14" width="34" height="9" rx="3" fill="#f0c15a" stroke="#8a5d0c" stroke-width="1.3"/><rect x="38" y="3" width="24" height="12" rx="5" fill="#ff8fcf" stroke="#b02a78" stroke-width="1.5"/><path d="M50 30L30 22V40Z M50 30L70 22V40Z" fill="#ff5fb8" stroke="#b02a78" stroke-width="1.3"/><circle cx="50" cy="30" r="4.6" fill="#ff8fcf" stroke="#b02a78" stroke-width="1.3"/>'+G.gem(50,100,3.6,'#ffd0ea','#b02a78')+G.etincelle(84,70,4),
      '#ffe1f1',74,146,46),
    D('Flacon de diamant à nœud','M30 22H70L96 56L50 154L4 56Z',
      '<path d="M4 56H96M30 22L38 56L50 154M70 22L62 56L50 154M30 22L50 56L70 22M4 56L38 56M96 56L62 56" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.1"/>'+G.interieur('M30 22H70L96 56L50 154L4 56Z',.9,'#fff',1.2)+
      '<rect x="31" y="14" width="38" height="10" rx="4" fill="#f0c15a" stroke="#8a5d0c" stroke-width="1.4"/>'+G.gem(50,19,3.4,'#ff5fb8','#7a1050')+
      '<path d="M50 7L22 0V20Z M50 7L78 0V20Z" fill="#ff5fb8" stroke="#b02a78" stroke-width="1.4"/><path d="M50 7L36 26 M50 7L64 26" stroke="#ff8fcf" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="8" r="5.2" fill="#ffa6da" stroke="#b02a78" stroke-width="1.4"/>'+
      G.etincelle(16,40,5)+G.etincelle(86,38,4)+G.etincelle(30,84,3)+G.etincelle(72,92,3.4)+G.gem(50,120,2.8,'#fff','#d56aa8'),
      '#fff0f8',62,128,32)
  ];

  /* ===== Doré ===== */
  R.skins.dore=[
    D('Rouleau de pièces','M12 12H88Q92 12 92 16V148Q92 154 86 154H14Q8 154 8 148V16Q8 12 12 12Z',
      '<path d="M8 28H92M8 44H92M8 60H92M8 76H92M8 92H92M8 108H92M8 124H92M8 140H92" stroke="#8a5d00" stroke-width="1.3" fill="none"/><rect x="4" y="2" width="92" height="14" rx="6" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.6"/><path d="M50 5L52 9.5L57 9.8L53 12.6L54.4 17L50 14.4L45.600 17L47 12.6L43 9.8L48 9.5Z" fill="#fff3a0" stroke="#8a5d00" stroke-width=".8"/>',
      '#ffe27a',30,144,50),
    D('Pot d’or','M14 24H86Q90 24 90 30V40Q100 60 98 100Q96 154 50 154Q4 154 2 100Q0 60 10 40V30Q10 24 14 24Z',
      '<ellipse cx="50" cy="22" rx="42" ry="9" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.6"/><circle cx="26" cy="19" r="5.5" fill="#fff0a0" stroke="#8a5d00" stroke-width="1"/><circle cx="50" cy="16" r="6" fill="#fff0a0" stroke="#8a5d00" stroke-width="1"/><circle cx="74" cy="19" r="5.5" fill="#fff0a0" stroke="#8a5d00" stroke-width="1"/><rect x="6" y="32" width="88" height="8" rx="4" fill="#3a2a10" stroke="#8a5d00" stroke-width="1.2"/>'+G.reflet('M12 70Q12 56 20 48'),
      '#ffe27a',56,144,52),
    D('Couronne d’or','M6 150V44L28 72L50 14L72 72L94 44V150Q94 154 90 154H10Q6 154 6 150Z',
      G.gem(6,40,3.4,'#ff4a6a','#7a1020')+G.gem(50,10,4,'#6ae0ff','#1a5a7a')+G.gem(94,40,3.4,'#ff4a6a','#7a1020')+'<rect x="4" y="132" width="92" height="20" rx="4" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.6"/>'+G.gem(24,142,3.2,'#7affb0','#1a6a40')+G.gem(50,142,3.6,'#ff4a6a','#7a1020')+G.gem(76,142,3.2,'#7affb0','#1a6a40')+G.interieur('M6 150V44L28 72L50 14L72 72L94 44V150Q94 154 90 154H10Q6 154 6 150Z',.88,'#fff3a0',1.2),
      '#ffe27a',82,128,42),
    D('Coffre au trésor','M4 154V68C4 38 22 14 50 14C78 14 96 38 96 68V154Z',
      '<path d="M4 72H96" stroke="#8a5d00" stroke-width="2.4"/><rect x="18" y="56" width="9" height="98" fill="rgba(255,210,63,.35)" stroke="#8a5d00" stroke-width="1.3"/><rect x="73" y="56" width="9" height="98" fill="rgba(255,210,63,.35)" stroke="#8a5d00" stroke-width="1.3"/><rect x="38" y="62" width="24" height="26" rx="5" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.6"/><circle cx="50" cy="72" r="3.6" fill="#3a2a10"/><path d="M50 74V82" stroke="#3a2a10" stroke-width="2.6"/>'+G.gem(50,36,4,'#ff4a6a','#7a1020')+G.gem(32,44,2.8,'#6ae0ff','#1a5a7a')+G.gem(68,44,2.8,'#6ae0ff','#1a5a7a')+'<circle cx="10" cy="150" r="2" fill="#fff3a0"/><circle cx="90" cy="150" r="2" fill="#fff3a0"/>'+G.etincelle(86,30,4),
      '#ffe27a',96,148,36),
    D('Calice orné','M16 10H84C86 50 78 86 58 100V124H82V154H18V124H42V100C22 86 14 50 16 10Z',
      '<rect x="12" y="2" width="76" height="12" rx="5" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.6"/>'+G.gem(30,8,2.8,'#ff4a6a','#7a1020')+G.gem(50,8,3.2,'#6ae0ff','#1a5a7a')+G.gem(70,8,2.8,'#ff4a6a','#7a1020')+
      '<ellipse cx="50" cy="112" rx="14" ry="6" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.4"/>'+G.gem(50,112,3.2,'#ff4a6a','#7a1020')+'<rect x="14" y="140" width="72" height="14" rx="5" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.6"/>'+G.gem(34,147,2.6,'#7affb0','#1a6a40')+G.gem(66,147,2.6,'#7affb0','#1a6a40')+
      '<path d="M26 30Q38 40 26 56M74 30Q62 40 74 56" stroke="#fff3a0" stroke-width="1.6" fill="none" stroke-linecap="round"/>'+G.interieur('M16 10H84C86 50 78 86 58 100V124H82V154H18V124H42V100C22 86 14 50 16 10Z',.9,'#fff3a0',1.3)+G.etincelle(88,70,5)+G.etincelle(12,90,3.4),
      '#ffe27a',22,84,48)
  ];

  /* ===== Halloween (chauvesouris) : le crâne de cristal est le plus beau ===== */
  const VERRE_NUIT='linear-gradient(90deg,rgba(40,30,50,.55),rgba(20,15,25,.35) 40%,rgba(30,22,40,.45) 72%,rgba(70,60,85,.55))';
  const BAT='M40 10L45 24Q50 21 55 24L60 10L63 28C78 20 92 24 98 50Q84 64 88 96Q76 104 74 128Q66 128 62 116C62 134 58 150 50 154C42 150 38 134 38 116Q34 128 26 128Q24 104 12 96Q16 64 2 50C8 24 22 20 37 28Z';
  const CITROUILLE='M50 44C26 30 3 54 3 98C3 134 24 154 50 154C76 154 97 134 97 98C97 54 74 30 50 44Z';
  const FOND_CITROUILLE='linear-gradient(90deg,rgba(60,30,80,.55),rgba(30,15,45,.35) 40%,rgba(45,22,65,.45) 72%,rgba(110,80,150,.5))';
  R.skins.chauvesouris=[
    D('Fiole de poison','M40 16H60V50L96 140Q99 154 86 154H14Q1 154 4 140L40 50Z',
      '<rect x="37" y="3" width="26" height="15" rx="3" fill="#a87a3c" stroke="#4a2c0c" stroke-width="1.5"/><rect x="26" y="126" width="48" height="19" rx="3" fill="#e8dfc4" stroke="#6b5a3a" stroke-width="1.2"/><path d="M42 131L58 140M58 131L42 140" stroke="#2a1a1a" stroke-width="2.6" stroke-linecap="round"/><circle cx="50" cy="135.500" r="3" fill="#e8dfc4" stroke="#2a1a1a" stroke-width="1.2"/>'+G.reflet('M38 58L22 110'),
      '#a79fb8',70,122,36,VERRE_NUIT),
    D('Pierre tombale','M8 154V140H16V52C16 28 31 8 50 8C69 8 84 28 84 52V140H92V154Z',
      '<path d="M50 24V50M40 34H60" stroke="#7a758a" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M20 80L28 90L24 100L32 110" stroke="#4a4658" stroke-width="1.4" fill="none"/><path d="M16 124Q24 118 30 126Q22 130 16 130Z" fill="#3f7a35"/><path d="M70 140Q80 134 84 142Z" fill="#3f7a35"/><path d="M2 140H98" stroke="#7a758a" stroke-width="2.2"/><path d="M10 154L12 146L16 154M84 154L88 146L92 154" stroke="#3f7a35" stroke-width="1.6" fill="none"/>',
      '#8f8aa0',64,128,40,VERRE_NUIT),
    D('Citrouille',CITROUILLE,
      '<path d="M50 44C38 66 34 120 50 154M50 44C62 66 66 120 50 154M26 48C8 70 10 126 34 152M74 48C92 70 90 126 66 152" stroke="rgba(205,180,255,.45)" stroke-width="1.5" fill="none"/><path d="M44 46Q44 30 52 22Q60 23 58 34Q56 42 58 46Z" fill="#4a3a5a" stroke="#2a1e38" stroke-width="1.3"/><path d="M24 84L42 84L33 64Z M58 84L76 84L67 64Z M50 86L45 94H55Z" fill="#1a0a2e" stroke="#d9b45a" stroke-width="1.5" stroke-linejoin="round"/><path d="M26 128Q50 160 74 128L68 133L62 125L56 134L50 125L44 134L38 125L32 133Z" fill="#1a0a2e" stroke="#d9b45a" stroke-width="1.5" stroke-linejoin="round"/><path d="M38 125L40 131L42 125M56 134L58 128L60 134" stroke="#e9dcb0" stroke-width="1.2" fill="none"/>'+G.interieur(CITROUILLE,.93,'#d9b45a',1),
      '#c9a6ff',96,126,30,FOND_CITROUILLE),
    D('Chauve-souris',BAT,
      '<path d="M63 28L98 50M63 32L88 96M62 40L74 128M37 28L2 50M37 32L12 96M38 40L26 128" stroke="#b5aec4" stroke-width="1.2" fill="none" opacity=".85"/><path d="M42 12L45 24M58 12L55 24" stroke="#b5aec4" stroke-width="1.2" fill="none"/><circle cx="44" cy="40" r="3" fill="#ff3b3b" stroke="#ffb0b0" stroke-width="1"/><circle cx="56" cy="40" r="3" fill="#ff3b3b" stroke="#ffb0b0" stroke-width="1"/><path d="M46 49L48 56L50 49M50 49L52 56L54 49" fill="#fff" stroke="#fff" stroke-width="1"/>'+G.interieur(BAT,.92,'#d6cee8',1)+G.gem(50,66,2.8,'#ff3b3b','#6a0a0a'),
      '#c3bad8',62,112,34,VERRE_NUIT),
    D('Crâne de cristal','M50 5C23 5 6 24 6 52C6 70 14 82 22 90V140Q22 154 36 154H64Q78 154 78 140V90C86 82 94 70 94 52C94 24 77 5 50 5Z',
      '<path d="M50 5L36 28L10 42M50 5L64 28L90 42M36 28L50 44L64 28M10 42L26 70M90 42L74 70M28 90L44 100M72 90L56 100" stroke="rgba(236,220,255,.7)" stroke-width="1.1" fill="none"/>'+
      '<ellipse cx="33" cy="62" rx="11" ry="13" fill="#1a0a2e" stroke="#c9a6ff" stroke-width="2"/><ellipse cx="67" cy="62" rx="11" ry="13" fill="#1a0a2e" stroke="#c9a6ff" stroke-width="2"/><circle cx="33" cy="64" r="3.4" fill="#ff5af0"/><circle cx="67" cy="64" r="3.4" fill="#ff5af0"/>'+
      '<path d="M50 76L43 90H57Z" fill="#1a0a2e" stroke="#c9a6ff" stroke-width="1.6"/><path d="M30 126H70M40 122V152M50 122V154M60 122V152" stroke="#e9d9ff" stroke-width="1.5" fill="none"/>'+
      G.interieur('M50 5C23 5 6 24 6 52C6 70 14 82 22 90V140Q22 154 36 154H64Q78 154 78 140V90C86 82 94 70 94 52C94 24 77 5 50 5Z',.9,'#f1e6ff',1.3)+G.gem(50,24,4,'#ff5af0','#5a0a60')+G.gem(22,40,2.4,'#7fd0ff','#1a4a8a')+G.gem(78,40,2.4,'#7fd0ff','#1a4a8a')+G.etincelle(14,18,5)+G.etincelle(88,26,4)+G.etincelle(80,110,5)+G.reflet('M18 34Q22 20 38 12'),
      '#dcc8ff',92,124,30,'linear-gradient(90deg,rgba(210,180,255,.5),rgba(160,120,230,.25) 40%,rgba(190,150,250,.35) 72%,rgba(240,225,255,.55))')
  ];
})();
