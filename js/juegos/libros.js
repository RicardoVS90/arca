// Juego: ordenar los libros de la Biblia
// Mecánicas: "tocar" (tocar las tarjetas en orden) y "sigue" (¿cuál sigue?)
(function () {
  var D = window.DATOS_LIBROS;
  var TAMANO_PARTE = { aventureros: 6, ninguno: 9, conquistadores: 99 };
  var OPCIONES = { aventureros: 3, ninguno: 4, conquistadores: 4 };

  var s = null;       // sesión actual
  var ui = null;      // referencias a la interfaz
  var app = null;     // funciones de la app (volver, resultado, perfil)

  function partir(lista, tam) {
    var n = Math.ceil(lista.length / tam), out = [], base = Math.floor(lista.length / n), resto = lista.length % n, i = 0;
    for (var k = 0; k < n; k++) {
      var t = base + (k < resto ? 1 : 0);
      out.push(lista.slice(i, i + t)); i += t;
    }
    return out;
  }

  function libroInfo(nombre) {
    for (var i = 0; i < D.todos.length; i++) if (D.todos[i].nombre === nombre) return { info: D.todos[i], idx: i };
    return null;
  }

  function estrellas(errores) { return errores === 0 ? 3 : errores <= 2 ? 2 : 1; }

  function claveEstrellas(mecanica, etapaId) { return 'estrellas_libros_' + mecanica + '_' + etapaId; }

  function etapaActual() { return s.etapas[s.iEtapa]; }

  function iniciarEtapa() {
    var etapa = etapaActual();
    s.partes = partir(etapa.libros, TAMANO_PARTE[s.club] || 9);
    s.iParte = 0;
    s.erroresEtapa = 0;
    iniciarParte();
  }

  function iniciarParte() {
    s.bloqueado = false;
    s.parte = s.partes[s.iParte];
    s.pos = 0;
    s.fallosObjetivo = 0;
    s.colocados = [];
    pintarCabecera();
    ui.estante.innerHTML = '';
    if (s.mecanica === 'tocar') pintarTocar(); else pintarSigue();
    Ayuda.poner(function () {
      if (s.pos >= s.parte.length || s.bloqueado) return;
      s.erroresEtapa++; s.erroresTotal++;
      marcarPista([ui.zona.querySelector('.tarjeta-libro[data-libro="' + CSS.escape(s.parte[s.pos]) + '"]')]);
    });
  }

  function pintarCabecera() {
    var etapa = etapaActual();
    var txt = etapa.nombre;
    if (s.partes.length > 1) txt += ' · parte ' + (s.iParte + 1) + '/' + s.partes.length;
    if (s.etapas.length > 1) txt = 'Etapa ' + (s.iEtapa + 1) + '/' + s.etapas.length + ' · ' + txt;
    ui.titulo.textContent = txt;
    ui.titulo.style.setProperty('--color-etapa', etapa.color);
    ui.progreso.style.width = '0%';
  }

  function actualizarProgreso() {
    ui.progreso.style.width = Math.round((s.pos / s.parte.length) * 100) + '%';
  }

  function chipEstante(nombre) {
    var info = libroInfo(nombre).info;
    var c = document.createElement('span');
    c.className = 'lomo';
    c.style.setProperty('--c', info.color);
    c.textContent = nombre;
    ui.estante.appendChild(c);
    ui.estante.scrollLeft = ui.estante.scrollWidth;
  }

  function tarjeta(nombre, extra) {
    var info = libroInfo(nombre).info;
    var b = document.createElement('button');
    b.className = 'tarjeta-libro' + (extra || '');
    b.style.setProperty('--c', info.color);
    b.dataset.libro = nombre;
    b.innerHTML = '<span class="banda"></span><span class="nombre">' + nombre + '</span>';
    return b;
  }

  // ---------- Mecánica: tocar en orden ----------
  function pintarTocar() {
    ui.consigna.textContent = s.pos === 0 && s.iParte === 0 && s.iEtapa === 0
      ? 'Tocá los libros en orden, empezando por el primero'
      : 'Seguí tocando los libros en orden';
    ui.zona.className = 'zona-tarjetas grilla';
    ui.zona.innerHTML = '';
    Azar.mezclar(s.parte).forEach(function (n) { ui.zona.appendChild(tarjeta(n)); });
    actualizarProgreso();
  }

  function tocarTarjeta(btn) {
    if (btn.classList.contains('usada') || s.pos >= s.parte.length) return;
    var esperado = s.parte[s.pos];
    if (btn.dataset.libro === esperado) {
      Sonido.acierto();
      Voz.decir(esperado);
      btn.classList.remove('pista');
      btn.classList.add('usada');
      chipEstante(esperado);
      s.pos++; s.fallosObjetivo = 0;
      actualizarProgreso();
      quizasComentar();
      if (s.pos >= s.parte.length) Voz.despues(650, finParte);
    } else {
      fallo(btn);
    }
  }

  // ---------- Mecánica: ¿cuál sigue? ----------
  function anteriorDe(nombre) {
    var r = libroInfo(nombre);
    if (r.idx === 0) return null;
    var prev = D.todos[r.idx - 1];
    if (prev.test !== r.info.test) return null;
    return prev.nombre;
  }

  function opcionesPara(correcto, previo) {
    var r = libroInfo(correcto);
    var cercanos = D.todos.filter(function (b, i) {
      return b.test === r.info.test && Math.abs(i - r.idx) <= 5 && b.nombre !== correcto && b.nombre !== previo;
    }).map(function (b) { return b.nombre; });
    var n = (OPCIONES[s.club] || 4) - 1;
    return Azar.mezclar([correcto].concat(Azar.mezclar(cercanos).slice(0, n)));
  }

  function pintarSigue() {
    var correcto = s.parte[s.pos];
    var previo = anteriorDe(correcto);
    ui.zona.className = 'zona-tarjetas sigue';
    var pregunta;
    if (previo) {
      var pi = libroInfo(previo).info;
      pregunta = '<div class="pregunta">Después de</div>' +
        '<div class="libro-base" style="--c:' + pi.color + '">' + previo + '</div>' +
        '<div class="pregunta">¿qué libro sigue?</div>';
    } else {
      pregunta = '<div class="pregunta">¿Con qué libro empieza el<br><b>' +
        (libroInfo(correcto).info.test === 'AT' ? 'Antiguo' : 'Nuevo') + ' Testamento</b>?</div>';
    }
    ui.consigna.textContent = 'Elegí la respuesta correcta';
    ui.zona.innerHTML = pregunta + '<div class="opciones"></div>';
    var cont = ui.zona.querySelector('.opciones');
    opcionesPara(correcto, previo).forEach(function (n) { cont.appendChild(tarjeta(n)); });
    actualizarProgreso();
  }

  function elegirOpcion(btn) {
    if (s.bloqueado) return;
    var correcto = s.parte[s.pos];
    if (btn.dataset.libro === correcto) {
      s.bloqueado = true;
      Sonido.acierto();
      Voz.decir(correcto, true);
      btn.classList.add('correcta');
      chipEstante(correcto);
      s.pos++; s.fallosObjetivo = 0;
      actualizarProgreso();
      quizasComentar();
      Voz.despues(700, function () {
        s.bloqueado = s.pos >= s.parte.length;
        if (s.pos >= s.parte.length) finParte(); else pintarSigue();
      });
    } else {
      fallo(btn);
    }
  }

  // ---------- Comunes ----------
  function fallo(btn) {
    Sonido.error();
    s.fallosObjetivo++;
    s.erroresEtapa++;
    s.erroresTotal++;
    marcarError(btn);
    s.fallosSeguidos = (s.fallosSeguidos || 0) + 1;
    if (s.fallosSeguidos === 2 || s.fallosSeguidos % 4 === 0) {
      Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
    }
  }

  function quizasComentar() {
    s.fallosSeguidos = 0;
    var mitad = Math.floor(s.parte.length / 2);
    if (s.parte.length >= 5 && s.pos === mitad && Math.random() < 0.6) {
      Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
    }
  }

  function finParte() {
    if (s.iParte + 1 < s.partes.length) {
      s.iParte++;
      Sonido.acierto();
      Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'festejando');
      Voz.despues(900, iniciarParte);
      return;
    }
    // Etapa completa: guardar estrellas
    var etapa = etapaActual();
    var est = estrellas(s.erroresEtapa);
    var clave = claveEstrellas(s.mecanica, etapa.id);
    if (est > Almacen.leer(clave, 0)) Almacen.guardar(clave, est);
    s.resultados.push({ etapa: etapa, estrellas: est });

    if (s.iEtapa + 1 < s.etapas.length) {
      s.iEtapa++;
      Sonido.victoria();
      Personaje.aparecer(app.perfil(), '¡' + etapa.nombre + ' completado! Sigamos', 'festejando');
      Voz.despues(1400, iniciarEtapa);
    } else {
      Sonido.victoria();
      var total = s.resultados.reduce(function (a, r) { return a + r.estrellas; }, 0);
      app.resultado({
        estrellas: Math.round(total / s.resultados.length),
        errores: s.erroresTotal,
        aciertos: s.etapas.reduce(function (a, e) { return a + e.libros.length; }, 0),
        titulo: s.etapas.length > 1 ? '¡Completaste todas las etapas!' : '¡' + etapa.nombre + ' completado!',
        unaEtapa: s.etapas.length === 1 ? etapa : null,
        mecanica: s.mecanica
      });
    }
  }

  window.JuegoLibros = {
    titulo: 'Libros de la Biblia',
    modos: [
      { id: 'ordenar', nombre: 'Aprendamos a ordenar', icono: '📚', imagen: 'img/menu/isla-libros.webp', desc: 'Aprendamos a ordenar los libros de la Biblia' },
      { id: 'vecinos', nombre: '¿Qué libros están antes y después?', icono: '↔️', imagen: 'img/modos/pergamino.webp', desc: 'Aprendé el antecesor y sucesor del libro propuesto al azar' }
    ],
    estrellasModo: function (m) {
      if (m === 'vecinos') return Estrellas.leer('libros_vecinos');
      return -1;
    },
    estrellasEtapa: function (mecanica, etapaId) { return Almacen.leer(claveEstrellas(mecanica, etapaId), 0); },
    totalEstrellas: function () {
      var t = 0;
      D.etapas.forEach(function (e) {
        t += Almacen.leer(claveEstrellas('tocar', e.id), 0);
      });
      return t + Estrellas.leer('libros_vecinos');
    },
    maxEstrellas: function () { return D.etapas.length * 3 + 3; },
    // opciones: { etapas: [etapa...], mecanica: 'tocar'|'sigue' }
    iniciar: function (raiz, opciones, funcionesApp) {
      app = funcionesApp;
      s = {
        etapas: opciones.etapas, mecanica: opciones.mecanica, club: app.perfil().club,
        iEtapa: 0, erroresTotal: 0, resultados: []
      };
      raiz.innerHTML =
        '<header class="barra-juego">' +
          '<button class="btn-icono" data-accion="volver" aria-label="Volver">‹</button>' +
          '<div class="titulo-juego"></div>' + Voz.boton() +
          '<button class="btn-ayuda" data-accion="ayuda" hidden>💡 Ayuda</button>' +
        '</header>' +
        '<div class="progreso"><div class="progreso-barra"></div></div>' +
        '<div class="estante" aria-label="Libros colocados"></div>' +
        '<p class="consigna"></p>' +
        '<div class="zona-tarjetas"></div>';
      ui = {
        titulo: raiz.querySelector('.titulo-juego'),
        progreso: raiz.querySelector('.progreso-barra'),
        estante: raiz.querySelector('.estante'),
        consigna: raiz.querySelector('.consigna'),
        zona: raiz.querySelector('.zona-tarjetas')
      };
      ui.zona.addEventListener('click', function (ev) {
        var b = ev.target.closest('.tarjeta-libro');
        if (!b) return;
        if (s.mecanica === 'tocar') tocarTarjeta(b); else elegirOpcion(b);
      });
      iniciarEtapa();
    }
  };
})();
