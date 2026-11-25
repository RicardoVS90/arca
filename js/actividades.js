// Actividades del personaje en el menú (solo apariencia Moderna).
// El personaje mira a cámara y la actividad está DELANTE de él: trabaja con las dos manos,
// doblando los codos (el codo solo se dobla hacia adentro, como en una persona).
// Conquistadores: arma la carpa, aviva la fogata, amarra un pórtico.
// Aventureros y sin club: pinta en la mesita, recorta papel, abraza a su perrito.
// Capas: "atrás" (detrás del personaje, p. ej. la carpa) y "medio" (delante del cuerpo y detrás de los brazos).
(function () {
  var MADERA = '#A8693A', MADERA_OSC = '#7A4A26', CUERDA = '#D9B77A';
  var NS = 'http://www.w3.org/2000/svg';

  var HERR = {
    mazo: '<g><rect x="-2.5" y="-6" width="5" height="44" rx="2.5" fill="' + MADERA + '"/>' +
      '<rect x="-12" y="36" width="24" height="13" rx="4" fill="' + MADERA_OSC + '"/><rect x="-12" y="36" width="24" height="4" rx="2" fill="#94603A"/></g>',
    abanico: '<g><rect x="-2" y="-2" width="4" height="16" rx="2" fill="' + MADERA + '"/>' +
      '<path d="M0 12 C-18 20 -16 42 0 48 C16 42 18 20 0 12 Z" fill="#5BAF4F" stroke="#3E8A37" stroke-width="2"/>' +
      '<path d="M0 14 V46 M0 24 L-9 32 M0 24 L9 32 M0 34 L-8 41 M0 34 L8 41" stroke="#3E8A37" stroke-width="1.6" fill="none"/></g>',
    // Pantalla paraguaya: abanico redondo de palma trenzada, con el mango envuelto
    pantalla: '<g><rect x="-3" y="-8" width="6" height="30" rx="3" fill="#C9B98A"/>' +
      '<path d="M-3 -2 H3 M-3 4 H3 M-3 10 H3 M-3 16 H3" stroke="#A89A64" stroke-width="1.4"/>' +
      '<circle cx="0" cy="40" r="21" fill="#D8CFA0" stroke="#A89A64" stroke-width="2.2"/>' +
      '<path d="M0 22 V58 M-14 28 L0 40 L14 28 M-19 36 L0 48 L19 36 M-17 46 L0 56 L17 46" stroke="#B3A673" stroke-width="1.6" fill="none"/>' +
      '<path d="M-8 22 Q0 30 8 22" stroke="#A89A64" stroke-width="1.6" fill="none"/></g>',
    ramita: '<g><rect x="-2" y="-4" width="4" height="40" rx="2" fill="' + MADERA_OSC + '" transform="rotate(-6)"/><circle cx="3" cy="38" r="2.5" fill="#FF8A1F"/></g>',
    cuerda: '<path d="M0 2 C8 10 -6 16 3 26" stroke="' + CUERDA + '" stroke-width="4" fill="none" stroke-linecap="round"/>',
    pincel: '<g><rect x="-2" y="-6" width="4" height="30" rx="2" fill="#E9B44C"/><rect x="-2.5" y="22" width="5" height="5" fill="#B8BEC6"/>' +
      '<path d="M-3 27 Q0 40 3 27 Z" class="hr-punta" fill="#E5534B"/></g>',
    paleta: '<g transform="translate(2 6) rotate(-10)"><path d="M-18 0 C-20 -14 6 -18 16 -8 C22 -2 14 4 9 2 C4 0 2 7 -5 9 C-12 11 -17 7 -18 0 Z" fill="#E8C89A" stroke="#B08A55" stroke-width="2"/>' +
      '<circle cx="-11" cy="-5" r="3.2" fill="#E5534B"/><circle cx="-3" cy="-9" r="3.2" fill="#F2C230"/><circle cx="6" cy="-8" r="3.2" fill="#3BB273"/><circle cx="-11" cy="3" r="3.2" fill="#2F86C9"/></g>',
    tijera: '<g transform="translate(0 4)"><g class="hr-hoja1"><path d="M0 0 L-3 26 L1 26 Z" fill="#C7CDD4" stroke="#8A939C" stroke-width="1"/></g>' +
      '<g class="hr-hoja2"><path d="M0 0 L3 26 L-1 26 Z" fill="#C7CDD4" stroke="#8A939C" stroke-width="1"/></g>' +
      '<circle cx="-4.5" cy="-5" r="4.5" fill="none" stroke="#E5534B" stroke-width="3"/><circle cx="4.5" cy="-5" r="4.5" fill="none" stroke="#E5534B" stroke-width="3"/></g>',
    papel: '<g class="hr-papel" transform="translate(4 10)"><rect x="-13" y="-4" width="26" height="24" rx="2" fill="#FFFFFF" stroke="#D5DCE4" stroke-width="1.5"/>' +
      '<path d="M0 0 L3 6 L10 6 L4 10 L7 17 L0 13 L-7 17 L-4 10 L-10 6 L-3 6 Z" fill="none" stroke="#9AA6B2" stroke-width="1.2" stroke-dasharray="2 2"/></g>'
  };

  // Mesita delante del personaje (le tapa las piernas, las manos trabajan arriba)
  function mesa(arriba) {
    return '<rect x="22" y="236" width="8" height="30" rx="3" fill="' + MADERA_OSC + '"/><rect x="170" y="236" width="8" height="30" rx="3" fill="' + MADERA_OSC + '"/>' +
      '<path d="M14 206 H186 L178 238 H22 Z" fill="' + MADERA + '"/><rect x="14" y="200" width="172" height="10" rx="4" fill="#C08452"/>' + arriba;
  }

  var ACT = {
    carpa: {
      clubs: ['conquistadores'],
      // La carpa está delante: el conquistador trabaja desde atrás, acomodando la lona por arriba
      medio: '<g class="ac-carpa"><path d="M10 266 L100 178 L190 266 Z" fill="#F08A3C" stroke="#B85A1E" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M100 178 L82 266 L118 266 Z" fill="#C8662A"/><path d="M100 178 V266" stroke="#8C4416" stroke-width="3"/>' +
        '<path d="M100 178 L10 266 M100 178 L190 266" stroke="#B85A1E" stroke-width="2" opacity=".5"/></g>' +
        '<circle class="ac-punta-carpa" cx="100" cy="176" r="5" fill="' + MADERA_OSC + '"/>' +
        '<rect x="6" y="256" width="9" height="12" rx="2" fill="' + MADERA_OSC + '"/><rect x="185" y="256" width="9" height="12" rx="2" fill="' + MADERA_OSC + '"/>'
    },
    fogata: {
      clubs: ['conquistadores'], der: 'pantalla', izq: 'ramita',
      medio: '<g class="ac-fogata" transform="translate(100 266) scale(.78) translate(-100 -262)">' +
        '<ellipse cx="100" cy="262" rx="52" ry="8" fill="#7E858D"/>' +
        [52, 70, 88, 112, 130, 148].map(function (x, i) { return '<ellipse cx="' + x + '" cy="' + (262 - (i % 2) * 2) + '" rx="10" ry="7" fill="' + (i % 2 ? '#9AA1A9' : '#7E858D') + '"/>'; }).join('') +
        '<rect x="62" y="248" width="76" height="12" rx="6" fill="' + MADERA + '" transform="rotate(-12 100 254)"/>' +
        '<rect x="62" y="248" width="76" height="12" rx="6" fill="' + MADERA_OSC + '" transform="rotate(12 100 254)"/>' +
        '<g class="ac-llama ac-llama1"><path d="M100 254 C72 236 82 208 96 190 C98 208 110 208 106 186 C128 208 130 238 100 254 Z" fill="#FF8A1F"/></g>' +
        '<g class="ac-llama ac-llama2"><path d="M100 254 C86 242 90 224 98 212 C100 224 108 222 106 210 C118 226 116 244 100 254 Z" fill="#FFD23F"/></g>' +
        '<circle class="ac-chispa ac-chispa1" cx="92" cy="204" r="2.2" fill="#FFD23F"/><circle class="ac-chispa ac-chispa2" cx="110" cy="198" r="2.2" fill="#FF8A1F"/></g>'
    },
    portico: {
      clubs: ['conquistadores'], der: 'cuerda',
      medio: '<g class="ac-portico"><rect x="94" y="98" width="12" height="172" rx="4" fill="' + MADERA + '" transform="rotate(32 100 184)"/>' +
        '<rect x="94" y="98" width="12" height="172" rx="4" fill="' + MADERA_OSC + '" transform="rotate(-32 100 184)"/>' +
        '<g class="ac-amarre"><path d="M88 172 L112 196 M112 172 L88 196 M86 180 H114 M86 188 H114" stroke="' + CUERDA + '" stroke-width="4" stroke-linecap="round" fill="none"/></g></g>'
    },
    pintar: {
      clubs: ['aventureros', 'ninguno'], der: 'pincel', izq: 'paleta',
      medio: mesa('<rect x="70" y="194" width="60" height="9" rx="2" fill="#fff" stroke="#D5DCE4" stroke-width="1.5"/>' +
        '<g class="ac-manchas"><ellipse class="ac-m1" cx="82" cy="198" rx="5" ry="2.6" fill="#E5534B"/><ellipse class="ac-m2" cx="94" cy="198" rx="5" ry="2.6" fill="#F2C230"/>' +
        '<ellipse class="ac-m3" cx="106" cy="198" rx="5" ry="2.6" fill="#3BB273"/><ellipse class="ac-m4" cx="118" cy="198" rx="5" ry="2.6" fill="#2F86C9"/></g>' +
        '<rect x="152" y="188" width="14" height="13" rx="3" fill="#7FC8F8" opacity=".85"/><rect x="34" y="190" width="12" height="11" rx="3" fill="#F8B4D9"/>')
    },
    recortar: {
      clubs: ['aventureros', 'ninguno'], der: 'tijera', izq: 'papel',
      medio: mesa('<g class="ac-recortes"><path class="ac-r1" d="M40 200 l5 -10 l5 10 l-10 -6 h10 z" fill="#F2C230"/>' +
        '<path class="ac-r2" d="M152 201 c-5 -6 -11 0 0 6 c11 -6 5 -12 0 -6 z" fill="#E85D8E"/>' +
        '<circle class="ac-r3" cx="62" cy="197" r="5" fill="#2F86C9"/><path class="ac-r4" d="M132 202 l5 -9 l5 9 z" fill="#3BB273"/></g>')
    },
    perrito: {
      clubs: ['aventureros', 'ninguno'],
      medio: '<g transform="translate(-4 -10)"><g class="ac-perro">' +
        '<g class="ac-cola"><path d="M124 176 C140 170 144 156 138 150" stroke="#C98A4B" stroke-width="7" fill="none" stroke-linecap="round"/></g>' +
        '<ellipse cx="104" cy="182" rx="30" ry="20" fill="#D9A066"/>' +
        '<rect x="84" y="190" width="10" height="18" rx="5" fill="#C98A4B"/><rect x="112" y="190" width="10" height="18" rx="5" fill="#C98A4B"/>' +
        '<g class="ac-cabeza-perro"><circle cx="86" cy="158" r="17" fill="#D9A066"/>' +
        '<ellipse cx="72" cy="152" rx="7" ry="13" fill="#8C5A2B" transform="rotate(20 72 152)"/><ellipse cx="100" cy="150" rx="7" ry="13" fill="#8C5A2B" transform="rotate(-20 100 150)"/>' +
        '<circle cx="80" cy="156" r="2.6" fill="#2B1D14"/><circle cx="92" cy="156" r="2.6" fill="#2B1D14"/>' +
        '<ellipse cx="86" cy="165" rx="5" ry="3.6" fill="#2B1D14"/><path class="ac-lengua" d="M86 168 Q86 175 90 175" stroke="#E5534B" stroke-width="3.2" fill="none" stroke-linecap="round"/></g>' +
        '<path class="ac-corazon" d="M118 118 c-6 -8 -16 0 0 10 c16 -10 6 -18 0 -10 z" fill="#E85D8E"/></g></g>'
    }
  };

  function deClub(club) {
    var c = club === 'conquistadores' ? 'conquistadores' : (club === 'aventureros' ? 'aventureros' : 'ninguno');
    return Object.keys(ACT).filter(function (k) { return ACT[k].clubs.indexOf(c) >= 0; });
  }

  function capa(svg, clase, antesDe) {
    var g = svg.querySelector('.' + clase);
    if (!g) {
      g = document.createElementNS(NS, 'g'); g.setAttribute('class', clase);
      antesDe.parentNode.insertBefore(g, antesDe);
    }
    return g;
  }

  // Pone una actividad (o la saca con id = null)
  function poner(cont, id) {
    var svg = cont.querySelector('.pj-svg'); if (!svg) return;
    var todo = svg.querySelector('.pj-todo'), izq = svg.querySelector('.pj-brazo-izq'), der = svg.querySelector('.pj-brazo-der');
    var vieja = cont.dataset.act;
    if (vieja) cont.classList.remove('act-' + vieja);
    // El brazo izquierdo va delante del cuerpo mientras trabaja (normalmente está detrás)
    if (!izq._lugar) izq._lugar = izq.nextSibling;
    var atras = capa(svg, 'ac-atras', todo), medio = capa(svg, 'ac-medio', der);
    var hd = svg.querySelector('.pj-herr-der'), hi = svg.querySelector('.pj-herr-izq');
    if (!id) {
      delete cont.dataset.act;
      atras.innerHTML = ''; medio.innerHTML = ''; hd.innerHTML = ''; hi.innerHTML = '';
      if (izq._lugar) todo.insertBefore(izq, izq._lugar);
      return;
    }
    var a = ACT[id];
    atras.innerHTML = a.atras || '';
    medio.innerHTML = a.medio || '';
    hd.innerHTML = a.der ? HERR[a.der] : '';
    hi.innerHTML = a.izq ? HERR[a.izq] : '';
    der.parentNode.insertBefore(izq, der); // delante del cuerpo y de la mesa
    cont.dataset.act = id;
    cont.classList.add('act-' + id);
  }
  function pausar(cont, si) {
    var id = cont.dataset.act; if (!id) return;
    cont.classList.toggle('act-' + id, !si);
  }

  window.Actividades = { lista: deClub, poner: poner, pausar: pausar, _ACT: ACT };
})();
