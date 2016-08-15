const virtualTime = require('..');
let realNow = Date.now;
virtualTime.install();

let startTimeReal = realNow();
let startTimeVirtual = Date.now();

setTimeout(() => {
  let durationReal = realNow() - startTimeReal;
  let durationVirtual = Date.now() - startTimeVirtual;
  console.log(`Real duration: ${durationReal}ms; Virtual duration: ${durationVirtual}ms`);
}, 100000);
