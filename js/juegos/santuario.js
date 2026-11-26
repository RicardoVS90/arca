// Juego: el santuario del desierto
(function () {
  var D = window.DATOS_SANTUARIO;

  var MODOS = [
    { id: 'armar', nombre: 'Armar el santuario', icono: '⛺', imagen: 'img/menu/isla-santuario.webp', imagenClasica: 'img/clasico/santuario/santuario.webp', desc: 'Arrastrá cada mueble a su lugar' },
    { id: 'lugar', nombre: '¿En qué lugar va?', icono: '🗺️', imagen: 'img/modos/mapa.webp', desc: 'Atrio, Lugar Santo o Lugar Santísimo' }
  ];

  var s, ui, app;

  function img(m, cls) { return '<img class="' + (cls || 'img-mueble') + '" src="img/' + (Apariencia.clasica() ? 'clasico/' : '') + 'santuario/' + m.id + '.webp" alt="">'; }
  // Posiciones del plano clásico (2.6.4)
  var XY_CLASICO = { altar: [50, 80], fuente: [50, 64], candelero: [34, 42], mesa: [66, 42], incienso: [50, 30], arca: [50, 13] };
  function xy(m) { var c = Apariencia.clasica() && XY_CLASICO[m.id]; return c ? c : [m.x, m.y]; }
  function porId(id) { return D.muebles.filter(function (m) { return m.id === id; })[0]; }
  function fallo(el) {
    Sonido.error();
    s.errores++; s.seguidos++;
    if (el) marcarError(el);
    if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
  }
  function acierto() { Sonido.acierto(); s.seguidos = 0; }
  function terminar(titulo, espera) {
    var est = Estrellas.calcular(s.errores);
    Estrellas.guardar('sant_' + s.modo, est);
    Sonido.victoria();
    setTimeout(function () {
      app.resultado({ juego: 'santuario', modo: s.modo, estrellas: est, errores: s.errores, aciertos: (s.modo === 'armar' ? D.muebles.length : s.cola.length), titulo: titulo });
    }, espera || 1200);
  }

  // Plano visto desde arriba: entrada abajo, Lugar Santísimo arriba
  function planoHTML(conMuebles) {
    var h = '<div class="plano">' +
      (Apariencia.clasica()
        ? '<div class="atrio-cerco"></div>' +
          '<div class="tienda"><div class="santisimo"><small>Lugar Santísimo</small></div><div class="velo"></div><div class="santo"><small>Lugar Santo</small></div></div>' +
          '<small class="rot-atrio">Atrio</small>' +
          '<div class="puerta-atrio"><small>Entrada</small></div>'
        : '<img class="plano-fondo" src="img/santuario/plano.webp" alt="">' +
          '<span class="cartel-lugar cl-santisimo">Lugar Santísimo</span>' +
          '<span class="cartel-lugar cl-santo">Lugar Santo</span>' +
          '<span class="cartel-lugar cl-atrio">Atrio</span>' +
          '<span class="cartel-lugar cl-entrada">Entrada</span>');
    D.muebles.forEach(function (m) {
      h += '<div class="lugar-mueble en-' + m.lugar + (conMuebles ? ' puesto' : '') + '" data-id="' + m.id + '" style="left:' + xy(m)[0] + '%;top:' + xy(m)[1] + '%">' +
        (conMuebles ? img(m) : '') + '</div>';
    });
    return h + '</div>';
  }

  function decirJesus(m) {
    var txt = s.club === 'aventureros' ? m.nombre : m.nombre + '. ' + m.jesus;
    ui.cont.querySelector('.leyenda').innerHTML = '<b>' + m.nombre + '</b>' +
      (s.club === 'aventureros' ? '' : '<span>' + m.jesus + '</span>');
    Voz.decir(m.nombre);
    return txt;
  }

  // ---------- Modo: armar (arrastrar) ----------
  function iniciarArmar() {
    s.colocados = 0; s.fallosCarta = {};
    ui.cont.innerHTML = planoHTML(false) +
      '<div class="leyenda"><b>Arrastrá cada mueble a su lugar</b></div>' +
      '<div class="cartas-mand"></div>';
    var zona = ui.cont.querySelector('.cartas-mand');
    Azar.mezclar(D.muebles).forEach(function (m) {
      var c = document.createElement('div');
      c.className = 'carta-mand arrastrable';
      c.dataset.id = m.id;
      c.innerHTML = img(m, 'miniatura') + '<span>' + m.nombre + '</span>';
      zona.appendChild(c);
    });
    var plano = ui.cont.querySelector('.plano');
    Ayuda.poner(function () {
      if (pistaArrastre(zona, '.carta-mand', 'id', '.lugar-mueble[data-id="{v}"]')) s.errores++;
    });
    Arrastre.activar(zona, {
      carta: '.carta-mand', destino: '.lugar-mueble:not(.puesto)',
      alSoltar: function (carta, lugar) {
        plano.querySelectorAll('.pista').forEach(function (r) { r.classList.remove('pista'); });
        if (lugar.dataset.id !== carta.dataset.id) {
          s.fallosCarta[carta.dataset.id] = (s.fallosCarta[carta.dataset.id] || 0) + 1;
          fallo(null);
          return false;
        }
        acierto();
        var m = porId(carta.dataset.id);
        lugar.classList.add('puesto');
        lugar.innerHTML = img(m);
        decirJesus(m);
        s.colocados++;
        ui.progreso(s.colocados / D.muebles.length);
        if (s.colocados === D.muebles.length) terminar('¡Armaste el santuario!', 2200);
        return true;
      }
    });
  }

  // ---------- Modo: ¿en qué lugar va? ----------
  function iniciarLugar() {
    s.cola = Azar.mezclar(D.muebles);
    s.i = 0;
    ui.cont.innerHTML =
      '<p class="consigna">¿En qué parte del santuario estaba?</p>' +
      '<div class="carta-grande"></div>' +
      '<div class="botones-lugar">' +
        '<button class="btn-lugar" data-l="atrio">🏕️ Atrio</button>' +
        '<button class="btn-lugar" data-l="santo">🕯️ Lugar Santo</button>' +
        '<button class="btn-lugar" data-l="santisimo">✨ Lugar Santísimo</button>' +
      '</div><div class="zona-siguiente"></div>';
    mostrarMueble();
    Ayuda.poner(function () {
      if (s.i >= s.cola.length || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.btn-lugar[data-l="' + s.cola[s.i].lugar + '"]')]);
    });
    ui.cont.querySelector('.botones-lugar').addEventListener('click', function (ev) {
      var b = ev.target.closest('.btn-lugar');
      if (!b || s.bloqueado) return;
      var m = s.cola[s.i];
      if (b.dataset.l !== m.lugar) { fallo(b); return; }
      acierto();
      s.bloqueado = true;
      b.classList.add('correcta');
      var LUG = D.lugares;
      Voz.decir(LUG[m.lugar], true);
      s.i++;
      ui.progreso(s.i / s.cola.length);
      var ultima = s.i >= s.cola.length;
      mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), tarjetaVerde(m.nombre + ': ' + LUG[m.lugar], String(m.jesus || '').split(' — ').pop()), function () {
        b.classList.remove('correcta');
        rehabilitarOpciones(ui.cont);
        if (ultima) terminar('¡Conocés el santuario!');
        else { s.bloqueado = false; mostrarMueble(); }
      }, ultima ? 'Ver resultado ▶' : null);
    });
  }

  function mostrarMueble() {
    var m = s.cola[s.i];
    var c = ui.cont.querySelector('.carta-grande');
    c.innerHTML = img(m, 'img-grande') + '<span class="txt">' + m.nombre + '</span>';
    c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    Voz.leer(m.nombre);
  }

  window.JuegoSantuario = {
    titulo: 'El santuario',
    modos: MODOS,
    estrellasModo: function (m) { return Estrellas.leer('sant_' + m); },
    totalEstrellas: function () { return MODOS.reduce(function (a, m) { return a + Estrellas.leer('sant_' + m.id); }, 0); },
    maxEstrellas: function () { return MODOS.length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0 };
      ui = cabeceraJuego(raiz, MODOS.filter(function (m) { return m.id === modo; })[0].nombre);
      if (modo === 'armar') iniciarArmar();
      else iniciarLugar();
    }
  };
})();
