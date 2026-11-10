// Sonido: el paso de diferencias finitas del simulador (step) hace vibrar cada sala; se miden sus
// frecuencias con la FFT y se comparan con las fórmulas (rectángulo, círculo con Bessel, triángulo de Lamé).
// También se revisan los ceros de J'_m que calcula el simulador contra los valores de tabla.
"use strict";
const {read, fn, line, build, check, spectrum, peaks} = require("./util");
const S = read("ondas-sonoras.html");

function makeRoom(shape){
  return build([
    line(S, /const C_SOUND = [^;]+;/), line(S, /const LONG = [^;]+;/), line(S, /const DIAM = [^;]+;/),
    line(S, /const SIDE = [^;]+;/), line(S, /const TRI_H = [^;]+;/), line(S, /const ELL_W = [^;]+;/),
    line(S, /const PARA_B = [^;]+;/), line(S, /const PARA_H = [^;]+;/), line(S, /const CELLS = [^;]+;/),
    line(S, /const COUR = [^;]+;/), line(S, /const FMIN = [^;]+;/), line(S, /const D_SRC = [^;]+;/),
    `let shape = "${shape}", rot = false, NX = 0, NY = 0, dx, dt, Wb, Hb, mask, fl, nl, nr, nu, nd, K, p0, p1, p2, en;`,
    "let freq = 100, phase = 0, stepN = 0, beta = 0, srcs = [], besselZeros = null, modes = [], modeToken = 0;",
    "const modeCache = {};",
    line(S, /const DIMS = [^;]+;/), fn(S, "insideL"), "const inside = (X, Y) => insideL(X, Y);",
    fn(S, "J"), line(S, /const dJ = [^;]+;/), fn(S, "computeBesselZeros"), fn(S, "computeModes"), fn(S, "step"),
    `function init(){                                 // la parte de setup() que arma la malla (sin pantalla)
      [Wb, Hb] = DIMS[shape];
      const d0 = Math.sqrt(Wb*Hb/CELLS);
      NX = Math.round(Wb/d0); NY = Math.round(Hb/d0); dx = Wb/NX;
      if (shape === "rect") Hb = NY*dx;
      dt = COUR*dx/C_SOUND;
      const N = NX*NY; mask = new Uint8Array(N);
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) mask[y*NX+x] = inside((x+0.5)*dx, (y+0.5)*dx) ? 1 : 0;
      K = 0; for (let i = 0; i < N; i++) K += mask[i];
      fl = new Int32Array(K); nl = new Int32Array(K); nr = new Int32Array(K); nu = new Int32Array(K); nd = new Int32Array(K);
      let k = 0;
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++){
        const i = y*NX+x; if (!mask[i]) continue;
        fl[k] = i;
        nl[k] = x > 0 && mask[i-1] ? i-1 : i;      nr[k] = x < NX-1 && mask[i+1] ? i+1 : i;
        nu[k] = y > 0 && mask[i-NX] ? i-NX : i;    nd[k] = y < NY-1 && mask[i+NX] ? i+NX : i;
        k++;
      }
      p0 = new Float32Array(N); p1 = new Float32Array(N); p2 = new Float32Array(N); en = new Float32Array(N);
      computeModes();
    }`,
    "function pulse(fx, fy){ for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++){ const d2 = ((x - fx*NX)**2 + (y - fy*NY)**2)/9; const i = y*NX+x; if (mask[i]){ p1[i] = Math.exp(-d2); p0[i] = p1[i]; } } }",
    "function at(fx, fy){ return p1[Math.floor(fy*NY)*NX + Math.floor(fx*NX)]; }"
  ], "init, pulse, at, step, J, dJ, computeBesselZeros, get dt(){ return dt; }, get modes(){ return modes; }, get besselZeros(){ return besselZeros; }, get NX(){ return NX; }, get dx(){ return dx; }, get Hb(){ return Hb; }");
}

// Hace vibrar la sala desde un pulso y devuelve las frecuencias de los picos del espectro.
function measure(R, steps){
  R.init(); R.pulse(0.31, 0.27);
  const probes = [[0.73, 0.61], [0.18, 0.79], [0.55, 0.33]], sig = probes.map(() => new Float64Array(steps));
  for (let s = 0; s < steps; s++){ R.step(); probes.forEach(([x, y], k) => sig[k][s] = R.at(x, y)); }
  let P = null, N = 0;
  for (const g of sig){ const sp = spectrum(g); N = sp.N; if (!P) P = sp.P; else for (let k = 0; k < P.length; k++) P[k] += sp.P[k]; }
  return peaks(P, 2, 1e-5).map(p => p.k/(N*R.dt));
}
const nearest = (list, f) => list.reduce((b, x) => Math.abs(x - f) < Math.abs(b - f) ? x : b, Infinity);

module.exports = function(){
  // 1) Ceros de J'_m calculados por el simulador (pared rígida del círculo) contra la tabla.
  {
    const R = makeRoom("circle"); R.computeBesselZeros();
    const z = (m, s) => R.besselZeros.filter(q => q.m === m)[s-1].x;
    for (const [m, s, v] of [[1, 1, 1.841184], [2, 1, 3.054237], [0, 1, 3.831706], [3, 1, 4.201189], [1, 2, 5.331443], [0, 2, 7.015587]])
      check("Sonido", `cero j'(${m},${s}) de Bessel`, z(m, s), v, 1e-4);
  }
  // 2) Sala rectangular: picos medidos contra la fórmula del simulador y contra c/2·√((m/Lx)²+(n/Ly)²).
  {
    const R = makeRoom("rect"), got = measure(R, 40000), Lx = 5, Ly = R.Hb;
    for (const [m, n] of [[1, 0], [0, 1], [1, 1], [2, 0], [2, 1], [0, 2]]){
      const fc = 343/2*Math.hypot(m/Lx, n/Ly), fs = R.modes.find(q => q.a === m && q.b === n).f;
      check("Sonido", `sala 5 × 3,5 m, modo (${m},${n}) medido vs fórmula del simulador`, nearest(got, fs), fs, 0.005, " Hz");
      check("Sonido", `sala 5 × 3,5 m, modo (${m},${n}) fórmula del simulador vs c/2·√(…)`, fs, fc, 0.002, " Hz");
    }
  }
  // 3) Sala circular de 4,5 m: picos medidos contra f = c·j'/(2πa) (el borde en escalones agrega error).
  {
    const R = makeRoom("circle"), got = measure(R, 40000), a = 2.25;
    for (const [lbl, j] of [["(1,1)", 1.841184], ["(2,1)", 3.054237], ["(0,1)", 3.831706], ["(3,1)", 4.201189]]){
      const f = 343*j/(2*Math.PI*a);
      check("Sonido", `sala circular, modo ${lbl}`, nearest(got, f), f, 0.01, " Hz");
    }
  }
  // 4) Sala triangular equilátera de 5 m: picos medidos contra Lamé f = (2c/3L)·√(m²+mn+n²).
  {
    const R = makeRoom("tri"), got = measure(R, 40000);
    for (const [m, n] of [[1, 0], [1, 1], [2, 0], [2, 1]]){
      const f = 2*343/(3*5)*Math.sqrt(m*m + m*n + n*n);
      check("Sonido", `sala triangular, modo (${m},${n})`, nearest(got, f), f, 0.01, " Hz");
    }
  }
};
if (require.main === module){ module.exports(); require("./util").summary(); }
