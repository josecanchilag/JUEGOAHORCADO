/* =========================================================
   EL AHORCADO – CAPITALES DE COLOMBIA
   juego.js – Lógica del juego: estado, selección de capital,
   validación de letras, verificación de victoria/derrota y pistas.
   ========================================================= */

(function () {
  'use strict';

  /** Configuración de cada nivel (letras, pistas, tiempo y multiplicador). */
  const CONFIG_NIVELES = {
    facil: { nombre: 'Fácil', minimo: 4, maximo: 6, pistas: 2, multiplicador: 1, tiempo: null },
    medio: { nombre: 'Medio', minimo: 7, maximo: 9, pistas: 1, multiplicador: 2, tiempo: null },
    dificil: { nombre: 'Difícil', minimo: 10, maximo: Infinity, pistas: 0, multiplicador: 3, tiempo: 90 }
  };

  const MAX_ERRORES = 6;
  const PUNTOS_LETRA_OK = 10;
  const PUNTOS_LETRA_MAL = -5;
  const PUNTOS_VICTORIA = 50;
  const PUNTOS_POR_VIDA = 10;
  const PUNTOS_PISTA = -15;

  /** Nombres legibles de las regiones (para mensajes y resultados). */
  const NOMBRES_REGION = {
    andina: 'Andina',
    caribe: 'Caribe',
    pacifica: 'Pacífica',
    orinoquia: 'Orinoquía',
    amazonia: 'Amazonía',
    insular: 'Insular',
    todo: 'Todo el país'
  };

  /** Objeto con el estado completo de la partida. */
  const estado = {
    jugador: '',
    region: '',
    nivel: '',
    palabra: '',
    departamento: '',
    regionCapital: '',
    letrasAcertadas: [],
    letrasFalladas: [],
    errores: 0,
    maxErrores: MAX_ERRORES,
    pistasDisponibles: 0,
    pistasUsadas: 0,
    puntaje: 0,
    multiplicador: 1,
    tiempoRestante: null, // solo en nivel Difícil (90 s)
    terminado: false,
    gano: false
  };

  /** Devuelve el estado a sus valores iniciales. */
  function reiniciarEstado() {
    estado.jugador = '';
    estado.region = '';
    estado.nivel = '';
    estado.palabra = '';
    estado.departamento = '';
    estado.regionCapital = '';
    estado.letrasAcertadas = [];
    estado.letrasFalladas = [];
    estado.errores = 0;
    estado.maxErrores = MAX_ERRORES;
    estado.pistasDisponibles = 0;
    estado.pistasUsadas = 0;
    estado.puntaje = 0;
    estado.multiplicador = 1;
    estado.tiempoRestante = null;
    estado.terminado = false;
    estado.gano = false;
  }

  /**
   * Normaliza un texto: pasa a minúsculas y quita las tildes,
   * pero conserva la Ñ como letra propia (NO se convierte en N).
   * Ejemplos: "Ó" -> "o", "Á" -> "a", "Ñ" -> "ñ".
   * @param {string} texto - Texto a normalizar.
   * @returns {string} Texto normalizado en minúsculas.
   */
  function normalizar(texto) {
    if (typeof texto !== 'string') return '';
    return texto
      .toLowerCase()
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ü/g, 'u');
  }

  /**
   * Inicia una partida nueva con la región y el nivel elegidos.
   * @param {string} region - andina|caribe|pacifica|orinoquia|amazonia|insular|todo
   * @param {string} nivel - facil|medio|dificil
   * @param {string} nombre - Nombre del jugador.
   * @returns {{ok: boolean, mensaje?: string, capital?: Object}}
   */
  function iniciarPartida(region, nivel, nombre) {
    reiniciarEstado();

    const configuracion = CONFIG_NIVELES[nivel];
    if (!configuracion) {
      return { ok: false, mensaje: 'El nivel elegido no es válido.' };
    }

    const capital = window.Palabras.obtenerCapital(region, nivel);
    if (!capital) {
      // Combinación sin capitales: mensaje amable en vez de fallar
      const nombreRegion = NOMBRES_REGION[region] || 'esa región';
      return {
        ok: false,
        mensaje: 'En ' + nombreRegion + ' no hay capitales de nivel ' + configuracion.nombre +
          '. Prueba con otro nivel (por ejemplo Medio) o elige "Todo el país".'
      };
    }

    estado.jugador = (nombre || '').trim() || 'Jugador';
    estado.region = region;
    estado.nivel = nivel;
    estado.palabra = capital.capital;
    estado.departamento = capital.departamento;
    estado.regionCapital = capital.region;
    estado.pistasDisponibles = configuracion.pistas;
    estado.multiplicador = configuracion.multiplicador;
    estado.tiempoRestante = configuracion.tiempo; // 90 en Difícil, null en los demás

    return { ok: true, capital: capital };
  }

  /**
   * Cuenta las letras únicas (sin espacios) de la palabra actual.
   * @returns {number}
   */
  function contarLetrasUnicas() {
    const vistas = {};
    let total = 0;
    for (const caracter of estado.palabra) {
      if (caracter === ' ') continue;
      const clave = normalizar(caracter);
      if (!vistas[clave]) {
        vistas[clave] = true;
        total += 1;
      }
    }
    return total;
  }

  /**
   * Valida y procesa una letra elegida por el jugador.
   * @param {string} letra - Letra elegida (con o sin tilde, mayúscula o minúscula).
   * @returns {{resultado: string, apariciones?: number, puntos?: number}}
   *   resultado: "acerto" | "error" | "yaUsada" | "invalida" | "terminado"
   */
  function procesarLetra(letra) {
    if (estado.terminado) return { resultado: 'terminado' };

    const normalizada = normalizar(String(letra || '').trim());
    if (normalizada.length !== 1 || !/^[a-zñ]$/.test(normalizada)) {
      return { resultado: 'invalida' };
    }

    const yaAcertada = estado.letrasAcertadas.includes(normalizada);
    const yaFallada = estado.letrasFalladas.includes(normalizada);
    if (yaAcertada || yaFallada) {
      return { resultado: 'yaUsada' };
    }

    // Busca TODAS las posiciones de la letra en la palabra
    let apariciones = 0;
    for (const caracter of estado.palabra) {
      if (caracter === ' ') continue;
      if (normalizar(caracter) === normalizada) apariciones += 1;
    }

    if (apariciones > 0) {
      // Letra correcta: se revela en todas sus posiciones
      estado.letrasAcertadas.push(normalizada);
      const puntos = PUNTOS_LETRA_OK * apariciones;
      estado.puntaje += puntos;
      return { resultado: 'acerto', apariciones: apariciones, puntos: puntos };
    }

    // Letra incorrecta: resta puntos y suma un error
    estado.letrasFalladas.push(normalizada);
    estado.errores += 1;
    estado.puntaje += PUNTOS_LETRA_MAL;
    return { resultado: 'error', apariciones: 0, puntos: PUNTOS_LETRA_MAL };
  }

  /**
   * Verifica si la partida terminó: victoria (descubrió la palabra)
   * o derrota (6 errores). Devuelve el resultado para la interfaz.
   * @returns {{terminado: boolean, gano: boolean, motivo?: string}}
   */
  function verificarEstado() {
    if (estado.terminado) {
      return { terminado: true, gano: estado.gano, motivo: estado.motivo };
    }

    // ¿Descubrió todas las letras únicas de la palabra?
    const letrasNecesarias = contarLetrasUnicas();
    const gano = letrasNecesarias > 0 && estado.letrasAcertadas.length >= letrasNecesarias;
    const sinVidas = estado.errores >= estado.maxErrores;

    if (!gano && !sinVidas) {
      return { terminado: false, gano: false };
    }

    estado.terminado = true;
    estado.gano = gano;
    estado.motivo = gano ? 'victoria' : 'errores';

    // Bono de victoria: +50 + (vidas restantes × 10)
    if (gano) {
      const vidasRestantes = estado.maxErrores - estado.errores;
      estado.puntaje += PUNTOS_VICTORIA + vidasRestantes * PUNTOS_POR_VIDA;
    }

    return { terminado: true, gano: gano, motivo: estado.motivo };
  }

  // Exposición del módulo
  window.Juego = {
    estado: estado,
    CONFIG_NIVELES: CONFIG_NIVELES,
    NOMBRES_REGION: NOMBRES_REGION,
    reiniciarEstado: reiniciarEstado,
    iniciarPartida: iniciarPartida,
    normalizar: normalizar,
    procesarLetra: procesarLetra,
    verificarEstado: verificarEstado,
    contarLetrasUnicas: contarLetrasUnicas
  };
})();
