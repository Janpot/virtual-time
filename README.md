# virtual-time

Fast forward the event loop when it runs out of work

When installed, this library overwrites `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` and `Date` functionality.
It will fast forward the timers on the event loop whenever it is idle.

[![Build Status](https://travis-ci.org/Janpot/virtual-time.svg?branch=master)](https://travis-ci.org/Janpot/virtual-time)

## Example

```js
const virtualTime = require('virtual-time');
let realNow = Date.now;
virtualTime.install();

let startTimeReal = realNow();
let startTimeVirtual = Date.now();

setTimeout(() => {
  let durationReal = realNow() - startTimeReal;
  let durationVirtual = Date.now() - startTimeVirtual;
  console.log(`Real duration: ${durationReal}ms; Virtual duration: ${durationVirtual}ms`);
}, 100000);
```

## API

### `.install( [Object options] )`

This will install the library.

#### `options`

##### `number time`

Default `0`. The time in milliseconds of when the clock starts.

##### `boolean addExecutionTime`

Default `true`. This option makes it so execution time is calculated in the `Date.now()` call.
Disable this option if you need deterministic `Date.now()` behavior.

### `.uninstall()`

This will restore the timer functions to their normal state.

