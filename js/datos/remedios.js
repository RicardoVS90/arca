// Los 8 remedios naturales (El ministerio de curación, Elena G. de White)
// Podés cambiar las descripciones y situaciones aquí.
window.DATOS_REMEDIOS = {
  remedios: [
    { n: 1, img: 'img/remedios/remedio-1.webp', nombre: 'Agua', icono: '💧', desc: [
      'Tomar suficiente agua pura cada día y usarla para la higiene del cuerpo.',
      'Es la mejor bebida para calmar la sed, mucho mejor que las gaseosas.',
      'Nos ayuda por dentro al tomarla y por fuera al bañarnos.'
    ] },
    { n: 2, img: 'img/remedios/remedio-2.webp', nombre: 'Descanso', icono: '😴', desc: [
      'Dormir las horas necesarias de noche y descansar el sábado, como Dios lo pensó.',
      'Acostarse temprano para que el cuerpo y la mente se recuperen.',
      'Dios nos regaló un día de cada semana para dejar el trabajo y estar con Él.'
    ] },
    { n: 3, img: 'img/remedios/remedio-3.webp', nombre: 'Ejercicio', icono: '🏃', desc: [
      'Mover el cuerpo todos los días: caminar, correr, jugar y trabajar.',
      'Fortalece el corazón y los músculos, y nos pone de buen ánimo.',
      'Andar en bicicleta, nadar o ayudar en las tareas de la casa.'
    ] },
    { n: 4, img: 'img/remedios/remedio-4.webp', nombre: 'Luz solar', icono: '☀️', desc: [
      'Recibir un rato de sol cada día, que da vida y energía al cuerpo.',
      'Abrir las cortinas para que entre la luz del día a la casa.',
      'Jugar un rato al aire libre de día, cuidándose del sol fuerte del mediodía.'
    ] },
    { n: 5, img: 'img/remedios/remedio-5.webp', nombre: 'Aire puro', icono: '🌬️', desc: [
      'Respirar aire limpio y fresco, al aire libre y con las ventanas abiertas.',
      'Respirar hondo en el campo o en una plaza llena de árboles.',
      'Alejarse del humo y de los lugares cerrados y encerrados.'
    ] },
    { n: 6, img: 'img/remedios/remedio-6.webp', nombre: 'Nutrición adecuada', icono: '🥗', desc: [
      'Comer alimentos sanos y naturales: frutas, verduras, cereales y legumbres.',
      'Comer a horario, sin picar golosinas entre comidas.',
      'Llenar el plato con los colores de las frutas y las verduras.'
    ] },
    { n: 7, img: 'img/remedios/remedio-7.webp', nombre: 'Temperancia (o abstinencia)', icono: '⚖️', desc: [
      'Usar con moderación lo que es bueno y apartarse por completo de lo que hace daño.',
      'No exagerar ni en lo bueno: ni comer de más, ni jugar todo el día sin parar.',
      'Decir que no al cigarrillo, al alcohol y a todo lo que daña el cuerpo.'
    ] },
    { n: 8, img: 'img/remedios/remedio-8.webp', nombre: 'Confianza en Dios', icono: '🙏', desc: [
      'Orar, leer la Biblia y dejar nuestras preocupaciones en las manos de Dios.',
      'Saber que Dios nos cuida y que no estamos solos, aunque haya problemas.',
      'Estar en paz porque nuestro Padre celestial sabe lo que necesitamos.'
    ] }
  ],
  // Situaciones: r = número del remedio
  situaciones: [
    { t: 'Lucas jugó al fútbol bajo el calor y casi no tomó nada en todo el día.', p: '¿Qué remedio le faltó?', r: 1 },
    { t: 'A Ana le duele la cabeza: hoy solo tomó gaseosa y jugo en caja.', p: '¿Qué remedio le hace falta?', r: 1 },
    { t: 'Tomás se quedó con el celular hasta la medianoche y hoy se duerme en clase.', p: '¿Qué remedio le faltó?', r: 2 },
    { t: 'La familia de Sofía deja sus tareas el sábado para adorar a Dios y pasar tiempo juntos.', p: '¿Qué remedio practican?', r: 2 },
    { t: 'Mateo pasa toda la tarde sentado mirando videos.', p: '¿Qué remedio le hace falta?', r: 3 },
    { t: 'Clara sale a caminar con su papá todos los días después de la escuela.', p: '¿Qué remedio practica?', r: 3 },
    { t: 'Pedro casi no sale de su casa: está pálido y desanimado.', p: '¿Qué remedio le hace falta?', r: 4 },
    { t: 'Cada mañana, la abuela se sienta un rato al sol en el patio.', p: '¿Qué remedio practica?', r: 4 },
    { t: 'En el cuarto de Juan las ventanas están siempre cerradas y el aire está pesado.', p: '¿Qué remedio le hace falta?', r: 5 },
    { t: 'Antes de dormir, Lucía abre la ventana para que entre aire fresco.', p: '¿Qué remedio practica?', r: 5 },
    { t: 'Nico almuerza papas fritas y golosinas casi todos los días.', p: '¿Qué remedio le hace falta?', r: 6 },
    { t: 'En la merienda, Valentina elige una fruta en vez de galletitas.', p: '¿Qué remedio practica?', r: 6 },
    { t: 'Diego comió tanto helado que le dolió la panza.', p: '¿Qué remedio le faltó?', r: 7 },
    { t: 'Martina dice que no al cigarrillo y al alcohol porque dañan el cuerpo.', p: '¿Qué remedio practica?', r: 7 },
    { t: 'Emma está tan preocupada por un examen que no puede dormir.', p: '¿Qué remedio le ayudaría?', r: 8 },
    { t: 'Antes de empezar el día, Joaquín ora y le entrega sus preocupaciones a Dios.', p: '¿Qué remedio practica?', r: 8 }
  ],
  falsos: [
    { img: 'img/remedios/trampas/t-01.webp', nombre: 'Comida chatarra', icono: '🍟' },
    { img: 'img/remedios/trampas/t-02.webp', nombre: 'Desvelarse', icono: '🌙' },
    { img: 'img/remedios/trampas/t-03.webp', nombre: 'Mucha azúcar y refrescos', icono: '🥤' },
    { img: 'img/remedios/trampas/t-04.webp', nombre: 'Pantallas todo el día', icono: '📱' },
    { img: 'img/remedios/trampas/t-05.webp', nombre: 'Quedarse sentado todo el día', icono: '🛋️' },
    { img: 'img/remedios/trampas/t-06.webp', nombre: 'Preocuparse por todo', icono: '😟' },
    { img: 'img/remedios/trampas/t-07.webp', nombre: 'Saltear el desayuno', icono: '🍽️' },
    { img: 'img/remedios/trampas/t-08.webp', nombre: 'Encerrarse sin ver el sol', icono: '🚪' },
    { img: 'img/remedios/trampas/t-09.webp', nombre: 'Ventanas siempre cerradas', icono: '🪟' },
    { img: 'img/remedios/trampas/t-10.webp', nombre: 'Comer a cualquier hora', icono: '🍩' },
    { img: 'img/remedios/trampas/t-11.webp', nombre: 'Enojarse por todo', icono: '😠' },
    { img: 'img/remedios/trampas/t-12.webp', nombre: 'Dormir con el celular', icono: '📲' }
  ]
};
