# SyMula

Simuladores interactivos de física que corren en el navegador, sin instalación ni dependencias.

## Gravitación: las leyes de Kepler

[`gravitacion/index.html`](gravitacion/index.html)

Un sistema solar en el que se crean planetas tocando el cielo y se lanzan arrastrando. Está pensado para aprender de forma intuitiva:

- **1.ª ley (elipses):** muestra la elipse del planeta seleccionado, con el Sol en un foco, el foco vacío y los puntos más cercano y más lejano.
- **2.ª ley (áreas):** la línea Sol–planeta barre triángulos en tiempos iguales y se muestra su área, que es la misma en todos.
- **3.ª ley (periodos):** cada planeta mide su periodo T (años) y su semieje a (UA) y aparece en un gráfico de T² contra a³.
- **Ley de fuerza elegible:** 1/√r, 1/r, 1/r² (la real) y 1/r³, para ver qué leyes dejan de cumplirse.
- **Masas que se atraen:** hasta 4 cuerpos que se atraen entre sí; al chocar, el más grande absorbe al otro y su masa es la suma.

### Método

Mecánica newtoniana en 2D con fuerza F ∝ m/rⁿ, en unidades donde r = 1 equivale a 1 UA y una órbita circular a esa distancia dura 1 año. Integración leapfrog (simpléctica) con paso adaptativo según el tiempo dinámico √(rⁿ⁺¹/M), lo que conserva bien la energía y el momento angular. Los choques son fusiones inelásticas que conservan masa y momento.

### Verificación

| Prueba | Resultado |
|---|---|
| Gravedad real, planeta con a = 1,25 UA | T² = 1,954 y a³ = 1,953 |
| Áreas de 8 sectores seguidos | Todas 0,382 |
| Con 1/r, mismo planeta | T² = 1,04 y a³ = 1,49 (no cumple la 3.ª ley) |
| Cuatro masas que chocan | La masa total se conserva |

### Limitaciones

Modelo plano, sin relatividad ni mareas; las unidades son normalizadas y el tamaño visual de los cuerpos es ilustrativo.
