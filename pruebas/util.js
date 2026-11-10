// Herramientas de las pruebas: sacan funciones y constantes directamente de los archivos HTML, así se
// prueba el mismo código que corre en el navegador (no una copia).
"use strict";
const fs = require("fs"), path = require("path");

const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

// Texto completo de "function nombre(...) { ... }" (cuenta llaves para encontrar el final).
function fn(src, name){
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("No encontré la función " + name);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++){
    if (src[k] === "{") d++;
    else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1);
  }
  throw new Error("Llaves sin cerrar en " + name);
}
// Línea que empieza con "const nombre" (o el texto que calce con la expresión dada).
function line(src, re){
  const m = src.match(re);
  if (!m) throw new Error("No encontré " + re);
  return m[0];
}
// Arma un módulo: código previo (variables de apoyo) + trozos extraídos + lo que se devuelve.
function build(parts, ret){ return new Function(parts.join("\n") + "\nreturn {" + ret + "};")(); }

// Resultado de una comparación: valor medido, valor esperado, error relativo y si pasa la tolerancia.
const results = [];
function check(sim, what, got, want, tol, unit = ""){
  const err = Math.abs(got - want)/Math.max(Math.abs(want), 1e-12), ok = err <= tol;
  results.push({sim, what, got, want, err, tol, ok});
  const f = v => Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(4) : v.toFixed(5);
  console.log(`${ok ? "OK   " : "FALLA"} ${sim} · ${what}: ${f(got)}${unit} (esperado ${f(want)}${unit}) error ${(100*err).toFixed(3)} % (tolerancia ${+(100*tol).toPrecision(2)} %)`);
  return ok;
}
function summary(){
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length} de ${results.length} comprobaciones dentro de la tolerancia.`);
  return bad.length;
}

// FFT de una señal real (relleno con ceros hasta potencia de 2); devuelve la potencia por frecuencia.
function spectrum(sig){
  let N = 1; while (N < sig.length) N <<= 1;
  const re = new Float64Array(N), im = new Float64Array(N), mean = sig.reduce((a, b) => a + b, 0)/sig.length;
  for (let i = 0; i < sig.length; i++) re[i] = (sig[i] - mean)*(0.5 - 0.5*Math.cos(2*Math.PI*i/(sig.length - 1)));   // ventana de Hann
  for (let i = 1, j = 0; i < N; i++){ let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j){ [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= N; len <<= 1){
    const a = -2*Math.PI/len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < N; i += len){ let cr = 1, ci = 0;
      for (let k = 0; k < len/2; k++){ const p = i + k, q = p + len/2, tr = re[q]*cr - im[q]*ci, ti = re[q]*ci + im[q]*cr;
        re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti; const t = cr*wr - ci*wi; ci = cr*wi + ci*wr; cr = t; } }
  }
  const P = new Float64Array(N/2); for (let k = 0; k < N/2; k++) P[k] = re[k]*re[k] + im[k]*im[k];
  return {P, N};
}
// Picos de un espectro con interpolación parabólica sobre ln P; devuelve índices fraccionarios.
function peaks(P, from = 2, rel = 1e-4){
  let max = 0; for (let k = from; k < P.length; k++) max = Math.max(max, P[k]);
  const out = [];
  for (let k = Math.max(from, 1); k < P.length - 1; k++) if (P[k] > P[k-1] && P[k] >= P[k+1] && P[k] > rel*max){
    const a = Math.log(P[k-1]), b = Math.log(P[k]), c = Math.log(P[k+1]), den = a - 2*b + c;
    out.push({k:k + (den ? 0.5*(a - c)/den : 0), p:P[k]});
  }
  return out;
}
module.exports = {read, fn, line, build, check, summary, spectrum, peaks, results};
