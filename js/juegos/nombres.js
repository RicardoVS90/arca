// Juego: Aprendamos sobre nombres (discípulos, hijos de Jacob, ¿hijo de quién?, ¿quién soy?)
(function () {
  var D = window.DATOS_NOMBRES, C = window.JuegoComun;
  var RONDA = 10;
  var MODOS = [
    { id: 'discipulos', nombre: 'Los 12 discípulos', icono: '🎣', imagen: 'img/modos/barca.webp', desc: 'Encontrá los 12 discípulos de Jesús' },
    { id: 'preg-discipulos', nombre: 'Preguntas sobre los discípulos', icono: '❓', imagen: 'img/modos/bombilla.webp', desc: '¿Quién hizo qué? Preguntas sobre los doce' },
    { id: 'tribus', nombre: 'Los 12 hijos de Jacob (Israel)', icono: '⛺', imagen: 'img/modos/carpas.webp', desc: 'Encontrá quiénes fueron los 12 hijos de Jacob' },
    { id: 'preg-tribus', nombre: 'Preguntas sobre las tribus', icono: '🏕️', imagen: 'img/modos/carpa-lupa.webp', desc: 'Preguntas sobre los hijos de Jacob y su descendencia' },
    { id: 'hijo', nombre: '¿Hijo de quién?', icono: '👨‍👩‍👦', imagen: 'img/modos/corazones.webp', desc: '¿Quiénes fueron sus padres? Según lo que dice la Biblia' },
    { id: 'quien', nombre: '¿Quién soy?', icono: '🕵️', imagen: 'img/modos/detective.webp', desc: 'Leé las pistas y adiviná el personaje' }
  ];
  var s, ui, app;
  var f = C.crear('nomb_', 'nombres', function () { return s; }, function () { return app; });

  function aTxt(l) { return l.map(function (x) { return { txt: x }; }); }
  function unicos(lista, quitar) {
    var v = {}; (quitar || []).forEach(function (q) { v[q] = 1; });
    return lista.filter(function (x) { if (v[x]) return false; v[x] = 1; return true; });
  }
  function nOpciones() { return C.OPCIONES[s.club] || 4; }

  // ---------- Cuestionario genérico ----------
  // item: { texto (HTML de la pregunta), voz, resp, opciones[], cita, icono, alAcertar? }
  function cuestionario(cola, titulo, extra) {
    s.cola = cola; s.i = 0;
    ui.cont.innerHTML = '<div class="situacion"><span class="ic"></span><div class="txt-sit"></div></div>' +
      '<p class="consigna"></p><div class="opciones"></div><div class="extra-preg"></div>';
    function pintar() {
      var q = s.cola[s.i];
      ui.cont.querySelector('.situacion .ic').textContent = q.icono || '❓';
      ui.cont.querySelector('.txt-sit').innerHTML = q.texto;
      ui.cont.querySelector('.consigna').innerHTML = '<span class="num-pregunta">' + (q.etiqueta || 'Pregunta') + ' ' + (s.i + 1) + ' de ' + s.cola.length + '</span>' + (q.consigna || 'Elegí la respuesta');
      ui.cont.querySelector('.opciones').innerHTML = q.opciones.map(function (o) {
        return '<button class="opcion-mand" data-v="' + o.replace(/"/g, '&quot;') + '"><span class="txt">' + o + '</span></button>';
      }).join('');
      if (q.alPintar) q.alPintar(); else ui.cont.querySelector('.extra-preg').innerHTML = '';
      Voz.leer(q.voz);
    }
    pintar();
    ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || s.bloqueado || s.i >= s.cola.length) return;
      var q = s.cola[s.i];
      if (b.dataset.v !== q.resp) { f.fallo(b); return; }
      f.acierto(); s.bloqueado = true;
      b.classList.add('correcta');
      if (q.alAcertar) q.alAcertar();
      Voz.decir(q.vozOk || q.resp, true);
      s.i++; ui.progreso(s.i / s.cola.length);
      var ultima = s.i >= s.cola.length;
      mostrarAcierto(ui.cont.querySelector('.extra-preg'), tarjetaVerde(q.okTitulo || q.resp, q.cita), function () {
        if (ultima) f.terminar(titulo, s.cola.length, extra ? extra() : 0);
        else { s.bloqueado = false; pintar(); }
      }, ultima ? 'Ver resultado ▶' : null);
    });
    Ayuda.poner(function () {
      if (s.bloqueado || s.i >= s.cola.length) return;
      s.errores++;
      var r = s.cola[s.i].resp;
      var b = [].filter.call(ui.cont.querySelectorAll('.opcion-mand'), function (x) { return x.dataset.v === r; })[0];
      marcarPista([b]);
    });
  }

  // ---------- Preguntas de discípulos y tribus ----------
  function preguntasSimples(lista, pool, icono, titulo) {
    var cola = Azar.mezclar(lista).slice(0, RONDA).map(function (q) {
      var falsas = unicos(Azar.mezclar(q.falsas || pool), [q.r]).slice(0, nOpciones() - 1);
      return { texto: '<p>' + q.p + '</p>', voz: q.p, resp: q.r, cita: q.cita, icono: icono, opciones: Azar.mezclar([q.r].concat(falsas)) };
    });
    cuestionario(cola, titulo);
  }

  // ---------- ¿Hijo de quién? ----------
  var Y = I18n.de(' y ', ' and ', ' e ');
  function respuesta(h) { return h.padre && h.madre ? h.padre + Y + h.madre : (h.padre || h.madre); }
  function preguntaHijo(h) { return preguntaHijo0(h).replace(' de el ', ' del '); }
  function preguntaHijo0(h) {
    if (h.padre && h.madre) return '¿Quiénes fueron los padres de ' + h.quien + '?';
    return (h.padre ? '¿Quién fue el padre de ' : '¿Quién fue la madre de ') + h.quien + '?';
  }
  // Opciones falsas. Para padre y madre se mezclan parejas "casi correctas":
  // el padre correcto con otra madre, la madre correcta con otro padre, y otras parejas.
  function falsasHijo(h) {
    var correcta = respuesta(h), n = nOpciones() - 1;
    // No ofrecer como padre/madre a la misma persona de la pregunta (ej.: "Saúl" para "el rey Saúl")
    var palabras = h.quien.split(/[ ,]+/);
    function noEsElMismo(nombre) { return nombre.split(Y).every(function (x) { return palabras.indexOf(x) < 0; }); }
    var conAmbos = D.hijos.filter(function (x) { return x.padre && x.madre; });
    var padres = unicos(D.hijos.filter(function (x) { return x.padre; }).map(function (x) { return x.padre; }));
    var madres = unicos(conAmbos.map(function (x) { return x.madre; }).concat(D.madresExtra));
    if (!(h.padre && h.madre)) {
      var pool = h.padre ? padres : unicos(D.hijos.filter(function (x) { return x.madre; }).map(function (x) { return x.madre; }).concat(D.madresExtra));
      return unicos(Azar.mezclar(pool), [correcta]).filter(noEsElMismo).slice(0, n);
    }
    // Esposas del mismo padre primero (Jacob: Lea, Raquel, Bilha, Zilpa)
    var mismasEsposas = Azar.mezclar(unicos(conAmbos.filter(function (x) { return x.padre === h.padre && x.madre !== h.madre; }).map(function (x) { return x.madre; })));
    var otrasMadres = Azar.mezclar(madres.filter(function (m) { return m !== h.madre; }));
    var mismaMadre = Azar.mezclar(unicos(conAmbos.filter(function (x) { return x.madre === h.madre && x.padre !== h.padre; }).map(function (x) { return x.padre; })));
    var otrosPadres = Azar.mezclar(padres.filter(function (p) { return p !== h.padre && p !== h.quien; }));
    var a = mismasEsposas.concat(otrasMadres).map(function (m) { return h.padre + Y + m; });
    var b = mismaMadre.concat(otrosPadres).map(function (p) { return p + Y + h.madre; });
    var c = Azar.mezclar(conAmbos.map(respuesta));
    var out = unicos([a[0], b[0]].concat(Azar.mezclar(a.slice(1, 4).concat(b.slice(1, 3), c.slice(0, 4)))), [correcta]);
    return out.filter(noEsElMismo).slice(0, n);
  }
  function iniciarHijo() {
    var cola = Azar.mezclar(D.hijos).slice(0, RONDA).map(function (h) {
      var r = respuesta(h), t = preguntaHijo(h);
      var tit = ((h.padre && h.madre ? 'Padres de ' : h.padre ? 'Padre de ' : 'Madre de ') + h.quien).replace(' de el ', ' del ') + ': ' + r;
      return { texto: '<p>' + t + '</p>', voz: t, resp: r, okTitulo: tit, cita: h.cita, icono: h.h ? '👧' : '👦',
        opciones: Azar.mezclar([r].concat(falsasHijo(h))) };
    });
    cuestionario(cola, '¡Conocés las familias de la Biblia!');
  }

  // ---------- ¿Quién soy? ----------
  // Se usan 3 pistas: 2 de las primeras al azar (en orden) y siempre la última, la más fácil.
  function elegirPistas(p) {
    var ult = p.pistas.length - 1, idx = Azar.mezclar(p.pistas.slice(0, ult).map(function (_, i) { return i; })).slice(0, 2).sort();
    return idx.map(function (i) { return p.pistas[i]; }).concat([p.pistas[ult]]);
  }
  function iniciarQuien() {
    s.pistasExtra = 0;
    var cola = Azar.mezclar(D.quienSoy).slice(0, RONDA).map(function (p) {
      var pistas = elegirPistas(p);
      var otros = D.quienSoy.filter(function (x) { return x.nombre !== p.nombre; }).map(function (x) { return x.nombre; });
      var q = { resp: p.nombre, cita: p.cita, icono: '🕵️', etiqueta: 'Personaje', consigna: '¿Quién soy?', voz: pistas[0],
        vozOk: '¡Soy ' + p.nombre + '!', okTitulo: '¡Soy ' + p.nombre + '!', pistas: pistas,
        opciones: Azar.mezclar([p.nombre].concat(Azar.mezclar(otros).slice(0, nOpciones() - 1))) };
      q.texto = textoPistas(pistas, 1);
      q.alPintar = function () {
        s.nPistas = 1;
        ui.cont.querySelector('.extra-preg').innerHTML = '<button class="btn-secundario btn-otra-pista">🔎 Otra pista</button>';
      };
      q.alAcertar = function () {
        ui.cont.querySelector('.extra-preg').innerHTML = '';
        ui.cont.querySelector('.txt-sit').innerHTML = textoPistas(pistas, pistas.length);
      };
      return q;
    });
    // Cada 2 pistas extra cuentan como 1 error
    cuestionario(cola, '¡Conocés a los personajes de la Biblia!', function () { return Math.floor(s.pistasExtra / 2); });
    ui.cont.querySelector('.extra-preg').addEventListener('click', function (ev) {
      if (!ev.target.closest('.btn-otra-pista') || s.bloqueado || s.i >= s.cola.length) return;
      var q = s.cola[s.i];
      if (s.nPistas >= q.pistas.length) return;
      Sonido.toque();
      s.nPistas++; s.pistasExtra++;
      ui.cont.querySelector('.txt-sit').innerHTML = textoPistas(q.pistas, s.nPistas);
      if (s.nPistas >= q.pistas.length) ev.target.closest('.btn-otra-pista').hidden = true;
      Voz.decir(q.pistas[s.nPistas - 1]);
    });
  }
  function textoPistas(pistas, n) {
    return pistas.slice(0, n).map(function (t, k) { return '<p class="pista-quien"><b>Pista ' + (k + 1) + ':</b> ' + t + '</p>'; }).join('');
  }

  window.JuegoNombres = {
    titulo: 'Aprendamos sobre nombres',
    modos: MODOS,
    estrellasModo: function (m) { return Estrellas.leer('nomb_' + m); },
    totalEstrellas: function () { return MODOS.reduce(function (a, m) { return a + Estrellas.leer('nomb_' + m.id); }, 0); },
    maxEstrellas: function () { return MODOS.length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0, bloqueado: false };
      ui = cabeceraJuego(raiz, MODOS.filter(function (m) { return m.id === modo; })[0].nombre);
      if (modo === 'discipulos') C.seleccion(s, ui, app, f, {
        consigna: 'Tocá los 12 discípulos de Jesús', cita: D.discipulos.cita,
        correctos: aTxt(D.discipulos.correctos), falsos: aTxt(D.discipulos.falsos),
        final: '¡Encontraste a los 12 discípulos!', titulo: '¡Los 12 discípulos!'
      });
      else if (modo === 'tribus') C.seleccion(s, ui, app, f, {
        consigna: 'Tocá los 12 hijos de Jacob (las 12 tribus de Israel)', cita: D.hijosJacob.cita,
        correctos: aTxt(D.hijosJacob.correctos), falsos: aTxt(D.hijosJacob.falsos),
        final: '¡Las 12 tribus de Israel!', titulo: '¡Los 12 hijos de Jacob!'
      });
      else if (modo === 'preg-discipulos') preguntasSimples(D.preguntasDiscipulos, D.discipulos.correctos, '🎣', '¡Conocés a los discípulos!');
      else if (modo === 'preg-tribus') preguntasSimples(D.preguntasTribus, D.hijosJacob.correctos, '⛺', '¡Conocés las tribus de Israel!');
      else if (modo === 'hijo') iniciarHijo();
      else iniciarQuien();
    }
  };
})();
