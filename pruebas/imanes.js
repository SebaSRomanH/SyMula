// Imanes: el campo de las corrientes equivalentes y el movimiento de cargas con la fuerza de Lorentz.
"use strict";
const {read, build, check} = require("./util");
const S = read("imanes.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))],
  "C, PART, preset, randomField, currents, potential, field, boris, advance, launch, gyroRadius");
const B = (cur, x, y) => M.field(cur, x, y, [0, 0]);

module.exports = function(){
  // 1) Imán de barra con M hacia +x: adentro B apunta a +x; afuera, frente al polo N, también sale hacia +x;
  //    al costado, las líneas vuelven de N a S (B hacia −x).
  const bar = M.currents(M.preset("barra"), 1);
  const bin = B(bar, 0, 0), bout = B(bar, 2.2, 0), bside = B(bar, 0, 1.2);
  check("Imanes", "barra: B adentro apunta de S a N (+x)", Math.sign(bin[0]), 1, 0);
  check("Imanes", "barra: frente al polo N el campo sale (+x)", Math.sign(bout[0]), 1, 0);
  check("Imanes", "barra: al costado vuelve de N a S (−x)", Math.sign(bside[0]), -1, 0);
  // 2) B = rot A (diferencias finitas) en tres puntos
  {
    let worst = 0;
    for (const [x, y] of [[2, 1], [-1.5, -1.3], [0.4, 2]]){
      const h = 1e-4, ax = (M.potential(bar, x, y + h) - M.potential(bar, x, y - h))/(2*h), ay = -(M.potential(bar, x + h, y) - M.potential(bar, x - h, y))/(2*h);
      const b = B(bar, x, y); worst = Math.max(worst, Math.hypot(ax - b[0], ay - b[1])/Math.hypot(b[0], b[1]));
    }
    check("Imanes", "B = ∇ × (A ẑ) (peor diferencia relativa)", 1 + worst, 1, 1e-5);
  }
  // 3) Cable: B = I/r, a doble distancia la mitad
  {
    const w = M.currents(M.preset("cable"), 1), b1 = Math.hypot(...B(w, 1, 0)), b2 = Math.hypot(...B(w, 0, 2));
    // con el suavizado junto al cable: B = I·r/(r² + ε²), ε² = 0,004 (a 1 unidad cambia 0,4 %)
    check("Imanes", "cable: B(2r)/B(r) = 1/2 (con suavizado)", b2/b1, 2*(1 + 0.004)/(4 + 0.004), 1e-9);
    check("Imanes", "cable: B = I·r/(r² + ε²) con I = 2,5", b1, 2.5/(1 + 0.004), 1e-9);
  }
  // 4) Polos iguales enfrentados: en el punto medio el campo se anula
  {
    const rep = M.currents(M.preset("repelen"), 1), att = M.currents(M.preset("atraen"), 1);
    const r0 = Math.hypot(...B(rep, 0, 0)), a0 = Math.hypot(...B(att, 0, 0));
    check("Imanes", "se repelen: |B| en el medio / |B| si se atraen ≈ 0", 1 + r0/a0, 1, 1e-6);
  }
  // 5) Campo parejo: radio y periodo de giro relativistas
  {
    const Bz = 1.3, beta = 0.6, p = M.launch("e", 0, 0, 1, 0, beta), Bf = (x, y, o) => { o[0] = 0; o[1] = 0; o[2] = Bz; return o; };
    let ymin = 0, ymax = 0, t = 0, turns = 0, prev = p.uy; const dt = 1e-3, g = 1/Math.sqrt(1 - beta*beta);
    const T = 2*Math.PI*g/Bz;
    while (t < 3*T){ M.advance(p, Bf, dt); t += dt; ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); if (prev < 0 && p.uy >= 0) turns++; prev = p.uy; }
    check("Imanes", "giro en campo parejo: diámetro = 2γmv/(|q|B)", ymax - ymin, 2*M.gyroRadius(1, -1, beta, Bz), 1e-3);
    check("Imanes", "giro en campo parejo: vueltas en 3 periodos 2πγm/(|q|B)", turns, 3, 0);
    const u = Math.hypot(p.ux, p.uy, p.uz);
    check("Imanes", "el campo magnético no cambia la rapidez", u, g*beta*M.C, 1e-9);
    // electrón y protón giran al revés; el fotón sigue derecho
    const e = M.launch("e", 0, 0, 1, 0, 0.3), pr = M.launch("p", 0, 0, 1, 0, 0.3), ph = M.launch("g", 0, 0, 1, 0, 0.3);
    for (let k = 0; k < 200; k++){ M.advance(e, Bf, 1e-3); M.advance(pr, Bf, 1e-3); M.advance(ph, Bf, 1e-3); }
    check("Imanes", "electrón y protón se desvían a lados opuestos", Math.sign(e.y)*Math.sign(pr.y), -1, 0);
    check("Imanes", "el fotón no se desvía (y = 0)", 1 + Math.abs(ph.y), 1, 1e-12);
    check("Imanes", "el fotón viaja a c", Math.hypot(ph.ux, ph.uy), M.C, 1e-12);
  }
  // 7) Campo al azar: 3 a 5 imanes sin tocarse; la rapidez del electrón no cambia al cruzarlo
  {
    let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
    let okN = 1, minGap = Infinity, worst = 0;
    for (let k = 0; k < 20; k++){
      const f = M.randomField(rnd), mags = f.objs.filter(o => o.parts.length);
      if (mags.length < 3 || mags.length > 5) okN = 0;
      for (let i = 0; i < f.objs.length; i++) for (let j = i + 1; j < f.objs.length; j++){
        const r = o => o.parts.length ? Math.max(...o.parts[0].poly.map(([x, y]) => Math.hypot(x, y))) : 0.3;
        minGap = Math.min(minGap, Math.hypot(f.objs[i].x - f.objs[j].x, f.objs[i].y - f.objs[j].y) - r(f.objs[i]) - r(f.objs[j]));
      }
      const cur = M.currents(f, 1), Bf = (x, y, o) => { M.field(cur, x, y, o); o[2] = 0; return o; };
      const e = M.launch("e", -4.5, 0.2, 1, 0, 0.5), u0 = Math.hypot(e.ux, e.uy, e.uz);
      for (let s = 0; s < 300; s++) M.advance(e, Bf, 5e-3);
      worst = Math.max(worst, Math.abs(Math.hypot(e.ux, e.uy, e.uz)/u0 - 1));
    }
    check("Imanes", "al azar: siempre de 3 a 5 imanes", okN, 1, 0);
    check("Imanes", "al azar: los imanes no se tocan (separación mínima > 0)", minGap > 0 ? 1 : 0, 1, 0);
    check("Imanes", "al azar: la rapidez del electrón no cambia", 1 + worst, 1, 1e-9);
  }
  // 6) En un campo que no depende de z se conserva p_z + q A_z (por eso la carga sigue las líneas)
  {
    const p = M.launch("e", -2.5, 0.9, 1, -0.2, 0.3), Bf = (x, y, o) => { M.field(bar, x, y, o); o[2] = 0; return o; };
    const pz0 = p.uz + p.q*M.potential(bar, p.x, p.y); let worst = 0;
    for (let k = 0; k < 1500; k++){ M.advance(p, Bf, 2e-3); worst = Math.max(worst, Math.abs(p.uz + p.q*M.potential(bar, p.x, p.y) - pz0)); }
    check("Imanes", "se conserva p_z + q·A_z (cambio máximo)", 1 + worst, 1, 2e-3);
  }
};
if (require.main === module){ module.exports(); process.exitCode = require("./util").summary() ? 1 : 0; }
