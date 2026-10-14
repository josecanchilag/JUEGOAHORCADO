/* =========================================================
   EL AHORCADO – CAPITALES DE COLOMBIA
   ui.js – Renderizado del DOM: palabra oculta, teclado virtual,
   dibujo SVG del ahorcado y ventana de resultado.
   ========================================================= */

(function () {
  'use strict';

  const LETRAS_TECLADO = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  /**
   * Dibuja la palabra oculta con guiones bajo por letra.
   * Los espacios de las capitales con varias palabras se muestran
   * desde el inicio y NO cuentan como letra por adivinar.
   */
  function renderPalabra() {
    const contenedor = document.getElementById('palabra');
    if (!contenedor) return;

    const estado = window.Juego.estado;
    contenedor.innerHTML = '';
    const visible = [];

    for (const caracter of estado.palabra) {
      const celda = document.createElement('span');

      if (caracter === ' ') {
        // Espacio visible desde el inicio (p. ej. SANTA MARTA)
        celda.className = 'letra letra--espacio';
        celda.textContent = '\u00A0';
        visible.push('espacio');
      } else {
        const clave = window.Juego.normalizar(caracter);
        const descubierto = estado.letrasAcertadas.includes(clave);
        celda.className = descubierto ? 'letra letra--descubierta' : 'letra';
        celda.textContent = descubierto ? caracter : '＿';
        visible.push(descubierto ? caracter : 'sin descubrir');
      }

      contenedor.appendChild(celda);
    }

    // Descripción legible para lectores de pantalla
    contenedor.setAttribute(
      'aria-label',
      'Palabra: ' + visible.map(function (v) { return v === 'espacio' ? 'espacio' : v; }).join(', ')
    );

    // Barra de progreso de letras descubiertas
    const barra = document.getElementById('barra-progreso');
    if (barra) {
      const total = window.Juego.contarLetrasUnicas();
      const hechas = total > 0
        ? estado.letrasAcertadas.filter(function (letra) {
            return estado.palabra.toLowerCase().includes(letra);
          }).length
        : 0;
      const porcentaje = total > 0 ? Math.min(100, Math.round((hechas / total) * 100)) : 0;
      barra.style.width = porcentaje + '%';
    }
  }

  /**
   * Crea el teclado virtual A–Z con Ñ.
   * Cada tecla lleva aria-label y se deshabilita al usarse.
   */
  function renderTeclado() {
    const contenedor = document.getElementById('teclado');
    if (!contenedor) return;

    const estado = window.Juego.estado;
    contenedor.innerHTML = '';

    LETRAS_TECLADO.forEach(function (letra) {
      const clave = letra.toLowerCase();
      const tecla = document.createElement('button');
      const acertada = estado.letrasAcertadas.includes(clave);
      const fallada = estado.letrasFalladas.includes(clave);
      const usada = acertada || fallada;

      tecla.type = 'button';
      tecla.className = 'teclado__tecla';
      tecla.dataset.letra = clave;
      tecla.textContent = letra;
      tecla.disabled = usada || estado.terminado;

      if (acertada) tecla.classList.add('teclado__tecla--correcta');
      if (fallada) tecla.classList.add('teclado__tecla--error');

      // aria-label descriptivo: nunca informar solo con color
      if (acertada) {
        tecla.setAttribute('aria-label', 'Letra ' + letra + ', ya acertada');
      } else if (fallada) {
        tecla.setAttribute('aria-label', 'Letra ' + letra + ', ya fallada');
      } else {
        tecla.setAttribute('aria-label', 'Letra ' + letra + ', disponible');
      }

      contenedor.appendChild(tecla);
    });
  }

  /** Orden obligatorio de las partes del ahorcado según los errores. */
  const PARTES_AHORCADO = [
    { id: 'cabeza', nombre: 'cabeza' },
    { id: 'cuerpo', nombre: 'cuerpo' },
    { id: 'brazoIzquierdo', nombre: 'brazo izquierdo' },
    { id: 'brazoDerecho', nombre: 'brazo derecho' },
    { id: 'piernaIzquierda', nombre: 'pierna izquierda' },
    { id: 'piernaDerecha', nombre: 'pierna derecha' }
  ];

  /**
   * Dibuja progresivamente el ahorcado en SVG según los errores.
   * Orden: cabeza, cuerpo, brazo izquierdo, brazo derecho,
   * pierna izquierdo, pierna derecha. Cada parte aparece con
   * animación de trazo y actualiza <title>/<desc> para lectores
   * de pantalla.
   * @param {number} errores - Cantidad de errores acumulados (0 a 6).
   */
  function dibujarAhorcado(errores) {
    const partes = document.querySelectorAll('.ahorcado__parte');
    if (!partes.length) return;

    partes.forEach(function (parte, indice) {
      const debeMostrarse = indice < errores;

      if (!debeMostrarse) {
        parte.classList.remove('ahorcado__parte--visible', 'ahorcado__parte--trazar');
        delete parte.dataset.animada;
        return;
      }

      const yaVisible = parte.classList.contains('ahorcado__parte--visible');
      parte.classList.add('ahorcado__parte--visible');

      // La animación de trazo solo corre cuando la parte es nueva
      if (!yaVisible && !parte.dataset.animada) {
        parte.classList.add('ahorcado__parte--trazar');
        parte.dataset.animada = '1';
      }
    });

    // Descripción textual del estado del dibujo (accesibilidad)
    const dibujadas = PARTES_AHORCADO.slice(0, errores).map(function (p) { return p.nombre; });
    const desc = document.getElementById('ahorcado-desc');
    if (desc) {
      desc.textContent = errores === 0
        ? 'Ahorcado sin errores: solo se ve la estructura del poste.'
        : 'Ahorcado con ' + errores + ' de 6 errores. Dibujado hasta el ' +
          dibujadas[dibujadas.length - 1] + '.';
    }
  }

  // Exposición del módulo (mostrarResultado se agrega en el paso 8)
  window.UI = {
    LETRAS_TECLADO: LETRAS_TECLADO,
    PARTES_AHORCADO: PARTES_AHORCADO,
    renderPalabra: renderPalabra,
    renderTeclado: renderTeclado,
    dibujarAhorcado: dibujarAhorcado
  };
})();
