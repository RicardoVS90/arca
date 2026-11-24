// Sopa de letras: listas de palabras por tema (se muestran con tilde; en la grilla van sin tilde, la Ñ se mantiene)
window.DATOS_SOPA = {
  temas: [
    { id: 'libros-at', nombre: 'Libros del Antiguo Testamento', corto: 'Libros del AT', icono: '📜',
      desc: 'Buscá libros del Antiguo Testamento',
      palabras: function () {
        return DATOS_LIBROS.todos.filter(function (l) { return l.test === 'AT' && !/\d/.test(l.nombre); }).map(function (l) { return l.nombre; });
      } },
    { id: 'libros-nt', nombre: 'Libros del Nuevo Testamento', corto: 'Libros del NT', icono: '✉️',
      desc: 'Buscá libros del Nuevo Testamento',
      palabras: function () {
        return DATOS_LIBROS.todos.filter(function (l) { return l.test === 'NT' && !/\d/.test(l.nombre); }).map(function (l) { return l.nombre; });
      } },
    { id: 'personajes', nombre: 'Personajes bíblicos', corto: 'Personajes', icono: '🧔',
      desc: 'Buscá personajes de la Biblia',
      palabras: ['Noé', 'Abraham', 'Isaac', 'Jacob', 'José', 'Moisés', 'Aarón', 'Josué', 'Gedeón', 'Sansón', 'Rut', 'Samuel', 'Rahab',
        'David', 'Salomón', 'Elías', 'Eliseo', 'Ester', 'Daniel', 'Jonás', 'Débora', 'Nehemías', 'Pablo', 'Pedro',
        'Zaqueo', 'Lázaro', 'Marta', 'Timoteo', 'Bernabé', 'Esteban', 'Lidia', 'Dorcas'] },
    { id: 'discipulos', nombre: 'Los 12 discípulos', corto: 'Discípulos', icono: '🎣',
      desc: 'Buscá a los discípulos de Jesús (Mateo 10:2-4)',
      palabras: ['Pedro', 'Andrés', 'Jacobo', 'Juan', 'Felipe', 'Bartolomé', 'Tomás', 'Mateo', 'Tadeo', 'Simón', 'Judas'] },
    { id: 'tribus', nombre: 'Las 12 tribus de Israel', corto: 'Las 12 tribus', icono: '⛺',
      desc: 'Buscá a los hijos de Jacob (Génesis 49)',
      palabras: ['Rubén', 'Simeón', 'Leví', 'Judá', 'Dan', 'Neftalí', 'Gad', 'Aser', 'Isacar', 'Zabulón', 'José', 'Benjamín'] },
    { id: 'lugares', nombre: 'Lugares bíblicos', corto: 'Lugares', icono: '🗺️',
      desc: 'Buscá ciudades, ríos y montes de la Biblia',
      palabras: ['Belén', 'Nazaret', 'Jericó', 'Egipto', 'Babilonia', 'Jerusalén', 'Galilea', 'Nínive', 'Canaán', 'Sinaí',
        'Betania', 'Jordán', 'Edén', 'Ararat', 'Carmelo', 'Damasco', 'Patmos', 'Capernaum', 'Samaria', 'Hebrón'] }
  ]
};
