// Navegación y pantallas de la app
(function () {
  var VERSION = '2.15.5';
  var raiz = document.getElementById('pantalla');
  var historial = [];
  var estado = { testamento: 'AT', mecanica: 'tocar' };

  var JUEGOS = [
    { id: 'libros', nombre: 'Libros de la Biblia', icono: '📚', listo: true },
    { id: 'mandamientos', nombre: 'Los 10 mandamientos', icono: '📜', listo: true },
    { id: 'creacion', nombre: 'La creación', icono: '🌍', listo: true },
    { id: 'plagas', nombre: 'Las 10 plagas', icono: '🐸', listo: true },
    { id: 'santuario', nombre: 'El santuario', icono: '⛺', imagenClasica: 'img/clasico/santuario/santuario.webp', listo: true },
    { id: 'daniel', nombre: 'La estatua de Daniel 2', icono: '👑', listo: true },
    { id: 'versiculos', nombre: 'Versículos', icono: '📖', listo: true },
    { id: 'nombres', nombre: 'Aprendamos sobre nombres', icono: '👥', listo: true },
    { id: 'remedios', nombre: 'Los 8 remedios naturales', icono: '🌿', listo: true }
  ];

  var CLUBES = {
    aventureros: 'Aventureros',
    conquistadores: 'Conquistadores',
    ninguno: 'Ningún club'
  };

  function perfil() { return Almacen.leer('perfil', null); }
  function modulo(id) { return {
      mandamientos: window.JuegoMandamientos, creacion: window.JuegoCreacion, plagas: window.JuegoPlagas,
      santuario: window.JuegoSantuario, daniel: window.JuegoDaniel, versiculos: window.JuegoVersiculos,
      nombres: window.JuegoNombres, remedios: window.JuegoRemedios, libros: window.JuegoLibros
    }[id]; }

  // Pasa a la pantalla de resultado sin cortar la frase del personaje (mínimo 3 s a la vista)
  var navegacion = 0;
  function irResultado(r) {
    var yo = ++navegacion, actual = raiz.dataset.actual;
    Voz.despues(Personaje.restante(), function () {
      if (yo === navegacion && raiz.dataset.actual === actual) ir('resultado', r, true);
    });
  }

  // Funciones a ejecutar al salir de la pantalla actual (cerrar escuchas en línea, etc.)
  if (Almacen.leer('voz_vers', true) === false) { Almacen.guardar('voz', false); Almacen.guardar('voz_vers', true); }
  Apariencia.aplicar();
  setTimeout(function () { try { Voz.elegirPorDefecto(); } catch (e) {} }, 1200);
  var limpiezas = [];
  function ir(nombre, datos, sinHistorial) {
    limpiezas.splice(0).forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    navegacion++;
    Voz.cancelar();
    Voz.contexto = null;
    if (!sinHistorial && raiz.dataset.actual) historial.push({ nombre: raiz.dataset.actual, datos: raiz._datos });
    raiz.dataset.actual = nombre;
    raiz._datos = datos;
    Ayuda.fn = null;
    Personaje.callar();
    raiz.className = 'pantalla p-' + nombre;
    PANTALLAS[nombre](datos);
    raiz.scrollTop = 0;
    try { Musica.pantalla(nombre); } catch (e) { console.error(e); }
  }

  function volver() {
    var p = historial.pop();
    if (p) ir(p.nombre, p.datos, true);
    else if (raiz.dataset.actual !== 'menu' && perfil()) ir('menu', null, true);
  }

  function personajeHTML(clase) {
    return '<div class="personaje ' + (clase || '') + '"><div class="burbuja"></div>' +
      '<div class="pj-lugar">' + Personaje.dibujar(perfil()) + '</div></div>';
  }

  // Aciertos, errores y porcentaje de aciertos (redondeado: desde ,5 sube a favor del jugador)
  function porcentaje(aciertos, errores) {
    var total = aciertos + errores;
    return total ? Math.floor(aciertos * 100 / total + 0.5) : 100;
  }
  function marcadorHTML(r) {
    var a = r.aciertos || 0, e = r.errores || 0, pct = porcentaje(a, e);
    // El porcentaje solo se muestra en Versículos y solo para Conquistadores
    var conPct = r.juego === 'versiculos' && (perfil() || {}).club === 'conquistadores';
    return '<div class="marcador' + (conPct ? '' : ' marcador-2') + '">' +
      '<div class="dato ok"><b>' + a + '</b><span>Aciertos</span></div>' +
      '<div class="dato mal-dato"><b>' + e + '</b><span>Errores</span></div>' +
      (conPct ? '<div class="dato pct"><b>' + pct + '%</b><span>de aciertos</span></div>' : '') +
    '</div>' + (e === 0 ? '<p class="detalle">¡Sin ningún error!</p>' : '');
  }

  // Resultado del examen de versículos (Conquistadores)
  function examenHTML(x) {
    var reg = x.reglas;
    var h = '<div class="marcador marcador-4">' +
      '<div class="dato ok"><b>' + x.correctas + '</b><span>Correctas<br>(+' + reg.correcta + ')</span></div>' +
      '<div class="dato mal-dato"><b>' + x.incorrectas + '</b><span>Incorrectas<br>(' + reg.incorrecta + ')</span></div>' +
      '<div class="dato nose-dato"><b>' + x.nose + '</b><span>No sé<br>(' + (reg.nose > 0 ? '+' : '') + reg.nose + ')</span></div>' +
      '<div class="dato pct"><b>' + x.porcentaje + '%</b><span>' + x.puntos + ' de ' + x.maximo + '<br>puntos</span></div>' +
    '</div>';
    if (!x.repaso.length) return h + '<p class="detalle">¡Respondiste todo bien! No hay versículos para repasar.</p>';
    h += '<div class="repaso"><h2>Versículos para repasar (' + x.repaso.length + ')</h2>';
    x.repaso.forEach(function (r) {
      var tuya = r.nose ? '<p class="rs rs-nose">🤷 No sé</p>'
        : '<p class="rs rs-mal">✘ <s>' + (r.tipo === 'libro' ? r.elegida : fragmento(r.elegida)) + '</s></p>';
      h += '<div class="item-repaso"><b>' + r.cita + '</b><p>' + fragmento(r.texto) + '</p>' + tuya + '</div>';
    });
    return h + '</div>';
  }

  function estrellasHTML(n, max) {
    var h = '';
    for (var i = 0; i < (max || 3); i++) h += '<span class="estrella' + (i < n ? ' llena' : '') + '">★</span>';
    return h;
  }

  // Fondo de la bienvenida: un parque con sol, nubes, árboles, flores y un caminito
  function parqueSVG() {
    var flores = '', colores = ['#FF6B8B', '#FFD23F', '#FFFFFF', '#B983FF', '#FF9F43'];
    for (var i = 0; i < 34; i++) {
      var x = (i * 47 + 13) % 400, y = 640 + ((i * 29) % 150), c = colores[i % colores.length];
      flores += '<g transform="translate(' + x + ' ' + y + ')"><circle r="4.2" fill="' + c + '"/><circle r="1.8" fill="#FFB000"/></g>';
    }
    function arbol(x, y, k, color) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' +
        '<rect x="-6" y="-10" width="12" height="46" rx="5" fill="#8A5A2B"/>' +
        '<circle cx="0" cy="-34" r="34" fill="' + color + '"/><circle cx="-24" cy="-14" r="24" fill="' + color + '"/>' +
        '<circle cx="24" cy="-14" r="24" fill="' + color + '"/><circle cx="-10" cy="-46" r="16" fill="rgba(255,255,255,.18)"/></g>';
    }
    function nube(x, y, k, cls) {
      return '<g class="' + cls + '" transform="translate(' + x + ' ' + y + ') scale(' + k + ')" fill="#fff">' +
        '<ellipse cx="0" cy="0" rx="34" ry="16"/><circle cx="-14" cy="-10" r="14"/><circle cx="10" cy="-14" r="18"/><circle cx="28" cy="-4" r="12"/></g>';
    }
    return '<svg class="bv-parque" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><linearGradient id="bvCielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5EC8F6"/><stop offset=".6" stop-color="#BFEBFF"/><stop offset="1" stop-color="#E8FAFF"/></linearGradient>' +
      '<radialGradient id="bvSol"><stop offset="0" stop-color="#FFF6B0"/><stop offset=".55" stop-color="#FFD84A"/><stop offset="1" stop-color="rgba(255,216,74,0)"/></radialGradient>' +
      '<linearGradient id="bvPasto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7BD35A"/><stop offset="1" stop-color="#4FAE3E"/></linearGradient></defs>' +
      '<rect width="400" height="800" fill="url(#bvCielo)"/>' +
      '<circle class="bv-sol" cx="335" cy="120" r="70" fill="url(#bvSol)"/><circle cx="335" cy="120" r="30" fill="#FFE45C"/>' +
      nube(70, 150, 1.1, 'bv-nube n1') + nube(250, 230, .8, 'bv-nube n2') + nube(140, 330, .7, 'bv-nube n3') +
      '<path d="M0 520 Q100 450 200 500 T400 480 V800 H0Z" fill="#A9E28A"/>' +
      arbol(40, 520, .9, '#3E9E46') + arbol(360, 505, 1, '#45A84C') + arbol(300, 540, .7, '#2F8A3C') + arbol(110, 545, .65, '#2F8A3C') +
      '<path d="M0 575 Q120 540 220 565 T400 555 V800 H0Z" fill="url(#bvPasto)"/>' +
      '<path d="M170 800 C185 720 230 660 210 575 L232 575 C262 660 240 730 262 800Z" fill="#F3D9A4" opacity=".9"/>' +
      '<g fill="#3E9E46"><ellipse cx="20" cy="640" rx="40" ry="22"/><ellipse cx="385" cy="650" rx="44" ry="24"/></g>' +
      flores + '</svg>';
  }

  var PANTALLAS = {
    // Pantalla de carga: el arca con una barrita que se llena mientras se cargan las imágenes
    carga: function () {
      raiz.innerHTML =
        '<div class="carga">' +
          '<img class="carga-arca" src="img/arca.webp" alt="">' +
          '<h1 class="carga-titulo">Arca de Juegos Bíblicos</h1>' +
          '<div class="carga-barra"><div class="carga-relleno"></div></div>' +
          '<p class="carga-texto">Cargando… 0 %</p>' +
        '</div>';
      var relleno = raiz.querySelector('.carga-relleno'), texto = raiz.querySelector('.carga-texto');
      var imagenes = ['img/logos/aventureros.png', 'img/logos/conquistadores.png', 'img/menu/parque.webp', 'img/menu/banner-online.webp'].concat(JUEGOS.map(function (j) { return 'img/menu/isla-' + j.id + '.webp'; }));
      var listas = 0, inicio = Date.now(), DURACION = 2600, yo = navegacion;
      imagenes.forEach(function (src) {
        var im = new Image(); im.onload = im.onerror = function () { listas++; }; im.src = src;
      });
      (function paso() {
        if (yo !== navegacion) return;
        var t = Math.min(1, (Date.now() - inicio) / DURACION);
        var pct = Math.round(Math.min(t, (listas + 1) / (imagenes.length + 1)) * 100);
        if (t >= 1) pct = 100;
        relleno.style.width = pct + '%';
        texto.textContent = 'Cargando… ' + pct + ' %';
        if (pct >= 100) setTimeout(function () { if (yo === navegacion) ir('bienvenida', null, true); }, 350);
        else requestAnimationFrame(paso);
      })();
    },

    // Bienvenida: los chicos de los clubes saludando
    bienvenida: function () {
      function chico(club, genero, demora) {
        return '<div class="bv-chico bv-' + club + '" style="--d:' + demora + 's">' + Personaje.dibujar({ club: club, genero: genero }) + '</div>';
      }
      raiz.innerHTML = (Apariencia.clasica() ? '<div class="bv-parque-fondo-clasico"></div>' + parqueSVG() : '<img class="bv-parque-fondo" src="img/menu/parque.webp" alt=""><img class="bv-parque" src="img/menu/parque.webp" alt="">') +
        '<div class="bienvenida">' +
          '<h1 class="bv-titulo">¡Bienvenidos a<br><span>Arca de Juegos Bíblicos!</span></h1>' +
          '<div class="bv-grupo">' +
            '<div class="bv-fila bv-atras">' + chico('conquistadores', 'nino', 0) + chico('conquistadores', 'nina', .5) + '</div>' +
            '<div class="bv-fila bv-adelante">' +
              chico('aventureros', 'nina', .25) + chico('aventureros', 'nino', .9) +
              chico('ninguno', 'nino', .7) + chico('ninguno', 'nina', 1.1) +
            '</div>' +
          '</div>' +
          '<button class="btn-principal bv-comenzar" data-accion="comenzar">¡Comenzar! ▶</button>' +
        '</div>';
    },

    club: function () {
      raiz.innerHTML =
        '<div class="encabezado-centro"><h1>¿A qué club pertenecés?</h1></div>' +
        '<div class="lista-clubes">' +
          '<button class="tarjeta-club" data-accion="club" data-club="aventureros">' +
            '<img src="img/logos/aventureros.png" alt=""><span>Aventureros</span></button>' +
          '<button class="tarjeta-club" data-accion="club" data-club="conquistadores">' +
            '<img src="img/logos/conquistadores.png" alt=""><span>Conquistadores</span></button>' +
          '<button class="tarjeta-club" data-accion="club" data-club="ninguno">' +
            '<span class="icono-ninguno">😊</span><span>Ninguno</span></button>' +
        '</div>';
    },

    genero: function (club) {
      var a = Personaje.dibujar({ club: club, genero: 'nino' });
      var b = Personaje.dibujar({ club: club, genero: 'nina' });
      raiz.innerHTML =
        '<header class="barra-juego"><button class="btn-icono" data-accion="volver" aria-label="Volver">‹</button></header>' +
        '<div class="encabezado-centro"><h1>¿Sos niño o niña?</h1></div>' +
        '<div class="lista-genero">' +
          '<button class="tarjeta-genero" data-accion="genero" data-club="' + club + '" data-genero="nino">' +
            '<div class="personaje saludando">' + a + '</div><span>Niño</span></button>' +
          '<button class="tarjeta-genero" data-accion="genero" data-club="' + club + '" data-genero="nina">' +
            '<div class="personaje saludando">' + b + '</div><span>Niña</span></button>' +
        '</div>';
    },

    menu: function () {
      var p = perfil();
      var islas = JUEGOS.map(function (j, i) {
        var extra = '';
        var mod = j.id === 'libros' ? JuegoLibros : modulo(j.id);
        if (mod) {
          extra = '<span class="isla-estrellas">★ ' + mod.totalEstrellas() + '/' + mod.maxEstrellas() + '</span>';
        } else if (!j.listo) {
          extra = '<span class="isla-pronto">Muy pronto</span>';
        }
        return '<button class="isla isla-' + i + (j.listo ? '' : ' en-obra') + '" data-accion="juego" data-juego="' + j.id + '">' +
          (Apariencia.clasica()
            ? (j.imagenClasica ? '<img class="isla-imagen" src="' + j.imagenClasica + '" alt="">' : '<span class="isla-icono">' + j.icono + '</span>')
            : '<img class="isla-imagen" src="img/menu/isla-' + j.id + '.webp" alt="">') +
          '<span class="isla-nombre">' + j.nombre + '</span>' + extra + '</button>';
      }).join('');
      raiz.innerHTML =
        '<header class="barra-menu">' +
          '<button class="club-actual" data-accion="cambiar-club" aria-label="Cambiar club o personaje">' +
            (p.club === 'ninguno' ? '' : '<img src="img/logos/' + p.club + '.png" alt="">') + CLUBES[p.club] +
            '<span class="cambiar">✎</span></button>' +
          '<button class="btn-icono" data-accion="ajustes" aria-label="Ajustes">⚙</button>' +
        '</header>' +
        '<div class="menu-heroe">' + personajeHTML('grande') + '</div>' +
        '<button class="banner-online" data-accion="online">' + (Apariencia.clasica() ? '<span class="bo-icono">🌐</span>' : '') +
          '<span class="bo-texto"><b>Jugar en línea</b><small>Duelos, desafíos con amigos y ranking</small></span>' +
          '<span class="bo-flecha">›</span></button>' +
        '<div class="mapa">' + islas + '</div>' +
        '<p class="version-app">Arca de Juegos Bíblicos · versión ' + VERSION + '</p>';
      var cont = raiz.querySelector('.personaje');
      setTimeout(function () { Personaje.decir(cont, Azar.frase('saludo'), 'saludando'); }, 350);
      Actualizacion.enMenu(raiz);
    },

    testamento: function () {
      raiz.innerHTML =
        '<header class="barra-juego"><button class="btn-icono" data-accion="volver" aria-label="Volver">‹</button>' +
          '<div class="titulo-juego">Libros de la Biblia</div></header>' +
        '<div class="encabezado-centro"><h2>¿Qué querés ordenar?</h2></div>' +
        '<div class="lista-testamentos">' +
          '<button class="btn-testamento t-at" data-accion="testamento" data-t="AT"><span class="emoji">📜</span>' +
            '<span><b>Antiguo Testamento</b><small>39 libros</small></span></button>' +
          '<button class="btn-testamento t-nt" data-accion="testamento" data-t="NT"><span class="emoji">✝️</span>' +
            '<span><b>Nuevo Testamento</b><small>27 libros</small></span></button>' +
          '<button class="btn-testamento t-ambos" data-accion="testamento" data-t="AMBOS"><span class="emoji">📖</span>' +
            '<span><b>Toda la Biblia</b><small>66 libros</small></span></button>' +
        '</div>';
    },

    etapas: function () {
      var lista = DATOS_LIBROS.etapas.filter(function (e) {
        return estado.testamento === 'AMBOS' || e.test === estado.testamento;
      });
      var nombreT = { AT: 'Antiguo Testamento', NT: 'Nuevo Testamento', AMBOS: 'Toda la Biblia' }[estado.testamento];
      var items = lista.map(function (e) {
        return '<button class="tarjeta-etapa" style="--c:' + e.color + '" data-accion="etapa" data-etapa="' + e.id + '">' +
          '<span class="etapa-nombre">' + e.nombre + '</span>' +
          '<span class="etapa-cant">' + e.libros.length + ' libros</span>' +
          '<span class="etapa-estrellas">' + estrellasHTML(JuegoLibros.estrellasEtapa(estado.mecanica, e.id)) + '</span>' +
        '</button>';
      }).join('');
      raiz.innerHTML =
        '<header class="barra-juego"><button class="btn-icono" data-accion="volver" aria-label="Volver">‹</button>' +
          '<div class="titulo-juego">' + nombreT + '</div></header>' +

        '<button class="btn-principal" data-accion="todas">▶ Jugar todas seguidas</button>' +
        '<div class="lista-etapas">' + items + '</div>';
    },

    modos: function (id) {
      var mod = modulo(id);
      var items = mod.modos.map(function (m) {
        var e = mod.estrellasModo(m.id);
        return '<button class="tarjeta-modo" data-accion="jugar" data-juego="' + id + '" data-modo="' + m.id + '">' +
          ((Apariencia.clasica() ? m.imagenClasica : m.imagen) ? '<img class="modo-imagen" src="' + (Apariencia.clasica() ? m.imagenClasica : m.imagen) + '" alt="">' : '<span class="modo-icono">' + m.icono + '</span>') +
          '<span class="modo-texto"><b>' + m.nombre + '</b><small>' + m.desc + '</small></span>' +
          (e >= 0 ? '<span class="etapa-estrellas">' + estrellasHTML(e) + '</span>' : '') +
        '</button>';
      }).join('');
      raiz.innerHTML =
        '<header class="barra-juego"><button class="btn-icono" data-accion="volver" aria-label="Volver">‹</button>' +
          '<div class="titulo-juego">' + mod.titulo + '</div></header>' +
        '<div class="encabezado-centro"><h2>¿Cómo querés jugar?</h2></div>' +
        '<div class="lista-modos">' + items + '</div>';
    },

    jugar: function (d) {
      if (d.juego === 'libros') JuegoLibrosVecinos.iniciar(raiz, { perfil: perfil, resultado: irResultado });
      else modulo(d.juego).iniciar(raiz, d.modo, { perfil: perfil, resultado: irResultado });
    },

    juego: function (datos) {
      JuegoLibros.iniciar(raiz, datos, { perfil: perfil, resultado: irResultado });
    },

    resultado: function (r) {
      var sig = null;
      if (r.unaEtapa) {
        var lista = DATOS_LIBROS.etapas.filter(function (e) {
          return estado.testamento === 'AMBOS' || e.test === estado.testamento;
        });
        var i = lista.indexOf(r.unaEtapa);
        if (i >= 0 && i + 1 < lista.length) sig = lista[i + 1];
      }
      raiz._ultimo = r;
      raiz.innerHTML =
        '<div class="resultado">' +
          '<h1>' + r.titulo + '</h1>' +
          '<div class="estrellas-grandes">' + estrellasHTML(r.estrellas) + '</div>' +
          (r.examen ? examenHTML(r.examen) : marcadorHTML(r) + personajeHTML('grande')) +
          '<div class="acciones-resultado">' +
            (sig ? '<button class="btn-principal" data-accion="etapa" data-etapa="' + sig.id + '">Siguiente: ' + sig.nombre + ' ›</button>' : '') +
            (r.examen && r.examen.repaso.length ? '<button class="btn-principal" data-accion="repaso">📚 Practicar estos versículos</button>' : '') +
            '<button class="btn-secundario" data-accion="repetir">↻ ' + (r.examen ? 'Nuevo examen' : 'Repetir') + '</button>' +
            (r.juego ? '<button class="btn-secundario" data-accion="a-modos">Elegir otro modo</button>'
                     : '<button class="btn-secundario" data-accion="a-etapas">Volver a las etapas</button>') +
          '</div>' +
        '</div>';
      var cont = raiz.querySelector('.personaje');
      if (cont) setTimeout(function () { Personaje.decir(cont, Azar.frase('victoria'), 'festejando'); }, 300);
      // Al volver desde el resultado, ir a la lista de etapas
      historial = historial.filter(function (h) { return h.nombre !== 'juego' && h.nombre !== 'jugar'; });
    }
  };

  // ---------- Ajustes ----------
  function abrirAjustes() {
    var m = document.getElementById('modal');
    m.innerHTML =
      '<div class="modal-caja">' +
        '<h2>Ajustes</h2>' +
        '<label class="interruptor"><span>🎵 Música (himnos)</span><input type="checkbox" data-ajuste="musica"' + (Musica.activa() ? ' checked' : '') + '></label>' +
        '<div class="ajuste-musica"><b>Apariencia</b><div class="estilos-apariencia">' +
          '<button class="chip-estilo' + (Apariencia.clasica() ? '' : ' activo') + '" data-accion="apariencia" data-valor="moderna">✨ Moderna</button>' +
          '<button class="chip-estilo' + (Apariencia.clasica() ? ' activo' : '') + '" data-accion="apariencia" data-valor="clasica">🧸 Clásica</button>' +
        '</div></div>' +
        '<div class="ajuste-musica"><b>Estilo de la música</b><div class="estilos-musica">' + Object.keys(Musica.ESTILOS).map(function (k) {
          return '<button class="chip-estilo' + (Musica.estilo() === k ? ' activo' : '') + '" data-accion="estilo-musica" data-estilo="' + k + '">' + Musica.ESTILOS[k] + '</button>';
        }).join('') + '</div></div>' +
        '<label class="interruptor"><span>🔊 Sonidos</span><input type="checkbox" data-ajuste="sonido"' + (Sonido.activo() ? ' checked' : '') + '></label>' +
        '<label class="interruptor"><span>🗣️ Voz que lee los textos</span><input type="checkbox" data-ajuste="voz"' + (Almacen.leer('voz', true) ? ' checked' : '') + '></label>' +
        '<div class="ajuste-voz">' +
          '<b>Voz de los relatos</b>' +
          '<select class="selector-voz" data-ajuste-voz="1"><option value="">Voz del teléfono (predeterminada)</option></select>' +
          '<div class="estilos-voz">' + Object.keys(Voz.ESTILOS).map(function (k) {
            return '<button class="chip-estilo' + (Almacen.leer('voz_estilo', 'normal') === k ? ' activo' : '') + '" data-accion="estilo-voz" data-estilo="' + k + '">' + Voz.ESTILOS[k].nombre + '</button>';
          }).join('') + '</div>' +
          '<button class="btn-secundario btn-probar" data-accion="probar-voz">▶ Probar la voz</button>' +
        '</div>' +
        '<button class="btn-secundario" data-accion="cambiar-club">Cambiar club o personaje</button>' +
        (window.WebArca ? '<button class="btn-secundario" data-accion="web-recargar">🔄 Cargar la última versión</button>' : '') +
        '<button class="btn-principal" data-accion="cerrar-modal">Listo</button>' +
        '<p class="creditos">Creado por Rickelisoft<br>rickelisoft@gmail.com<br>Versión ' + VERSION + '</p>' +
        '<p class="creditos copyright-biblia">Texto bíblico: Reina-Valera 1960® © Sociedades Bíblicas en América Latina, 1960. ' +
          'Renovado © Sociedades Bíblicas Unidas, 1988. Utilizado con permiso.</p>' +
      '</div>';
    m.classList.add('visible');
    // Cargar las voces en español instaladas en el teléfono
    Voz.voces().then(function (lista) {
      var sel = m.querySelector('.selector-voz');
      if (!sel) return;
      var elegida = Almacen.leer('voz_id', '');
      lista.forEach(function (v) {
        var o = document.createElement('option');
        o.value = v.id; o.textContent = v.nombre;
        if (v.id === elegida) o.selected = true;
        sel.appendChild(o);
      });
      if (!lista.length) sel.disabled = true;
    });
  }

  // Al tocar una respuesta (o empezar a arrastrar una carta) se corta la lectura de la pregunta
  raiz.addEventListener('pointerdown', function (ev) {
    if (ev.target.closest('.barra-juego')) return;
    if (ev.target.closest('button, [draggable], .carta-mand, .carta-dia, .tarjeta, .ficha-sel, .lugar-mueble')) Voz.cortarPregunta();
  }, true);

  document.getElementById('modal').addEventListener('change', function (ev) {
    var k = ev.target.dataset.ajuste;
    if (k === 'musica') Musica.activar(ev.target.checked);
    else if (k) { Almacen.guardar(k, ev.target.checked); if (k === 'voz' && !ev.target.checked) Voz.callar(); }
    if (ev.target.dataset.ajusteVoz) { Almacen.guardar('voz_id', ev.target.value); Voz.decir('Hola, esta es mi voz'); }
  });

  // ---------- Acciones ----------
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-accion]');
    if (!b) return;
    var a = b.dataset.accion;
    if (a !== 'volver') Sonido.toque();
    switch (a) {
      case 'volver': Sonido.toque(); volver(); break;
      case 'club': ir('genero', b.dataset.club); break;
      case 'genero':
        Almacen.guardar('perfil', { club: b.dataset.club, genero: b.dataset.genero });
        historial = [];
        ir('menu', null, true);
        break;
      case 'juego':
        if (modulo(b.dataset.juego)) ir('modos', b.dataset.juego);
        else Personaje.decir(raiz.querySelector('.personaje'), Azar.frase('pronto'), 'animando');
        break;
      case 'testamento': estado.testamento = b.dataset.t; ir('etapas'); break;
      case 'mecanica':
        estado.mecanica = b.dataset.m; Almacen.guardar('mecanica', estado.mecanica);
        ir('etapas', null, true);
        break;
      case 'etapa': {
        var e = DATOS_LIBROS.etapas.filter(function (x) { return x.id === b.dataset.etapa; })[0];
        if (raiz.dataset.actual === 'resultado') ir('juego', { etapas: [e], mecanica: estado.mecanica }, true);
        else ir('juego', { etapas: [e], mecanica: estado.mecanica });
        break;
      }
      case 'todas': {
        var lista = DATOS_LIBROS.etapas.filter(function (x) {
          return estado.testamento === 'AMBOS' || x.test === estado.testamento;
        });
        ir('juego', { etapas: lista, mecanica: estado.mecanica });
        break;
      }
      case 'jugar':
        if (b.dataset.juego === 'libros' && b.dataset.modo === 'ordenar') { estado.mecanica = 'tocar'; ir('testamento'); }
        else ir('jugar', { juego: b.dataset.juego, modo: b.dataset.modo });
        break;
      case 'repaso': ir('jugar', { juego: 'versiculos', modo: 'repaso' }, true); break;
      case 'a-modos': { var jj = raiz._ultimo.juego; historial = []; ir('menu', null, true); ir('modos', jj); break; }
      case 'repetir': {
        var r = raiz._ultimo;
        if (r.juego) { ir('jugar', { juego: r.juego, modo: r.modo }, true); break; }
        var et = r.unaEtapa ? [r.unaEtapa] : DATOS_LIBROS.etapas.filter(function (x) {
          return estado.testamento === 'AMBOS' || x.test === estado.testamento;
        });
        ir('juego', { etapas: et, mecanica: estado.mecanica }, true);
        break;
      }
      case 'a-etapas': historial = []; ir('menu', null, true); ir('testamento'); ir('etapas'); break;
      case 'ajustes': abrirAjustes(); break;
      case 'online':
        Actualizacion.consultar().then(function (nueva) {
          if (nueva) Actualizacion.exigir('Para jugar en línea necesitás la última versión de la app.');
          else ir('online');
        });
        break;
      case 'comenzar': Sonido.toque(); if (perfil()) ir('menu', null, true); else ir('club', null, true); break;
      case 'estilo-voz':
        Almacen.guardar('voz_estilo', b.dataset.estilo);
        document.querySelectorAll('.estilos-voz .chip-estilo').forEach(function (c) { c.classList.toggle('activo', c === b); });
        Voz.decir('Hola, esta es mi voz');
        break;
      case 'probar-voz': Voz.decir('En el principio creó Dios los cielos y la tierra.'); break;
      case 'ayuda': Ayuda.usar(); break;
      case 'apariencia':
        Apariencia.cambiar(b.dataset.valor);
        document.querySelectorAll('.estilos-apariencia .chip-estilo').forEach(function (c) { c.classList.toggle('activo', c === b); });
        if (raiz.dataset.actual === 'menu') ir('menu');
        break;
      case 'estilo-musica':
        Musica.cambiarEstilo(b.dataset.estilo);
        document.querySelectorAll('.estilos-musica .chip-estilo').forEach(function (c) { c.classList.toggle('activo', c === b); });
        break;
      case 'voz-alternar': Voz.alternar(); break;
      case 'actualizar-app': Actualizacion.actualizar(); break;
      case 'web-recargar': if (window.WebArca) WebArca.recargar(); break;
      case 'cerrar-modal': document.getElementById('modal').classList.remove('visible'); break;
      case 'cambiar-club':
        document.getElementById('modal').classList.remove('visible');
        historial = []; ir('club', null, true);
        break;
    }
  });

  // Botón "atrás" de Android (cuando corre dentro del APK)
  document.addEventListener('backbutton', function (ev) { ev.preventDefault(); volver(); });
  try {
    var CapApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (CapApp) CapApp.addListener('backButton', function () {
      if (document.getElementById('modal').classList.contains('visible')) {
        document.getElementById('modal').classList.remove('visible');
      } else if (raiz.dataset.actual === 'menu' || raiz.dataset.actual === 'club' ||
                 raiz.dataset.actual === 'carga' || raiz.dataset.actual === 'bienvenida') {
        CapApp.exitApp();
      } else volver();
    });
  } catch (e) { /* fuera del APK */ }

  // Pantallas que agregan otros archivos (Jugar en línea)
  Object.keys(window.PANTALLAS_EXTRA || {}).forEach(function (k) {
    PANTALLAS[k] = function (datos) { window.PANTALLAS_EXTRA[k](raiz, datos); };
  });
  window.App = {
    ir: ir, volver: volver, perfil: perfil, raiz: raiz, CLUBES: CLUBES,
    alSalir: function (fn) { limpiezas.push(fn); },
    reemplazar: function (nombre, datos) { ir(nombre, datos, true); }
  };

  // Arranque
  ir('carga', null, true);
})();
