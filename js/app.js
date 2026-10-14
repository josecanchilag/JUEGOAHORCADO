/* =========================================================
   EL AHORCADO – CAPITALES DE COLOMBIA
   app.js – Punto de entrada: conecta el menú con la lógica
   del juego y con la interfaz.
   ========================================================= */

(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };

  /** Mensajes motivadores cortos que se rotan al jugar. */
  const FRASES_ACIERTO = ['¡Bien! 🎯', '¡Excelente! 🙌', '¡Vas muy bien! 🚀', '¡Genial! ⭐'];
  const FRASES_ERROR = ['¡Casi! Esa letra no está 😅', '¡Uy! Sigue intentando 💪', '¡No era! Aprendiste algo 🧠'];

  let temporizadorSubtitulo = null;

  /** Escribe un mensaje en el subtítulo (equivalente visual de los sonidos). */
  function mostrarSubtitulo(texto, tipo) {
    const subtitulo = $('subtitulo-aviso');
    if (!subtitulo) return;
    subtitulo.textContent = texto;
    subtitulo.className = 'subtitulo-aviso';
    if (tipo) subtitulo.classList.add('subtitulo-aviso--' + tipo);
    // Limpia el mensaje después de un momento (los persistentes usan tipo fijo)
    if (temporizadorSubtitulo) clearTimeout(temporizadorSubtitulo);
    temporizadorSubtitulo = setTimeout(function () {
      subtitulo.textContent = '';
      subtitulo.className = 'subtitulo-aviso';
    }, 2500);
  }

  /** Anuncia un texto a los lectores de pantalla (aria-live polite). */
  function anunciar(texto) {
    const zona = $('anuncios');
    if (zona) zona.textContent = texto;
  }

  /** Muestra u oculta las vistas del juego. */
  function cambiarVista(idVista) {
    document.querySelectorAll('.vista').forEach(function (vista) {
      const activa = vista.id === idVista;
      vista.classList.toggle('vista--activa', activa);
      vista.hidden = !activa;
    });
  }

  /** Actualiza los datos de la partida en pantalla (vidas, puntaje, tiempo...). */
  function actualizarTablero() {
    const estado = window.Juego.estado;

    $('dato-jugador').textContent = estado.jugador;
    $('dato-region').textContent = window.Juego.NOMBRES_REGION[estado.region];
    $('dato-nivel').textContent = window.Juego.CONFIG_NIVELES[estado.nivel].nombre;

    // Vidas: corazón lleno o perdido + texto, nunca solo color
    const vidasRestantes = estado.maxErrores - estado.errores;
    const vidas = $('dato-vidas');
    vidas.textContent = '❤️'.repeat(vidasRestantes) + '🖤'.repeat(estado.errores);
    vidas.setAttribute('aria-label', vidasRestantes + ' vidas restantes');

    // Puntaje con animación de "subida"
    const puntaje = $('dato-puntaje');
    puntaje.textContent = String(estado.puntaje);
    puntaje.style.animation = 'none';
    void puntaje.offsetWidth; // reinicia la animación
    puntaje.style.animation = 'subir-puntaje 0.3s ease';

    // Contador de errores con ícono (✓ / ✗), no solo color
    const intentos = $('intentos-texto');
    intentos.textContent = 'Errores: ' + estado.errores + '/' + estado.maxErrores +
      (estado.errores === 0 ? ' ✅' : estado.errores < 3 ? ' ⚠️' : ' ❌');
  }

  /** Procesa la letra elegida (virtual o física) y actualiza todo. */
  function manejarLetra(letra) {
    const estado = window.Juego.estado;
    if (estado.terminado) return;

    const resultado = window.Juego.procesarLetra(letra);

    if (resultado.resultado === 'yaUsada') {
      mostrarSubtitulo('Esa letra ya se usó 🙈', null);
      return;
    }
    if (resultado.resultado === 'invalida') return;

    window.UI.renderPalabra();
    window.UI.renderTeclado();
    actualizarTablero();

    if (resultado.resultado === 'acerto') {
      const frase = FRASES_ACIERTO[Math.floor(Math.random() * FRASES_ACIERTO.length)];
      mostrarSubtitulo(frase + ' Letra ' + letra.toUpperCase() + ' correcta (+' + resultado.puntos + ')', 'acierto');
      anunciar('Letra ' + letra.toUpperCase() + ' correcta. Puntaje ' + estado.puntaje +
        '. Vidas restantes: ' + (estado.maxErrores - estado.errores) + '.');
      if (window.UI.dibujarAhorcado) window.UI.dibujarAhorcado(estado.errores);
    } else {
      const frase = FRASES_ERROR[Math.floor(Math.random() * FRASES_ERROR.length)];
      mostrarSubtitulo(frase + ' (−5 puntos)', 'error');
      anunciar('Letra ' + letra.toUpperCase() + ' incorrecta. Quedan ' +
        (estado.maxErrores - estado.errores) + ' vidas.');
      if (window.UI.dibujarAhorcado) window.UI.dibujarAhorcado(estado.errores);
    }

    // ¿Terminó la partida?
    const fin = window.Juego.verificarEstado();
    if (fin.terminado && window.UI.mostrarResultado) {
      window.UI.mostrarResultado(fin.gano);
    }
  }

  /** Prepara la vista de juego con una partida recién iniciada. */
  function prepararVistaJuego() {
    $('modal-resultado').hidden = true; // por si venía de una partida anterior
    window.UI.renderPalabra();
    window.UI.renderTeclado();
    actualizarTablero();
    if (window.UI.dibujarAhorcado) window.UI.dibujarAhorcado(window.Juego.estado.errores);
    cambiarVista('vista-juego');
    anunciar('Partida iniciada. Adivina la capital. Vidas: ' +
      (window.Juego.estado.maxErrores - window.Juego.estado.errores) + '.');
  }

  /** Arranque desde el menú: valida el nombre y lanza la partida. */
  function iniciarDesdeMenu() {
    const nombre = $('campo-nombre').value.trim();
    const mensaje = $('mensaje-menu');

    if (!nombre) {
      mensaje.hidden = false;
      mensaje.textContent = '✏️ Escribe tu nombre para poder jugar.';
      $('campo-nombre').focus();
      return;
    }

    const regionSeleccionada = document.querySelector('input[name="region"]:checked');
    const nivelSeleccionado = document.querySelector('input[name="nivel"]:checked');

    const resultado = window.Juego.iniciarPartida(
      regionSeleccionada.value,
      nivelSeleccionado.value,
      nombre
    );

    if (!resultado.ok) {
      // Combinación sin capitales: mensaje amable, sin fallar
      mensaje.hidden = false;
      mensaje.textContent = '🤔 ' + resultado.mensaje;
      return;
    }

    mensaje.hidden = true;
    prepararVistaJuego();
  }

  /** Reinicia la partida con la misma región y nivel. */
  function reiniciarPartida() {
    const estado = window.Juego.estado;
    const region = estado.region;
    const nivel = estado.nivel;
    const nombre = estado.jugador;

    if (window.UI.detenerCronometro) window.UI.detenerCronometro();

    const resultado = window.Juego.iniciarPartida(region, nivel, nombre);
    if (resultado.ok) {
      mostrarSubtitulo('🔄 ¡Partida reiniciada! Nueva capital.', null);
      prepararVistaJuego();
    }
  }

  /** Configura los eventos de la página. */
  function conectarEventos() {
    // Botón Jugar del menú
    $('boton-jugar').addEventListener('click', iniciarDesdeMenu);

    // Enter dentro del campo de nombre también inicia la partida
    $('campo-nombre').addEventListener('keydown', function (evento) {
      if (evento.key === 'Enter') iniciarDesdeMenu();
    });

    // Teclado virtual: un solo manejador delegado
    $('teclado').addEventListener('click', function (evento) {
      const tecla = evento.target.closest('.teclado__tecla');
      if (!tecla || tecla.disabled) return;
      manejarLetra(tecla.dataset.letra);
    });

    // Reiniciar partida (RF-14)
    $('boton-reiniciar').addEventListener('click', reiniciarPartida);

    // Modal de resultado: jugar de nuevo
    $('boton-jugar-denuevo').addEventListener('click', function () {
      $('modal-resultado').hidden = true;
      reiniciarPartida();
    });
  }

  /** Inicialización al cargar la página. */
  function iniciarAplicacion() {
    conectarEventos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarAplicacion);
  } else {
    iniciarAplicacion();
  }

  // Exposición para pruebas y para otros módulos
  window.App = {
    manejarLetra: manejarLetra,
    cambiarVista: cambiarVista,
    anunciar: anunciar,
    mostrarSubtitulo: mostrarSubtitulo
  };
})();
