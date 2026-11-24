// Desafío diario: el versículo del día y 3 preguntas, iguales para todos ese día (no necesita internet).
// Se juega una vez por día. La racha cuenta los días seguidos completados.
(function () {
  var N_PREG = 3;

  function fechaLocal(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function ayer() { var d = new Date(); d.setDate(d.getDate() - 1); return fechaLocal(d); }
  function numeroDia(f) { var p = f.split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }

  // Azar con semilla: el mismo día da los mismos resultados en todos los aparatos
  function semilla(txt) {
    var h = 1779033703 ^ txt.length;
    for (var i = 0; i < txt.length; i++) { h = Math.imul(h ^ txt.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return function () {
      h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }
  function conSemilla(txt, fn) {
    var original = Math.random;
    Math.random = semilla(txt);
    try { return fn(); } finally { Math.random = original; }
  }

  function estado() {
    var e = Almacen.leer('diario', null) || { ultimo: '', racha: 0, mejor: 0, total: 0, aciertos: 0 };
    // Si pasó más de un día sin jugar, la racha se cortó
    if (e.ultimo && e.ultimo !== fechaLocal() && e.ultimo !== ayer()) e.racha = 0;
    return e;
  }
  function hechoHoy() { return estado().ultimo === fechaLocal(); }

  // Versículos del día: de los más conocidos y que dan ánimo (el texto sale de los datos del juego, RV1960)
  var DEL_DIA = ['Juan 3:16', 'Salmos 23:1', 'Filipenses 4:13', 'Jeremías 29:11', 'Josué 1:9', 'Proverbios 3:5-6', 'Isaías 41:10',
    'Romanos 8:28', 'Mateo 11:28', 'Salmos 46:1', '1 Juan 4:8', 'Mateo 6:33', 'Salmos 119:105', '2 Timoteo 1:7', 'Juan 14:6',
    'Romanos 12:2', 'Isaías 40:31', 'Mateo 28:20', 'Hebreos 11:1', 'Salmos 37:5', 'Juan 14:1', 'Juan 14:3', 'Apocalipsis 21:4',
    'Salmos 91:1', 'Efesios 2:8', '1 Pedro 5:7', 'Santiago 1:5', 'Mateo 5:14', 'Salmos 27:1', 'Nahúm 1:7', 'Sofonías 3:17',
    'Isaías 26:3', 'Juan 15:13', 'Juan 16:33', 'Deuteronomio 31:6', 'Salmos 34:8', 'Salmos 118:24', 'Proverbios 18:10', 'Isaías 43:2',
    'Mateo 7:7', 'Juan 10:10', 'Filipenses 4:6', 'Éxodo 14:14', 'Salmos 56:3', 'Isaías 12:2', 'Salmos 37:4', 'Salmos 139:14',
    'Juan 8:32', '1 Juan 1:9', 'Isaías 53:5', 'Mateo 5:8', 'Salmos 51:10', 'Eclesiastés 12:1', '1 Timoteo 4:12', 'Salmos 119:11',
    'Juan 11:25', 'Éxodo 20:8', 'Juan 14:15', 'Salmos 32:8', 'Isaías 40:8', 'Proverbios 16:3', 'Miqueas 6:8', 'Mateo 22:37',
    'Juan 13:34', '1 Corintios 10:31', '2 Crónicas 7:14', 'Salmos 145:18', 'Habacuc 3:18', 'Lamentaciones 3:22-23', 'Salmos 121:1-2',
    'Salmos 121:7', 'Filipenses 4:4', '1 Tesalonicenses 5:16-18', 'Salmos 103:1-2', 'Proverbios 4:23', 'Juan 14:27', 'Colosenses 3:17',
    'Lamentaciones 3:25'];
  function versiculoDelDia() {
    var V = DATOS_VERSICULOS.versiculos, n = numeroDia(fechaLocal());
    var lista = DEL_DIA.map(function (c) { return V.filter(function (v) { return v.cita === c; })[0]; }).filter(Boolean);
    // Cada vuelta completa a la lista va en otro orden, sin repetir dentro de la vuelta
    var vuelta = Math.floor(n / lista.length);
    var orden = conSemilla('vers-' + vuelta, function () { return Azar.mezclar(lista); });
    return orden[n % lista.length];
  }
  function preguntasDelDia() {
    var hoy = fechaLocal();
    return conSemilla('arca-' + hoy, function () {
      return PreguntasOnline.generar(PreguntasOnline.TEMAS.map(function (t) { return t.id; }), N_PREG);
    });
  }

  // Cartel del menú (debajo de "Jugar en línea")
  function bannerHTML() {
    var e = estado(), hecho = hechoHoy();
    var racha = e.racha > 0 ? '<span class="dr-racha">🔥 ' + e.racha + (e.racha === 1 ? ' día' : ' días') + '</span>' : '';
    return '<button class="banner-diario' + (hecho ? ' hecho' : '') + '" data-accion="diario">' +
      '<span class="dr-icono">' + (hecho ? '✅' : '🎯') + '</span>' +
      '<span class="dr-texto"><b>' + (hecho ? '¡Desafío de hoy completado!' : 'Desafío de hoy') + '</b>' +
      '<small>' + (hecho ? 'Volvé mañana para seguir tu racha' : 'Versículo del día y ' + N_PREG + ' preguntas') + '</small></span>' +
      racha + '</button>';
  }

  function pantalla(raiz) {
    var ui = cabeceraJuego(raiz, 'Desafío de hoy');
    Ayuda.poner(null);
    var v = versiculoDelDia(), e = estado();
    if (hechoHoy()) {
      ui.progreso(1);
      ui.cont.innerHTML = versiculoHTML(v) +
        '<div class="diario-fin"><span>✅</span><h2>Ya hiciste el desafío de hoy</h2>' +
        '<p>Acertaste ' + (e.hoy || 0) + ' de ' + N_PREG + '. ¡Volvé mañana!</p>' + rachaHTML(e) + '</div>';
      Voz.leer('Versículo del día. ' + v.cita.replace(':', ', ') + '. ' + v.texto);
      return;
    }
    ui.progreso(0);
    ui.cont.innerHTML = versiculoHTML(v) + '<button class="btn-principal" data-on="diario-empezar">Empezar las ' + N_PREG + ' preguntas ▶</button>';
    Voz.leer('Versículo del día. ' + v.cita.replace(':', ', ') + '. ' + v.texto);
    ui.cont.querySelector('[data-on="diario-empezar"]').addEventListener('click', function () {
      Sonido.toque(); Voz.cancelar(); jugar(ui);
    });
  }

  function versiculoHTML(v) {
    return '<div class="diario-vers"><small>📖 Versículo del día</small><p>“' + v.texto + '”</p><b>' + v.cita + '</b></div>';
  }
  function rachaHTML(e) {
    return '<div class="diario-racha"><b>🔥 ' + e.racha + (e.racha === 1 ? ' día seguido' : ' días seguidos') + '</b>' +
      '<small>Tu mejor racha: ' + e.mejor + (e.mejor === 1 ? ' día' : ' días') + ' · Desafíos completados: ' + e.total + '</small></div>';
  }

  function jugar(ui) {
    var qs = preguntasDelDia(), i = 0, bien = 0, bloqueado = false;
    function pintar() {
      var q = qs[i], lineas = q.t.split('\n');
      ui.progreso(i / qs.length);
      ui.cont.innerHTML = '<p class="consigna"><span class="num-pregunta">' + (i + 1) + ' de ' + qs.length + '</span>' + lineas[0] + '</p>' +
        (lineas.length > 1 ? '<div class="situacion"><p>' + lineas.slice(1).join(' ') + '</p></div>' : '') +
        '<div class="opciones">' + q.o.map(function (o, k) {
          return '<button class="opcion-mand" data-k="' + k + '"><span class="txt">' + o + '</span></button>';
        }).join('') + '</div><div class="zona-siguiente"></div>';
      bloqueado = false;
      Voz.leer(lineas.join('. '));
    }
    ui.cont.addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || bloqueado) return;
      bloqueado = true;
      var q = qs[i], k = +b.dataset.k, ok = k === q.c;
      ui.cont.querySelectorAll('.opcion-mand').forEach(function (x) { x.disabled = true; });
      ui.cont.querySelector('.opcion-mand[data-k="' + q.c + '"]').classList.add('correcta');
      // Frase de acierto: va cambiando y no se repite seguida (la voz no la lee)
      var frase = '';
      if (ok) {
        bien++; Sonido.acierto(); try { Voz.callar(); } catch (e) {}
        var FRASES = ['¡Bien!', '¡Muy bien!', '¡Excelente!'], ant = ui.cont._frase;
        do { frase = FRASES[Math.floor(Math.random() * FRASES.length)]; } while (frase === ant);
        ui.cont._frase = frase;
      }
      else { Sonido.error(); b.classList.add('mal'); }
      i++;
      var ultima = i >= qs.length;
      mostrarAcierto(ui.cont.querySelector('.zona-siguiente'),
        ok ? tarjetaVerde(frase, q.ref || '') :
          '<div class="tarjeta-roja"><b>La respuesta correcta era:</b><span>' + q.o[q.c] + (q.ref ? ' · ' + q.ref : '') + '</span></div>',
        function () { if (ultima) terminar(); else pintar(); }, ultima ? 'Ver resultado ▶' : null);
    });
    function terminar() {
      var e = estado(), hoy = fechaLocal();
      e.racha = e.ultimo === ayer() ? e.racha + 1 : 1;
      e.mejor = Math.max(e.mejor || 0, e.racha);
      e.total = (e.total || 0) + 1;
      e.aciertos = (e.aciertos || 0) + bien;
      e.ultimo = hoy; e.hoy = bien;
      Almacen.guardar('diario', e);
      ui.progreso(1);
      Sonido.victoria();
      ui.cont.innerHTML = '<div class="diario-fin"><span>' + (bien === qs.length ? '🏆' : '🎯') + '</span>' +
        '<h2>¡Desafío completado!</h2><p>Acertaste ' + bien + ' de ' + qs.length + '.</p>' + rachaHTML(e) +
        '<button class="btn-principal" data-accion="volver">Volver al menú</button></div>';
      Voz.leer('¡Desafío completado! Acertaste ' + bien + ' de ' + qs.length + '. Racha: ' + e.racha + (e.racha === 1 ? ' día.' : ' días.'));
      if (window.Album) Album.revisar();
    }
    pintar();
  }

  window.Diario = { bannerHTML: bannerHTML, estado: estado, hechoHoy: hechoHoy, _preguntas: preguntasDelDia, _versiculo: versiculoDelDia };
  window.PANTALLAS_EXTRA = window.PANTALLAS_EXTRA || {};
  window.PANTALLAS_EXTRA.diario = function (raiz) { pantalla(raiz); };
})();
