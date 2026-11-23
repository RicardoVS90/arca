// Solo para la versión web (iPhone, PC). En la app de Android (Capacitor) no hace nada.
(function () {
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

  // Funcionar sin conexión: guarda el juego en el teléfono la primera vez que se abre.
  // Cuando se publica una versión nueva, se baja sola y aparece un aviso para aplicarla al tocar.
  if ('serviceWorker' in navigator) {
    var habiaVersion = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (habiaVersion) avisoActualizacion(); // la primera instalación no avisa
      habiaVersion = true;
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
        // Al volver a la app (por ejemplo, si quedó abierta en el iPhone), fijarse si hay versión nueva
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') reg.update().catch(function () {});
        });
        setInterval(function () { reg.update().catch(function () {}); }, 30 * 60 * 1000);
      }).catch(function () {});
    });
  }
  function avisoActualizacion() {
    if (document.querySelector('.aviso-web-nueva')) return;
    var d = document.createElement('button');
    d.className = 'aviso-web-nueva';
    d.innerHTML = '<b>🎉 ¡Hay una versión nueva!</b><span>Tocá aquí para actualizar</span>';
    d.addEventListener('click', function () { location.reload(); });
    document.body.appendChild(d);
  }

  // Botón de Ajustes "Cargar la última versión": borra la copia guardada del juego y la vuelve a bajar.
  // No borra el avance (estrellas, alias, ajustes): eso está en otro lado.
  window.WebArca = {
    recargar: function () {
      var pasos = [];
      if (window.caches) pasos.push(caches.keys().then(function (ks) {
        return Promise.all(ks.filter(function (k) { return k.indexOf('arca-') === 0; }).map(function (k) { return caches.delete(k); }));
      }));
      if ('serviceWorker' in navigator) pasos.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
        return Promise.all(rs.map(function (r) { return r.unregister(); }));
      }));
      Promise.all(pasos).catch(function () {}).then(function () { location.reload(); });
    }
  };

  // iPhone/iPad en Safari: explicar una sola vez cómo dejarla como app en la pantalla de inicio
  var ua = navigator.userAgent || '';
  var esIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var instalada = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  var visto = false;
  try { visto = localStorage.getItem('jb_aviso_ios') === '1'; } catch (e) {}
  if (esIOS && !instalada && !visto) {
    setTimeout(function () {
      var d = document.createElement('div');
      d.className = 'aviso-ios';
      d.innerHTML = '<b>📲 Tenela como app</b><span>Tocá <b>Compartir</b> (el cuadrado con la flecha ↑) y después <b>Agregar a pantalla de inicio</b>.</span><button aria-label="Cerrar">✕</button>';
      d.querySelector('button').addEventListener('click', function () {
        d.remove();
        try { localStorage.setItem('jb_aviso_ios', '1'); } catch (e) {}
      });
      document.body.appendChild(d);
    }, 2500);
  }
})();
