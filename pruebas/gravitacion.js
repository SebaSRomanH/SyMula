// Gravitación: el integrador del simulador (stepC, substeps) y el láser (traceRay) contra la teoría.
"use strict";
const {read, fn, line, build, check} = require("./util");
const S = read("gravitacion.html");
const G = build([
  "let n = 2, mode = 'central', bodies = [], scale = 100, camX = 0, camY = 0, Wd = 100*90, Hd = 100*20;",
  line(S, /const DT = [^;]+;/), line(S, /const ETA = [^;]+;/), line(S, /const radius = [^;]+;/),
  line(S, /const C_LUZ = [\s\S]*?const sunR = [^;]+;/), line(S, /const tDynC = [^;]+;/), line(S, /const phi = [^;]+;/),
  "const shownMass = b => b.m; function setPw(v){ pw = v; }",
  fn(S, "accC"), fn(S, "stepC"), fn(S, "substeps"), fn(S, "traceRay")
], "DT, ETA, SUN_R, C_LUZ, accC, stepC, substeps, tDynC, traceRay, setPw, rsOf, vcirc, sunR, phi");

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
  // 5) Agujero negro (Paczyński–Wiita): a = 1/(r − rₛ)², rₛ = 2/c².
  G.setPw(true);
  try {
    const rs = G.rsOf(1), eBH = p => (p.vx*p.vx + p.vy*p.vy)/2 + G.phi(Math.hypot(p.x, p.y));
    // Órbita excéntrica que parte del punto más lejano (r = 1): energía y giro del punto más cercano por vuelta.
    const p = {x:1, y:0, vx:0, vy:0.75*G.vcirc(1, 1)}, E0 = eBH(p), L = p.vy;
    let emax = 0, lastVr = 0, apos = [];
    orbit(p, Math.round(6*2*Math.PI/0.015), q => {
      emax = Math.max(emax, Math.abs(eBH(q) - E0));
      const vr = q.x*q.vx + q.y*q.vy; if (lastVr > 0 && vr <= 0) apos.push(Math.atan2(q.y, q.x)); lastVr = vr;
    });
    check("Agujero negro", "energía de una órbita excéntrica (peor caso en 6 vueltas)", E0 + emax, E0, 2e-3);
    let adv = 0; for (let i = 1; i < apos.length; i++){ let d = apos[i] - apos[i-1]; while (d < 0) d += 2*Math.PI; adv += d; }
    adv /= apos.length - 1;
    // Teoría: Δφ = 2∫ L/r² / √(2(E − φ) − L²/r²) dr de r_min a r_max, menos 2π (r = c − w·cos u quita las raíces).
    const F = r => 2*(E0 - G.phi(r)) - L*L/(r*r);
    let lo = rs*1.5, hi = 0.999; for (let k = 0; k < 200; k++){ const m = (lo + hi)/2; if (F(m) > 0) hi = m; else lo = m; }
    const rp = hi, ra = 1, c = (ra + rp)/2, w = (ra - rp)/2, N = 20000;
    let I = 0; for (let k = 0; k < N; k++){ const u = Math.PI*(k + 0.5)/N, r = c - w*Math.cos(u); I += L/(r*r)/Math.sqrt(Math.max(1e-300, F(r)))*w*Math.sin(u)*Math.PI/N; }
    check("Agujero negro", "giro del punto más lejano por vuelta", adv, 2*I - 2*Math.PI, 2e-3, " rad");
    // Última órbita estable: L² = r³/(r − rₛ)² tiene su mínimo en r = 3 rₛ.
    let best = 0, Lmin = Infinity; for (let r = 1.5*rs; r < 10*rs; r += rs*1e-4){ const l = r*G.vcirc(r, 1); if (l < Lmin){ Lmin = l; best = r; } }
    check("Agujero negro", "radio de la última órbita estable (mínimo de L), en rₛ", best/rs, 3, 1e-3);
    // Con 1 % menos de rapidez: a 4,5 rₛ sigue en órbita; a 2,6 rₛ cae (1/r² puro nunca caería).
    const fall = r0 => { const q = {x:r0, y:0, vx:0, vy:0.99*G.vcirc(r0, 1)}; [q.ax, q.ay] = G.accC(q.x, q.y);
      for (let f = 0; f < 2000; f++){ const [k, h] = G.substeps(0.015, G.tDynC(q)); for (let s = 0; s < k; s++){ G.stepC(q, h); if (Math.hypot(q.x, q.y) < G.sunR()) return 1; } } return 0; };
    check("Agujero negro", "a 4,5 rₛ con 1 % menos de rapidez sigue en órbita (0 = no cae)", fall(4.5*rs), 0, 0);
    check("Agujero negro", "a 2,6 rₛ con 1 % menos de rapidez cae (1 = cae)", fall(2.6*rs), 1, 0);
  } finally { G.setPw(false); }
};
if (require.main === module){ module.exports(); require("./util").summary(); }
