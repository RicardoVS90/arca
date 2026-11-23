// Juego: la creación (Génesis 1 y 2:1-3). El mundo se va armando día por día.
(function () {
  var D = window.DATOS_CREACION;
  var RONDAS_DIA = { aventureros: 6, ninguno: 8, conquistadores: 10 };

  var MODOS = [
    { id: 'armar', nombre: 'Armar la creación', icono: '🌍', imagen: 'img/menu/isla-creacion.webp', desc: 'Ordená los 7 días y mirá cómo se forma el mundo' },
    { id: 'que-dia', nombre: '¿Qué día fue?', icono: '📅', imagen: 'img/modos/calendario.webp', desc: 'Adiviná en qué día lo creó Dios' },
    { id: 'explorar', nombre: 'Explorar', icono: '🔭', imagen: 'img/modos/catalejo.webp', desc: 'Mirá cada día con calma, sin puntos' }
  ];

  var s, ui, app;

  // Escena: cada capa aparece a partir de su día
  function escenaHTML() {
    if (Apariencia.clasica()) {
      return '<div class="escena" data-dia="0">' +
        '<div class="capa c1"></div>' +
        '<div class="capa c2"><div class="cielo"></div><div class="agua"></div></div>' +
        '<div class="capa c3"><div class="loma l1"></div><div class="loma l2"></div>' +
          '<span class="e" style="left:8%;bottom:30%">🌳</span><span class="e" style="left:22%;bottom:34%">🌻</span>' +
          '<span class="e" style="right:10%;bottom:28%">🍎</span><span class="e" style="right:24%;bottom:33%">🌳</span></div>' +
        '<div class="capa c4"><span class="e grande" style="right:7%;top:6%">☀️</span><span class="e" style="left:8%;top:8%">🌙</span>' +
          '<span class="e chica" style="left:26%;top:5%">⭐</span><span class="e chica" style="left:38%;top:14%">⭐</span></div>' +
        '<div class="capa c5"><span class="e" style="left:44%;bottom:8%">🐟</span><span class="e" style="left:60%;bottom:3%">🐋</span>' +
          '<span class="e" style="left:52%;top:24%">🐦</span><span class="e chica" style="left:64%;top:18%">🐦</span></div>' +
        '<div class="capa c6"><span class="e" style="left:4%;bottom:18%">🦁</span><span class="e" style="left:18%;bottom:22%">🐄</span>' +
          '<span class="e chica" style="right:30%;bottom:20%">🐛</span><span class="e" style="right:12%;bottom:18%">👫</span></div>' +
        '<div class="capa c7"><div class="brillo"></div><p class="verso">“' + D.versiculoSabado.texto + '” <small>' + D.versiculoSabado.cita + '</small></p></div>' +
        '<div class="dia-cartel"></div>' +
    '</div>';
    }
    var h = '<div class="escena" data-dia="0">';
    for (var n = 1; n <= 7; n++) h += '<img class="dia-img d' + n + '" src="img/creacion/dia' + n + '.webp" alt="">';
    return h + '<div class="capa c7"><p class="verso">“' + D.versiculoSabado.texto + '” <small>' + D.versiculoSabado.cita + '</small></p></div>' +
      '<div class="dia-cartel"></div>' +
    '</div>';
  }

  function mostrarDia(n, anunciar) {
    var e = ui.cont.querySelector('.escena');
    e.dataset.dia = n;
    var c = e.querySelector('.dia-cartel');
    c.textContent = n ? 'Día ' + n : 'Al principio…';
    if (anunciar && n) {
      var d = D.dias[n - 1];
      Voz.decir('Día ' + n + '. ' + d.titulo);
      var cur = D.curiosidades.filter(function (x) { return x.dia === n; })[0];
      if (cur) Personaje.aparecer(app.perfil(), cur.texto, n === 7 ? 'festejando' : 'saludando');
    }
  }

  function fallo(el) {
    Sonido.error();
    s.errores++;
    s.seguidos++;
    if (el) marcarError(el);
    if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
  }

  function terminar(titulo) {
    var est = Estrellas.calcular(s.errores);
    Estrellas.guardar('crea_' + s.modo, est);
    if (s.modo === 'armar') Almacen.guardar('creacion_completa', true);
    Sonido.victoria();
    setTimeout(function () {
      app.resultado({ juego: 'creacion', modo: s.modo, estrellas: est, errores: s.errores, aciertos: (s.modo === 'armar' ? 7 : s.cola.length), titulo: titulo });
    }, 2200);
  }

  // ---------- Modo: armar la creación ----------
  function iniciarArmar() {
    s.pos = 1;
    ui.cont.innerHTML = escenaHTML() +
      '<p class="consigna">¿Qué creó Dios el <b>día 1</b>?</p><div class="cartas-dias"></div>';
    mostrarDia(0);
    var zona = ui.cont.querySelector('.cartas-dias');
    Azar.mezclar(D.dias).forEach(function (d) {
      var b = document.createElement('button');
      b.className = 'carta-dia';
      b.dataset.n = d.n;
      b.innerHTML = '<span class="ic">' + d.icono + '</span><span>' + d.titulo + '</span>';
      zona.appendChild(b);
    });
    Ayuda.poner(function () {
      if (s.pos > 7) return;
      s.errores++;
      marcarPista([zona.querySelector('.carta-dia[data-n="' + s.pos + '"]')]);
    });
    zona.addEventListener('click', function (ev) {
      var b = ev.target.closest('.carta-dia');
      if (!b || b.classList.contains('usada')) return;
      if (+b.dataset.n === s.pos) {
        Sonido.acierto();
        s.seguidos = 0; s.fallos = 0;
        b.classList.add('usada');
        mostrarDia(s.pos, true);
        ui.progreso(s.pos / 7);
        s.pos++;
        var cons = ui.cont.querySelector('.consigna');
        if (s.pos > 7) { cons.textContent = '¡Dios terminó la creación!'; terminar('¡Armaste toda la creación!'); }
        else cons.innerHTML = '¿Qué creó Dios el <b>día ' + s.pos + '</b>?';
      } else {
        fallo(b);
        s.fallos++;
      }
    });
  }

  // ---------- Modo: ¿qué día fue? ----------
  function iniciarQueDia() {
    s.cola = Azar.mezclar(D.elementos).slice(0, RONDAS_DIA[s.club] || 8);
    s.i = 0;
    var botones = '';
    for (var n = 1; n <= 7; n++) botones += '<button class="btn-dia" data-n="' + n + '">' + n + '</button>';
    ui.cont.innerHTML =
      '<p class="consigna">¿Qué día lo creó Dios?</p>' +
      '<div class="elemento"></div>' +
      '<div class="barra-dias">' + botones + '</div><div class="zona-siguiente"></div>';
    mostrarElemento();
    Ayuda.poner(function () {
      if (s.i >= s.cola.length || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.btn-dia[data-n="' + s.cola[s.i].dia + '"]')]);
    });
    ui.cont.querySelector('.barra-dias').addEventListener('click', function (ev) {
      var b = ev.target.closest('.btn-dia');
      if (!b || s.bloqueado) return;
      var el = s.cola[s.i];
      if (+b.dataset.n === el.dia) {
        Sonido.acierto();
        s.seguidos = 0;
        s.bloqueado = true;
        b.classList.add('correcta');
        var d = D.dias[el.dia - 1];
        ui.cont.querySelector('.elemento .pie').textContent = 'Día ' + el.dia + ': ' + d.titulo;
        Voz.decir('Día ' + el.dia + '. ' + d.titulo, true);
        s.i++;
        ui.progreso(s.i / s.cola.length);
        var ultima = s.i >= s.cola.length;
        mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), tarjetaVerde(el.nombre + ': día ' + el.dia, d.cita), function () {
          rehabilitarOpciones(ui.cont);
          if (ultima) terminar('¡Conocés muy bien la creación!');
          else { s.bloqueado = false; mostrarElemento(); }
        }, ultima ? 'Ver resultado ▶' : null);
      } else {
        fallo(b);
      }
    });
  }

  function mostrarElemento() {
    var el = s.cola[s.i];
    ui.cont.querySelector('.elemento').innerHTML =
      '<span class="ic">' + (el.img && !Apariencia.clasica() ? '<img class="ic-img" src="' + el.img + '" alt="">' : el.icono) + '</span><b>' + el.nombre + '</b><span class="pie"></span>';
    ui.cont.querySelectorAll('.btn-dia').forEach(function (b) { b.className = 'btn-dia'; });
    Voz.leer(el.nombre);
  }

  // ---------- Modo: explorar ----------
  function iniciarExplorar() {
    var botones = '';
    for (var n = 1; n <= 7; n++) botones += '<button class="btn-dia" data-n="' + n + '">' + n + '</button>';
    ui.cont.innerHTML = escenaHTML() +
      '<div class="info-dia"><b>Al principio…</b><span>Tocá un día para ver lo que Dios creó</span></div>' +
      '<div class="barra-dias">' + botones + '</div>';
    mostrarDia(0);
    ui.progreso(0);
    var vistos = {};
    ui.cont.querySelector('.barra-dias').addEventListener('click', function (ev) {
      var b = ev.target.closest('.btn-dia');
      if (!b) return;
      var n = +b.dataset.n, d = D.dias[n - 1];
      Sonido.toque();
      ui.cont.querySelectorAll('.btn-dia').forEach(function (x) { x.classList.toggle('activo', x === b); });
      mostrarDia(n, true);
      ui.cont.querySelector('.info-dia').innerHTML = '<b>' + d.icono + ' Día ' + n + ': ' + d.titulo + '</b><span>' + d.cita + '</span>';
      vistos[n] = true;
      ui.progreso(Object.keys(vistos).length / 7);
    });
  }

  window.JuegoCreacion = {
    titulo: 'La creación',
    modos: MODOS,
    estrellasModo: function (m) { return m === 'explorar' ? -1 : Estrellas.leer('crea_' + m); },
    totalEstrellas: function () { return Estrellas.leer('crea_armar') + Estrellas.leer('crea_que-dia'); },
    maxEstrellas: function () { return 6; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0, fallos: 0 };
      var nombre = MODOS.filter(function (m) { return m.id === modo; })[0].nombre;
      ui = cabeceraJuego(raiz, nombre);
      if (modo === 'armar') iniciarArmar();
      else if (modo === 'que-dia') iniciarQueDia();
      else iniciarExplorar();
    }
  };
})();
