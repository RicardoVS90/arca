// Juego: memorizar versículos (RV1960)
// Modo "libro": se muestra el versículo completo y se elige su cita completa (libro, capítulo y versículo).
// Modo "cita": se muestra la cita (ej. Juan 3:16) y se elige qué dice.
// Modo "examen" (solo Conquistadores): 20 preguntas sin corrección; correcta +1, incorrecta −2, "No sé" 0.
//   Las primeras 10 muestran el versículo (se elige la cita); las últimas 10 muestran la cita (se elige el texto).
//   Al final muestra puntos, porcentaje y la lista de versículos para repasar.
// Modo "repaso": práctica con corrección usando solo los versículos que fallaron en el examen.
// Todos los temas van mezclados. Texto: Reina-Valera 1960.
(function () {
  var D = window.DATOS_VERSICULOS;
  var OPCIONES = { aventureros: 3, ninguno: 4, conquistadores: 5 };
  var RONDAS = 10;
  var EXAMEN = { preguntas: 20, correcta: 1, incorrecta: -2, nose: 0 };

  var MODOS = [
    { id: 'libro', nombre: '¿Cuál es la cita?', icono: '📖', imagen: 'img/modos/biblia.webp', desc: 'Leé el versículo y elegí su cita completa' },
    { id: 'cita', nombre: '¿Qué dice el versículo?', icono: '🔢', imagen: 'img/modos/pergamino.webp', desc: 'Mirá la cita y elegí el texto correcto' },
    { id: 'examen', nombre: 'Examen', icono: '📝', imagen: 'img/modos/examen.webp', club: 'conquistadores',
      desc: '20 preguntas sin corrección. Correcta +1, incorrecta −2, No sé 0. Respondé solo si sabés' }
  ];
  function modosDelClub() {
    var club = (Almacen.leer('perfil', {}) || {}).club;
    return MODOS.filter(function (m) { return !m.club || m.club === club; });
  }

  var s, ui, app;

  function categoria(id) { return D.categorias.filter(function (c) { return c.id === id; })[0]; }

  function fallo(el) {
    Sonido.error();
    s.errores++; s.seguidos++;
    if (el) marcarError(el);
    if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
  }

  function terminar() {
    var est = Estrellas.calcular(s.errores);
    if (s.modo !== 'repaso') Estrellas.guardar('vers_' + s.modo, est);
    Sonido.victoria();
    setTimeout(function () {
      app.resultado({ juego: 'versiculos', modo: s.modo, estrellas: est, errores: s.errores, aciertos: s.cola.length,
        titulo: s.errores === 0 ? '¡Conocés muy bien la Palabra de Dios!' : '¡Seguí memorizando la Palabra!' });
    }, 900);
  }

  // Elige los versículos de la ronda, priorizando los que el niño todavía no vio
  function elegirRonda(cantidad) {
    var RONDAS = cantidad || 10;
    var pool = D.versiculos;
    var vistos = Almacen.leer('vers_vistos', []);
    var nuevos = pool.filter(function (v) { return vistos.indexOf(v.id) < 0; });
    if (nuevos.length < RONDAS) {
      // Ya vio casi todos: se reinicia el registro
      vistos = [];
      nuevos = pool;
    }
    var ronda = Azar.mezclar(nuevos).slice(0, RONDAS);
    Almacen.guardar('vers_vistos', vistos.concat(ronda.map(function (v) { return v.id; })).slice(-250));
    return ronda;
  }


  // Acepta citas simples (Juan 3:16) y de varios versículos (Proverbios 3:5-6)
  function partes(cita) {
    var m = cita.match(/^(.+) (\d+):(\d+)(?:-(\d+))?$/);
    return { libro: m[1], cap: +m[2], ver: +m[3], hasta: m[4] ? +m[4] : 0 };
  }

  // Citas falsas pero creíbles: otros versículos del mismo libro, o el versículo de al lado
  function citasCercanas(v) {
    var p = partes(v.cita), out = [];
    D.versiculos.forEach(function (x) { if (x.libro === v.libro && x.cita !== v.cita) out.push(x.cita); });
    out = Azar.mezclar(out);
    var d = p.ver > 2 ? -1 : 1;
    out.push(p.libro + ' ' + p.cap + ':' + (p.ver + d) + (p.hasta ? '-' + (p.hasta + d) : ''));
    return out;
  }

  // Opciones falsas sin patrón fijo: a veces varias del mismo libro, a veces ninguna
  function distractoresCita(v, n) {
    var usadas = [v.cita], out = [];
    function agregar(c) { if (out.length < n && usadas.indexOf(c) < 0) { usadas.push(c); out.push(c); } }
    var mismoLibro = Math.floor(Math.random() * (n + 1));
    citasCercanas(v).slice(0, mismoLibro).forEach(agregar);
    Azar.mezclar(D.versiculos.filter(function (x) { return x.libro !== v.libro; })).forEach(function (x) { agregar(x.cita); });
    return Azar.mezclar(out);
  }

  function distractoresTexto(v, n) {
    var otros = D.versiculos.filter(function (x) { return x.id !== v.id && x.texto !== v.texto; });
    var mismo = Azar.mezclar(otros.filter(function (x) { return x.libro === v.libro; }));
    var resto = Azar.mezclar(otros.filter(function (x) { return x.libro !== v.libro; }));
    var k = Math.min(mismo.length, Math.floor(Math.random() * (n + 1)));
    return Azar.mezclar(mismo.slice(0, k).concat(resto.slice(0, n - k))).map(function (x) { return x.texto; });
  }

  function empezar() {
    s.texto = function (v) { return v.texto; };
    if (s.modo === 'repaso') {
      var ids = Almacen.leer('vers_repaso', []);
      s.cola = Azar.mezclar(D.versiculos.filter(function (v) { return ids.indexOf(v.id) >= 0; }));
    } else {
      s.cola = elegirRonda(s.modo === 'examen' ? EXAMEN.preguntas : RONDAS);
    }
    // En examen y repaso cada pregunta puede ser de un tipo u otro
    s.tipos = s.cola.map(function (v, i) {
      if (s.modo === 'libro' || s.modo === 'cita') return s.modo;
      if (s.modo === 'examen') return i < s.cola.length / 2 ? 'libro' : 'cita';
      return Math.random() < 0.5 ? 'libro' : 'cita';
    });
    s.respuestas = [];
    s.i = 0;
    ui.progreso(0);
    ui.cont.innerHTML =
      '<div class="tarjeta-versiculo"></div>' +
      '<p class="consigna"></p>' +
      '<div class="opciones opciones-vers"></div>' +
      '<div class="zona-siguiente"></div>' +
      (s.modo === 'examen' ? '<button class="btn-nose">🤷 No sé</button>' : '');
    if (s.modo === 'examen') {
      Ayuda.poner(null);
      ui.cont.querySelector('.btn-nose').addEventListener('click', function () { responderExamen(null); });
      ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
        var b = ev.target.closest('.opcion-mand');
        if (b) responderExamen(b);
      });
      ronda();
      return;
    }
    Ayuda.poner(function () {
      if (s.i >= s.cola.length || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.opcion-mand[data-ok="1"]')]);
    });
    ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || s.bloqueado || s.i >= s.cola.length) return;
      if (b.dataset.ok !== '1') { fallo(b); return; }
      acertar(b);
    });
    ronda();
  }

  function ronda() {
    var v = s.cola[s.i], n = (OPCIONES[s.club] || 4) - 1, tipo = s.tipos[s.i];
    var cat = categoria(v.cat);
    var tarjeta = ui.cont.querySelector('.tarjeta-versiculo');
    var ops;
    tarjeta.style.animation = 'none'; void tarjeta.offsetWidth; tarjeta.style.animation = '';
    if (tipo === 'libro') {
      tarjeta.innerHTML = '<span class="tema">' + cat.icono + ' ' + cat.nombre + '</span>' +
        '<p class="texto-vers">“' + s.texto(v) + '”</p>';
      ui.cont.querySelector('.consigna').textContent = '¿Cuál es la cita de este versículo?';
      ops = [{ txt: v.cita, ok: true }].concat(distractoresCita(v, n).map(function (c) { return { txt: c }; }));
      Voz.leer(s.texto(v));
    } else {
      tarjeta.innerHTML = '<span class="tema">' + cat.icono + ' ' + cat.nombre + '</span>' +
        '<p class="cita-grande">' + v.cita + '</p>';
      ui.cont.querySelector('.consigna').textContent = '¿Qué dice este versículo?';
      ops = [{ txt: s.texto(v), ok: true }].concat(distractoresTexto(v, n).map(function (t) { return { txt: t }; }));
      Voz.leer(v.cita.replace(':', ', '));
    }
    if (s.modo === 'examen') {
      var cons = ui.cont.querySelector('.consigna');
      cons.innerHTML = '<span class="num-pregunta">Pregunta ' + (s.i + 1) + ' de ' + s.cola.length + '</span>' + cons.textContent;
    }
    ui.cont.querySelector('.opciones').innerHTML = Azar.mezclar(ops).map(function (o) {
      return '<button class="opcion-mand' + (tipo === 'cita' ? ' opcion-texto' : '') + '"' + (o.ok ? ' data-ok="1"' : '') + '>' +
        '<span class="txt">' + o.txt + '</span></button>';
    }).join('');
  }

  function acertar(b) {
    var v = s.cola[s.i];
    Sonido.acierto();
    s.seguidos = 0;
    s.bloqueado = true;
    b.classList.add('correcta');
    Voz.decir(v.cita.replace(':', ', '), true);
    s.i++;
    ui.progreso(s.i / s.cola.length);
    if (s.i === 5) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
    var ultima = s.i >= s.cola.length;
    mostrarAcierto(ui.cont.querySelector('.zona-siguiente'), '', function () {
      if (ultima) terminar(); else { s.bloqueado = false; ronda(); }
    }, ultima ? 'Ver resultado ▶' : null);
  }

  // ---------- Examen ----------
  function responderExamen(b) {
    if (s.bloqueado || s.i >= s.cola.length) return;
    var v = s.cola[s.i], tipo = s.tipos[s.i];
    s.bloqueado = true;
    Sonido.toque();
    var r = { v: v, tipo: tipo, nose: !b, ok: !!(b && b.dataset.ok === '1'),
              elegida: b ? b.querySelector('.txt').textContent : null };
    s.respuestas.push(r);
    // Sin corrección: solo se marca lo elegido, sin decir si está bien o mal
    if (b) b.classList.add('elegida'); else ui.cont.querySelector('.btn-nose').classList.add('elegida');
    s.i++;
    ui.progreso(s.i / s.cola.length);
    Voz.despues(500, function () {
      s.bloqueado = s.i >= s.cola.length;
      var nb = ui.cont.querySelector('.btn-nose'); if (nb) nb.classList.remove('elegida');
      if (s.i >= s.cola.length) terminarExamen(); else ronda();
    });
  }

  function terminarExamen() {
    var c = 0, inc = 0, ns = 0;
    s.respuestas.forEach(function (r) { if (r.nose) ns++; else if (r.ok) c++; else inc++; });
    var puntos = c * EXAMEN.correcta + inc * EXAMEN.incorrecta + ns * EXAMEN.nose;
    var maximo = s.cola.length * EXAMEN.correcta;
    // Porcentaje sobre los puntos; nunca baja de 0 y desde ,5 redondea a favor del jugador
    var pct = Math.floor(Math.max(0, puntos) * 100 / maximo + 0.5);
    var est = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    Estrellas.guardar('vers_examen', est);
    var repaso = s.respuestas.filter(function (r) { return !r.ok; });
    Almacen.guardar('vers_repaso', repaso.map(function (r) { return r.v.id; }));
    Sonido.victoria();
    setTimeout(function () {
      app.resultado({
        juego: 'versiculos', modo: 'examen', estrellas: est,
        titulo: pct >= 70 ? '¡Muy buen examen!' : '¡Examen terminado!',
        examen: {
          correctas: c, incorrectas: inc, nose: ns, puntos: puntos, maximo: maximo, porcentaje: pct,
          reglas: EXAMEN,
          repaso: repaso.map(function (r) {
            return { cita: r.v.cita, texto: r.v.texto, tipo: r.tipo, nose: r.nose, elegida: r.elegida };
          })
        }
      });
    }, 700);
  }

  window.JuegoVersiculos = {
    titulo: 'Versículos',
    get modos() { return modosDelClub(); },
    estrellasModo: function (m) { return Estrellas.leer('vers_' + m); },
    totalEstrellas: function () { return modosDelClub().reduce(function (a, m) { return a + Estrellas.leer('vers_' + m.id); }, 0); },
    maxEstrellas: function () { return modosDelClub().length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0 };
      var info = MODOS.filter(function (m) { return m.id === modo; })[0];
      ui = cabeceraJuego(raiz, info ? info.nombre : 'Repaso de versículos');
      empezar();
    }
  };
})();
