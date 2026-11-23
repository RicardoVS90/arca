// Juego: la estatua de Daniel 2
(function () {
  var D = window.DATOS_DANIEL;

  var MODOS = [
    { id: 'armar', nombre: 'Armar la estatua', icono: '🗿', imagen: 'img/menu/isla-daniel.webp', desc: 'Arrastrá cada metal a su lugar en la estatua' },
    { id: 'imperios', nombre: 'Metales e imperios', icono: '👑', imagen: 'img/modos/corona.webp', desc: '¿Qué reino representa cada metal?' }
  ];

  var s, ui, app;

  function porId(id) { return D.partes.filter(function (p) { return p.id === id; })[0]; }
  function fallo(el) {
    Sonido.error();
    s.errores++; s.seguidos++;
    if (el) marcarError(el);
    if (s.seguidos === 2 || s.seguidos % 4 === 0) Personaje.aparecer(app.perfil(), Azar.frase('animo'), 'animando');
  }
  function acierto() { Sonido.acierto(); s.seguidos = 0; }
  function terminar(titulo, espera) {
    var est = Estrellas.calcular(s.errores);
    Estrellas.guardar('dan_' + s.modo, est);
    setTimeout(function () {
      app.resultado({ juego: 'daniel', modo: s.modo, estrellas: est, errores: s.errores, aciertos: D.partes.length, titulo: titulo });
    }, espera || 1200);
  }

  function caja(r) { return 'left:' + r.x + '%;top:' + r.y + '%;width:' + r.w + '%;height:' + r.h + '%'; }

  function estatuaHTML(vacia) {
    var img = D.imagen, h = '';
    D.partes.forEach(function (p) {
      h += '<img class="pieza p-' + p.id + (vacia ? ' oculta' : '') + '" data-id="' + p.id + '" src="img/daniel/' + p.id + '.webp" alt="" style="' + caja(img.capas[p.id]) + '">';
    });
    D.partes.forEach(function (p) {
      h += '<div class="zona-estatua' + (vacia ? ' vacia' : '') + '" data-id="' + p.id + '" style="' + caja(img.zonas[p.id]) + '"></div>';
    });
    return '<div class="escenario-daniel">' +
      '<div class="estatua" style="aspect-ratio:' + img.proporcion + '">' +
        '<img class="silueta" src="img/daniel/silueta.webp" alt="">' + h +
      '</div>' +
      '<div class="monte-origen"></div><div class="piedra"></div><div class="monte"></div>' +
      '<p class="verso-reino"></p>' +
    '</div>';
  }

  // ---------- Final animado (Daniel 2:34-35) ----------
  // La piedra se desprende del monte, vuela, golpea los pies, la estatua se rompe en pedazos
  // de abajo hacia arriba y la piedra crece hasta llenar la tierra.
  function rel(el, base) {
    var a = el.getBoundingClientRect(), b = base.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }

  function particula(esc, x, y, clase, tam) {
    var p = document.createElement('div');
    p.className = clase;
    p.style.left = x + 'px'; p.style.top = y + 'px';
    if (tam) { p.style.width = tam + 'px'; p.style.height = tam + 'px'; }
    esc.appendChild(p);
    return p;
  }

  function romperPieza(esc, img, retraso) {
    setTimeout(function () {
      var r = rel(img, esc), cols = 4, filas = 4, fw = r.w / cols, fh = r.h / filas;
      var suelo = esc.clientHeight - 52;
      img.style.transition = 'none';
      img.style.opacity = '0';
      for (var f = 0; f < filas; f++) {
        for (var c = 0; c < cols; c++) {
          var fr = document.createElement('div');
          fr.className = 'fragmento';
          fr.style.left = (r.x + c * fw) + 'px';
          fr.style.top = (r.y + f * fh) + 'px';
          fr.style.width = fw + 'px';
          fr.style.height = fh + 'px';
          fr.style.backgroundImage = 'url(' + img.getAttribute('src') + ')';
          fr.style.backgroundSize = r.w + 'px ' + r.h + 'px';
          fr.style.backgroundPosition = (-c * fw) + 'px ' + (-f * fh) + 'px';
          esc.appendChild(fr);
          var dx = (c - (cols - 1) / 2) * (30 + Math.random() * 40) + (Math.random() * 30 - 15);
          var caida = suelo - (r.y + f * fh) - fh + Math.random() * 20;
          var giro = (Math.random() * 2 - 1) * 260;
          fr.animate([
            { transform: 'translate(0,0) rotate(0)', opacity: 1 },
            { transform: 'translate(' + dx * 0.4 + 'px,' + (-15 - Math.random() * 25) + 'px) rotate(' + giro * 0.3 + 'deg)', opacity: 1, offset: 0.25 },
            { transform: 'translate(' + dx + 'px,' + caida + 'px) rotate(' + giro + 'deg)', opacity: 1, offset: 0.8 },
            { transform: 'translate(' + dx * 1.05 + 'px,' + caida + 'px) rotate(' + giro + 'deg)', opacity: 1 }
          ], { duration: 1300 + Math.random() * 400, easing: 'cubic-bezier(.35,0,.7,1)', fill: 'forwards' });
        }
      }
      // Polvo donde cae la pieza
      for (var k = 0; k < 6; k++) {
        var p = particula(esc, r.x + Math.random() * r.w, suelo - 10, 'polvo', 18 + Math.random() * 22);
        p.animate([
          { transform: 'scale(.3)', opacity: 0 },
          { transform: 'scale(1)', opacity: .8, offset: .3 },
          { transform: 'translateY(-30px) scale(1.8)', opacity: 0 }
        ], { duration: 1400, delay: 700 + Math.random() * 400, fill: 'forwards' });
      }
    }, retraso);
  }

  function finalPiedra(titulo) {
    var esc = ui.cont.querySelector('.escenario-daniel');
    var est = esc.querySelector('.estatua');
    var piedra = esc.querySelector('.piedra');
    var leyenda = ui.cont.querySelector('.leyenda');
    var W = esc.clientWidth;
    esc.classList.add('final');
    // Versículo al azar para el final
    var v = D.versiculosFinal[Math.floor(Math.random() * D.versiculosFinal.length)];
    esc.querySelector('.verso-reino').innerHTML = '“' + v.texto + '” <small>' + v.cita + '</small>';

    // 1) Aparece el monte y la piedra se desprende temblando
    leyenda.innerHTML = '<b>Una piedra fue cortada, no con mano…</b><span>Daniel 2:34</span>';
    var x0 = W - 70, y0 = 46;
    piedra.style.left = '0'; piedra.style.top = '0'; piedra.style.right = 'auto';
    piedra.style.transform = 'translate(' + x0 + 'px,' + y0 + 'px)';
    piedra.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) rotate(0)' },
      { transform: 'translate(' + (x0 - 3) + 'px,' + y0 + 'px) rotate(-6deg)' },
      { transform: 'translate(' + (x0 + 3) + 'px,' + y0 + 'px) rotate(6deg)' },
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) rotate(0)' }
    ], { duration: 180, iterations: 4, delay: 500 });

    // 2) Vuelo en arco hasta los pies, dejando una estela
    var pies = rel(est.querySelector('.pieza[data-id="pies"]'), esc);
    var x1 = pies.x + pies.w / 2 - 22, y1 = pies.y + pies.h / 2 - 26;
    var inicioVuelo = 1900, duracion = 1100;   // golpe a los 3 s del primer texto
    setTimeout(function () {
      Sonido.toque();
      var pasos = [];
      for (var t = 0; t <= 1.0001; t += 0.1) {
        var x = x0 + (x1 - x0) * t;
        var y = y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 70;
        pasos.push({ transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + (-720 * t) + 'deg)' });
      }
      piedra.animate(pasos, { duration: duracion, easing: 'cubic-bezier(.45,0,.9,.6)', fill: 'forwards' });
      var t0 = Date.now();
      var estela = setInterval(function () {
        var t = Math.min(1, (Date.now() - t0) / duracion);
        var k = 1 - Math.pow(1 - t, 1.3);
        var px = x0 + (x1 - x0) * k + 22, py = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * 70 + 22;
        var e = particula(esc, px, py, 'estela', 14);
        e.animate([{ opacity: .7, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.2)' }], { duration: 500, fill: 'forwards' });
        if (t >= 1) clearInterval(estela);
      }, 45);
    }, inicioVuelo);

    // 3) Golpe en los pies: destello, temblor y grietas
    var golpe = inicioVuelo + duracion;
    setTimeout(function () {
      Sonido.golpe();
      var fl = particula(esc, x1 + 22, y1 + 22, 'impacto');
      fl.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(3)', opacity: 0 }], { duration: 500, fill: 'forwards' });
      esc.animate([
        { transform: 'translate(0,0)' }, { transform: 'translate(-8px,4px)' }, { transform: 'translate(7px,-3px)' },
        { transform: 'translate(-5px,2px)' }, { transform: 'translate(3px,0)' }, { transform: 'translate(0,0)' }
      ], { duration: 450 });
      var gr = particula(esc, pies.x, pies.y - 6, 'grietas');
      gr.style.width = pies.w + 'px'; gr.style.height = (pies.h + 12) + 'px';
      leyenda.innerHTML = '<b>…e hirió a la imagen en sus pies</b><span>Daniel 2:34</span>';
      piedra.animate([{ transform: 'translate(' + x1 + 'px,' + y1 + 'px)' }, { transform: 'translate(' + (x1 + 30) + 'px,' + (y1 + 4) + 'px) rotate(90deg)' }],
        { duration: 300, fill: 'forwards' });
    }, golpe);

    // 4) La estatua se rompe de abajo hacia arriba
    // La estatua tiembla con las grietas y se rompe 3 s después del golpe
    setTimeout(function () {
      est.animate([
        { transform: 'translateX(-50%) rotate(0)' }, { transform: 'translateX(calc(-50% - 3px)) rotate(-.6deg)' },
        { transform: 'translateX(calc(-50% + 3px)) rotate(.6deg)' }, { transform: 'translateX(-50%) rotate(0)' }
      ], { duration: 220, iterations: 11 });
    }, golpe + 400);
    var rotura = golpe + 3000;
    setTimeout(function () {
      leyenda.innerHTML = '<b>…y los desmenuzó</b><span>Daniel 2:34-35</span>';
      est.querySelector('.silueta').style.opacity = '0';
      Sonido.error();
    }, rotura);
    ['pies', 'piernas', 'vientre', 'pecho', 'cabeza'].forEach(function (id, n) {
      romperPieza(esc, est.querySelector('.pieza[data-id="' + id + '"]'), rotura + n * 220);
    });

    // 5) La estatua queda hecha pedazos y aparece el versículo
    var monte = rotura + 3000;
    setTimeout(function () {
      esc.querySelectorAll('.grietas').forEach(function (g) { g.remove(); });
      esc.classList.add('fin');
      Sonido.victoria();
      leyenda.innerHTML = '<b>La estatua quedó hecha pedazos</b><span>Daniel 2:35</span>';
      Personaje.aparecer(app.perfil(), '¡El reino de Dios permanece para siempre!', 'festejando');
    }, monte);
    // El versículo y los pedazos quedan a la vista 5 segundos completos (más 1 s de aparición)
    terminar(titulo, monte + 6000);
  }

  // ---------- Modo: armar la estatua ----------
  function iniciarArmar() {
    s.colocados = 0; s.fallosCarta = {};
    ui.cont.innerHTML = estatuaHTML(true) +
      '<div class="leyenda"><b>Arrastrá cada metal a su lugar</b><span>Daniel 2:31-35</span></div>' +
      '<div class="cartas-metal"></div>';
    var zona = ui.cont.querySelector('.cartas-metal');
    Azar.mezclar(D.partes).forEach(function (p) {
      var c = document.createElement('div');
      c.className = 'carta-mand carta-metal arrastrable';
      c.dataset.id = p.id;
      c.innerHTML = '<span class="trozo t-' + p.color + '"></span><span>' + p.metal + '</span>';
      zona.appendChild(c);
    });
    var est = ui.cont.querySelector('.estatua');
    Ayuda.poner(function () {
      if (pistaArrastre(zona, '.carta-metal', 'id', '.estatua .zona-estatua[data-id="{v}"]')) s.errores++;
    });
    Arrastre.activar(zona, {
      carta: '.carta-metal', destino: '.zona-estatua.vacia',
      alSoltar: function (carta, z) {
        est.querySelectorAll('.pista').forEach(function (r) { r.classList.remove('pista'); });
        if (z.dataset.id !== carta.dataset.id) {
          s.fallosCarta[carta.dataset.id] = (s.fallosCarta[carta.dataset.id] || 0) + 1;
          fallo(null);
          return false;
        }
        acierto();
        var p = porId(carta.dataset.id);
        z.classList.remove('vacia');
        var pz = est.querySelector('.pieza[data-id="' + p.id + '"]');
        pz.classList.remove('oculta');
        pz.classList.add('aparece-metal');
        ui.cont.querySelector('.leyenda').innerHTML = '<b>' + p.parte + ': ' + p.metal.toLowerCase() + '</b>' +
          (s.club === 'aventureros' ? '' : '<span>' + p.detalle + '</span>');
        Voz.decir(p.parte + ', de ' + p.metal.toLowerCase());
        s.colocados++;
        ui.progreso(s.colocados / D.partes.length);
        if (s.colocados === D.partes.length) {
          setTimeout(function () { finalPiedra('¡Armaste la estatua de Daniel 2!'); }, 400);
        }
        return true;
      }
    });
  }

  // ---------- Modo: metales e imperios ----------
  function iniciarImperios() {
    s.i = 0;
    ui.cont.innerHTML = estatuaHTML(false) +
      '<div class="leyenda"></div>' +
      '<div class="opciones"></div><div class="zona-siguiente"></div>';
    rondaImperio();
    Ayuda.poner(function () {
      if (s.i >= D.partes.length || s.bloqueado) return;
      s.errores++;
      marcarPista([ui.cont.querySelector('.opcion-mand[data-id="' + D.partes[s.i].id + '"]')]);
    });
    ui.cont.querySelector('.opciones').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opcion-mand');
      if (!b || s.bloqueado) return;
      var p = D.partes[s.i];
      if (b.dataset.id !== p.id) { fallo(b); return; }
      acierto();
      s.bloqueado = true;
      b.classList.add('correcta');
      Voz.decir(p.imperio, true);
      ui.cont.querySelector('.leyenda').classList.add('tarjeta-verde');
      ui.cont.querySelector('.leyenda').innerHTML = '<b>✔ ' + p.parte + ' de ' + p.metal.toLowerCase() + ': ' + p.imperio + '</b><span>' + (p.cita || p.detalle) + '</span>';
      s.i++;
      ui.progreso(s.i / D.partes.length);
      var ultima = s.i >= D.partes.length;
      botonSiguiente(ui.cont.querySelector('.zona-siguiente'), function () {
        if (ultima) {
          ui.cont.querySelector('.opciones').innerHTML = '';
          ui.cont.querySelectorAll('.pieza').forEach(function (z) { z.classList.remove('apagada', 'resaltada'); });
          finalPiedra('¡Conocés la profecía de Daniel 2!');
        } else { s.bloqueado = false; rondaImperio(); }
      }, ultima ? 'Ver el final ▶' : null);
    });
  }

  function rondaImperio() {
    var p = D.partes[s.i];
    ui.cont.querySelectorAll('.pieza').forEach(function (z) {
      var activo = z.dataset.id === p.id, hecho = D.partes.indexOf(porId(z.dataset.id)) < s.i;
      z.classList.toggle('resaltada', activo);
      z.classList.toggle('apagada', !activo && !hecho);
    });
    ui.cont.querySelector('.leyenda').classList.remove('tarjeta-verde');
    ui.cont.querySelector('.leyenda').innerHTML = '<b>' + p.parte + ' de ' + p.metal.toLowerCase() + '</b><span>¿Qué reino representa?</span>';
    var ops = s.club === 'aventureros'
      ? Azar.mezclar([p].concat(Azar.mezclar(D.partes.filter(function (x) { return x.id !== p.id; })).slice(0, 2)))
      : Azar.mezclar(D.partes.slice());
    ui.cont.querySelector('.opciones').innerHTML = ops.map(function (x) {
      return '<button class="opcion-mand" data-id="' + x.id + '"><span class="txt">' + x.imperio + '</span></button>';
    }).join('');
  }

  window.JuegoDaniel = {
    titulo: 'La estatua de Daniel 2',
    modos: MODOS,
    estrellasModo: function (m) { return Estrellas.leer('dan_' + m); },
    totalEstrellas: function () { return MODOS.reduce(function (a, m) { return a + Estrellas.leer('dan_' + m.id); }, 0); },
    maxEstrellas: function () { return MODOS.length * 3; },
    iniciar: function (raiz, modo, funcionesApp) {
      app = funcionesApp;
      s = { modo: modo, club: app.perfil().club, errores: 0, seguidos: 0 };
      ui = cabeceraJuego(raiz, MODOS.filter(function (m) { return m.id === modo; })[0].nombre);
      if (modo === 'armar') iniciarArmar(); else iniciarImperios();
    }
  };
})();
