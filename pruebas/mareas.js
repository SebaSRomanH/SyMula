// Mareas: amplitudes de equilibrio de la Luna y el Sol, y los ritmos que salen de las órbitas:
// marea semidiurna lunar (M2, 12,42 h), solar (S2, 12 h) y ciclo de mareas vivas y muertas (14,77 días).
"use strict";
const {read, build, check, spectrum, peaks} = require("./util");
const S = read("mareas.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))],
  "A_MOON, A_SUN, moonDir, sunDir, axes, surfaceNormal, tideAt, W_SPIN");

module.exports = function(){
  check("Mareas", "amplitud de la marea lunar A = (M/M_T)(R/d)³R", M.A_MOON, 0.358, 0.01, " m");
  check("Mareas", "amplitud de la marea solar", M.A_SUN, 0.164, 0.01, " m");
  check("Mareas", "razón Sol / Luna (0,46 en los libros)", M.A_SUN/M.A_MOON, 0.46, 0.02);
  // Serie de la marea en un punto del ecuador durante 60 días, cada 6 minutos.
  const ax = M.axes(0), dt = 0.1/24, n = Math.round(60/dt), only = [], both = [];
  for (let k = 0; k < n; k++){
    const t = k*dt, p = M.surfaceNormal(ax, 0, 0.3, t);
    only.push(M.tideAt(p, M.moonDir(t), M.sunDir(t), M.A_MOON, 0));
    both.push(M.tideAt(p, M.moonDir(t), M.sunDir(t), M.A_MOON, M.A_SUN));
  }
  const top = sig => { const {P, N} = spectrum(sig); return peaks(P, 3, 1e-3).sort((a, b) => b.p - a.p).map(q => q.k/(N*dt)); };
  const f = top(only)[0];
  check("Mareas", "periodo de la marea lunar (M2)", 24/f, 12.4206, 0.003, " h");
  const fs = top(both).sort((a, b) => a - b).filter(x => x > 1.5);   // los dos picos semidiurnos: M2 y S2
  const fS2 = fs.reduce((b, x) => Math.abs(x - 2) < Math.abs(b - 2) ? x : b);
  check("Mareas", "periodo de la marea solar (S2)", 24/fS2, 12.0, 0.003, " h");
  check("Mareas", "ciclo de mareas vivas y muertas (1/(f_S2 − f_M2))", 1/(fS2 - f), 14.765, 0.01, " días");
  // Rango máximo y mínimo en el ecuador: vivas = 1,5·(A_L + A_S), muertas = 1,5·(A_L − A_S) (eje recto, Luna sin inclinar).
  let hi = -9, lo = 9; for (const v of both){ hi = Math.max(hi, v); lo = Math.min(lo, v); }
  check("Mareas", "marea más alta en el ecuador (vivas: A_L + A_S)", hi, M.A_MOON + M.A_SUN, 0.02, " m");
};
if (require.main === module){ module.exports(); require("./util").summary(); }
