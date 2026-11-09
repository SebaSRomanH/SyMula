# SyMula: contexto para Claude Code

Colección de simuladores interactivos de física de Sebas, publicada con GitHub Pages
(`https://sebasromanh.github.io/SyMula/`). Viene de una conversación en claude.ai.

## Convenciones
- Cada simulador es un único archivo HTML autocontenido (CSS y JS dentro), sin build ni dependencias.
- Solo fuentes de Google Fonts y scripts de cdnjs si hacen falta; nada más externo.
- Tema oscuro, textos en español, sin emojis, pensado primero para celular en vertical.
- Soluciones mínimas y funcionales: no sobre-ingeniería.
- Antes de cambiar física, verificar numéricamente (por ejemplo con Node, simulando sin DOM).

## Diseño común (niños desde 5 años, celular primero)
- Todos los simuladores comparten el bloque CSS entre `SyMula: estilo común` y `fin del estilo común`;
  si se cambia, copiarlo idéntico en todos. Fuente Nunito, fondo #0b1226, acento #ffc94a.
- Estructura fija: botón de inicio arriba a la izquierda (vuelve a `index.html`), tarjeta con título,
  una frase de instrucción y una línea de datos reales; controles abajo en `.dock`.
- Botones `.tile` de al menos 60 px con ícono y una o dos palabras. Sin menús desplegables, sin gestos
  ocultos (doble toque) y sin sliders en la vista principal: lo avanzado va en el panel "Más".
- Simulación ligada al tiempo real (pasos según dt, igual a 60 y 120 Hz) con un tope de ms por cuadro;
  los LBM ajustan solos la resolución de la malla según lo que el equipo alcanza.

## Simuladores
- `index.html`: página de inicio que enlaza todos los simuladores.
- `gravitacion.html`: gravitación y leyes de Kepler. Leapfrog con paso adaptativo (√(rⁿ⁺¹/M)),
  ley de fuerza 1/rⁿ con n = 0,5 / 1 / 2 / 3, modo Sol fijo y modo N cuerpos (hasta 4) con fusión
  que conserva masa y momento. Vistas de 1.ª ley (elipse osculadora y focos), 2.ª (áreas por sectores
  de tiempo igual) y 3.ª (gráfico T² vs a³ medido por vuelta). Unidades: r = 1 UA, 1 año = 2π.
  Hasta 6 masas, mostradas en unidades (100 unidades = 1 Sol = masa interna 1). Panel superior mínimo con
  la energía (φ = −r^(1−n)/(n−1), ln r si n = 1) y la explicación detrás de "?". Vista fija: se mueve
  arrastrando con dos dedos, con el botón "Mover" o con el botón derecho del mouse; zoom con +/−, pellizco
  o rueda. Polvo galáctico sin masa ("en órbita" alrededor de la estrella dominante o "quieto"),
  dibujado con resplandor tipo Vía Láctea. Cometas sin masa con cola de gas y de polvo que sueltan polvo
  cerca de la estrella. Una estrella que llega a 1500 unidades hace supernova (expulsa el 70 % como
  polvo) y deja una estrella de neutrones, que colapsa en agujero negro al llegar a 2500 unidades.
  Los cuerpos no llevan textos encima; las masas se leen en la línea de datos detrás de "?".
- `ondas-sonoras.html`: ondas de presión 2D por diferencias finitas en salas rectangular, circular,
  triangular, elíptica y romboide (paredes rígidas). Modos analíticos (rectángulo, Bessel en círculo,
  Lamé en triángulo) y medidos por FFT en elipse/romboide. Hasta 3 fuentes omni/cardioide/dipolo con
  fase, oyente móvil y tono real con Web Audio cuyo volumen sigue el nivel simulado.
- `flujo-tubo.html`: flujo en un tubo con obstáculos, Lattice Boltzmann D2Q9 + Smagorinsky, colisión y
  transporte fusionados (push). En celular vertical el tubo se dibuja vertical. ν se escala con el ancho
  de la malla para que Reynolds no dependa de la resolución.
- `flujo-tactil.html`: piscina a pantalla completa, LBM, el dedo agita el agua y genera ondas.
- `lanzamiento.html`: lanzamiento vertical a escala real con cámara que se aleja y marcas cada 0,1 s.

## Pendientes posibles
- Opción "agujero negro" en gravitación con potencial pseudo-newtoniano de Paczyński–Wiita.
