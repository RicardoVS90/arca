// Utilidades: almacenamiento, sonido, voz y azar
window.Almacen = {
  leer: function (clave, porDefecto) {
    try {
      var v = localStorage.getItem('jb_' + clave);
      return v === null ? porDefecto : JSON.parse(v);
    } catch (e) { return porDefecto; }
  },
  guardar: function (clave, valor) {
    try { localStorage.setItem('jb_' + clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ }
  }
};

window.Azar = {
  mezclar: function (lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  },
  _ultimas: {},
  frase: function (tipo) {
    var lista = (window.FRASES[tipo] || ['']);
    var f;
    do { f = lista[Math.floor(Math.random() * lista.length)]; }
    while (lista.length > 1 && f === this._ultimas[tipo]);
    this._ultimas[tipo] = f;
    return f;
  }
};

// Efectos de sonido generados (sin archivos). Se reemplazan luego por sonidos reales.
window.Sonido = {
  ctx: null,
  activo: function () { return Almacen.leer('sonido', true); },
  _tono: function (frec, inicio, dur, tipo, vol) {
    if (!this.activo()) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      var c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = tipo || 'sine';
      o.frequency.value = frec;
      var t = c.currentTime + inicio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* sin audio */ }
  },
  toque: function () { this._tono(660, 0, 0.08, 'triangle', 0.1); },
  acierto: function () {
    document.querySelectorAll('.pista').forEach(function (e) { e.classList.remove('pista'); });
    this._tono(784, 0, 0.12, 'triangle'); this._tono(1046, 0.09, 0.18, 'triangle'); },
  error: function () { this._tono(220, 0, 0.22, 'sine', 0.15); },
  golpe: function () { this._tono(90, 0, 0.35, 'square', 0.22); this._tono(55, 0.02, 0.45, 'sine', 0.25); },
  victoria: function () {
    var n = [523, 659, 784, 1046];
    for (var i = 0; i < n.length; i++) this._tono(n[i], i * 0.11, 0.3, 'triangle', 0.16);
  },
  // Ovación de niños al ganar (3 estrellas, desafío o duelo ganado). La música se calla mientras suena.
  // Devuelve cuánto dura (ms) para que lo que venga después (tarjeta del álbum) espere.
  OVACION_MS: 3800,
  ovacion: function () {
    if (!this.activo()) return 0;
    if (Date.now() - (this._ultOvacion || 0) < this.OVACION_MS + 1000) return 0; // una sola a la vez
    this._ultOvacion = Date.now();
    try {
      var a = new Audio('sonidos/ovacion.mp3'); a.volume = 0.8;
      try { Musica.callar(true, 'ovacion'); } catch (e) {}
      var listo = function () { try { Musica.callar(false, 'ovacion'); } catch (e) {} };
      a.addEventListener('ended', listo); a.addEventListener('error', listo);
      setTimeout(listo, this.OVACION_MS + 1500);
      var p = a.play(); if (p && p.catch) p.catch(listo);
      return this.OVACION_MS;
    } catch (e) { return 0; }
  },
  // Premio (tarjeta nueva): arpegio rápido que sube, acorde final y destellos
  premio: function () {
    var n = [784, 988, 1175, 1568];
    for (var i = 0; i < n.length; i++) this._tono(n[i], i * 0.06, 0.16, 'square', 0.07);
    var acorde = [1046, 1319, 1568];
    for (var j = 0; j < acorde.length; j++) this._tono(acorde[j], 0.26, 0.7, 'triangle', 0.13);
    this._tono(2093, 0.36, 0.25, 'sine', 0.06); this._tono(2637, 0.48, 0.3, 'sine', 0.05);
  }
};

// Voz: lee los nombres de los libros. En el navegador usa la voz del sistema.
// En el APK se reemplaza por el plugin de texto a voz de Capacitor (ver docs).
// Apariencia de la app: 'moderna' (arte ilustrado, por defecto) o 'clasica' (la de la versión 2.6.4)
window.Apariencia = {
  clasica: function () { return Almacen.leer('apariencia', 'moderna') === 'clasica'; },
  aplicar: function () { document.body.classList.toggle('clasico', this.clasica()); },
  cambiar: function (v) { Almacen.guardar('apariencia', v === 'clasica' ? 'clasica' : 'moderna'); this.aplicar(); }
};

