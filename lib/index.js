let NativeDate = global.Date;
let nativeDateNow = global.Date.now;
let nativeSetTimeout = global.setTimeout;
let nativeClearTimeout = global.clearTimeout;
let nativeSetInterval = global.setInterval;
let nativeClearInterval = global.clearInterval;

function hrtimeToMilliseconds (hrtime) {
  let [ seconds, nanoseconds ] = hrtime;
  return seconds * 1000 + nanoseconds / 1000000;
}

class Clock {
  constructor ({ time = 0, addExecutionTime = true }) {
    this._now = null;
    this._hrtime = null;
    this._addExecutionTime = addExecutionTime;
    this._queue = [];
    this._nextProcessingTimeout = null;
    this._nextTimerId = 0;
    this._setNow(time);
  }

  _setNow (time) {
    this._now = time;
    this._hrtime = process.hrtime();
  }

  now () {
    if (this._addExecutionTime) {
      let diff = hrtimeToMilliseconds(process.hrtime(this._hrtime));
      this._hrtime = process.hrtime();
      this._now = Math.round(this._now + diff);
    }
    return this._now;
  }

  _getNextTimerId () {
    this._nextTimerId += 1;
    return this._nextTimerId;
  }

  _addToQueue (event) {
    let insertIndex = 0;
    if (this._queue.length > 0) {
      insertIndex = this._queue.findIndex(item => item.execTime > event.execTime);
      if (insertIndex < 0) {
        insertIndex = this._queue.length;
      }
    }
    this._queue.splice(insertIndex, 0, event);
  }

  _calculateNextExecTime (event) {
    // can have dropped interval cycles if execution time took too long
    let droppedCycles = Math.floor(this.now() - event.execTime);
    return event.execTime + (droppedCycles + 1) * event.intervalTime;
  }

  _scheduleNextProcessing () {
    if (this._nextProcessingTimeout) {
      return;
    }

    this._nextProcessingTimeout = nativeSetTimeout(() => {
      this._nextProcessingTimeout = null;
      let next = this._queue.shift();
      this._setNow(Math.max(this._now, next.execTime));
      if (next.isInterval) {
        // queue again for the next interval
        this._addToQueue(Object.assign(next, {
          execTime: this._calculateNextExecTime(next)
        }));
      }
      next.callback();
      if (this._queue.length > 0) {
        this._scheduleNextProcessing();
      }
    }, 0);
  }

  setTimeout (callback, time) {
    let timerId = this._getNextTimerId();
    this._addToQueue({
      id: timerId,
      execTime: this.now() + time,
      callback: callback
    });
    this._scheduleNextProcessing();
    return timerId;
  }

  clearTimeout (id) {
    this._queue = this._queue.filter(timer => timer.id !== id);
    if (this._queue.length <= 0) {
      nativeClearTimeout(this._nextProcessingTimeout);
    }
  }

  setInterval (callback, time) {
    let timerId = this._getNextTimerId();
    this._addToQueue({
      id: timerId,
      execTime: this.now() + time,
      callback: callback,
      isInterval: true,
      intervalTime: time
    });
    this._scheduleNextProcessing();
    return timerId;
  }

  clearInterval (id) {
    this._queue = this._queue.filter(timer => timer.id !== id);
    if (this._queue.length <= 0) {
      nativeClearTimeout(this._nextProcessingTimeout);
    }
  }
}

function install (options = {}) {
  let clock = new Clock(options);

  global.Date = new Proxy(global.Date, {
    apply (target, thisArg, args) {
      return new Date(...args).toString();
    },
    construct (target, args, newTarget) {
      if (args.length <= 0) {
        return Reflect.construct(target, [clock.now()], newTarget);
      }
      return Reflect.construct(target, args, newTarget);
    }
  });

  global.Date.now = function () {
    return clock.now();
  };

  global.setTimeout = function (callback, time) {
    return clock.setTimeout(callback, time);
  };

  global.clearTimeout = function (id) {
    return clock.clearTimeout(id);
  };

  global.setInterval = function (callback, time) {
    return clock.setInterval(callback, time);
  };

  global.clearInterval = function (id) {
    return clock.clearInterval(id);
  };
}

function uninstall () {
  global.Date = NativeDate;
  global.Date.now = nativeDateNow;
  global.setTimeout = nativeSetTimeout;
  global.clearTimeout = nativeClearTimeout;
  global.setInterval = nativeSetInterval;
  global.clearInterval = nativeClearInterval;
}

module.exports = {
  install,
  uninstall
};
