// Libros de la Biblia (en). Mismo orden e id que js/datos/libros.js.
if (I18n.lang === 'en') {
  window.DATOS_LIBROS = { etapas: [
    {"id": "pentateuco", "nombre": "Pentateuch", "test": "AT", "color": "#E07A2E", "libros": ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"]},
    {"id": "historicos", "nombre": "Historical books", "test": "AT", "color": "#3E9E5A", "libros": ["Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther"]},
    {"id": "poeticos", "nombre": "Poetic books", "test": "AT", "color": "#9B59B6", "libros": ["Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon"]},
    {"id": "mayores", "nombre": "Major prophets", "test": "AT", "color": "#D64545", "libros": ["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel"]},
    {"id": "menores", "nombre": "Minor prophets", "test": "AT", "color": "#E6A23C", "libros": ["Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"]},
    {"id": "evangelios", "nombre": "Gospels and Acts", "test": "NT", "color": "#2F86C9", "libros": ["Matthew", "Mark", "Luke", "John", "Acts"]},
    {"id": "pablo", "nombre": "Paul's letters", "test": "NT", "color": "#16A0A0", "libros": ["Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon"]},
    {"id": "generales", "nombre": "General letters and Revelation", "test": "NT", "color": "#C2557A", "libros": ["Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"]}
  ] };
  window.DATOS_LIBROS.todos = window.DATOS_LIBROS.etapas.flatMap(function (e) {
    return e.libros.map(function (nombre) { return { nombre: nombre, etapa: e.id, test: e.test, color: e.color }; });
  });
}
