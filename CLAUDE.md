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
- Estructura: botón de inicio arriba a la izquierda y a su lado "Saber más" (`data-learn`), que abre el diálogo `#kids`
  con una explicación para niños de 5 a 10 años; arriba a la derecha el botón de pantalla completa (`data-full`), que
  oculta el menú (`body.nodock`) y pide pantalla completa al navegador. Ambos van en el bloque "SyMula: botones comunes"
  (script tras el selector de tema, idéntico en todas). La tarjeta `.card` de cada simulador está oculta (`hidden`) a
  pedido de Sebas; el código que la llena sigue. Controles abajo en `.dock`; lo avanzado y el tema en el panel "Más".
- Las páginas nuevas se arman copiando el `<head>`, el estilo común y los bloques del final desde una existente.
- Simulación ligada al tiempo real (pasos según dt, igual a 60 y 120 Hz) con un tope de ms por cuadro;
  los LBM ajustan solos la resolución de la malla según lo que el equipo alcanza.

## Simuladores
- `index.html`: página de inicio que enlaza todos los simuladores. El logo (`img/symula-logo.png`, con texto de respaldo
  si falta); en temas oscuros va sobre una placa clara.
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
  Ley "agujero negro" (quinto botón de la ley de fuerza): Paczyński–Wiita, a = M/(r − rₛ)², rₛ = 2M/c² con la
  misma c = 6 (Sol: rₛ = 0,056); funciones invPow(r, M), tdyn, vcirc, phi(r, M) y sunR() la aplican en todo. En el
  modo Sol el centro se dibuja como agujero negro con la última órbita estable (3 rₛ) punteada; en N cuerpos el par
  usa M = m_i + m_j y se fusiona a R_i + R_j + rₛ.
- `ondas-sonoras.html`: ondas de presión 2D por diferencias finitas en salas rectangular, circular,
  triangular, elíptica y romboide (paredes rígidas). Modos analíticos (rectángulo, Bessel en círculo,
  Lamé en triángulo) y medidos por FFT en elipse/romboide. Hasta 3 fuentes omni/cardioide/dipolo con
  fase, oyente móvil y tono real con Web Audio cuyo volumen sigue el nivel simulado. Dibujo con relieve (luz según la
  pendiente del campo), 10 curvas de nivel suaves y sombra interior junto a las paredes.
- `flujo-tubo.html`: flujo en un tubo con obstáculos, Lattice Boltzmann D2Q9 + Smagorinsky, colisión y
  transporte fusionados (push). En celular vertical el tubo se dibuja vertical. ν se escala con el ancho
  de la malla para que Reynolds no dependa de la resolución. Obstáculos dibujados como formas vectoriales con luz y
  sombra; partículas como estelas cortas a lo largo de la velocidad.
- `flujo-tactil.html`: piscina a pantalla completa, LBM, el dedo agita el agua y genera ondas. Cáusticas (mosaico de
  senos que se desplaza, mezcla "lighter"), centro más hondo y borde de azulejos.
- `lanzamiento.html`: lanzamiento vertical a escala real con cámara que se aleja y marcas cada 0,1 s. Escenario por
  lugar (SCENE: cielo, cerros, suelo y estrellas), sombra de la pelota y marcas como pelotas fantasma.
