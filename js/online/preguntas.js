// Genera preguntas de opción múltiple para los desafíos y duelos en línea (y el Desafío de hoy).
// Cada pregunta: { t: texto, o: [4 opciones], c: índice de la correcta, ref: cita o dato, k: receta }
// "k" es la receta de la pregunta (qué dato y qué opciones), sin textos: así cada jugador la ve en su idioma
// aunque la haya creado alguien que juega en otro. t/o/ref quedan en el idioma de quien la creó, para versiones viejas.
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
  function azarI(l) { return Math.floor(Math.random() * l.length); }
  function rango(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
  var T = function (s) { return window.I18n ? I18n.t(s) : s; };
  var de = function (es, en, pt) { return window.I18n ? I18n.de(es, en, pt) : es; };

  // ---------- Recetas: cómo se arma el texto de cada tipo de pregunta con los datos del idioma actual
  // R[g] = { t: fn(a) -> texto, op: fn(a, clave) -> texto de la opción, ref: fn(a) -> cita }
  var R = {
    // Versículo: ¿cuál es la cita?
    vc: { t: function (a) { return T('¿Cuál es la cita de este versículo?') + '\n«' + DATOS_VERSICULOS.versiculos[a.i].texto + '»'; },
      op: function (a, k) { return DATOS_VERSICULOS.versiculos[k].cita; }, ref: function () { return 'RV1960'; }, v: 1 },
    // Versículo: ¿qué dice?
    vt: { t: function (a) { return T('¿Qué dice {}?'.replace('{}', DATOS_VERSICULOS.versiculos[a.i].cita)); },
      op: function (a, k) { return DATOS_VERSICULOS.versiculos[k].texto; }, ref: function (a) { return DATOS_VERSICULOS.versiculos[a.i].cita; }, v: 1 },
    // ¿Hijo de quién?
    nh: { t: function (a) { var h = DATOS_NOMBRES.hijos[a.i];
        var p = h.padre && h.madre ? '¿Quiénes fueron los padres de {}?' : h.padre ? '¿Quién fue el padre de {}?' : '¿Quién fue la madre de {}?';
        return T(p.replace('{}', h.quien)).replace(' de el ', ' del '); },
      op: function (a, k) {
        if (k.charAt(0) === 'm') return DATOS_NOMBRES.madresExtra[+k.slice(1)];
        var x = DATOS_NOMBRES.hijos[+k.slice(1)], Y = de(' y ', ' and ', ' e ');
        return x.padre && x.madre ? x.padre + Y + x.madre : (x.padre || x.madre); },
      ref: function (a) { return DATOS_NOMBRES.hijos[a.i].cita; } },
    // ¿Quién soy?
    nq: { t: function (a) { return T('¿Quién soy?') + '\n' + DATOS_NOMBRES.quienSoy[a.i].pistas.slice(-2).join(' '); },
      op: function (a, k) { return DATOS_NOMBRES.quienSoy[k].nombre; }, ref: function (a) { return DATOS_NOMBRES.quienSoy[a.i].cita; } },
    // Otros nombres, preguntas de discípulos y de tribus: opción 'r' = respuesta, 'f3' = falsa nº 3, 'c3' = de la lista de correctos
    no: preguntaLista(function () { return DATOS_NOMBRES.otrosNombres; }, null),
    nd: preguntaLista(function () { return DATOS_NOMBRES.preguntasDiscipulos; }, function () { return DATOS_NOMBRES.discipulos.correctos; }),
    nt: preguntaLista(function () { return DATOS_NOMBRES.preguntasTribus; }, function () { return DATOS_NOMBRES.hijosJacob.correctos; }),
    // Mandamientos: situación -> mandamiento
    ma: { t: function (a) { return T('¿Qué mandamiento se relaciona con esta situación?') + '\n' + DATOS_MANDAMIENTOS.situaciones[a.i].texto; },
      op: function (a, k) { var m = DATOS_MANDAMIENTOS.mandamientos[k]; return de(m.n + '° ', m.n + '. ', m.n + 'º ') + m.corto; },
      ref: function (a) { var s = DATOS_MANDAMIENTOS.situaciones[a.i];
        return DATOS_MANDAMIENTOS.mandamientos.filter(function (x) { return x.n === s.n; })[0].cita; } },
    pl: { t: function (a) { return T('¿Qué plaga fue?') + '\n' + DATOS_PLAGAS.plagas[a.i].pista; },
      op: function (a, k) { return DATOS_PLAGAS.plagas[k].nombre; }, ref: function (a) { return DATOS_PLAGAS.plagas[a.i].cita; } },
    // Libros: qué libro está antes / después
    li: { t: function (a) { var L = DATOS_LIBROS.todos, l = L[a.i].nombre;
        return de('¿Qué libro está ' + (a.antes ? 'ANTES' : 'DESPUÉS') + ' de ' + l + '?',
          'Which book comes ' + (a.antes ? 'BEFORE' : 'AFTER') + ' ' + l + '?',
          'Qual livro vem ' + (a.antes ? 'ANTES' : 'DEPOIS') + ' de ' + l + '?'); },
      op: function (a, k) { return k === 'N' ? T('Ninguno') : DATOS_LIBROS.todos[k].nombre; },
      ref: function (a) { var L = DATOS_LIBROS.todos, l = L[a.i].nombre, j = a.antes ? a.i - 1 : a.i + 1;
        if (L[j]) return '';
        return a.antes ? de(l + ' es el primer libro de la Biblia', l + ' is the first book of the Bible', l + ' é o primeiro livro da Bíblia')
          : de(l + ' es el último libro de la Biblia', l + ' is the last book of the Bible', l + ' é o último livro da Bíblia'); } },
    cr: { t: function (a) { return T('¿Qué día de la creación hizo Dios esto?') + '\n' + DATOS_CREACION.elementos[a.i].nombre; },
      op: function (a, k) { return T('Día {n}'.replace('{n}', k)); },
      ref: function (a) { return DATOS_CREACION.dias[DATOS_CREACION.elementos[a.i].dia - 1].cita; } },
    sa: { t: function (a) { return T('¿En qué parte del santuario estaba?') + '\n' + DATOS_SANTUARIO.muebles[a.i].nombre; },
      op: function (a, k) { return DATOS_SANTUARIO.lugares[k]; }, ref: function (a) { return DATOS_SANTUARIO.muebles[a.i].jesus; } },
    // Daniel 2: reino de una parte, o metal de un reino
    d1: { t: function (a) { var p = DATOS_DANIEL.partes[a.i], uno = p.id === 'cabeza', pa = p.parte.toLowerCase(), me = p.metal.toLowerCase();
        return de('En la estatua de Daniel 2, ¿qué reino ' + (uno ? 'representa ' : 'representan ') + pa + ' de ' + me + '?',
          'In the statue of Daniel 2, which kingdom ' + (uno ? 'does ' : 'do ') + pa + ' of ' + me + ' represent?',
          'Na estátua de Daniel 2, que reino ' + (uno ? 'representa ' : 'representam ') + pa + ' de ' + me + '?'); },
      op: function (a, k) { return DATOS_DANIEL.partes[k].imperio; }, ref: function (a) { return DATOS_DANIEL.partes[a.i].cita; } },
    d2: { t: function (a) { var im = DATOS_DANIEL.partes[a.i].imperio;
        return de('En la estatua de Daniel 2, ¿de qué metal era la parte que representa a ' + im + '?',
          'In the statue of Daniel 2, what metal was the part that represents ' + im.replace(/^The /, 'the ') + '?',
          'Na estátua de Daniel 2, de que metal era a parte que representa ' + im.replace(/^Os /, 'os ') + '?'); },
      op: function (a, k) { return DATOS_DANIEL.partes[k].metal; }, ref: function (a) { return DATOS_DANIEL.partes[a.i].cita; } },
    r1: { t: function (a) { return T('¿Qué remedio natural es?') + '\n' + DATOS_REMEDIOS.remedios[a.i].desc[a.j]; },
      op: function (a, k) { return DATOS_REMEDIOS.remedios[k].nombre; }, ref: function () { return ''; } },
    r2: { t: function (a) { var s = DATOS_REMEDIOS.situaciones[a.i]; return s.t + '\n' + s.p; },
      op: function (a, k) { return DATOS_REMEDIOS.remedios[k].nombre; }, ref: function () { return ''; } }
  };
  function preguntaLista(lista, correctos) {
    return {
      t: function (a) { return lista()[a.i].p; },
      op: function (a, k) {
        var q = lista()[a.i];
        if (k === 'r') return q.r;
        if (k.charAt(0) === 'f') return q.falsas[+k.slice(1)];
        return correctos()[+k.slice(1)];
      },
      ref: function (a) { return lista()[a.i].cita; }
    };
  }

  // Texto completo de una receta con los datos del idioma actual
  function textos(k) {
    var r = R[k.g];
    return { t: r.t(k.a), o: k.o.map(function (x) { return r.op(k.a, x); }), ref: r.ref(k.a) };
  }
  // Arma la pregunta: la correcta + 3 falsas sin repetir texto
  function armar(g, a, correcta, falsas) {
    var r = R[g], txt = function (x) { return r.op(a, x); }, ct = txt(correcta), vistos = {};
    vistos[ct] = 1;
    var f = Azar.mezclar(falsas).filter(function (x) { var t = txt(x); if (!t || vistos[t]) return false; vistos[t] = 1; return true; }).slice(0, OPC - 1);
    var o = Azar.mezclar([correcta].concat(f));
    var k = { g: g, a: a, o: o };
    var q = textos(k);
    q.c = o.indexOf(correcta); q.k = k;
    if (r.v) q.v = 1;
    return q;
  }

  var GEN = {
    versiculos: function () {
      var V = DATOS_VERSICULOS.versiculos, i = azarI(V);
      if (V[i].texto.length >= 160 || Math.random() < 0.7) return armar('vc', { i: i }, i, rango(V.length).filter(function (x) { return x !== i; }));
      var cortos = rango(V.length).filter(function (x) { return x !== i && V[x].texto.length < 160; });
      return armar('vt', { i: i }, i, cortos);
    },
    nombres: function () {
      var D = DATOS_NOMBRES, r = Math.random();
      if (r < 0.3) {
        var i = azarI(D.hijos), h = D.hijos[i];
        var mismos = rango(D.hijos.length).filter(function (k) { var x = D.hijos[k]; return k !== i && !!x.padre === !!h.padre && !!x.madre === !!h.madre; })
          .map(function (k) { return 'h' + k; });
        if (!h.padre) mismos = mismos.concat(rango(D.madresExtra.length).map(function (k) { return 'm' + k; }));
        return armar('nh', { i: i }, 'h' + i, mismos);
      }
      if (r < 0.55) {
        var j = azarI(D.quienSoy);
        return armar('nq', { i: j }, j, rango(D.quienSoy.length).filter(function (x) { return x !== j; }));
      }
      if (r > 0.85) {
        var o = azarI(D.otrosNombres);
        return armar('no', { i: o }, 'r', rango(D.otrosNombres[o].falsas.length).map(function (k) { return 'f' + k; }));
      }
      var usarDisc = r < 0.72, lista = usarDisc ? D.preguntasDiscipulos : D.preguntasTribus;
      var corr = usarDisc ? D.discipulos.correctos : D.hijosJacob.correctos;
      var n = azarI(lista), q = lista[n];
      var falsas = q.falsas ? rango(q.falsas.length).map(function (k) { return 'f' + k; })
        : rango(corr.length).filter(function (k) { return corr[k] !== q.r; }).map(function (k) { return 'c' + k; });
      return armar(usarDisc ? 'nd' : 'nt', { i: n }, 'r', falsas);
    },
    mandamientos: function () {
      var D = DATOS_MANDAMIENTOS, i = azarI(D.situaciones), s = D.situaciones[i];
      var m = rango(D.mandamientos.length).filter(function (k) { return D.mandamientos[k].n === s.n; })[0];
      return armar('ma', { i: i }, m, rango(D.mandamientos.length).filter(function (k) { return k !== m; }));
    },
    plagas: function () {
      var P = DATOS_PLAGAS.plagas, i = azarI(P);
      return armar('pl', { i: i }, i, rango(P.length).filter(function (k) { return k !== i; }));
    },
    libros: function () {
      var L = DATOS_LIBROS.todos, i = azarI(L), antes = Math.random() < 0.5;
      var j = antes ? i - 1 : i + 1, correcta = L[j] ? j : 'N';
      // Trampas: libros cercanos y el vecino del otro lado
      var trampas = [antes ? i + 1 : i - 1, antes ? i - 2 : i + 2, antes ? i - 3 : i + 3, antes ? i + 2 : i - 2].filter(function (k) { return k >= 0 && k < L.length; });
      if (correcta !== 'N' && Math.random() < 0.5) trampas.push('N');
      return armar('li', { i: i, antes: antes }, correcta, trampas);
    },
    creacion: function () {
      var C = DATOS_CREACION, i = azarI(C.elementos), e = C.elementos[i];
      return armar('cr', { i: i }, e.dia, C.dias.map(function (x) { return x.n; }).filter(function (n) { return n !== e.dia; }));
    },
    santuario: function () {
      var S = DATOS_SANTUARIO, i = azarI(S.muebles), m = S.muebles[i];
      return armar('sa', { i: i }, m.lugar, ['atrio', 'santo', 'santisimo'].filter(function (x) { return x !== m.lugar; }));
    },
    daniel: function () {
      var P = DATOS_DANIEL.partes, i = azarI(P), otras = rango(P.length).filter(function (k) { return k !== i; });
      return armar(Math.random() < 0.6 ? 'd1' : 'd2', { i: i }, i, otras);
    },
    remedios: function () {
      var Rm = DATOS_REMEDIOS, todos = rango(Rm.remedios.length);
      if (Math.random() < 0.5) {
        var i = azarI(Rm.remedios), j = azarI(Rm.remedios[i].desc);
        return armar('r1', { i: i, j: j }, i, todos.filter(function (k) { return k !== i; }));
      }
      var s = azarI(Rm.situaciones), rr = todos.filter(function (k) { return Rm.remedios[k].n === Rm.situaciones[s].r; })[0];
      return armar('r2', { i: s }, rr, todos.filter(function (k) { return k !== rr; }));
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

  // La pregunta en el idioma de este jugador (si trae receta). Las viejas, sin receta, quedan como vinieron.
  function local(q) {
    if (!q || !q.k || !R[q.k.g]) return q;
    try {
      var x = textos(q.k);
      if (!x.t || x.o.some(function (o) { return o == null; })) return q;
      var out = {}; Object.keys(q).forEach(function (k) { out[k] = q[k]; });
      out.t = x.t; out.o = x.o; out.ref = x.ref;
      return out;
    } catch (e) { return q; }
  }

  window.PreguntasOnline = { TEMAS: TEMAS, generar: generar, listaTemas: listaTemas, local: local };
})();
