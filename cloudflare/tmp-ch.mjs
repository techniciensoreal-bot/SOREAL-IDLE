import fs from 'fs';
function edit(f,pairs){let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');if(crlf)s=s.replace(/\r\n/g,'\n');
 for(const [a,b] of pairs){if(!s.includes(a))throw new Error(f+': '+a.slice(0,60));s=s.replace(a,()=>b);}
 if(crlf)s=s.replace(/\n/g,'\r\n');fs.writeFileSync(f,s);}
edit('public/modules/tutorial-tts-v202.js',[
[`  function composerChronique_(nom,histoire){
    var out=String(nom||'Boss').replace(/\s+/g,' ').trim()+' '+PAUSE_OPEN+'1100'+PAUSE_CLOSE+' ';`,`  /* sansNom : lecture enchaînée de plusieurs chroniques (Norman, 2026-10-22 : « qu'il ne prononce pas le nom de chaque boss, que ça s'enchaîne comme une histoire ») : le récit seul, sans le nom ni la pause qui le suit. Les blocs du récit sont les mêmes, donc les mêmes voix pré-générées. */
  function composerChronique_(nom,histoire,sansNom){
    var out=sansNom?'':String(nom||'Boss').replace(/\s+/g,' ').trim()+' '+PAUSE_OPEN+'1100'+PAUSE_CLOSE+' ';`]]);
edit('public/modules/lecteur-chroniques-v1.js',[
[`t.composerChronique(String(e.nomParle||'').trim()||e.nom,String(e.histoireParlee||'').trim()||e.description):e.nom+'. '+e.description;`,`t.composerChronique(String(e.nomParle||'').trim()||e.nom,String(e.histoireParlee||'').trim()||e.description,true):e.description;`]]);
edit('public/modules/ui-combat-2-v1.js',[
[`          :function(nom,histoire){return nom+' '+histoire;};`,`          :function(nom,histoire){return histoire;};`],
[`            return composerChronique(String(b.nomParle||'').trim()||String(b.nom||'Boss'),String(b.histoireParlee||'').trim()||String(b.histoire||''));
          }).join(M(2000))`,`            /* Sans le nom du boss : les chroniques s'enchaînent comme une histoire (Norman, 2026-10-22). */
            return composerChronique(String(b.nomParle||'').trim()||String(b.nom||'Boss'),String(b.histoireParlee||'').trim()||String(b.histoire||''),true);
          }).join(M(1200))`]]);