window.Voz = {
  // contexto 'versiculos': ahí el niño puede silenciar la voz con el botón 🔊 del juego
  contexto: null,
  activa: function () { return !!Almacen.leer('voz', true); },
  // Botón 🔊/🔇 para las cabeceras de los juegos: el silencio queda guardado hasta que el jugador lo vuelva a activar
  boton: function () {
    var on = this.activa();
    return '<button class="btn-icono btn-silencio' + (on ? '' : ' apagado') + '" data-accion="voz-alternar" aria-label="' +
      (on ? 'Silenciar la lectura' : 'Activar la lectura') + '">' + (on ? '🔊' : '🔇') + '</button>';
  },
  alternar: function () {
    var on = !this.activa();
    Almacen.guardar('voz', on);
    if (!on) this.callar();
    document.querySelectorAll('.btn-silencio').forEach(function (b) {
      b.textContent = on ? '🔊' : '🔇';
      b.classList.toggle('apagado', !on);
      b.setAttribute('aria-label', on ? 'Silenciar la lectura' : 'Activar la lectura');
    });
    return on;
  },
  // Estilos de voz (funcionan con cualquier voz del teléfono)
  ESTILOS: {
    normal:  { nombre: 'Normal',  rate: 0.9,  pitch: 1 },
    nino:    { nombre: 'Niño',    rate: 0.95, pitch: 1.35 },
    grave:   { nombre: 'Grave',   rate: 0.85, pitch: 0.75 },
    pausada: { nombre: 'Pausada', rate: 0.7,  pitch: 1 },
    rapida:  { nombre: 'Rápida',  rate: 1.15, pitch: 1 }
  },
  _estilo: function () { return this.ESTILOS[Almacen.leer('voz_estilo', 'normal')] || this.ESTILOS.normal; },
  _tts: function () { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech; },
  _listaTTS: null,
  // Los teléfonos dan nombres técnicos (ej.: "es-us-x-esd-local"); acá se les pone un nombre inventado y el país
  NOMBRES_VOZ: {
    neutro: ['Ariel', 'Alex', 'Cris', 'Dani', 'Gabi', 'Noa', 'Sasha', 'Robin', 'Andy', 'Mika', 'Fran', 'Juli', 'Lu', 'Nico', 'Pato', 'Santi'],
    mujer: ['Sofía', 'Lucía', 'Valentina', 'Camila', 'Martina', 'Elena', 'Paula', 'Clara', 'Julia', 'Rocío'],
    hombre: ['Mateo', 'Tomás', 'Lucas', 'Joaquín', 'Benjamín', 'Daniel', 'Samuel', 'Pablo', 'Diego', 'Martín']
  },
  PAISES: { ES: 'España', US: 'Latinoamérica', MX: 'México', AR: 'Argentina', PY: 'Paraguay', CO: 'Colombia', CL: 'Chile',
    PE: 'Perú', UY: 'Uruguay', VE: 'Venezuela', BO: 'Bolivia', EC: 'Ecuador', '419': 'Latinoamérica' },
  _bautizar: function (lista) {
    var self = this, usados = { neutro: 0, mujer: 0, hombre: 0 };
    lista.sort(function (a, b) { return (a.lang + a.id).localeCompare(b.lang + b.id); });
    return lista.map(function (v) {
      var t = (v.tecnico || '').toLowerCase();
      var tipo = /female|mujer|femen/.test(t) ? 'mujer' : /\bmale|hombre|mascul/.test(t) ? 'hombre' : 'neutro';
      var l = self.NOMBRES_VOZ[tipo], k = usados[tipo]++;
      var nom = l[k % l.length] + (k >= l.length ? ' ' + (Math.floor(k / l.length) + 1) : '');
      var pais = self.PAISES[(v.lang.split(/[-_]/)[1] || '').toUpperCase()] || 'español';
      v.nombre = nom + ' · ' + pais + (/network|online|natural/.test(t) ? ' (con internet)' : '');
      return v;
    });
  },
  // Voces en español instaladas en el teléfono: [{ id, nombre }]
  voces: function () {
    var self = this, tts = this._tts();
    function nombre(v) { return (v.name || v.voiceURI || 'Voz') + (v.lang ? ' (' + v.lang + ')' : ''); }
    if (tts && tts.getSupportedVoices) {
      return tts.getSupportedVoices().then(function (r) {
        self._listaTTS = r.voices || [];
        return self._bautizar(self._listaTTS.map(function (v, i) { return { id: v.voiceURI || v.name || String(i), tecnico: nombre(v), lang: v.lang || '' }; })
          .filter(function (v) { return /^es/i.test(v.lang); }));
      }).catch(function () { return []; });
    }
    if (!('speechSynthesis' in window)) return Promise.resolve([]);
    return new Promise(function (res) {
      function listar() {
        res(self._bautizar(speechSynthesis.getVoices().filter(function (v) { return /^es/i.test(v.lang); })
          .map(function (v) { return { id: v.voiceURI || v.name, tecnico: nombre(v), lang: v.lang }; })));
      }
      if (speechSynthesis.getVoices().length) listar();
      else { speechSynthesis.onvoiceschanged = listar; setTimeout(listar, 1500); }
    });
  },
  // Si el jugador nunca eligió voz, se elige una sola vez: Nico, si no Santi, si no la primera de Latinoamérica
  elegirPorDefecto: function () {
    if (Almacen.leer('voz_id', '') || Almacen.leer('voz_auto', false)) return;
    this.voces().then(function (lista) {
      if (!lista || !lista.length) return;
      function con(pref) { return lista.filter(function (v) { return v.nombre.indexOf(pref) === 0; })[0]; }
      function pais(p) { return lista.filter(function (x) { return x.nombre.indexOf(p) >= 0; })[0]; }
      // En iPhone o PC no están Nico ni Santi: se busca una voz latinoamericana, y si no hay, cualquiera en español
      var v = con('Nico · Latinoamérica') || con('Santi · Latinoamérica') || pais('Latinoamérica') ||
        pais('México') || pais('Argentina') || pais('Colombia') || pais('Paraguay') ||
        lista.filter(function (x) { return x.nombre.indexOf('España') < 0; })[0] || lista[0];
      if (v) Almacen.guardar('voz_id', v.id);
      Almacen.guardar('voz_auto', true);
    });
  },
  // Corta la lectura pero deja avanzar al juego (lo que esperaba la voz sigue enseguida)
  // El jugador ya respondió: si se está leyendo la pregunta, se corta al instante
  cortarPregunta: function () {
    if (this._esPregunta && this.hablando()) this.callar();
    this._esPregunta = false;
  },
  callar: function () {
    this._esPregunta = false;
    clearTimeout(this._tPregunta);
    this._gen++; this._pendientes = 0;
    try {
      var tts = this._tts();
      if (tts) tts.stop(); else if ('speechSynthesis' in window) speechSynthesis.cancel();
    } catch (e) { /* sin voz */ }
    this._liberar();
  },
  _gen: 0,          // cambia cada vez que se corta la lectura
  _pendientes: 0,   // frases que se están leyendo o esperan su turno
  _esperas: [],     // acciones que esperan a que termine la lectura
  _fin: function (gen) {
    if (gen !== this._gen) return;
    this._pendientes = Math.max(0, this._pendientes - 1);
    if (!this._pendientes) this._liberar();
  },
  _liberar: function () {
    var lista = this._esperas; this._esperas = [];
    lista.forEach(function (e) { clearTimeout(e.t); e.fn(); });
  },
  hablando: function () { return this._pendientes > 0; },
  // Pausa antes de leer cada pregunta nueva (en milisegundos)
  PAUSA_PREGUNTA: 2000,
  _tPregunta: null,
  // Lee la pregunta nueva después de la pausa; si antes se dice otra cosa o se cambia de pantalla, no se lee
  leer: function (texto) {
    var self = this;
    clearTimeout(this._tPregunta);
    if (!this.activa() || !texto) return;
    this._tPregunta = setTimeout(function () { self._tPregunta = null; self.decir(texto); self._esPregunta = true; }, this.PAUSA_PREGUNTA);
  },
  // encolar = true: no corta lo que se está leyendo, se lee después
  decir: function (texto, encolar) {
    clearTimeout(this._tPregunta);
    if (!this.activa() || !texto) return;
    // Lo que se dice al responder no espera a que termine la pregunta: la corta
    if (encolar && this._esPregunta) encolar = false;
    this._esPregunta = false;
    var self = this;
    if (!encolar || !this._pendientes) { this._gen++; this._pendientes = 0; }
    var gen = this._gen;
    var tts = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech;
    if (tts) {
      this._pendientes++;
      var est = this._estilo(), opc = { text: texto, lang: 'es-ES', rate: est.rate, pitch: est.pitch, queueStrategy: encolar ? 1 : 0 };
      var elegida = Almacen.leer('voz_id', '');
      if (elegida && this._listaTTS) {
        for (var k = 0; k < this._listaTTS.length; k++) {
          var vv = this._listaTTS[k];
          if ((vv.voiceURI || vv.name || String(k)) === elegida) { opc.voice = k; opc.lang = vv.lang || opc.lang; break; }
        }
      }
      tts.speak(opc)
        .then(function () { self._fin(gen); }, function () { self._fin(gen); });
      return;
    }
    if (!('speechSynthesis' in window)) return;
    try {
      if (!encolar) speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = 'es-ES';
      var est2 = this._estilo();
      u.rate = est2.rate;
      u.pitch = est2.pitch;
      var voces = speechSynthesis.getVoices().filter(function (v) { return /^es/i.test(v.lang); });
      var id = Almacen.leer('voz_id', '');
      var vz = voces.filter(function (v) { return (v.voiceURI || v.name) === id; })[0] || voces[0];
      if (vz) { u.voice = vz; u.lang = vz.lang; }
      u.onend = u.onerror = function () { self._fin(gen); };
      this._pendientes++;
      speechSynthesis.speak(u);
    } catch (e) { /* sin voz */ }
  },
  // Ejecuta fn después de "ms", pero nunca antes de que termine la lectura en curso
  // (con un límite de 25 s por si el sistema de voz no avisa que terminó)
  despues: function (ms, fn) {
    var self = this;
    this.cortarPregunta();
    setTimeout(function () {
      if (!self.hablando()) { fn(); return; }
      var e = { fn: fn };
      e.t = setTimeout(function () {
        self._esperas = self._esperas.filter(function (x) { return x !== e; });
        fn();
      }, 25000);
      self._esperas.push(e);
    }, ms);
  },
  // Al salir de una pantalla: se corta la lectura y se olvidan las esperas
  cancelar: function () {
    clearTimeout(this._tPregunta);
    this._gen++; this._pendientes = 0;
    this._esperas.forEach(function (e) { clearTimeout(e.t); }); this._esperas = [];
    try {
      var tts = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech;
      if (tts) tts.stop(); else if ('speechSynthesis' in window) speechSynthesis.cancel();
    } catch (e) { /* sin voz */ }
  }
};


