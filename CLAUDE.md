# SyMula: contexto para Claude Code

Colección de simuladores interactivos de física de Sebas, publicada con GitHub Pages
(`https://sebasromanh.github.io/SyMula/`). Viene de una conversación en claude.ai.

## Convenciones
- Cada simulador es un único archivo HTML autocontenido (CSS y JS dentro), sin build ni dependencias.
- Solo fuentes de Google Fonts y scripts de cdnjs si hacen falta; nada más externo.
- Tema oscuro, textos en español, sin emojis, pensado primero para celular en vertical.
- Soluciones mínimas y funcionales: no sobre-ingeniería.
- Antes de cambiar física, verificar numéricamente (por ejemplo con Node, simulando sin DOM).

## Simuladores
- `index.html`: página de inicio que enlaza todos los simuladores.
- `gravitacion.html`: gravitación y leyes de Kepler. Leapfrog con paso adaptativo (√(rⁿ⁺¹/M)),
  ley de fuerza 1/rⁿ con n = 0,5 / 1 / 2 / 3, modo Sol fijo y modo N cuerpos (hasta 4) con fusión
  que conserva masa y momento. Vistas de 1.ª ley (elipse osculadora y focos), 2.ª (áreas por sectores
  de tiempo igual) y 3.ª (gráfico T² vs a³ medido por vuelta). Unidades: r = 1 UA, 1 año = 2π.
- `ondas-sonoras.html`: ondas de presión 2D por diferencias finitas en salas rectangular, circular,
  triangular, elíptica y romboide (paredes rígidas). Modos analíticos (rectángulo, Bessel en círculo,
  Lamé en triángulo) y medidos por FFT en elipse/romboide. Hasta 3 fuentes omni/cardioide/dipolo con
  fase, oyente móvil y tono real con Web Audio cuyo volumen sigue el nivel simulado.
- `flujo-tubo.html`: flujo en un tubo con obstáculos, Lattice Boltzmann D2Q9 + Smagorinsky.
- `flujo-tactil.html`: piscina a pantalla completa, LBM, el dedo agita el agua y genera ondas.
- `lanzamiento.html`: lanzamiento vertical a escala real con cámara que se aleja y marcas cada 0,1 s.

## Pendientes posibles
- Opción "agujero negro" en gravitación con potencial pseudo-newtoniano de Paczyński–Wiita.
