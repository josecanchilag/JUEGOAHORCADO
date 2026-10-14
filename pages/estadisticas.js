/* =========================================================
   EL AHORCADO – CAPITALES DE COLOMBIA
   pages/estadisticas.js – Pinta las tarjetas de estadísticas
   y el ranking top 5 desde localStorage.
   ========================================================= */

(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };

  /** Formatea la fecha ISO del ranking en texto corto (es-ES). */
  function formatearFecha(iso) {
    try {
      return new Date(iso).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (error) {
      return '—';
    }
  }

  /** Pinta las tarjetas del resumen de partidas. */
  function pintarResumen(estadisticas) {
    $('stat-jugadas').textContent = estadisticas.jugadas;
    $('stat-ganadas').textContent = estadisticas.ganadas;
    $('stat-perdidas').textContent = estadisticas.perdidas;

    const porcentaje = estadisticas.jugadas > 0
      ? Math.round((estadisticas.ganadas / estadisticas.jugadas) * 100)
      : 0;
    $('stat-porcentaje').textContent = porcentaje + '%';
    $('stat-racha').textContent = estadisticas.rachaActual;
    $('stat-mejor-racha').textContent = estadisticas.mejorRacha;
  }

  /** Pinta la tabla con el top 5 de puntajes. */
  function pintarRanking(estadisticas) {
    const cuerpo = $('cuerpo-ranking');
    cuerpo.innerHTML = '';

    const top = estadisticas.ranking.slice(0, 5);

    if (top.length === 0) {
      const fila = document.createElement('tr');
      fila.innerHTML = '<td colspan="4" class="tabla__vacia">Aún no hay partidas registradas.</td>';
      cuerpo.appendChild(fila);
      return;
    }

    top.forEach(function (entrada, indice) {
      const fila = document.createElement('tr');
      const posicion = document.createElement('td');
      const nombre = document.createElement('td');
      const puntaje = document.createElement('td');
      const fecha = document.createElement('td');

      posicion.textContent = ['🥇', '🥈', '🥉'][indice] || String(indice + 1);
      nombre.textContent = entrada.nombre;
      puntaje.textContent = String(entrada.puntaje);
      fecha.textContent = formatearFecha(entrada.fecha);

      fila.appendChild(posicion);
      fila.appendChild(nombre);
      fila.appendChild(puntaje);
      fila.appendChild(fecha);
      cuerpo.appendChild(fila);
    });
  }

  /** Dibuja toda la página con los datos guardados. */
  function pintarPagina() {
    const estadisticas = window.Almacenamiento.leerEstadisticas();
    pintarResumen(estadisticas);
    pintarRanking(estadisticas);
  }

  function iniciar() {
    pintarPagina();

    // Reiniciar estadísticas con confirmación (no se borra por accidente)
    $('boton-reiniciar-stats').addEventListener('click', function () {
      const confirmar = window.confirm('¿Seguro que quieres borrar todas tus estadísticas y el ranking?');
      if (!confirmar) return;
      window.Almacenamiento.reiniciarEstadisticas();
      pintarPagina();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
