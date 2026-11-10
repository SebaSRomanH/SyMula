// Bola de agua (dibujo animado): las ondas sobre la esfera y la marea que levanta la masa.
// Armónicos esféricos ortonormales, marea de equilibrio con todos los grados l = 2…12 contra la fórmula
// cerrada (suma de η_l·P_l) y frecuencias de Kelvin de cada modo.
"use strict";
const {read, build, check} = require("./util");
const S = read("mareas.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))],
  "shAll, NK, LMAX, tideCoefs, stepModes, omega2, etaEq, loveH, relAcc, M_BALL, tidalRadial, tideScale");

// P_l(x) por la recurrencia de Bonnet, para comparar la suma de armónicos con la fórmula directa.
function legendre(l, x){ let p0 = 1, p1 = x; if (l === 0) return 1; for (let n = 2; n <= l; n++){ const p2 = ((2*n - 1)*x*p1 - (n - 1)*p0)/n; p0 = p1; p1 = p2; } return p1; }

module.exports = function(){
  // 1) Armónicos ortonormales: ∫ Y_a·Y_b dΩ = δ_ab
  {
    const NT = 200, NP = 400, G = new Float64Array(M.NK*M.NK), Y = new Float64Array(M.NK);
    for (let j = 0; j < NT; j++){ const th = (j + 0.5)/NT*Math.PI, w = Math.sin(th)*(Math.PI/NT)*(2*Math.PI/NP);
      for (let i = 0; i < NP; i++){ const ph = i/NP*2*Math.PI; M.shAll(Math.sin(th)*Math.cos(ph), Math.cos(th), Math.sin(th)*Math.sin(ph), Y);
        for (let a = 0; a < M.NK; a++){ const ya = Y[a]*w; for (let b = a; b < M.NK; b++) G[a*M.NK + b] += ya*Y[b]; } } }
    let dmax = 0, omax = 0; for (let a = 0; a < M.NK; a++) for (let b = a; b < M.NK; b++){ const v = G[a*M.NK + b]; if (a === b) dmax = Math.max(dmax, Math.abs(v - 1)); else omax = Math.max(omax, Math.abs(v)); }
    check("Bola de agua", "armónicos: ∫Y² dΩ = 1 (peor caso, l ≤ 12)", 1 + dmax, 1, 1e-3);
    check("Bola de agua", "armónicos: ∫Y_a·Y_b dΩ = 0 (peor caso)", 1 + omax, 1, 1e-3);
  }
  // 2) Número de Love de una esfera líquida: h₂ = 5/2
  check("Bola de agua", "número de Love h₂ de un líquido", M.loveH(2), 2.5, 1e-12);
  // 3) Marea de equilibrio: la superficie converge a Σ η_l·P_l(n·u); se compara en tres puntos.
  {
    const a = new Float64Array(M.NK), v = new Float64Array(M.NK), eq = new Float64Array(M.NK), u = [1, 0, 0], s = 0.8, dd = 1.6;
    M.tideCoefs(s, dd, u, eq); for (let k = 0; k < 60000; k++) M.stepModes(a, v, eq, 0.002, 0.5);
    for (const [name, n] of [["bajo la masa", [1, 0, 0]], ["en el lado opuesto", [-1, 0, 0]], ["a 90°", [0, 1, 0]]]){
      const Y = M.shAll(...n); let h = 0; for (let k = 4; k < M.NK; k++) h += a[k]*Y[k];
      const c = n[0]*u[0] + n[1]*u[1] + n[2]*u[2]; let want = 0; for (let l = 2; l <= M.LMAX; l++) want += M.etaEq(l, s, dd)*legendre(l, c);
      check("Bola de agua", `marea de equilibrio ${name} (planeta a 1,6 radios)`, h, want, 2e-3, " radios");
    }
  }
  // 4) Frecuencias de Kelvin: periodo de los modos l = 2 y l = 6 sin roce
  for (const l of [2, 6]){
    const a = new Float64Array(M.NK), v = new Float64Array(M.NK), eq = new Float64Array(M.NK), k = l*l + l; a[k] = 0.01;
    let last = a[k], cross = [], t = 0, h = 0.0005;
    for (let s = 0; s < 40000; s++){ M.stepModes(a, v, eq, h, 0); t += h; if (last < 0 && a[k] >= 0) cross.push(t); last = a[k]; }
    check("Bola de agua", `periodo del modo l = ${l} (Kelvin)`, (cross[cross.length-1] - cross[0])/(cross.length - 1), 2*Math.PI/Math.sqrt(M.omega2(l)), 1e-3, " s");
  }
  // 5) Masa suelta: órbita circular de dos cuerpos a 2,3 radios (leapfrog con el paso del simulador).
  {
    const s0 = 0.8, r0 = 2.3, vc = Math.sqrt(M.M_BALL*(1 + s0)/r0), P = [r0, 0, 0], V = [0, 0, vc], h = 0.003;
    const T = 2*Math.PI*r0/vc; let rmin = 9, rmax = 0, t = 0;
    while (t < 5*T){ let a = M.relAcc(s0, ...P); for (let i = 0; i < 3; i++){ V[i] += a[i]*h/2; P[i] += V[i]*h; } a = M.relAcc(s0, ...P); for (let i = 0; i < 3; i++) V[i] += a[i]*h/2; t += h; const r = Math.hypot(...P); rmin = Math.min(rmin, r); rmax = Math.max(rmax, r); }
    check("Bola de agua", "órbita circular de la masa suelta: radio mínimo en 5 vueltas", rmin, r0, 1e-3, " radios");
    check("Bola de agua", "órbita circular de la masa suelta: radio máximo en 5 vueltas", rmax, r0, 1e-3, " radios");
  }
  // 6) Fuerza de marea del color: lejos de la masa, bajo ella vale 2GM/d³ y a 90° −GM/d³ (razón −2).
  {
    const P = [300, 0, 0], up = M.tidalRadial(1, 0, 0, P), side = M.tidalRadial(0, 1, 0, P);
    check("Bola de agua", "fuerza de marea bajo la masa (2GM/d³)", up, 2/Math.pow(300, 3), 0.01);
    check("Bola de agua", "fuerza de marea a 90° (−GM/d³)", side, -1/Math.pow(300, 3), 0.01);
    const [ap, an] = M.tideScale(2.5);
    check("Bola de agua", "escala +: igual a la fuerza bajo la masa", ap, M.tidalRadial(1, 0, 0, [2.5, 0, 0]), 1e-9);
    check("Bola de agua", "escala −: igual a la fuerza a 90°", -an, M.tidalRadial(0, 1, 0, [2.5, 0, 0]), 1e-9);
  }
};
if (require.main === module){ module.exports(); require("./util").summary(); }
