// A schematic illustration supports the written situation; the question contains all decisive facts.
export function hazardScene(q,escape){
 const e=escape||String,s=q.scene||{},place=s.place||'langs de weg';
 const icons={bal:'●',kind:'♟',voetganger:'♟',fietser:'♙',fiets:'♙',auto:'▰',bus:'▰',dier:'♞',werk:'⚒',geen:'✓'};
 const object=String(s.object||'risico').toLowerCase();
 const key=Object.keys(icons).find(k=>object.includes(k))||'';
 const glyph=icons[key]||'!';
 const lane=place==='voor je'?'near':place==='gescheiden'?'separate':place==='vrije weg'?'clear':'side';
 return `<figure class="hazard-scene"><div class="hazard-scene-head"><span>${e(s.road||'Verkeerssituatie')}</span><strong>KIJK · DENK · DOE</strong></div><div class="hazard-road ${lane}" aria-hidden="true"><div class="hazard-lane"><span class="hazard-markers"></span><span class="hazard-car">▲<small>MURSAL</small></span></div>${lane==='separate'?'<span class="hazard-barrier"></span>':''}${lane!=='clear'?`<span class="hazard-object">${glyph}</span>`:'<span class="hazard-open">Vrij zicht</span>'}</div><figcaption>Schematische tekening. Lees de volledige situatie hierboven; afstand, zicht en beweging bepalen je antwoord.</figcaption></figure>`;
}
