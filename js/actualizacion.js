// Aviso de versión nueva: pregunta a Google Play si hay una actualización y, si la hay,
// muestra un cartel en el menú. Solo funciona si la app se instaló desde Play Store;
// si no (APK instalado a mano o navegador), no muestra nada.
window.Actualizacion = (function () {
  var info = null, consultado = false;
  function plugin() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppUpdate; }
  function consultar() {
    if (consultado || !plugin()) return Promise.resolve(info);
    consultado = true;
    return plugin().getAppUpdateInfo().then(function (r) {
      info = r && r.updateAvailability === 2 ? r : null;  // 2 = hay una versión nueva
      return info;
    }).catch(function () { return null; });
  }
  function actualizar() {
    var p = plugin(); if (!p) return;
    var intento = info && info.immediateUpdateAllowed ? p.performImmediateUpdate() : Promise.reject();
    intento.catch(function () { return p.openAppStore(); }).catch(function () {});
  }
  // Pone el cartel arriba del menú (se llama cada vez que se dibuja el menú)
  function enMenu(raiz) {
    consultar().then(function (r) {
      if (!r || raiz.dataset.actual !== 'menu' || raiz.querySelector('.aviso-version')) return;
      var b = document.createElement('button');
      b.className = 'aviso-version';
      b.innerHTML = '<span class="av-icono">⬆️</span><span class="av-texto"><b>Estás jugando con una versión desactualizada</b>' +
        '<small>Tocá aquí para actualizar</small></span>';
      b.addEventListener('click', function () { Sonido.toque(); actualizar(); });
      var ref = raiz.querySelector('.menu-heroe');
      if (ref) ref.parentNode.insertBefore(b, ref.nextSibling); else raiz.insertBefore(b, raiz.firstChild);
    });
  }
  // Ventana que no deja seguir sin actualizar (para Jugar en línea)
  function exigir(motivo) {
    var m = document.getElementById('modal');
    m.innerHTML = '<div class="modal-caja aviso-obligatorio"><span class="ao-icono">⬆️</span>' +
      '<h2>Hay una versión nueva</h2><p>' + motivo + ' Actualizala gratis desde Play Store y volvé a entrar.</p>' +
      '<button class="btn-principal" data-accion="actualizar-app">Actualizar ahora</button>' +
      '<button class="btn-secundario" data-accion="cerrar-modal">Seguir jugando sin conexión</button></div>';
    m.classList.add('visible');
  }
  return { enMenu: enMenu, consultar: consultar, exigir: exigir, actualizar: actualizar };
})();
