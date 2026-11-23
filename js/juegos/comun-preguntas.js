// Ayudas comunes para los juegos de preguntas con opciones y de "encontrá todos"
window.JuegoComun = {
  OPCIONES: { aventureros: 3, ninguno: 4, conquistadores: 5 },
  FALSOS_SELECCION: { aventureros: 4, ninguno: 6, conquistadores: 8 },
  // Crea las funciones de fallo/acierto/terminar para una sesión
  crear: function (prefijo, nombreJuego, getS, getApp) {
    return {
      fallo: function (el) {
        var s = getS(), app = getApp();
        Sonido.error(); s.errores++; s.seguidos++;
        if (el) marcarError(el);
        if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
      },
      acierto: function () { var s = getS(); Sonido.acierto(); s.seguidos = 0; },
      terminar: function (titulo, aciertos, erroresExtra) {
        var s = getS(), app = getApp();
        var errores = s.errores + (erroresExtra || 0);
        var est = Estrellas.calcular(errores);
        Estrellas.guardar(prefijo + s.modo, est);
        Sonido.victoria();
        Voz.despues(900, function () {
          app.resultado({ juego: nombreJuego, modo: s.modo, estrellas: est, errores: errores, aciertos: aciertos, titulo: titulo });
        });
      }
    };
  },
  // Juego de "tocá todos los correctos"
  seleccion: function (s, ui, app, f, cfg) {
    var nFalsos = this.FALSOS_SELECCION[s.club] || 6;
    var items = cfg.correctos.map(function (c, i) { return { id: 'c' + i, txt: c.txt, icono: c.icono, ok: true }; })
      .concat(Azar.mezclar(cfg.falsos).slice(0, nFalsos).map(function (c, i) { return { id: 'f' + i, txt: c.txt, icono: c.icono, ok: false }; }));
    var total = cfg.correctos.length;
    ui.cont.innerHTML = '<p class="consigna">' + cfg.consigna + '</p><p class="contador-sel"></p><div class="zona-sel"></div>' +
      (cfg.cita ? '<p class="cita-sel">' + cfg.cita + ' (RV1960)</p>' : '');
    var contador = ui.cont.querySelector('.contador-sel');
    function cuenta(faltan) { contador.textContent = (total - faltan) + ' de ' + total; ui.progreso((total - faltan) / total); }
    cuenta(total);
    var sel = armarSeleccion(ui.cont.querySelector('.zona-sel'), items, {
      alAcertar: function (b, faltan) {
        f.acierto(); cuenta(faltan);
        Voz.decir(b.querySelector('.txt').textContent);
        if (faltan && faltan === Math.floor(total / 2)) Personaje.aparecer(app.perfil(), Azar.frase('durante'), 'saludando');
      },
      alFallar: function (b) { f.fallo(b); },
      alTerminar: function () {
        s.bloqueado = true; Ayuda.poner(null);
        Personaje.aparecer(app.perfil(), cfg.final, 'festejando');
        f.terminar(cfg.titulo, total);
      }
    });
    Ayuda.poner(function () { if (sel.pista()) s.errores++; });
  },
  // Pregunta con opciones: p = { texto, consigna, correcta, falsas[] , despues? }
  opcionesHTML: function (correcta, falsas, n, iconos) {
    return Azar.mezclar([correcta].concat(Azar.mezclar(falsas).slice(0, n - 1))).map(function (o) {
      return '<button class="opcion-mand" data-v="' + String(o).replace(/"/g, '&quot;') + '">' +
        (iconos && iconos[o] ? '<span class="ic">' + iconos[o] + '</span>' : '') + '<span class="txt">' + o + '</span></button>';
    }).join('');
  }
};
