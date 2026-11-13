// Figuras de Lissajous: la figura dibujada es la de las dos señales reales, se cierra si la razón es exacta,
// toca los bordes a y b veces, y con un desafinado Δ se repite cada 1/(a·|Δ|) segundos.
"use strict";
const {read, build, check} = require("./util");
const S = read("lissajous.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))], "RATIOS, freqs, point, turnPeriod");

module.exports = function(){
  const base = 220, phi = 0.7;
  // 1) igual a las señales reales x = sin(2π fx t + φ), y = sin(2π fy t)
  {
    const [a, b] = [2, 3], det = 0.6, [fx, fy] = M.freqs(base, a, b, det); let worst = 0;
    for (let k = 0; k < 2000; k++){
      const t = k*1.7e-3, th = 2*Math.PI*base/a*t, [x, y] = M.point(a, b, phi, 2*Math.PI*det*t, th);
      worst = Math.max(worst, Math.abs(x - Math.sin(2*Math.PI*fx*t + phi)), Math.abs(y - Math.sin(2*Math.PI*fy*t)));
    }
    check("Lissajous", "punto = señales reales (peor diferencia)", 1 + worst, 1, 1e-9);
    check("Lissajous", "razón de frecuencias 2:3", fy/fx, 1.5 + det/fx, 1e-12);
  }
  for (const [a, b] of M.RATIOS){
    // 2) se cierra en θ = 2π y toca el borde derecho a veces y el de arriba b veces
    const N = 20000; let right = 0, top = 0;
    for (let k = 0; k < N; k++){
      const p = M.point(a, b, 0.31, 0, 2*Math.PI*k/N), q = M.point(a, b, 0.31, 0, 2*Math.PI*(k + 1)/N), r = M.point(a, b, 0.31, 0, 2*Math.PI*(k - 1)/N);
      if (p[0] > q[0] && p[0] >= r[0] && p[0] > 0.99) right++;
      if (p[1] > q[1] && p[1] >= r[1] && p[1] > 0.99) top++;
    }
    const [x0, y0] = M.point(a, b, 0.31, 0, 0), [x1, y1] = M.point(a, b, 0.31, 0, 2*Math.PI);
    check("Lissajous", `${a}:${b} toques del borde derecho y de arriba (a·10 + b)`, right*10 + top, a*10 + b, 0);
    if (a === 3 && b === 4) check("Lissajous", "la curva se cierra en θ = 2π", 1 + Math.hypot(x1 - x0, y1 - y0), 1, 1e-12);
  }
  // 3) con desfase 2π/a la figura es la misma (por eso se repite cada 1/(a·|Δ|) s)
  {
    const [a, b] = [3, 4], A = [], B = [], N = 3000;
    for (let k = 0; k < N; k++){ A.push(M.point(a, b, phi, 0.2, 2*Math.PI*k/N)); B.push(M.point(a, b, phi, 0.2 + 2*Math.PI/a, 2*Math.PI*k/N)); }
    let worst = 0; for (const p of A){ let d = 9; for (const q of B) d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1])); worst = Math.max(worst, d); }
    check("Lissajous", "3:4: misma figura al avanzar el desfase 2π/3", 1 + worst, 1, 0.01);
    check("Lissajous", "se repite cada 1/(a·Δ) = 1/(3·0,5) s", M.turnPeriod(0.5, 3), 1/1.5, 1e-12, " s");
  }
};
if (require.main === module){ module.exports(); process.exitCode = require("./util").summary() ? 1 : 0; }
