// Lago: densidad del agua (máxima a 4 °C), hielo que flota y lago que se congela por arriba.
"use strict";
const {read, build, check} = require("./util");
const S = read("lago.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))],
  "L, rhoWater, rhoOther, RHO_ICE, temp, iceFrac, iceH, makeLake, stepLake, dropCube");

// Columna del medio: filas de hielo, temperatura del agua más honda y si hay hielo en el fondo.
function column(lk){
  const i = lk.nx >> 1; let ice = 0, deep = -1, top = -1, iceBottom = 0;
  for (let j = 0; j < lk.ny; j++){
    const c = j*lk.nx + i; if (lk.ground[c]) break;
    if (M.iceFrac(lk.h[c]) >= 0.5){ ice++; if (top >= 0 || j > lk.ny/2) iceBottom++; } else { if (top < 0) top = j; deep = j; }
  }
  return {ice, iceBottom, Tdeep: deep >= 0 ? M.temp(lk.h[deep*lk.nx + i]) : NaN, Ttop: top >= 0 ? M.temp(lk.h[top*lk.nx + i]) : NaN};
}
module.exports = function(){
  // 1) Densidad: máxima cerca de 4 °C y valores de tabla
  let best = 0; for (let T = 0; T <= 10; T += 0.001) if (M.rhoWater(T) > M.rhoWater(best)) best = T;
  check("Lago", "densidad máxima del agua (°C)", best, 3.98, 0.005);
  check("Lago", "densidad a 0 °C (kg/m³)", M.rhoWater(0), 999.8428, 1e-6);
  check("Lago", "densidad a 20 °C (kg/m³)", M.rhoWater(20), 998.2067, 1e-6);
  check("Lago", "el hielo flota: ρ_hielo/ρ_agua(0 °C)", M.RHO_ICE/M.rhoWater(0), 0.9168, 1e-3);
  check("Lago", "otro líquido: más denso a 0 °C que a 4 °C", M.rhoOther(0) > M.rhoOther(4) ? 1 : 0, 1, 0);
  // 2) Entalpía: hielo a −10 °C y mezcla a 0 °C con la mitad congelada
  check("Lago", "hielo a −10 °C: temperatura", M.temp(M.iceH(-10)), -10, 1e-12);
  check("Lago", "mezcla: la mitad es hielo a 0 °C", M.iceFrac(-M.L/2) + M.temp(-M.L/2), 0.5, 1e-12);
  // 3) Invierno con agua de verdad: hielo arriba y fondo cerca de 4 °C
  {
    const lk = M.makeLake(72, 48, 10);
    for (let s = 0; s < 8000; s++) M.stepLake(lk, 1, -10);
    const col = column(lk);
    check("Lago", "agua: hay hielo arriba (filas en el medio > 0)", col.ice > 0 ? 1 : 0, 1, 0);
    check("Lago", "agua: nada de hielo en el fondo", col.iceBottom, 0, 0);
    check("Lago", "agua: el fondo queda cerca de 4 °C", col.Tdeep, 4, 0.1);
    check("Lago", "agua: bajo el hielo, más frío que el fondo", col.Ttop < col.Tdeep ? 1 : 0, 1, 0);
  }
  // 4) El mismo invierno con un líquido común: se congela desde el fondo
  {
    const lk = M.makeLake(72, 48, 10); lk.mode = "otro";
    for (let s = 0; s < 2000; s++) M.stepLake(lk, 1, -10);
    const col = column(lk), surf = M.iceFrac(lk.h[lk.nx >> 1]);
    check("Lago", "otro líquido: el fondo se congela primero", col.iceBottom > 0 && surf < 0.5 ? 1 : 0, 1, 0);
  }
  // 5) Cubo de hielo: flota en el agua y se hunde en el otro líquido
  for (const mode of ["agua", "otro"]){
    const lk = M.makeLake(72, 48, 15); lk.mode = mode; M.dropCube(lk, 36, 16, 8, -10);
    for (let s = 0; s < 120; s++) M.stepLake(lk, 1, 15);
    let jmin = 99, jmax = -1;
    for (let c = 0; c < lk.h.length; c++) if (!lk.ground[c] && M.iceFrac(lk.h[c]) >= 0.5){ const j = (c/lk.nx) | 0; jmin = Math.min(jmin, j); jmax = Math.max(jmax, j); }
    if (mode === "agua") check("Lago", "el cubo sube hasta la superficie (fila de arriba)", jmin, 0, 0);
    else check("Lago", "en el otro líquido el cubo se hunde (más abajo de la fila 30)", jmax > 30 ? 1 : 0, 1, 0);
  }
};
if (require.main === module){ module.exports(); process.exitCode = require("./util").summary() ? 1 : 0; }
