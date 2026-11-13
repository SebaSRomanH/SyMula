// Fractales: la perturbación (órbita de referencia en BigInt + diferencias en números normales) debe dar
// lo mismo que iterar cada punto directamente; a zoom profundo se compara con la iteración directa en BigInt.
"use strict";
const {read, build, check} = require("./util");
const S = read("fractales.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))], "fixOf, bigToNum, orbit, kernel");

// Iteración directa en punto fijo (P bits) de un solo punto: devuelve el conteo suave o −1.
function direct(zr, zi, cr, ci, P, d, maxIt){
  const Pn = BigInt(P), one = 1n << Pn, R = 65536;
  for (let it = 0; ; it++){
    const r = M.bigToNum(zr, P), i = M.bigToNum(zi, P), r2 = r*r + i*i;
    if (r2 > R) return Math.max(0, it + 1 - Math.log(0.5*Math.log(r2))/Math.log(d));
    if (it >= maxIt) return -1;
    let pr = zr, pi = zi;
    for (let k = 1; k < d; k++){ const a = (pr*zr - pi*zi) >> Pn; pi = (pr*zi + pi*zr) >> Pn; pr = a; }
    zr = pr + cr; zi = pi + ci;
    void one;
  }
}
// Compara una imagen calculada con kernel contra la iteración directa de cada píxel.
function compare(opt){
  const {cx, cy, ps, w, h, P, d, maxIt, julia, jc} = opt;
  const X = M.fixOf(cx, P), Y = M.fixOf(cy, P);
  let A, B;
  if (!julia){ A = B = M.orbit(0n, 0n, X, Y, P, d, maxIt); }
  else { const jr = M.fixOf(jc[0], P), ji = M.fixOf(jc[1], P); A = M.orbit(X, Y, jr, ji, P, d, maxIt); B = M.orbit(0n, 0n, jr, ji, P, d, maxIt); }
  const out = M.kernel({A: A.ref, lenA: A.len, B: B.ref, lenB: B.len, julia, d, w, h, y0: 0, y1: h, ps, maxIt});
  let same = 0, worst = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const dr = M.fixOf((x + 0.5 - w/2)*ps, P), di = M.fixOf((h/2 - y - 0.5)*ps, P);
    const v = julia ? direct(X + dr, Y + di, M.fixOf(jc[0], P), M.fixOf(jc[1], P), P, d, maxIt)
                    : direct(0n, 0n, X + dr, Y + di, P, d, maxIt);
    const g = out[y*w + x];
    const ok = (v < 0) === (g < 0) && (v < 0 || Math.abs(v - g) < 1e-3);
    if (ok) same++;
    if (v >= 0 && g >= 0) worst = Math.max(worst, Math.abs(v - g));
  }
  return {frac: same/(w*h), worst};
}

module.exports = function(){
  {
    const x = -0.743643887037151, P = 400, v = M.fixOf(x, P);
    check("Fractales", "número → BigInt → número (ida y vuelta)", M.bigToNum(v, P), x, 1e-15);
    check("Fractales", "precisión de 10⁻²⁸⁰ en BigInt", M.bigToNum(M.fixOf(3e-280, 1000), 1000), 3e-280, 1e-12);
  }
  let r = compare({cx: -0.65, cy: 0, ps: 3.2/40, w: 40, h: 30, P: 64, d: 2, maxIt: 300, julia: false});
  check("Fractales", "Mandelbrot entero: píxeles iguales a la iteración directa", r.frac, 1, 0.01);
  r = compare({cx: -0.743643887037151, cy: 0.131825904205330, ps: 2e-9, w: 24, h: 18, P: 96, d: 2, maxIt: 2000, julia: false});
  check("Fractales", "Mandelbrot zoom 10⁹ (valle de los caballitos de mar)", r.frac, 1, 0.02);   // los píxeles caóticos del borde varían como en cualquier cálculo con decimales
  r = compare({cx: -0.743643887037158704752191506114774, cy: 0.131825904205311970493132056385139, ps: 1e-31, w: 12, h: 9, P: 160, d: 2, maxIt: 3000, julia: false});
  check("Fractales", "Mandelbrot zoom 10³¹ contra BigInt directo", r.frac, 1, 0.02);
  r = compare({cx: 0, cy: 0, ps: 3.4/40, w: 40, h: 30, P: 64, d: 2, maxIt: 300, julia: true, jc: [-0.8, 0.156]});
  check("Fractales", "Julia c = −0,8 + 0,156 i", r.frac, 1, 0.01);
  r = compare({cx: 0.12, cy: 0.4, ps: 1e-7, w: 20, h: 15, P: 96, d: 2, maxIt: 1500, julia: true, jc: [-0.8, 0.156]});
  check("Fractales", "Julia zoom 10⁷", r.frac, 1, 0.02);
  r = compare({cx: 0, cy: 0, ps: 3.4/40, w: 40, h: 30, P: 64, d: 3, maxIt: 300, julia: false});
  check("Fractales", "z³ + c: píxeles iguales a la iteración directa", r.frac, 1, 0.01);
  r = compare({cx: 0.3, cy: 0.5, ps: 3.4/40, w: 40, h: 30, P: 64, d: 4, maxIt: 300, julia: false});
  check("Fractales", "z⁴ + c: píxeles iguales a la iteración directa", r.frac, 1, 0.01);
};

if (require.main === module){ module.exports(); process.exitCode = require("./util").summary() ? 1 : 0; }
