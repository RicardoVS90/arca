// Personaje provisorio dibujado en SVG con sombreado suave y animaciones.
// Cuando tengamos las ilustraciones finales (Gemini), se reemplaza el dibujo
// pero se mantienen las mismas funciones: saludar, festejar, animar, decir.
(function () {
  var UNIFORMES = {
    // Aventureros (uniforme de gala): camisa/blusa blanca, pañoleta bordó con anillo,
    // pantalón o falda recta azul marino, cinturón con hebilla plateada, zapatos negros
    aventureros: {
      camisa: '#F7F8FA', abajo: '#1F2E5A', panuelo: '#8E1F2B', anillo: '#2F7FD0', parche: '#2F7FD0',
      cinturon: '#1F2E5A', hebilla: '#D9DEE5', zapatos: '#2E2E2E', medias: 'largas', joven: false
    },
    // Conquistadores (jóvenes): camisa/blusa blanca, pañoleta amarilla con triángulo rojo invertido, pantalón o falda
    // recta verde oscuro, cinturón y zapatos marrones
    conquistadores: {
      camisa: '#FBF9F3', abajo: '#1F5B3C', panuelo: '#F2C230', anillo: '#D62828', anilloForma: 'triangulo', parche: null,
      cinturon: '#6B4423', hebilla: '#D4AF37', zapatos: '#5A3A22', medias: null, joven: true
    },
    ninguno: {
      camisa: '#FF9F43', abajo: '#3B6FB6', panuelo: null, anillo: null, parche: null,
      cinturon: null, hebilla: null, zapatos: '#2E2E2E', medias: 'cortas', joven: false
    }
  };
  var contador = 0;

  function tono(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)))); }
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  // Proporciones: niño (cabeza grande) o joven (cabeza más chica, cuerpo más alto)
  var CUERPOS = {
    nino:  { tX: 65, tY: 128, tW: 70, tH: 78, aIzq: 50, aDer: 131, aW: 19, aY: 134, aH: 56, piernaY: 190, piernaW: 19, cint: 182, cabeza: 1, borde: 0 },
    joven: { tX: 68, tY: 122, tW: 64, tH: 88, aIzq: 55, aDer: 131, aW: 14, aY: 126, aH: 70, piernaY: 204, piernaW: 15, cint: 192, cabeza: 0.78, borde: 6 }
  };

  function dibujar(perfil) {
    var u = 'p' + (++contador);
    var c = UNIFORMES[perfil.club] || UNIFORMES.ninguno;
    var k = c.joven ? CUERPOS.joven : CUERPOS.nino;
    var nina = perfil.genero === 'nina';
    var pelo = c.joven && nina ? '#22201F' : '#4A2C17';
    var grad = function (id, color) {
      return '<linearGradient id="' + id + u + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + tono(color, 0.28) + '"/>' +
        '<stop offset="1" stop-color="' + tono(color, -0.22) + '"/></linearGradient>';
    };
    var piel = 'url(#piel' + u + ')', cam = 'url(#cam' + u + ')', aba = 'url(#aba' + u + ')';
    var cx = 100, pW = k.piernaW, pIzq = cx - 3 - pW, pDer = cx + 3;
    var s = '';
    s += '<svg class="pj-svg" viewBox="0 0 200 272" aria-hidden="true"><defs>';
    s += '<radialGradient id="piel' + u + '" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFE3C2"/><stop offset="1" stop-color="#DFA266"/></radialGradient>';
    s += grad('cam', c.camisa) + grad('aba', c.abajo) + grad('pel', pelo);
    if (c.panuelo) s += grad('pan', c.panuelo);
    s += '</defs>';
    s += '<ellipse class="pj-sombra" cx="100" cy="263" rx="52" ry="7" fill="rgba(0,0,0,.18)"/>';
    s += '<g class="pj-todo">';

    // Piernas
    s += '<g class="pj-piernas">';
    if (nina) {
      var yP = k.piernaY + 8;
      s += '<rect x="' + (pIzq + 1) + '" y="' + yP + '" width="' + (pW - 2) + '" height="' + (250 - yP) + '" rx="8" fill="' + piel + '"/>';
      s += '<rect x="' + (pDer + 1) + '" y="' + yP + '" width="' + (pW - 2) + '" height="' + (250 - yP) + '" rx="8" fill="' + piel + '"/>';
      if (c.medias) {
        var yM = c.medias === 'largas' ? 216 : 234;
        s += '<rect x="' + (pIzq + 1) + '" y="' + yM + '" width="' + (pW - 2) + '" height="' + (248 - yM) + '" rx="3" fill="#fff" stroke="#E3E7EC"/>';
        s += '<rect x="' + (pDer + 1) + '" y="' + yM + '" width="' + (pW - 2) + '" height="' + (248 - yM) + '" rx="3" fill="#fff" stroke="#E3E7EC"/>';
      }
    } else {
      s += '<rect x="' + pIzq + '" y="' + k.piernaY + '" width="' + pW + '" height="' + (250 - k.piernaY) + '" rx="9" fill="' + aba + '"/>';
      s += '<rect x="' + pDer + '" y="' + k.piernaY + '" width="' + pW + '" height="' + (250 - k.piernaY) + '" rx="9" fill="' + aba + '"/>';
    }
    s += '<ellipse cx="' + (pIzq + pW / 2) + '" cy="252" rx="15" ry="8" fill="' + c.zapatos + '"/>';
    s += '<ellipse cx="' + (pDer + pW / 2) + '" cy="252" rx="15" ry="8" fill="' + c.zapatos + '"/>';
    s += '</g>';

    // Brazo izquierdo
    var aIc = k.aIzq + k.aW / 2, aDc = k.aDer + k.aW / 2, manoY = k.aY + k.aH + 2;
    // Brazos con codo: brazo (gira en el hombro) y antebrazo (gira en el codo, solo hacia adentro)
    var codoY = k.aY + k.aH / 2, medio = k.aH / 2 + k.aW / 2;
    s += '<g class="pj-brazo-izq" style="transform-origin:' + aIc + 'px ' + (k.aY + 6) + 'px">';
    s += '<rect x="' + k.aIzq + '" y="' + k.aY + '" width="' + k.aW + '" height="' + medio + '" rx="' + (k.aW / 2) + '" fill="' + cam + '"/>';
    if (c.parche) s += '<circle cx="' + aIc + '" cy="' + (k.aY + 16) + '" r="6.5" fill="' + c.parche + '" stroke="#fff" stroke-width="1.5"/>';
    s += '<g class="pj-antebrazo-izq" style="transform-origin:' + aIc + 'px ' + codoY + 'px">';
    s += '<rect x="' + k.aIzq + '" y="' + (codoY - k.aW / 2) + '" width="' + k.aW + '" height="' + (k.aY + k.aH - codoY + k.aW / 2) + '" rx="' + (k.aW / 2) + '" fill="' + cam + '"/>';
    s += '<g class="pj-herr-izq" transform="translate(' + aIc + ' ' + manoY + ')"></g>';
    s += '<circle cx="' + aIc + '" cy="' + manoY + '" r="10.5" fill="' + piel + '"/>';
    s += '</g></g>';

    // Torso y parte de abajo
    if (k.borde) {
      // Torso de joven: hombros redondeados y cintura más angosta
      var L = k.tX, R = k.tX + k.tW, T = k.tY, B = k.tY + k.tH, d = k.borde;
      s += '<path d="M' + (L + 14) + ' ' + T + ' H' + (R - 14) + ' Q' + R + ' ' + T + ' ' + R + ' ' + (T + 14) +
        ' L' + (R - d) + ' ' + B + ' H' + (L + d) + ' L' + L + ' ' + (T + 14) + ' Q' + L + ' ' + T + ' ' + (L + 14) + ' ' + T + ' Z" fill="' + cam + '"/>';
    } else {
      s += '<rect x="' + k.tX + '" y="' + k.tY + '" width="' + k.tW + '" height="' + k.tH + '" rx="24" fill="' + cam + '"/>';
    }
    var fIzq = k.tX + 2 + k.borde, fDer = k.tX + k.tW - 2 - k.borde, fondo = Math.min(k.cint + 46, 236);
    if (nina) s += '<path d="M' + fIzq + ' ' + k.cint + ' L' + fDer + ' ' + k.cint + ' L' + (fDer + 4) + ' ' + fondo + ' Q100 ' + (fondo + 6) + ' ' + (fIzq - 4) + ' ' + fondo + ' Z" fill="' + aba + '"/>';
    else s += '<rect x="' + (k.tX + 3 + k.borde) + '" y="' + k.cint + '" width="' + (k.tW - 6 - 2 * k.borde) + '" height="' + (k.tY + k.tH - k.cint) + '" rx="6" fill="' + aba + '"/>';
    if (c.cinturon) {
      s += '<rect x="' + (k.tX + 2 + k.borde * 0.8) + '" y="' + (k.cint - 2) + '" width="' + (k.tW - 4 - k.borde * 1.6) + '" height="9" rx="3" fill="' + c.cinturon + '"/>';
      s += '<rect x="93" y="' + (k.cint - 4) + '" width="14" height="13" rx="2" fill="' + c.hebilla + '" stroke="' + tono(c.hebilla, -0.3) + '" stroke-width="1.2"/>';
    }
    if (nina && !c.joven) {
      s += '<path d="M100 ' + (k.cint + 8) + ' L100 ' + fondo + '" stroke="' + tono(c.abajo, -0.35) + '" stroke-width="3" opacity=".7"/>';
    }

    if (perfil.club !== 'ninguno') {
      // Bolsillos con pliegue y solapa, botones y presillas en los hombros
      var borde = tono(c.camisa, -0.18), bY = k.tY + 18, bIz = k.tX + 9, bDe = k.tX + k.tW - 27;
      s += '<rect x="' + bIz + '" y="' + bY + '" width="18" height="20" rx="3" fill="none" stroke="' + borde + '" stroke-width="1.6"/>';
      s += '<rect x="' + bDe + '" y="' + bY + '" width="18" height="20" rx="3" fill="none" stroke="' + borde + '" stroke-width="1.6"/>';
      s += '<path d="M' + bIz + ' ' + (bY + 6) + ' h18 M' + bDe + ' ' + (bY + 6) + ' h18 M' + (bIz + 9) + ' ' + (bY + 6) + ' v14 M' + (bDe + 9) + ' ' + (bY + 6) + ' v14" stroke="' + borde + '" stroke-width="1.4"/>';
      s += '<circle cx="100" cy="' + (k.tY + 42) + '" r="1.8" fill="' + borde + '"/><circle cx="100" cy="' + (k.tY + 54) + '" r="1.8" fill="' + borde + '"/>';
      s += '<rect x="' + (k.tX + 1) + '" y="' + (k.tY + 3) + '" width="18" height="5" rx="2.5" fill="' + borde + '"/>';
      s += '<rect x="' + (k.tX + k.tW - 19) + '" y="' + (k.tY + 3) + '" width="18" height="5" rx="2.5" fill="' + borde + '"/>';
    }
    if (c.panuelo) {
      var pY = k.tY + 1, pan = 'url(#pan' + u + ')';
      s += '<path d="M80 ' + pY + ' L120 ' + pY + ' L100 ' + (pY + 33) + ' Z" fill="' + pan + '"/>';
      s += '<path d="M95 ' + (pY + 12) + ' L89 ' + (pY + 46) + ' L99 ' + (pY + 40) + ' Z M105 ' + (pY + 12) + ' L111 ' + (pY + 46) + ' L101 ' + (pY + 40) + ' Z" fill="' + pan + '"/>';
      if (c.anillo && c.anilloForma === 'triangulo') {
        var tY = pY + 5;
        s += '<path d="M90 ' + tY + ' L110 ' + tY + ' L100 ' + (tY + 17) + ' Z" fill="' + c.anillo + '" stroke="' + tono(c.anillo, -0.3) + '" stroke-width="1.5" stroke-linejoin="round"/>';
      } else if (c.anillo) s += '<circle cx="100" cy="' + (pY + 12) + '" r="8" fill="' + c.anillo + '" stroke="#C9D3DE" stroke-width="2"/>';
      else s += '<circle cx="100" cy="' + (pY + 10) + '" r="6" fill="' + tono(c.panuelo, -0.28) + '"/>';
    }

    // Brazo derecho (el que saluda)
    s += '<g class="pj-brazo-der" style="transform-origin:' + aDc + 'px ' + (k.aY + 6) + 'px">';
    s += '<rect x="' + k.aDer + '" y="' + k.aY + '" width="' + k.aW + '" height="' + medio + '" rx="' + (k.aW / 2) + '" fill="' + cam + '"/>';
    s += '<g class="pj-antebrazo-der" style="transform-origin:' + aDc + 'px ' + codoY + 'px">';
    s += '<rect x="' + k.aDer + '" y="' + (codoY - k.aW / 2) + '" width="' + k.aW + '" height="' + (k.aY + k.aH - codoY + k.aW / 2) + '" rx="' + (k.aW / 2) + '" fill="' + cam + '"/>';
    s += '<g class="pj-herr-der" transform="translate(' + aDc + ' ' + manoY + ')"></g>';
    s += '<circle cx="' + aDc + '" cy="' + manoY + '" r="10.5" fill="' + piel + '"/></g></g>';

    // Cabeza (más chica en los jóvenes)
    var cuello = k.tY + 2;
    s += '<g class="pj-cabeza" style="transform-origin:100px ' + cuello + 'px">';
    s += '<g transform="translate(100 ' + cuello + ') scale(' + k.cabeza + ') translate(-100 -128)">';
    if (nina && c.joven) {
      s += '<circle cx="100" cy="34" r="17" fill="url(#pel' + u + ')"/>';
    } else if (nina) {
      s += '<ellipse cx="56" cy="104" rx="14" ry="30" fill="url(#pel' + u + ')"/>';
      s += '<ellipse cx="144" cy="104" rx="14" ry="30" fill="url(#pel' + u + ')"/>';
    }
    s += '<circle cx="54" cy="88" r="9" fill="' + piel + '"/><circle cx="146" cy="88" r="9" fill="' + piel + '"/>';
    s += '<rect x="88" y="118" width="24" height="14" fill="' + piel + '"/>';
    s += '<circle cx="100" cy="84" r="48" fill="' + piel + '"/>';
    if (c.joven && !nina) {
      s += '<path d="M52 80 Q50 32 102 30 Q150 34 148 80 Q140 52 120 50 Q104 44 86 52 Q62 54 52 80 Z" fill="url(#pel' + u + ')"/>';
    } else {
      s += '<path d="M52 82 Q52 34 100 32 Q148 34 148 82 Q136 58 114 60 Q100 48 82 60 Q64 60 52 82 Z" fill="url(#pel' + u + ')"/>';
    }
    if (nina && !c.joven) s += '<circle cx="138" cy="48" r="9" fill="' + (c.panuelo || '#E85D8E') + '"/>';
    s += '<g class="pj-ojos">';
    var oy = c.joven ? 6.5 : 8.5;
    s += '<ellipse cx="83" cy="88" rx="6" ry="' + oy + '" fill="#2B1D14"/><circle cx="85" cy="85" r="2.2" fill="#fff"/>';
    s += '<ellipse cx="117" cy="88" rx="6" ry="' + oy + '" fill="#2B1D14"/><circle cx="119" cy="85" r="2.2" fill="#fff"/>';
    s += '</g>';
    if (c.joven) s += '<path d="M74 74 Q83 70 92 74 M108 74 Q117 70 126 74" stroke="' + pelo + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += '<ellipse cx="72" cy="104" rx="8" ry="5" fill="#FF8A80" opacity="' + (c.joven ? '.3' : '.45') + '"/><ellipse cx="128" cy="104" rx="8" ry="5" fill="#FF8A80" opacity="' + (c.joven ? '.3' : '.45') + '"/>';
    s += '<path class="pj-boca" d="M87 106 Q100 120 113 106" fill="none" stroke="#6B3A22" stroke-width="4" stroke-linecap="round"/>';
    s += '<g class="pj-boca-risa"><path d="M85 103 Q100 128 115 103 Z" fill="#7A2E1C" stroke="#6B3A22" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="117" rx="7" ry="4" fill="#FF8A80"/></g>';
    s += '</g></g></g></svg>';
    return s;
  }

  function animar(el, clase, ms) {
    if (!el) return;
    el.classList.remove('saludando', 'festejando', 'animando', 'mirando', 'saltito', 'riendo', 'acrobacia');
    void el.offsetWidth;
    el.classList.add(clase);
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove(clase); }, ms || 1600);
  }

  window.Personaje = {
    dibujar: dibujar,
    animar: animar,
    // En el menú: el personaje está haciendo una actividad de su club (solo Moderna), cada tanto la deja
    // para hacer un gesto, y al tocarlo reacciona: cambia de actividad o hace un gesto al azar.
    vivo: function (cont, raiz, pantalla, perfil) {
      if (!cont) return;
      var conAct = !!(window.Actividades && !(window.Apariencia && Apariencia.clasica()) && perfil);
      var acts = conAct ? Actividades.lista(perfil.club) : [];
      var GESTOS = ['saludando', 'mirando', 'saltito', 'riendo', 'animando'], ant = '';
      var DURA = { saludando: 1600, mirando: 2100, saltito: 700, animando: 1100, festejando: 1600, riendo: 1500, acrobacia: 1200 };
      function vigente() { return document.body.contains(cont) && raiz.dataset.actual === pantalla; }
      function gesto(g) {
        if (conAct) Actividades.pausar(cont, true);
        // La voltereta la hace solo: sin las herramientas ni las cosas de la actividad
        if (g === 'acrobacia') cont.classList.add('sin-trabajo');
        var demora = g === 'acrobacia' ? 220 : 0;
        clearTimeout(cont._gesto);
        cont._gesto = setTimeout(function () { animar(cont, g, DURA[g]); }, demora);
        clearTimeout(cont._retomar);
        cont._retomar = setTimeout(function () {
          cont.classList.remove('sin-trabajo');
          if (conAct) Actividades.pausar(cont, false);
        }, DURA[g] + demora + 60);
      }
      // Cada actividad se repite 2 veces y pasa a otra al azar; a veces queda sin objetos (solo gestos)
      function otraActividad() {
        if (!acts.length) return;
        var opciones = acts.concat(['libre']), a;
        do { a = opciones[Math.floor(Math.random() * opciones.length)]; } while (a === (cont.dataset.act || 'libre'));
        Actividades.poner(cont, a === 'libre' ? null : a);
        clearTimeout(cont._rotar);
        cont._rotar = setTimeout(function () { if (vigente()) otraActividad(); }, a === 'libre' ? 9000 : Actividades.duracion(a));
      }
      function siguiente() {
        clearTimeout(cont._vivo);
        cont._vivo = setTimeout(function () {
          if (!vigente()) return;
          if (!document.hidden) {
            var g; do { g = GESTOS[Math.floor(Math.random() * GESTOS.length)]; } while (g === ant);
            ant = g; gesto(g);
          }
          siguiente();
        }, (conAct ? 7000 : 4500) + Math.random() * 4000);
      }
      cont.addEventListener('click', function () {
        if (cont._ocupado) return;
        cont._ocupado = true; setTimeout(function () { cont._ocupado = false; }, 1500);
        try { Sonido.toque(); } catch (e) {}
        var b = cont.querySelector('.burbuja');
        var frase = function () { Personaje.decir(cont, Azar.frase('saludo'), null); };
        // Al tocarlo: la mitad de las veces cambia de actividad y la otra mitad hace un gesto (con acrobacias)
        if (conAct && Math.random() < 0.5) { otraActividad(); if (b) frase(); }
        else {
          var opciones = ['festejando', 'saludando', 'riendo', 'acrobacia', 'acrobacia', 'saltito'];
          var g = opciones[Math.floor(Math.random() * opciones.length)];
          if (b) { cont._desde = 0; Personaje._mostrarSolo(cont, Azar.frase('saludo')); }
          gesto(g);
        }
        siguiente();
      });
      // La actividad arranca después del saludo de bienvenida
      if (conAct) setTimeout(function () { if (vigente()) otraActividad(); }, 1900);
      siguiente();
    },
    // Solo el globito (sin gesto)
    _mostrarSolo: function (cont, texto) {
      cont._desde = Date.now();
      var b = cont.querySelector('.burbuja'); if (!b) return;
      b.textContent = texto; b.classList.remove('visible'); void b.offsetWidth; b.classList.add('visible');
      clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('visible'); }, this.VISIBLE_MS);
    },
    decir: function (cont, texto, gesto) {
      if (!cont) return 0;
      var self = this, ahora = Date.now();
      var libre = (cont._desde || 0) + this.MIN_MS;
      if (ahora < libre) {
        cont._pendiente = { texto: texto, gesto: gesto };
        clearTimeout(cont._cola);
        cont._cola = setTimeout(function () {
          var p = cont._pendiente; cont._pendiente = null;
          if (p) self._mostrar(cont, p.texto, p.gesto);
        }, libre - ahora);
        return libre - ahora;
      }
      this._mostrar(cont, texto, gesto);
      return 0;
    },
    _mostrar: function (cont, texto, gesto) {
      cont._desde = Date.now();
      var b = cont.querySelector('.burbuja');
      if (b) {
        b.textContent = texto;
        b.classList.remove('visible');
        void b.offsetWidth;
        b.classList.add('visible');
        clearTimeout(b._t);
        b._t = setTimeout(function () { b.classList.remove('visible'); }, this.VISIBLE_MS);
      }
      if (gesto !== null) animar(cont, gesto || 'animando');
      if (cont._alMostrar) cont._alMostrar();
    },
    // Aparición breve desde abajo durante los juegos
    aparecer: function (perfil, texto, gesto) {
      var capa = document.getElementById('ayudante');
      if (!capa) return;
      if (!capa._perfil || capa._perfil !== perfil.club + perfil.genero) {
        capa.querySelector('.pj-lugar').innerHTML = dibujar(perfil);
        capa._perfil = perfil.club + perfil.genero;
      }
      var vis = this.VISIBLE_MS;
      // Cada vez que se muestra una frase, el niño se queda a la vista hasta que termina
      capa._alMostrar = function () {
        capa.classList.add('visible');
        clearTimeout(capa._t);
        capa._t = setTimeout(function () { capa.classList.remove('visible'); }, vis);
      };
      this.decir(capa, texto, gesto || 'saludando');
    },
    // Milisegundos que faltan para que la frase que se está mostrando cumpla su tiempo
    restante: function () {
      var capa = document.getElementById('ayudante');
      if (!capa || !capa.classList.contains('visible')) return 0;
      return Math.max(0, (capa._desde || 0) + this.MIN_MS - Date.now());
    },
    // Al cambiar de pantalla se descartan las frases en espera
    callar: function () {
      var capa = document.getElementById('ayudante');
      if (!capa) return;
      clearTimeout(capa._cola); capa._pendiente = null; capa._desde = 0;
      clearTimeout(capa._t); capa.classList.remove('visible');
    }
  };
})();