// Estrellas: 3 sin errores, 2 con hasta 2 errores, 1 con más
window.Estrellas = {
  calcular: function (errores) { return errores === 0 ? 3 : errores <= 2 ? 2 : 1; },
  leer: function (clave) { return Almacen.leer('estrellas_' + clave, 0); },
  guardar: function (clave, n) { if (n > this.leer(clave)) Almacen.guardar('estrellas_' + clave, n); }
};

// Ventana con el texto bíblico completo
window.mostrarTexto = function (titulo, texto, cita) {
  var m = document.getElementById('modal');
  m.innerHTML = '<div class="modal-caja texto-biblico"><h2>' + titulo + '</h2>' +
    '<p class="versiculo">' + texto + '</p><p class="cita">' + cita + ' (RV1960)</p>' +
    '<button class="btn-principal" data-accion="cerrar-modal">Cerrar</button></div>';
  m.classList.add('visible');
};

// Cabecera común de los juegos
window.cabeceraJuego = function (raiz, titulo) {
  raiz.innerHTML =
    '<header class="barra-juego">' +
      '<button class="btn-icono" data-accion="volver" aria-label="Volver">‹</button>' +
      '<div class="titulo-juego">' + titulo + '</div>' +
      '<span class="extras-cabecera"></span>' + Voz.boton() +
      '<button class="btn-ayuda" data-accion="ayuda" hidden>💡 Ayuda</button>' +
    '</header>' +
    '<div class="progreso"><div class="progreso-barra"></div></div>' +
    '<div class="contenido-juego"></div>';
  return {
    progreso: function (f) { raiz.querySelector('.progreso-barra').style.width = Math.round(f * 100) + '%'; },
    cont: raiz.querySelector('.contenido-juego'),
    extras: raiz.querySelector('.extras-cabecera')
  };
};

