// Juego: las 10 plagas de Egipto (Éxodo 7–12)
(function () {
  var D = window.DATOS_PLAGAS;
  var OPCIONES = { aventureros: 3, ninguno: 4, conquistadores: 4 };

  var MODOS = [
    { id: 'faraon', nombre: 'Faraón dice que no', icono: '🤴', imagen: 'img/modos/faraon.webp', desc: 'Elegí la plaga que sigue cada vez que Faraón dice "¡No!"' },
    { id: 'ordenar', nombre: 'Ordenar las plagas', icono: '🔢', imagen: 'img/modos/pergamino-lupa.webp', desc: 'Arrastrá cada plaga a su número' },
    { id: 'pista', nombre: '¿Qué plaga es?', icono: '🔎', imagen: 'img/modos/detective.webp', desc: 'Leé la pista y adiviná la plaga' }
  ];

  var s, ui, app;

  function fallo(el) {
    Sonido.error();
    s.errores++; s.seguidos++;
    if (el) marcarError(el);
    if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
  }
  function acierto() { Sonido.acierto(); s.seguidos = 0; }
  function terminar(titulo, espera) {
    var est = Estrellas.calcular(s.errores);
    Estrellas.guardar('plag_' + s.modo, est);
    Sonido.victoria();
    setTimeout(function () {
      app.resultado({ juego: 'plagas', modo: s.modo, estrellas: est, errores: s.errores, aciertos: (s.modo === 'pista' ? s.cola.length : 10), titulo: titulo });
    }, espera || 900);
  }
  function ic(p) { if (Apariencia.clasica()) return p.icono; return '<img class="ic-img ic-plaga" src="img/plagas/plaga-' + (p.n < 10 ? '0' : '') + p.n + '.webp" alt="">'; }
  function opcionHTML(p) {
    return '<button class="opcion-mand" data-n="' + p.n + '"><span class="ic">' + ic(p) + '</span><span class="txt">' + p.nombre + '</span></button>';
  }

  // ---------- Modo: Faraón dice que no ----------
  function escenaEgipto() {
    return '<div class="egipto" data-plaga="0">' +
      (Apariencia.clasica()
        ? '<div class="eg-cielo"></div><div class="eg-sol"></div>' +
          '<div class="piramide p1"></div><div class="piramide p2"></div>' +
          '<div class="eg-arena"></div><div class="eg-rio"></div>' +
          '<div class="eg-efecto"></div>'
        : '<img class="eg-fondo" src="img/plagas/egipto.webp" alt="">' +
          '<img class="eg-carta" alt="">') +
      '<div class="eg-faraon"><span class="cara">🤴</span><span class="globo">¡No dejaré ir al pueblo!</span></div>' +
      '<div class="eg-moises">🧔</div>' +
      '<div class="eg-numero"></div>' +
    '</div>';
  }

  // Apariencia clásica (2.6.4): emojis animados sobre la escena
  var EFECTOS = {
    2: ['🐸', 9], 3: ['🦟', 12], 4: ['🪰', 12], 5: ['🐄', 3], 6: ['🤕', 3], 7: ['🧊', 14], 8: ['🦗', 12]
  };

  function aplicarEfectoClasico(n) {
    var eg = ui.cont.querySelector('.egipto');
    eg.dataset.plaga = n;
    var ef = eg.querySelector('.eg-efecto');
    ef.innerHTML = '';
    var e = EFECTOS[n];
    if (e) {
      for (var i = 0; i < e[1]; i++) {
        var sp = document.createElement('span');
        sp.textContent = e[0];
        sp.style.left = (5 + Math.random() * 85) + '%';
        sp.style.top = (n === 7 ? -10 : 20 + Math.random() * 65) + '%';
        sp.style.animationDelay = (Math.random() * 0.8) + 's';
        sp.className = n === 7 ? 'cae' : 'aparece';
        ef.appendChild(sp);
      }
    }
    if (n === 10) ef.innerHTML = '<span class="luna-noche">🌙</span><span class="llanto" style="left:22%;top:58%">😢</span>' +
      '<span class="llanto" style="left:48%;top:66%">😢</span><span class="llanto" style="left:70%;top:60%">😢</span>';
  }

  // Al acertar, la ilustración de la plaga aparece sobre Egipto
  function aplicarEfecto(n) {
    if (Apariencia.clasica()) return aplicarEfectoClasico(n);
    var eg = ui.cont.querySelector('.egipto');
    eg.dataset.plaga = n;
    var c = eg.querySelector('.eg-carta');
    c.classList.remove('visible');
    c.onload = function () { c.classList.add('visible'); };
    c.src = 'img/plagas/plaga-' + (n < 10 ? '0' : '') + n + '.webp';
  }

  function iniciarFaraon() {
    s.i = 0;
    ui.cont.innerHTML = escenaEgipto() +
      '<p class="consigna">Moisés pidió: "Deja ir a mi pueblo". ¿Qué plaga vino después?</p>' +
      '<div class="opciones"></div><div class="zona-siguiente"></div>';
    rondaFaraon();
    Ayuda.poner(function () {
      if (s.i >= 10 || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.opcion-mand[data-n="' + D.plagas[s.i].n + '"]')]);
    });
    ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || s.bloqueado) return;
      var p = D.plagas[s.i];
      if (+b.dataset.n !== p.n) { fallo(b); return; }
      acierto();
      s.bloqueado = true;
      b.classList.add('correcta');
      aplicarEfecto(p.n);
      ui.cont.querySelector('.eg-numero').textContent = 'Plaga ' + p.n + ': ' + p.nombre;
      Voz.decir('Plaga ' + p.n + '. ' + p.nombre, true);
      s.i++;
      ui.progreso(s.i / 10);
      var globo = ui.cont.querySelector('.globo');
      if (s.i === 10) {
        globo.textContent = '¡Váyanse!';
        ui.cont.querySelector('.consigna').textContent = 'Por fin, Faraón dejó ir al pueblo de Israel';
        Personaje.aparecer(app.perfil(), '¡Dios liberó a su pueblo!', 'festejando');
        mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), tarjetaVerde('Plaga ' + p.n + ': ' + p.nombre, p.cita), function () {
          terminar('¡Dios liberó a su pueblo!', 300);
        }, 'Ver resultado ▶');
        return;
      }
      if (s.i === 5) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
      mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), tarjetaVerde('Plaga ' + p.n + ': ' + p.nombre, p.cita), function () {
        s.bloqueado = false;
        rondaFaraon();
      });
    });
  }

  function rondaFaraon() {
    var p = D.plagas[s.i];
    var globo = ui.cont.querySelector('.globo');
    globo.textContent = s.i === 0 ? '¡No dejaré ir al pueblo!' : '¡No! ¡No los dejaré ir!';
    globo.classList.remove('rebota'); void globo.offsetWidth; globo.classList.add('rebota');
    ui.cont.querySelector('.eg-numero').textContent = 'Plaga ' + (s.i + 1) + ' de 10';
    ui.cont.querySelector('.consigna').innerHTML = '<span class="num-pregunta">Vamos por la plaga número ' + (s.i + 1) + '</span>' +
      (s.i === 0 ? 'Moisés pidió: "Deja ir a mi pueblo". ¿Cuál fue la primera plaga?'
                 : 'Faraón dijo que no. ¿Cuál fue la plaga número ' + (s.i + 1) + '?');
    var otros = Azar.mezclar(D.plagas.filter(function (x) { return x.n !== p.n; })).slice(0, (OPCIONES[s.club] || 4) - 1);
    ui.cont.querySelector('.opciones').innerHTML = Azar.mezclar([p].concat(otros)).map(opcionHTML).join('');
  }

  // ---------- Modo: ordenar las plagas (arrastrar) ----------
  function iniciarOrdenar() {
    s.colocados = 0; s.fallosCarta = {};
    var ranuras = '';
    D.plagas.forEach(function (p) {
      ranuras += '<div class="ranura" data-n="' + p.n + '"><span class="num">' + p.n + '</span><span class="txt"></span></div>';
    });
    ui.cont.innerHTML =
      '<div class="papiro">' + ranuras + '</div>' +
      '<p class="consigna"><span class="num-pregunta">0 de 10 plagas en su lugar</span>Arrastrá cada plaga a su número</p>' +
      '<div class="cartas-mand"></div>';
    var zona = ui.cont.querySelector('.cartas-mand');
    Azar.mezclar(D.plagas).forEach(function (p) {
      var c = document.createElement('div');
      c.className = 'carta-mand arrastrable';
      c.dataset.n = p.n;
      c.innerHTML = '<span class="ic">' + ic(p) + '</span><span>' + p.nombre + '</span>';
      zona.appendChild(c);
    });
    var papiro = ui.cont.querySelector('.papiro');
    Ayuda.poner(function () {
      if (pistaArrastre(zona, '.carta-mand', 'n', '.papiro .ranura[data-n="{v}"]')) s.errores++;
    });
    Arrastre.activar(zona, {
      carta: '.carta-mand', destino: '.ranura:not(.llena)',
      alSoltar: function (carta, ranura) {
        papiro.querySelectorAll('.pista').forEach(function (r) { r.classList.remove('pista'); });
        if (ranura.dataset.n !== carta.dataset.n) {
          s.fallosCarta[carta.dataset.n] = (s.fallosCarta[carta.dataset.n] || 0) + 1;
          fallo(null);
          return false;
        }
        acierto();
        var p = D.plagas[+carta.dataset.n - 1];
        ranura.classList.add('llena');
        ranura.querySelector('.txt').innerHTML = ic(p) + ' ' + p.nombre;
        Voz.decir(p.nombre);
        s.colocados++;
        ui.progreso(s.colocados / 10);
        ui.cont.querySelector('.consigna .num-pregunta').textContent = s.colocados + ' de 10 plagas en su lugar';
        if (s.colocados === 5) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
        if (s.colocados === 10) terminar('¡Las 10 plagas en orden!');
        return true;
      }
    });
  }

  // ---------- Modo: ¿qué plaga es? ----------
  function iniciarPista() {
    s.cola = Azar.mezclar(D.plagas);
    s.i = 0;
    ui.cont.innerHTML = '<div class="situacion"><span class="ic">' + (Apariencia.clasica() ? '🔎' : '<img class="ic-img ic-sit" src="img/modos/detective.webp" alt="">') + '</span><p></p></div>' +
      '<p class="consigna">¿De qué plaga habla la pista?</p><div class="opciones"></div><div class="zona-siguiente"></div>';
    mostrarPista();
    Ayuda.poner(function () {
      if (s.i >= s.cola.length || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.opcion-mand[data-n="' + s.cola[s.i].n + '"]')]);
    });
    ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || s.bloqueado) return;
      var p = s.cola[s.i];
      if (+b.dataset.n !== p.n) { fallo(b); return; }
      acierto();
      s.bloqueado = true;
      b.classList.add('correcta');
      Voz.decir('Plaga ' + p.n + '. ' + p.nombre, true);
      s.i++;
      ui.progreso(s.i / s.cola.length);
      var ultima = s.i >= s.cola.length;
      mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), tarjetaVerde('Plaga ' + p.n + ': ' + p.nombre, p.cita), function () {
        if (ultima) terminar('¡Conocés muy bien las plagas!', 300);
        else { s.bloqueado = false; mostrarPista(); }
      }, ultima ? 'Ver resultado ▶' : null);
    });
  }

  function mostrarPista() {
    var p = s.cola[s.i];
    ui.cont.querySelector('.situacion p').textContent = p.pista;
    ui.cont.querySelector('.consigna').innerHTML = '<span class="num-pregunta">Pista ' + (s.i + 1) + ' de ' + s.cola.length + '</span>¿De qué plaga habla la pista?';
    Voz.leer(p.pista);
    var otros = Azar.mezclar(D.plagas.filter(function (x) { return x.n !== p.n; })).slice(0, (OPCIONES[s.club] || 4) - 1);
    ui.cont.querySelector('.opciones').innerHTML = Azar.mezclar([p].concat(otros)).map(opcionHTML).join('');
  }

  window.JuegoPlagas = {
    titulo: 'Las 10 plagas',
    modos: MODOS,
    estrellasModo: function (m) { return Estrellas.leer('plag_' + m); },
    totalEstrellas: function () { return MODOS.reduce(function (a, m) { return a + Estrellas.leer('plag_' + m.id); }, 0); },
    maxEstrellas: function () { return MODOS.length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0 };
      ui = cabeceraJuego(raiz, MODOS.filter(function (m) { return m.id === modo; })[0].nombre);
      if (modo === 'faraon') iniciarFaraon();
      else if (modo === 'ordenar') iniciarOrdenar();
      else iniciarPista();
    }
  };
})();
