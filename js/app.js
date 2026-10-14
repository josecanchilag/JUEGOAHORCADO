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
  let intervaloTiempo = null; // cronómetro del nivel Difícil

  /** Preferencias del jugador (leídas de "ahorcado_config"). */
  let configuracion = {
    sonido: true,
    tema: 'claro',
    altoContraste: false,
    leerVoz: false,
    factorTexto: 1
  };

  let contextoAudio = null; // Web Audio API (sin archivos externos)

  /**
   * Reproduce un sonido del juego generado con Web Audio API:
   * acierto, error, victoria o derrota.
   * Si el sonido está desactivado no hace nada (la información
   * visual siempre está presente).
   * @param {string} tipo - acierto|error|victoria|derrota
   */
  function reproducirSonido(tipo) {
    if (!configuracion.sonido) return;

    try {
      const ContextoAudio = window.AudioContext || window.webkitAudioContext;
      if (!ContextoAudio) return;
      if (!contextoAudio) contextoAudio = new ContextoAudio();
      if (contextoAudio.state === 'suspended') contextoAudio.resume();

      const ahora = contextoAudio.currentTime;

      /** Emite un tono simple. */
      function tono(frecuencia, retraso, duracion, volumen, onda) {
        const oscilador = contextoAudio.createOscillator();
        const ganancia = contextoAudio.createGain();
        oscilador.type = onda || 'sine';
        oscilador.frequency.value = frecuencia;
        ganancia.gain.setValueAtTime(volumen || 0.18, ahora + retraso);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + retraso + duracion);
        oscilador.connect(ganancia);
        ganancia.connect(contextoAudio.destination);
        oscilador.start(ahora + retraso);
        oscilador.stop(ahora + retraso + duracion);
      }

      if (tipo === 'acierto') {
        tono(523.25, 0, 0.12);      // Do
        tono(659.25, 0.09, 0.15);   // Mi
      } else if (tipo === 'error') {
        tono(220, 0, 0.18, 0.15, 'square');
        tono(165, 0.12, 0.22, 0.12, 'square');
      } else if (tipo === 'victoria') {
        [523.25, 659.25, 783.99, 1046.5].forEach(function (frecuencia, i) {
          tono(frecuencia, i * 0.12, 0.2, 0.16);
        });
      } else if (tipo === 'derrota') {
        tono(330, 0, 0.2, 0.14, 'triangle');
        tono(262, 0.18, 0.3, 0.14, 'triangle');
        tono(196, 0.36, 0.4, 0.14, 'triangle');
      }
    } catch (error) {
      // Sin audio disponible: el juego continúa con el aviso visual
    }
  }

  /** Carga las preferencias guardadas y las aplica a la página. */
  function cargarPreferencias() {
    configuracion = window.Almacenamiento.leerConfiguracion();
    aplicarPreferencias();
  }

  /** Aplica tema, sonido y demás preferencias al DOM y a los controles. */
  function aplicarPreferencias() {
    document.body.dataset.tema = configuracion.tema;
    document.body.classList.toggle('alto-contraste', configuracion.altoContraste);
    document.documentElement.style.setProperty('--factor-texto', String(configuracion.factorTexto));

    const sonido = $('opcion-sonido');
    const tema = $('opcion-tema');
    const contraste = $('opcion-contraste');
    const voz = $('opcion-voz');
    if (sonido) sonido.checked = configuracion.sonido;
    if (tema) tema.checked = configuracion.tema === 'oscuro';
    if (contraste) contraste.checked = configuracion.altoContraste;
    if (voz) voz.checked = configuracion.leerVoz;
  }

  /** Guarda las preferencias actuales en localStorage. */
  function guardarPreferencias() {
    window.Almacenamiento.guardarConfiguracion(configuracion);
  }

  /** Conecta los controles del panel de accesibilidad y configuración. */
  function conectarPanelConfiguracion() {
    const sonido = $('opcion-sonido');
    const tema = $('opcion-tema');

    if (sonido) {
      sonido.addEventListener('change', function () {
        configuracion.sonido = sonido.checked;
        guardarPreferencias();
        if (configuracion.sonido) reproducirSonido('acierto');
        mostrarSubtitulo(configuracion.sonido ? '🔊 Sonido activado' : '🔇 Sonido desactivado', null);
      });
    }

    if (tema) {
      tema.addEventListener('change', function () {
        configuracion.tema = tema.checked ? 'oscuro' : 'claro';
        guardarPreferencias();
        aplicarPreferencias();
        mostrarSubtitulo(configuracion.tema === 'oscuro' ? '🌗 Tema oscuro activado' : '☀️ Tema claro activado', null);
      });
    }
  }

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
    // Lectura en voz alta si el jugador la activó (Web Speech API)
    if (window.Accesibilidad && window.Accesibilidad.hablar) {
      window.Accesibilidad.hablar(texto);
    }
  }

  /** Vibración equivalente a los sonidos (discapacidad auditiva). */
  function vibrar(tipo) {
    if (window.Accesibilidad && window.Accesibilidad.vibrar) {
      window.Accesibilidad.vibrar(tipo);
    }
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
    $('dato-nivel').textContent = window.Juego.CONFIG_NIVELES[estado.nivel].nombre +
      ' ×' + estado.multiplicador;

    // Botón de pista: contador y disponibilidad
    const botonPista = $('boton-pista');
    $('pista-contador').textContent = '(' + estado.pistasDisponibles + ')';
    botonPista.disabled = estado.pistasDisponibles <= 0 || estado.terminado;
    botonPista.setAttribute('aria-label',
      'Usar pista, quedan ' + estado.pistasDisponibles + ' pistas, cuesta 15 puntos');

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

  /** Dibuja el cronómetro en pantalla (solo corre en nivel Difícil). */
  function pintarTiempo() {
    const estado = window.Juego.estado;
    const dato = $('dato-tiempo');
    if (estado.tiempoRestante === null) {
      dato.textContent = '—';
      dato.classList.remove('agotandose');
      return;
    }
    dato.textContent = '⏳ ' + estado.tiempoRestante + ' s';
    // Aviso visual cuando quedan 10 s o menos (además de aria-live)
    dato.classList.toggle('agotandose', estado.tiempoRestante <= 10);
  }

  /** Detiene el cronómetro si está corriendo. */
  function detenerCronometro() {
    if (intervaloTiempo) {
      clearInterval(intervaloTiempo);
      intervaloTiempo = null;
    }
  }

  /** Inicia la cuenta regresiva de 90 s (solo en nivel Difícil). */
  function iniciarCronometro() {
    detenerCronometro();
    pintarTiempo();

    const estado = window.Juego.estado;
    if (estado.tiempoRestante === null) return; // Fácil/Medio no tienen límite

    // Momentos clave en los que se anuncia el tiempo restante
    const MOMENTOS_CLAVE = [60, 30, 10, 5];

    intervaloTiempo = setInterval(function () {
      if (estado.terminado) {
        detenerCronometro();
        return;
      }

      estado.tiempoRestante -= 1;
      pintarTiempo();

      if (MOMENTOS_CLAVE.includes(estado.tiempoRestante)) {
        anunciar('Quedan ' + estado.tiempoRestante + ' segundos.');
        mostrarSubtitulo('⏳ Quedan ' + estado.tiempoRestante + ' segundos', null);
      }

      if (estado.tiempoRestante <= 0) {
        detenerCronometro();
        const fin = window.Juego.verificarEstado();
        if (fin.terminado) {
          mostrarSubtitulo('⏰ ¡Se agotó el tiempo!', 'error');
          finalizarPartida(fin.gano);
        }
      }
    }, 1000);
  }

  /** Finaliza la partida: guarda estadísticas y muestra el resultado (CP-06). */
  function finalizarPartida(gano) {
    detenerCronometro();
    const estado = window.Juego.estado;
    window.Almacenamiento.guardarEstadisticas({
      gano: gano,
      puntaje: estado.puntaje,
      nombre: estado.jugador
    });
    reproducirSonido(gano ? 'victoria' : 'derrota');
    vibrar(gano ? 'victoria' : 'derrota');
    if (window.UI.mostrarResultado) window.UI.mostrarResultado(gano);
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
      reproducirSonido('acierto');
      vibrar('acierto');
      anunciar('Letra ' + letra.toUpperCase() + ' correcta. Puntaje ' + estado.puntaje +
        '. Vidas restantes: ' + (estado.maxErrores - estado.errores) + '.');
      if (window.UI.dibujarAhorcado) window.UI.dibujarAhorcado(estado.errores);
    } else {
      const frase = FRASES_ERROR[Math.floor(Math.random() * FRASES_ERROR.length)];
      mostrarSubtitulo(frase + ' (−5 puntos)', 'error');
      reproducirSonido('error');
      vibrar('error');
      anunciar('Letra ' + letra.toUpperCase() + ' incorrecta. Quedan ' +
        (estado.maxErrores - estado.errores) + ' vidas.');
      if (window.UI.dibujarAhorcado) window.UI.dibujarAhorcado(estado.errores);
    }

    // ¿Terminó la partida?
    const fin = window.Juego.verificarEstado();
    if (fin.terminado) finalizarPartida(fin.gano);
  }

  /** Prepara la vista de juego con una partida recién iniciada. */
  function prepararVistaJuego() {
    $('modal-resultado').hidden = true; // por si venía de una partida anterior
    window.UI.renderPalabra();
    window.UI.renderTeclado();
    actualizarTablero();
    if (window.UI.dibujarAhorcado) window.UI.dibujarAhorcado(window.Juego.estado.errores);
    cambiarVista('vista-juego');
    iniciarCronometro();
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

    detenerCronometro();

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

    // Usar pista (cuesta 15 puntos)
    $('boton-pista').addEventListener('click', function () {
      const resultado = window.Juego.usarPista();
      if (!resultado.ok) {
        mostrarSubtitulo(resultado.mensaje, null);
        window.App.anunciar(resultado.mensaje);
        return;
      }

      window.UI.renderPalabra();
      window.UI.renderTeclado();
      actualizarTablero();
      mostrarSubtitulo(resultado.mensaje, resultado.tipo === 'letra' ? 'acierto' : null);
      window.App.anunciar(resultado.mensaje + ' Puntaje: ' + window.Juego.estado.puntaje +
        '. Pistas restantes: ' + window.Juego.estado.pistasDisponibles + '.');

      // La letra de la pista pudo completar la palabra
      const fin = window.Juego.verificarEstado();
      if (fin.terminado) finalizarPartida(fin.gano);
    });

    // Modal de resultado: jugar de nuevo
    $('boton-jugar-denuevo').addEventListener('click', function () {
      $('modal-resultado').hidden = true;
      reiniciarPartida();
    });

    // Teclado físico: escribe una letra y juega igual que con el virtual.
    // La normalización (tildes y Ñ) la hace Juego.normalizar().
    document.addEventListener('keydown', function (evento) {
      if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

      const vistaJuego = $('vista-juego');
      if (!vistaJuego || !vistaJuego.classList.contains('vista--activa')) return;

      // No interferir si el foco está en un campo de texto
      const etiqueta = evento.target.tagName;
      if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA') return;

      const tecla = evento.key;
      if (tecla && tecla.length === 1 && /^[a-záéíóúüñ]$/i.test(tecla)) {
        manejarLetra(window.Juego.normalizar(tecla));
      }
    });
  }

  /** Inicialización al cargar la página. */
  function iniciarAplicacion() {
    cargarPreferencias();      // tema y sonido guardados
    conectarPanelConfiguracion();
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
    mostrarSubtitulo: mostrarSubtitulo,
    iniciarCronometro: iniciarCronometro,
    detenerCronometro: detenerCronometro,
    obtenerPreferencias: function () { return configuracion; },
    aplicarPreferencias: aplicarPreferencias,
    guardarPreferencias: guardarPreferencias,
    reproducirSonido: reproducirSonido
  };
})();
