/* SOREAL IDLE — inventory presentation helpers extracted from UI monolith. */
(function(){
'use strict';if(window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__)return;
const rarity=[0.76,1.61,2.47,3.33,4.19,5.04];
function nomSlot(slot){return ({tete:'Tête',torse:'Torse',bottes:'Bottes',arme:'Arme principale',bijou1:'Bijou 1',bijou2:'Bijou 2'})[slot]||slot;}
function iconeSlot(slot){return ({tete:'🪖',torse:'🥋',bottes:'🥾',arme:'⚔️',bijou1:'💍',bijou2:'💎'})[slot]||'📦';}
function iconeAdventure(slot){return ({head:'🪖',chest:'👕',legs:'👖',boots:'🥾',weapon:'🗡️',weapon2:'⚔️',accessory:'💍'})[String(slot||'')]||'📦';}
function rarete(item){if(!item||(item.kind!=='equipment'&&item.kind!=='special'))return '';const p=Number(item.basePower),t=Number(item.baseToughness);const v=Math.max(Number.isFinite(p)?p:0,Number.isFinite(t)?t:0);if(!(v>0))return '';const log=Math.log10(v);let i=0;while(i<rarity.length&&log>=rarity[i])i++;return 'idle-rarity-'+i;}
window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__={nomSlot,iconeSlot,iconeAdventure,rarete};
})();
