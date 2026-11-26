// Libros de la Biblia (pt). Mismo orden e id que js/datos/libros.js.
if (I18n.lang === 'pt') {
  window.DATOS_LIBROS = { etapas: [
    {"id": "pentateuco", "nombre": "Pentateuco", "test": "AT", "color": "#E07A2E", "libros": ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio"]},
    {"id": "historicos", "nombre": "Livros históricos", "test": "AT", "color": "#3E9E5A", "libros": ["Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Ester"]},
    {"id": "poeticos", "nombre": "Livros poéticos", "test": "AT", "color": "#9B59B6", "libros": ["Jó", "Salmos", "Provérbios", "Eclesiastes", "Cantares"]},
    {"id": "mayores", "nombre": "Profetas maiores", "test": "AT", "color": "#D64545", "libros": ["Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel"]},
    {"id": "menores", "nombre": "Profetas menores", "test": "AT", "color": "#E6A23C", "libros": ["Oseias", "Joel", "Amós", "Obadias", "Jonas", "Miqueias", "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias"]},
    {"id": "evangelios", "nombre": "Evangelhos e Atos", "test": "NT", "color": "#2F86C9", "libros": ["Mateus", "Marcos", "Lucas", "João", "Atos"]},
    {"id": "pablo", "nombre": "Cartas de Paulo", "test": "NT", "color": "#16A0A0", "libros": ["Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filemom"]},
    {"id": "generales", "nombre": "Cartas gerais e Apocalipse", "test": "NT", "color": "#C2557A", "libros": ["Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas", "Apocalipse"]}
  ] };
  window.DATOS_LIBROS.todos = window.DATOS_LIBROS.etapas.flatMap(function (e) {
    return e.libros.map(function (nombre) { return { nombre: nombre, etapa: e.id, test: e.test, color: e.color }; });
  });
}
