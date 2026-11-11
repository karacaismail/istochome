"use strict";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const connection = navigator.connection;
let loading = null;
let running = null;
const allowed = () => !reduce.matches && connection?.saveData !== true && document.querySelector("[data-motion-scene]") !== null;
function stop() {
    running?.stop();
    running = null;
}
function start() {
    if (running || !allowed())
        return;
    loading ?? (loading = import("./sahne.js"));
    loading.then((m) => {
        if (!running && allowed())
            running = m.start();
    }, () => {
        loading = null;
    });
}
function sync() {
    if (allowed())
        start();
    else
        stop();
}
reduce.addEventListener("change", sync);
connection?.addEventListener("change", sync);
start();
