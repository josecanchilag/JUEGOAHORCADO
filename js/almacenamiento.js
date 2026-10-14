/* =========================================================
   EL AHORCADO – CAPITALES DE COLOMBIA
   almacenamiento.js – Lectura y escritura en localStorage
   Claves: "ahorcado_stats" (estadísticas y ranking)
           "ahorcado_config" (preferencias: sonido, tema, accesibilidad)
   ========================================================= */

(function () {
  'use strict';

  const CLAVE_ESTADISTICAS = 'ahorcado_stats';
  const CLAVE_CONFIGURACION = 'ahorcado_config';
  const LIMITE_RANKING = 10; // se guardan los 10 mejores; la página muestra el top 5

  /** Estadísticas vacías (valores por defecto). */
  function estadisticasVacias() {
    return {
      jugadas: 0,
      ganadas: 0,
      perdidas: 0,
      rachaActual: 0,
      mejorRacha: 0,
      ranking: []
    };
  }

  /**
   * Lee y valida el JSON guardado en localStorage.
   * @param {string} clave - Clave a leer.
   * @param {Object} porDefecto - Valor si no hay nada o si está corrupto.
   * @returns {Object}
   */
  function leerJSON(clave, porDefecto) {
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) return porDefecto;
      const dato = JSON.parse(crudo);
      return dato && typeof dato === 'object' ? dato : porDefecto;
    } catch (error) {
      // Algo corrupto en la clave: se usa el valor por defecto sin romper
      return porDefecto;
    }
  }

  /**
   * Escribe un objeto en localStorage de forma segura.
   * @param {string} clave - Clave a escribir.
   * @param {Object} dato - Objeto a guardar.
   * @returns {boolean} true si se guardó bien.
   */
  function escribirJSON(clave, dato) {
    try {
      localStorage.setItem(clave, JSON.stringify(dato));
      return true;
    } catch (error) {
      // Navegador en modo privado o sin espacio: el juego sigue funcionando
      return false;
    }
  }

  /**
   * Lee las estadísticas acumuladas (CP-11: se conservan al recargar).
   * @returns {{jugadas, ganadas, perdidas, rachaActual, mejorRacha, ranking}}
   */
  function leerEstadisticas() {
    const guardadas = leerJSON(CLAVE_ESTADISTICAS, estadisticasVacias());
    return {
      jugadas: Number(guardadas.jugadas) || 0,
      ganadas: Number(guardadas.ganadas) || 0,
      perdidas: Number(guardadas.perdidas) || 0,
      rachaActual: Number(guardadas.rachaActual) || 0,
      mejorRacha: Number(guardadas.mejorRacha) || 0,
      ranking: Array.isArray(guardadas.ranking) ? guardadas.ranking : []
    };
  }

  /**
   * Guarda el resultado de una partida: actualiza contadores, rachas
   * y el ranking de puntajes (RF-10/CP-06).
   * @param {{gano: boolean, puntaje: number, nombre: string}} resultado
   * @returns {Object} Estadísticas actualizadas.
   */
  function guardarEstadisticas(resultado) {
    const estadisticas = leerEstadisticas();

    estadisticas.jugadas += 1;

    if (resultado.gano) {
      estadisticas.ganadas += 1;
      estadisticas.rachaActual += 1;
      if (estadisticas.rachaActual > estadisticas.mejorRacha) {
        estadisticas.mejorRacha = estadisticas.rachaActual;
      }
    } else {
      estadisticas.perdidas += 1;
      estadisticas.rachaActual = 0;
    }

    // Ranking: solo partidas con puntaje positivo interesan
    if (resultado.puntaje > 0) {
      estadisticas.ranking.push({
        nombre: resultado.nombre || 'Jugador',
        puntaje: resultado.puntaje,
        fecha: new Date().toISOString()
      });
      // Ordena de mayor a menor y conserva los mejores
      estadisticas.ranking.sort(function (a, b) { return b.puntaje - a.puntaje; });
      estadisticas.ranking = estadisticas.ranking.slice(0, LIMITE_RANKING);
    }

    escribirJSON(CLAVE_ESTADISTICAS, estadisticas);
    return estadisticas;
  }

  /** Borra todas las estadísticas y el ranking (botón de la página de estadísticas). */
  function reiniciarEstadisticas() {
    try {
      localStorage.removeItem(CLAVE_ESTADISTICAS);
    } catch (error) {
      // Sin localStorage disponible: no hay nada que borrar
    }
  }

  /**
   * Lee las preferencias guardadas (sonido, tema, accesibilidad).
   * @returns {{sonido: boolean, tema: string, altoContraste: boolean, leerVoz: boolean, factorTexto: number}}
   */
  function leerConfiguracion() {
    const guardada = leerJSON(CLAVE_CONFIGURACION, {});
    return {
      sonido: guardada.sonido !== false,             // activado por defecto
      tema: guardada.tema === 'oscuro' ? 'oscuro' : 'claro',
      altoContraste: guardada.altoContraste === true,
      leerVoz: guardada.leerVoz === true,
      factorTexto: Number(guardada.factorTexto) || 1
    };
  }

  /** Guarda las preferencias del jugador. @param {Object} configuracion */
  function guardarConfiguracion(configuracion) {
    escribirJSON(CLAVE_CONFIGURACION, configuracion);
  }

  // Exposición del módulo
  window.Almacenamiento = {
    CLAVE_ESTADISTICAS: CLAVE_ESTADISTICAS,
    CLAVE_CONFIGURACION: CLAVE_CONFIGURACION,
    leerEstadisticas: leerEstadisticas,
    guardarEstadisticas: guardarEstadisticas,
    reiniciarEstadisticas: reiniciarEstadisticas,
    leerConfiguracion: leerConfiguracion,
    guardarConfiguracion: guardarConfiguracion
  };
})();
