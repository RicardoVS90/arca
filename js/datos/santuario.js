// El santuario del desierto (Éxodo 25–30, 40).
// "jesus": frase corta de cómo apunta a Jesús. BORRADOR: Ricardo, revisalas y reescribilas a tu gusto
// (podés contrastarlas con la IA de la iglesia: https://ia.adventistas.org/).
// Posición en el plano: x, y en porcentaje. El plano tiene la entrada abajo (este) y el Lugar Santísimo arriba (oeste).
window.DATOS_SANTUARIO = {
  lugares: { atrio: 'Atrio', santo: 'Lugar Santo', santisimo: 'Lugar Santísimo' },
  muebles: [
    { id: 'altar', icono: '🔥', nombre: 'Altar del holocausto', lugar: 'atrio', paso: 1, x: 50, y: 80,
      jesus: '“He aquí el Cordero de Dios” — Juan 1:29' },
    { id: 'fuente', icono: '💧', nombre: 'Fuente de bronce', lugar: 'atrio', paso: 2, x: 50, y: 65,
      jesus: 'Jesús nos limpia de todo pecado — 1 Juan 1:9' },
    { id: 'candelero', icono: '🕎', nombre: 'Candelero de oro', lugar: 'santo', paso: 3, x: 39, y: 41,
      jesus: '“Yo soy la luz del mundo” — Juan 8:12' },
    { id: 'mesa', icono: '🍞', nombre: 'Mesa de los panes', lugar: 'santo', paso: 3, x: 61, y: 41,
      jesus: '“Yo soy el pan de vida” — Juan 6:35' },
    { id: 'incienso', icono: '♨️', nombre: 'Altar del incienso', lugar: 'santo', paso: 3, x: 50, y: 33.5,
      jesus: 'Jesús intercede por nosotros — Hebreos 7:25' },
    { id: 'arca', icono: '📦', nombre: 'Arca del pacto', lugar: 'santisimo', paso: 4, x: 50, y: 21.5,
      jesus: 'Jesús es nuestro Sumo Sacerdote — Hebreos 4:14-16' }
  ]
};
