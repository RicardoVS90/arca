// Genera preguntas de opción múltiple para los desafíos y duelos en línea.
// Cada pregunta: { t: texto, o: [4 opciones], c: índice de la correcta, ref: cita o dato }
(function () {
  var OPC = 4;
  // Temas que se pueden elegir (uno o varios). "Todos" = la lista completa.
  var TEMAS = [
    { id: 'versiculos', nombre: 'Versículos', icono: '📖' },
    { id: 'nombres', nombre: 'Nombres bíblicos', icono: '👥' },
    { id: 'libros', nombre: 'Libros de la Biblia', icono: '📚' },
    { id: 'creacion', nombre: 'La creación', icono: '🌍' },
    { id: 'mandamientos', nombre: 'Los 10 mandamientos', icono: '📜' },
    { id: 'plagas', nombre: 'Las 10 plagas', icono: '🐸' },
    { id: 'santuario', nombre: 'El santuario', icono: '⛺' },
    { id: 'daniel', nombre: 'Daniel 2', icono: '🗿' },
    { id: 'remedios', nombre: 'Los 8 remedios', icono: '🌿' }
  ];
  var IDS = TEMAS.map(function (t) { return t.id; });
  // Normaliza lo guardado: lista de ids, o texto viejo ('mezcla' = todos)
  function listaTemas(tema) {
    if (Array.isArray(tema)) { var l = tema.filter(function (x) { return IDS.indexOf(x) >= 0; }); return l.length ? l : IDS.slice(); }
    if (!tema || tema === 'mezcla' || IDS.indexOf(tema) < 0) return IDS.slice();
    return [tema];
  }

  function azar(l) { return l[Math.floor(Math.random() * l.length)]; }
  function unicos(l) { var v = {}; return l.filter(function (x) { if (v[x]) return false; v[x] = 1; return true; }); }
  function armar(t, correcta, falsas, ref) {
    var f = Azar.mezclar(unicos(falsas.filter(function (x) { return x !== correcta; }))).slice(0, OPC - 1);
    var o = Azar.mezclar([correcta].concat(f));
    return { t: t, o: o, c: o.indexOf(correcta), ref: ref || '' };
  }

  var GEN = {
    versiculos: function () {
      var V = DATOS_VERSICULOS.versiculos, v = azar(V);
      if (v.texto.length >= 160 || Math.random() < 0.7) {
        var q1 = armar('¿Cuál es la cita de este versículo?\n«' + v.texto + '»', v.cita, V.map(function (x) { return x.cita; }), 'RV1960');
        q1.v = 1; return q1;
      }
      var otros = V.filter(function (x) { return x.texto.length < 160; }).map(function (x) { return x.texto; });
      var q2 = armar('¿Qué dice ' + v.cita + '?', v.texto, otros, v.cita);
      q2.v = 1; return q2;
    },
    nombres: function () {
      var D = DATOS_NOMBRES, r = Math.random();
      if (r < 0.3) {
        var h = azar(D.hijos);
        var resp = function (x) { return x.padre && x.madre ? x.padre + ' y ' + x.madre : (x.padre || x.madre); };
        var mismos = D.hijos.filter(function (x) { return !!x.padre === !!h.padre && !!x.madre === !!h.madre; }).map(resp);
        var preg = h.padre && h.madre ? '¿Quiénes fueron los padres de ' + h.quien + '?' :
          (h.padre ? '¿Quién fue el padre de ' : '¿Quién fue la madre de ') + h.quien + '?';
        if (!h.padre) mismos = mismos.concat(D.madresExtra);
        return armar(preg.replace(' de el ', ' del '), resp(h), mismos, h.cita);
      }
      if (r < 0.55) {
        var p = azar(D.quienSoy);
        return armar('¿Quién soy?\n' + p.pistas.slice(-2).join(' '), p.nombre, D.quienSoy.map(function (x) { return x.nombre; }), p.cita);
      }
      if (r > 0.85) {
        var x = azar(D.otrosNombres);
        return armar(x.p, x.r, x.falsas, x.cita);
      }
      var usarDisc = r < 0.72, lista = usarDisc ? D.preguntasDiscipulos : D.preguntasTribus;
      var q = azar(lista);
      return armar(q.p, q.r, q.falsas || (usarDisc ? D.discipulos.correctos : D.hijosJacob.correctos), q.cita);
    },
    mandamientos: function () {
      var D = DATOS_MANDAMIENTOS, s = azar(D.situaciones);
      var nombre = function (m) { return m.n + '° ' + m.corto; };
      var m = D.mandamientos.filter(function (x) { return x.n === s.n; })[0];
      return armar('¿Qué mandamiento se relaciona con esta situación?\n' + s.texto, nombre(m), D.mandamientos.map(nombre), m.cita);
    },
    plagas: function () {
      var P = DATOS_PLAGAS.plagas, p = azar(P);
      return armar('¿Qué plaga fue?\n' + p.pista, p.nombre, P.map(function (x) { return x.nombre; }), p.cita);
    },
    libros: function () {
      var L = DATOS_LIBROS.todos.map(function (x) { return x.nombre; }), i = Math.floor(Math.random() * L.length);
      var antes = Math.random() < 0.5, NING = 'Ninguno', libro = L[i];
      var j = antes ? i - 1 : i + 1, correcta = L[j] || NING;
      // Trampas: libros cercanos y el vecino del otro lado
      var trampas = [L[antes ? i + 1 : i - 1], L[antes ? i - 2 : i + 2], L[antes ? i - 3 : i + 3], L[antes ? i + 2 : i - 2]].filter(Boolean);
      if (correcta !== NING && Math.random() < 0.5) trampas.push(NING);
      return armar('¿Qué libro está ' + (antes ? 'ANTES' : 'DESPUÉS') + ' de ' + libro + '?', correcta, trampas,
        correcta === NING ? libro + (antes ? ' es el primer libro de la Biblia' : ' es el último libro de la Biblia') : '');
    },
    creacion: function () {
      var C = DATOS_CREACION, e = azar(C.elementos), d = C.dias[e.dia - 1];
      var dias = C.dias.map(function (x) { return 'Día ' + x.n; });
      return armar('¿Qué día de la creación hizo Dios esto?\n' + e.nombre, 'Día ' + e.dia, dias, d.cita);
    },
    santuario: function () {
      var S = DATOS_SANTUARIO, m = azar(S.muebles), lug = S.lugares;
      return armar('¿En qué parte del santuario estaba?\n' + m.nombre, lug[m.lugar], [lug.atrio, lug.santo, lug.santisimo], m.jesus);
    },
    daniel: function () {
      var P = DATOS_DANIEL.partes, p = azar(P);
      if (Math.random() < 0.6) {
        return armar('En la estatua de Daniel 2, ¿qué reino ' + (p.id === 'cabeza' ? 'representa ' : 'representan ') + p.parte.toLowerCase() + ' de ' + p.metal.toLowerCase() + '?',
          p.imperio, P.map(function (x) { return x.imperio; }), p.cita);
      }
      return armar('En la estatua de Daniel 2, ¿de qué metal era la parte que representa a ' + p.imperio + '?',
        p.metal, P.map(function (x) { return x.metal; }), p.cita);
    },
    remedios: function () {
      var R = DATOS_REMEDIOS, nombres = R.remedios.map(function (x) { return x.nombre; });
      if (Math.random() < 0.5) {
        var r = azar(R.remedios);
        return armar('¿Qué remedio natural es?\n' + azar(r.desc), r.nombre, nombres);
      }
      var s = azar(R.situaciones), rr = R.remedios.filter(function (x) { return x.n === s.r; })[0];
      return armar(s.t + '\n' + s.p, rr.nombre, nombres);
    }
  };

  // Reparte las preguntas entre los temas elegidos, lo más parejo posible
  function generar(tema, n) {
    var temas = listaTemas(tema), turnos = [];
    while (turnos.length < n) turnos = turnos.concat(Azar.mezclar(temas));
    turnos = Azar.mezclar(turnos.slice(0, n));
    var out = [], vistos = {};
    turnos.forEach(function (tm) {
      // Primero su tema; si ya no quedan preguntas nuevas, otro de los elegidos; si no, se permite repetir
      var orden = [tm].concat(Azar.mezclar(temas.filter(function (x) { return x !== tm; }))), q = null;
      for (var k = 0; k < orden.length && !q; k++) {
        for (var i = 0; i < 30; i++) { var c = GEN[orden[k]](); if (!vistos[c.t]) { q = c; q.tema = orden[k]; break; } }
      }
      if (!q) { q = GEN[tm](); q.tema = tm; }
      vistos[q.t] = 1; out.push(q);
    });
    return out;
  }

  window.PreguntasOnline = { TEMAS: TEMAS, generar: generar, listaTemas: listaTemas };
})();
