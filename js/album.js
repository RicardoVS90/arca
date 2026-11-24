// Álbum de personajes: tarjetas que se ganan jugando (estrellas, logros y racha del desafío diario).
(function () {
  var A = window.DATOS_ALBUM;
  var mostrando = false, cola = [];

  function datos() { return Almacen.leer('album', null) || { tiene: {}, ev: {} }; }
  function guardar(d) { Almacen.guardar('album', d); }
  function modulos() {
    return [window.JuegoLibros, window.JuegoMandamientos, window.JuegoCreacion, window.JuegoPlagas, window.JuegoSantuario,
      window.JuegoDaniel, window.JuegoVersiculos, window.JuegoNombres, window.JuegoRemedios, window.JuegoSopa].filter(Boolean);
  }
  function totalEstrellas() { return modulos().reduce(function (a, m) { try { return a + m.totalEstrellas(); } catch (e) { return a; } }, 0); }
  function islasCompletas() {
    return modulos().filter(function (m) { try { return m.maxEstrellas() > 0 && m.totalEstrellas() >= m.maxEstrellas(); } catch (e) { return false; } }).length;
  }

  // Eventos que vienen de los juegos y del juego en línea
  function evento(tipo, extra) {
    var d = datos(), ev = d.ev;
    if (tipo === 'partida') { ev.partidas = (ev.partidas || 0) + 1; if (extra && extra.estrellas === 3) ev.tres = 1; }
    else if (tipo === 'duelo-jugado') ev.duelos = (ev.duelos || 0) + 1;
    else if (tipo === 'duelo-ganado') ev.duelosGanados = (ev.duelosGanados || 0) + 1;
    else if (tipo === 'desafio-ganado') { ev.desafios = ev.desafios || []; if (extra && ev.desafios.indexOf(extra) < 0) ev.desafios.push(extra); }
    else if (tipo === 'amigo') ev.amigo = 1;
    guardar(d);
  }

  function logroCumplido(id, ev) {
    var dia = window.Diario ? Diario.estado() : { total: 0 };
    switch (id) {
      case 'primera-partida': return (ev.partidas || 0) > 0;
      case 'tres-estrellas': return !!ev.tres;
      case 'isla-completa': return islasCompletas() >= 1;
      case 'tres-islas': return islasCompletas() >= 3;
      case 'primer-duelo': return (ev.duelos || 0) > 0;
      case 'ganar-duelo': return (ev.duelosGanados || 0) > 0;
      case 'ganar-desafio': return (ev.desafios || []).length >= 1;
      case 'cinco-desafios': return (ev.desafios || []).length >= 5;
      case 'amigo': return !!ev.amigo;
      case 'primer-diario': return (dia.total || 0) > 0;
      case 'diez-diarios': return (dia.total || 0) >= 10;
    }
    return false;
  }

  // Revisa qué tarjetas nuevas se ganaron. Devuelve la lista de las nuevas.
  function revisar() {
    var d = datos(), nuevas = [], hoy = Date.now();
    function dar(t) { d.tiene[t.id] = hoy; nuevas.push(t); }
    A.tarjetas.forEach(function (t) {
      if (d.tiene[t.id]) return;
      var p = t.gana.split(':');
      if (p[0] === 'logro' && logroCumplido(p[1], d.ev)) dar(t);
      if (p[0] === 'racha' && window.Diario && (Diario.estado().mejor || 0) >= +p[1]) dar(t);
    });
    // Por estrellas: una cada 5 estrellas, al azar entre las que faltan
    var porEstrellas = A.tarjetas.filter(function (t) { return t.gana === 'estrellas'; });
    var ganadas = porEstrellas.filter(function (t) { return d.tiene[t.id]; }).length;
    var corresponden = Math.min(porEstrellas.length, Math.floor(totalEstrellas() / A.ESTRELLAS_POR_TARJETA));
    var faltan = Azar.mezclar(porEstrellas.filter(function (t) { return !d.tiene[t.id]; }));
    for (var i = ganadas; i < corresponden && faltan.length; i++) dar(faltan.shift());
    if (nuevas.length) guardar(d);
    return nuevas;
  }

  // Revisa y muestra las nuevas de a una (con el sobre que se abre)
  function revisarYMostrar() {
    var n = revisar();
    if (!n.length) return;
    cola = cola.concat(n);
    if (!mostrando) siguiente();
  }
  function siguiente() {
    var t = cola.shift();
    if (!t) { mostrando = false; try { Musica.callar(false, 'tarjeta'); } catch (e) {} return; }
    var primera = !mostrando;
    mostrando = true;
    // La música se calla mientras el jugador ve sus tarjetas nuevas y vuelve al cerrar la última
    try { Musica.callar(true, 'tarjeta'); } catch (e) {}
    var m = document.getElementById('modal');
    m.innerHTML = '<div class="modal-caja album-nueva"><h2>🎉 ¡Nueva tarjeta!</h2>' +
      '<div class="sobre"><div class="sobre-tapa">🃏</div>' + tarjetaHTML(t, true) + '</div>' +
      '<p class="an-txt">Ganaste a <b>' + t.nombre + '</b> para tu álbum</p>' +
      '<button class="btn-principal" data-x="ver">Ver la tarjeta</button>' +
      '<button class="btn-secundario" data-x="cerrar">Seguir jugando</button></div>';
    m.classList.add('visible');
    setTimeout(function () { try { Sonido.premio(); } catch (e) {} }, primera ? 180 : 0);
    setTimeout(function () { var s = m.querySelector('.sobre'); if (s) s.classList.add('abierto'); }, 500);
    m.querySelector('[data-x="ver"]').addEventListener('click', function () { detalle(t, siguiente); });
    m.querySelector('[data-x="cerrar"]').addEventListener('click', function () { cerrar(); siguiente(); });
  }
  function cerrar() { var m = document.getElementById('modal'); m.classList.remove('visible'); m.innerHTML = ''; }

  function iniciales(nombre) { return nombre.split(/[ ,]+/).filter(function (w) { return /^[A-ZÁÉÍÓÚÑ]/.test(w); }).slice(0, 2).map(function (w) { return w[0]; }).join(''); }
  // La tarjeta es el dibujo completo (ya trae el nombre). Si no carga, se ve la versión con iniciales.
  function tarjetaHTML(t, grande) {
    return '<div class="carta-album con-img' + (grande ? ' grande' : '') + '">' +
      '<img class="ca-full" src="' + t.img + '" alt="' + t.nombre + '" onerror="this.parentNode.classList.remove(\'con-img\')">' +
      '<div class="ca-img"><span class="ca-ini">' + iniciales(t.nombre) + '</span></div>' +
      '<b class="ca-nombre">' + t.nombre + '</b><small class="ca-num">' + t.n + '/' + A.tarjetas.length + '</small></div>';
  }

  function detalle(t, alCerrar) {
    var m = document.getElementById('modal');
    m.innerHTML = '<div class="modal-caja album-detalle">' + tarjetaHTML(t, true) +
      '<p class="ad-ref">' + t.ref + '</p><p class="ad-txt">' + t.texto + '</p>' +
      '<p class="ad-cita">📖 Para buscar en tu Biblia: <b>' + t.cita + '</b></p>' +
      '<p class="ad-dato">⭐ <b>Dato curioso:</b> ' + t.dato + '</p>' +
      '<button class="btn-principal" data-x="cerrar">Cerrar</button></div>';
    m.classList.add('visible');
    m.querySelector('[data-x="cerrar"]').addEventListener('click', function () { try { Voz.cancelar(); } catch (e) {} cerrar(); if (alCerrar) alCerrar(); });
  }

  function comoSeGana(t) {
    var p = t.gana.split(':');
    if (p[0] === 'logro') return '🏅 ' + A.logros[p[1]];
    if (p[0] === 'racha') return '🔥 Hacé el desafío de hoy ' + p[1] + ' días seguidos';
    return '⭐ Juntá estrellas jugando';
  }
  // Cuánto lleva el jugador para una tarjeta que todavía no tiene: { txt, voz, f (0 a 1) } o null
  function avance(t) {
    var p = t.gana.split(':'), ev = datos().ev, dia = window.Diario ? Diario.estado() : { racha: 0, total: 0 };
    function de(a, b, u) { a = Math.min(a, b); return { txt: 'Llevás ' + a + ' de ' + b + (u ? ' ' + u : ''), f: a / b, falta: b - a }; }
    if (p[0] === 'racha') return de(dia.racha || 0, +p[1], 'días');
    if (p[0] === 'estrellas') {
      var est = totalEstrellas(), n = A.ESTRELLAS_POR_TARJETA, r = est % n, faltan = n - r;
      return { txt: 'Próximo sobre: faltan ' + faltan + (faltan === 1 ? ' estrella' : ' estrellas'), f: r / n, falta: faltan };
    }
    switch (p[1]) {
      case 'cinco-desafios': return de((ev.desafios || []).length, 5, 'desafíos');
      case 'diez-diarios': return de(dia.total || 0, 10, 'desafíos');
      case 'tres-islas': return de(islasCompletas(), 3, 'islas');
      case 'isla-completa': {
        var mejor = modulos().map(function (m) { try { return { e: m.totalEstrellas(), mx: m.maxEstrellas() }; } catch (e) { return { e: 0, mx: 1 }; } })
          .sort(function (a, b) { return b.e / b.mx - a.e / a.mx; })[0];
        return mejor ? { txt: 'Tu mejor isla: ' + mejor.e + ' de ' + mejor.mx + ' estrellas', f: mejor.e / mejor.mx, falta: mejor.mx - mejor.e } : null;
      }
    }
    return null; // logros de una sola vez (primera partida, primer duelo, etc.)
  }
  function avanceHTML(a) {
    return a ? '<small class="ca-avance">' + a.txt + '</small><span class="ca-barra"><i style="width:' + Math.round(a.f * 100) + '%"></i></span>' : '';
  }
  // Ventana al tocar una tarjeta que falta: cómo se gana y cuánto lleva (la voz lo lee)
  function comoGanar(t) {
    var a = avance(t), m = document.getElementById('modal');
    m.innerHTML = '<div class="modal-caja album-detalle album-falta">' +
      '<div class="carta-album grande bloq"><div class="ca-img"><span class="ca-ini">?</span></div><small class="ca-num">' + t.n + '/' + A.tarjetas.length + '</small></div>' +
      '<h2>Tarjeta ' + t.n + ' de ' + A.tarjetas.length + '</h2>' +
      '<p class="af-como">' + comoSeGana(t) + '</p>' + (a ? '<div class="af-avance">' + avanceHTML(a) + '</div>' : '') +
      '<button class="btn-principal" data-x="cerrar">Entendido</button></div>';
    m.classList.add('visible');
    m.querySelector('[data-x="cerrar"]').addEventListener('click', function () { try { Voz.cancelar(); } catch (e) {} cerrar(); });
  }

  // Pantalla del álbum
  function pantalla(raiz) {
    revisar();
    var d = datos(), n = A.tarjetas.filter(function (t) { return d.tiene[t.id]; }).length;
    var est = totalEstrellas(), prox = A.ESTRELLAS_POR_TARJETA - (est % A.ESTRELLAS_POR_TARJETA);
    var quedanEst = A.tarjetas.some(function (t) { return t.gana === 'estrellas' && !d.tiene[t.id]; });
    var ui = cabeceraJuego(raiz, 'Mi álbum');
    Ayuda.poner(null);
    ui.progreso(n / A.tarjetas.length);
    ui.cont.innerHTML = '<div class="album-resumen"><b>' + n + ' de ' + A.tarjetas.length + ' tarjetas</b>' +
      (quedanEst ? '<small>⭐ Te faltan ' + prox + (prox === 1 ? ' estrella' : ' estrellas') + ' para la próxima tarjeta</small>' : '') + '</div>' +
      '<div class="album-grilla">' + A.tarjetas.map(function (t) {
        return d.tiene[t.id]
          ? '<button class="album-slot" data-id="' + t.id + '">' + tarjetaHTML(t) + '</button>'
          : '<button class="album-slot bloqueada" data-falta="' + t.id + '"><div class="carta-album"><div class="ca-img"><span class="ca-ini">?</span></div>' +
            '<small class="ca-como">' + comoSeGana(t) + '</small>' + avanceHTML(avance(t)) +
            '<small class="ca-num">' + t.n + '/' + A.tarjetas.length + '</small></div></button>';
      }).join('') + '</div>';
    ui.cont.addEventListener('click', function (ev) {
      var f = ev.target.closest('.album-slot[data-falta]');
      if (f) { Sonido.toque(); comoGanar(A.tarjetas.filter(function (t) { return t.id === f.dataset.falta; })[0]); return; }
      var b = ev.target.closest('.album-slot[data-id]'); if (!b) return;
      Sonido.toque();
      detalle(A.tarjetas.filter(function (t) { return t.id === b.dataset.id; })[0]);
    });
    // El álbum es silencioso: la voz no lee nada acá.
    try { Voz.cancelar(); } catch (e) {}
  }

  function conteo() { var d = datos(); return A.tarjetas.filter(function (t) { return d.tiene[t.id]; }).length; }

  window.Album = { revisar: revisarYMostrar, evento: evento, conteo: conteo, total: A.tarjetas.length, _revisarSolo: revisar };
  window.PANTALLAS_EXTRA = window.PANTALLAS_EXTRA || {};
  window.PANTALLAS_EXTRA.album = function (raiz) { pantalla(raiz); };
})();
