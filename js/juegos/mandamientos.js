// Juego: los 10 mandamientos (Éxodo 20, RV1960)
(function () {
  var D = window.DATOS_MANDAMIENTOS;
  function ic(m) { return m.img && !Apariencia.clasica() ? '<img class="ic-img" src="' + m.img + '" alt="">' : m.icono; }
  var RONDAS_SIT = { aventureros: 6, ninguno: 8, conquistadores: 10 };
  var OPCIONES = { aventureros: 3, ninguno: 4, conquistadores: 4 };

  var MODOS = [
    { id: 'tablas', nombre: 'Ordenar las tablas', icono: '🪨', imagen: 'img/mandamientos/tablas.webp', desc: 'Poné los 10 mandamientos en orden' },
    { id: 'tabla', nombre: '¿En qué tabla va?', icono: '⚖️', imagen: 'img/modos/balanza.webp', desc: 'Amar a Dios o amar al prójimo' },
    { id: 'situacion', nombre: '¿Qué mandamiento es?', icono: '🤔', imagen: 'img/modos/bombilla.webp', desc: 'Situaciones de todos los días' }
  ];

  var s, ui, app;

  function porNumero(n) { return D.mandamientos[n - 1]; }

  function fallo(el) {
    Sonido.error();
    s.errores++;
    s.seguidos++;
    if (el) marcarError(el);
    if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
  }

  function acierto() {
    Sonido.acierto();
    s.seguidos = 0;
  }

  function terminar(titulo) {
    var est = Estrellas.calcular(s.errores);
    Estrellas.guardar('mand_' + s.modo, est);
    Sonido.victoria();
    setTimeout(function () {
      app.resultado({ juego: 'mandamientos', modo: s.modo, estrellas: est, errores: s.errores, aciertos: (s.modo === 'tablas' ? 10 : s.cola.length), titulo: titulo });
    }, 700);
  }

  function tablasHTML() {
    function tabla(n) {
      var lista = D.mandamientos.filter(function (m) { return m.tabla === n; });
      return '<div class="tabla-piedra"><div class="tabla-titulo">' + (n === 1 ? 'Amar a Dios' : 'Amar al prójimo') + '</div>' +
        lista.map(function (m) {
          return '<div class="ranura" data-n="' + m.n + '"><span class="num">' + m.n + '</span><span class="txt"></span></div>';
        }).join('') + '</div>';
    }
    return '<div class="tablas">' + tabla(1) + tabla(2) + '</div>';
  }

  function llenarRanura(m) {
    var r = ui.cont.querySelector('.ranura[data-n="' + m.n + '"]');
    if (!r) return;
    r.classList.add('llena');
    r.querySelector('.txt').innerHTML = ic(m) + ' ' + m.corto;
  }

  function efectoSabado() {
    var f = document.createElement('div');
    f.className = 'atardecer';
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 2600);
    Personaje.aparecer(app.perfil(), '¡El sábado! Un regalo de Dios', 'festejando');
  }

  // ---------- Modo: ordenar las tablas (arrastrar en cualquier orden) ----------
  function iniciarTablas() {
    s.colocados = 0;
    s.fallosCarta = {};
    ui.cont.innerHTML = tablasHTML() +
      '<p class="consigna">Arrastrá cada mandamiento a su lugar en las tablas</p>' +
      '<div class="cartas-mand"></div>';
    var zona = ui.cont.querySelector('.cartas-mand');
    Azar.mezclar(D.mandamientos).forEach(function (m) {
      var b = document.createElement('div');
      b.className = 'carta-mand arrastrable';
      b.dataset.n = m.n;
      b.innerHTML = '<span class="ic">' + ic(m) + '</span><span>' + m.corto + '</span>';
      zona.appendChild(b);
    });
    var tablas = ui.cont.querySelector('.tablas');
    Arrastre.activar(zona, {
      carta: '.carta-mand',
      destino: '.ranura:not(.llena)',
      alSoltar: function (carta, ranura) {
        tablas.querySelectorAll('.ranura.pista').forEach(function (r) { r.classList.remove('pista'); });
        if (ranura.dataset.n === carta.dataset.n) {
          Sonido.acierto();
          s.seguidos = 0;
          var m = porNumero(+carta.dataset.n);
          llenarRanura(m);
          Voz.decir(m.corto);
          if (m.especial) efectoSabado();
          s.colocados++;
          ui.progreso(s.colocados / 10);
          if (s.colocados === 5) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
          if (s.colocados === 10) terminar('¡Las dos tablas están completas!');
          return true;
        }
        s.fallosCarta[carta.dataset.n] = (s.fallosCarta[carta.dataset.n] || 0) + 1;
        fallo(null);
        return false;
      }
    });
    Ayuda.poner(function () {
      if (pistaArrastre(zona, '.carta-mand', 'n', '.tablas .ranura[data-n="{v}"]')) s.errores++;
    });
    tablas.addEventListener('click', function (ev) {
      var r = ev.target.closest('.ranura.llena');
      if (!r) return;
      var m = porNumero(+r.dataset.n);
      mostrarTexto('Mandamiento ' + m.n, m.completo, m.cita);
    });
  }

  // ---------- Modo: ¿en qué tabla va? ----------
  function iniciarTabla() {
    s.cola = Azar.mezclar(D.mandamientos);
    s.i = 0;
    ui.cont.innerHTML =
      '<p class="consigna">¿En qué tabla va este mandamiento?</p>' +
      '<div class="carta-grande"></div>' +
      '<div class="botones-tabla">' +
        '<button class="btn-tabla t1" data-t="1"><b>🙏 Tabla 1</b><span>Amar a Dios</span></button>' +
        '<button class="btn-tabla t2" data-t="2"><b>🤝 Tabla 2</b><span>Amar al prójimo</span></button>' +
      '</div><div class="zona-siguiente"></div>';
    mostrarCarta();
    Ayuda.poner(function () {
      if (s.i >= s.cola.length || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.btn-tabla[data-t="' + s.cola[s.i].tabla + '"]')]);
    });
    ui.cont.querySelector('.botones-tabla').addEventListener('click', function (ev) {
      var b = ev.target.closest('.btn-tabla');
      if (!b || s.bloqueado) return;
      var m = s.cola[s.i];
      if (+b.dataset.t === m.tabla) {
        acierto();
        s.bloqueado = true;
        var c = ui.cont.querySelector('.carta-grande');
        c.classList.add(m.tabla === 1 ? 'vuela-izq' : 'vuela-der');
        b.classList.add('correcta');
        Voz.decir('Tabla ' + m.tabla + '. ' + (m.tabla === 1 ? 'Amar a Dios' : 'Amar al prójimo'), true);
        s.i++;
        ui.progreso(s.i / s.cola.length);
        var ultima = s.i >= s.cola.length;
        mostrarAcierto(ui.cont.querySelector('.zona-siguiente'),
          tarjetaVerde('Mandamiento ' + m.n + ' · Tabla ' + m.tabla + ': ' + (m.tabla === 1 ? 'Amar a Dios' : 'Amar al prójimo'), m.cita),
          function () {
            b.classList.remove('correcta');
            rehabilitarOpciones(ui.cont);
            if (ultima) terminar('¡Muy bien! Ya conocés las dos tablas');
            else { s.bloqueado = false; mostrarCarta(); }
          }, ultima ? 'Ver resultado ▶' : null);
      } else {
        fallo(b);
      }
    });
  }

  function mostrarCarta() {
    var m = s.cola[s.i];
    var c = ui.cont.querySelector('.carta-grande');
    c.className = 'carta-grande';
    c.innerHTML = '<span class="ic">' + ic(m) + '</span><span class="txt">' + m.corto + '</span>';
    Voz.leer(m.corto);
  }

  // ---------- Modo: ¿qué mandamiento es? ----------
  function iniciarSituacion() {
    s.cola = Azar.mezclar(D.situaciones).slice(0, RONDAS_SIT[s.club] || 8);
    s.i = 0;
    ui.cont.innerHTML = '<div class="situacion"></div><p class="consigna">¿Qué mandamiento nos enseña sobre esto?</p><div class="opciones"></div><div class="zona-siguiente"></div>';
    mostrarSituacion();
    Ayuda.poner(function () {
      if (s.i >= s.cola.length || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.opcion-mand[data-n="' + s.cola[s.i].n + '"]')]);
    });
    ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || s.bloqueado) return;
      var sit = s.cola[s.i];
      if (+b.dataset.n === sit.n) {
        acierto();
        s.bloqueado = true;
        b.classList.add('correcta');
        s.i++;
        ui.progreso(s.i / s.cola.length);
        if (s.i === Math.floor(s.cola.length / 2)) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
        var mm = porNumero(sit.n), ultima = s.i >= s.cola.length;
        Voz.decir('Mandamiento ' + mm.n + '. ' + mm.corto, true);
        mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), tarjetaVerde('Mandamiento ' + mm.n + ': ' + mm.corto, mm.cita), function () {
          if (ultima) terminar('¡Sabés usar los mandamientos en la vida!');
          else { s.bloqueado = false; mostrarSituacion(); }
        }, ultima ? 'Ver resultado ▶' : null);
      } else {
        fallo(b);
      }
    });
  }

  function mostrarSituacion() {
    var sit = s.cola[s.i];
    ui.cont.querySelector('.situacion').innerHTML = '<span class="ic">' + (sit.img && !Apariencia.clasica() ? '<img class="ic-img ic-sit" src="' + sit.img + '" alt="">' : sit.icono) + '</span><p>' + sit.texto + '</p>';
    Voz.leer(sit.texto);
    var otros = Azar.mezclar(D.mandamientos.filter(function (m) { return m.n !== sit.n && m.n !== 7; }))
      .slice(0, (OPCIONES[s.club] || 4) - 1);
    var ops = Azar.mezclar([porNumero(sit.n)].concat(otros));
    ui.cont.querySelector('.opciones').innerHTML = ops.map(function (m) {
      return '<button class="opcion-mand" data-n="' + m.n + '"><span class="num">' + m.n + '</span>' +
        '<span class="ic">' + ic(m) + '</span><span class="txt">' + m.corto + '</span></button>';
    }).join('');
  }

  window.JuegoMandamientos = {
    titulo: 'Los 10 mandamientos',
    modos: MODOS,
    estrellasModo: function (m) { return Estrellas.leer('mand_' + m); },
    totalEstrellas: function () { return MODOS.reduce(function (a, m) { return a + Estrellas.leer('mand_' + m.id); }, 0); },
    maxEstrellas: function () { return MODOS.length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0, fallos: 0 };
      var nombre = MODOS.filter(function (m) { return m.id === modo; })[0].nombre;
      ui = cabeceraJuego(raiz, nombre);
      raiz.classList.add('juego-mandamientos');
      if (modo === 'tablas') iniciarTablas();
      else if (modo === 'tabla') iniciarTabla();
      else iniciarSituacion();
    }
  };
})();
