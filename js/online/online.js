// Jugar en línea: perfil con alias y avatar, amigos, ranking semanal por club,
// desafíos 1 vs 1 por turnos (solo entre amigos) y duelos en vivo con código de 6 caracteres.
(function () {
  var A = window.DATOS_ALIAS;
  var yo = null;                 // { uid, alias, aliasKey, avatar, club }
  var PREG_DESAFIO = 10;
  var MAX_SALA = 100;
  var CARACTERES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O, 1/I/L para no confundir
  var MIN_DUELO = 2; // mínimo de jugadores (que juegan) para empezar un duelo en vivo
  var PUNTOS = { acierto: 10, rayo: 10, victoria: 30, podio: [50, 30, 20] };
  // Modos de puntaje de los duelos en vivo
  var MODOS_DUELO = [
    { id: 'relampago', nombre: '⚡ Relámpago', explica: 'El primero que acierta suma doble',
      reglas: 'El primero que acierta suma 2 · los demás que aciertan suman 1 · No sé 0 · equivocarse resta 1' },
    { id: 'chill', nombre: '😎 Tranqui Chill', explica: 'Todos suman igual; la velocidad solo desempata',
      reglas: 'Acertar suma 1 · No sé 0 · equivocarse resta 1' }
  ];
  function modoDuelo(s) { return MODOS_DUELO.filter(function (m) { return m.id === s.modo; })[0] || MODOS_DUELO[1]; }
  var JUGADOR_NUEVO = function () { return { alias: yo.alias, avatar: yo.avatar, puntos: 0, aciertos: 0, errores: 0, ultima: -1, tiempo: 0, rayos: 0 }; };
  // Puntos al ranking semanal por una partida: aciertos menos errores (x10). Si dio negativo, suma 0: nunca resta.
  function rankingNeto(aciertos, errores) { return Math.max(0, (aciertos || 0) - (errores || 0)) * PUNTOS.acierto; }
  // Desempate en todas las competencias: 1) más puntos, 2) menos errores, 3) menos segundos acumulados
  // (lo que tardó en cada respuesta correcta o incorrecta). Menos de medio segundo de diferencia = empate.
  function comparar(a, b) {
    if (a.puntos !== b.puntos) return { gana: a.puntos > b.puntos ? 1 : -1, por: 'puntos' };
    if ((a.errores || 0) !== (b.errores || 0)) return { gana: (a.errores || 0) < (b.errores || 0) ? 1 : -1, por: 'errores' };
    var ta = a.tiempo || 0, tb = b.tiempo || 0;
    if (Math.abs(ta - tb) >= 500) return { gana: ta < tb ? 1 : -1, por: 'tiempo' };
    return { gana: 0, por: 'empate' };
  }
  function ordenarJugadores(l) {
    return l.slice().sort(function (a, b) { return -comparar(a, b).gana; });
  }
  function seg(ms) { return Math.round((ms || 0) / 1000) + ' s'; }
  function plural(n, uno, varios) { return n + ' ' + (Math.abs(n) === 1 ? uno : varios); }
  // Texto que aclara cómo se desempató entre a (ganó) y b, con sus cifras
  function textoDesempate(a, b, na, nb) {
    var c = comparar(a, b);
    if (c.por === 'errores') return 'Empate a ' + plural(a.puntos, 'punto', 'puntos') + ': se desempató por menos errores (' +
      esc(na) + ' ' + plural(a.errores || 0, 'error', 'errores') + ' · ' + esc(nb) + ' ' + plural(b.errores || 0, 'error', 'errores') + ')';
    if (c.por === 'tiempo') return 'Empate a ' + plural(a.puntos, 'punto', 'puntos') + ' y ' + plural(a.errores || 0, 'error', 'errores') +
      ': se desempató por menos tiempo (' + esc(na) + ' ' + seg(a.tiempo) + ' · ' + esc(nb) + ' ' + seg(b.tiempo) + ')';
    if (c.por === 'empate') return 'Empate total: mismos puntos, mismos errores y el mismo tiempo';
    return '';
  }
  // "7 pts" y, si alguien más tiene los mismos puntos, también errores y tiempo: "7 pts · 1 error · 42 s"
  function ptsHTML(j, lista) {
    var empate = lista.filter(function (x) { return x.puntos === j.puntos; }).length > 1;
    return '<b class="pts">' + j.puntos + '<small> pts' + (empate ? ' · ' + plural(j.errores || 0, 'error', 'errores') + ' · ' + seg(j.tiempo) : '') + '</small></b>';
  }
  // Notas de desempate para una lista ya ordenada (solo entre puestos vecinos con los mismos puntos)
  function notasDesempate(l) {
    var out = [];
    for (var i = 0; i + 1 < l.length; i++) {
      if (l[i].puntos !== l[i + 1].puntos) continue;
      out.push('<p class="nota-desempate">⚖️ Puestos ' + (i + 1) + ' y ' + (i + 2) + ': ' + textoDesempate(l[i], l[i + 1], l[i].alias, l[i + 1].alias) + '</p>');
    }
    return out.join('');
  }
  // Código de recuperación: está programado pero apagado. Poner true para mostrarlo
  // (antes hay que activar "Correo electrónico/contraseña" en Firebase Authentication).
  var CODIGO_RECUPERACION = false;

  // ---------------------------------------------------------------- utilidades
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function avatar(id) { return A.avatares.filter(function (a) { return a.id === id; })[0] || A.avatares[0]; }
  function avatarHTML(id, clase) { var a = avatar(id); return '<span class="av ' + (clase || '') + '" style="background:' + a.c + '">' + a.e + '</span>'; }
  function claveAlias(alias) {
    return alias.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ]+/g, '-').replace(/^-|-$/g, '');
  }
  // Semana ISO (lunes a domingo): el ranking semanal se reinicia cada lunes
  function semana(f) {
    var d = new Date(Date.UTC((f = f || new Date()).getFullYear(), f.getMonth(), f.getDate()));
    var dia = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - dia);
    var ini = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return d.getUTCFullYear() + '-S' + String(Math.ceil(((d - ini) / 86400000 + 1) / 7)).padStart(2, '0');
  }
  function clubActual() { var p = App.perfil(); return (p && p.club) || 'ninguno'; }
  function parId(a, b) { return [a, b].sort().join('_'); }
  function aviso(txt, tipo) {
    var el = document.createElement('div');
    el.className = 'aviso-online ' + (tipo || '');
    el.textContent = txt;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('visible'); }, 10);
    setTimeout(function () { el.classList.remove('visible'); setTimeout(function () { el.remove(); }, 400); }, 3200);
  }
  function fallo(e) {
    console.error(e);
    aviso(navigator.onLine === false ? 'No hay conexión a internet' : 'No se pudo completar. Probá de nuevo.', 'error');
  }
  function cabecera(titulo, extra) {
    return '<header class="barra-juego"><button class="btn-icono" data-accion="volver" aria-label="Volver">‹</button>' +
      '<div class="titulo-juego">' + titulo + '</div>' + (extra || '<span class="hueco"></span>') + '</header>';
  }
  function cargando(raiz, titulo) {
    raiz.innerHTML = cabecera(titulo) + '<div class="ol-cargando"><div class="ol-ruedita"></div><p>Conectando…</p></div>';
  }
  function sumarRanking(puntos) {
    if (!yo || !(puntos > 0)) return Promise.resolve();
    return Nube.poner('ranking/' + semana() + '_' + clubActual() + '/jugadores/' + yo.uid, {
      alias: yo.alias, avatar: yo.avatar, puntos: Nube.inc(Math.min(puntos, 500)), act: Nube.ahora()
    }, true).catch(fallo);
  }
  // Conectar y cargar mi perfil. Si no tengo alias, voy a crearlo.
  function conectar(raiz, titulo, siguiente) {
    if (!Nube.configurada()) {
      raiz.innerHTML = cabecera(titulo) + '<div class="ol-mensaje"><span>🛠️</span><h2>Muy pronto</h2>' +
        '<p>La parte en línea todavía no está configurada en esta versión de la app.</p></div>';
      return;
    }
    if (!Nube.enLinea()) {
      raiz.innerHTML = cabecera(titulo) + '<div class="ol-mensaje"><span>📡</span><h2>Sin conexión</h2>' +
        '<p>Para jugar en línea necesitás internet. Los demás juegos funcionan igual sin conexión.</p></div>';
      return;
    }
    if (yo) { if (!aliasValido(yo.alias)) { App.reemplazar('online-perfil', { renombrar: true }); return; } return siguiente(); }
    cargando(raiz, titulo);
    var paso = App.raiz.dataset.actual;
    Nube.iniciar().then(function (uid) { return Nube.doc('usuarios/' + uid).then(function (u) { return [uid, u]; }); })
      .then(function (r) {
        if (App.raiz.dataset.actual !== paso) return;
        if (!r[1]) { App.reemplazar('online-perfil', { nuevo: true }); return; }
        yo = { uid: r[0], alias: r[1].alias, aliasKey: r[1].aliasKey, avatar: r[1].avatar, club: r[1].club };
        if (yo.club !== clubActual()) { yo.club = clubActual(); Nube.actualizar('usuarios/' + yo.uid, { club: yo.club }).catch(function () {}); }
        // Los nombres armados con el sistema anterior (por columnas) deben cambiarse al formato nuevo
        if (!aliasValido(yo.alias)) { App.reemplazar('online-perfil', { renombrar: true }); return; }
        siguiente();
      })
      .catch(function (e) {
        console.error(e);
        if (App.raiz.dataset.actual !== paso) return;
        raiz.innerHTML = cabecera(titulo) + '<div class="ol-mensaje"><span>📡</span><h2>No se pudo conectar</h2>' +
          '<p>Revisá tu conexión a internet y probá de nuevo.</p>' +
          '<button class="btn-principal" data-on="reintentar">Reintentar</button></div>';
      });
  }

  // Escuchas de la pantalla actual: se cierran solas al salir
  function escuchar(fnCancelar) { App.alSalir(fnCancelar); return fnCancelar; }

  // ================================================================ PANTALLAS
  var P = {};

  // ---------- Inicio de "Jugar en línea"
  P.online = function (raiz) {
    conectar(raiz, 'Jugar en línea', function () {
      raiz.innerHTML = cabecera('Jugar en línea') +
        '<button class="ol-yo" data-on="editar-perfil">' + avatarHTML(yo.avatar, 'grande') +
          '<span><b>' + esc(yo.alias) + '</b><small>' + App.CLUBES[clubActual()] + ' · tocá para cambiar</small></span></button>' +
        '<div class="ol-opciones">' +
          '<button class="ol-opcion op-duelo" data-on="ir" data-p="online-duelo"><span class="ic">⚡</span><b>Duelo en vivo</b><small>Hasta 100 jugadores con un código</small></button>' +
          '<button class="ol-opcion op-desafio" data-on="ir" data-p="online-desafios"><span class="ic">⚔️</span><b>Desafíos</b><small>1 contra 1 con tus amigos</small><i class="globo" data-globo="desafios" hidden></i></button>' +
          '<button class="ol-opcion op-amigos" data-on="ir" data-p="online-amigos"><span class="ic">👫</span><b>Amigos</b><small>Solicitudes y lista</small><i class="globo" data-globo="amigos" hidden></i></button>' +
          '<button class="ol-opcion op-ranking" data-on="ir" data-p="online-ranking"><span class="ic">🏆</span><b>Ranking semanal</b><small>Por club, se reinicia cada lunes</small></button>' +
        '</div>';
      // Globitos con solicitudes y desafíos pendientes
      escuchar(Nube.escucharConsulta('amistades', { donde: [['miembros', 'array-contains', yo.uid]] }, function (l) {
        var n = l.filter(function (a) { return a.estado === 'pendiente' && a.para === yo.uid; }).length;
        globo('amigos', n);
      }));
      escuchar(Nube.escucharConsulta('desafios', { donde: [['miembros', 'array-contains', yo.uid]] }, function (l) {
        globo('desafios', l.filter(function (d) { return !(d.res && d.res[yo.uid]); }).length);
      }));
    });
  };
  function globo(cual, n) {
    var g = document.querySelector('[data-globo="' + cual + '"]');
    if (!g) return;
    g.hidden = !n; g.textContent = n;
  }

  // Teclado QWERTY para códigos (sala y recuperación). Las teclas que nunca aparecen en un código
  // (0, 1, I, L, O, Ñ) se ven apagadas, así el teclado tiene la forma de siempre y no se confunden.
  function tecladoCodigoHTML(accion, accionBorrar) {
    return '<div class="teclado-qwerty teclado-cod">' + FILAS_TECLADO.map(function (fila, i) {
      return '<div class="fila-q">' + fila.split('').map(function (c) {
        return CARACTERES.indexOf(c) >= 0
          ? '<button class="tecla" data-on="' + accion + '" data-v="' + c + '">' + c + '</button>'
          : '<button class="tecla apagada" disabled aria-hidden="true">' + c + '</button>';
      }).join('') + (i === 3 ? '<button class="tecla borrar" data-on="' + accionBorrar + '">⌫</button>' : '') + '</div>';
    }).join('') + '</div>' +
      '<p class="ol-nota nota-teclas">ℹ️ Las teclas apagadas no se usan en los códigos, para no confundirse: ' +
      'el <b>0</b> se parece a la <b>O</b>, y el <b>1</b> a la <b>I</b> y a la <b>L</b>. La <b>Ñ</b> tampoco se usa.</p>';
  }

  // ---------- Constructor de alias: un teclado QWERTY propio (letras, números y espacio)
  // Regla: de 3 a 12 caracteres en total; al menos 3 deben ser letras o números.
  var MAX_ALIAS = 12;
  var FILAS_TECLADO = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
  function limpiarAlias(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function aliasValido(a) {
    return /^[A-Z0-9Ñ]+( [A-Z0-9Ñ]+)*$/.test(a) && a.length <= MAX_ALIAS && a.replace(/ /g, '').length >= 3;
  }
  function selVacio() { return { texto: '' }; }
  function selDesdeAlias(alias) { var s = selVacio(); if (aliasValido(alias || '')) s.texto = alias; return s; }
  function aliasDe(sel) { var a = limpiarAlias(sel.texto); return aliasValido(a) ? a : null; }
  function aliasParcial(sel) { return sel.texto ? sel.texto + '▏' : '…'; }
  function constructorHTML(sel, ambito) {
    return '<div class="constructor" data-ambito="' + ambito + '">' +
      '<div class="pantalla-alias"><span class="pa-texto">' + esc(sel.texto) + '</span><span class="pa-cursor">▏</span>' +
        '<small class="pa-cuenta">' + sel.texto.length + '/' + MAX_ALIAS + '</small></div>' +
      '<div class="teclado-qwerty">' +
        FILAS_TECLADO.map(function (fila, i) {
          return '<div class="fila-q">' + fila.split('').map(function (c) {
            return '<button class="tecla" data-on="tecla-alias" data-v="' + c + '">' + c + '</button>';
          }).join('') + (i === 3 ? '<button class="tecla borrar" data-on="tecla-alias-borrar">⌫</button>' : '') + '</div>';
        }).join('') +
        '<div class="fila-q"><button class="tecla espacio" data-on="tecla-alias" data-v=" ">espacio</button></div>' +
      '</div>' +
    '</div>';
  }
  function refrescarConstructor(cont, sel) {
    cont.querySelector('.pa-texto').textContent = sel.texto;
    cont.querySelector('.pa-cuenta').textContent = sel.texto.length + '/' + MAX_ALIAS;
  }
  function selDe(cont) { return App.raiz._bld[cont.dataset.ambito]; }
  function cambioConstructor(cont) {
    refrescarConstructor(cont, selDe(cont));
    if (cont.dataset.ambito === 'perfil') actualizarAlias(App.raiz);
    else actualizarBusqueda(App.raiz);
  }

  // ---------- Perfil: alias y avatar
  P['online-perfil'] = function (raiz, datos) {
    datos = datos || {};
    var sel = yo && !datos.nuevo && !datos.renombrar ? selDesdeAlias(yo.alias) : selVacio();
    sel.avatar = (yo && yo.avatar) || A.avatares[0].id;
    raiz._bld = { perfil: sel };
    raiz.innerHTML = cabecera(datos.nuevo ? 'Tu perfil en línea' : 'Cambiar perfil') +
      (datos.nuevo && CODIGO_RECUPERACION ? '<button class="btn-recuperar" data-on="ir" data-p="online-recuperar">🔑 ¿Ya tenías un perfil? Recuperalo con tu código</button>' : '') +
      '<div class="alias-vista">' + avatarHTML(sel.avatar, 'grande') + '<div><b class="alias-texto"></b><small class="alias-estado"></small></div></div>' +
      (datos.renombrar ? '<p class="ol-aviso-alias aviso-renombrar">✨ ¡Cambiamos la forma de elegir nombres! Ahora se escribe con el teclado. Elegí tu nuevo nombre para seguir jugando en línea.</p>'
        : '<p class="ol-aviso-alias">Escribí tu nombre de jugador: de 3 a 12 caracteres, con letras, números o espacios 😊</p>') +
      constructorHTML(sel, 'perfil') +
      '<h3 class="ol-sub">Elegí tu avatar</h3>' +
      '<p class="ol-nota">' + A.avatares.length + ' avatares para elegir, ordenados por grupo</p>' +
      gruposAvatares(sel.avatar) +
      '<button class="btn-principal btn-guardar-alias" data-on="guardar-perfil" disabled>Guardar</button>' +
      (yo && !datos.nuevo ? (CODIGO_RECUPERACION ? '<button class="btn-secundario btn-codigo" data-on="ir" data-p="online-codigo">🔑 Mi código de recuperación</button>' : '') +
        '<button class="btn-borrar-perfil" data-on="borrar-perfil">🗑️ Borrar mi perfil en línea</button>' : '');
    raiz.querySelectorAll('.pal.activa').forEach(function (b) { b.parentNode.scrollTop = b.offsetTop - b.parentNode.offsetTop - 40; });
    actualizarAlias(raiz);
  };
  // Avatares ordenados por grupo, cada grupo con su título
  function gruposAvatares(activo) {
    var grupos = [];
    A.avatares.forEach(function (a) {
      var g = grupos.filter(function (x) { return x.nombre === (a.g || 'Otros'); })[0];
      if (!g) { g = { nombre: a.g || 'Otros', lista: [] }; grupos.push(g); }
      g.lista.push(a);
    });
    return grupos.map(function (g) {
      return '<div class="grupo-avatares"><h4>' + esc(g.nombre) + '</h4><div class="grilla-avatares">' + g.lista.map(function (a) {
        return '<button class="btn-avatar' + (activo === a.id ? ' activa' : '') + '" data-on="avatar" data-v="' + a.id + '" style="background:' + a.c + '">' + a.e + '</button>';
      }).join('') + '</div></div>';
    }).join('');
  }
  function permitido(sel, alias) { return FiltroAlias.permitido(alias); }
  // Buscar un número libre para sugerir cuando el alias ya existe
  function sugerirNumero(sel) {
    var base = limpiarAlias(sel.texto).replace(/ \d+$/, ''), lugar = MAX_ALIAS - base.length - 1;
    if (lugar < 1) return Promise.resolve(null);
    var cifras = Math.min(3, lugar), intentos = [];
    for (var k = 0; k < 4; k++) intentos.push(String(Math.floor(Math.random() * Math.pow(10, cifras))));
    return Promise.all(intentos.map(function (n) {
      var al = base + ' ' + n;
      return Nube.doc('alias/' + claveAlias(al)).then(function (d) { return d ? null : al; }).catch(function () { return null; });
    })).then(function (l) { return l.filter(Boolean)[0] || null; });
  }
  var revisionAlias = 0;
  function actualizarAlias(raiz) {
    var sel = raiz._bld.perfil, alias = aliasDe(sel), estado = raiz.querySelector('.alias-estado'), btn = raiz.querySelector('.btn-guardar-alias');
    raiz.querySelector('.alias-texto').textContent = alias || aliasParcial(sel);
    var vista = raiz.querySelector('.alias-vista .av'), a = avatar(sel.avatar);
    vista.textContent = a.e; vista.style.background = a.c;
    function poner(txt, clase, ok) { estado.innerHTML = txt; estado.className = 'alias-estado ' + (clase || ''); btn.disabled = !ok; }
    if (!alias) return poner('Escribí de 3 a 12 caracteres (letras, números o espacios)', '', false);
    if (!permitido(sel, alias)) return poner('⚠️ Ese alias no está permitido. Probá con otro.', 'usado', false);
    if (yo && claveAlias(alias) === yo.aliasKey) return poner('✔ Es tu alias actual', 'ok', true);
    poner('Revisando…', '', false);
    var yoRev = ++revisionAlias;
    Nube.doc('alias/' + claveAlias(alias)).then(function (d) {
      if (yoRev !== revisionAlias) return;
      if (!d) return poner('✔ ¡Disponible!', 'ok', true);
      poner('⚠️ Ese alias ya existe.', 'usado', false);
      sugerirNumero(sel).then(function (n) {
        if (yoRev !== revisionAlias || !n) return;
        poner('⚠️ Ese nombre ya existe. <button class="mini ok" data-on="usar-sugerencia" data-num="' + esc(n) + '">¿Querés ' + esc(n) + '?</button>', 'usado', false);
      });
    }).catch(function (e) { if (yoRev === revisionAlias) poner('No se pudo revisar (sin conexión)', '', false); console.error(e); });
  }
  function guardarPerfil(raiz) {
    var sel = raiz._bld.perfil, alias = aliasDe(sel);
    if (!alias || !permitido(sel, alias)) return;
    var btn = raiz.querySelector('.btn-guardar-alias'); btn.disabled = true;
    var key = claveAlias(alias);
    var iniciar = Nube.uid ? Promise.resolve(Nube.uid) : Nube.iniciar();
    iniciar.then(function (uid) {
      var cambiaAlias = !yo || yo.aliasKey !== key;
      var reservar = cambiaAlias ? Nube.crearSiNoExiste('alias/' + key, { uid: uid, creado: Nube.ahora() }) : Promise.resolve(true);
      return reservar.then(function (ok) {
        if (!ok) { revisionAlias++; actualizarAlias(raiz); aviso('Ese alias ya existe', 'error'); return; }
        var viejo = yo && cambiaAlias ? yo : null;
        var datosU = { alias: alias, aliasKey: key, avatar: sel.avatar, club: clubActual(), act: Nube.ahora() };
        if (!yo) datosU.creado = Nube.ahora();
        if (viejo) { datosU.aliasAnterior = viejo.alias; datosU.aliasCambio = Nube.ahora(); }
        return Nube.poner('usuarios/' + uid, datosU, true).then(function () {
          if (viejo) Nube.borrar('alias/' + viejo.aliasKey).catch(function () {});
          yo = { uid: uid, alias: alias, aliasKey: key, avatar: sel.avatar, club: clubActual() };
          cachePerfiles = {};
          // Actualizar el nombre en el ranking de esta semana, si ya figuro
          var rutaR = 'ranking/' + semana() + '_' + clubActual() + '/jugadores/' + uid;
          Nube.doc(rutaR).then(function (r) { if (r) return Nube.poner(rutaR, { alias: alias, avatar: sel.avatar, puntos: Nube.inc(0) }, true); }).catch(function () {});
          Sonido.acierto();
          aviso('¡Listo, ' + alias + '!', 'ok');
          App.reemplazar('online');
        });
      });
    }).catch(function (e) { btn.disabled = false; fallo(e); });
  }

  // ---------- Perfiles actualizados de otros jugadores (alias y avatar actuales)
  var cachePerfiles = {};
  function perfiles(uids) {
    var unicos = uids.filter(function (u, i) { return u && uids.indexOf(u) === i; });
    return Promise.all(unicos.map(function (u) {
      var c = cachePerfiles[u];
      if (c && Date.now() - c.t < 60000) return c.p;
      var p = Nube.doc('usuarios/' + u).catch(function () { return null; });
      cachePerfiles[u] = { t: Date.now(), p: p };
      return p;
    })).then(function (l) { var m = {}; unicos.forEach(function (u, i) { m[u] = l[i]; }); return m; });
  }
  // Nombre a mostrar: el actual, y durante 7 días también el anterior
  function nombreDe(uid, guardado, mapa) {
    var p = mapa && mapa[uid], al = (p && p.alias) || (guardado && guardado.alias) || 'Jugador';
    var antes = p && p.aliasAnterior && p.aliasCambio && (Date.now() - p.aliasCambio < 7 * 86400000) ? p.aliasAnterior : '';
    return { alias: al, avatar: (p && p.avatar) || (guardado && guardado.avatar), antes: antes };
  }
  function nombreHTML(n, extra) {
    return '<span class="nom">' + esc(n.alias) + (n.antes ? '<small class="antes">antes ' + esc(n.antes) + '</small>' : '') + (extra || '') + '</span>';
  }

  // Borra todo lo que el jugador tiene en línea (perfil, alias, amistades y puntaje de la semana)
  function borrarPerfil(b) {
    if (!b.dataset.seguro) {
      b.dataset.seguro = '1';
      b.textContent = '⚠️ Tocá otra vez para confirmar: se borran tu alias, amigos y puntos';
      return;
    }
    b.disabled = true;
    var uid = yo.uid;
    Promise.all([
      Nube.consulta('amistades', { donde: [['miembros', 'array-contains', uid]] }),
      Nube.doc('ranking/' + semana() + '_' + clubActual() + '/jugadores/' + uid)
    ]).then(function (r) {
      var ops = r[0].map(function (a) { return { op: 'borrar', ruta: 'amistades/' + a.id }; });
      ops.push({ op: 'borrar', ruta: 'alias/' + yo.aliasKey }, { op: 'borrar', ruta: 'usuarios/' + uid });
      return Nube.lote(ops).then(function () {
        if (r[1]) return Nube.poner('ranking/' + semana() + '_' + clubActual() + '/jugadores/' + uid,
          { alias: 'Jugador', avatar: 'estrella', puntos: Nube.inc(0) }, true).catch(function () {});
      });
    }).then(function () {
      yo = null;
      aviso('Tu perfil en línea fue borrado', 'ok');
      App.reemplazar('menu');
    }).catch(function (e) { b.disabled = false; fallo(e); });
  }

  // ---------- Buscar amigos con el mismo constructor de alias
  function selectorBusqueda() {
    return '<div class="buscar-amigo"><p class="ol-intro">Armá el alias de tu amigo tal como lo ve en su perfil:</p>' +
      '<div class="alias-vista chica"><b class="alias-texto">_____</b></div>' +
      constructorHTML(App.raiz._bld.buscar, 'buscar') +
      '<button class="btn-principal" data-on="buscar-amigo" disabled>🔍 Buscar</button><div class="resultado-busqueda"></div></div>';
  }
  function actualizarBusqueda(raiz) {
    var sel = raiz._bld.buscar, al = aliasDe(sel);
    raiz.querySelector('.buscar-amigo .alias-texto').textContent = al || aliasParcial(sel);
    raiz.querySelector('[data-on="buscar-amigo"]').disabled = !al;
  }

  // ---------- Amigos
  P['online-amigos'] = function (raiz) {
    cachePerfiles = {}; // al entrar, mostrar siempre los nombres actuales
    conectar(raiz, 'Amigos', function () {
      raiz.innerHTML = cabecera('Amigos', '<button class="btn-accion-ol" data-on="agregar-amigo">➕ Agregar</button>') +
        '<div class="zona-buscar" hidden></div>' +
        '<div class="ol-seccion s-recibidas" hidden><h3 class="ol-sub">Solicitudes recibidas</h3><div class="lista"></div></div>' +
        '<div class="ol-seccion s-amigos"><h3 class="ol-sub">Mis amigos</h3><div class="lista"></div></div>' +
        '<div class="ol-seccion s-enviadas" hidden><h3 class="ol-sub">Solicitudes enviadas</h3><div class="lista"></div></div>';
      var amistades = [], desafios = [];
      function pintar() {
        var otros = amistades.map(function (a) { return a.miembros[0] === yo.uid ? a.miembros[1] : a.miembros[0]; });
        perfiles(otros).then(function (mapa) {
          if (!raiz.querySelector('.s-amigos')) return;
          var rec = amistades.filter(function (a) { return a.estado === 'pendiente' && a.para === yo.uid; });
          var env = amistades.filter(function (a) { return a.estado === 'pendiente' && a.de === yo.uid; });
          var ami = amistades.filter(function (a) { return a.estado === 'aceptada'; });
          function fila(a, botones, extra) {
            var otro = a.miembros[0] === yo.uid ? a.miembros[1] : a.miembros[0];
            var n = nombreDe(otro, (a.info || {})[otro], mapa);
            return '<div class="fila-ol">' + avatarHTML(n.avatar) + nombreHTML(n, extra ? extra(otro) : '') + botones(a, otro, n) + '</div>';
          }
          pintarSeccion(raiz, '.s-recibidas', rec, function (a) {
            return fila(a, function (x, otro, n) {
              return '<button class="mini ok" data-on="aceptar" data-id="' + a.id + '">Aceptar</button>' +
                '<button class="mini no" data-on="rechazar" data-id="' + a.id + '">Rechazar</button>' + botonReporte(otro, n.alias, 'solicitud');
            });
          });
          pintarSeccion(raiz, '.s-enviadas', env, function (a) {
            return fila(a, function () { return '<span class="pendiente">Esperando</span><button class="mini no" data-on="rechazar" data-id="' + a.id + '">Cancelar</button>'; });
          });
          pintarSeccion(raiz, '.s-amigos', ami, function (a) {
            return fila(a, function (x, otro, n) {
              return '<button class="mini ok" data-on="desafiar" data-uid="' + otro + '">⚔️</button>' + botonReporte(otro, n.alias, 'amigos');
            }, function (otro) {
              var c = caraACara(desafios, otro);
              return c.total ? '<small class="cara">' + c.g + ' ganados · ' + c.p + ' perdidos · ' + c.e + ' empates</small>' : '';
            });
          }, 'Todavía no tenés amigos. Tocá "➕ Agregar" y buscalos por su alias.');
        });
      }
      escuchar(Nube.escucharConsulta('amistades', { donde: [['miembros', 'array-contains', yo.uid]] }, function (l) { amistades = l; pintar(); }));
      escuchar(Nube.escucharConsulta('desafios', { donde: [['miembros', 'array-contains', yo.uid]] }, function (l) { desafios = l; pintar(); }));
    });
  };
  // Historial cara a cara contra un amigo (todos los desafíos terminados)
  function caraACara(desafios, otro) {
    var c = { g: 0, p: 0, e: 0, mios: 0, suyos: 0, total: 0 };
    desafios.forEach(function (d) {
      if (d.miembros.indexOf(otro) < 0 || !d.res || !d.res[yo.uid] || !d.res[otro]) return;
      var r = resultadoDesafio(d);
      c.total++; c.mios += r.a.puntos; c.suyos += r.b.puntos;
      if (r.gana === 1) c.g++; else if (r.gana === -1) c.p++; else c.e++;
    });
    return c;
  }
  // Botón para reportar un alias inapropiado (se toca dos veces para confirmar)
  function botonReporte(uid, alias, donde) {
    if (!uid || !yo || uid === yo.uid) return '';
    return '<button class="mini reportar" data-on="reportar" data-uid="' + uid + '" data-alias="' + esc(alias) + '" data-donde="' + donde + '" title="Reportar alias inapropiado">⚑</button>';
  }
  function reportar(b) {
    if (!b.dataset.seguro) { b.dataset.seguro = '1'; b.textContent = '¿Reportar?'; b.classList.add('confirmar'); return; }
    b.disabled = true;
    Nube.poner('reportes/' + yo.uid + '_' + b.dataset.uid, { de: yo.uid, uid: b.dataset.uid, alias: b.dataset.alias, donde: b.dataset.donde, fecha: Nube.ahora() })
      .then(function () { b.textContent = '✔'; aviso('Gracias. Vamos a revisar ese alias.', 'ok'); })
      .catch(function () { b.textContent = '✔'; aviso('Ya habías reportado ese alias'); });
  }
  function pintarSeccion(raiz, sel, lista, fila, vacio) {
    var s = raiz.querySelector(sel);
    if (!s) return;
    s.hidden = !lista.length && !vacio;
    s.querySelector('.lista').innerHTML = lista.length ? lista.map(fila).join('') : '<p class="vacio">' + (vacio || '') + '</p>';
  }
  function enviarSolicitud(uidOtro, aliasOtro, avatarOtro) {
    if (uidOtro === yo.uid) { aviso('¡Ese sos vos! 😄'); return Promise.resolve(); }
    var id = parId(yo.uid, uidOtro), info = {};
    info[yo.uid] = { alias: yo.alias, avatar: yo.avatar };
    info[uidOtro] = { alias: aliasOtro, avatar: avatarOtro };
    return Nube.doc('amistades/' + id).then(function (d) {
      if (d) { aviso(d.estado === 'aceptada' ? 'Ya son amigos' : 'Ya hay una solicitud pendiente'); return; }
      return Nube.poner('amistades/' + id, { miembros: [yo.uid, uidOtro], de: yo.uid, para: uidOtro, estado: 'pendiente', info: info, fecha: Nube.ahora() })
        .then(function () { Sonido.acierto(); aviso('Solicitud enviada a ' + aliasOtro, 'ok'); });
    }).catch(fallo);
  }

  // ---------- Ranking semanal por club
  P['online-ranking'] = function (raiz, datos) {
    conectar(raiz, 'Ranking semanal', function () {
      var club = (datos && datos.club) || clubActual();
      raiz.innerHTML = cabecera('Ranking semanal') +
        '<div class="pestanas">' + Object.keys(App.CLUBES).map(function (k) {
          return '<button class="pestana' + (k === club ? ' activa' : '') + '" data-on="club-ranking" data-club="' + k + '">' +
            (k === 'ninguno' ? 'Sin club' : App.CLUBES[k]) + '</button>';
        }).join('') + '</div>' +
        '<p class="ol-nota">Semana ' + semana().split('-S')[1] + ' · se reinicia cada lunes. Sumás puntos con cada acierto en desafíos y duelos.</p>' +
        '<div class="tabla-ranking"><div class="ol-cargando"><div class="ol-ruedita"></div></div></div>';
      Nube.consulta('ranking/' + semana() + '_' + club + '/jugadores', { orden: ['puntos', 'desc'], limite: 50 }).then(function (l) {
        var t = raiz.querySelector('.tabla-ranking');
        if (!t) return;
        if (!l.length) { t.innerHTML = '<p class="vacio">Todavía nadie sumó puntos esta semana. ¡Podés ser el primero!</p>'; return; }
        var medallas = ['🥇', '🥈', '🥉'];
        t.innerHTML = l.map(function (j, i) {
          var mio = j.id === yo.uid;
          return '<div class="fila-ol fila-rank' + (mio ? ' mio' : '') + '"><span class="pos">' + (medallas[i] || (i + 1)) + '</span>' +
            avatarHTML(j.avatar) + '<span class="nom">' + esc(j.alias) + (mio ? ' (vos)' : '') + '</span><b class="pts">' + j.puntos + '</b>' +
            (mio ? '' : '<button class="mini" data-on="solicitar" data-uid="' + j.id + '" data-alias="' + esc(j.alias) + '" data-avatar="' + esc(j.avatar) + '" title="Enviar solicitud de amistad">➕</button>' + botonReporte(j.id, j.alias, 'ranking')) +
            '</div>';
        }).join('');
      }).catch(fallo);
    });
  };

  // ---------- Desafíos 1 vs 1 por turnos
  P['online-desafios'] = function (raiz) {
    cachePerfiles = {}; // al entrar, mostrar siempre los nombres actuales
    conectar(raiz, 'Desafíos', function () {
      raiz.innerHTML = cabecera('Desafíos', '<button class="btn-accion-ol" data-on="nuevo-desafio">⚔️ Nuevo</button>') +
        '<div class="ol-seccion s-turno"><h3 class="ol-sub">Te toca jugar</h3><div class="lista"></div></div>' +
        '<div class="ol-seccion s-espera" hidden><h3 class="ol-sub">Esperando a tu amigo</h3><div class="lista"></div></div>' +
        '<div class="ol-seccion s-fin" hidden><h3 class="ol-sub">Terminados</h3><div class="lista"></div></div>';
      escuchar(Nube.escucharConsulta('desafios', { donde: [['miembros', 'array-contains', yo.uid]] }, function (l) {
        l.sort(function (a, b) { return (b.creado || 0) - (a.creado || 0); });
        function otro(d) { return d.miembros[0] === yo.uid ? d.miembros[1] : d.miembros[0]; }
        perfiles(l.map(otro)).then(function (mapa) {
          if (!raiz.querySelector('.s-turno')) return;
          function cab(d) {
            var o = otro(d), n = nombreDe(o, d.info[o], mapa);
            return avatarHTML(n.avatar) + nombreHTML(n, '<small>' + temaTexto(d) + '</small>');
          }
          var turno = l.filter(function (d) { return !(d.res && d.res[yo.uid]); });
          var espera = l.filter(function (d) { return d.res && d.res[yo.uid] && !d.res[otro(d)]; });
          var fin = l.filter(function (d) { return d.res && d.res[yo.uid] && d.res[otro(d)]; }).slice(0, 30);
          pintarSeccion(raiz, '.s-turno', turno, function (d) {
            return '<div class="fila-ol">' + cab(d) + '<button class="mini ok" data-on="jugar-desafio" data-id="' + d.id + '">▶ Jugar</button></div>';
          }, 'No tenés desafíos pendientes. Tocá "⚔️ Nuevo" para desafiar a un amigo.');
          pintarSeccion(raiz, '.s-espera', espera, function (d) {
            return '<button class="fila-ol" data-on="ver-detalle" data-id="' + d.id + '">' + cab(d) +
              '<span class="pendiente">Vos: ' + plural(datosDesafio(d, d.res[yo.uid]).puntos, 'punto', 'puntos') + '</span></button>';
          });
          pintarSeccion(raiz, '.s-fin', fin, function (d) {
            var r = resultadoDesafio(d), txt = textoResultado(r);
            reclamarVictoria(d, r.gana);
            return '<button class="fila-ol fin-' + (r.gana === 1 ? 'gano' : r.gana === -1 ? 'perdio' : 'empate') + '" data-on="ver-detalle" data-id="' + d.id + '">' + cab(d) +
              '<span class="marcador-d"><span><small>Vos</small> ' + r.a.puntos + ' – ' + r.b.puntos + '</span><small>' + txt + ' ›</small></span></button>';
          });
        });
      }));
    });
  };
  // Texto de los temas elegidos (lista de ids, o el texto viejo de versiones anteriores)
  function temaTexto(d) {
    var T = PreguntasOnline.TEMAS, l = PreguntasOnline.listaTemas(d.tema);
    if (l.length === T.length) return '✅ Todos los temas';
    var ts = T.filter(function (x) { return l.indexOf(x.id) >= 0; });
    if (ts.length === 1) return ts[0].icono + ' ' + ts[0].nombre;
    return ts.map(function (x) { return x.icono; }).join(' ');
  }
  function todosLosTemas() { return PreguntasOnline.TEMAS.map(function (x) { return x.id; }); }
  // Puntos de un desafío (reglas Tranqui Chill): acierto +1, No sé 0, error −1.
  // Se calcula con las respuestas guardadas, así también se recalculan los desafíos de versiones anteriores.
  function datosDesafio(d, res) {
    if (!res) return null;
    if (!res.r) return { puntos: res.aciertos || 0, aciertos: res.aciertos || 0, errores: 0, nose: 0, tiempo: res.ms || 0 };
    var a = 0, e = 0, n = 0;
    d.preguntas.forEach(function (q, i) { var k = res.r[i]; if (k === q.c) a++; else if (k === -2 || k == null) n++; else e++; });
    return { puntos: a - e, aciertos: a, errores: e, nose: n, tiempo: res.ms || 0 };
  }
  // gana: 1 gané, -1 perdí, 0 empate. "por" y "nota" dicen cómo se desempató.
  function resultadoDesafio(d) {
    var o = d.miembros[0] === yo.uid ? d.miembros[1] : d.miembros[0];
    var a = datosDesafio(d, d.res[yo.uid]), b = datosDesafio(d, d.res[o]), c = comparar(a, b);
    var n = (d.info[o] || {}).alias || 'tu amigo';
    c.a = a; c.b = b;
    c.nota = c.por === 'puntos' ? '' : c.gana >= 0 ? textoDesempate(a, b, 'Vos', n) : textoDesempate(b, a, n, 'Vos');
    return c;
  }
  function textoResultado(r) {
    return (r.gana === 1 ? '🏆 Ganaste' : r.gana === -1 ? 'Perdiste' : '🤝 Empate') + (r.gana !== 0 && r.por !== 'puntos' ? ' (desempate)' : '');
  }
  function cifrasHTML(nombre, x) {
    return '<p class="cifras"><b>' + esc(nombre) + ':</b> ✔ ' + x.aciertos + ' · ✘ ' + x.errores + ' · 🤷 ' + x.nose + ' · ⏱ ' + seg(x.tiempo) + '</p>';
  }
  function reclamarVictoria(d, r) {
    if (r !== 1 || d.res[yo.uid].bono) return;
    var o = {}; o['res.' + yo.uid + '.bono'] = true;
    Nube.actualizar('desafios/' + d.id, o).then(function () { sumarRanking(PUNTOS.victoria); }).catch(function () {});
  }
  // Elegir amigo y tema para un desafío nuevo
  P['online-nuevo-desafio'] = function (raiz, datos) {
    cachePerfiles = {}; // al entrar, mostrar siempre los nombres actuales
    conectar(raiz, 'Nuevo desafío', function () {
      raiz._desafio = { amigo: datos && datos.uid, tema: todosLosTemas() };
      raiz.innerHTML = cabecera('Nuevo desafío') +
        '<h3 class="ol-sub">1. ¿A qué amigo desafiás?</h3><div class="lista-amigos-sel"><div class="ol-cargando"><div class="ol-ruedita"></div></div></div>' +
        '<h3 class="ol-sub">2. Elegí los temas</h3>' + temasHTML(raiz._desafio.tema) +
          '<p class="ol-nota">Los dos responden las mismas ' + PREG_DESAFIO + ' preguntas, cada uno cuando pueda. Acertar suma 1, No sé 0 y equivocarse resta 1. Si empatan, gana el de menos errores; si siguen empatados, el que tardó menos.</p>' +
        '<button class="btn-principal" data-on="crear-desafio" disabled>⚔️ Desafiar y jugar mi turno</button>';
      pintarTemas(raiz, raiz._desafio.tema);
      Nube.consulta('amistades', { donde: [['miembros', 'array-contains', yo.uid]] }).then(function (l) {
        var ami = l.filter(function (a) { return a.estado === 'aceptada'; });
        var cont = raiz.querySelector('.lista-amigos-sel');
        if (!cont) return;
        if (!ami.length) { cont.innerHTML = '<p class="vacio">Solo podés desafiar a tus amigos. Primero agregalos en "Amigos".</p>'; return; }
        raiz._infoAmigos = {};
        var otros = ami.map(function (a) { return a.miembros[0] === yo.uid ? a.miembros[1] : a.miembros[0]; });
        return perfiles(otros).then(function (mapa) {
          cont.innerHTML = ami.map(function (a, k) {
            var otro = otros[k], n = nombreDe(otro, a.info[otro], mapa);
            raiz._infoAmigos[otro] = { alias: n.alias, avatar: n.avatar };
            return '<button class="fila-ol sel-amigo' + (otro === raiz._desafio.amigo ? ' activa' : '') + '" data-on="elegir-amigo" data-uid="' + otro + '">' +
              avatarHTML(n.avatar) + nombreHTML(n) + '</button>';
          }).join('');
          revisarDesafio(raiz);
        });
      }).catch(fallo);
    });
  };
  // Temas: se elige uno o varios; "Todos" marca la lista completa. Siempre queda al menos uno.
  function temasHTML(sel) {
    return '<div class="zona-temas"><button class="btn-tema btn-todos" data-on="tema-todos"><span>✅</span>Todos</button>' +
      '<div class="grilla-temas">' + PreguntasOnline.TEMAS.map(function (t) {
        return '<button class="btn-tema" data-on="tema" data-v="' + t.id + '"><span>' + t.icono + '</span>' + t.nombre + '<i class="tilde">✔</i></button>';
      }).join('') + '</div><p class="ol-nota nota-temas"></p></div>';
  }
  function pintarTemas(raiz, sel) {
    var todos = sel.length === PreguntasOnline.TEMAS.length;
    raiz.querySelectorAll('.btn-tema[data-on="tema"]').forEach(function (b) { b.classList.toggle('activa', sel.indexOf(b.dataset.v) >= 0); });
    var bt = raiz.querySelector('.btn-todos'); if (bt) bt.classList.toggle('activa', todos);
    var n = raiz.querySelector('.nota-temas');
    if (n) n.textContent = todos ? 'Preguntas de todos los temas, mezcladas' : sel.length + (sel.length === 1 ? ' tema elegido' : ' temas elegidos') + ' · las preguntas se reparten entre ellos';
  }
  function temasActuales(raiz) { return (raiz._desafio || raiz._org || {}).tema; }
  function ponerTemas(raiz, sel) {
    if (raiz._desafio) raiz._desafio.tema = sel;
    if (raiz._org) raiz._org.tema = sel;
    pintarTemas(raiz, sel);
  }
  function revisarDesafio(raiz) {
    var b = raiz.querySelector('[data-on="crear-desafio"]');
    if (b) b.disabled = !(raiz._desafio.amigo && raiz._infoAmigos && raiz._infoAmigos[raiz._desafio.amigo]);
  }
  function crearDesafio(raiz) {
    var d = raiz._desafio, otro = d.amigo, info = {};
    info[yo.uid] = { alias: yo.alias, avatar: yo.avatar };
    info[otro] = raiz._infoAmigos[otro];
    var id = yo.uid.slice(0, 8) + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var datos = { de: yo.uid, para: otro, miembros: [yo.uid, otro], par: parId(yo.uid, otro), info: info, tema: d.tema,
      preguntas: PreguntasOnline.generar(d.tema, PREG_DESAFIO), res: {}, creado: Nube.ahora() };
    raiz.querySelector('[data-on="crear-desafio"]').disabled = true;
    Nube.poner('desafios/' + id, datos).then(function () {
      App.reemplazar('online-quiz', { desafio: id });
    }).catch(function (e) { revisarDesafio(raiz); fallo(e); });
  }

  // ---------- Jugar mi turno de un desafío
  P['online-quiz'] = function (raiz, datos) {
    conectar(raiz, 'Desafío', function () {
      cargando(raiz, 'Desafío');
      Nube.doc('desafios/' + datos.desafio).then(function (d) {
        if (!d) { aviso('Ese desafío ya no existe'); App.volver(); return; }
        if (d.res && d.res[yo.uid]) { aviso('Ya jugaste este desafío'); App.reemplazar('online-desafios'); return; }
        var o = d.miembros[0] === yo.uid ? d.miembros[1] : d.miembros[0];
        var s = { i: 0, aciertos: 0, errores: 0, tiempo: 0, inicioPreg: 0, bloqueado: false, r: [] };
        raiz.innerHTML = cabecera('Desafío contra ' + esc((d.info[o] || {}).alias), Voz.boton()) +
          '<div class="progreso"><div class="progreso-barra"></div></div><div class="zona-quiz"></div>';
        function pintar() {
          var q = d.preguntas[s.i];
          raiz.querySelector('.progreso-barra').style.width = (s.i / d.preguntas.length * 100) + '%';
          raiz.querySelector('.zona-quiz').innerHTML = preguntaHTML(q, s.i, d.preguntas.length) +
            '<button class="op-quiz op-nose" data-k="-2">🤷 No sé</button>';
          s.inicioPreg = Date.now();
          Voz.leer(q.t);
        }
        raiz.querySelector('.zona-quiz').addEventListener('click', function (ev) {
          var b = ev.target.closest('.op-quiz');
          if (!b || s.bloqueado) return;
          s.bloqueado = true;
          var q = d.preguntas[s.i], k = +b.dataset.k, bien = k === q.c;
          s.r.push(k);
          // El tiempo cuenta en las respuestas correctas e incorrectas (no en "No sé")
          if (k >= 0) s.tiempo += Math.min(120000, Date.now() - s.inicioPreg);
          marcarRespuesta(raiz, q, k);
          var nb = raiz.querySelector('.op-nose'); if (nb) { nb.disabled = true; if (k === -2) nb.classList.add('elegida'); }
          if (bien) { s.aciertos++; Sonido.acierto(); } else if (k >= 0) { s.errores++; Sonido.error(); } else Sonido.toque();
          s.i++;
          setTimeout(function () {
            if (s.i < d.preguntas.length) { s.bloqueado = false; pintar(); return; }
            var act = {}, puntos = s.aciertos - s.errores, rk = rankingNeto(s.aciertos, s.errores);
            act['res.' + yo.uid] = { aciertos: s.aciertos, errores: s.errores, puntos: puntos, ms: s.tiempo, fecha: Date.now(), r: s.r, v: 2 };
            Nube.actualizar('desafios/' + d.id, act).then(function () {
              sumarRanking(rk);
              Sonido.victoria();
              raiz.querySelector('.progreso-barra').style.width = '100%';
              raiz.querySelector('.zona-quiz').innerHTML = '<div class="ol-mensaje"><span>🎯</span><h2>' + plural(puntos, 'punto', 'puntos') + '</h2>' +
                '<p class="cifras">✔ ' + s.aciertos + ' · ✘ ' + s.errores + ' · 🤷 ' + (d.preguntas.length - s.aciertos - s.errores) + ' · ⏱ ' + seg(s.tiempo) + '</p>' +
                '<p>¡Terminaste tu turno!' + (rk > 0 ? ' Sumaste ' + rk + ' puntos al ranking.' : '') + ' Cuando tu amigo juegue, vas a ver quién ganó.</p>' +
                '<button class="btn-principal" data-on="ir-reemplazar" data-p="online-desafios">Ver mis desafíos</button></div>' +
                '<h3 class="ol-sub">📋 Resumen de tus respuestas</h3>' + resumenPreguntas(d.preguntas, [{ r: s.r }]);
            }).catch(fallo);
          }, bien ? 900 : 1600);
        });
        pintar();
      }).catch(fallo);
    });
  };
  // ---------- Detalle de un desafío: cada pregunta con lo que eligió cada uno
  P['online-detalle'] = function (raiz, datos) {
    cachePerfiles = {}; // al entrar, mostrar siempre los nombres actuales
    conectar(raiz, 'Detalle del desafío', function () {
      cargando(raiz, 'Detalle del desafío');
      Promise.all([
        Nube.doc('desafios/' + datos.id),
        Nube.consulta('desafios', { donde: [['miembros', 'array-contains', yo.uid]] })
      ]).then(function (r) {
        var d = r[0];
        if (!d) { aviso('Ese desafío ya no existe'); App.volver(); return; }
        var o = d.miembros[0] === yo.uid ? d.miembros[1] : d.miembros[0];
        return perfiles([o]).then(function (mapa) {
          var n = nombreDe(o, d.info[o], mapa), mio = d.res && d.res[yo.uid], suyo = d.res && d.res[o];
          var res = mio && suyo ? resultadoDesafio(d) : null, dm = datosDesafio(d, mio), ds = datosDesafio(d, suyo);
          var c = caraACara(r[1], o);
          var cab = '<div class="marcador-grande">' +
              '<div class="mg-lado">' + avatarHTML(yo.avatar, 'grande') + '<b>Vos</b></div>' +
              '<div class="mg-num">' + (dm ? dm.puntos : '–') + ' – ' + (ds ? ds.puntos : '–') +
                '<small>' + (res ? textoResultado(res) : 'Falta que juegue tu amigo') + '</small></div>' +
              '<div class="mg-lado">' + avatarHTML(n.avatar, 'grande') + '<b>' + esc(n.alias) + '</b></div>' +
            '</div>' +
            (res && res.nota ? '<p class="nota-desempate">⚖️ ' + res.nota + '</p>' : '') +
            '<div class="cifras-desafio">' + (dm ? cifrasHTML('Vos', dm) : '') + (ds ? cifrasHTML(n.alias, ds) : '') + '</div>' +
            '<p class="ol-nota">' + temaTexto(d) + (c.total ? ' · Entre ustedes: ' + c.g + ' ganados, ' + c.p + ' perdidos, ' + c.e + ' empates' : '') + '</p>';
          var muestraSuyo = !!suyo; // la respuesta del amigo se ve solo cuando ya jugó
          var js = [];
          if (mio) js.push({ nombre: 'Vos', r: mio.r });
          if (muestraSuyo) js.push({ nombre: n.alias, r: suyo.r });
          raiz.innerHTML = cabecera('Detalle del desafío') + cab +
            '<h3 class="ol-sub">📋 Resumen de las preguntas</h3>' + resumenPreguntas(d.preguntas, js) +
            '<div class="det-pie">' + botonReporte(o, n.alias, 'desafio') + '</div>';
        });
      }).catch(fallo);
    });
  };
  // Resumen final: cada pregunta con lo que contestó cada jugador.
  // jugadores: [{ nombre (opcional), r: [índice elegido por pregunta; -2 No sé; -1 o nada = sin respuesta] }]
  // Bien: en verde. Mal: en rojo tachado. No sé: en gris. Si alguno no acertó, abajo la correcta resaltada.
  // Preguntas de versículos (también las de desafíos viejos): en el resumen, el texto va como fragmento corto
  function esVersiculo(q) { return !!q.v || /^¿Cuál es la cita de este versículo\?|^¿Qué dice /.test(q.t); }
  function opResumen(q, k) { return esVersiculo(q) && q.o[k].length > 40 ? fragmento(q.o[k]) : q.o[k]; }
  function lineaResumen(j, q, i) {
    var pre = j.nombre ? '<small>' + esc(j.nombre) + ':</small> ' : '';
    if (!j.r) return '<p class="rs rs-nose">' + pre + '<i>(sin registro: se jugó con una versión anterior)</i></p>';
    var k = j.r[i];
    if (k === q.c) return '<p class="rs rs-bien">✔ ' + pre + esc(opResumen(q, k)) + '</p>';
    if (k === -2) return '<p class="rs rs-nose">🤷 ' + pre + 'No sé</p>';
    if (k == null || k < 0 || k >= q.o.length) return '<p class="rs rs-nose">⏰ ' + pre + 'Sin respuesta</p>';
    return '<p class="rs rs-mal">✘ ' + pre + '<s>' + esc(opResumen(q, k)) + '</s></p>';
  }
  function resumenPreguntas(preguntas, jugadores) {
    return '<div class="resumen-preg">' + preguntas.map(function (q, i) {
      var lineas = q.t.split('\n');
      if (esVersiculo(q) && lineas.length > 1) lineas = [lineas[0], fragmento(lineas.slice(1).join(' '))];
      var todosBien = jugadores.length && jugadores.every(function (j) { return j.r && j.r[i] === q.c; });
      return '<div class="det-preg"><p class="det-num">Pregunta ' + (i + 1) + '</p>' +
        '<p class="det-t"><b>' + esc(lineas[0]) + '</b>' + (lineas.length > 1 ? '<br>' + esc(lineas.slice(1).join(' ')) : '') + '</p>' +
        jugadores.map(function (j) { return lineaResumen(j, q, i); }).join('') +
        (todosBien ? '' : '<p class="rs rs-correcta">Correcta: <b>' + esc(opResumen(q, q.c)) + '</b></p>') +
        (q.ref && !(esVersiculo(q) && q.ref === 'RV1960') ? '<p class="rs-ref">' + esc(q.ref) + '</p>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function preguntaHTML(q, i, n, extra) {
    var lineas = q.t.split('\n');
    return '<p class="num-quiz">Pregunta ' + (i + 1) + ' de ' + n + (extra || '') + '</p>' +
      '<div class="tarjeta-quiz">' + lineas.map(function (l, k) { return k === 0 ? '<b>' + esc(l) + '</b>' : '<p>' + esc(l) + '</p>'; }).join('') + '</div>' +
      '<div class="opciones-quiz">' + q.o.map(function (o, k) {
        return '<button class="op-quiz" data-k="' + k + '"><span class="letra-op">' + 'ABCD'[k] + '</span><span>' + esc(o) + '</span></button>';
      }).join('') + '</div>';
  }
  function marcarRespuesta(raiz, q, k) {
    var ops = raiz.querySelectorAll('.op-quiz');
    ops.forEach(function (b, j) {
      b.disabled = true;
      if (j === q.c) b.classList.add('correcta');
      else if (j === k) b.classList.add('incorrecta');
    });
  }

  // ---------- Código de recuperación (para volver a tener el mismo jugador en otro teléfono)
  // Código de 12 caracteres: los 4 primeros identifican la cuenta y los 8 últimos son la clave.
  function azarCaracteres(n) { var c = ''; for (var i = 0; i < n; i++) c += CARACTERES[Math.floor(Math.random() * CARACTERES.length)]; return c; }
  function correoDe(id) { return id.toLowerCase() + '@codigo.arcadejuegosbiblicos.app'; }
  function verCodigo(c) { return c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8, 12); }
  function codigoGuardado() { var g = Almacen.leer('codigo_rec', null); return g && yo && g.uid === yo.uid ? g.codigo : null; }
  function errorCodigo(e) {
    console.error(e);
    if (e && e.code === 'auth/operation-not-allowed') aviso('Falta activar "Correo electrónico/contraseña" en Firebase', 'error');
    else if (e && e.code === 'auth/too-many-requests') aviso('Demasiados intentos. Esperá unos minutos.', 'error');
    else fallo(e);
  }
  P['online-codigo'] = function (raiz) {
    conectar(raiz, 'Código de recuperación', function () {
      var mio = codigoGuardado();
      var intro = '<div class="ol-mensaje chico"><span>🔑</span><p>Con este código recuperás tu jugador (alias, amigos, desafíos y puntos) ' +
        'si cambiás de teléfono o reinstalás la app.</p></div>';
      if (mio) {
        raiz.innerHTML = cabecera('Código de recuperación') + intro +
          '<div class="codigo-rec">' + verCodigo(mio) + '</div>' +
          '<p class="ol-aviso-alias">📸 Sacale una captura o anotalo en un lugar seguro. No se lo pases a nadie.</p>' +
          '<button class="btn-principal" data-on="copiar-codigo" data-v="' + verCodigo(mio) + '">📋 Copiar código</button>' +
          '<button class="btn-secundario btn-codigo" data-on="nuevo-codigo">🔄 Generar un código nuevo</button>' +
          '<p class="ol-nota">Si generás uno nuevo, el anterior deja de servir.</p>';
      } else if (Nube.tieneCodigo()) {
        raiz.innerHTML = cabecera('Código de recuperación') + intro +
          '<p class="ol-intro">Tu perfil ya tiene un código, pero no está guardado en este teléfono. Si lo anotaste, sigue sirviendo.</p>';
      } else {
        raiz.innerHTML = cabecera('Código de recuperación') + intro +
          '<button class="btn-principal" data-on="crear-codigo">🔑 Crear mi código</button>';
      }
    });
  };
  function crearCodigo(b, intento) {
    b.disabled = true;
    var id = azarCaracteres(4), clave = azarCaracteres(8);
    Nube.vincularCodigo(correoDe(id), clave).then(function () {
      Almacen.guardar('codigo_rec', { uid: yo.uid, codigo: id + clave });
      Sonido.acierto(); App.reemplazar('online-codigo');
    }).catch(function (e) {
      if (e && /already-in-use/.test(e.code || '') && (intento || 0) < 4) return crearCodigo(b, (intento || 0) + 1);
      b.disabled = false; errorCodigo(e);
    });
  }
  function nuevoCodigo(b) {
    if (!b.dataset.seguro) { b.dataset.seguro = '1'; b.textContent = '⚠️ Tocá otra vez: el código actual dejará de servir'; return; }
    b.disabled = true;
    var viejo = codigoGuardado(), id = viejo.slice(0, 4), clave = azarCaracteres(8);
    Nube.cambiarClave(correoDe(id), viejo.slice(4), clave).then(function () {
      Almacen.guardar('codigo_rec', { uid: yo.uid, codigo: id + clave });
      Sonido.acierto(); aviso('Código nuevo creado', 'ok'); App.reemplazar('online-codigo');
    }).catch(function (e) { b.disabled = false; errorCodigo(e); });
  }
  // Recuperar un perfil con el código (desde la pantalla de perfil nuevo)
  P['online-recuperar'] = function (raiz) {
    raiz._rec = '';
    raiz.innerHTML = cabecera('Recuperar mi perfil') +
      '<p class="ol-intro">Tocá los 12 caracteres de tu código de recuperación:</p>' +
      '<div class="casillas-rec">' + [0, 1, 2].map(function (g) {
        return '<div class="grupo-rec">' + [0, 1, 2, 3].map(function () { return '<span class="casilla"></span>'; }).join('') + '</div>';
      }).join('<span class="guion">-</span>') + '</div>' +
      tecladoCodigoHTML('tecla-rec', 'tecla-rec-borrar') +
      '<button class="btn-principal" data-on="recuperar" disabled>🔑 Recuperar mi perfil</button>';
  };
  function pintarRec(raiz) {
    raiz.querySelectorAll('.casillas-rec .casilla').forEach(function (c, i) { c.textContent = raiz._rec[i] || ''; c.classList.toggle('llena', !!raiz._rec[i]); });
    raiz.querySelector('[data-on="recuperar"]').disabled = raiz._rec.length !== 12;
  }
  function recuperar(raiz, b) {
    var c = raiz._rec;
    b.disabled = true;
    var listo = Nube.uid ? Promise.resolve() : Nube.iniciar();
    listo.then(function () { return Nube.entrarConCodigo(correoDe(c.slice(0, 4)), c.slice(4)); }).then(function (uid) {
      Almacen.guardar('codigo_rec', { uid: uid, codigo: c });
      yo = null; cachePerfiles = {};
      Sonido.victoria(); aviso('¡Recuperaste tu perfil!', 'ok');
      App.reemplazar('online');
    }).catch(function (e) {
      b.disabled = false;
      if (e && e.code === 'auth/too-many-requests') aviso('Demasiados intentos. Esperá unos minutos.', 'error');
      else if (e && /credential|password|user-not-found|invalid/.test(e.code || '')) aviso('Ese código no es correcto. Revisalo y probá de nuevo.', 'error');
      else errorCodigo(e);
    });
  }

  // ---------- Duelo en vivo: elegir organizar o entrar
  P['online-duelo'] = function (raiz) {
    conectar(raiz, 'Duelo en vivo', function () {
      raiz.innerHTML = cabecera('Duelo en vivo') +
        '<div class="ol-opciones una-col">' +
          '<button class="ol-opcion op-duelo" data-on="ir" data-p="online-organizar"><span class="ic">🎤</span><b>Organizar un duelo</b><small>Elegís el tema y te damos un código para compartir</small></button>' +
          '<button class="ol-opcion op-desafio" data-on="ir" data-p="online-unirse"><span class="ic">🔑</span><b>Entrar con código</b><small>Escribí el código de 6 caracteres del organizador</small></button>' +
        '</div>';
    });
  };
  P['online-organizar'] = function (raiz) {
    conectar(raiz, 'Organizar duelo', function () {
      raiz._org = { tema: todosLosTemas(), n: 10, seg: 20, juega: true, modo: 'relampago' };
      raiz.innerHTML = cabecera('Organizar duelo') +
        '<h3 class="ol-sub">Temas</h3>' + temasHTML(raiz._org.tema) +
        '<h3 class="ol-sub">Modo de juego</h3><div class="modos-duelo">' + MODOS_DUELO.map(function (m) {
          return '<button class="btn-modo' + (m.id === 'relampago' ? ' activa' : '') + '" data-on="modo-org" data-v="' + m.id + '"><b>' + m.nombre + '</b><small>' + m.explica + '</small></button>';
        }).join('') + '</div>' +
        '<h3 class="ol-sub">Preguntas</h3><div class="chips" data-grupo="n">' + [5, 10, 15, 20].map(function (n) {
          return '<button class="chip' + (n === 10 ? ' activa' : '') + '" data-on="opcion-org" data-c="n" data-v="' + n + '">' + n + '</button>'; }).join('') + '</div>' +
        '<h3 class="ol-sub">Segundos por pregunta</h3><div class="chips" data-grupo="seg">' + [10, 20, 30].map(function (n) {
          return '<button class="chip' + (n === 20 ? ' activa' : '') + '" data-on="opcion-org" data-c="seg" data-v="' + n + '">' + n + ' s</button>'; }).join('') + '</div>' +
        '<label class="interruptor ol-juega"><span>🙋 Yo también juego</span><input type="checkbox" data-on-cambio="juega" checked></label>' +
        '<button class="btn-principal" data-on="crear-sala">⚡ Crear sala</button>';
      pintarTemas(raiz, raiz._org.tema);
    });
  };
  function codigoNuevo() {
    var c = '';
    for (var i = 0; i < 6; i++) c += CARACTERES[Math.floor(Math.random() * CARACTERES.length)];
    return c;
  }
  function crearSala(raiz, intento) {
    var o = raiz._org, codigo = codigoNuevo(), b = raiz.querySelector('[data-on="crear-sala"]');
    b.disabled = true;
    var sala = { org: yo.uid, orgAlias: yo.alias, orgAvatar: yo.avatar, tema: o.tema, seg: o.seg, juega: o.juega, modo: o.modo,
      estado: 'espera', indice: -1, preguntas: PreguntasOnline.generar(o.tema, o.n), top: [], creado: Nube.ahora() };
    Nube.crearSiNoExiste('salas/' + codigo, sala).then(function (ok) {
      if (!ok) { if ((intento || 0) < 5) return crearSala(raiz, (intento || 0) + 1); throw new Error('codigo'); }
      var pasos = [];
      if (o.juega) pasos.push(Nube.poner('salas/' + codigo + '/jugadores/' + yo.uid, JUGADOR_NUEVO()));
      return Promise.all(pasos).then(function () { App.reemplazar('online-sala', { codigo: codigo }); });
    }).catch(function (e) { b.disabled = false; fallo(e); });
  }
  P['online-unirse'] = function (raiz) {
    conectar(raiz, 'Entrar con código', function () {
      raiz._codigo = '';
      raiz.innerHTML = cabecera('Entrar con código') +
        '<p class="ol-intro">Tocá los caracteres del código que te pasó el organizador:</p>' +
        '<div class="casillas-codigo">' + [0, 1, 2, 3, 4, 5].map(function () { return '<span class="casilla"></span>'; }).join('') + '</div>' +
        tecladoCodigoHTML('tecla', 'tecla-borrar') +
        '<button class="btn-principal" data-on="entrar-sala" disabled>Entrar</button>';
    });
  };
  function pintarCodigo(raiz) {
    raiz.querySelectorAll('.casilla').forEach(function (c, i) { c.textContent = raiz._codigo[i] || ''; c.classList.toggle('llena', !!raiz._codigo[i]); });
    raiz.querySelector('[data-on="entrar-sala"]').disabled = raiz._codigo.length !== 6;
  }
  function entrarSala(raiz) {
    var codigo = raiz._codigo, b = raiz.querySelector('[data-on="entrar-sala"]');
    b.disabled = true;
    Nube.doc('salas/' + codigo).then(function (s) {
      if (!s) { aviso('No existe una sala con ese código', 'error'); b.disabled = false; return; }
      if (s.estado === 'fin' || s.estado === 'cancelada') { aviso('Ese duelo ya terminó', 'error'); b.disabled = false; return; }
      if (s.org === yo.uid) { App.reemplazar('online-sala', { codigo: codigo }); return; }
      return Nube.doc('salas/' + codigo + '/jugadores/' + yo.uid).then(function (ya) {
        if (ya) { App.reemplazar('online-sala', { codigo: codigo }); return; }
        if (s.estado !== 'espera') { aviso('El duelo ya empezó. Pedile al organizador que espere la próxima.', 'error'); b.disabled = false; return; }
        return Nube.reservarCupo('salas/' + codigo + '/meta/cupo', 'n', MAX_SALA - (s.juega ? 1 : 0)).then(function (ok) {
          if (!ok) { aviso('La sala está llena (máximo ' + MAX_SALA + ' jugadores)', 'error'); b.disabled = false; return; }
          return Nube.poner('salas/' + codigo + '/jugadores/' + yo.uid, JUGADOR_NUEVO())
            .then(function () { Sonido.acierto(); App.reemplazar('online-sala', { codigo: codigo }); });
        });
      });
    }).catch(function (e) { b.disabled = false; fallo(e); });
  }

  // ---------- La sala en vivo (organizador y jugadores)
  P['online-sala'] = function (raiz, datos) {
    conectar(raiz, 'Duelo en vivo', function () {
      var codigo = datos.codigo;
      var st = { sala: null, jugadores: [], soyOrg: false, respondida: -1, timer: null, cierre: null, mostrado: '', mias: [], misPuntos: 0, ultimo: null };
      // Mis puntos actuales (por si se vuelve a entrar a la sala en medio del duelo)
      Nube.doc('salas/' + codigo + '/jugadores/' + yo.uid).then(function (j) { if (j) st.misPuntos = j.puntos || 0; }).catch(function () {});
      try { st.mias = JSON.parse(sessionStorage.getItem('jb_duelo_' + codigo) || '[]'); } catch (e) { st.mias = []; }
      raiz.innerHTML = cabecera('Duelo · ' + codigo, Voz.boton()) + '<div class="zona-sala"><div class="ol-cargando"><div class="ol-ruedita"></div></div></div>';
      var zona = raiz.querySelector('.zona-sala');
      App.alSalir(function () {
        clearInterval(st.timer); clearTimeout(st.cierre);
        raiz._responder = raiz._comenzar = raiz._siguiente = raiz._cerrar = null;
        if (st.soyOrg && st.sala && st.sala.estado !== 'fin') Nube.actualizar('salas/' + codigo, { estado: 'cancelada' }).catch(function () {});
      });

      escuchar(Nube.escucharDoc('salas/' + codigo, function (s) {
        if (!s) { zona.innerHTML = '<div class="ol-mensaje"><span>❓</span><h2>La sala no existe</h2></div>'; return; }
        st.sala = s; st.soyOrg = s.org === yo.uid;
        if (st.soyOrg && !st.escuchandoJugadores) {
          st.escuchandoJugadores = true;
          escuchar(Nube.escucharConsulta('salas/' + codigo + '/jugadores', { orden: ['puntos', 'desc'] }, function (l) {
            st.jugadores = ordenarJugadores(l); refrescarOrg();
          }));
        }
        pintarSala();
      }));

      function clave(s) { return s.estado + ':' + s.indice; }
      function pintarSala() {
        var s = st.sala, k = clave(s);
        if (k === st.mostrado) return;
        st.mostrado = k;
        clearInterval(st.timer);
        if (s.estado === 'espera') return pintarEspera();
        if (s.estado === 'pregunta') return pintarPregunta();
        if (s.estado === 'resultado') return pintarResultado();
        if (s.estado === 'fin') return pintarFin();
        if (s.estado === 'cancelada') zona.innerHTML = '<div class="ol-mensaje"><span>🚪</span><h2>El organizador cerró la sala</h2></div>';
      }

      function pintarEspera() {
        var s = st.sala, md = modoDuelo(s);
        zona.innerHTML = '<div class="sala-codigo"><small>Código de la sala</small><b>' + codigo + '</b></div>' +
          '<p class="ol-nota">' + temaTexto(s) + ' · ' + s.preguntas.length + ' preguntas · ' + s.seg + ' s cada una</p>' +
          '<div class="aviso-modo"><b>' + md.nombre + '</b><small>' + md.reglas + '</small><small>Si empatan: gana el de menos errores; si siguen empatados, el que tardó menos.</small></div>' +
          (st.soyOrg
            ? '<p class="ol-intro">Compartí este código. Los jugadores entran desde <b>Jugar en línea → Duelo en vivo → Entrar con código</b>.</p>' +
              '<h3 class="ol-sub">Jugadores: <span class="cant">0</span> / ' + MAX_SALA + '</h3><div class="nube-jugadores"></div>' +
              '<p class="ol-nota falta-jugadores"></p>' +
              '<button class="btn-principal" data-on="comenzar-duelo" disabled>▶ Comenzar</button>'
            : '<div class="ol-mensaje chico"><span>⏳</span><h2>¡Ya estás adentro!</h2><p>Esperando que <b>' + esc(s.orgAlias) + '</b> empiece el duelo…</p></div>');
        refrescarOrg();
      }
      function refrescarOrg() {
        if (!st.soyOrg || !st.sala) return;
        var s = st.sala;
        if (s.estado === 'espera') {
          var cant = zona.querySelector('.cant'), nubeJ = zona.querySelector('.nube-jugadores'), b = zona.querySelector('[data-on="comenzar-duelo"]');
          if (!cant) return;
          cant.textContent = st.jugadores.length;
          nubeJ.innerHTML = st.jugadores.map(function (j) { return '<span class="chip-jugador">' + avatarHTML(j.avatar, 'chico') + esc(j.alias) + '</span>'; }).join('');
          // Se necesitan al menos 2 jugadores que jueguen de verdad (el organizador cuenta solo si eligió jugar)
          b.disabled = st.jugadores.length < MIN_DUELO;
          var fm = zona.querySelector('.falta-jugadores');
          if (fm) fm.textContent = st.jugadores.length < MIN_DUELO
            ? 'Para comenzar hacen falta al menos ' + MIN_DUELO + ' jugadores' + (s.juega ? '' : ' (vos no jugás, así que no contás)') + '.' : '';
        } else if (s.estado === 'pregunta') {
          var resp = st.jugadores.filter(function (j) { return j.ultima === s.indice; }).length;
          var c = zona.querySelector('.contador-resp');
          if (c) c.textContent = 'Respondieron ' + resp + ' de ' + st.jugadores.length;
          if (st.jugadores.length && resp >= st.jugadores.length) cerrarPregunta();
        }
      }
      raiz._comenzar = function () {
        if (st.jugadores.length < MIN_DUELO) { aviso('Para comenzar hacen falta al menos ' + MIN_DUELO + ' jugadores'); refrescarOrg(); return; }
        avanzar(0);
      };

      // Organizador: pasar a la pregunta i
      function avanzar(i) {
        var s = st.sala;
        if (i >= s.preguntas.length) return terminar();
        Nube.actualizar('salas/' + codigo, { estado: 'pregunta', indice: i, top: s.top || [] }).catch(fallo);
        clearTimeout(st.cierre);
        st.cierre = setTimeout(cerrarPregunta, (s.seg + 2) * 1000);
      }
      function cerrarPregunta() {
        var s = st.sala;
        if (!st.soyOrg || s.estado !== 'pregunta') return;
        clearTimeout(st.cierre);
        var top = st.jugadores.slice(0, 5).map(function (j) { return { alias: j.alias, avatar: j.avatar, puntos: j.puntos, errores: j.errores || 0, tiempo: j.tiempo || 0 }; });
        var idx = s.indice;
        (s.modo === 'relampago' ? Nube.doc('salas/' + codigo + '/primeros/' + idx).catch(function () { return null; }) : Promise.resolve(null))
          .then(function (p) {
            Nube.actualizar('salas/' + codigo, { estado: 'resultado', top: top, primero: p ? { alias: p.alias, uid: p.uid } : null }).catch(fallo);
          });
      }
      raiz._siguiente = function () { avanzar(st.sala.indice + 1); };
      raiz._cerrar = cerrarPregunta;
      function terminar() {
        var ordenados = ordenarJugadores(st.jugadores);
        var posiciones = {};
        ordenados.forEach(function (j, i) { posiciones[j.id] = i + 1; });
        var podio = ordenados.slice(0, 10).map(function (j) { return { uid: j.id, alias: j.alias, avatar: j.avatar, puntos: j.puntos, aciertos: j.aciertos, errores: j.errores || 0, tiempo: j.tiempo || 0 }; });
        Nube.actualizar('salas/' + codigo, { estado: 'fin', podio: podio, posiciones: posiciones, total: ordenados.length }).catch(fallo);
      }

      // Pregunta en curso (todos)
      function pintarPregunta() {
        var s = st.sala, q = s.preguntas[s.indice], juego = !st.soyOrg || s.juega;
        st.inicioLocal = Date.now();
        zona.innerHTML = '<div class="reloj"><div class="reloj-barra"></div><span class="reloj-num">' + s.seg + '</span></div>' +
          preguntaHTML(q, s.indice, s.preguntas.length) +
          (juego ? '<button class="op-quiz op-nose" data-k="-2">🤷 No sé</button>' : '') +
          (st.soyOrg ? '<div class="barra-org"><span class="contador-resp"></span><button class="mini" data-on="cerrar-pregunta">Cerrar pregunta ⏭</button></div>' : '') +
          '<p class="espera-resp" hidden>✔ Respuesta enviada. Esperando a los demás…</p>';
        if (!juego) zona.querySelectorAll('.op-quiz').forEach(function (b) { b.disabled = true; });
        Voz.leer(q.t.split('\n')[0]);
        var barra = zona.querySelector('.reloj-barra'), num = zona.querySelector('.reloj-num');
        st.timer = setInterval(function () {
          var resta = Math.max(0, s.seg - (Date.now() - st.inicioLocal) / 1000);
          barra.style.width = (resta / s.seg * 100) + '%';
          num.textContent = Math.ceil(resta);
          if (resta <= 0) {
            clearInterval(st.timer);
            zona.querySelectorAll('.op-quiz').forEach(function (b) { b.disabled = true; });
            if (juego && st.respondida !== s.indice) { st.respondida = s.indice; st.sinTiempo = s.indice; enviarRespuesta(-1); }
          }
        }, 200);
        refrescarOrg();
      }
      raiz._responder = function (b) {
        var s = st.sala;
        if (s.estado !== 'pregunta' || st.respondida === s.indice) return;
        st.respondida = s.indice;
        var k = +b.dataset.k;
        zona.querySelectorAll('.op-quiz').forEach(function (x) { x.disabled = true; });
        b.classList.add('elegida');
        zona.querySelector('.espera-resp').hidden = false;
        Sonido.toque();
        enviarRespuesta(k);
      };
      // k: opción elegida; -1 se terminó el tiempo; -2 "No sé"
      function enviarRespuesta(k) {
        var s = st.sala, idx = s.indice, q = s.preguntas[idx], bien = k === q.c;
        var ms = Math.round(Math.min(s.seg * 1000, Math.max(0, Date.now() - st.inicioLocal)));
        st.mias[idx] = k;
        try { sessionStorage.setItem('jb_duelo_' + codigo, JSON.stringify(st.mias)); } catch (e) {}
        st.ultimo = { idx: idx, k: k, bien: bien, primero: false, delta: 0, pendiente: true };
        function guardar(primero) {
          // Relámpago: el primero que acierta suma 2 y los demás 1. Tranqui Chill: todos 1.
          // Equivocarse resta 1 (se puede quedar en negativo); "No sé" o sin tiempo, 0.
          var delta = bien ? (s.modo === 'relampago' && primero ? 2 : 1) : (k >= 0 ? -1 : 0);
          var nuevo = st.misPuntos + delta;
          st.ultimo = { idx: idx, k: k, bien: bien, primero: !!primero, delta: nuevo - st.misPuntos };
          st.misPuntos = nuevo;
          var act = { puntos: nuevo, ultima: idx };
          // El tiempo se suma en las respuestas correctas e incorrectas (no en "No sé" ni sin tiempo)
          if (k >= 0) act.tiempo = Nube.inc(ms);
          if (bien) { act.aciertos = Nube.inc(1); if (primero) act.rayos = Nube.inc(1); }
          else if (k >= 0) act.errores = Nube.inc(1);
          Nube.actualizar('salas/' + codigo + '/jugadores/' + yo.uid, act).catch(fallo);
          if (zona.querySelector('.mi-res-pendiente')) pintarMiResultado();
        }
        if (bien && s.modo === 'relampago') {
          Nube.crearSiNoExiste('salas/' + codigo + '/primeros/' + idx, { uid: yo.uid, alias: yo.alias })
            .then(function (ok) { guardar(ok); }, function () { guardar(false); });
        } else guardar(false);
      }
      function miResultadoHTML() {
        var s = st.sala, u = st.ultimo && st.ultimo.idx === s.indice ? st.ultimo : null;
        if (!u) return '<div class="mi-res mal">⏰ Se terminó el tiempo</div>';
        if (u.pendiente) return '<div class="mi-res mi-res-pendiente">…</div>';
        if (u.bien && u.primero) return '<div class="mi-res bien rayo">⚡ ¡Fuiste el primero! +2</div>';
        if (u.bien) return '<div class="mi-res bien">✔ ¡Correcto! +1</div>';
        if (u.k === -2) return '<div class="mi-res nose">🤷 No sé · 0</div>';
        if (u.k === -1) return '<div class="mi-res mal">⏰ Se terminó el tiempo</div>';
        return '<div class="mi-res mal">✘ Incorrecto · −1</div>';
      }
      function pintarMiResultado() {
        var el = zona.querySelector('.mi-res'); if (!el) return;
        var d = document.createElement('div'); d.innerHTML = miResultadoHTML();
        el.replaceWith(d.firstChild);
      }
      function pintarResultado() {
        var s = st.sala, q = s.preguntas[s.indice], juego = !st.soyOrg || s.juega;
        var ultima = s.indice >= s.preguntas.length - 1;
        clearInterval(st.timer);
        var mio = '', u = st.ultimo && st.ultimo.idx === s.indice ? st.ultimo : null;
        if (juego) {
          mio = miResultadoHTML();
          if (u && u.bien) Sonido.acierto(); else if (!u || u.k !== -2) Sonido.error();
        }
        var rayo = s.modo === 'relampago' && s.primero && s.primero.uid !== yo.uid
          ? '<p class="aviso-rayo">⚡ ¡' + esc(s.primero.alias) + ' fue el más rápido!</p>' : '';
        zona.innerHTML = mio + rayo +
          '<div class="tarjeta-quiz"><b>Respuesta correcta</b><p class="resp-correcta">' + esc(q.o[q.c]) + '</p>' + (q.ref ? '<small>' + esc(q.ref) + '</small>' : '') + '</div>' +
          '<h3 class="ol-sub">Los mejores hasta ahora</h3>' +
          '<div class="tabla-ranking">' + (s.top || []).map(function (j, i) {
            return '<div class="fila-ol fila-rank' + (j.alias === yo.alias ? ' mio' : '') + '"><span class="pos">' + (['🥇', '🥈', '🥉'][i] || (i + 1)) + '</span>' +
              avatarHTML(j.avatar) + '<span class="nom">' + esc(j.alias) + '</span>' + ptsHTML(j, s.top || []) + '</div>';
          }).join('') + '</div>' +
          (st.soyOrg ? '<button class="btn-principal" data-on="siguiente-pregunta">' + (ultima ? '🏁 Ver resultados finales' : 'Siguiente pregunta ▶') + '</button>'
                     : '<p class="ol-nota">Esperando la siguiente pregunta…</p>');
      }
      function pintarFin() {
        var s = st.sala, pos = (s.posiciones || {})[yo.uid], juego = !st.soyOrg || s.juega;
        var podio = s.podio || [];
        if (juego && pos && !st.sumado) {
          st.sumado = true;
          Nube.doc('salas/' + codigo + '/jugadores/' + yo.uid).then(function (j) {
            // Ranking semanal: nunca resta. (aciertos − errores) x10 si da positivo, +10 por cada ⚡ y bonus de podio
            var pts = rankingNeto(j && j.aciertos, j && j.errores) + (j ? j.rayos || 0 : 0) * PUNTOS.rayo + (PUNTOS.podio[pos - 1] || 0);
            sumarRanking(pts);
            var p = zona.querySelector('.pts-ranking'); if (p) p.textContent = '+' + pts + ' puntos al ranking semanal';
          }).catch(function () {});
          if (pos <= 3) Sonido.victoria();
        }
        zona.innerHTML = '<h2 class="titulo-fin">🏁 ¡Fin del duelo!</h2>' +
          '<div class="podio">' + [1, 0, 2].map(function (i) {
            var j = podio[i]; if (!j) return '<div class="escalon vacio"></div>';
            return '<div class="escalon e' + (i + 1) + '">' + avatarHTML(j.avatar, 'grande') + '<b>' + esc(j.alias) + '</b><small>' + j.puntos + ' pts</small>' +
              '<div class="bloque">' + (i + 1) + '</div></div>';
          }).join('') + '</div>' +
          (juego && pos ? '<div class="mi-posicion">Quedaste en el puesto <b>' + pos + '</b> de ' + s.total + '<small class="pts-ranking"></small></div>' : '') +
          '<div class="tabla-ranking">' + podio.map(function (j, i) {
            return '<div class="fila-ol fila-rank' + (j.uid === yo.uid ? ' mio' : '') + '"><span class="pos">' + (i + 1) + '</span>' + avatarHTML(j.avatar) +
              '<span class="nom">' + esc(j.alias) + '</span>' + ptsHTML(j, podio) + botonReporte(j.uid, j.alias, 'duelo') + '</div>';
          }).join('') + '</div>' +
          notasDesempate(podio) +
          '<p class="ol-nota">' + modoDuelo(s).nombre + ' · si empatan en puntos, gana el de menos errores; si siguen empatados, el que tardó menos</p>' +
          '<h3 class="ol-sub">📋 Resumen de las preguntas</h3>' +
          resumenPreguntas(s.preguntas, juego ? [{ r: st.mias }] : []) +
          '<button class="btn-principal" data-on="ir-reemplazar" data-p="online">Salir</button>';
      }
    });
  };

  // ================================================================ TOQUES
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-on]');
    if (!b || b.disabled) return;
    var raiz = App.raiz, a = b.dataset.on;
    switch (a) {
      case 'reintentar': Sonido.toque(); App.reemplazar(raiz.dataset.actual, raiz._datos); break;
      case 'ir': Sonido.toque(); App.ir(b.dataset.p); break;
      case 'ir-reemplazar': Sonido.toque(); App.reemplazar(b.dataset.p); break;
      case 'editar-perfil': Sonido.toque(); App.ir('online-perfil'); break;
      case 'tecla-alias': case 'tecla-alias-borrar': {
        var cont = b.closest('.constructor'); if (!cont) break;
        var sel = selDe(cont);
        Sonido.toque();
        if (a === 'tecla-alias') {
          var v = b.dataset.v, t = sel.texto;
          // Sin espacio al principio ni dos espacios seguidos
          if (v === ' ' && (!t || t.slice(-1) === ' ')) break;
          if (t.length < MAX_ALIAS) sel.texto = t + v;
        } else sel.texto = sel.texto.slice(0, -1);
        cambioConstructor(cont);
        break;
      }
      case 'usar-sugerencia': {
        Sonido.toque();
        var cp = raiz.querySelector('.constructor[data-ambito="perfil"]');
        raiz._bld.perfil.texto = b.dataset.num;
        cambioConstructor(cp);
        break;
      }
      case 'avatar':
        Sonido.toque();
        raiz.querySelectorAll('.btn-avatar').forEach(function (x) { x.classList.toggle('activa', x === b); });
        raiz._bld.perfil.avatar = b.dataset.v;
        actualizarAlias(raiz);
        break;
      case 'guardar-perfil': guardarPerfil(raiz); break;
      case 'borrar-perfil': Sonido.toque(); borrarPerfil(b); break;
      case 'agregar-amigo': {
        Sonido.toque();
        var z = raiz.querySelector('.zona-buscar');
        z.hidden = !z.hidden;
        if (!z.hidden && !z.innerHTML) { raiz._bld = raiz._bld || {}; raiz._bld.buscar = selVacio(); z.innerHTML = selectorBusqueda(); }
        if (!z.hidden) z.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'buscar-amigo': {
        var alias = aliasDe(raiz._bld.buscar), out = raiz.querySelector('.resultado-busqueda');
        out.innerHTML = '<p class="vacio">Buscando…</p>';
        Nube.doc('alias/' + claveAlias(alias)).then(function (d) {
          if (!d) { out.innerHTML = '<p class="vacio">No encontramos a nadie con el alias <b>' + esc(alias) + '</b>. Revisá cada letra, palabra y número.</p>'; return; }
          return Nube.doc('usuarios/' + d.uid).then(function (u) {
            if (!u) { out.innerHTML = '<p class="vacio">No encontramos ese jugador.</p>'; return; }
            out.innerHTML = '<div class="fila-ol">' + avatarHTML(u.avatar) + '<span class="nom">' + esc(u.alias) + '</span>' +
              (d.uid === yo.uid ? '<span class="pendiente">Sos vos 😄</span>' :
              '<button class="mini ok" data-on="solicitar" data-uid="' + d.uid + '" data-alias="' + esc(u.alias) + '" data-avatar="' + esc(u.avatar) + '">Enviar solicitud</button>') + '</div>';
          });
        }).catch(fallo);
        break;
      }
      case 'solicitar': Sonido.toque(); b.disabled = true; enviarSolicitud(b.dataset.uid, b.dataset.alias, b.dataset.avatar); break;
      case 'aceptar': Sonido.acierto(); Nube.actualizar('amistades/' + b.dataset.id, { estado: 'aceptada' }).catch(fallo); break;
      case 'rechazar': Sonido.toque(); Nube.borrar('amistades/' + b.dataset.id).catch(fallo); break;
      case 'desafiar': Sonido.toque(); App.ir('online-nuevo-desafio', { uid: b.dataset.uid }); break;
      case 'club-ranking': Sonido.toque(); App.reemplazar('online-ranking', { club: b.dataset.club }); break;
      case 'nuevo-desafio': Sonido.toque(); App.ir('online-nuevo-desafio'); break;
      case 'elegir-amigo':
        Sonido.toque();
        raiz.querySelectorAll('.sel-amigo').forEach(function (x) { x.classList.toggle('activa', x === b); });
        raiz._desafio.amigo = b.dataset.uid; revisarDesafio(raiz);
        break;
      case 'tema': {
        var sel = (temasActuales(raiz) || []).slice(), i = sel.indexOf(b.dataset.v);
        if (i >= 0) {
          if (sel.length === 1) { Sonido.error(); sacudir(b); aviso('Tiene que quedar al menos un tema'); break; }
          sel.splice(i, 1);
        } else sel.push(b.dataset.v);
        Sonido.toque();
        // Mantener el orden de la lista de temas
        ponerTemas(raiz, todosLosTemas().filter(function (x) { return sel.indexOf(x) >= 0; }));
        break;
      }
      case 'tema-todos': Sonido.toque(); ponerTemas(raiz, todosLosTemas()); break;
      case 'modo-org':
        Sonido.toque();
        raiz.querySelectorAll('.btn-modo').forEach(function (x) { x.classList.toggle('activa', x === b); });
        raiz._org.modo = b.dataset.v;
        break;
      case 'crear-desafio': Sonido.toque(); crearDesafio(raiz); break;
      case 'jugar-desafio': Sonido.toque(); App.ir('online-quiz', { desafio: b.dataset.id }); break;
      case 'ver-detalle': Sonido.toque(); App.ir('online-detalle', { id: b.dataset.id }); break;
      case 'reportar': Sonido.toque(); reportar(b); break;
      case 'crear-codigo': Sonido.toque(); crearCodigo(b); break;
      case 'nuevo-codigo': Sonido.toque(); nuevoCodigo(b); break;
      case 'copiar-codigo':
        Sonido.toque();
        (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.v) : Promise.reject())
          .then(function () { aviso('Código copiado', 'ok'); }, function () { aviso('Sacale una captura de pantalla para guardarlo'); });
        break;
      case 'tecla-rec': Sonido.toque(); if (raiz._rec.length < 12) { raiz._rec += b.dataset.v; pintarRec(raiz); } break;
      case 'tecla-rec-borrar': Sonido.toque(); raiz._rec = raiz._rec.slice(0, -1); pintarRec(raiz); break;
      case 'recuperar': Sonido.toque(); recuperar(raiz, b); break;
      case 'opcion-org':
        Sonido.toque();
        b.parentNode.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('activa', x === b); });
        raiz._org[b.dataset.c] = +b.dataset.v;
        break;
      case 'crear-sala': Sonido.toque(); crearSala(raiz); break;
      case 'tecla':
        Sonido.toque();
        if (raiz._codigo.length < 6) { raiz._codigo += b.dataset.v; pintarCodigo(raiz); }
        break;
      case 'tecla-borrar': Sonido.toque(); raiz._codigo = raiz._codigo.slice(0, -1); pintarCodigo(raiz); break;
      case 'entrar-sala': Sonido.toque(); entrarSala(raiz); break;
      case 'comenzar-duelo': Sonido.toque(); b.disabled = true; raiz._comenzar(); break;
      case 'cerrar-pregunta': Sonido.toque(); b.disabled = true; raiz._cerrar(); break;
      case 'siguiente-pregunta': Sonido.toque(); b.disabled = true; raiz._siguiente(); break;
    }
  });
  // Respuestas en la sala en vivo
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('.zona-sala .op-quiz');
    if (b && !b.disabled && App.raiz._responder) App.raiz._responder(b);
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.dataset.onCambio === 'juega' && App.raiz._org) App.raiz._org.juega = ev.target.checked;
  });

  window.PANTALLAS_EXTRA = P;
  window.Online = { semana: semana, claveAlias: claveAlias };
})();