// Selección múltiple: tocar todos los correctos de una grilla (discípulos, hijos de Jacob, remedios…)
// items: [{ id, txt, icono?, ok }]. Lo incorrecto se pone rojo 2 s. alTerminar() cuando se encontraron todos.
window.armarSeleccion = function (cont, items, juego) {
  var faltan = items.filter(function (x) { return x.ok; }).length;
  cont.innerHTML = '<div class="grilla-seleccion">' + Azar.mezclar(items).map(function (x) {
    return '<button class="ficha-sel" data-id="' + x.id + '"' + (x.ok ? ' data-ok="1"' : '') + '>' +
      (x.icono ? '<span class="ic">' + x.icono + '</span>' : '') + '<span class="txt">' + x.txt + '</span></button>';
  }).join('') + '</div>';
  cont.querySelector('.grilla-seleccion').addEventListener('click', function (ev) {
    var b = ev.target.closest('.ficha-sel');
    if (!b || b.classList.contains('encontrada') || !faltan) return;
    if (b.dataset.ok === '1') {
      b.classList.add('encontrada');
      faltan--;
      juego.alAcertar(b, faltan);
      if (!faltan) juego.alTerminar();
    } else {
      juego.alFallar(b);
    }
  });
  return {
    pista: function () {
      var pend = cont.querySelectorAll('.ficha-sel[data-ok="1"]:not(.encontrada)');
      if (!pend.length) return false;
      marcarPista([pend[Math.floor(Math.random() * pend.length)]]);
      return true;
    }
  };
};

