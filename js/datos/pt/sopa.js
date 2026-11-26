// Caça-palavras (português). Mesmos id que js/datos/sopa.js.
if (I18n.lang === 'pt') window.DATOS_SOPA = {
  temas: [
    { id: 'libros-at', nombre: 'Livros do Antigo Testamento', corto: 'Livros do AT', icono: '📜',
      desc: 'Procure livros do Antigo Testamento',
      palabras: function () {
        return DATOS_LIBROS.todos.filter(function (l) { return l.test === 'AT' && !/[\d\s]/.test(l.nombre); }).map(function (l) { return l.nombre; });
      } },
    { id: 'libros-nt', nombre: 'Livros do Novo Testamento', corto: 'Livros do NT', icono: '✉️',
      desc: 'Procure livros do Novo Testamento',
      palabras: function () {
        return DATOS_LIBROS.todos.filter(function (l) { return l.test === 'NT' && !/[\d\s]/.test(l.nombre); }).map(function (l) { return l.nombre; });
      } },
    { id: 'personajes', nombre: 'Personagens bíblicos', corto: 'Personagens', icono: '🧔',
      desc: 'Procure personagens da Bíblia',
      palabras: ['Noé', 'Abraão', 'Isaque', 'Jacó', 'José', 'Moisés', 'Arão', 'Josué', 'Gideão', 'Sansão', 'Rute', 'Samuel', 'Raabe',
        'Davi', 'Salomão', 'Elias', 'Eliseu', 'Ester', 'Daniel', 'Jonas', 'Débora', 'Neemias', 'Paulo', 'Pedro',
        'Zaqueu', 'Lázaro', 'Marta', 'Timóteo', 'Barnabé', 'Estêvão', 'Lídia', 'Dorcas'] },
    { id: 'discipulos', nombre: 'Os 12 discípulos', corto: 'Discípulos', icono: '🎣',
      desc: 'Procure os discípulos de Jesus (Mateus 10:2-4)',
      palabras: ['Pedro', 'André', 'Tiago', 'João', 'Filipe', 'Bartolomeu', 'Tomé', 'Mateus', 'Tadeu', 'Simão', 'Judas'] },
    { id: 'tribus', nombre: 'As 12 tribos de Israel', corto: 'As 12 tribos', icono: '⛺',
      desc: 'Procure os filhos de Jacó (Gênesis 49)',
      palabras: ['Rúben', 'Simeão', 'Levi', 'Judá', 'Dã', 'Naftali', 'Gade', 'Aser', 'Issacar', 'Zebulom', 'José', 'Benjamim'] },
    { id: 'lugares', nombre: 'Lugares bíblicos', corto: 'Lugares', icono: '🗺️',
      desc: 'Procure cidades, rios e montes da Bíblia',
      palabras: ['Belém', 'Nazaré', 'Jericó', 'Egito', 'Babilônia', 'Jerusalém', 'Galileia', 'Nínive', 'Canaã', 'Sinai',
        'Betânia', 'Jordão', 'Éden', 'Ararate', 'Carmelo', 'Damasco', 'Patmos', 'Cafarnaum', 'Samaria', 'Hebrom'] }
  ]
};
