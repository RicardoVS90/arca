// Los 10 mandamientos — Éxodo 20:3-17, Reina-Valera 1960.
// "corto": el comienzo del mandamiento, tal cual el texto bíblico (sin parafrasear).
// "completo": el texto completo con su cita. Ricardo: cotejalo con tu Biblia antes de publicar.
window.DATOS_MANDAMIENTOS = {
  mandamientos: [
    { n: 1, tabla: 1, img: 'img/mandamientos/mand-01.webp', icono: '👑', corto: 'No tendrás dioses ajenos delante de mí.',
      cita: 'Éxodo 20:3', completo: 'No tendrás dioses ajenos delante de mí.' },
    { n: 2, tabla: 1, img: 'img/mandamientos/mand-02.webp', icono: '🗿', corto: 'No te harás imagen.',
      cita: 'Éxodo 20:4-6',
      completo: 'No te harás imagen, ni ninguna semejanza de lo que esté arriba en el cielo, ni abajo en la tierra, ni en las aguas debajo de la tierra. No te inclinarás a ellas, ni las honrarás; porque yo soy Jehová tu Dios, fuerte, celoso, que visito la maldad de los padres sobre los hijos hasta la tercera y cuarta generación de los que me aborrecen, y hago misericordia a millares, a los que me aman y guardan mis mandamientos.' },
    { n: 3, tabla: 1, img: 'img/mandamientos/mand-03.webp', icono: '🗣️', corto: 'No tomarás el nombre de Jehová tu Dios en vano.',
      cita: 'Éxodo 20:7',
      completo: 'No tomarás el nombre de Jehová tu Dios en vano; porque no dará por inocente Jehová al que tomare su nombre en vano.' },
    { n: 4, tabla: 1, img: 'img/mandamientos/mand-04.webp', icono: '🌅', corto: 'Acuérdate del día de reposo para santificarlo.',
      cita: 'Éxodo 20:8-11', especial: true,
      completo: 'Acuérdate del día de reposo para santificarlo. Seis días trabajarás, y harás toda tu obra; mas el séptimo día es reposo para Jehová tu Dios; no hagas en él obra alguna, tú, ni tu hijo, ni tu hija, ni tu siervo, ni tu criada, ni tu bestia, ni tu extranjero que está dentro de tus puertas. Porque en seis días hizo Jehová los cielos y la tierra, el mar, y todas las cosas que en ellos hay, y reposó en el séptimo día; por tanto, Jehová bendijo el día de reposo y lo santificó.' },
    { n: 5, tabla: 2, img: 'img/mandamientos/mand-05.webp', icono: '👪', corto: 'Honra a tu padre y a tu madre.',
      cita: 'Éxodo 20:12',
      completo: 'Honra a tu padre y a tu madre, para que tus días se alarguen en la tierra que Jehová tu Dios te da.' },
    { n: 6, tabla: 2, img: 'img/mandamientos/mand-06.webp', icono: '❤️', corto: 'No matarás.', cita: 'Éxodo 20:13', completo: 'No matarás.' },
    { n: 7, tabla: 2, img: 'img/mandamientos/mand-07.webp', icono: '💍', corto: 'No cometerás adulterio.', cita: 'Éxodo 20:14', completo: 'No cometerás adulterio.' },
    { n: 8, tabla: 2, img: 'img/mandamientos/mand-08.webp', icono: '👜', corto: 'No hurtarás.', cita: 'Éxodo 20:15', completo: 'No hurtarás.' },
    { n: 9, tabla: 2, img: 'img/mandamientos/mand-09.webp', icono: '💬', corto: 'No hablarás contra tu prójimo falso testimonio.',
      cita: 'Éxodo 20:16', completo: 'No hablarás contra tu prójimo falso testimonio.' },
    { n: 10, tabla: 2, img: 'img/mandamientos/mand-10.webp', icono: '🏠', corto: 'No codiciarás la casa de tu prójimo.',
      cita: 'Éxodo 20:17',
      completo: 'No codiciarás la casa de tu prójimo, no codiciarás la mujer de tu prójimo, ni su siervo, ni su criada, ni su buey, ni su asno, ni cosa alguna de tu prójimo.' }
  ],
  // Situaciones de la vida diaria para el modo "¿Qué mandamiento es?"
  situaciones: [
    { img: 'img/mandamientos/sit/s-01.webp', n: 1, icono: '🎮', texto: 'A Carla le importan más los videojuegos que Dios. Ya no tiene tiempo para orar.' },
    { img: 'img/mandamientos/sit/s-02.webp', n: 2, icono: '🗿', texto: 'En un viaje, unas personas se arrodillan ante una estatua para pedirle cosas.' },
    { img: 'img/mandamientos/sit/s-03.webp', n: 3, icono: '😠', texto: 'Un chico usa el nombre de Dios como si fuera una mala palabra.' },
    { img: 'img/mandamientos/sit/s-04.webp', n: 4, icono: '🌅', texto: 'El viernes a la tarde, la familia de Lucas termina sus tareas para recibir el sábado.' },
    { img: 'img/mandamientos/sit/s-05.webp', n: 5, icono: '🧹', texto: 'Mamá le pidió a Ana que ordene su pieza, y Ana le contestó mal.' },
    { img: 'img/mandamientos/sit/s-06.webp', n: 6, icono: '😡', texto: 'Pedro está tan enojado con un compañero que quiere lastimarlo.' },
    { img: 'img/mandamientos/sit/s-07.webp', n: 8, icono: '👛', texto: 'Juan encontró una billetera en la plaza y piensa quedársela.' },
    { img: 'img/mandamientos/sit/s-08.webp', n: 8, icono: '✏️', texto: 'Sofi se llevó a escondidas los lápices nuevos de su compañera.' },
    { img: 'img/mandamientos/sit/s-09.webp', n: 9, icono: '🤥', texto: 'María dijo una mentira para que retaran a su hermano en lugar de a ella.' },
    { img: 'img/mandamientos/sit/s-10.webp', n: 10, icono: '🚲', texto: 'Leo está triste y enojado porque su amigo tiene una bici nueva y él quiere esa misma.' },
    { img: 'img/mandamientos/sit/s-11.webp', n: 5, icono: '👵', texto: 'Tomás ayuda a su abuela y obedece a sus papás con alegría.' },
    { img: 'img/mandamientos/sit/s-12.webp', n: 4, icono: '⛪', texto: 'Es sábado y Mateo va a la iglesia con su familia en lugar de ir a jugar un partido.' }
  ]
};
