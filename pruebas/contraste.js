// Contraste WCAG AA de los tokens del sistema de diseño SyMula v1.0 en los tres temas:
// texto ≥ 4,5:1 y componentes o indicadores no textuales ≥ 3:1. Lee los tokens del estilo común.
"use strict";
const {read, check} = require("./util");
const S = read("index.html");
function tokens(sel){
  const m = S.match(new RegExp(sel.replace(/[[\]"=]/g, c => "\\" + c) + "\\{([^}]*)\\}"));
  if (!m) throw new Error("No encontré " + sel);
  const out = {}; for (const [, k, v] of m[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) out[k] = v; return out;
}
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)/255).map(v => v <= 0.03928 ? v/12.92 : Math.pow((v + 0.055)/1.055, 2.4)); return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05)/(Math.min(x, y) + 0.05); };
// check() compara un valor con un esperado; aquí el "esperado" es el mínimo y se pide que no falte.
const atLeast = (theme, what, got, min) => check("Contraste " + theme, what, Math.min(got, min), min, 0, ":1");

module.exports = function(){
  for (const [name, sel] of [["oscuro", ':root[data-theme="dark"]'], ["claro", ':root[data-theme="light"]'], ["nocturno", ':root[data-theme="night"]']]){
    const t = tokens(sel);
    atLeast(name, "texto sobre fondo", ratio(t.text, t.background), 4.5);
    atLeast(name, "texto sobre superficie", ratio(t.text, t.surface), 4.5);
    atLeast(name, "texto secundario sobre superficie", ratio(t["text-muted"], t.surface), 4.5);
    atLeast(name, "texto secundario sobre fondo", ratio(t["text-muted"], t.background), 4.5);
    atLeast(name, "texto del botón principal", ratio(t["primary-text"], t.primary), 4.5);
    atLeast(name, "botón principal contra la superficie (componente)", ratio(t.primary, t.surface), 3);
    atLeast(name, "foco y estado activo (primary) contra el fondo", ratio(t.primary, t.background), 3);
    atLeast(name, "borde de controles contra la superficie", ratio(t["control-border"], t.surface), 3);
    for (const k of Object.keys(t).filter(k => k.startsWith("sem-"))) atLeast(name, `color de datos ${k} contra el fondo`, ratio(t[k], t.background), 3);
  }
};
if (require.main === module){ module.exports(); require("./util").summary(); }
