// Música de fondo: suena solo fuera de los juegos (menús, bienvenida, Jugar en línea).
// 4 himnos de dominio público arreglados en 5 estilos. El estilo se elige en Ajustes (por defecto: Campamento).
// La lista se mezcla al abrir la app: suenan todos una vez, sin repetir, y después se arma un ciclo nuevo.
window.Musica = (function () {
  var BASE = 'musica/';
  var VOL = 0.32;
  var CANCIONES = ['cuando-suene-la-trompeta', 'corazones-siempre-alegres', 'grande-gozo', 'hay-poder-en-jesus', 'eterna-roca'];
  var ESTILOS = {
    campamento: 'Campamento',
    videojuego: 'Videojuego',
    country: 'Country',
    banda: 'Banda',
    himnario: 'Himnario'
  };
  var EN_JUEGO = { 'jugar': 1, 'juego': 1, 'online-quiz': 1, 'online-sala': 1, 'diario': 1 };

  var audio = new Audio();
  audio.preload = 'auto';
  var silencios = {}, lista = [], pos = 0, enJuego = false, fundido = null, bloqueada = false, iniciada = false, callada = false;

  function activa() { return Almacen.leer('musica', true); }
  function estilo() { var e = Almacen.leer('musica_estilo', 'campamento'); return ESTILOS[e] ? e : 'campamento'; }
  // Ciclo nuevo: todas las canciones mezcladas, sin que la primera repita la última que sonó
  function nuevoCiclo(ultima) {
    var c = Azar.mezclar(CANCIONES.slice());
    if (ultima && c[0] === ultima && c.length > 1) { c.push(c.shift()); }
    return c;
  }
  function volumen(destino, ms, luego) {
    clearInterval(fundido);
    var desde = audio.volume, pasos = Math.max(1, Math.round(ms / 50)), k = 0;
    fundido = setInterval(function () {
      k++;
      audio.volume = Math.max(0, Math.min(1, desde + (destino - desde) * k / pasos));
      if (k >= pasos) { clearInterval(fundido); if (luego) luego(); }
    }, 50);
  }
  function puedeSonar() { return activa() && !enJuego && !callada && !document.hidden; }
  function tocar() {
    if (!puedeSonar() || !audio.src) return;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { bloqueada = true; });
    volumen(VOL, 1000);
  }
  function cargar() {
    audio.src = BASE + estilo() + '/' + lista[pos] + '.ogg';
    audio.volume = 0;
    tocar();
  }
  audio.addEventListener('ended', function () {
    pos++;
    if (pos >= lista.length) { lista = nuevoCiclo(lista[lista.length - 1]); pos = 0; }
    cargar();
  });
  function iniciar() {
    if (iniciada) return;
    iniciada = true;
    lista = nuevoCiclo(); pos = 0;
    cargar();
  }
  function pausar() { volumen(0, 400, function () { audio.pause(); }); }

  // Se llama cada vez que cambia la pantalla: la lista sigue igual, solo se pausa dentro de los juegos
  function pantalla(nombre) {
    enJuego = !!EN_JUEGO[nombre];
    if (enJuego) { if (!audio.paused) pausar(); return; }
    if (!iniciada) iniciar();
    else if (audio.paused) tocar();
  }
  document.addEventListener('pointerdown', function () { if (bloqueada) { bloqueada = false; tocar(); } }, true);
  document.addEventListener('visibilitychange', function () { if (document.hidden) audio.pause(); else tocar(); });

  return {
    pantalla: pantalla,
    activa: activa,
    estilo: estilo,
    ESTILOS: ESTILOS,
    _audio: audio,
    // Silencio momentáneo (por ejemplo, mientras se muestra una tarjeta nueva del álbum)
    // Cada pedido de silencio tiene su nombre (tarjeta, ovación…): la música vuelve cuando no queda ninguno
    callar: function (si, quien) {
      quien = quien || 'general';
      if (si) silencios[quien] = 1; else delete silencios[quien];
      callada = Object.keys(silencios).length > 0;
      if (callada) { if (!audio.paused) volumen(0, 150, function () { audio.pause(); }); }
      else if (iniciada && audio.paused) tocar();
    },
    activar: function (si) {
      Almacen.guardar('musica', !!si);
      if (si) { if (!iniciada) iniciar(); else tocar(); } else pausar();
    },
    // Cambia el estilo y vuelve a empezar la canción actual con el estilo nuevo
    cambiarEstilo: function (e) {
      if (!ESTILOS[e]) return;
      Almacen.guardar('musica_estilo', e);
      if (!iniciada) return;
      volumen(0, 300, function () { cargar(); });
    }
  };
})();