// Botón "Siguiente": la pantalla no cambia hasta tocarlo. Al tocarlo se corta la lectura.
window.botonSiguiente = function (cont, fn, texto) {
  var b = document.createElement('button');
  b.className = 'btn-principal btn-siguiente';
  b.textContent = texto || 'Siguiente ▶';
  cont.appendChild(b);
  b.addEventListener('click', function () {
    if (b.disabled) return;
    b.disabled = true;
    Sonido.toque();
    Voz.callar();
    b.remove();
    fn();
  });
  setTimeout(function () { try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }, 60);
  return b;
};

window.sacudir = function (el) {
  el.classList.remove('sacudir'); void el.offsetWidth; el.classList.add('sacudir');
};

// Error: el elemento se pone rojo durante 2 segundos y vuelve a su color
window.marcarError = function (el) {
  if (!el) return;
  el.classList.remove('mal', 'sacudir');
  void el.offsetWidth;
  el.classList.add('mal', 'sacudir');
  clearTimeout(el._mal);
  el._mal = setTimeout(function () { el.classList.remove('mal', 'sacudir'); }, 2000);
  // En las preguntas con opciones, la opción equivocada ya no se puede volver a tocar en esa pregunta
  if (el.matches && el.matches('.opcion-mand, .btn-dia, .btn-lugar, .btn-tabla, .ficha-sel')) {
    el.disabled = true;
    el.classList.add('descartada');
  }
};

