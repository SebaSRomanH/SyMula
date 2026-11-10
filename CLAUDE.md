# SyMula: contexto para Claude Code

Colección de simuladores interactivos de física de Sebas, publicada con GitHub Pages
(`https://sebasromanh.github.io/SyMula/`). Viene de una conversación en claude.ai.

## Convenciones
- Cada simulador es un único archivo HTML autocontenido (CSS y JS dentro), sin build ni dependencias.
- Solo fuentes de Google Fonts y scripts de cdnjs si hacen falta; nada más externo.
- Textos en español, sin emojis, pensado primero para celular en vertical.
- Soluciones mínimas y funcionales: no sobre-ingeniería.
- Antes de cambiar física, verificar numéricamente (por ejemplo con Node, simulando sin DOM).

## Diseño común: sistema SyMula UX/UI v1.0
- Objetivo: aplicación científica, elegante, legible y responsiva, que invite a experimentar sin verse infantil.
- Todos los simuladores comparten el bloque CSS entre `SyMula: estilo común` y `fin del estilo común`; si se cambia,
  copiarlo idéntico en todos. `index.html` y `docs/ver.html` usan los mismos tokens (temas y alias).
- Tres temas (claro, oscuro, verde nocturno) con tokens background, surface, surface-2, text, text-muted, primary,
  primary-text, accent, border, control-border y una paleta de datos sem-1…sem-5. El tema se guarda en
  localStorage (`symula-tema`); sin elección se sigue `prefers-color-scheme`. Script de tema en el `<head>` y
  selector (`data-theme-set`) al final del `<body>`, idénticos en todas las páginas; `SyMulaColor("token")` da los
  colores del tema para dibujar en el lienzo y el evento `symula-tema` avisa del cambio.
- Fuente Inter para la interfaz; fórmulas con KaTeX en las fichas. Tarjetas con borde discreto y radio de 12 px,
  separación de 16 a 24 px; botones de al menos 44 px (los `.tile` 56 px) con hover, foco, deshabilitado y cargando
  (`aria-busy="true"`). Sin sombras intensas, neón ni degradados decorativos en la interfaz.
- WCAG AA: texto ≥ 4,5:1 y componentes ≥ 3:1; `node pruebas/contraste.js` lo verifica con los tokens reales.
- No comunicar resultados solo con color: etiquetas, leyendas o símbolos. Las escenas de espacio se dibujan oscuras
  en todos los temas; en el nocturno el lienzo pasa a verde suave (sin fluorescencia).
- Estructura: botón de inicio arriba a la izquierda, tarjeta con título, una frase y una línea de datos reales;
  controles abajo en `.dock`; lo avanzado y el selector de tema en el panel "Más".
- Simulación ligada al tiempo real (pasos según dt, igual a 60 y 120 Hz) con un tope de ms por cuadro;
  los LBM ajustan solos la resolución de la malla según lo que el equipo alcanza.

## Simuladores
- `index.html`: página de inicio que enlaza todos los simuladores. El logo (`img/symula-logo.png`, con texto de respaldo
  si falta) es también el enlace escondido a `nave.html`; en temas oscuros va sobre una placa clara.
- `gravitacion.html`: gravitación y leyes de Kepler. Leapfrog con paso adaptativo (√(rⁿ⁺¹/M)),
  ley de fuerza 1/rⁿ con n = 0,5 / 1 / 2 / 3, modo Sol fijo y modo N cuerpos (hasta 4) con fusión
  que conserva masa y momento. Vistas de 1.ª ley (elipse osculadora y focos), 2.ª (áreas por sectores
  de tiempo igual) y 3.ª (gráfico T² vs a³ medido por vuelta). Unidades: r = 1 UA, 1 año = 2π.
  Hasta 6 masas, mostradas en unidades (100 unidades = 1 Sol = masa interna 1). Panel superior (oculto a pedido de Sebas; el código que lo llena sigue) con
  la energía (φ = −r^(1−n)/(n−1), ln r si n = 1) y la explicación detrás de "?". Vista fija: se mueve
  arrastrando con dos dedos, con el botón "Mover" o con el botón derecho del mouse; zoom con +/−, pellizco
  o rueda. Polvo galáctico sin masa ("en órbita" alrededor de la estrella dominante o "quieto"),
  dibujado con resplandor tipo Vía Láctea. Cada grano pesa 0,01 unidades: en N cuerpos atrae
  a las masas (no a otros granos) y la masa que lo atrapa se queda con su masa e impulso.
  Nubes de gas (en "Más" se elige qué suelta el botón): 0,002 unidades por trozo, misma gravedad,
  dibujadas como nebulosa. Cometas sin masa con cola de gas y de polvo que sueltan polvo
  cerca de la estrella. Una estrella que llega a 1500 unidades hace supernova (expulsa el 70 % como
  polvo) y deja una estrella de neutrones, que colapsa en agujero negro al llegar a 2500 unidades.
  Los cuerpos no llevan textos encima; las masas se leen en la línea de datos detrás de "?".
  Botón "Solo ver" (ojo): oculta todos los botones y las guías de Kepler; un ojo tenue abajo a la derecha
  los devuelve. Cielo infinito: 3 capas de estrellas en mosaico con paralaje. Las masas y cometas solo se
  olvidan a 2000 UA (el polvo, a 56 UA); los lanzamientos siguen acotados a 0,6 · 56 UA.
  La botonera flota sobre el espacio y los botones son semitransparentes (--dock-h corre los botones de
  las esquinas). "Modo noche" en "Más": filtro CSS verde sobre toda la página, recordado en localStorage.
  Láser (tercera opción del botón de polvo, en "Más"): rayo de luz con c = 6 que se curva con a = 2·g
  (relatividad general), hasta 3 fijos en el espacio. El polvo funciona aunque no haya masas (queda quieto).
