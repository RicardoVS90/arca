// Libros de la Biblia agrupados en etapas (orden canónico, 66 libros)
window.DATOS_LIBROS = {
  etapas: [
    { id: 'pentateuco', nombre: 'Pentateuco', test: 'AT', color: '#E07A2E',
      libros: ['Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio'] },
    { id: 'historicos', nombre: 'Libros históricos', test: 'AT', color: '#3E9E5A',
      libros: ['Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes',
               '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester'] },
    { id: 'poeticos', nombre: 'Libros poéticos', test: 'AT', color: '#9B59B6',
      libros: ['Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares'] },
    { id: 'mayores', nombre: 'Profetas mayores', test: 'AT', color: '#D64545',
      libros: ['Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel'] },
    { id: 'menores', nombre: 'Profetas menores', test: 'AT', color: '#E6A23C',
      libros: ['Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás', 'Miqueas', 'Nahúm',
               'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías'] },
    { id: 'evangelios', nombre: 'Evangelios y Hechos', test: 'NT', color: '#2F86C9',
      libros: ['Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos'] },
    { id: 'pablo', nombre: 'Cartas de Pablo', test: 'NT', color: '#16A0A0',
      libros: ['Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios', 'Filipenses',
               'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo',
               '2 Timoteo', 'Tito', 'Filemón'] },
    { id: 'generales', nombre: 'Cartas generales y Apocalipsis', test: 'NT', color: '#C2557A',
      libros: ['Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan',
               'Judas', 'Apocalipsis'] }
  ]
};

// Lista plana con datos de cada libro, en orden bíblico
window.DATOS_LIBROS.todos = window.DATOS_LIBROS.etapas.flatMap(function (e) {
  return e.libros.map(function (nombre) {
    return { nombre: nombre, etapa: e.id, test: e.test, color: e.color };
  });
});
