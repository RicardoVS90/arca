// Modo iglesia: QR de la sala y lector de QR.
// - El QR lleva el enlace web con el código: https://ricardovs90.github.io/arca/?sala=ABC123
//   Con la cámara común del celular abre la versión web directo en la sala.
// - Dentro de la app (Android) se lee con el lector de Google, así el jugador entra con su alias.
// - En la versión web se lee con la cámara del navegador (jsQR).
window.Escaner = (function () {
  var URL_WEB = 'https://ricardovs90.github.io/arca/';

  function aviso(txt, tipo) {
    var el = document.createElement('div');
    el.className = 'aviso-online ' + (tipo || '');
    el.textContent = txt;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('visible'); }, 10);
    setTimeout(function () { el.classList.remove('visible'); setTimeout(function () { el.remove(); }, 400); }, 3200);
  }

  function enlaceSala(codigo) { return URL_WEB + '?sala=' + codigo; }

  // Dibuja el QR como imagen SVG
  function qrSVG(texto) {
    var q = qrcode(0, 'M');
    q.addData(texto);
    q.make();
    return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  }

  // De lo leído saca el código de 6 caracteres (sirve el enlace o el código solo)
  function codigoDe(texto) {
    texto = String(texto || '').trim();
    var m = texto.match(/[?&]sala=([A-Za-z0-9]{6})/);
    var c = (m ? m[1] : texto).toUpperCase();
    return /^[A-HJKMNP-Z2-9]{6}$/.test(c) ? c : null;
  }

  function plugin() { return window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LectorQR; }

  // Android: lector de Google (no pide permiso de cámara). La primera vez puede tardar unos segundos en prepararse.
  function leerNativo(p) {
    return p.escanear().then(function (r) { return r && r.texto; }).catch(function (e) {
      var msg = String(e && (e.message || e) || '');
      if (/cancel/i.test(msg)) return null;
      if (/download|descarg|module|waiting/i.test(msg)) {
        aviso('Preparando el lector de QR… probá de nuevo en unos segundos');
        return null;
      }
      throw e;
    });
  }

  // jsQR se carga recién cuando hace falta (pesa unos 250 KB)
  function cargarJsQR() {
    if (window.jsQR) return Promise.resolve();
    return new Promise(function (ok, mal) {
      var sc = document.createElement('script');
      sc.src = 'js/vendor/jsQR.js'; sc.onload = ok; sc.onerror = mal;
      document.head.appendChild(sc);
    });
  }

  // Web: cámara del navegador + jsQR
  function leerWeb() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('sin-camara'));
    return cargarJsQR().then(function () {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    }).then(function (stream) {
      return new Promise(function (ok) {
        var m = document.getElementById('modal');
        m.innerHTML = '<div class="modal-caja lector-qr"><h2>📷 Apuntá al código QR</h2>' +
          '<div class="lector-marco"><video playsinline muted></video><span class="lector-guia"></span></div>' +
          '<button class="btn-secundario" data-x="cerrar">Cancelar</button></div>';
        m.classList.add('visible');
        var video = m.querySelector('video'), canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
        var vivo = true;
        function fin(valor) {
          if (!vivo) return; vivo = false;
          stream.getTracks().forEach(function (t) { t.stop(); });
          m.classList.remove('visible'); m.innerHTML = '';
          ok(valor);
        }
        m.querySelector('[data-x="cerrar"]').addEventListener('click', function () { fin(null); });
        video.srcObject = stream;
        video.play().catch(function () {});
        (function mirar() {
          if (!vivo) return;
          if (video.readyState >= 2 && video.videoWidth) {
            var w = Math.min(640, video.videoWidth), h = Math.round(video.videoHeight * w / video.videoWidth);
            canvas.width = w; canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            var r = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
            if (r && r.data) { fin(r.data); return; }
          }
          requestAnimationFrame(mirar);
        })();
      });
    });
  }

  // Lee un QR y devuelve el código de la sala (o null si se canceló)
  function leer() {
    var p = plugin(), nativo = window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
    return (nativo && p ? leerNativo(p) : leerWeb()).then(function (texto) {
      if (texto == null) return null;
      var c = codigoDe(texto);
      if (!c) aviso('Ese QR no es de una sala de Arca de Juegos Bíblicos', 'error');
      return c;
    }).catch(function (e) {
      var msg = String(e && (e.message || e.name) || '');
      if (/cancel/i.test(msg)) return null;
      if (/NotAllowed|Permission|denied/i.test(msg)) aviso('Para leer el QR hay que permitir el uso de la cámara', 'error');
      else aviso('No se pudo abrir la cámara. Escribí el código con el teclado.', 'error');
      return null;
    });
  }

  // Código de sala que llegó en el enlace (?sala=…), para entrar directo después de abrir la app web
  function pendiente() { try { return sessionStorage.getItem('jb_sala_pendiente'); } catch (e) { return null; } }
  function borrarPendiente() { try { sessionStorage.removeItem('jb_sala_pendiente'); } catch (e) {} }
  (function () {
    try {
      var c = codigoDe(location.search);
      if (c) {
        sessionStorage.setItem('jb_sala_pendiente', c);
        history.replaceState(null, '', location.pathname);
      }
    } catch (e) {}
  })();

  return { enlaceSala: enlaceSala, qrSVG: qrSVG, leer: leer, codigoDe: codigoDe, pendiente: pendiente, borrarPendiente: borrarPendiente };
})();
