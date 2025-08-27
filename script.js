// Leaflet с Map.png 3507x2480
const map = L.map('map', { attributionControl: false, 
  minZoom: -2,
  maxZoom: 4,
  crs: L.CRS.Simple,
  zoomControl: false,
  worldCopyJump: false
});
const W = 3507, H = 2480;
const bounds = [[0,0],[H,W]];
L.imageOverlay('Map.png', bounds).addTo(map);
map.fitBounds(bounds);

// Ограничиваем панораму по границам изображения (жесткие границы)
map.setMaxBounds(bounds);
map.options.maxBoundsViscosity = 1.0;

L.control.zoom({position:'topleft'}).addTo(map);
// === Animations helpers ===
function bounceMarker(marker){const el=marker.getElement(); if(!el) return; el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce');}


// Координаты POI
const places = [
  {id:1, name:'Главный вход', sub:'', meta:'', coords:[2175, 1049]},
  {id:2, name:'Касса', sub:'8:00 - 13:30', meta:'', coords:[1723, 693]},
  {id:3, name:'Сцена', sub:'Главная сцена', meta:'', coords:[1103, 1401]},
  {id:4, name:'Фудкорт', sub:'Вкусно и не очень™', meta:'', coords:[1567, 2678]},
  {id:5, name:'Пресс-центр', sub:'Требуется аккредитация', meta:'', coords:[1600, 1800]},
  {id:6, name:'Стойка информации', sub:'', meta:'', coords:[755, 1385]},
  {id:7, name:'Туалеты / WC', sub:'', meta:'', coords:[959, 2586]},
  {id:8, name:'Дополнительный вход', sub:'Откроется с 11:05', meta:'', coords:[2211, 3318]},
  {id:9, name:'Аттракционы', sub:'', meta:'', coords:[983, 3026]},
  {id:10, name:'Коворкинг', sub:'Розетки 220v, столы/стулья для работы', meta:'', coords:[779, 361]},
  {id:11, name:'Сцена', sub:'Выступление спикеров', meta:'', coords:[1235, 3242]},
  {id:12, name:'Мастер-классы', sub:'10:00 - 12:30', meta:'', coords:[1075, 2858]}
];

// Маркеры с цифрами
const markers = new Map();
function makeMarker(p, active=false){
  return L.marker(p.coords, {
    icon: L.divIcon({
      className: 'poi-marker'+(active?' active':''),
      html: `<span>${p.id}</span>`,
      iconSize: [28,28],
      iconAnchor: [14,28],
      popupAnchor: [0,-30]
    })
  }).bindPopup(`<b>${p.id}. ${p.name}</b>${p.sub?'<br>'+p.sub:''}${p.meta?'<br>'+p.meta:''}`);
}
places.forEach(p => {
  const m = makeMarker(p);
  m.addTo(map);
  markers.set(p.id, m);
  m.on('click', () => select(p.id, true));
});

// Рендер списка
const grid = document.getElementById('poi-grid');
function renderList(){
  grid.innerHTML = '';
  for(const p of places){
    const li = document.createElement('li');
    li.className = 'poi';
    li.dataset.id = p.id;
    li.innerHTML = `
      <div class="num">${p.id}</div>
      <div class="name">${p.name}</div>
      ${p.sub?`<div class="sub">${p.sub}</div>`:''}
      ${p.meta?`<div class="meta">${p.meta}</div>`:''}
    `;
    grid.appendChild(li);
  }
}
renderList();

// Выбор и навигация
let activeId = null;
function setActiveMarker(id, on){
  const m = markers.get(id); if(!m) return;
  const el = m.getElement(); if(!el) return;
  el.classList.toggle('active', !!on);
}
function select(id, skipListScroll = false){
  if(activeId && activeId!==id){
    const prev=document.querySelector(`.poi[data-id="${activeId}"]`);
    if(prev) prev.classList.remove('active');
    setActiveMarker(activeId,false);
  }
  activeId=id;
  const li=document.querySelector(`.poi[data-id="${id}"]`);
  if(li){ li.classList.add('active'); if(!skipListScroll) li.scrollIntoView({block:'nearest',behavior:'smooth'}); }
  setActiveMarker(id,true);
  const p=places.find(x=>x.id===id);
  if(p){
    // ensure map knows its size (important after scrolling into view on mobile)
    try{ map.invalidateSize(); }catch(e){}
    // use the marker's actual latlng to avoid coord-order issues and ensure exact centering
    const m = markers.get(id);
    if(m){
      const latlng = m.getLatLng();
      map.setView(latlng, map.getZoom(), {animate:true});
      m.openPopup();
      bounceMarker(m);
    } else {
      // fallback: try to center using raw coords
      map.setView(p.coords, map.getZoom(), {animate:true});
    }
  }
  // show 'to list' button on mobile when a POI is selected
  if(window.innerWidth <= 768){ showToListBtn(true); }
}
// Legend click: on mobile, scroll to map first, then activate marker (gives cleaner UX)
grid.addEventListener('click', e => {
  const li = e.target.closest('.poi'); if(!li) return;
  const id = Number(li.dataset.id);
  if(window.innerWidth <= 768){
    const frame = document.getElementById('map-frame');
    if(frame){
      // scroll map into view first, then center on the POI
      frame.scrollIntoView({behavior:'smooth', block:'start'});
  // wait for the scroll animation to mostly finish before centering
  setTimeout(() => select(id, true), 350);
      return;
    }
  }
  select(id);
});

// Logger координат по клику
map.on('click', (e) => {
  console.log('coords:', [Math.round(e.latlng.lat), Math.round(e.latlng.lng)]);
});
// 'To list' button behavior
const toListBtn=document.getElementById('to-list-btn');
function showToListBtn(show){
  if(!toListBtn) return;
  if(show) toListBtn.style.display = 'inline-flex';
  else toListBtn.style.display = '';
}

if(toListBtn){
  toListBtn.addEventListener('click',()=>{
    const legend=document.getElementById('legend-section');
    if(legend){ window.scrollTo({top: legend.getBoundingClientRect().top + window.scrollY - 12, behavior:'smooth'}); }
    // hide button after returning to list on mobile
    if(window.innerWidth <= 768){
      setTimeout(()=> showToListBtn(false), 600);
    }
  });
}

