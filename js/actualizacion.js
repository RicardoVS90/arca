// Aviso de versión nueva: cartel rojo en el menú, debajo de "Jugar en línea", que no se puede cerrar.
// - Android: le pregunta a Google Play si hay una actualización (solo si la app se instaló desde Play).
// - Web (iPhone, PC): avisa cuando llegó una versión nueva publicada en GitHub (ver js/web.js).
// Con la versión vieja se puede seguir jugando sin conexión, pero no en línea.
window.Actualizacion = (function () {
  var info = null, consultado = false;
  function plugin() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppUpdate; }
  function esWeb() { return !!window.WebArca; }
  function consultar() {
    if (esWeb()) return Promise.resolve(window.WebArca.hayNueva ? { web: true } : null);
    if (consultado || !plugin()) return Promise.resolve(info);
    consultado = true;
    return plugin().getAppUpdateInfo().then(function (r) {
      info = r && r.updateAvailability === 2 ? r : null;  // 2 = hay una versión nueva
      return info;
    }).catch(function () { return null; });
  }
  function actualizar() {
    if (esWeb()) { location.reload(); return; }
    var p = plugin(); if (!p) return;
    var intento = info && info.immediateUpdateAllowed ? p.performImmediateUpdate() : Promise.reject();
    intento.catch(function () { return p.openAppStore(); }).catch(function () {});
  }
  // Pone el cartel en el menú (se llama cada vez que se dibuja el menú)
  function enMenu(raiz) {
    consultar().then(function (r) {
      if (!r || raiz.dataset.actual !== 'menu' || raiz.querySelector('.aviso-version')) return;
      var b = document.createElement('button');
      b.className = 'aviso-version';
      b.innerHTML = '<span class="av-dibujo"><img src="iconos/icono-192.png" alt=""><span class="av-flecha">⬆</span></span>' +
        '<span class="av-txt"><b>¡Hay una versión nueva!</b><small>Tocá aquí para actualizar (necesario para jugar en línea)</small></span>' +
        '<span class="av-btn">Actualizar</span>';
      b.addEventListener('click', function () { Sonido.toque(); actualizar(); });
      var ref = raiz.querySelector('.banner-online') || raiz.querySelector('.menu-heroe');
      if (ref) ref.parentNode.insertBefore(b, ref.nextSibling); else raiz.insertBefore(b, raiz.firstChild);
    });
  }
  // Ventana que no deja seguir sin actualizar (para Jugar en línea)
  function exigir(motivo) {
    var m = document.getElementById('modal');
    m.innerHTML = '<div class="modal-caja aviso-obligatorio"><span class="av-dibujo grande"><img src="iconos/icono-192.png" alt=""><span class="av-flecha">⬆</span></span>' +
      '<h2>Hay una versión nueva</h2><p>' + motivo + (esWeb() ? ' Tocá "Actualizar ahora" y volvé a entrar.' : ' Actualizala gratis desde Play Store y volvé a entrar.') + '</p>' +
      '<button class="btn-principal btn-rojo" data-accion="actualizar-app">Actualizar ahora</button>' +
      '<button class="btn-secundario" data-accion="cerrar-modal">Seguir jugando sin conexión</button></div>';
    m.classList.add('visible');
  }
  return { enMenu: enMenu, consultar: consultar, exigir: exigir, actualizar: actualizar };
})();