- `ondas-sonoras.html`: ondas de presión 2D por diferencias finitas en salas rectangular, circular,
  triangular, elíptica y romboide (paredes rígidas). Modos analíticos (rectángulo, Bessel en círculo,
  Lamé en triángulo) y medidos por FFT en elipse/romboide. Hasta 3 fuentes omni/cardioide/dipolo con
  fase, oyente móvil y tono real con Web Audio cuyo volumen sigue el nivel simulado.
- `flujo-tubo.html`: flujo en un tubo con obstáculos, Lattice Boltzmann D2Q9 + Smagorinsky, colisión y
  transporte fusionados (push). En celular vertical el tubo se dibuja vertical. ν se escala con el ancho
  de la malla para que Reynolds no dependa de la resolución.
- `flujo-tactil.html`: piscina a pantalla completa, LBM, el dedo agita el agua y genera ondas.
- `lanzamiento.html`: lanzamiento vertical a escala real con cámara que se aleja y marcas cada 0,1 s.
- `mareas.html` (Bola de agua; reemplazó al simulador de mareas del planeta): bola líquida de radio 1 en el espacio
  con ejes x, y, z y un objeto del mismo radio de densidad elegible (metano, roca, acero, mercurio, oro, osmio).
  Unidades G·ρ_agua = 1 (tiempo ≈ 1,075 h). Forma de equilibrio r = 1 + q·P₂, q = (5/2)(M/m)(R/d)³ (Love h₂ = 5/2),
  que se alcanza oscilando con el modo de Kelvin ω² = 16π/15; bajo el límite de Roche 2,44·(ρ/ρ_agua)^(1/3) la bola
  se rompe en 520 gotas que sigue la marea (2x, −y, −z)·GM/d³. Trazado de rayos de elipsoide y esfera con calidad
  adaptativa; arrastrar gira la vista. Física entre `// @fisica` y `// @fin-fisica`; prueba en `pruebas/mareas.js`.
- `nave.html` (Beta, oculto: no aparece en `index.html` por decisión de Sebas; solo se abre por su URL): nave que planea viajes por órbitas en 5 sistemas (Sol, Dos soles, Tres soles,
  Cinco cuerpos y Agujero negro con potencial de Paczyński–Wiita, r_g = 0,08, c reducida). Las estrellas
  y gigantes se mueven en N cuerpos y se calculan una vez (efemérides: leapfrog h = 0,0005, tabla cada
  0,01, Hermite cúbico); planetas, cápsula y nave no tienen masa. La nave sigue una trayectoria guardada
  (leapfrog adaptativo) para que recorra exactamente lo que se predijo. Plan = instante + Δv (adelante
  p, izquierda q). "Ruta auto" = planificador: 24 × 12 × 6 rutas con integrador rápido y afinado por
  patrones de las 6 mejores (semilla de Hohmann en el sistema solar). Llegar iguala la velocidad (< 0,05
  UA) y recarga combustible en planetas. Sistemas revisados en Node 20 años; física entre `// @fisica`
  y `// @fin-fisica`.

## Fichas de fórmulas (PDF)
- `docs/<simulador>.pdf`: máximo 3 hojas por simulador: una portada para niños curiosos (qué pasa, un poco de
  matemática, un desafío con la respuesta al revés), las fórmulas que usa y "Cómo está hecho el archivo HTML"
  (funciones principales y un trozo de código real); se enlazan desde `index.html` (salvo la nave, oculta)
  a través de `docs/ver.html?f=<simulador>`, que los dibuja con PDF.js (muchos celulares no abren PDF directo).
- La fuente es `docs/fuentes/<simulador>.html` (KaTeX desde cdnjs). Para regenerar, servir el repo en local
  y imprimir con Edge sin ventana: `msedge --headless=new --no-pdf-header-footer --virtual-time-budget=15000
  --print-to-pdf=docs\<simulador>.pdf http://127.0.0.1:8765/docs/fuentes/<simulador>.html`.
- Pruebas contra la teoría en `pruebas/` (`node pruebas/todas.js`; `--rapido` omite los fluidos, que tardan ~15 min).
- Si cambia la física de un simulador, actualizar su ficha. En fórmulas, escribir `<` como `\lt` o `&lt;`.

## Pendientes posibles
- Opción "agujero negro" en gravitación con potencial pseudo-newtoniano de Paczyński–Wiita.
