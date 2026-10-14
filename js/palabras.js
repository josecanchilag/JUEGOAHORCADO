/* =========================================================
   EL AHORCADO – CAPITALES DE COLOMBIA
   palabras.js – Banco de datos de las 32 capitales
   Cada objeto: { capital (MAYÚSCULAS con tildes), departamento, region }
   El nivel NO se guarda a mano: se calcula por la cantidad de letras
   de la capital sin contar los espacios.
   ========================================================= */

(function () {
  'use strict';

  /** Regiones válidas del juego. */
  const REGIONES = ['andina', 'caribe', 'pacifica', 'orinoquia', 'amazonia', 'insular', 'todo'];

  /** Banco completo de capitales (32). */
  const CAPITALES = [
    { capital: 'LETICIA', departamento: 'Amazonas', region: 'amazonia' },
    { capital: 'MEDELLÍN', departamento: 'Antioquia', region: 'andina' },
    { capital: 'ARAUCA', departamento: 'Arauca', region: 'orinoquia' },
    { capital: 'BARRANQUILLA', departamento: 'Atlántico', region: 'caribe' },
    { capital: 'CARTAGENA', departamento: 'Bolívar', region: 'caribe' },
    { capital: 'TUNJA', departamento: 'Boyacá', region: 'andina' },
    { capital: 'MANIZALES', departamento: 'Caldas', region: 'andina' },
    { capital: 'FLORENCIA', departamento: 'Caquetá', region: 'amazonia' },
    { capital: 'YOPAL', departamento: 'Casanare', region: 'orinoquia' },
    { capital: 'POPAYÁN', departamento: 'Cauca', region: 'andina' },
    { capital: 'VALLEDUPAR', departamento: 'Cesar', region: 'caribe' },
    { capital: 'QUIBDÓ', departamento: 'Chocó', region: 'pacifica' },
    { capital: 'MONTERÍA', departamento: 'Córdoba', region: 'caribe' },
    { capital: 'BOGOTÁ', departamento: 'Cundinamarca', region: 'andina' },
    { capital: 'INÍRIDA', departamento: 'Guainía', region: 'amazonia' },
    { capital: 'SAN JOSÉ DEL GUAVIARE', departamento: 'Guaviare', region: 'amazonia' },
    { capital: 'NEIVA', departamento: 'Huila', region: 'andina' },
    { capital: 'RIOHACHA', departamento: 'La Guajira', region: 'caribe' },
    { capital: 'SANTA MARTA', departamento: 'Magdalena', region: 'caribe' },
    { capital: 'VILLAVICENCIO', departamento: 'Meta', region: 'orinoquia' },
    { capital: 'PASTO', departamento: 'Nariño', region: 'andina' },
    { capital: 'CÚCUTA', departamento: 'Norte de Santander', region: 'andina' },
    { capital: 'MOCOA', departamento: 'Putumayo', region: 'amazonia' },
    { capital: 'ARMENIA', departamento: 'Quindío', region: 'andina' },
    { capital: 'PEREIRA', departamento: 'Risaralda', region: 'andina' },
    { capital: 'SAN ANDRÉS', departamento: 'San Andrés y Providencia', region: 'insular' },
    { capital: 'BUCARAMANGA', departamento: 'Santander', region: 'andina' },
    { capital: 'SINCELEJO', departamento: 'Sucre', region: 'caribe' },
    { capital: 'IBAGUÉ', departamento: 'Tolima', region: 'andina' },
    { capital: 'CALI', departamento: 'Valle del Cauca', region: 'pacifica' },
    { capital: 'MITÚ', departamento: 'Vaupés', region: 'amazonia' },
    { capital: 'PUERTO CARREÑO', departamento: 'Vichada', region: 'orinoquia' }
  ];

  /** Rango de letras que define cada nivel (sin contar espacios). */
  const RANGOS_NIVEL = {
    facil: { minimo: 4, maximo: 6 },
    medio: { minimo: 7, maximo: 9 },
    dificil: { minimo: 10, maximo: Infinity }
  };

  /**
   * Cuenta las letras de un texto ignorando los espacios
   * (los espacios NO cuentan como letra por adivinar).
   * @param {string} texto - Capital en mayúsculas.
   * @returns {number} Cantidad de letras.
   */
  function contarLetras(texto) {
    return texto.replace(/\s/g, '').length;
  }

  /**
   * Filtra las capitales por región y por cantidad de letras (nivel).
   * @param {string} region - andina|caribe|pacifica|orinoquia|amazonia|insular|todo
   * @param {string} nivel - facil|medio|dificil
   * @returns {Array<Object>} Lista de capitales candidatas.
   */
  function filtrarCapitales(region, nivel) {
    const rango = RANGOS_NIVEL[nivel];
    if (!rango) return [];

    return CAPITALES.filter(function (capital) {
      const coincideRegion = region === 'todo' || capital.region === region;
      const letras = contarLetras(capital.capital);
      return coincideRegion && letras >= rango.minimo && letras <= rango.maximo;
    });
  }

  /**
   * Elige una capital al azar según la región y el nivel solicitados.
   * Si la combinación no tiene capitales, devuelve null (la interfaz
   * muestra un mensaje amable en lugar de fallar).
   * @param {string} region - Región elegida por el jugador.
   * @param {string} nivel - Nivel elegido por el jugador.
   * @returns {Object|null} Objeto { capital, departamento, region } o null.
   */
  function obtenerCapital(region, nivel) {
    const candidatas = filtrarCapitales(region, nivel);
    if (candidatas.length === 0) return null;
    const posicion = Math.floor(Math.random() * candidatas.length);
    return candidatas[posicion];
  }

  /**
   * Verificación por código de la distribución por nivel.
   * Debe dar: 12 Fácil, 13 Medio, 7 Difícil.
   * @returns {Object} { facil, medio, dificil, total }
   */
  function verificarDistribucion() {
    const conteo = { facil: 0, medio: 0, dificil: 0 };
    CAPITALES.forEach(function (capital) {
      const letras = contarLetras(capital.capital);
      if (letras <= 6) conteo.facil += 1;
      else if (letras <= 9) conteo.medio += 1;
      else conteo.dificil += 1;
    });
    conteo.total = CAPITALES.length;
    return conteo;
  }

  // Exposición del módulo (carga clásica, sin bundler)
  window.Palabras = {
    CAPITALES: CAPITALES,
    REGIONES: REGIONES,
    contarLetras: contarLetras,
    filtrarCapitales: filtrarCapitales,
    obtenerCapital: obtenerCapital,
    verificarDistribucion: verificarDistribucion
  };
})();
