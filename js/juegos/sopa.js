// Juego: Sopa de letras bíblica
// Se marca una palabra arrastrando el dedo de la primera a la última letra (o tocando la primera y después la última).
(function () {
  var D = window.DATOS_SOPA;
  // Tamaño de la grilla, cantidad de palabras y direcciones según el club
  var CONFIG = {
    aventureros:    { tam: 8,  n: 5, dirs: [[0, 1], [1, 0]] },
    ninguno:        { tam: 9,  n: 6, dirs: [[0, 1], [1, 0], [1, 1]] },
    conquistadores: { tam: 10, n: 8, dirs: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]] }
  };
  var LETRAS = 'AAAABCDEEEEFGHIIIJLLMNNÑOOOPQRRSSTTUUVYZ';
  var COLORES = ['#F6C445', '#7CC6F2', '#9BE07F', '#F59BC1', '#C9A7F5', '#F7A35C', '#6FD8C9', '#F28B82', '#B7D96B', '#8AB4F8'];
  var MODOS = D.temas.map(function (t) {
    var img = { 'libros-at': 'sopa-at', 'libros-nt': 'sopa-nt', personajes: 'sopa-personajes', discipulos: 'sopa-discipulos', tribus: 'sopa-tribus', lugares: 'sopa-lugares' }[t.id];
    return { id: t.id, nombre: t.corto, icono: t.icono, desc: t.desc, imagen: 'img/modos/' + img + '.webp' };
  });
  var s, ui, app;

  // Letras para la grilla: mayúsculas sin tilde (la Ñ queda)
  function limpiar(p) {
    return p.toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ]/g, '');
  }

  // Arma la grilla ubicando las palabras; devuelve null si no pudo
  function armar(palabras, cfg) {
    var T = cfg.tam, g = [], ubic = [];
    for (var f = 0; f < T; f++) { g.push([]); for (var c = 0; c < T; c++) g[f].push(''); }
    for (var i = 0; i < palabras.length; i++) {
      var w = palabras[i].limpia, puesta = false;
      for (var intento = 0; intento < 200 && !puesta; intento++) {
        var d = cfg.dirs[Math.floor(Math.random() * cfg.dirs.length)];
        var f0 = Math.floor(Math.random() * T), c0 = Math.floor(Math.random() * T);
        var f1 = f0 + d[0] * (w.length - 1), c1 = c0 + d[1] * (w.length - 1);
        if (f1 < 0 || f1 >= T || c1 < 0 || c1 >= T) continue;
        var ok = true;
        for (var k = 0; k < w.length && ok; k++) {
          var x = g[f0 + d[0] * k][c0 + d[1] * k];
          if (x && x !== w[k]) ok = false;
        }
        if (!ok) continue;
        for (k = 0; k < w.length; k++) g[f0 + d[0] * k][c0 + d[1] * k] = w[k];
        ubic.push({ f: f0, c: c0, df: d[0], dc: d[1], largo: w.length });
        puesta = true;
      }
      if (!puesta) return null;
    }
    for (f = 0; f < T; f++) for (c = 0; c < T; c++) if (!g[f][c]) g[f][c] = LETRAS[Math.floor(Math.random() * LETRAS.length)];
    return { g: g, ubic: ubic };
  }

  function nuevaGrilla() {
    var cfg = CONFIG[s.club] || CONFIG.ninguno, tema = D.temas.filter(function (t) { return t.id === s.modo; })[0];
    var lista = (typeof tema.palabras === 'function' ? tema.palabras() : tema.palabras)
      .map(function (p) { return { txt: p, limpia: limpiar(p) }; })
      .filter(function (p) { return p.limpia.length >= 3 && p.limpia.length <= cfg.tam; });
    // Sin palabras repetidas (por ejemplo, José está en dos listas, pero no dentro de la misma)
    var vistas = {};
    lista = lista.filter(function (p) { if (vistas[p.limpia]) return false; vistas[p.limpia] = 1; return true; });
    var res = null, elegidas;
    for (var i = 0; i < 60 && !res; i++) {
      // Las más largas primero, así entran mejor
      elegidas = Azar.mezclar(lista).slice(0, cfg.n).sort(function (a, b) { return b.limpia.length - a.limpia.length; });
      res = armar(elegidas, cfg);
    }
    s.cfg = cfg; s.tema = tema; s.grilla = res.g;
    s.palabras = elegidas.map(function (p, i) { return { txt: p.txt, limpia: p.limpia, ub: res.ubic[i], hallada: false, color: COLORES[i % COLORES.length] }; });
    s.palabras.sort(function (a, b) { return a.txt.localeCompare(b.txt, 'es'); });
  }

  function celda(f, c) { return ui.cont.querySelector('.sopa-celda[data-f="' + f + '"][data-c="' + c + '"]'); }
  function celdasDe(ub) {
    var out = [];
    for (var k = 0; k < ub.largo; k++) out.push(celda(ub.f + ub.df * k, ub.c + ub.dc * k));
    return out;
  }

  function pintar() {
    var T = s.cfg.tam;
    ui.cont.innerHTML = '<p class="consigna">' + s.tema.desc + '</p>' +
      '<div class="sopa-grilla" style="--t:' + T + '">' + s.grilla.map(function (fila, f) {
        return fila.map(function (l, c) { return '<div class="sopa-celda" data-f="' + f + '" data-c="' + c + '">' + l + '</div>'; }).join('');
      }).join('') + '</div>' +
      '<div class="sopa-palabras">' + s.palabras.map(function (p, i) {
        return '<span class="sopa-palabra" data-i="' + i + '">' + p.txt + '</span>';
      }).join('') + '</div>';
    activar(ui.cont.querySelector('.sopa-grilla'));
    contar();
  }

  function contar() {
    var n = s.palabras.filter(function (p) { return p.hallada; }).length;
    ui.progreso(n / s.palabras.length);
  }

  // Selección: arrastrar o tocar inicio y fin. Solo líneas rectas (horizontal, vertical o diagonal).
  function activar(grilla) {
    var ini = null, marcadas = [], arrastrando = false, movio = false;
    function deEvento(ev) {
      var el = document.elementFromPoint(ev.clientX, ev.clientY);
      return el && el.classList && el.classList.contains('sopa-celda') ? el : null;
    }
    function linea(a, b) {
      var f0 = +a.dataset.f, c0 = +a.dataset.c, f1 = +b.dataset.f, c1 = +b.dataset.c;
      var df = Math.sign(f1 - f0), dc = Math.sign(c1 - c0), lf = Math.abs(f1 - f0), lc = Math.abs(c1 - c0);
      if (!(lf === 0 || lc === 0 || lf === lc)) return null;
      var n = Math.max(lf, lc) + 1, out = [];
      for (var k = 0; k < n; k++) out.push(celda(f0 + df * k, c0 + dc * k));
      return out;
    }
    function marcar(lista) {
      marcadas.forEach(function (x) { x.classList.remove('sel'); });
      marcadas = lista || [];
      marcadas.forEach(function (x) { x.classList.add('sel'); });
    }
    function terminar(fin) {
      var l = fin ? linea(ini, fin) : null;
      marcar([]);
      grilla.querySelectorAll('.inicio').forEach(function (x) { x.classList.remove('inicio'); });
      ini = null;
      if (l && l.length >= 2) comprobar(l);
    }
    grilla.addEventListener('pointerdown', function (ev) {
      if (s.bloqueado) return;
      var c = deEvento(ev); if (!c) return;
      ev.preventDefault();
      Voz.cortarPregunta && Voz.cortarPregunta();
      if (ini && ini !== c && !arrastrando) { terminar(c); return; } // segundo toque: marca la línea
      ini = c; arrastrando = true; movio = false;
      grilla.querySelectorAll('.inicio').forEach(function (x) { x.classList.remove('inicio'); });
      c.classList.add('inicio');
      marcar([c]);
      try { grilla.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    grilla.addEventListener('pointermove', function (ev) {
      if (!arrastrando || !ini) return;
      var c = deEvento(ev); if (!c) return;
      if (c !== ini) movio = true;
      var l = linea(ini, c); if (l) marcar(l);
    });
    grilla.addEventListener('pointerup', function (ev) {
      if (!arrastrando) return;
      arrastrando = false;
      var c = deEvento(ev);
      if (movio && c && c !== ini) terminar(c);
      // Si solo tocó una letra, queda marcada como inicio: el próximo toque marca el final
    });
    grilla.addEventListener('pointercancel', function () { arrastrando = false; terminar(null); });
  }

  function comprobar(celdas) {
    var txt = celdas.map(function (x) { return x.textContent; }).join('');
    var rev = txt.split('').reverse().join('');
    var p = s.palabras.filter(function (w) {
      if (w.hallada || (w.limpia !== txt && w.limpia !== rev)) return false;
      // Tiene que ser justo donde está escondida (una misma palabra podría aparecer por casualidad en otro lado)
      var mias = celdasDe(w.ub);
      return mias.length === celdas.length && (mias.every(function (x, i) { return x === celdas[i]; }) ||
        mias.every(function (x, i) { return x === celdas[celdas.length - 1 - i]; }));
    })[0];
    if (!p) {
      // Si coincide con una palabra pero en otro lugar, igual vale (sin castigo)
      var otra = s.palabras.filter(function (w) { return !w.hallada && (w.limpia === txt || w.limpia === rev); })[0];
      if (otra) { encontrada(otra, celdas); return; }
      if (celdas.length >= 3) {
        Sonido.error(); s.errores++; s.seguidos++;
        celdas.forEach(function (x) { x.classList.add('mal'); setTimeout(function () { x.classList.remove('mal'); }, 2000); });
        if (s.seguidos === 3) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
      }
      return;
    }
    encontrada(p, celdas);
  }

  function encontrada(p, celdas) {
    p.hallada = true; s.seguidos = 0;
    Sonido.acierto();
    celdas.forEach(function (x) {
      x.classList.add('hallada');
      x.style.setProperty('--c', p.color);
      x.classList.remove('pista');
    });
    var chip = ui.cont.querySelector('.sopa-palabra[data-i="' + s.palabras.indexOf(p) + '"]');
    if (chip) { chip.classList.add('hallada'); chip.style.setProperty('--c', p.color); }
    Voz.decir(p.txt);
    contar();
    var faltan = s.palabras.filter(function (w) { return !w.hallada; }).length;
    if (faltan && faltan === Math.floor(s.palabras.length / 2)) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
    if (!faltan) {
      s.bloqueado = true; Ayuda.poner(null);
      var est = Estrellas.calcular(s.errores);
      Estrellas.guardar('sopa_' + s.modo, est);
      Personaje.aparecer(app.perfil(), '¡Encontraste todas las palabras!', 'festejando');
      Sonido.victoria();
      Voz.despues(1200, function () {
        app.resultado({ juego: 'sopa', modo: s.modo, estrellas: est, errores: s.errores, aciertos: s.palabras.length,
          titulo: '¡Encontraste las ' + s.palabras.length + ' palabras!' });
      });
    }
  }

  // Ayuda: marca la primera letra de una palabra que falta (cuenta como un error)
  function ayuda() {
    if (s.bloqueado) return;
    var p = s.palabras.filter(function (w) { return !w.hallada; })[0]; if (!p) return;
    var c = celdasDe(p.ub)[0];
    s.errores++;
    c.classList.remove('pista'); void c.offsetWidth; c.classList.add('pista');
    var chip = ui.cont.querySelector('.sopa-palabra[data-i="' + s.palabras.indexOf(p) + '"]');
    if (chip) { chip.classList.remove('pista'); void chip.offsetWidth; chip.classList.add('pista'); }
  }

  window.JuegoSopa = {
    titulo: 'Sopa de letras',
    _sesion: function () { return s; }, // para las pruebas automáticas
    modos: MODOS,
    estrellasModo: function (m) { return Estrellas.leer('sopa_' + m); },
    totalEstrellas: function () { return MODOS.reduce(function (a, m) { return a + Estrellas.leer('sopa_' + m.id); }, 0); },
    maxEstrellas: function () { return MODOS.length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0, bloqueado: false };
      ui = cabeceraJuego(raiz, MODOS.filter(function (m) { return m.id === modo; })[0].nombre);
      nuevaGrilla();
      pintar();
      Ayuda.poner(ayuda);
      Voz.leer(s.tema.desc + '. Arrastrá el dedo sobre las letras.');
    }
  };
})();