// Vuelve a habilitar las opciones descartadas (para los juegos que reusan los mismos botones)
window.rehabilitarOpciones = function (cont) {
  (cont || document).querySelectorAll('.descartada').forEach(function (b) { b.disabled = false; b.classList.remove('descartada', 'mal', 'sacudir'); });
};

// Fragmento corto de un versículo para los resúmenes: las primeras palabras, tal cual (RV1960), con puntos suspensivos.
// Si el versículo empieza en medio de una oración (minúscula), también lleva "…" al principio.
window.fragmento = function (texto, max) {
  var t = String(texto || '').trim().replace(/^[«“"]+|[»”"]+$/g, ''), pal = t.split(/\s+/);
  max = max || 10;
  var ini = /^[a-záéíóúüñ]/.test(t) ? '…' : '';
  if (pal.length <= max) return '«' + ini + t + '»';
  var f = pal.slice(0, max);
  // Si hay una coma o punto entre la palabra 4 y la última, cortar ahí
  for (var i = f.length - 1; i >= 3; i--) { if (/[,;:.!?]$/.test(f[i])) { f = f.slice(0, i + 1); break; } }
  // No terminar en palabras sueltas como "y", "de", "mis"
  var SUELTAS = /^(y|e|o|u|ni|a|al|de|del|la|el|los|las|lo|que|en|mi|mis|tu|tus|su|sus|por|con|para|sin|un|una|toda|todo|todos|todas|se|le|les|nos|os|me|te|cual|cuando|como|pues|mas|porque|ha|han|he|hay)$/i;
  while (f.length > 3 && SUELTAS.test(f[f.length - 1].replace(/[,;:.!?]+$/, ''))) f.pop();
  return '«' + ini + f.join(' ').replace(/[,;:.]+$/, '') + '…»';
};

// Tarjeta verde que aparece al acertar, con lo que se aprende (cita y texto, dato, etc.)
window.tarjetaVerde = function (titulo, texto) {
  return '<div class="tarjeta-verde"><b>✔ ' + titulo + '</b>' + (texto ? '<span>' + texto + '</span>' : '') + '</div>';
};

// Al acertar: muestra la tarjeta verde y el botón Siguiente en "cont". Al tocarlo se limpia y sigue.
window.mostrarAcierto = function (cont, tarjeta, fn, texto) {
  cont.innerHTML = tarjeta || '';
  return botonSiguiente(cont, function () { cont.innerHTML = ''; fn(); }, texto);
};

