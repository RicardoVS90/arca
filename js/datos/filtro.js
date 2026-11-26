// Filtro de palabras no permitidas en los alias escritos (español, jopara/guaraní e inglés).
// Se compara en MAYÚSCULAS, sin tildes, con los números parecidos a letras convertidos
// (0→O 1→I 3→E 4→A 5→S 7→T 8→B 9→G) y sin letras repetidas (PUUUTA → PUTA).
// Palabras de 4 letras o más también se bloquean si aparecen dentro del alias.
// Se usa solo para el alias escrito (el armado por columnas ya usa palabras de una lista segura).
// Se pueden agregar palabras a la lista (en mayúsculas, sin tildes).
window.FiltroAlias = (function () {
  var LISTA = [
    // Español (incluye regionalismos rioplatenses y paraguayos)
    'PUTA', 'PUTO', 'CACA', 'POPO', 'PUTAS', 'PUTOS', 'PUTIT', 'MIERD', 'CULO', 'CULOS', 'CULIA', 'CAGAR', 'CAGON', 'CAGA', 'CAGO',
    'PIJA', 'PIJAS', 'PICHA', 'POLLA', 'VERGA', 'CHOTA', 'CONCH', 'COÑO', 'COJER', 'COGER', 'COJE', 'COGE',
    'COJO', 'COGIO', 'FOLLA', 'FOLLAR', 'PETE', 'PETER', 'PAJA', 'PAJER', 'PAJIN', 'TETA', 'TETAS', 'TETON', 'PENE',
    'VAGIN', 'SEXO', 'SEXY', 'SEXUA', 'PORNO', 'ORTO', 'POTO', 'NALGA', 'TROLO', 'TROLA', 'MARIC', 'MARIK', 'BOLUD',
    'BOLU', 'PELOT', 'IDIOT', 'TARAD', 'IMBEC', 'MOGOL', 'CARAJ', 'JODER', 'JODID', 'CABRO', 'ZORRA', 'PERRA', 'GARCH',
    'GARCA', 'PUNET', 'MAMON', 'CHUPA', 'CHUPALA', 'LAMEL', 'ESTUP', 'MALPA', 'HDP', 'HDLGP', 'CTM',
    'CSM', 'PTM', 'LPM', 'LPQTP', 'CDLM',
    // Jopara / guaraní (vulgares)
    'TEMBO', 'TAKO', 'TAKOS', 'TEMBOI', 'KURE', 'TAVY', 'TAVYR',
    // Inglés
    'FUCK', 'FUK', 'FUCKS', 'FCK', 'SHIT', 'DICK', 'COCK', 'CUNT', 'PUSSY', 'BITCH', 'BICH', 'ASS', 'ASSES', 'ARSE',
    'SEX', 'PORN', 'NUDE', 'NUDES', 'BOOB', 'BOOBS', 'TITS', 'TIT', 'CUM', 'FAG', 'NIGGA', 'NIGG', 'NIGER', 'NEGRO',
    'RAPE', 'PENIS', 'ANAL', 'ANUS', 'WTF', 'STFU', 'DILDO', 'HORNY', 'SLUT', 'WHORE', 'HOE', 'XXX',
    'BASTARD', 'PISS', 'PRICK', 'WANK', 'TWAT', 'JERK', 'STUPID', 'IDIOT', 'MORON', 'RETARD', 'DEATH', 'DRUGS', 'WEED',
    // Portugués (Brasil)
    'PORRA', 'CARALH', 'BUCET', 'BUCETA', 'XOXOT', 'PIROC', 'PINTO', 'CACET', 'FODA', 'FODER', 'FODID', 'FODAS', 'FDP', 'VTNC', 'VSF', 'PQP', 'TNC',
    'MERDA', 'BOSTA', 'CU', 'CUZAO', 'VIAD', 'VEADO', 'BICHA', 'SAPATAO', 'PUTINHA', 'PUTARIA', 'ARROMB', 'OTARI', 'BABACA', 'BOBAO',
    'IDIOTA', 'BURRO', 'CORNO', 'PEITO', 'PEITOS', 'BUNDA', 'BROXA', 'TESAO', 'SAFAD', 'PIRANH', 'VAGABUND', 'MACONH',
    'DROGAS', 'MORTE', 'DIABO', 'DEMONIO',
    // Odio, violencia y temas no aptos para la app
    'NAZI', 'HITLE', 'KKK', 'SATAN', 'DEMON', 'DIABL', 'LUCIF', 'DROGA', 'MARIH', 'PORRO', 'FALOP', 'MATAR', 'MUERT',
    'SUICI', 'BOMBA', 'TERRO',
    // Para que nadie se haga pasar por los responsables
    'ADMIN', 'MODER', 'SOPOR', 'RICKE', 'GOOGL'
  ];
  // Nombres reales que contienen una palabra de la lista y no deben bloquearse
  var EXCEPCIONES = ['PENELOPE', 'ANALIA', 'ANALI', 'PETER', 'PETERSON', 'CONCHITA', 'CONCHA', 'ASSIS', 'CASSIA', 'CASSIO', 'CASSANDRA',
    'VASSILI', 'MATARAZZO', 'DEMONTE', 'NEGRONI', 'TETAMANTI', 'HOELLER', 'DICKSON', 'DICKENS', 'COCKER', 'SEXTO', 'SEXTA', 'SEXTON',
    'ESTUPINAN', 'TITO', 'TITINA', 'CUMBERLAND', 'SCUMBERG', 'NIGERIA', 'MASSIMO', 'MASSIEL', 'JESSICA', 'BASSIL', 'PICHARDO',
    'POTOSI', 'ORTOLANI'];
  var NUM = { '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S', '7': 'T', '8': 'B', '9': 'G', '2': 'Z', '6': 'G' };

  // Mayúsculas, sin tildes (conserva la Ñ), números parecidos convertidos a letras
  function base(txt) {
    var t = String(txt).toUpperCase().replace(/Ñ/g, '\u0001')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'Ñ');
    return t.replace(/[0-9]/g, function (d) { return NUM[d]; }).replace(/[^A-ZÑ]/g, '');
  }
  var PROHIBIDAS = LISTA.map(base);
  // Variantes a revisar: tal cual, con letras repetidas de a dos (PERRRA→PERRA) y de a una (PUUTA→PUTA)
  function variantes(txt) {
    var b = base(txt);
    return [b, b.replace(/(.)\1{2,}/g, '$1$1'), b.replace(/(.)\1+/g, '$1')];
  }
  function coincide(s) {
    return PROHIBIDAS.some(function (w) {
      if (!w) return false;
      if (s === w) return true;
      if (w.length >= 4 && s.indexOf(w) >= 0) return true;
      if (w.length === 3 && s.indexOf(w) === 0) return true;
      return false;
    });
  }
  function bloqueado(texto) {
    // Las palabras que son nombres permitidos se quitan antes de revisar
    texto = String(texto).split(/\s+/).filter(function (w) { return EXCEPCIONES.indexOf(base(w)) < 0; }).join(' ');
    if (!texto.trim()) return false;
    var soloLetras = String(texto).replace(/[0-9 ]+$/g, '');
    return variantes(texto).concat(variantes(soloLetras)).some(function (s) { return s && coincide(s); });
  }
  return { permitido: function (alias) { return !bloqueado(alias); } };
})();
