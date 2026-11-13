// Corre todas las pruebas: node pruebas/todas.js  (la de fluidos tarda varios minutos: node pruebas/todas.js --rapido la omite)
"use strict";
const u = require("./util"), rapido = process.argv.includes("--rapido");
for (const name of ["gravitacion", "ondas-sonoras", "mareas", "fractales", "lissajous", "radio", ...(rapido ? [] : ["fluidos"])]){
  console.log(`\n== ${name}`); require("./" + name)();
}
process.exitCode = u.summary() ? 1 : 0;
