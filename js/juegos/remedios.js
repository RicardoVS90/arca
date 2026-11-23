// Juego: Los 8 remedios naturales
(function () {
  var D = window.DATOS_REMEDIOS, C = window.JuegoComun;
  var MODOS = [
    { id: 'encontrar', nombre: 'Encontrá los 8', icono: '🔍', imagen: 'img/modos/hoja-lupa.webp', desc: 'Tocá los 8 remedios naturales' },
    { id: 'cual', nombre: '¿Qué remedio es?', icono: '💭', imagen: 'img/modos/globo-hoja.webp', desc: 'Leé la descripción y elegí el remedio' },
    { id: 'situacion', nombre: '¿Qué remedio le falta?', icono: '🧒', imagen: 'img/modos/mochila.webp', desc: 'Situaciones de todos los días' }
  ];
  var s, ui, app;
  var f = C.crear('rem_', 'remedios', function () { return s; }, function () { return app; });
  var iconos = {}, porNum = {};
  function icR(r) { return Apariencia.clasica() ? r.icono : '<img class="ic-img" src="' + r.img + '" alt="">'; }
  D.remedios.forEach(function (r) { porNum[r.n] = r; });
  function iconosActuales() { var o = {}; D.remedios.forEach(function (r) { o[r.nombre] = icR(r); }); return o; }

  // preguntas: [{ texto, consigna, remedio }]
  function cuestionario(preguntas, icono, titulo) {
    s.cola = preguntas; s.i = 0;
    ui.cont.innerHTML = '<div class="situacion"><span class="ic">' + icono + '</span><p></p></div>' +
      '<p class="consigna"></p><div class="opciones"></div><div class="zona-siguiente"></div>';
    function pintar() {
      var q = s.cola[s.i], r = q.remedio;
      ui.cont.querySelector('.situacion p').textContent = q.texto;
      ui.cont.querySelector('.consigna').innerHTML = '<span class="num-pregunta">' + (s.i + 1) + ' de ' + s.cola.length + '</span>' + q.consigna;
      var otros = D.remedios.filter(function (x) { return x.n !== r.n; }).map(function (x) { return x.nombre; });
      ui.cont.querySelector('.opciones').innerHTML = C.opcionesHTML(r.nombre, otros, C.OPCIONES[s.club] || 4, iconosActuales());
      Voz.leer(q.texto + ' ' + q.consigna);
    }
    pintar();
    Ayuda.poner(function () {
      if (s.bloqueado || s.i >= s.cola.length) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.opcion-mand[data-v="' + s.cola[s.i].remedio.nombre + '"]')]);
    });
    ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || s.bloqueado || s.i >= s.cola.length) return;
      var r = s.cola[s.i].remedio;
      if (b.dataset.v !== r.nombre) { f.fallo(b); return; }
      f.acierto(); s.bloqueado = true; b.classList.add('correcta');
      Voz.decir(r.nombre, true);
      s.i++; ui.progreso(s.i / s.cola.length);
      var ultima = s.i >= s.cola.length;
      mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), '', function () {
        if (ultima) f.terminar(titulo, s.cola.length); else { s.bloqueado = false; pintar(); }
      }, ultima ? 'Ver resultado ▶' : null);
    });
  }

  window.JuegoRemedios = {
    titulo: 'Los 8 remedios naturales',
    modos: MODOS,
    estrellasModo: function (m) { return Estrellas.leer('rem_' + m); },
    totalEstrellas: function () { return MODOS.reduce(function (a, m) { return a + Estrellas.leer('rem_' + m.id); }, 0); },
    maxEstrellas: function () { return MODOS.length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0, bloqueado: false };
      ui = cabeceraJuego(raiz, MODOS.filter(function (m) { return m.id === modo; })[0].nombre);
      if (modo === 'encontrar') C.seleccion(s, ui, app, f, {
        consigna: 'Tocá los 8 remedios naturales',
        correctos: D.remedios.map(function (r) { return { txt: r.nombre, icono: icR(r) }; }),
        falsos: D.falsos.map(function (r) { return { txt: r.nombre, icono: icR(r) }; }),
        final: '¡Los 8 remedios naturales! Dios quiere que estemos sanos', titulo: '¡Encontraste los 8 remedios!'
      });
      else if (modo === 'cual') cuestionario(Azar.mezclar(D.remedios).map(function (r) {
        return { texto: r.desc[Math.floor(Math.random() * r.desc.length)], consigna: '¿Qué remedio es?', remedio: r };
      }), (Apariencia.clasica() ? '💭' : '<img class="ic-img ic-sit" src="img/modos/globo-hoja.webp" alt="">'), '¡Conocés los 8 remedios naturales!');
      else cuestionario(Azar.mezclar(D.situaciones).slice(0, 8).map(function (x) {
        return { texto: x.t, consigna: x.p, remedio: porNum[x.r] };
      }), (Apariencia.clasica() ? '🧒' : '<img class="ic-img ic-sit" src="img/modos/mochila.webp" alt="">'), '¡Sabés cuidar tu salud!');
    }
  };
})();
