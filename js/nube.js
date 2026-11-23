// Nube: acceso a la base de datos en línea (Firebase Firestore).
// Tiene dos motores con la misma forma de uso:
//   - 'firebase': el real (necesita FIREBASE_CONFIG y conexión a internet)
//   - 'local': un simulador que guarda todo en este navegador, para probar sin internet
//     (se activa abriendo index.html?nube=local; varias pestañas = varios jugadores)
(function () {
  var parametros = new URLSearchParams(location.search);
  var MODO = parametros.get('nube') === 'local' ? 'local' : (window.FIREBASE_CONFIG ? 'firebase' : null);

  function promesa(fn) { return new Promise(fn); }

  // ===================================================================
  // Motor Firebase (SDK "compat", cargado solo al entrar a Jugar en línea)
  // ===================================================================
  var fb = { db: null, listo: null };
  function cargarScript(src) {
    return promesa(function (ok, mal) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = function () { mal(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
  }
  function valor(v) {
    if (v && v.__inc !== undefined) return firebase.firestore.FieldValue.increment(v.__inc);
    if (v && v.__ahora) return firebase.firestore.FieldValue.serverTimestamp();
    if (v && v.__borrar) return firebase.firestore.FieldValue.delete();
    if (Array.isArray(v)) return v.map(valor);
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      var o = {}; Object.keys(v).forEach(function (k) { o[k] = valor(v[k]); }); return o;
    }
    return v;
  }
  // Las claves con punto ("res.uid123") actualizan campos internos: no hay que convertirlas en objetos
  function valorActualizar(d) { var o = {}; Object.keys(d).forEach(function (k) { o[k] = valor(d[k]); }); return o; }
  function plano(v) {
    if (v && typeof v.toMillis === 'function') return v.toMillis();
    if (Array.isArray(v)) return v.map(plano);
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = plano(v[k]); }); return o; }
    return v;
  }
  function docFB(snap) {
    if (!snap.exists) return null;
    var d = plano(snap.data({ serverTimestamps: 'estimate' })); d.id = snap.id; return d;
  }
  function consultaFB(ruta, q) {
    var c = fb.db.collection(ruta);
    (q && q.donde || []).forEach(function (w) { c = c.where(w[0], w[1], w[2]); });
    if (q && q.orden) c = c.orderBy(q.orden[0], q.orden[1] || 'asc');
    if (q && q.limite) c = c.limit(q.limite);
    return c;
  }
  var Firebase = {
    iniciar: function () {
      if (fb.listo) return fb.listo;
      fb.listo = cargarScript('js/vendor/firebase-app-compat.js')
        .then(function () { return cargarScript('js/vendor/firebase-auth-compat.js'); })
        .then(function () { return cargarScript('js/vendor/firebase-firestore-compat.js'); })
        .then(function () {
          if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
          fb.db = firebase.firestore();
          try { fb.db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
          return promesa(function (ok, mal) {
            var corte = firebase.auth().onAuthStateChanged(function (u) {
              corte();
              if (u) return ok(u.uid);
              firebase.auth().signInAnonymously().then(function (r) { ok(r.user.uid); }, mal);
            }, mal);
          });
        })
        .catch(function (e) { fb.listo = null; throw e; });
      return fb.listo;
    },
    // Código de recuperación: la cuenta anónima recibe una "llave" (usuario y clave inventados)
    tieneCodigo: function () {
      var u = firebase.auth().currentUser;
      return !!(u && u.providerData.some(function (p) { return p.providerId === 'password'; }));
    },
    vincularCodigo: function (correo, clave) {
      return firebase.auth().currentUser.linkWithCredential(firebase.auth.EmailAuthProvider.credential(correo, clave));
    },
    cambiarClave: function (correo, vieja, nueva) {
      var u = firebase.auth().currentUser;
      return u.updatePassword(nueva).catch(function (e) {
        if (e && e.code === 'auth/requires-recent-login' && vieja) {
          return u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(correo, vieja))
            .then(function () { return u.updatePassword(nueva); });
        }
        throw e;
      });
    },
    entrarConCodigo: function (correo, clave) {
      return firebase.auth().signInWithEmailAndPassword(correo, clave).then(function (r) { return r.user.uid; });
    },
    doc: function (ruta) { return fb.db.doc(ruta).get().then(docFB); },
    escucharDoc: function (ruta, cb) { return fb.db.doc(ruta).onSnapshot(function (s) { cb(docFB(s)); }, function (e) { console.warn(e); }); },
    consulta: function (ruta, q) {
      return consultaFB(ruta, q).get().then(function (r) { return r.docs.map(docFB); });
    },
    escucharConsulta: function (ruta, q, cb) {
      return consultaFB(ruta, q).onSnapshot(function (r) { cb(r.docs.map(docFB)); }, function (e) { console.warn(e); });
    },
    poner: function (ruta, d, merge) { return fb.db.doc(ruta).set(valor(d), merge ? { merge: true } : {}); },
    actualizar: function (ruta, d) { return fb.db.doc(ruta).update(valorActualizar(d)); },
    borrar: function (ruta) { return fb.db.doc(ruta).delete(); },
    crearSiNoExiste: function (ruta, d) {
      var ref = fb.db.doc(ruta);
      return fb.db.runTransaction(function (t) {
        return t.get(ref).then(function (s) { if (s.exists) return false; t.set(ref, valor(d)); return true; });
      });
    },
    reservarCupo: function (ruta, campo, max) {
      var ref = fb.db.doc(ruta);
      return fb.db.runTransaction(function (t) {
        return t.get(ref).then(function (s) {
          var n = s.exists ? (s.data()[campo] || 0) : 0;
          if (n >= max) return false;
          var o = {}; o[campo] = n + 1;
          t.set(ref, o, { merge: true }); return true;
        });
      });
    },
    lote: function (ops) {
      var b = fb.db.batch();
      ops.forEach(function (o) {
        var ref = fb.db.doc(o.ruta);
        if (o.op === 'poner') b.set(ref, valor(o.datos), o.merge ? { merge: true } : {});
        else if (o.op === 'actualizar') b.update(ref, valorActualizar(o.datos));
        else if (o.op === 'borrar') b.delete(ref);
      });
      return b.commit();
    }
  };

  // ===================================================================
  // Motor local (simulador para pruebas, comparte datos entre pestañas)
  // ===================================================================
  var CLAVE = 'nube_local_db', escuchas = [];
  function leerDB() { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { return {}; } }
  function guardarDB(db) { localStorage.setItem(CLAVE, JSON.stringify(db)); avisar(); }
  function copia(o) { return o == null ? null : JSON.parse(JSON.stringify(o)); }
  function aplicar(base, d) {
    var o = copia(base) || {};
    Object.keys(d).forEach(function (k) {
      var v = d[k], partes = k.split('.'), dest = o;
      for (var i = 0; i < partes.length - 1; i++) { dest[partes[i]] = dest[partes[i]] || {}; dest = dest[partes[i]]; }
      var ult = partes[partes.length - 1];
      if (v && v.__inc !== undefined) dest[ult] = (dest[ult] || 0) + v.__inc;
      else if (v && v.__ahora) dest[ult] = Date.now();
      else if (v && v.__borrar) delete dest[ult];
      else dest[ult] = resolver(v);
    });
    return o;
  }
  function resolver(v) {
    if (v && v.__ahora) return Date.now();
    if (Array.isArray(v)) return v.map(resolver);
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = resolver(v[k]); }); return o; }
    return v;
  }
  function hijosDe(db, ruta) {
    var pref = ruta + '/', out = [];
    Object.keys(db).forEach(function (k) {
      if (k.indexOf(pref) === 0 && k.slice(pref.length).indexOf('/') < 0) {
        var d = copia(db[k]); d.id = k.slice(pref.length); out.push(d);
      }
    });
    return out;
  }
  function campo(d, c) { return c.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, d); }
  function filtrar(lista, q) {
    q = q || {};
    (q.donde || []).forEach(function (w) {
      lista = lista.filter(function (d) {
        var v = campo(d, w[0]);
        if (w[1] === '==') return v === w[2];
        if (w[1] === 'array-contains') return Array.isArray(v) && v.indexOf(w[2]) >= 0;
        if (w[1] === '>=') return v >= w[2];
        if (w[1] === '<=') return v <= w[2];
        if (w[1] === '>') return v > w[2];
        if (w[1] === '<') return v < w[2];
        return true;
      });
    });
    if (q.orden) {
      var c = q.orden[0], s = q.orden[1] === 'desc' ? -1 : 1;
      lista.sort(function (a, b) { var x = campo(a, c), y = campo(b, c); return x === y ? 0 : (x > y ? s : -s); });
    }
    if (q.limite) lista = lista.slice(0, q.limite);
    return lista;
  }
  function avisar() {
    escuchas.forEach(function (e) {
      var r = e.leer(), txt = JSON.stringify(r);
      if (txt !== e.ultimo) { e.ultimo = txt; try { e.cb(r); } catch (err) { console.error(err); } }
    });
  }
  window.addEventListener('storage', function (ev) { if (ev.key === CLAVE) avisar(); });
  function demora(fn) { return promesa(function (ok, mal) { setTimeout(function () { try { ok(fn()); } catch (e) { mal(e); } }, 25); }); }
  function escuchar(leer, cb) {
    var e = { leer: leer, cb: cb, ultimo: null };
    escuchas.push(e);
    setTimeout(function () { e.ultimo = JSON.stringify(leer()); cb(leer()); }, 20);
    return function () { escuchas = escuchas.filter(function (x) { return x !== e; }); };
  }
  var Local = {
    iniciar: function () {
      var uid = sessionStorage.getItem('nube_uid');
      if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('nube_uid', uid); }
      return demora(function () { return uid; });
    },
    _cuentas: function () { try { return JSON.parse(localStorage.getItem('nube_local_cuentas') || '{}'); } catch (e) { return {}; } },
    _guardarCuentas: function (c) { localStorage.setItem('nube_local_cuentas', JSON.stringify(c)); },
    tieneCodigo: function () {
      var c = this._cuentas(), uid = sessionStorage.getItem('nube_uid');
      return Object.keys(c).some(function (k) { return c[k].uid === uid; });
    },
    vincularCodigo: function (correo, clave) {
      var self = this;
      return demora(function () {
        var c = self._cuentas();
        if (c[correo]) { var e = new Error('en uso'); e.code = 'auth/email-already-in-use'; throw e; }
        c[correo] = { clave: clave, uid: sessionStorage.getItem('nube_uid') }; self._guardarCuentas(c);
      });
    },
    cambiarClave: function (correo, vieja, nueva) {
      var self = this;
      return demora(function () { var c = self._cuentas(); c[correo].clave = nueva; self._guardarCuentas(c); });
    },
    entrarConCodigo: function (correo, clave) {
      var self = this;
      return demora(function () {
        var c = self._cuentas()[correo];
        if (!c || c.clave !== clave) { var e = new Error('mal'); e.code = 'auth/invalid-credential'; throw e; }
        sessionStorage.setItem('nube_uid', c.uid); return c.uid;
      });
    },
    doc: function (ruta) { return demora(function () { var d = copia(leerDB()[ruta]); if (d) d.id = ruta.split('/').pop(); return d; }); },
    escucharDoc: function (ruta, cb) {
      return escuchar(function () { var d = copia(leerDB()[ruta]); if (d) d.id = ruta.split('/').pop(); return d; }, cb);
    },
    consulta: function (ruta, q) { return demora(function () { return filtrar(hijosDe(leerDB(), ruta), q); }); },
    escucharConsulta: function (ruta, q, cb) { return escuchar(function () { return filtrar(hijosDe(leerDB(), ruta), q); }, cb); },
    poner: function (ruta, d, merge) {
      return demora(function () { var db = leerDB(); db[ruta] = merge ? aplicar(db[ruta], d) : aplicar({}, d); guardarDB(db); });
    },
    actualizar: function (ruta, d) {
      return demora(function () { var db = leerDB(); if (!db[ruta]) throw new Error('No existe ' + ruta); db[ruta] = aplicar(db[ruta], d); guardarDB(db); });
    },
    borrar: function (ruta) { return demora(function () { var db = leerDB(); delete db[ruta]; guardarDB(db); }); },
    crearSiNoExiste: function (ruta, d) {
      return demora(function () { var db = leerDB(); if (db[ruta]) return false; db[ruta] = aplicar({}, d); guardarDB(db); return true; });
    },
    reservarCupo: function (ruta, c, max) {
      return demora(function () {
        var db = leerDB(), n = (db[ruta] && db[ruta][c]) || 0;
        if (n >= max) return false;
        db[ruta] = db[ruta] || {}; db[ruta][c] = n + 1; guardarDB(db); return true;
      });
    },
    lote: function (ops) {
      return demora(function () {
        var db = leerDB();
        ops.forEach(function (o) {
          if (o.op === 'poner') db[o.ruta] = o.merge ? aplicar(db[o.ruta], o.datos) : aplicar({}, o.datos);
          else if (o.op === 'actualizar') db[o.ruta] = aplicar(db[o.ruta], o.datos);
          else if (o.op === 'borrar') delete db[o.ruta];
        });
        guardarDB(db);
      });
    }
  };

  // ===================================================================
  var motor = MODO === 'firebase' ? Firebase : MODO === 'local' ? Local : null;
  window.Nube = {
    modo: MODO,
    uid: null,
    configurada: function () { return !!motor; },
    enLinea: function () { return MODO === 'local' || navigator.onLine !== false; },
    iniciar: function () {
      var self = this;
      if (!motor) return Promise.reject(new Error('sin-config'));
      return motor.iniciar().then(function (uid) { self.uid = uid; return uid; });
    },
    tieneCodigo: function () { return motor.tieneCodigo(); },
    vincularCodigo: function (c, k) { return motor.vincularCodigo(c, k); },
    cambiarClave: function (c, v, n) { return motor.cambiarClave(c, v, n); },
    entrarConCodigo: function (c, k) { var self = this; return motor.entrarConCodigo(c, k).then(function (uid) { self.uid = uid; return uid; }); },
    doc: function (r) { return motor.doc(r); },
    escucharDoc: function (r, cb) { return motor.escucharDoc(r, cb); },
    consulta: function (r, q) { return motor.consulta(r, q); },
    escucharConsulta: function (r, q, cb) { return motor.escucharConsulta(r, q, cb); },
    poner: function (r, d, merge) { return motor.poner(r, d, merge); },
    actualizar: function (r, d) { return motor.actualizar(r, d); },
    borrar: function (r) { return motor.borrar(r); },
    crearSiNoExiste: function (r, d) { return motor.crearSiNoExiste(r, d); },
    reservarCupo: function (r, c, max) { return motor.reservarCupo(r, c, max); },
    lote: function (ops) { return motor.lote(ops); },
    inc: function (n) { return { __inc: n }; },
    ahora: function () { return { __ahora: true }; },
    quitar: function () { return { __borrar: true }; }
  };
})();
