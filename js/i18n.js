// Idiomas de la app: español (base), inglés y portugués.
// Los textos se escriben en español en el código. Para otro idioma:
//  - los datos de los juegos se reemplazan por los de js/datos/en/ o js/datos/pt/ (mismo orden y mismos id);
//  - los textos de la interfaz se traducen solos al aparecer en pantalla, con el diccionario de js/i18n/textos.js.
// Cambiar de idioma recarga la app.
(function () {
  var IDIOMAS = [
    { id: 'es', nombre: 'Español', voz: 'es' },
    { id: 'en', nombre: 'English', voz: 'en' },
    { id: 'pt', nombre: 'Português', voz: 'pt' }
  ];
  var guardado = null;
  try { guardado = JSON.parse(localStorage.getItem('jb_idioma')); } catch (e) {}
  var lang = IDIOMAS.some(function (x) { return x.id === guardado; }) ? guardado : null;
  var actual = lang || 'es';
  var col = { en: 0, pt: 1 };

  var exactos = {};     // 'texto en español' -> [en, pt]
  var plantillas = [];  // [regex, [en, pt]]
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Agrega textos: { 'español': ['english', 'português'] }. Si la clave tiene {} es una plantilla:
  // '{} libros': ['{} books', '{} livros'] — lo que va en {} también se traduce. {n} es solo un número.
  // En la traducción se puede usar {1}, {2}… para cambiar el orden.
  function agregar(obj) {
    Object.keys(obj).forEach(function (k) {
      if (/\{n?\}/.test(k)) {
        var re = new RegExp('^' + escRe(k).replace(/\\\{n\\\}/g, '(-?\\d+)').replace(/\\\{\\\}/g, '([\\s\\S]+?)') + '$');
        plantillas.push([re, obj[k]]);
      } else exactos[k] = obj[k];
    });
  }

  function traducirExacto(s) {
    var v = exactos[s];
    return v ? v[col[actual]] : null;
  }
  // Traduce un texto. Conserva los espacios del principio y del final.
  function t(s) {
    if (actual === 'es' || s == null) return s;
    s = String(s);
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), ini = m[1], cuerpo = m[2], fin = m[3];
    if (!cuerpo) return s;
    var r = traducirExacto(cuerpo);
    if (r != null) return ini + r + fin;
    for (var i = 0; i < plantillas.length; i++) {
      var p = plantillas[i], mm = p[0].exec(cuerpo);
      if (!mm) continue;
      var dest = p[1][col[actual]], k = 0, grupos = mm.slice(1).map(function (g) {
        return /[A-Za-zÁÉÍÓÚáéíóúñ]/.test(g) ? t(g) : g;
      });
      var res = /\{\d\}/.test(dest)
        ? dest.replace(/\{(\d)\}/g, function (_, n) { return grupos[+n - 1]; })
        : dest.replace(/\{n?\}/g, function () { return grupos[k++]; });
      if (actual === 'pt') res = res.replace(/\bde o\b/g, 'do').replace(/\bde a\b/g, 'da').replace(/\bde os\b/g, 'dos').replace(/\bde as\b/g, 'das')
        .replace(/\bem o\b/g, 'no').replace(/\bem a\b/g, 'na').replace(/\ba o\b/g, 'ao');
      return ini + res + fin;
    }
    if (faltan) faltan[cuerpo] = 1;
    return s;
  }
  // Para revisar traducciones: ?faltan=1 guarda los textos sin traducir en I18n.faltan
  var faltan = /[?&]faltan=1/.test(location.search) ? {} : null;

  // ---------- Traducción automática de lo que aparece en pantalla ----------
  var ATRIBUTOS = ['aria-label', 'title', 'placeholder'];
  var NO = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, svg: 1 };
  function traducirTexto(n) {
    var v = n.nodeValue;
    if (!v || n._t === v || !/[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]/.test(v)) return;
    var p = n.parentNode;
    if (p && (NO[p.nodeName] || (p.closest && p.closest('[data-no-t]')))) return;
    var r = t(v);
    n._t = r;
    if (r !== v) n.nodeValue = r;
  }
  function traducirAtributos(el) {
    ATRIBUTOS.forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a);
      if (!v) return;
      var guardado = el['_t_' + a];
      if (guardado === v) return;
      var r = t(v);
      el['_t_' + a] = r;
      if (r !== v) el.setAttribute(a, r);
    });
  }
  function recorrer(raiz) {
    if (raiz.nodeType === 3) { traducirTexto(raiz); return; }
    if (raiz.nodeType !== 1 || NO[raiz.nodeName]) return;
    traducirAtributos(raiz);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) { return n.nodeType === 1 && NO[n.nodeName] ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) traducirTexto(n); else traducirAtributos(n); }
  }
  function vigilar() {
    if (actual === 'es') return;
    document.documentElement.lang = actual === 'pt' ? 'pt-BR' : 'en';
    recorrer(document.body);
    new MutationObserver(function (lista) {
      lista.forEach(function (m) {
        if (m.type === 'characterData') traducirTexto(m.target);
        else if (m.type === 'attributes') traducirAtributos(m.target);
        else m.addedNodes.forEach(recorrer);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigilar); else vigilar();

  window.I18n = {
    IDIOMAS: IDIOMAS,
    lang: actual,
    elegido: !!lang,
    t: t,
    faltan: function () { return faltan ? Object.keys(faltan) : []; },
    agregar: agregar,
    // Texto según el idioma, sin diccionario: I18n.de('español', 'english', 'português')
    de: function (es, en, pt) { return actual === 'en' ? en : actual === 'pt' ? pt : es; },
    elegir: function (id) {
      try { localStorage.setItem('jb_idioma', JSON.stringify(id)); } catch (e) {}
    },
    // Biblia que se usa en cada idioma
    biblia: function () { return actual === 'en' ? 'KJV' : actual === 'pt' ? 'ARC' : 'RV1960'; }
  };
  window.T = t;
})();
