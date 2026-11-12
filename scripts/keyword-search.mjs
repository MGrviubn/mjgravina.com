export const NO_MATCH='I couldn’t find that information on this website.';
const STOP=new Set('a an and are as at be been by can could did do does for from had has have he her him his how i in information is it matthew me my of on or please references search show so that the their them there these they this to used use using was were what when where which who with would you'.split(' '));
const GROUPS=[['network','networks','networking'],['print','prints','printing','printer','printers'],['miniature','miniatures','models'],['configure','configured','configuration','configuring'],['mission','missionary'],['serve','served','serving'],['css','styling','styles'],['security','cybersecurity'],['solder','soldering'],['esp32','microcontroller']];
export function normalize(text) {return String(text).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
export function terms(query) {
  return [...new Set((normalize(query).match(/[a-z0-9]+/g)||[]).filter(t=>!STOP.has(t)))];
}
export function searchKeywords(manifest,query) {
  const wanted=terms(query);if(!wanted.length) return [];
  const results=[];
  for(const row of manifest.passages) {
    const text=normalize(row.text+' '+row.section+' '+row.title);
    const words=new Set(text.match(/[a-z0-9]+/g)||[]);
    let score=0;
    const match=wanted.every(term=>{
      const variants=GROUPS.find(g=>g.includes(term))||[term];
      const exact=words.has(term);const related=variants.some(v=>words.has(v));
      if(exact) score+=2;else if(related) score+=1;
      return exact||related;
    });
    if(match) results.push({...row,keywordScore:score});
  }
  return results.sort((a,b)=>b.keywordScore-a.keywordScore).slice(0,12);
}
