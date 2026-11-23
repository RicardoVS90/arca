// Libros de la Biblia → "¿Qué libros están antes y después?"
// Sale un libro al azar de toda la Biblia; a la izquierda va el que está antes y a la derecha el que está después.
// Génesis no tiene antes y Apocalipsis no tiene después: para eso está la tarjeta "Ninguno" (siempre visible).
(function () {
  var D = window.DATOS_LIBROS;
  var TODOS = D.todos.map(function (l) { return l.nombre; });
  var NINGUNO = 'Ninguno';
  var RONDA = 10;
  var s, ui, app;

  function fallo(el) {
    Sonido.error();
    s.errores++;
    s.seguidos++;
    if (el) marcarError(el);
    if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
  }

  function terminar() {
    var est = Estrellas.calcular(s.errores);
    Estrellas.guardar('libros_vecinos', est);
    Sonido.victoria();
    setTimeout(function () {
      app.resultado({ juego: 'libros', modo: 'vecinos', estrellas: est, errores: s.errores, aciertos: RONDA,
        titulo: '¡Conocés el orden de los libros!' });
    }, 700);
  }

  // Tarjetas para una pregunta: las respuestas, "Ninguno" y trampas (las de Conquistadores, más difíciles)
  function tarjetas(i) {
    var antes = i > 0 ? TODOS[i - 1] : NINGUNO;
    var despues = i < TODOS.length - 1 ? TODOS[i + 1] : NINGUNO;
    var conq = s.club === 'conquistadores';
    var set = {}; set[antes] = 1; set[despues] = 1; set[NINGUNO] = 1;
    var cand = [];
    if (conq) [i - 2, i + 2, i - 3, i + 3].forEach(function (k) { if (k >= 0 && k < TODOS.length) cand.push(TODOS[k]); });
    var lejos = Azar.mezclar(TODOS.filter(function (n, k) { return Math.abs(k - i) > 3; }));
    var faltan = conq ? 4 : 2, out = [];
    Azar.mezclar(cand).concat(lejos).forEach(function (n) {
      if (out.length < faltan && !set[n]) { set[n] = 1; out.push(n); }
    });
    return { antes: antes, despues: despues, cartas: Azar.mezclar(Object.keys(set)) };
  }

  function pregunta() {
    if (s.n >= RONDA) { terminar(); return; }
    var i = s.cola[s.n];
    var libro = TODOS[i], t = tarjetas(i);
    s.actual = t; s.puestos = 0; s.elegida = null;
    ui.progreso(s.n / RONDA);
    ui.cont.innerHTML =
      '<p class="consigna">¿Qué libro está <b>antes</b> y cuál <b>después</b>?</p>' +
      '<div class="vecinos-fila">' +
        '<div class="casillero" data-lado="antes" data-resp="' + t.antes + '"><small>⬅ Antes</small><span class="cas-txt"></span></div>' +
        '<div class="libro-centro" style="background:' + D.todos[i].color + '">' + libro + '</div>' +
        '<div class="casillero" data-lado="despues" data-resp="' + t.despues + '"><small>Después ➡</small><span class="cas-txt"></span></div>' +
      '</div>' +
      '<div class="cartas-vecinos">' + t.cartas.map(function (n) {
        return '<div class="carta-libro arrastrable' + (n === NINGUNO ? ' ninguno' : '') + '" data-libro="' + n + '">' + (n === NINGUNO ? '🚫 Ninguno' : n) + '</div>';
      }).join('') + '</div>';
    Voz.leer('¿Qué libro está antes y después de ' + libro + '?');
    var zona = ui.cont.querySelector('.cartas-vecinos');
    Arrastre.activar(zona, {
      carta: '.carta-libro',
      destino: '.casillero:not(.lleno)',
      alSoltar: function (carta, cas) { return poner(carta, cas); }
    });
    // También se puede tocar una tarjeta y después el casillero
    zona.addEventListener('click', function (ev) {
      var c = ev.target.closest('.carta-libro');
      if (!c || c.classList.contains('usada')) return;
      zona.querySelectorAll('.elegida').forEach(function (x) { x.classList.remove('elegida'); });
      c.classList.add('elegida'); s.elegida = c;
    });
    ui.cont.querySelectorAll('.casillero').forEach(function (cas) {
      cas.addEventListener('click', function () {
        if (!s.elegida || cas.classList.contains('lleno')) return;
        var c = s.elegida; s.elegida = null; c.classList.remove('elegida');
        if (poner(c, cas)) c.classList.add('usada');
        else {
          // Igual que al arrastrar: la tarjeta queda en rojo 2 segundos
          c.classList.add('mal');
          clearTimeout(c._mal);
          c._mal = setTimeout(function () { c.classList.remove('mal'); }, 2000);
        }
      });
    });
  }

  function poner(carta, cas) {
    // "Ninguno" puede ir en los dos lados si los dos son "Ninguno" (no pasa en la Biblia, pero por las dudas)
    if (carta.dataset.libro === cas.dataset.resp) {
      Sonido.acierto();
      s.seguidos = 0;
      cas.classList.add('lleno');
      cas.querySelector('.cas-txt').textContent = carta.dataset.libro === NINGUNO ? '🚫 Ninguno' : carta.dataset.libro;
      s.puestos++;
      if (s.puestos === 2) {
        // Al completar los dos lados no se lee nada más (solo el tonito de acierto)
        Voz.cortarPregunta();
        s.n++;
        if (s.n === 5) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
        setTimeout(pregunta, 1400);
      }
      return true;
    }
    fallo(null);
    return false;
  }

  window.JuegoLibrosVecinos = {
    iniciar: function (raiz, funcionesApp) {
      app = funcionesApp;
      s = { club: app.perfil().club, errores: 0, seguidos: 0, n: 0,
        cola: Azar.mezclar(TODOS.map(function (_, k) { return k; })).slice(0, RONDA) };
      ui = cabeceraJuego(raiz, '¿Antes y después?');
      Ayuda.poner(function () {
        var libre = ui.cont.querySelector('.casillero:not(.lleno)');
        if (!libre) return;
        var c = ui.cont.querySelector('.carta-libro[data-libro="' + libre.dataset.resp + '"]:not(.usada)');
        marcarPista([c, libre]); s.errores++;
      });
      pregunta();
    }
  };
})();
