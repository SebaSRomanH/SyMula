// Bola de agua: deformación de marea de una esfera líquida (número de Love h₂ = 5/2), límite de Roche
// y oscilación propia (modo l = 2 de Kelvin), contra los valores de los libros.
"use strict";
const {read, build, check} = require("./util");
const S = read("mareas.html");
const M = build([S.slice(S.indexOf("// @fisica"), S.indexOf("// @fin-fisica"))], "qEq, roche, W2, HOURS, tidalAcc, GM");

module.exports = function(){
  check("Bola de agua", "unidad de tiempo 1/√(G·ρ_agua)", M.HOURS, 1.0753, 0.002, " h");
  check("Bola de agua", "periodo de la oscilación propia (Kelvin l = 2)", 2*Math.PI/Math.sqrt(M.W2)*M.HOURS, 3.69, 0.01, " h");
  // Estiramiento (a − b)/R = (3/2)·q = (15/4)·(M/m)·(R/d)³; acero a 8 radios:
  check("Bola de agua", "estiramiento con acero a 8 radios", 1.5*M.qEq(7.85, 8), 15/4*7.85/512, 1e-9);
  // Roche de un líquido: 2,44·R·(ρ/ρ_agua)^(1/3); con oro: 2,44·19,32^(1/3) ≈ 6,55
  check("Bola de agua", "límite de Roche con oro", M.roche(19.32), 2.44*Math.cbrt(19.32), 1e-9, " radios");
  check("Bola de agua", "límite de Roche con metano (menos que el contacto: nunca rompe)", M.roche(0.49), 1.92, 0.01, " radios");
  // En el límite de Roche, q no depende del material: (5/2)/2,44³ ≈ 0,172
  check("Bola de agua", "q en el límite de Roche (igual para todo material)", M.qEq(13.53, M.roche(13.53)), 2.5/Math.pow(2.44, 3), 1e-9);
  // Marea sobre una gota: a_x = 2GM·x/d³ (estira) y a_y = −GM·y/d³ (aprieta)
  const [ax, ay] = M.tidalAcc(7.85, 5, 1, 1, 0), k = M.GM(7.85)/125;
  check("Bola de agua", "marea a lo largo del eje x (2GM·x/d³)", ax, 2*k, 1e-12);
  check("Bola de agua", "marea a lo largo del eje y (−GM·y/d³)", ay, -k, 1e-12);
};
if (require.main === module){ module.exports(); require("./util").summary(); }