- `mareas.html` (Bola de agua, estilo dibujo animado; reemplazó al simulador de mareas): bola fija al centro con
  núcleo de roca (R = 0,45, densidad 3) y océano hasta R = 1. El dedo o el mouse es la masa (Luna/Planeta/Estrella,
  M/m = 0,35/0,8/1,6) que levanta la marea; sin puntero gira sola. Superficie (marea al 40 %, capa delgada: alturas suavizadas desde ±0,12) η = Σ a_lm·Y_lm hasta l = 12 en
  malla 200 × 100, modos de Kelvin forzados hacia η_l = h_l·s·(R/d)^(l+1)·P_l con l = 2…12 (Love h_l =
  (2l+1)/(2(l−1))). "Soltar": órbita circular y gravedad de dos cuerpos (leapfrog); al entrar al agua lanza 25 000
  gotas (arreglos numéricos, un trazo por color) y se frena; contra el núcleo choca con 25 000 gotas de agua y roca. Render en la tarjeta gráfica (WebGL2: η como textura R16F, rayos por píxel a
  resolución completa; color = fuerza de marea radial (a·p̂, con a = (P−p)/|P−p|³ − P/|P|³): rojo + (levanta el agua), amarillo 0,
  azul − (la hunde), en 18 franjas, con la luz en tres niveles y leyenda "Fuerza de marea sobre el agua: ↑ hacia afuera (el agua sube) / hacia adentro ↓ (el agua baja)"; fondo y roca visibles); si no hay WebGL2, el
  mismo dibujo en el procesador con resolución adaptativa. Contorno vectorial. Mouse: moverlo lleva la masa y
  arrastrar gira la vista; dedo: arrastrar lleva la masa ("Girar vista" para girar). Zoom con +/− y rueda.
  Sin el cuadro de información de arriba (oculto a pedido de Sebas).
  La masa queda fija en el espacio donde se deja (gira sola solo al comienzo) y se mueve paralela a la pantalla
  a su propia profundidad: girando la vista se la puede llevar a cualquier punto. Contorno = silueta real.
  Física entre `// @fisica` y `// @fin-fisica`; prueba en `pruebas/mareas.js` (14 comprobaciones).
- `fractales.html`: Mandelbrot y Julia (z^d + c, d = 2, 3, 4) con zoom hasta ~10^280 por perturbación: órbita de referencia
  del centro en BigInt (punto fijo, P ≈ −log2(píxel) + 48 bits) y δ por píxel en números normales; cambio de referencia
  (a la órbita que parte de 0) cuando |Z+δ| < |δ| o se acaba la referencia. Cálculo repartido en Web Workers (blob con
  `kernel`), primero a baja resolución adaptativa y al soltar a resolución completa; color suave log(1+ν−ν_mín) con
  4 paletas. "Zoom solo" se acerca al centro; Julia toma como c el centro que se miraba. Prueba en `pruebas/fractales.js`.
- `lissajous.html`: osciloscopio X-Y, izquierdo = x (f0), derecho = y (f0·b/a + Δ), razones 1:1…4:5, desfase y desafinado;
  la figura se repite cada 1/(a|Δ|) s. Sonido estéreo real con Web Audio. Prueba en `pruebas/lissajous.js`.
- `radio.html`: AM y FM a escala de audio (fs = 48 kHz, portadora 12 kHz, mensaje 3,5 kHz): mensaje de 2 s (melodía o
  micrófono), ruido gaussiano ("Ruido en el camino" → SNR = 40 − 0,45·r dB), receptor I/Q con FIR Blackman (envolvente
  en AM, discriminador de fase en FM). Muestra la calidad recibida en dB y en palabras. Prueba en `pruebas/radio.js`.

## Fichas de fórmulas (PDF)
- `docs/<simulador>.pdf`: máximo 3 hojas por simulador: una portada para niños curiosos (qué pasa, un poco de
  matemática, un desafío con la respuesta al revés), las fórmulas que usa y "Cómo está hecho el archivo HTML"
  (funciones principales y un trozo de código real); se enlazan desde `index.html`
  a través de `docs/ver.html?f=<simulador>`, que los dibuja con PDF.js (muchos celulares no abren PDF directo).
- La fuente es `docs/fuentes/<simulador>.html` (KaTeX desde cdnjs). Para regenerar, servir el repo en local
  y imprimir con Edge sin ventana: `msedge --headless=new --no-pdf-header-footer --virtual-time-budget=15000
  --print-to-pdf=docs\<simulador>.pdf http://127.0.0.1:8765/docs/fuentes/<simulador>.html`.
- Pruebas contra la teoría en `pruebas/` (`node pruebas/todas.js`; `--rapido` omite los fluidos, que tardan ~15 min).
- Si cambia la física de un simulador, actualizar su ficha. En fórmulas, escribir `<` como `\lt` o `&lt;`.
