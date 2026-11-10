// Gravitación: el integrador del simulador (stepC, substeps) y el láser (traceRay) contra la teoría.
"use strict";
const {read, fn, line, build, check} = require("./util");
const S = read("gravitacion.html");
const G = build([
  "let n = 2, mode = 'central', bodies = [], scale = 100, camX = 0, camY = 0, Wd = 100*90, Hd = 100*20;",
  line(S, /const DT = [^;]+;/), line(S, /const ETA = [^;]+;/), line(S, /const C_LUZ = [^;]+;/),
  line(S, /const invPow = [^;]+;/), line(S, /const radius = [^;]+;/), line(S, /const tDynC = [^;]+;/),
  "const shownMass = b => b.m;",
  fn(S, "accC"), fn(S, "stepC"), fn(S, "substeps"), fn(S, "traceRay")
], "DT, ETA, SUN_R, C_LUZ, accC, stepC, substeps, tDynC, traceRay");

// Avanza un planeta como el bucle del simulador: cuadros de T = 0,015 divididos con substeps.
function orbit(p, frames, onStep){
  [p.ax, p.ay] = G.accC(p.x, p.y);
  for (let f = 0; f < frames; f++){
    const [k, h] = G.substeps(0.015, G.tDynC(p));
    for (let s = 0; s < k; s++){ G.stepC(p, h); onStep && onStep(p, h); }
  }
}
const energy = p => (p.vx*p.vx + p.vy*p.vy)/2 - 1/Math.hypot(p.x, p.y);

module.exports = function(){
  // 1) Órbita circular en r = 1 durante 100 años: energía −1/2 y radio constante.
  {
    const p = {x:1, y:0, vx:0, vy:1}; let emax = 0, rdev = 0;
    orbit(p, Math.round(100*2*Math.PI/0.015), q => { emax = Math.max(emax, Math.abs(energy(q) + 0.5)); rdev = Math.max(rdev, Math.abs(Math.hypot(q.x, q.y) - 1)); });
    check("Gravitación", "energía de la órbita circular (peor caso en 100 años)", -0.5 + emax, -0.5, 1e-4);
    check("Gravitación", "radio de la órbita circular (peor caso en 100 años)", 1 + rdev, 1, 1e-4, " UA");
  }
  // 2) Órbitas elípticas: periodo T = 2π·a^1,5 (3.ª ley) y conservación de la energía.
  for (const [a, e] of [[1, 0.6], [2, 0.3], [0.5, 0.8]]){
    const rp = a*(1 - e), vp = Math.sqrt((1 + e)/(a*(1 - e)));
    const p = {x:rp, y:0, vx:0, vy:vp}, E0 = energy(p); let t = 0, lastY = 0, cross = [], emax = 0;
    orbit(p, Math.round(3.2*2*Math.PI*Math.pow(a, 1.5)/0.015), (q, h) => {
      t += h; emax = Math.max(emax, Math.abs(energy(q) - E0));
      if (lastY < 0 && q.y >= 0) cross.push(t - h*q.y/(q.y - lastY)); lastY = q.y;
    });
    const T = (cross[cross.length-1] - cross[0])/(cross.length - 1);
    check("Gravitación", `periodo con a = ${a} UA, e = ${e} (3.ª ley de Kepler)`, T, 2*Math.PI*Math.pow(a, 1.5), 1e-4);
    check("Gravitación", `energía con a = ${a} UA, e = ${e} (peor caso)`, E0 + emax, E0, 2e-3);
  }
  // 3) Caída libre desde 1 UA en reposo hasta el borde del Sol (solución exacta de Kepler radial).
  {
    const p = {x:1, y:0, vx:0, vy:0}; let t = 0, done = false; [p.ax, p.ay] = G.accC(1, 0);
    while (!done){ const [k, h] = G.substeps(0.015, G.tDynC(p)); for (let s = 0; s < k && !done; s++){ G.stepC(p, h); t += h; if (Math.hypot(p.x, p.y) < G.SUN_R) done = true; } }
    const x = G.SUN_R, theo = Math.sqrt(0.5)*(Math.acos(Math.sqrt(x)) + Math.sqrt(x*(1 - x)));
    check("Gravitación", "tiempo de caída libre desde 1 UA hasta el Sol", t, theo, 0.01, " (unid.)");
  }
  // 4) Láser: desviación de la luz. Campo débil: Δθ = 4M/(c²b) (por el tramo finito ±L se multiplica por
  //    L/√(L²+b²)) más el término de segundo orden (15π/4)·(M/(c²b))², que a 2 UA ya suma un 4 %.
  for (const b of [2, 4, 8]){
    const L = 40, r = G.traceRay(-L, b, 1, 0), pts = r.pts, [x1, y1] = pts[pts.length-6], [x2, y2] = pts[pts.length-1];
    const ang = -Math.atan2(y2 - y1, x2 - x1), q = 1/(G.C_LUZ*G.C_LUZ*b), want = 4*q*(L/Math.hypot(L, b)) + 15*Math.PI/4*q*q;
    check("Gravitación", `láser: desviación al pasar a ${b} UA del Sol`, ang, want, 0.02, " rad");
  }
};
if (require.main === module){ module.exports(); require("./util").summary(); }