// Arrastrar y soltar con el dedo (o el mouse).
// opciones: { carta: selector, destino: selector, alSoltar(carta, destino) -> true si es correcto,
//             alEmpezar(carta) opcional }
window.Arrastre = {
  activar: function (contenedor, op) {
    contenedor.addEventListener('pointerdown', function (e) {
      var carta = e.target.closest(op.carta);
      if (!carta || carta.classList.contains('usada') || carta.classList.contains('levantada')) return;
      e.preventDefault();
      var r = carta.getBoundingClientRect();
      var dx = e.clientX - r.left, dy = e.clientY - r.top;
      var fantasma = carta.cloneNode(true);
      fantasma.classList.add('fantasma');
      fantasma.classList.remove('pista', 'mal', 'sacudir');
      fantasma.style.left = r.left + 'px';
      fantasma.style.top = r.top + 'px';
      fantasma.style.width = r.width + 'px';
      fantasma.style.height = r.height + 'px';
      document.body.appendChild(fantasma);
      carta.classList.add('levantada');
      Sonido.toque();
      if (op.alEmpezar) op.alEmpezar(carta);
      var sobre = null;

      function destinoEn(x, y) {
        var el = document.elementFromPoint(x, y);
        return el ? el.closest(op.destino) : null;
      }
      function mover(ev) {
        fantasma.style.transform = 'translate(' + (ev.clientX - dx - r.left) + 'px,' + (ev.clientY - dy - r.top) + 'px) scale(1.06) rotate(-2deg)';
        // Desplaza la pantalla si el dedo llega a un borde
        var cont = document.getElementById('pantalla');
        if (ev.clientY > window.innerHeight - 50 && ev.clientY > e.clientY + 20) cont.scrollTop += 12;
        else if (ev.clientY < 90 && ev.clientY < e.clientY - 20) cont.scrollTop -= 12;
        var d = destinoEn(ev.clientX, ev.clientY);
        if (d !== sobre) {
          if (sobre) sobre.classList.remove('sobre');
          sobre = d;
          if (sobre) sobre.classList.add('sobre');
        }
      }
      function soltar(ev) {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        window.removeEventListener('pointercancel', soltar);
        if (sobre) sobre.classList.remove('sobre');
        // Un toque sin mover el dedo no es un arrastre: la carta vuelve sin animación (sirve para "tocar y elegir")
        if (Math.abs(ev.clientX - e.clientX) < 6 && Math.abs(ev.clientY - e.clientY) < 6 && !(sobre || destinoEn(ev.clientX, ev.clientY))) {
          fantasma.remove(); carta.classList.remove('levantada'); return;
        }
        var d = ev.type === 'pointercancel' ? null : destinoEn(ev.clientX, ev.clientY);
        var ok = d ? op.alSoltar(carta, d) : false;
        if (ok) {
          var dr = d.getBoundingClientRect();
          fantasma.style.transition = 'transform .25s, opacity .25s';
          fantasma.style.transform = 'translate(' + (dr.left - r.left) + 'px,' + (dr.top - r.top) + 'px) scale(.5)';
          fantasma.style.opacity = '0';
          setTimeout(function () { fantasma.remove(); }, 260);
          carta.classList.remove('levantada');
          carta.classList.add('usada');
        } else {
          if (d) fantasma.classList.add('mal');
          fantasma.style.transition = 'transform .45s cubic-bezier(.3,1.3,.5,1)';
          fantasma.style.transform = 'translate(0,0)';
          setTimeout(function () {
            fantasma.remove();
            carta.classList.remove('levantada');
            if (d) {
              // Sigue en rojo hasta completar 2 segundos desde que se soltó
              carta.classList.add('mal');
              clearTimeout(carta._mal);
              carta._mal = setTimeout(function () { carta.classList.remove('mal'); }, 1550);
            }
          }, 450);
        }
      }
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', soltar);
    });
  }
};

// Ayuda: solo aparece cuando el niño toca el botón "Ayuda". Cada juego indica qué mostrar.
// Usar la ayuda cuenta como un error para las estrellas.
window.Ayuda = {
  fn: null,
  poner: function (fn) {
    this.fn = fn || null;
    var b = document.querySelector('.btn-ayuda');
    if (b) b.hidden = !this.fn;
  },
  usar: function () { if (this.fn) this.fn(); }
};

window.marcarPista = function (els) {
  document.querySelectorAll('.pista').forEach(function (e) { e.classList.remove('pista'); });
  els.forEach(function (e) { if (e) e.classList.add('pista'); });
  clearTimeout(window.marcarPista._t);
  window.marcarPista._t = setTimeout(function () {
    document.querySelectorAll('.pista').forEach(function (e) { e.classList.remove('pista'); });
  }, 4000);
};

// Para juegos de arrastrar: elige una ficha que falta y marca la ficha y su lugar
window.pistaArrastre = function (zona, selCarta, atributo, selDestino) {
  var cartas = zona.querySelectorAll(selCarta + ':not(.usada)');
  if (!cartas.length) return false;
  var c = cartas[Math.floor(Math.random() * cartas.length)];
  var d = document.querySelector(selDestino.replace('{v}', c.dataset[atributo]));
  window.marcarPista([c, d]);
  return true;
};
