// Word search (English). Same ids as js/datos/sopa.js.
if (I18n.lang === 'en') window.DATOS_SOPA = {
  temas: [
    { id: 'libros-at', nombre: 'Books of the Old Testament', corto: 'OT books', icono: '📜',
      desc: 'Find books of the Old Testament',
      palabras: function () {
        return DATOS_LIBROS.todos.filter(function (l) { return l.test === 'AT' && !/[\d\s]/.test(l.nombre); }).map(function (l) { return l.nombre; });
      } },
    { id: 'libros-nt', nombre: 'Books of the New Testament', corto: 'NT books', icono: '✉️',
      desc: 'Find books of the New Testament',
      palabras: function () {
        return DATOS_LIBROS.todos.filter(function (l) { return l.test === 'NT' && !/[\d\s]/.test(l.nombre); }).map(function (l) { return l.nombre; });
      } },
    { id: 'personajes', nombre: 'Bible characters', corto: 'Characters', icono: '🧔',
      desc: 'Find people from the Bible',
      palabras: ['Noah', 'Abraham', 'Isaac', 'Jacob', 'Joseph', 'Moses', 'Aaron', 'Joshua', 'Gideon', 'Samson', 'Ruth', 'Samuel', 'Rahab',
        'David', 'Solomon', 'Elijah', 'Elisha', 'Esther', 'Daniel', 'Jonah', 'Deborah', 'Nehemiah', 'Paul', 'Peter',
        'Zacchaeus', 'Lazarus', 'Martha', 'Timothy', 'Barnabas', 'Stephen', 'Lydia', 'Dorcas'] },
    { id: 'discipulos', nombre: 'The 12 disciples', corto: 'Disciples', icono: '🎣',
      desc: 'Find the disciples of Jesus (Matthew 10:2-4)',
      palabras: ['Peter', 'Andrew', 'James', 'John', 'Philip', 'Bartholomew', 'Thomas', 'Matthew', 'Thaddaeus', 'Simon', 'Judas'] },
    { id: 'tribus', nombre: 'The 12 tribes of Israel', corto: 'The 12 tribes', icono: '⛺',
      desc: 'Find the sons of Jacob (Genesis 49)',
      palabras: ['Reuben', 'Simeon', 'Levi', 'Judah', 'Dan', 'Naphtali', 'Gad', 'Asher', 'Issachar', 'Zebulun', 'Joseph', 'Benjamin'] },
    { id: 'lugares', nombre: 'Bible places', corto: 'Places', icono: '🗺️',
      desc: 'Find cities, rivers and mountains of the Bible',
      palabras: ['Bethlehem', 'Nazareth', 'Jericho', 'Egypt', 'Babylon', 'Jerusalem', 'Galilee', 'Nineveh', 'Canaan', 'Sinai',
        'Bethany', 'Jordan', 'Eden', 'Ararat', 'Carmel', 'Damascus', 'Patmos', 'Capernaum', 'Samaria', 'Hebron'] }
  ]
};
