// Fluidos (Lattice Boltzmann D2Q9 + Smagorinsky): el paso step() de cada simulador contra resultados
// clásicos. Tubo: perfil parabólico de Poiseuille y número de Strouhal del cilindro a Re = 100.
// Piscina: la onda de presión viaja a la velocidad del sonido de la red, c_s = 1/√3.
"use strict";
const {read, fn, line, build, check, spectrum, peaks} = require("./util");

function tube(NXv, NYv, nuv, Uv, circle){
  const S = read("flujo-tubo.html");
  return build([
    line(S, /const EX = [^;]+;/), line(S, /const W = [^;]+;/), line(S, /const CS2 = [^;]+;/),
    `let NX = ${NXv}, NY = ${NYv}, N = NX*NY, nu = ${nuv}, U = ${Uv};`,
    "let f = new Float32Array(9*N), g = new Float32Array(9*N), rho = new Float32Array(N), ux = new Float32Array(N), uy = new Float32Array(N), bar = new Uint8Array(N);",
    fn(S, "setEq"), fn(S, "initFlow"), fn(S, "step"),
    `function init(){
      for (let x = 0; x < NX; x++){ bar[x] = 1; bar[x + (NY-1)*NX] = 1; }
      ${circle ? `for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) if ((x+0.5-${circle.x})**2 + (y+0.5-${circle.y})**2 < ${circle.r}**2) bar[x+y*NX] = 1;` : ""}
      initFlow();
    }`
  ], "init, step, ux, uy, rho, bar, get NX(){ return NX; }");
}

module.exports = function(){
  // 1) Poiseuille: canal sin obstáculos (40 celdas de fluido; con rebote la pared queda a media celda).
  {
    const NY = 42, H = 40, T = tube(500, NY, 0.1, 0.05);
    T.init(); for (let s = 0; s < 30000; s++) T.step();
    const x = 380, u = []; for (let y = 1; y < NY-1; y++) u.push(T.ux[x + y*500]);
    const mean = u.reduce((a, b) => a + b, 0)/u.length, max = Math.max(...u);
    let e2 = 0, n2 = 0;
    u.forEach((v, k) => { const yy = k + 0.5, ex = 1.5*mean*(1 - ((2*yy - H)/H)**2); e2 += (v - ex)**2; n2 += ex*ex; });
    check("Flujo en un tubo", "Poiseuille: velocidad máxima / media", max/mean, 1.5, 0.01);
    check("Flujo en un tubo", "Poiseuille: diferencia con la parábola (RMS relativa)", 1 + Math.sqrt(e2/n2), 1, 0.01);
  }
  // 2) Cilindro a Re = U·D/ν = 100: frecuencia de los remolinos, St = f·D/U. Referencia (Williamson):
  //    St = 0,2175 − 5,1064/Re = 0,166 sin paredes; con las paredes del tubo (bloqueo del 12,5 %) sube algo.
  {
    const NX = 640, NY = 162, D = 20, U = 0.06, Re = 100, cx = 120, cy = NY*0.493;
    const T = tube(NX, NY, U*D/Re, U, {x:cx, y:cy, r:D/2});
    T.init();
    const probe = Math.round(cx + 3*D) + Math.round(cy)*NX, sig = [];
    for (let s = 0; s < 70000; s++){ T.step(); if (s >= 30000) sig.push(T.uy[probe]); }
    const {P, N} = spectrum(sig), pk = peaks(P, 3, 1e-3).sort((a, b) => b.p - a.p)[0];
    const St = pk.k/N*D/U, ref = 0.2175 - 5.1064/Re;
    check("Flujo en un tubo", "número de Strouhal del cilindro a Re = 100 (bloqueo 12,5 %)", St, ref, 0.10);
  }
  // 3) Piscina: un pulso de presión en el centro; el frente llega a 60 celdas en 60/c_s pasos.
  {
    const S = read("flujo-tactil.html"), NXv = 220, NYv = 220;
    const P = build([
      line(S, /const NU = [^;]+;/), "const EX=[0,1,0,-1,0,1,-1,-1,1], EY=[0,0,1,0,-1,1,1,-1,-1];", line(S, /const W=\[[^;]+;/),
      `let NX = ${NXv}, NY = ${NYv}, N = NX*NY;`,
      "let f = new Float32Array(9*N), g = new Float32Array(9*N), rho = new Float32Array(N), ux = new Float32Array(N), uy = new Float32Array(N), bar = new Uint8Array(N);",
      fn(S, "setEq"), fn(S, "step"),
      `function init(){
        for (let x = 0; x < NX; x++){ bar[x] = 1; bar[x+(NY-1)*NX] = 1; } for (let y = 0; y < NY; y++){ bar[y*NX] = 1; bar[NX-1+y*NX] = 1; }
        for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++){ const d2 = (x-110)**2 + (y-110)**2; setEq(x+y*NX, 1 + 0.002*Math.exp(-d2/8), 0, 0); }
      }`
    ], "init, step, rho");
    P.init(); let best = -1, tb = 0;
    for (let s = 1; s <= 160; s++){ P.step(); const v = P.rho[170 + 110*NXv]; if (v > best){ best = v; tb = s; } }
    check("Piscina táctil", "velocidad de la onda de presión (celdas por paso)", 60/tb, 1/Math.sqrt(3), 0.03);
  }
};
if (require.main === module){ module.exports(); require("./util").summary(); }
