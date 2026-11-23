// La estatua de Daniel 2 (RV1960). El pecho y los brazos son una sola pieza (plata). Ricardo: cotejá los textos con tu Biblia antes de publicar.
window.DATOS_DANIEL = {
  partes: [
    { id: 'cabeza', cita: 'Daniel 2:37-38', parte: 'La cabeza', metal: 'Oro', color: 'oro', imperio: 'Babilonia',
      detalle: 'Representa al Imperio babilónico, con el rey Nabucodonosor como cabeza' },
    { id: 'pecho', cita: 'Daniel 2:39', parte: 'El pecho y los brazos', metal: 'Plata', color: 'plata', imperio: 'Medo-Persia',
      detalle: 'Simbolizan al Imperio medo-persa' },
    { id: 'vientre', cita: 'Daniel 2:39', parte: 'El vientre y los muslos', metal: 'Bronce', color: 'bronce', imperio: 'Grecia',
      detalle: 'Corresponden al Imperio griego' },
    { id: 'piernas', cita: 'Daniel 2:40', parte: 'Las piernas', metal: 'Hierro', color: 'hierro', imperio: 'Roma',
      detalle: 'Representan al Imperio romano' },
    { id: 'pies', cita: 'Daniel 2:41-43', parte: 'Los pies', metal: 'Hierro y barro', color: 'barro', imperio: 'Los reinos divididos',
      detalle: 'Simbolizan la división o fragmentación de los reinos posteriores' }
  ],
  // Imagen de la estatua recortada en piezas (www/img/daniel/). Posiciones en % del cuadro de la estatua.
  // "capa": dónde va la imagen de la pieza; "zona": dónde se suelta al arrastrar.
  imagen: {
    proporcion: 580 / 1276,
    capas: {
      cabeza: { x: 24.14, y: 1.8, w: 52.76, h: 20.61 },
      pecho: { x: 6.21, y: 20.22, w: 88.1, h: 36.99 },
      vientre: { x: 21.9, y: 36.83, w: 56.55, h: 30.72 },
      piernas: { x: 23.79, y: 67.55, w: 52.93, h: 22.18 },
      pies: { x: 12.41, y: 89.73, w: 71.72, h: 9.33 }
    },
    zonas: {
      cabeza: { x: 28, y: 2, w: 44, h: 18.5 },
      pecho: { x: 6, y: 20.5, w: 88, h: 16 },
      vientre: { x: 22, y: 37, w: 56, h: 30.5 },
      piernas: { x: 22, y: 67.5, w: 56, h: 22 },
      pies: { x: 12, y: 89.6, w: 76, h: 10 }
    }
  },
  // Versículos cortos (completos, RV1960) que aparecen al azar cuando se destruye la estatua
  versiculosFinal: [
    { texto: 'Él revela lo profundo y lo escondido; conoce lo que está en tinieblas, y con él mora la luz.', cita: 'Daniel 2:22' },
    { texto: '¡Cuán grandes son sus señales, y cuán potentes sus maravillas! Su reino, reino sempiterno, y su señorío de generación en generación.', cita: 'Daniel 4:3' },
    { texto: 'Tu reino es reino de todos los siglos, y tu señorío en todas las generaciones.', cita: 'Salmos 145:13' },
    { texto: 'Jehová estableció en los cielos su trono, y su reino domina sobre todos.', cita: 'Salmos 103:19' },
    { texto: 'y reinará sobre la casa de Jacob para siempre, y su reino no tendrá fin.', cita: 'Lucas 1:33' }
  ],
  texto: {
    descripcion: 'La cabeza de esta imagen era de oro fino; su pecho y sus brazos, de plata; su vientre y sus muslos, de bronce; sus piernas, de hierro; sus pies, en parte de hierro y en parte de barro cocido.',
    citaDescripcion: 'Daniel 2:32-33',
    reino: 'El Dios del cielo levantará un reino que no será jamás destruido',
    citaReino: 'Daniel 2:44'
  }
};
