/* eslint-env mocha */

// set timezone for `Date()` tests
process.env.TZ = 'Europe/Brussels';

const virtualTime = require('..');
const { assert } = require('chai');

describe('virtualTime', function () {
  afterEach(function () {
    virtualTime.uninstall();
  });

  it('overwrites Date.now() with default 0', function () {
    virtualTime.install({ addExecutionTime: false });
    assert.strictEqual(Date.now(), 0);
    virtualTime.uninstall();
    assert.notStrictEqual(Date.now(), 0);
  });

  it('overwrites Date.now() with provided value', function () {
    virtualTime.install({ time: 12345, addExecutionTime: false });
    assert.strictEqual(Date.now(), 12345);
    virtualTime.uninstall();
    assert.notStrictEqual(Date.now(), 12345);
  });

  it('overwrites new Date() with default 0', function () {
    virtualTime.install({ addExecutionTime: false });
    assert.strictEqual(new Date().valueOf(), 0);
    virtualTime.uninstall();
    assert.notStrictEqual(new Date().valueOf(), 0);
  });

  it('overwrites new Date() with provided value', function () {
    virtualTime.install({ time: 12345, addExecutionTime: false });
    assert.strictEqual(new Date().valueOf(), 12345);
    virtualTime.uninstall();
    assert.notStrictEqual(new Date().valueOf(), 12345);
  });

  it('doesn\'t affect other versions of Date constructor', function () {
    virtualTime.install({ time: 12345, addExecutionTime: false });
    assert.strictEqual(new Date(67890).valueOf(), 67890);
  });

  it('overwrites Date() with default 0', function () {
    virtualTime.install({ addExecutionTime: false });
    assert.strictEqual(Date(), 'Thu Jan 01 1970 01:00:00 GMT+0100 (CET)');
    virtualTime.uninstall();
    assert.notStrictEqual(Date(), 'Thu Jan 01 1970 01:00:00 GMT+0100 (CET)');
  });

  it('overwrites Date() with provided value', function () {
    virtualTime.install({ time: 1234567890, addExecutionTime: false });
    assert.strictEqual(Date(), 'Thu Jan 15 1970 07:56:07 GMT+0100 (CET)');
    virtualTime.uninstall();
    assert.notStrictEqual(Date(), 'Thu Jan 15 1970 07:56:07 GMT+0100 (CET)');
  });

  it('can set a timeout', function (done) {
    this.timeout(1000);
    virtualTime.install();
    let asyncCheck = false;
    setTimeout(() => {
      assert(asyncCheck, 'timeout should work asynchronously');
      done();
    }, 10000);
    asyncCheck = true;
  });

  it('can clear a timeout', function (done) {
    this.timeout(1000);
    virtualTime.install();
    let timeout = setTimeout(() => {
      assert.fail();
    }, 10000);
    clearTimeout(timeout);

    // use native setTimeout again to end the test
    virtualTime.uninstall();
    setTimeout(done, 0);
  });

  it('can clear a timeout while another is running', function (done) {
    this.timeout(1000);
    virtualTime.install();
    let timeout = setTimeout(() => {
      assert.fail();
    }, 10000);
    setTimeout(() => {
      done();
    }, 20000);
    clearTimeout(timeout);
  });

  it('processes timeouts in order', function (done) {
    this.timeout(1000);
    virtualTime.install({ time: 500, addExecutionTime: false });
    let result = [];
    setTimeout(() => {
      assert.strictEqual(Date.now(), 10500);
      result.push(1);
    }, 10000);
    setTimeout(() => {
      assert.strictEqual(Date.now(), 50500);
      result.push(2);
    }, 50000);
    setTimeout(() => {
      assert.strictEqual(Date.now(), 30500);
      result.push(3);
    }, 30000);
    setTimeout(() => {
      assert.strictEqual(Date.now(), 100500);
      result.push(4);
      assert.deepEqual(result, [5, 1, 3, 2, 4]);
      done();
    }, 100000);
    setTimeout(() => {
      assert.strictEqual(Date.now(), 1500);
      result.push(5);
    }, 1000);
  });

  it('executes in order with setImmediate', function (done) {
    virtualTime.install();
    let result = [];
    setImmediate(() => result.push('setImmediate 1'));
    setTimeout(() => {
      assert.deepEqual(result, ['setImmediate 1', 'setImmediate 2']);
      done();
    }, 0);
    setImmediate(() => result.push('setImmediate 2'));
  });

  it('processes nested timeouts', function (done) {
    this.timeout(1000);
    let result = [];
    virtualTime.install({ addExecutionTime: false });
    setTimeout(() => {
      result.push(Date.now());
      setTimeout(() => {
        result.push(Date.now());
        setTimeout(() => {
          result.push(Date.now());
          assert.deepEqual(result, [10000, 15000, 18000, 19000]);
          done();
        }, 4000);
      }, 5000);
      setTimeout(() => {
        result.push(Date.now());
      }, 8000);
    }, 10000);
  });

  it('can do setInterval', function (done) {
    this.timeout(1000);
    let result = [];
    virtualTime.install({ addExecutionTime: false });
    let interval = setInterval(() => {
      result.push(Date.now());
      if (result.length >= 5) {
        clearInterval(interval);
        assert.deepEqual(result, [ 10000, 20000, 30000, 40000, 50000 ]);
        done();
      }
    }, 10000);
  });

  it('can do multiple setInterval', function (done) {
    this.timeout(1000);
    let count = 0;
    virtualTime.install();
    let interval1 = setInterval(() => {
      count += 1;
      if (count >= 5) {
        clearInterval(interval1);
        done();
      }
    }, 10000);
    let interval2 = setInterval(() => { }, 10000);
    clearInterval(interval2);
  });
});
