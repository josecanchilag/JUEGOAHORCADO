/* =========================================================
   EL AHORCADO – CAPITALES DE COLOMBIA
   accesibilidad.js – Panel de accesibilidad: alto contraste,
   tamaño de texto, lectura en voz alta (Web Speech API) y
   vibración como equivalente auditivo de los sonidos.
   Cumple RNF-05. Las preferencias se guardan en "ahorcado_config".
   ========================================================= */

(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };

  const FACTOR_MINIMO = 0.85;
  const FACTOR_MAXIMO = 1.5;
  const PASO_FACTOR = 0.1;

  /**
   * Lee la preferencia actual desde app.js.
   * @returns {Object|null}
   */
  function preferencias() {
    if (window.App && window.App.obtenerPreferencias) {
      return window.App.obtenerPreferencias();
    }
    return null;
  }

  /**
   * Lee un texto en voz alta si el jugador lo activó (Web Speech API).
   * Si el navegador no lo soporta, no hace nada: la información
   * siempre está disponible en pantalla (aria-live).
   * @param {string} texto - Texto a leer.
   */
  function hablar(texto) {
    const config = preferencias();
    if (!config || !config.leerVoz) return;
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') return;
    if (!texto) return;

    try {
      window.speechSynthesis.cancel();
      const mensaje = new window.SpeechSynthesisUtterance(texto);
      mensaje.lang = 'es-CO';
      mensaje.rate = 1.05;
      window.speechSynthesis.speak(mensaje);
    } catch (error) {
      // Sin voz disponible: el anuncio en pantalla sigue funcionando
    }
  }

  /**
   * Vibración del celular como equivalente táctil de los sonidos
   * (discapacidad auditiva). Solo en dispositivos que la soporten.
   * @param {string} tipo - acierto|error|victoria
   */
  function vibrar(tipo) {
    if (!navigator.vibrate) return;
    try {
      if (tipo === 'acierto') navigator.vibrate(30);
      else if (tipo === 'error') navigator.vibrate(70);
      else if (tipo === 'victoria') navigator.vibrate([80, 40, 80, 40, 120]);
      else if (tipo === 'derrota') navigator.vibrate([150, 80, 150]);
    } catch (error) {
      // Vibración no disponible: se ignora
    }
  }

  /** Abre el panel de accesibilidad. */
  function abrirPanel() {
    const panel = $('panel-accesibilidad');
    const boton = $('boton-accesibilidad');
    if (!panel) return;
    panel.hidden = false;
    if (boton) boton.setAttribute('aria-expanded', 'true');
    const primerControl = panel.querySelector('button, input');
    if (primerControl) primerControl.focus();
  }

  /** Cierra el panel y devuelve el foco al botón que lo abrió. */
  function cerrarPanel() {
    const panel = $('panel-accesibilidad');
    const boton = $('boton-accesibilidad');
    if (!panel) return;
    panel.hidden = true;
    if (boton) {
      boton.setAttribute('aria-expanded', 'false');
      boton.focus();
    }
  }

  /** Cambia el tamaño del texto (A+ / A−) y lo guarda. */
  function cambiarTamanoTexto(paso) {
    const config = preferencias();
    if (!config) return;

    const nuevo = Math.round((config.factorTexto + paso) * 100) / 100;
    config.factorTexto = Math.min(FACTOR_MAXIMO, Math.max(FACTOR_MINIMO, nuevo));

    if (window.App) {
      window.App.guardarPreferencias();
      window.App.aplicarPreferencias();
    }

    const porcentaje = Math.round(config.factorTexto * 100) + '%';
    if (window.App) window.App.anunciar('Tamaño del texto: ' + porcentaje);
  }

  /** Conecta todos los controles del panel. */
  function conectarControles() {
    const contraste = $('opcion-contraste');
    const voz = $('opcion-voz');
    const botonAbrir = $('boton-accesibilidad');
    const botonCerrar = $('cerrar-accesibilidad');
    const botonMas = $('texto-mas');
    const botonMenos = $('texto-menos');

    if (botonAbrir) botonAbrir.addEventListener('click', abrirPanel);
    if (botonCerrar) botonCerrar.addEventListener('click', cerrarPanel);

    // Esc cierra el panel (navegación por teclado)
    document.addEventListener('keydown', function (evento) {
      const panel = $('panel-accesibilidad');
      if (evento.key === 'Escape' && panel && !panel.hidden) cerrarPanel();
    });

    if (contraste) {
      contraste.addEventListener('change', function () {
        const config = preferencias();
        if (!config) return;
        config.altoContraste = contraste.checked;
        window.App.guardarPreferencias();
        window.App.aplicarPreferencias();
        window.App.mostrarSubtitulo(config.altoContraste ? '⬛ Alto contraste activado' : '⬛ Alto contraste desactivado', null);
      });
    }

    if (voz) {
      // Si el navegador no soporta speechSynthesis, se deshabilita con aviso
      const soportado = 'speechSynthesis' in window &&
        typeof window.SpeechSynthesisUtterance === 'function';
      if (!soportado) {
        voz.disabled = true;
        voz.setAttribute('aria-describedby', 'aviso-voz');
        let aviso = $('aviso-voz');
        if (!aviso) {
          aviso = document.createElement('p');
          aviso.id = 'aviso-voz';
          aviso.className = 'panel-accesibilidad__nota';
          aviso.textContent = 'Este navegador no permite leer en voz alta.';
          voz.closest('.opcion').appendChild(aviso);
        }
      }

      voz.addEventListener('change', function () {
        const config = preferencias();
        if (!config) return;
        config.leerVoz = voz.checked;
        window.App.guardarPreferencias();
        if (config.leerVoz) hablar('Lectura en voz alta activada.');
        else window.App.mostrarSubtitulo('🗣️ Lectura en voz alta desactivada', null);
      });
    }

    if (botonMas) botonMas.addEventListener('click', function () { cambiarTamanoTexto(PASO_FACTOR); });
    if (botonMenos) botonMenos.addEventListener('click', function () { cambiarTamanoTexto(-PASO_FACTOR); });
  }

  function iniciar() {
    conectarControles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  // Exposición para que app.js anuncie y vibre
  window.Accesibilidad = {
    hablar: hablar,
    vibrar: vibrar,
    abrirPanel: abrirPanel,
    cerrarPanel: cerrarPanel
  };
})();
