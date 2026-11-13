// Radio AM y FM: el receptor debe recuperar el mensaje; con ruido moderado la FM llega mejor que la AM
// (ventaja de FM sobre su umbral) y con muchísimo ruido ambas se degradan.
"use strict";
const {read, build, check} = require("./util");
const S = read("radio.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))],
  "FS, FC, lowpass, fir, prepare, modulate, channel, demodulate, quality, melody, snrOf");

module.exports = function(){
  const m = M.prepare(M.melody()), p = {mu: 0.8, dev: 5000};
  // 1) el filtro deja pasar 1 kHz y corta 8 kHz
  {
    const h = M.lowpass(3500, M.FS), g = f => { let re = 0, im = 0; h.forEach((v, k) => { re += v*Math.cos(2*Math.PI*f*k/M.FS); im += v*Math.sin(2*Math.PI*f*k/M.FS); }); return Math.hypot(re, im); };
    check("Radio", "filtro: ganancia a 1 kHz", g(1000), 1, 0.01);
    check("Radio", "filtro: ganancia a 8 kHz (casi cero)", 1 + g(8000), 1, 0.01);
  }
  // 2) sin ruido el mensaje vuelve casi igual
  for (const mode of ["am", "fm"]){
    const y = M.demodulate(M.modulate(m, mode, p), mode, p);
    const q = M.quality(m, y);
    check("Radio", `${mode.toUpperCase()} sin ruido: el mensaje vuelve (señal/ruido ≥ 30 dB)`, Math.min(q, 30), 30, 1e-9, " dB");
  }
  // 3) la AM es (1 + μ m) cos: su envolvente máxima es 1 + μ
  {
    const s = M.modulate(m, "am", p); let mx = 0; for (const v of s) mx = Math.max(mx, Math.abs(v));
    check("Radio", "AM: amplitud máxima = 1 + μ", mx, 1 + p.mu, 0.01);
    const f = M.modulate(m, "fm", p); let fm = 0; for (const v of f) fm = Math.max(fm, Math.abs(v));
    check("Radio", "FM: amplitud constante = 1", fm, 1, 1e-9);
  }
  // 4) con el mismo ruido en el aire (20 dB), la FM llega con mejor señal/ruido que la AM
  {
    const qa = M.quality(m, M.demodulate(M.channel(M.modulate(m, "am", p), 20, 11), "am", p));
    const qf = M.quality(m, M.demodulate(M.channel(M.modulate(m, "fm", p), 20, 11), "fm", p));
    console.log(`      AM ${qa.toFixed(1)} dB, FM ${qf.toFixed(1)} dB con 20 dB en el aire`);
    check("Radio", "ventaja de FM sobre AM a 20 dB (FM − AM ≥ 6 dB)", Math.min(qf - qa, 6), 6, 1e-9, " dB");
    // con ruido extremo (−5 dB) ninguna se entiende bien
    const qa2 = M.quality(m, M.demodulate(M.channel(M.modulate(m, "am", p), M.snrOf(100), 5), "am", p));
    const qf2 = M.quality(m, M.demodulate(M.channel(M.modulate(m, "fm", p), M.snrOf(100), 5), "fm", p));
    console.log(`      con ruido al máximo: AM ${qa2.toFixed(1)} dB, FM ${qf2.toFixed(1)} dB`);
    check("Radio", "ruido al máximo: ninguna pasa de 6 dB", Math.max(qa2, qf2, 6), 6, 1e-9, " dB");
  }
};
if (require.main === module){ module.exports(); process.exitCode = require("./util").summary() ? 1 : 0; }
