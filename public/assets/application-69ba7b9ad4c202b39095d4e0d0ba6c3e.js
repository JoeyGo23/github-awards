(function() {
  var COUNT_FRAMERATE, COUNT_MS_PER_FRAME, DIGIT_FORMAT, DIGIT_HTML, DIGIT_SPEEDBOOST, DURATION, FORMAT_MARK_HTML, FORMAT_PARSER, FRAMERATE, FRAMES_PER_VALUE, MS_PER_FRAME, MutationObserver, Odometer, RIBBON_HTML, TRANSITION_END_EVENTS, TRANSITION_SUPPORT, VALUE_HTML, addClass, createFromHTML, fractionalPart, now, removeClass, requestAnimationFrame, round, transitionCheckStyles, trigger, truncate, wrapJQuery, _jQueryWrapped, _old, _ref, _ref1,
    __slice = [].slice;

  VALUE_HTML = '<span class="odometer-value"></span>';

  RIBBON_HTML = '<span class="odometer-ribbon"><span class="odometer-ribbon-inner">' + VALUE_HTML + '</span></span>';

  DIGIT_HTML = '<span class="odometer-digit"><span class="odometer-digit-spacer">8</span><span class="odometer-digit-inner">' + RIBBON_HTML + '</span></span>';

  FORMAT_MARK_HTML = '<span class="odometer-formatting-mark"></span>';

  DIGIT_FORMAT = '(,ddd).dd';

  FORMAT_PARSER = /^\(?([^)]*)\)?(?:(.)(d+))?$/;

  FRAMERATE = 30;

  DURATION = 2000;

  COUNT_FRAMERATE = 20;

  FRAMES_PER_VALUE = 2;

  DIGIT_SPEEDBOOST = .5;

  MS_PER_FRAME = 1000 / FRAMERATE;

  COUNT_MS_PER_FRAME = 1000 / COUNT_FRAMERATE;

  TRANSITION_END_EVENTS = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd';

  transitionCheckStyles = document.createElement('div').style;

  TRANSITION_SUPPORT = (transitionCheckStyles.transition != null) || (transitionCheckStyles.webkitTransition != null) || (transitionCheckStyles.mozTransition != null) || (transitionCheckStyles.oTransition != null);

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

  createFromHTML = function(html) {
    var el;
    el = document.createElement('div');
    el.innerHTML = html;
    return el.children[0];
  };

  removeClass = function(el, name) {
    return el.className = el.className.replace(new RegExp("(^| )" + (name.split(' ').join('|')) + "( |$)", 'gi'), ' ');
  };

  addClass = function(el, name) {
    removeClass(el, name);
    return el.className += " " + name;
  };

  trigger = function(el, name) {
    var evt;
    if (document.createEvent != null) {
      evt = document.createEvent('HTMLEvents');
      evt.initEvent(name, true, true);
      return el.dispatchEvent(evt);
    }
  };

  now = function() {
    var _ref, _ref1;
    return (_ref = (_ref1 = window.performance) != null ? typeof _ref1.now === "function" ? _ref1.now() : void 0 : void 0) != null ? _ref : +(new Date);
  };

  round = function(val, precision) {
    if (precision == null) {
      precision = 0;
    }
    if (!precision) {
      return Math.round(val);
    }
    val *= Math.pow(10, precision);
    val += 0.5;
    val = Math.floor(val);
    return val /= Math.pow(10, precision);
  };

  truncate = function(val) {
    if (val < 0) {
      return Math.ceil(val);
    } else {
      return Math.floor(val);
    }
  };

  fractionalPart = function(val) {
    return val - round(val);
  };

  _jQueryWrapped = false;

  (wrapJQuery = function() {
    var property, _i, _len, _ref, _results;
    if (_jQueryWrapped) {
      return;
    }
    if (window.jQuery != null) {
      _jQueryWrapped = true;
      _ref = ['html', 'text'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        _results.push((function(property) {
          var old;
          old = window.jQuery.fn[property];
          return window.jQuery.fn[property] = function(val) {
            var _ref1;
            if ((val == null) || (((_ref1 = this[0]) != null ? _ref1.odometer : void 0) == null)) {
              return old.apply(this, arguments);
            }
            return this[0].odometer.update(val);
          };
        })(property));
      }
      return _results;
    }
  })();

  setTimeout(wrapJQuery, 0);

  Odometer = (function() {
    function Odometer(options) {
      var e, k, property, v, _base, _i, _len, _ref, _ref1, _ref2,
        _this = this;
      this.options = options;
      this.el = this.options.el;
      if (this.el.odometer != null) {
        return this.el.odometer;
      }
      this.el.odometer = this;
      _ref = Odometer.options;
      for (k in _ref) {
        v = _ref[k];
        if (this.options[k] == null) {
          this.options[k] = v;
        }
      }
      if ((_base = this.options).duration == null) {
        _base.duration = DURATION;
      }
      this.MAX_VALUES = ((this.options.duration / MS_PER_FRAME) / FRAMES_PER_VALUE) | 0;
      this.resetFormat();
      this.value = this.cleanValue((_ref1 = this.options.value) != null ? _ref1 : '');
      this.renderInside();
      this.render();
      try {
        _ref2 = ['innerHTML', 'innerText', 'textContent'];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          property = _ref2[_i];
          if (this.el[property] != null) {
            (function(property) {
              return Object.defineProperty(_this.el, property, {
                get: function() {
                  var _ref3;
                  if (property === 'innerHTML') {
                    return _this.inside.outerHTML;
                  } else {
                    return (_ref3 = _this.inside.innerText) != null ? _ref3 : _this.inside.textContent;
                  }
                },
                set: function(val) {
                  return _this.update(val);
                }
              });
            })(property);
          }
        }
      } catch (_error) {
        e = _error;
        this.watchForMutations();
      }
      this;
    }

    Odometer.prototype.renderInside = function() {
      this.inside = document.createElement('div');
      this.inside.className = 'odometer-inside';
      this.el.innerHTML = '';
      return this.el.appendChild(this.inside);
    };

    Odometer.prototype.watchForMutations = function() {
      var e,
        _this = this;
      if (MutationObserver == null) {
        return;
      }
      try {
        if (this.observer == null) {
          this.observer = new MutationObserver(function(mutations) {
            var newVal;
            newVal = _this.el.innerText;
            _this.renderInside();
            _this.render(_this.value);
            return _this.update(newVal);
          });
        }
        this.watchMutations = true;
        return this.startWatchingMutations();
      } catch (_error) {
        e = _error;
      }
    };

    Odometer.prototype.startWatchingMutations = function() {
      if (this.watchMutations) {
        return this.observer.observe(this.el, {
          childList: true
        });
      }
    };

    Odometer.prototype.stopWatchingMutations = function() {
      var _ref;
      return (_ref = this.observer) != null ? _ref.disconnect() : void 0;
    };

    Odometer.prototype.cleanValue = function(val) {
      var _ref;
      if (typeof val === 'string') {
        val = val.replace((_ref = this.format.radix) != null ? _ref : '.', '<radix>');
        val = val.replace(/[.,]/g, '');
        val = val.replace('<radix>', '.');
        val = parseFloat(val, 10) || 0;
      }
      return round(val, this.format.precision);
    };

    Odometer.prototype.bindTransitionEnd = function() {
      var event, renderEnqueued, _i, _len, _ref, _results,
        _this = this;
      if (this.transitionEndBound) {
        return;
      }
      this.transitionEndBound = true;
      renderEnqueued = false;
      _ref = TRANSITION_END_EVENTS.split(' ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        _results.push(this.el.addEventListener(event, function() {
          if (renderEnqueued) {
            return true;
          }
          renderEnqueued = true;
          setTimeout(function() {
            _this.render();
            renderEnqueued = false;
            return trigger(_this.el, 'odometerdone');
          }, 0);
          return true;
        }, false));
      }
      return _results;
    };

    Odometer.prototype.resetFormat = function() {
      var format, fractional, parsed, precision, radix, repeating, _ref, _ref1;
      format = (_ref = this.options.format) != null ? _ref : DIGIT_FORMAT;
      format || (format = 'd');
      parsed = FORMAT_PARSER.exec(format);
      if (!parsed) {
        throw new Error("Odometer: Unparsable digit format");
      }
      _ref1 = parsed.slice(1, 4), repeating = _ref1[0], radix = _ref1[1], fractional = _ref1[2];
      precision = (fractional != null ? fractional.length : void 0) || 0;
      return this.format = {
        repeating: repeating,
        radix: radix,
        precision: precision
      };
    };

    Odometer.prototype.render = function(value) {
      var classes, cls, match, newClasses, theme, _i, _len;
      if (value == null) {
        value = this.value;
      }
      this.stopWatchingMutations();
      this.resetFormat();
      this.inside.innerHTML = '';
      theme = this.options.theme;
      classes = this.el.className.split(' ');
      newClasses = [];
      for (_i = 0, _len = classes.length; _i < _len; _i++) {
        cls = classes[_i];
        if (!cls.length) {
          continue;
        }
        if (match = /^odometer-theme-(.+)$/.exec(cls)) {
          theme = match[1];
          continue;
        }
        if (/^odometer(-|$)/.test(cls)) {
          continue;
        }
        newClasses.push(cls);
      }
      newClasses.push('odometer');
      if (!TRANSITION_SUPPORT) {
        newClasses.push('odometer-no-transitions');
      }
      if (theme) {
        newClasses.push("odometer-theme-" + theme);
      } else {
        newClasses.push("odometer-auto-theme");
      }
      this.el.className = newClasses.join(' ');
      this.ribbons = {};
      this.formatDigits(value);
      return this.startWatchingMutations();
    };

    Odometer.prototype.formatDigits = function(value) {
      var digit, valueDigit, valueString, wholePart, _i, _j, _len, _len1, _ref, _ref1;
      this.digits = [];
      if (this.options.formatFunction) {
        valueString = this.options.formatFunction(value);
        _ref = valueString.split('').reverse();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          valueDigit = _ref[_i];
          if (valueDigit.match(/0-9/)) {
            digit = this.renderDigit();
            digit.querySelector('.odometer-value').innerHTML = valueDigit;
            this.digits.push(digit);
            this.insertDigit(digit);
          } else {
            this.addSpacer(valueDigit);
          }
        }
      } else {
        wholePart = !this.format.precision || !fractionalPart(value) || false;
        _ref1 = value.toString().split('').reverse();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          digit = _ref1[_j];
          if (digit === '.') {
            wholePart = true;
          }
          this.addDigit(digit, wholePart);
        }
      }
    };

    Odometer.prototype.update = function(newValue) {
      var diff,
        _this = this;
      newValue = this.cleanValue(newValue);
      if (!(diff = newValue - this.value)) {
        return;
      }
      removeClass(this.el, 'odometer-animating-up odometer-animating-down odometer-animating');
      if (diff > 0) {
        addClass(this.el, 'odometer-animating-up');
      } else {
        addClass(this.el, 'odometer-animating-down');
      }
      this.stopWatchingMutations();
      this.animate(newValue);
      this.startWatchingMutations();
      setTimeout(function() {
        _this.el.offsetHeight;
        return addClass(_this.el, 'odometer-animating');
      }, 0);
      return this.value = newValue;
    };

    Odometer.prototype.renderDigit = function() {
      return createFromHTML(DIGIT_HTML);
    };

    Odometer.prototype.insertDigit = function(digit, before) {
      if (before != null) {
        return this.inside.insertBefore(digit, before);
      } else if (!this.inside.children.length) {
        return this.inside.appendChild(digit);
      } else {
        return this.inside.insertBefore(digit, this.inside.children[0]);
      }
    };

    Odometer.prototype.addSpacer = function(chr, before, extraClasses) {
      var spacer;
      spacer = createFromHTML(FORMAT_MARK_HTML);
      spacer.innerHTML = chr;
      if (extraClasses) {
        addClass(spacer, extraClasses);
      }
      return this.insertDigit(spacer, before);
    };

    Odometer.prototype.addDigit = function(value, repeating) {
      var chr, digit, resetted, _ref;
      if (repeating == null) {
        repeating = true;
      }
      if (value === '-') {
        return this.addSpacer(value, null, 'odometer-negation-mark');
      }
      if (value === '.') {
        return this.addSpacer((_ref = this.format.radix) != null ? _ref : '.', null, 'odometer-radix-mark');
      }
      if (repeating) {
        resetted = false;
        while (true) {
          if (!this.format.repeating.length) {
            if (resetted) {
              throw new Error("Bad odometer format without digits");
            }
            this.resetFormat();
            resetted = true;
          }
          chr = this.format.repeating[this.format.repeating.length - 1];
          this.format.repeating = this.format.repeating.substring(0, this.format.repeating.length - 1);
          if (chr === 'd') {
            break;
          }
          this.addSpacer(chr);
        }
      }
      digit = this.renderDigit();
      digit.querySelector('.odometer-value').innerHTML = value;
      this.digits.push(digit);
      return this.insertDigit(digit);
    };

    Odometer.prototype.animate = function(newValue) {
      if (!TRANSITION_SUPPORT || this.options.animation === 'count') {
        return this.animateCount(newValue);
      } else {
        return this.animateSlide(newValue);
      }
    };

    Odometer.prototype.animateCount = function(newValue) {
      var cur, diff, last, start, tick,
        _this = this;
      if (!(diff = +newValue - this.value)) {
        return;
      }
      start = last = now();
      cur = this.value;
      return (tick = function() {
        var delta, dist, fraction;
        if ((now() - start) > _this.options.duration) {
          _this.value = newValue;
          _this.render();
          trigger(_this.el, 'odometerdone');
          return;
        }
        delta = now() - last;
        if (delta > COUNT_MS_PER_FRAME) {
          last = now();
          fraction = delta / _this.options.duration;
          dist = diff * fraction;
          cur += dist;
          _this.render(Math.round(cur));
        }
        if (requestAnimationFrame != null) {
          return requestAnimationFrame(tick);
        } else {
          return setTimeout(tick, COUNT_MS_PER_FRAME);
        }
      })();
    };

    Odometer.prototype.getDigitCount = function() {
      var i, max, value, values, _i, _len;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        value = values[i];
        values[i] = Math.abs(value);
      }
      max = Math.max.apply(Math, values);
      return Math.ceil(Math.log(max + 1) / Math.log(10));
    };

    Odometer.prototype.getFractionalDigitCount = function() {
      var i, parser, parts, value, values, _i, _len;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      parser = /^\-?\d*\.(\d*?)0*$/;
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        value = values[i];
        values[i] = value.toString();
        parts = parser.exec(values[i]);
        if (parts == null) {
          values[i] = 0;
        } else {
          values[i] = parts[1].length;
        }
      }
      return Math.max.apply(Math, values);
    };

    Odometer.prototype.resetDigits = function() {
      this.digits = [];
      this.ribbons = [];
      this.inside.innerHTML = '';
      return this.resetFormat();
    };

    Odometer.prototype.animateSlide = function(newValue) {
      var boosted, cur, diff, digitCount, digits, dist, end, fractionalCount, frame, frames, i, incr, j, mark, numEl, oldValue, start, _base, _i, _j, _k, _l, _len, _len1, _len2, _m, _ref, _results;
      oldValue = this.value;
      fractionalCount = this.getFractionalDigitCount(oldValue, newValue);
      if (fractionalCount) {
        newValue = newValue * Math.pow(10, fractionalCount);
        oldValue = oldValue * Math.pow(10, fractionalCount);
      }
      if (!(diff = newValue - oldValue)) {
        return;
      }
      this.bindTransitionEnd();
      digitCount = this.getDigitCount(oldValue, newValue);
      digits = [];
      boosted = 0;
      for (i = _i = 0; 0 <= digitCount ? _i < digitCount : _i > digitCount; i = 0 <= digitCount ? ++_i : --_i) {
        start = truncate(oldValue / Math.pow(10, digitCount - i - 1));
        end = truncate(newValue / Math.pow(10, digitCount - i - 1));
        dist = end - start;
        if (Math.abs(dist) > this.MAX_VALUES) {
          frames = [];
          incr = dist / (this.MAX_VALUES + this.MAX_VALUES * boosted * DIGIT_SPEEDBOOST);
          cur = start;
          while ((dist > 0 && cur < end) || (dist < 0 && cur > end)) {
            frames.push(Math.round(cur));
            cur += incr;
          }
          if (frames[frames.length - 1] !== end) {
            frames.push(end);
          }
          boosted++;
        } else {
          frames = (function() {
            _results = [];
            for (var _j = start; start <= end ? _j <= end : _j >= end; start <= end ? _j++ : _j--){ _results.push(_j); }
            return _results;
          }).apply(this);
        }
        for (i = _k = 0, _len = frames.length; _k < _len; i = ++_k) {
          frame = frames[i];
          frames[i] = Math.abs(frame % 10);
        }
        digits.push(frames);
      }
      this.resetDigits();
      _ref = digits.reverse();
      for (i = _l = 0, _len1 = _ref.length; _l < _len1; i = ++_l) {
        frames = _ref[i];
        if (!this.digits[i]) {
          this.addDigit(' ', i >= fractionalCount);
        }
        if ((_base = this.ribbons)[i] == null) {
          _base[i] = this.digits[i].querySelector('.odometer-ribbon-inner');
        }
        this.ribbons[i].innerHTML = '';
        if (diff < 0) {
          frames = frames.reverse();
        }
        for (j = _m = 0, _len2 = frames.length; _m < _len2; j = ++_m) {
          frame = frames[j];
          numEl = document.createElement('div');
          numEl.className = 'odometer-value';
          numEl.innerHTML = frame;
          this.ribbons[i].appendChild(numEl);
          if (j === frames.length - 1) {
            addClass(numEl, 'odometer-last-value');
          }
          if (j === 0) {
            addClass(numEl, 'odometer-first-value');
          }
        }
      }
      if (start < 0) {
        this.addDigit('-');
      }
      mark = this.inside.querySelector('.odometer-radix-mark');
      if (mark != null) {
        mark.parent.removeChild(mark);
      }
      if (fractionalCount) {
        return this.addSpacer(this.format.radix, this.digits[fractionalCount - 1], 'odometer-radix-mark');
      }
    };

    return Odometer;

  })();

  Odometer.options = (_ref = window.odometerOptions) != null ? _ref : {};

  setTimeout(function() {
    var k, v, _base, _ref1, _results;
    if (window.odometerOptions) {
      _ref1 = window.odometerOptions;
      _results = [];
      for (k in _ref1) {
        v = _ref1[k];
        _results.push((_base = Odometer.options)[k] != null ? (_base = Odometer.options)[k] : _base[k] = v);
      }
      return _results;
    }
  }, 0);

  Odometer.init = function() {
    var el, elements, _i, _len, _ref1, _results;
    if (document.querySelectorAll == null) {
      return;
    }
    elements = document.querySelectorAll(Odometer.options.selector || '.odometer');
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      el = elements[_i];
      _results.push(el.odometer = new Odometer({
        el: el,
        value: (_ref1 = el.innerText) != null ? _ref1 : el.textContent
      }));
    }
    return _results;
  };

  if ((((_ref1 = document.documentElement) != null ? _ref1.doScroll : void 0) != null) && (document.createEventObject != null)) {
    _old = document.onreadystatechange;
    document.onreadystatechange = function() {
      if (document.readyState === 'complete' && Odometer.options.auto !== false) {
        Odometer.init();
      }
      return _old != null ? _old.apply(this, arguments) : void 0;
    };
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      if (Odometer.options.auto !== false) {
        return Odometer.init();
      }
    }, false);
  }

  if (typeof define === 'function' && define.amd) {
    define(['jquery'], function() {
      return Odometer;
    });
  } else if (typeof exports !== "undefined" && exports !== null) {
    module.exports = Odometer;
  } else {
    window.Odometer = Odometer;
  }

}).call(this);
(function() {
  var CSRFToken, Click, ComponentUrl, EVENTS, Link, ProgressBar, browserIsntBuggy, browserSupportsCustomEvents, browserSupportsPushState, browserSupportsTurbolinks, bypassOnLoadPopstate, cacheCurrentPage, cacheSize, changePage, clone, constrainPageCacheTo, createDocument, crossOriginRedirect, currentState, enableProgressBar, enableTransitionCache, executeScriptTags, extractTitleAndBody, fetch, fetchHistory, fetchReplacement, historyStateIsDefined, initializeTurbolinks, installDocumentReadyPageEventTriggers, installHistoryChangeHandler, installJqueryAjaxSuccessPageUpdateTrigger, loadedAssets, manuallyTriggerHashChangeForFirefox, pageCache, pageChangePrevented, pagesCached, popCookie, processResponse, progressBar, recallScrollPosition, referer, reflectNewUrl, reflectRedirectedUrl, rememberCurrentState, rememberCurrentUrl, rememberReferer, removeNoscriptTags, requestMethodIsSafe, resetScrollPosition, setAutofocusElement, transitionCacheEnabled, transitionCacheFor, triggerEvent, visit, xhr, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  pageCache = {};

  cacheSize = 10;

  transitionCacheEnabled = false;

  progressBar = null;

  currentState = null;

  loadedAssets = null;

  referer = null;

  xhr = null;

  EVENTS = {
    BEFORE_CHANGE: 'page:before-change',
    FETCH: 'page:fetch',
    RECEIVE: 'page:receive',
    CHANGE: 'page:change',
    UPDATE: 'page:update',
    LOAD: 'page:load',
    RESTORE: 'page:restore',
    BEFORE_UNLOAD: 'page:before-unload',
    EXPIRE: 'page:expire'
  };

  fetch = function(url) {
    var cachedPage;
    url = new ComponentUrl(url);
    rememberReferer();
    cacheCurrentPage();
    if (progressBar != null) {
      progressBar.start();
    }
    if (transitionCacheEnabled && (cachedPage = transitionCacheFor(url.absolute))) {
      fetchHistory(cachedPage);
      return fetchReplacement(url, null, false);
    } else {
      return fetchReplacement(url, resetScrollPosition);
    }
  };

  transitionCacheFor = function(url) {
    var cachedPage;
    cachedPage = pageCache[url];
    if (cachedPage && !cachedPage.transitionCacheDisabled) {
      return cachedPage;
    }
  };

  enableTransitionCache = function(enable) {
    if (enable == null) {
      enable = true;
    }
    return transitionCacheEnabled = enable;
  };

  enableProgressBar = function(enable) {
    if (enable == null) {
      enable = true;
    }
    if (!browserSupportsTurbolinks) {
      return;
    }
    if (enable) {
      return progressBar != null ? progressBar : progressBar = new ProgressBar('html');
    } else {
      if (progressBar != null) {
        progressBar.uninstall();
      }
      return progressBar = null;
    }
  };

  fetchReplacement = function(url, onLoadFunction, showProgressBar) {
    if (showProgressBar == null) {
      showProgressBar = true;
    }
    triggerEvent(EVENTS.FETCH, {
      url: url.absolute
    });
    if (xhr != null) {
      xhr.abort();
    }
    xhr = new XMLHttpRequest;
    xhr.open('GET', url.withoutHashForIE10compatibility(), true);
    xhr.setRequestHeader('Accept', 'text/html, application/xhtml+xml, application/xml');
    xhr.setRequestHeader('X-XHR-Referer', referer);
    xhr.onload = function() {
      var doc;
      triggerEvent(EVENTS.RECEIVE, {
        url: url.absolute
      });
      if (doc = processResponse()) {
        reflectNewUrl(url);
        reflectRedirectedUrl();
        changePage.apply(null, extractTitleAndBody(doc));
        manuallyTriggerHashChangeForFirefox();
        if (typeof onLoadFunction === "function") {
          onLoadFunction();
        }
        return triggerEvent(EVENTS.LOAD);
      } else {
        return document.location.href = crossOriginRedirect() || url.absolute;
      }
    };
    if (progressBar && showProgressBar) {
      xhr.onprogress = (function(_this) {
        return function(event) {
          var percent;
          percent = event.lengthComputable ? event.loaded / event.total * 100 : progressBar.value + (100 - progressBar.value) / 10;
          return progressBar.advanceTo(percent);
        };
      })(this);
    }
    xhr.onloadend = function() {
      return xhr = null;
    };
    xhr.onerror = function() {
      return document.location.href = url.absolute;
    };
    return xhr.send();
  };

  fetchHistory = function(cachedPage) {
    if (xhr != null) {
      xhr.abort();
    }
    changePage(cachedPage.title, cachedPage.body);
    recallScrollPosition(cachedPage);
    return triggerEvent(EVENTS.RESTORE);
  };

  cacheCurrentPage = function() {
    var currentStateUrl;
    currentStateUrl = new ComponentUrl(currentState.url);
    pageCache[currentStateUrl.absolute] = {
      url: currentStateUrl.relative,
      body: document.body,
      title: document.title,
      positionY: window.pageYOffset,
      positionX: window.pageXOffset,
      cachedAt: new Date().getTime(),
      transitionCacheDisabled: document.querySelector('[data-no-transition-cache]') != null
    };
    return constrainPageCacheTo(cacheSize);
  };

  pagesCached = function(size) {
    if (size == null) {
      size = cacheSize;
    }
    if (/^[\d]+$/.test(size)) {
      return cacheSize = parseInt(size);
    }
  };

  constrainPageCacheTo = function(limit) {
    var cacheTimesRecentFirst, key, pageCacheKeys, _i, _len, _results;
    pageCacheKeys = Object.keys(pageCache);
    cacheTimesRecentFirst = pageCacheKeys.map(function(url) {
      return pageCache[url].cachedAt;
    }).sort(function(a, b) {
      return b - a;
    });
    _results = [];
    for (_i = 0, _len = pageCacheKeys.length; _i < _len; _i++) {
      key = pageCacheKeys[_i];
      if (!(pageCache[key].cachedAt <= cacheTimesRecentFirst[limit])) {
        continue;
      }
      triggerEvent(EVENTS.EXPIRE, pageCache[key]);
      _results.push(delete pageCache[key]);
    }
    return _results;
  };

  changePage = function(title, body, csrfToken, runScripts) {
    triggerEvent(EVENTS.BEFORE_UNLOAD);
    document.title = title;
    document.documentElement.replaceChild(body, document.body);
    if (csrfToken != null) {
      CSRFToken.update(csrfToken);
    }
    setAutofocusElement();
    if (runScripts) {
      executeScriptTags();
    }
    currentState = window.history.state;
    if (progressBar != null) {
      progressBar.done();
    }
    triggerEvent(EVENTS.CHANGE);
    return triggerEvent(EVENTS.UPDATE);
  };

  executeScriptTags = function() {
    var attr, copy, nextSibling, parentNode, script, scripts, _i, _j, _len, _len1, _ref, _ref1;
    scripts = Array.prototype.slice.call(document.body.querySelectorAll('script:not([data-turbolinks-eval="false"])'));
    for (_i = 0, _len = scripts.length; _i < _len; _i++) {
      script = scripts[_i];
      if (!((_ref = script.type) === '' || _ref === 'text/javascript')) {
        continue;
      }
      copy = document.createElement('script');
      _ref1 = script.attributes;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        attr = _ref1[_j];
        copy.setAttribute(attr.name, attr.value);
      }
      if (!script.hasAttribute('async')) {
        copy.async = false;
      }
      copy.appendChild(document.createTextNode(script.innerHTML));
      parentNode = script.parentNode, nextSibling = script.nextSibling;
      parentNode.removeChild(script);
      parentNode.insertBefore(copy, nextSibling);
    }
  };

  removeNoscriptTags = function(node) {
    node.innerHTML = node.innerHTML.replace(/<noscript[\S\s]*?<\/noscript>/ig, '');
    return node;
  };

  setAutofocusElement = function() {
    var autofocusElement, list;
    autofocusElement = (list = document.querySelectorAll('input[autofocus], textarea[autofocus]'))[list.length - 1];
    if (autofocusElement && document.activeElement !== autofocusElement) {
      return autofocusElement.focus();
    }
  };

  reflectNewUrl = function(url) {
    if ((url = new ComponentUrl(url)).absolute !== referer) {
      return window.history.pushState({
        turbolinks: true,
        url: url.absolute
      }, '', url.absolute);
    }
  };

  reflectRedirectedUrl = function() {
    var location, preservedHash;
    if (location = xhr.getResponseHeader('X-XHR-Redirected-To')) {
      location = new ComponentUrl(location);
      preservedHash = location.hasNoHash() ? document.location.hash : '';
      return window.history.replaceState(window.history.state, '', location.href + preservedHash);
    }
  };

  crossOriginRedirect = function() {
    var redirect;
    if (((redirect = xhr.getResponseHeader('Location')) != null) && (new ComponentUrl(redirect)).crossOrigin()) {
      return redirect;
    }
  };

  rememberReferer = function() {
    return referer = document.location.href;
  };

  rememberCurrentUrl = function() {
    return window.history.replaceState({
      turbolinks: true,
      url: document.location.href
    }, '', document.location.href);
  };

  rememberCurrentState = function() {
    return currentState = window.history.state;
  };

  manuallyTriggerHashChangeForFirefox = function() {
    var url;
    if (navigator.userAgent.match(/Firefox/) && !(url = new ComponentUrl).hasNoHash()) {
      window.history.replaceState(currentState, '', url.withoutHash());
      return document.location.hash = url.hash;
    }
  };

  recallScrollPosition = function(page) {
    return window.scrollTo(page.positionX, page.positionY);
  };

  resetScrollPosition = function() {
    if (document.location.hash) {
      return document.location.href = document.location.href;
    } else {
      return window.scrollTo(0, 0);
    }
  };

  clone = function(original) {
    var copy, key, value;
    if ((original == null) || typeof original !== 'object') {
      return original;
    }
    copy = new original.constructor();
    for (key in original) {
      value = original[key];
      copy[key] = clone(value);
    }
    return copy;
  };

  popCookie = function(name) {
    var value, _ref;
    value = ((_ref = document.cookie.match(new RegExp(name + "=(\\w+)"))) != null ? _ref[1].toUpperCase() : void 0) || '';
    document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/';
    return value;
  };

  triggerEvent = function(name, data) {
    var event;
    if (typeof Prototype !== 'undefined') {
      Event.fire(document, name, data, true);
    }
    event = document.createEvent('Events');
    if (data) {
      event.data = data;
    }
    event.initEvent(name, true, true);
    return document.dispatchEvent(event);
  };

  pageChangePrevented = function(url) {
    return !triggerEvent(EVENTS.BEFORE_CHANGE, {
      url: url
    });
  };

  processResponse = function() {
    var assetsChanged, clientOrServerError, doc, extractTrackAssets, intersection, validContent;
    clientOrServerError = function() {
      var _ref;
      return (400 <= (_ref = xhr.status) && _ref < 600);
    };
    validContent = function() {
      var contentType;
      return ((contentType = xhr.getResponseHeader('Content-Type')) != null) && contentType.match(/^(?:text\/html|application\/xhtml\+xml|application\/xml)(?:;|$)/);
    };
    extractTrackAssets = function(doc) {
      var node, _i, _len, _ref, _results;
      _ref = doc.querySelector('head').childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if ((typeof node.getAttribute === "function" ? node.getAttribute('data-turbolinks-track') : void 0) != null) {
          _results.push(node.getAttribute('src') || node.getAttribute('href'));
        }
      }
      return _results;
    };
    assetsChanged = function(doc) {
      var fetchedAssets;
      loadedAssets || (loadedAssets = extractTrackAssets(document));
      fetchedAssets = extractTrackAssets(doc);
      return fetchedAssets.length !== loadedAssets.length || intersection(fetchedAssets, loadedAssets).length !== loadedAssets.length;
    };
    intersection = function(a, b) {
      var value, _i, _len, _ref, _results;
      if (a.length > b.length) {
        _ref = [b, a], a = _ref[0], b = _ref[1];
      }
      _results = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        value = a[_i];
        if (__indexOf.call(b, value) >= 0) {
          _results.push(value);
        }
      }
      return _results;
    };
    if (!clientOrServerError() && validContent()) {
      doc = createDocument(xhr.responseText);
      if (doc && !assetsChanged(doc)) {
        return doc;
      }
    }
  };

  extractTitleAndBody = function(doc) {
    var title;
    title = doc.querySelector('title');
    return [title != null ? title.textContent : void 0, removeNoscriptTags(doc.querySelector('body')), CSRFToken.get(doc).token, 'runScripts'];
  };

  CSRFToken = {
    get: function(doc) {
      var tag;
      if (doc == null) {
        doc = document;
      }
      return {
        node: tag = doc.querySelector('meta[name="csrf-token"]'),
        token: tag != null ? typeof tag.getAttribute === "function" ? tag.getAttribute('content') : void 0 : void 0
      };
    },
    update: function(latest) {
      var current;
      current = this.get();
      if ((current.token != null) && (latest != null) && current.token !== latest) {
        return current.node.setAttribute('content', latest);
      }
    }
  };

  createDocument = function(html) {
    var doc;
    doc = document.documentElement.cloneNode();
    doc.innerHTML = html;
    doc.head = doc.querySelector('head');
    doc.body = doc.querySelector('body');
    return doc;
  };

  ComponentUrl = (function() {
    function ComponentUrl(original) {
      this.original = original != null ? original : document.location.href;
      if (this.original.constructor === ComponentUrl) {
        return this.original;
      }
      this._parse();
    }

    ComponentUrl.prototype.withoutHash = function() {
      return this.href.replace(this.hash, '').replace('#', '');
    };

    ComponentUrl.prototype.withoutHashForIE10compatibility = function() {
      return this.withoutHash();
    };

    ComponentUrl.prototype.hasNoHash = function() {
      return this.hash.length === 0;
    };

    ComponentUrl.prototype.crossOrigin = function() {
      return this.origin !== (new ComponentUrl).origin;
    };

    ComponentUrl.prototype._parse = function() {
      var _ref;
      (this.link != null ? this.link : this.link = document.createElement('a')).href = this.original;
      _ref = this.link, this.href = _ref.href, this.protocol = _ref.protocol, this.host = _ref.host, this.hostname = _ref.hostname, this.port = _ref.port, this.pathname = _ref.pathname, this.search = _ref.search, this.hash = _ref.hash;
      this.origin = [this.protocol, '//', this.hostname].join('');
      if (this.port.length !== 0) {
        this.origin += ":" + this.port;
      }
      this.relative = [this.pathname, this.search, this.hash].join('');
      return this.absolute = this.href;
    };

    return ComponentUrl;

  })();

  Link = (function(_super) {
    __extends(Link, _super);

    Link.HTML_EXTENSIONS = ['html'];

    Link.allowExtensions = function() {
      var extension, extensions, _i, _len;
      extensions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (_i = 0, _len = extensions.length; _i < _len; _i++) {
        extension = extensions[_i];
        Link.HTML_EXTENSIONS.push(extension);
      }
      return Link.HTML_EXTENSIONS;
    };

    function Link(link) {
      this.link = link;
      if (this.link.constructor === Link) {
        return this.link;
      }
      this.original = this.link.href;
      this.originalElement = this.link;
      this.link = this.link.cloneNode(false);
      Link.__super__.constructor.apply(this, arguments);
    }

    Link.prototype.shouldIgnore = function() {
      return this.crossOrigin() || this._anchored() || this._nonHtml() || this._optOut() || this._target();
    };

    Link.prototype._anchored = function() {
      return (this.hash.length > 0 || this.href.charAt(this.href.length - 1) === '#') && (this.withoutHash() === (new ComponentUrl).withoutHash());
    };

    Link.prototype._nonHtml = function() {
      return this.pathname.match(/\.[a-z]+$/g) && !this.pathname.match(new RegExp("\\.(?:" + (Link.HTML_EXTENSIONS.join('|')) + ")?$", 'g'));
    };

    Link.prototype._optOut = function() {
      var ignore, link;
      link = this.originalElement;
      while (!(ignore || link === document)) {
        ignore = link.getAttribute('data-no-turbolink') != null;
        link = link.parentNode;
      }
      return ignore;
    };

    Link.prototype._target = function() {
      return this.link.target.length !== 0;
    };

    return Link;

  })(ComponentUrl);

  Click = (function() {
    Click.installHandlerLast = function(event) {
      if (!event.defaultPrevented) {
        document.removeEventListener('click', Click.handle, false);
        return document.addEventListener('click', Click.handle, false);
      }
    };

    Click.handle = function(event) {
      return new Click(event);
    };

    function Click(event) {
      this.event = event;
      if (this.event.defaultPrevented) {
        return;
      }
      this._extractLink();
      if (this._validForTurbolinks()) {
        if (!pageChangePrevented(this.link.absolute)) {
          visit(this.link.href);
        }
        this.event.preventDefault();
      }
    }

    Click.prototype._extractLink = function() {
      var link;
      link = this.event.target;
      while (!(!link.parentNode || link.nodeName === 'A')) {
        link = link.parentNode;
      }
      if (link.nodeName === 'A' && link.href.length !== 0) {
        return this.link = new Link(link);
      }
    };

    Click.prototype._validForTurbolinks = function() {
      return (this.link != null) && !(this.link.shouldIgnore() || this._nonStandardClick());
    };

    Click.prototype._nonStandardClick = function() {
      return this.event.which > 1 || this.event.metaKey || this.event.ctrlKey || this.event.shiftKey || this.event.altKey;
    };

    return Click;

  })();

  ProgressBar = (function() {
    var className;

    className = 'turbolinks-progress-bar';

    function ProgressBar(elementSelector) {
      this.elementSelector = elementSelector;
      this._trickle = __bind(this._trickle, this);
      this.value = 0;
      this.content = '';
      this.speed = 300;
      this.opacity = 0.99;
      this.install();
    }

    ProgressBar.prototype.install = function() {
      this.element = document.querySelector(this.elementSelector);
      this.element.classList.add(className);
      this.styleElement = document.createElement('style');
      document.head.appendChild(this.styleElement);
      return this._updateStyle();
    };

    ProgressBar.prototype.uninstall = function() {
      this.element.classList.remove(className);
      return document.head.removeChild(this.styleElement);
    };

    ProgressBar.prototype.start = function() {
      return this.advanceTo(5);
    };

    ProgressBar.prototype.advanceTo = function(value) {
      var _ref;
      if ((value > (_ref = this.value) && _ref <= 100)) {
        this.value = value;
        this._updateStyle();
        if (this.value === 100) {
          return this._stopTrickle();
        } else if (this.value > 0) {
          return this._startTrickle();
        }
      }
    };

    ProgressBar.prototype.done = function() {
      if (this.value > 0) {
        this.advanceTo(100);
        return this._reset();
      }
    };

    ProgressBar.prototype._reset = function() {
      var originalOpacity;
      originalOpacity = this.opacity;
      setTimeout((function(_this) {
        return function() {
          _this.opacity = 0;
          return _this._updateStyle();
        };
      })(this), this.speed / 2);
      return setTimeout((function(_this) {
        return function() {
          _this.value = 0;
          _this.opacity = originalOpacity;
          return _this._withSpeed(0, function() {
            return _this._updateStyle(true);
          });
        };
      })(this), this.speed);
    };

    ProgressBar.prototype._startTrickle = function() {
      if (this.trickling) {
        return;
      }
      this.trickling = true;
      return setTimeout(this._trickle, this.speed);
    };

    ProgressBar.prototype._stopTrickle = function() {
      return delete this.trickling;
    };

    ProgressBar.prototype._trickle = function() {
      if (!this.trickling) {
        return;
      }
      this.advanceTo(this.value + Math.random() / 2);
      return setTimeout(this._trickle, this.speed);
    };

    ProgressBar.prototype._withSpeed = function(speed, fn) {
      var originalSpeed, result;
      originalSpeed = this.speed;
      this.speed = speed;
      result = fn();
      this.speed = originalSpeed;
      return result;
    };

    ProgressBar.prototype._updateStyle = function(forceRepaint) {
      if (forceRepaint == null) {
        forceRepaint = false;
      }
      if (forceRepaint) {
        this._changeContentToForceRepaint();
      }
      return this.styleElement.textContent = this._createCSSRule();
    };

    ProgressBar.prototype._changeContentToForceRepaint = function() {
      return this.content = this.content === '' ? ' ' : '';
    };

    ProgressBar.prototype._createCSSRule = function() {
      return "" + this.elementSelector + "." + className + "::before {\n  content: '" + this.content + "';\n  position: fixed;\n  top: 0;\n  left: 0;\n  z-index: 2000;\n  background-color: #0076ff;\n  height: 3px;\n  opacity: " + this.opacity + ";\n  width: " + this.value + "%;\n  transition: width " + this.speed + "ms ease-out, opacity " + (this.speed / 2) + "ms ease-in;\n  transform: translate3d(0,0,0);\n}";
    };

    return ProgressBar;

  })();

  bypassOnLoadPopstate = function(fn) {
    return setTimeout(fn, 500);
  };

  installDocumentReadyPageEventTriggers = function() {
    return document.addEventListener('DOMContentLoaded', (function() {
      triggerEvent(EVENTS.CHANGE);
      return triggerEvent(EVENTS.UPDATE);
    }), true);
  };

  installJqueryAjaxSuccessPageUpdateTrigger = function() {
    if (typeof jQuery !== 'undefined') {
      return jQuery(document).on('ajaxSuccess', function(event, xhr, settings) {
        if (!jQuery.trim(xhr.responseText)) {
          return;
        }
        return triggerEvent(EVENTS.UPDATE);
      });
    }
  };

  installHistoryChangeHandler = function(event) {
    var cachedPage, _ref;
    if ((_ref = event.state) != null ? _ref.turbolinks : void 0) {
      if (cachedPage = pageCache[(new ComponentUrl(event.state.url)).absolute]) {
        cacheCurrentPage();
        return fetchHistory(cachedPage);
      } else {
        return visit(event.target.location.href);
      }
    }
  };

  initializeTurbolinks = function() {
    rememberCurrentUrl();
    rememberCurrentState();
    document.addEventListener('click', Click.installHandlerLast, true);
    window.addEventListener('hashchange', function(event) {
      rememberCurrentUrl();
      return rememberCurrentState();
    }, false);
    return bypassOnLoadPopstate(function() {
      return window.addEventListener('popstate', installHistoryChangeHandler, false);
    });
  };

  historyStateIsDefined = window.history.state !== void 0 || navigator.userAgent.match(/Firefox\/2[6|7]/);

  browserSupportsPushState = window.history && window.history.pushState && window.history.replaceState && historyStateIsDefined;

  browserIsntBuggy = !navigator.userAgent.match(/CriOS\//);

  requestMethodIsSafe = (_ref = popCookie('request_method')) === 'GET' || _ref === '';

  browserSupportsTurbolinks = browserSupportsPushState && browserIsntBuggy && requestMethodIsSafe;

  browserSupportsCustomEvents = document.addEventListener && document.createEvent;

  if (browserSupportsCustomEvents) {
    installDocumentReadyPageEventTriggers();
    installJqueryAjaxSuccessPageUpdateTrigger();
  }

  if (browserSupportsTurbolinks) {
    visit = fetch;
    initializeTurbolinks();
  } else {
    visit = function(url) {
      return document.location.href = url;
    };
  }

  this.Turbolinks = {
    visit: visit,
    pagesCached: pagesCached,
    enableTransitionCache: enableTransitionCache,
    enableProgressBar: enableProgressBar,
    allowLinkExtensions: Link.allowExtensions,
    supported: browserSupportsTurbolinks,
    EVENTS: clone(EVENTS)
  };

}).call(this);
var cities = ["Sgravendeel", "Shertogenbosch", "T veld", "10th of ramadan city", "6th of october", "6th of october city", "9 de julio", "A corua", "Aabenraa", "Aachen", "Aalborg", "Aalen", "Aalsmeer", "Aalst", "Aalten", "Aalter", "Aarau", "Aarberg", "Aarburg", "Aarhus", "Aarlerixtel", "Aarschot", "Aarwangen", "Aathal", "Abadan", "Abakan", "Abancay", "Abbots langley", "Abbotsford", "Abbottabad", "Abcoude", "Aberaeron", "Aberdeen", "Aberdeen proving ground", "Aberdeen township", "Aberfeldy", "Aberfoyle park", "Abergavenny", "Aberhosan", "Aberystwyth", "Abfaltersbach", "Abidjan", "Abiko", "Abilene", "Abingdon", "Abinger hammer", "Abita springs", "Ablis", "Ablonsurseine", "Abovyan", "Aboyne", "Abrantes", "Absecon", "Abu county", "Abu dhabi", "Abu qir", "Abuja", "Abula", "Acapulco", "Acarigua", "Acayucan", "Accra", "Accrington", "Acharnes", "Achinsk", "Aci catena", "Acojeja", "Acosta", "Acquarossa", "Acquaviva delle fonti", "Acqui terme", "Acton", "Actopan", "Acworth", "Acmbaro", "Ada", "Adachi", "Adairsville", "Adams", "Adamsville", "Adana", "Addis ababa", "Addis abeba", "Addison", "Adeje", "Adel", "Adelaide", "Adelebsen", "Adelphi", "Adlington", "Adliswil", "Adoor", "Adrian", "Aesch", "Affligem", "Affoltern am albis", "Afyonkarahisar", "Agadir", "Agassiz", "Agedrup", "Agen", "Ageo", "Agoo", "Agoura hills", "Agra", "Agrate brianza", "Agrigento", "Agrinio", "Aguada", "Aguadilla", "Agualvacacm", "Aguascalientes", "Ahaus", "Ahiaruhe", "Ahmedabad", "Ahrensburg", "Ahvaz", "Aiea", "Aiguafreda", "Aiken", "Aim", "Ain mlila", "Ain oussera", "Ain taya", "Ainring", "Aira", "Airdrie", "Airelaville", "Aixenprovence", "Aixesurvienne", "Aizawl", "Aizuwakamatsu", "Aizuwakamatsu", "Aizuwakamatsushi", "Ajaccio", "Ajax", "Ajijic", "Ajman", "Ajmer", "Akademgorodok", "Akashishi", "Akhaura", "Akishima", "Akita", "Akranes", "Akron", "Aksaray", "Aksu", "Aktobe", "Akure", "Akureyri", "Akakoca", "Al ain", "Al jubail", "Al khobar", "Al mukalla", "Al sulaimaniya", "Alobour", "Alacant", "Alachua", "Alagoinhas", "Alajuela", "Alameda", "Alamo", "Alamogordo", "Alanya", "Alappuzha", "Alaqus", "Alathur", "Alavus", "Alba", "Alba iulia", "Albacete", "Albany", "Albemarle", "Albenga", "Alberta", "Albertville", "Albi", "Albinia", "Albion", "Albion park", "Alblasserdam", "Albrightsville", "Albuquerque", "Alburtis", "Albury", "Alcala de henares", "Alcal de henares", "Alcantarilla", "Alcarrs", "Alchevsk", "Alcobendas", "Alcochete", "Alcoi", "Alcorcn", "Alcosta blvd", "Alczar de san juan", "Alcdia", "Aldeadvila", "Aldershot", "Aldie", "Aledo", "Alegrete", "Aleppo", "Alessandria", "Alesund", "Aletai diqu", "Alexandria", "Alfaro", "Alfdorf", "Alfeld", "Alfenas", "Alford", "Alfortville", "Alfragide", "Alfred", "Alfredo vasconcelos", "Alfreton", "Alfriston", "Algeciras", "Alghero", "Algiers", "Alginet", "Algonquin", "Alguazas", "Alhama de murcia", "Alhambra", "Alhaurn el grande", "Alhos vedros", "Alicante", "Alice springs", "Aligarh", "Alingss", "Aliso viejo", "Alken", "Alkmaar", "Allahabad", "Allai", "Allaman", "Allauch", "Allegan", "Allen", "Allendale", "Allendale charter township", "Allende", "Allentown", "Allex", "Alliance", "Alligator creek", "Alloa", "Allonnes", "Allons", "Allouez", "Allschwil", "Alma", "Almada", "Almalyk", "Almancil", "Almassora", "Almaty", "Almelo", "Almendralejo", "Almere", "Almeria", "Almera", "Almkerk", "Almo", "Aloha", "Alpharetta", "Alphen aan den rijn", "Alpine", "Alsager", "Alsdorf", "Alsterbro", "Alta floresta", "Alta gracia", "Altach", "Altadena", "Altair", "Altamonte springs", "Altavilla vicentina", "Altdorf", "Altdorf bei nrnberg", "Altmnster", "Alto paraso", "Alton", "Altona north", "Altoona", "Altopascio", "Altrincham", "Altsasualsasua", "Aluva", "Alvechurch", "Alverca do ribatejo", "Alveringem", "Alvorada", "Alwernia", "Alyth", "Alytus", "Alzano lombardo", "Alksne", "Amadora", "Amagasaki", "Amarante", "Amarillo", "Amay", "Ambala", "Ambala city", "Ambalangoda", "Ambarawa", "Ambato", "Ambavaram", "Ambebahula", "Amberg", "Amberley", "Ambler", "Ambridge", "Ameca", "Ameide", "Amel", "America", "American fork", "Americana", "Americus", "Amersfoort", "Amersham", "Ames", "Amesbury", "Amherst", "Amiens", "Amite city", "Amity", "Amman", "Ammon", "Amol", "Amora", "Amorebieta", "Ampang", "Ampara", "Amravati", "Amriswil", "Amritsar", "Amritsar cantt", "Amstelveen", "Amsterdam", "Amsterdam airport schiphol", "Amstetten", "Amuntai", "Amrico brasiliense", "Anacortes", "Anaheim", "Anakkara", "Anand", "Anantapur", "Anapa", "Ancenis", "Anchor point", "Anchorage", "Ancon", "Ancona", "Andale", "Andenne", "Andernach", "Andernoslesbains", "Anderson", "Andheri", "Andoain", "Andorf", "Andorra la vella", "Andover", "Andradas", "Andria", "Andros town", "Andwil", "Angamaly", "Angarsk", "Angeles", "Angels", "Angels camp", "Angers", "Angical do piau", "Angicos", "Angles", "Anglet", "Angleton", "Angola", "Angono", "Angoulins", "Angoulme", "Angra dos reis", "Angri", "Anime", "Aniwa", "Anjar", "Ank", "Ankara", "Ankeny", "Ankleshwar", "Ann arbor", "Anna paulowna", "Anna regina", "Annaba", "Annandale", "Annapolis", "Annapolis junction", "Annecy", "Annecylevieux", "Anniston", "Annville", "Anoka", "Anpara", "Anqing", "Ansacq", "Ansan", "Ansansi", "Ansbach", "Ansen", "Anserma", "Anshan", "Ansonia", "Antalya", "Antananarivo", "Antelope", "Anthony", "Antibes", "Antigua guatemala", "Antioch", "Antipolo", "Antofagasta", "Antony", "Antratsyt", "Antrim", "Antsla", "Antwerp", "Antwerpen", "Anuradhapura", "Anviken", "Anyang", "Anyang shi", "Anyangsi", "Anpolis", "Ao nang", "Aobaku", "Aoiku", "Aomori", "Apache", "Apache junction", "Apalachin", "Apalit", "Aparecida", "Aparecida de goinia", "Apatity", "Apeldoorn", "Apex", "Apodaca", "Apodi", "Apollo beach", "Apopka", "Appalachia", "Apple valley", "Appleton", "Appley bridge", "Apt", "Aptos", "Apucarana", "Aquidauana", "Aracaju", "Aracati", "Arad", "Araguari", "Araguana", "Arak", "Arakawa", "Aranda de duero", "Aranjuez", "Arapahoe", "Arapai", "Arapiraca", "Arapongas", "Ararangu", "Araraquara", "Araras", "Arauca", "Araucria", "Arax", "Araatuba", "Arbil", "Arbon", "Arcadia", "Arcata", "Arces", "Arceto", "Arch cape", "Archbold", "Arco", "Arcos", "Arcos de valdevez", "Arcueil", "Ardabil", "Arden hills", "Ardenarcade", "Ardmore", "Area", "Arendal", "Arendonk", "Arenillas", "Arenys de munt", "Arequipa", "Arezzo", "Argelssurmer", "Argentan", "Argenteuil", "Argentia", "Argentonsurcreuse", "Argentona", "Argueil", "Ari", "Ariana", "Ariano irpino", "Arica", "Arinaga", "Aringay", "Arinsal", "Ariquemes", "Arkadelphia", "Arkel", "Arkhangelsk", "Arklow", "Arles", "Arlesey", "Arlington", "Arlington heights", "Arlon", "Arma di taggia", "Armavir", "Armenia", "Armidale", "Armonk", "Armstrong", "Arnhem", "Arnsberg", "Arraial do cabo", "Arraijan", "Arras", "Arrasate", "Arrondissement of mirande", "Arroyo grande", "Arta", "Arteixo", "Artem", "Artemivsk", "Artur nogueira", "Arukla", "Arusha", "Arvada", "Arvika", "As", "Asahiku", "Asaka", "Asakurashi", "Asansol", "Asbest", "Asbestos", "Asbury", "Asbury park", "Aschaffenburg", "Ascoli piceno", "Ascona", "Ascot", "Ascot vale", "Asenovgrad", "Ashburn", "Ashburnham", "Ashbydelazouch", "Ashdod", "Ashdown", "Asheboro", "Asher", "Asheville", "Ashfield", "Ashford", "Ashgabat", "Ashikaga", "Ashland", "Ashland city", "Ashmore", "Ashqelon", "Ashtoninmakerfield", "Ashtonunderlyne", "Asia", "Asingan", "Asker", "Askim", "Asnieresparis", "Asniressurseine", "Aso", "Aspen", "Asperen", "Asperg", "Assamstadt", "Asse", "Assen", "Assendelft", "Assis", "Assisi", "Assomada", "Astana", "Asten", "Asti", "Aston", "Astoria", "Astrakhan", "Astrakhan", "Asuncion", "Asuncin", "Asyut", "Atbasar", "Atcham", "Atchison", "Ate", "Ath", "Athabasca", "Athens", "Athensclarke county", "Atherton", "Athina", "Athismons", "Athlone", "Athy", "Atibaia", "Atizapn de zaragoza", "Atka", "Atlanta", "Atlantic", "Atlantic beach", "Atlantic city", "Atlantic highlands", "Atlantis", "Atlautla", "Atlixco", "Atsugi", "Attendorn", "Attenkirchen", "Attleboro", "Attleborough", "Atwood", "Atyrau", "Aubagne", "Aubenas", "Aubergenville", "Aubervilliers", "Aubire", "Auburn", "Auburn hills", "Auburndale", "Auckland", "Audubon", "Audunletiche", "Aue", "Aughton", "Augsburg", "Augusta", "Aulnaysousbois", "Aumetz", "Aurangabad", "Aurich", "Aurillac", "Aurora", "Ausonia", "Aussonne", "Austell", "Austin", "Austintown", "Australian", "Autonomous city of buenos aires", "Autrans", "Auxerre", "Avalon", "Avanton", "Avanon", "Aveiro", "Avellaneda", "Avellino", "Aventura", "Averill park", "Aversa", "Avigdor", "Avignon", "Aviles", "Avion", "Avon", "Avon lake", "Avondale", "Avranches", "Awhitu", "Axbridge", "Axente sever", "Axioupoli", "Ayabeshi", "Ayacucho", "Aydn", "Aylesbury", "Aylesbury vale", "Aynor", "Ayr", "Azambuja", "Azkoitia", "Aznalcllar", "Azogues", "Azul", "Azusa", "Azzano decimo", "Azzio", "Ansa", "An", "Agabat", "Baar", "Baarn", "Bab ezzouar", "Babberich", "Babenhausen", "Babia", "Babice", "Babruysk", "Babson park", "Babylon", "Backa palanka", "Bacolod", "Bacolor", "Bacu", "Bad aibling", "Bad drkheim", "Bad drrheim", "Bad harzburg", "Bad hersfeld", "Bad homburg", "Bad honnef", "Bad nauheim", "Bad neustadt an der saale", "Bad oeynhausen", "Bad oldesloe", "Bad salzuflen", "Bad saulgau", "Bad schandau", "Bad schwalbach", "Bad segeberg", "Bad tlz", "Bad waldsee", "Bad wildungen", "Badajoz", "Badalona", "Baden", "Baden bei wien", "Badenbaden", "Badulla", "Baena", "Baflo", "Bafra", "Baghdad", "Bagley", "Bagn", "Bagnacavallo", "Bagnolssurcze", "Bagsvrd", "Baguio", "Bahama", "Bahawalpur", "Bahia de caraquez", "Baha blanca", "Baia mare", "Baiecomeau", "Baiesaintpaul", "Bailey", "Baillyromainvilliers", "Bailrigg", "Bainbridge island", "Baiona", "Bairiki", "Bairnsdale", "Baise", "Baishan", "Baja", "Bajmok", "Bakersfield", "Bakewell", "Bakkum", "Baku", "Bak", "Balakovo", "Balakowo", "Balashikha", "Balasore", "Balassagyarmat", "Balatonlelle", "Baldwin", "Baldwin park city of", "Baldwinsville", "Baleendah", "Balice", "Balignicourt", "Balikpapan", "Balingen", "Ball ground", "Ballaison", "Ballancourtsuressonne", "Ballarat", "Ballerup", "Ballina", "Ballsbridge", "Ballston lake", "Ballston spa", "Ballwin", "Ballycastle", "Balmes", "Balnarring", "Balnerio cambori", "Balsas", "Baltimore", "Baltiysk", "Balzan", "Balkesir", "Bal", "Bamako", "Bamberg", "Bampton", "Bananal", "Banbridge", "Banbury", "Bancroft", "Banda aceh", "Bandar abbas", "Bandar baru bangi", "Bandar lampung city", "Bandar pusat jengka", "Bandar seri begawan", "Bandare anzali", "Bandon", "Bandung", "Bandung city", "Banepa", "Baneshwor", "Banff", "Banfield", "Bangalore", "Bangi", "Bangil", "Bangkinang", "Bangkok", "Bangor", "Banha", "Banja luka", "Banjar baru city", "Banjarmasin", "Banjarnegara", "Banner elk", "Bannu", "Banora point", "Bansk bystrica", "Banswara", "Bantul", "Banyeres de mariola", "Banyoles", "Banyuwangi", "Baoding", "Baoji shi", "Baotou", "Bar harbor", "Barleduc", "Baraboo", "Baraka", "Barakaldo", "Barbacena", "Barbastro", "Barberton", "Barber del valls", "Barbona", "Barboursville", "Barcarena", "Barcelona", "Barcelos", "Bardejov", "Bardoli", "Bardowick", "Bardstown", "Bareilly", "Barendrecht", "Bargteheide", "Barharia", "Bari", "Barinas", "Barletta", "Barlin", "Barnagar", "Barnard castle", "Barnaul", "Barnegat township", "Barnesville", "Barnet", "Barneveld", "Barnsley", "Barnstable", "Barnstaple", "Barpeta", "Barquisimeto", "Barra do garas", "Barra do pira", "Barra mansa", "Barranco", "Barranquilla", "Barraux", "Barre", "Barreiro", "Barreiro e lavradio", "Barretos", "Barrie", "Barrington", "Barsinghausen", "Bartlesville", "Bartlett", "Bartow", "Barueri", "Baruipur", "Barum", "Barwon heads", "Baro de antonina", "Baro de geraldo", "Basalt", "Basauri", "Basel", "Basildon", "Basin", "Basingstoke", "Bassano del grappa", "Bassano in teverina", "Bassussarry", "Bastak", "Bastia", "Bastia umbra", "Bastogne", "Bastos", "Bastrop", "Batam city", "Batangas city", "Batatais", "Batavia", "Bataysk", "Batchelor", "Batesville", "Bath", "Bathinda", "Bathurst", "Batna", "Baton rouge", "Battambang", "Battle", "Battle creek", "Battle ground", "Battlefield", "Batu pahat", "Batumi", "Bauchi", "Baunatal", "Bauru", "Bauska", "Bautzen", "Baxter", "Bay city", "Bay lake", "Bay minette", "Bay st louis", "Bay village", "Bayamn", "Bayfield", "Bayonne", "Bayou cane", "Bayreuth", "Baytown", "Baywoodlos osos", "Baka palanka", "Baki petrovac", "Beer sheva", "Beach park", "Beachwood", "Beacon", "Beaconsfield", "Bear valley", "Bearden", "Beauceville", "Beaudesert", "Beaufort", "Beauharnois", "Beaumont", "Beauvais", "Beaver dam", "Beavercreek", "Beaverdale", "Beaverton", "Beawar", "Bebedouro", "Beckingen", "Beckingham", "Beckley", "Beckville", "Beclean", "Bedburg", "Beddingestrand", "Bedford", "Bedminster township", "Bedum", "Beek", "Beekubbergen", "Beelen", "Beer sheva", "Beernem", "Beers nb", "Beerse", "Beersheba", "Begues", "Beihai", "Beijing", "Beirut", "Beja", "Bekasi", "Bekasi city", "Bel air", "Belagavi", "Belas", "Belcamp", "Belfast", "Belfield", "Belford roxo", "Belfort", "Belgium", "Belgorod", "Belgrade", "Belin", "Belize city", "Bella vista", "Bellante stazione", "Bellaterra", "Bellavista", "Belle glade", "Belle plaine", "Belle rive", "Belle vernon", "Bellefontaine", "Bellefonte", "Belleview", "Belleville", "Bellevue", "Bellheim", "Bellingham", "Bellinzona", "Bellmore", "Bello", "Bellpuig", "Belmar", "Belmont", "Belo blato", "Belo horizonte", "Beloit", "Belovo", "Belp", "Belton", "Beltsville", "Belvidere", "Belm", "Bemidji", "Ben lomond", "Benalla", "Bend", "Bender", "Bendorf", "Bene beraq", "Benedict", "Benevento", "Bengaluru", "Bengbu", "Benghazi", "Bengkulu", "Beni", "Beni suef", "Benicssim", "Benidorm", "Benifai", "Benin city", "Bennekom", "Bennington", "Benoni", "Bensalem", "Bensenville", "Bensheim", "Bentelo", "Bento goncalves", "Bento gonalves", "Benton", "Benton harbor", "Bentonville", "Beograd", "Berango", "Berazategui", "Berck", "Berdsk", "Berdyansk", "Berdychiv", "Berea", "Berekuso", "Berg", "Berga", "Bergambacht", "Bergamo", "Bergen", "Bergen auf rgen", "Bergen op zoom", "Bergerac", "Bergheim", "Bergisch gladbach", "Bergkamen", "Berisso", "Beriin", "Berkane", "Berkel", "Berkel en rodenrijs", "Berkeley", "Berkeley township", "Berkhamsted", "Berkley", "Berlaar", "Berlare", "Berlicum", "Berlin", "Berlin center", "Berlin charter township", "Berlin township", "Bern", "Bernal", "Bernalda", "Bernardino de campos", "Bernards", "Bernardsville", "Bernau am chiemsee", "Bernau bei berlin", "Bernay", "Berndorf", "Bernex", "Beroun", "Berrechid", "Berrigan", "Bertamirns", "Berthoud", "Bertioga", "Berwick", "Berwyn", "Besanon", "Beselich", "Beslan", "Bessie", "Best", "Bet shemesh", "Betekom", "Bethel", "Bethel park", "Bethelsdorp", "Bethesda", "Bethlehem", "Bethpage", "Betim", "Betina", "Bettembourg", "Bettendorf", "Beulah", "Beuningen", "Bevaix", "Beverley", "Beverlo", "Beverly", "Beverly hills", "Beverwijk", "Bewdley", "Bex", "Beynes", "Beypazar", "Bezons", "Bhaktapur", "Bharuch", "Bhavnagar", "Bhawanipatna", "Bhilai", "Bhilwara", "Bhimavaram", "Bhimdatta", "Bhiwani", "Bhopal", "Bhubaneshwar", "Bhubaneswar", "Bhuj", "Bialystok", "Biarritz", "Biatorbgy", "Biaystok", "Bicester", "Bidart", "Biddeford", "Bideford", "Bielbenken", "Bielbienne", "Bielefeld", "Biella", "Bielskobiala", "Bielskobiaa", "Bienenbttel", "Bietigheimbissingen", "Big bear", "Big bear lake", "Big bend national park", "Big lake", "Big rapids", "Big sky", "Big yengo", "Bigfork", "Bigues i riells", "Biha", "Bijeljina", "Bijnor", "Bijolia", "Bikaner", "Bila tserkva", "Bilahi", "Bilbao", "Bilecik", "Billeberga", "Billerbeck", "Billerica", "Billings", "Billund", "Biloxi", "Bilthoven", "Bilzen", "Binalonan", "Binasco", "Binfield", "Bingen", "Binghamton", "Binissalemmallorca do", "Binjhua", "Binnaguri", "Binyaminagivat ada", "Binzhou shi", "Binn", "Biot", "Biot sophia antipolis", "Birchwood", "Birganj", "Birigui", "Biriwa", "Birjand", "Birkenau", "Birkenhead", "Birkirkara", "Birmingham", "Birobidzhan", "Birstein", "Birtamod", "Bisag", "Bischheim", "Bischofsheim", "Bishkek", "Bishopville", "Bisingen", "Biskra", "Bismarck", "Bistriansud", "Bitetto", "Bitola", "Bittern", "Bixby", "Bizeneuille", "Bizerte", "Bjelovar", "Bjrred", "Black forest", "Black hawk", "Black mountain", "Black river", "Blackburn", "Blackpool", "Blackrock", "Blacksburg", "Blacktown", "Blackwater", "Blacon", "Bladel", "Blagnac", "Blagoevgrad", "Blagoveshchensk", "Blaine", "Blainville", "Blairstown", "Blairsville", "Blanchard", "Blandford forum", "Blanding", "Blanes", "Blankenberge", "Blantyre", "Blauvelt", "Blaydon", "Bletchley", "Blida", "Blighty", "Blitar", "Bloemfontein", "Blois", "Blonay", "Bloomfield", "Bloomfield hills", "Bloomington", "Blore", "Blossvale", "Blou", "Blountville", "Blue ash", "Blue bell", "Blue ridge", "Blue springs", "Bluefield", "Bluff city", "Bluffdale", "Bluffton", "Blumenau", "Blunham", "Blyth", "Bnei brak", "Boa vista", "Boadilla del monte", "Boalia", "Boalsburg", "Bobigny", "Bobingen", "Bobodioulasso", "Boca chica", "Boca del ro", "Boca raton", "Bocholt", "Bochum", "Bodegraven", "Boden", "Bodrum", "Bod", "Boecillo", "Boekel", "Boekelo", "Boerne", "Boertala mengguzizhizhou", "Boffalora sopra ticino", "Bogart", "Bogen", "Bogmalo", "Bognor regis", "Bogor", "Bogota", "Bogot", "Bogra", "Bogu", "Bohemia", "Bohuslav", "Boiling springs", "Bois darcy", "Boisbriand", "Boise", "Boissysaintlger", "Boizenburg", "Bojano", "Bojonegoro", "Bokaro", "Bokaro steel city", "Boksburg", "Bolinao", "Bolinas", "Bolivar", "Bolivar peninsula", "Bologna", "Bolshaya elnya", "Bolsover", "Bolsward", "Bolton", "Bolu", "Boluvampatti", "Bolzano", "Bom jesus da penha", "Bom princpio", "Bonaire", "Boncourt", "Bongaigaon", "Bonham", "Bonheiden", "Bonita springs", "Bonn", "Bonney lake", "Bonningueslsardres", "Bonny doon", "Bonsall", "Bontoc", "Booischot", "Boom", "Boone", "Boonton", "Boonwood", "Boortmeerbeek", "Boothbay", "Boothbay harbor", "Boqueron", "Bor", "Boretbar", "Borazjan", "Borchen", "Bordeaux", "Bordentown township", "Bordesholm", "Borehamwood", "Borensberg", "Borgentreich", "Borger", "Borgomanero", "Borkwalde", "Borlnge", "Borne", "Bornem", "Borowskie michay", "Borsbeek", "Borup", "Bors", "Bosa", "Bosau", "Bose", "Boskovice", "Bossier city", "Boston", "Bothell", "Botkyrka", "Bottighofen", "Bottmingen", "Bottrop", "Botucatu", "Bou saada", "Boucherville", "Bouguenais", "Bougyvillars", "Bouillargues", "Boulaymoselle", "Boulder", "Boulder creek", "Boulognebillancourt", "Boulognesurmer", "Bountiful", "Bourbonnais", "Bourgenbresse", "Bourglareine", "Bourglsvalence", "Bourges", "Bourgoinjallieu", "Bourne", "Bournemouth", "Bouton", "Boves", "Bow", "Bowen", "Bowen mountain", "Bowenfels", "Bowie", "Bowling green", "Bowmanville", "Bowser", "Boxborough", "Boxholm", "Boxtel", "Boyac", "Boyarka", "Boynton beach", "Bozeman", "Bra", "Bracciano", "Bracebridge", "Bracebridge heath", "Brackley", "Bracknell", "Bradenton", "Bradford", "Bradford west gwillimbury", "Bradfordonavon", "Braga", "Bragana", "Bragana paulista", "Brahmapur", "Brainelalleud", "Braintree", "Brakel", "Bramhope", "Bramming", "Brampton", "Bramsche", "Brandeis", "Brandenburg", "Brandenburg an der havel", "Brandon", "Brands nad labemstar boleslav", "Branford", "Braniewo", "Brantford", "Brasschaat", "Brasstown", "Braslia", "Bratislava", "Bratislava  star mesto", "Bratsk", "Brattleboro", "Braubach", "Braunau am inn", "Braunschweig", "Braunston", "Bray", "Brayford pool", "Brazil", "Brazzaville", "Brao do norte", "Braov", "Brea", "Breachwood green", "Brebes subdistrict", "Breckland district", "Brecksville", "Breda", "Bredene", "Bree", "Bregenz", "Breim", "Breitenfurt bei wien", "Breitenwang", "Bremen", "Bremerhaven", "Bremerton", "Brentford", "Brentwood", "Brenzone", "Brescia", "Bressanone", "Bresson", "Brest", "Bretten", "Breugel", "Breukelen", "Brevard", "Brewster", "Briarcliff manor", "Bridge of allan", "Bridgend", "Bridgeport", "Bridgeton", "Bridgewater", "Bridgnorth", "Bridgwater", "Briecomterobert", "Brielle", "Brier", "Brierfield", "Brierley hill", "Brighouse", "Brighton", "Brignais", "Brignoles", "Brignoud", "Brilon", "Brimfield", "Brindisi", "Brisbane", "Brisbane airport", "Bristol", "Bristol township", "Bristow", "Brivelagaillarde", "Brixen", "Brixham", "Brno", "Broadway", "Broc", "Brochier", "Brockport", "Brockton", "Brockville", "Brodhead", "Broek op langedijk", "Broken arrow", "Bromont", "Bromsgrove", "Bron", "Bronte", "Brook park", "Brookfield", "Brookhaven", "Brookings", "Brooklawn", "Brooklin", "Brookline", "Brooklyn", "Brooklyn park", "Broomall", "Broomfield", "Brossard", "Brosso", "Brotas", "Brough", "Brovary", "Brownsburg", "Brownsdale", "Brownsville", "Bruce", "Bruckmhl", "Bruges", "Brugg", "Brugge", "Bruksvallarna", "Brumath", "Bruneck", "Brunssum", "Brunswick", "Brusque", "Brussel", "Brussels", "Bruxelles", "Bruyreslechtel", "Bruyressuroise", "Bruz", "Brysurmarne", "Bryan", "Bryansk", "Bryn mawr", "Bryne", "Bryson city", "Brbeuf", "Brtignysurorge", "Brila", "Brko", "Bubikon", "Bucaramanga", "Buchach", "Buchanan", "Bucharest", "Buchbach", "Buchen", "Buchholz in der nordheide", "Buchs", "Buckeye", "Buckhannon", "Buckingham", "Buckley", "Bucureti", "Buda", "Budakalsz", "Budapest", "Budars", "Budel", "Budrio", "Budva", "Budweis", "Buea", "Buellton", "Buena park", "Buena vista", "Buenavista", "Buenos aires", "Bueu", "Buffalo", "Buffalo grove", "Buford", "Buga", "Buggenhout", "Buhl", "Buitenpost", "Bujumbura", "Bukan", "Bukittinggi city", "Bukoba", "Bulacan", "Bulawayo", "Bulle", "Bundaberg", "Bundoran", "Bungoma", "Bunkyo", "Bunkyku", "Bunnik", "Bunschotenspakenburg", "Bunyola", "Buraydah", "Burbank", "Burdur", "Buressuryvette", "Burgas", "Burgdorf", "Burgh", "Burgh le marsh", "Burgos", "Burgthann", "Burgum", "Burgwerd", "Buriti alegre", "Buritis", "Burjassot", "Burke", "Burkesville", "Burleson", "Burlingame", "Burlington", "Burnaby", "Burnand", "Burnettown", "Burnhamonsea", "Burnley", "Burns", "Burnsville", "Burr ridge", "Bursa", "Burton", "Burton upon trent", "Burum", "Burwood", "Bury", "Bury saint edmunds", "Burzaco", "Busan", "Bushehr", "Bushkill", "Busnago", "Bussignyprslausanne", "Bussum", "Bussysaintmartin", "Busto arsizio", "Butare", "Butler", "Butovo", "Butt", "Butte", "Butterworth", "Buttisholz", "Butzbach", "Buxtehude", "Buxton", "Buxy", "Buyeogun", "Buzu", "Byblos", "Bydgoszcz", "Byron", "Byron bay", "Bytom", "Bytonia", "Byta", "Bzenec", "Bretswil", "Bgles", "Bccar", "Bthune", "Bziers", "Bckeburg", "Bnde", "Bli", "Bezov nad svitavou", "Bc ninh", "Cabanatuan city", "Cabanes", "Cabarete", "Cabimas", "Cabin john", "Cabo frio", "Cabo san lucas", "Caboolture", "Cabriresdavignon", "Cabuyao", "Cachan", "Cachari", "Cachoeira paulista", "Cachoeirinha", "Cachoeiro de itapemirim", "Cadolive", "Caen", "Caernarfon", "Caerphilly", "Cagayan de oro", "Cagnessurmer", "Caguas", "Cahul", "Caic", "Caieiras", "Cainta", "Cairns", "Cairo", "Cajamar", "Cajamarca", "Cala", "Cala murada", "Calabar", "Calabasas", "Calais", "Calama", "Calamba", "Calcot", "Caldas", "Caldas da rainha", "Caldas novas", "Caldes de montbui", "Caldogno", "Caldwell", "Caledon", "Calera", "Calexico", "Calgary", "Calhan", "Calheta de so miguel", "Calhoun", "Cali", "California", "Calistoga", "Callaghan", "Callao", "Calliano", "Calodyne", "Calolziocorte", "Caloocan", "Caloundra", "Caltanissetta", "Calumet city", "Caluso", "Calvizzano", "Calvi", "Camagey", "Camaragibe", "Camarillo", "Camas", "Camb", "Cambados", "Camberley", "Camberwell", "Cambridge", "Camden", "Camembert", "Camerino", "Camillus", "Camiri", "Camp hill", "Camp lejeune", "Campan", "Campana", "Campbell", "Campbell river", "Campbellsville", "Campeche", "Campillos", "Campina grande", "Campinas", "Campo bom", "Campo de criptana", "Campo grande", "Campo largo", "Campo limpo paulista", "Campo maior", "Campo mouro", "Campobasso", "Campobello di licata", "Campos do jordo", "Campos dos goytacazes", "Campos novos", "Can mas", "Can picafort", "Can tho", "Can tho city", "Canaan", "Canad", "Canandaigua", "Canastota", "Canberra", "Canberra international airport", "Canby", "Cancn", "Candelo", "Candia", "Candiac", "Canegrate", "Canela", "Canelinha", "Canelones", "Canet de mar", "Canfield", "Cangas", "Cangas de ons", "Cangzhou", "Canio", "Canmore", "Cannelton", "Cannes", "Cannock", "Canoas", "Canonsburg", "Canosa", "Canosa di puglia", "Canterbury", "Canton", "Cant", "Canyon", "Canyon lake", "Caorle", "Caphaitien", "Caparica", "Capbreton", "Cape charles", "Cape coast", "Cape coral", "Cape elizabeth", "Cape fear", "Cape girardeau", "Cape haze", "Cape may", "Cape town", "Capelle", "Capelle aan den ijssel", "Capilla del monte", "Capinzal", "Capitol heights", "Capitola", "Capivari", "Capo dorlando", "Caposele", "Cappelle sul tavo", "Capradosso", "Capriasca", "Caprie", "Capo da canoa", "Caracas", "Caraguatatuba", "Carangola", "Carapicuba", "Caratinga", "Carbondale", "Carbonia", "Carcaixent", "Carcar city", "Carcassonne", "Carcavelos", "Cardedeu", "Cardiff", "Cardigan", "Cardona", "Cardoso", "Cardross", "Cariacica", "Cariamanga", "Carl junction", "Carleton place", "Carlinville", "Carlisle", "Carlos barbosa", "Carlsbad", "Carmagnola", "Carmarthen", "Carmel", "Carmelbythesea", "Carmen de viboral", "Carmichael", "Carmiel", "Carmo", "Carnation", "Carnaxide", "Carol stream", "Carolina", "Carpentersville", "Carpi", "Carpinteria", "Carquefou", "Carrara", "Carrboro", "Carrickfergus", "Carrickmacross", "Carriganore", "Carrigart", "Carrollton", "Carson", "Carson city", "Cartagena", "Cartago", "Cartersville", "Carterton", "Carthage", "Cartigny", "Caruaru", "Carugo", "Carupano", "Carver", "Carversville", "Cary", "Carzinho", "Carpano", "Casa grande", "Casa santa", "Casablanca", "Casal de cambra", "Casalecchio di reno", "Casalgrande", "Casalromano", "Casares", "Casarsa della delizia", "Casasco dintelvi", "Casatenovo", "Cascade", "Cascadia", "Cascais", "Cascavel", "Casciana terme", "Cascina", "Casco urbano de tame", "Caselle", "Caseros", "Caserta", "Casoria", "Casper", "Cassagnabretournas", "Casselberry", "Castaic", "Castano primo", "Castedducagliari", "Castelar", "Castelbellino", "Castelfidardo", "Castelfranco veneto", "Castellammare di stabia", "Castellamonte", "Castellanza", "Castelldefels", "Castell de rugat", "Castelln de la plana", "Castelnuovo di garfagnana", "Castelo", "Castelo branco", "Castelsarrasin", "Castelvetro di modena", "Castiel", "Castine", "Castle donington", "Castle rock", "Castlebar", "Castlemaine", "Castres", "Castricum", "Castries city", "Castro", "Castro del ro", "Castro urdiales", "Castro valley", "Castro verde", "Castroprauxel", "Castroville", "Cataguases", "Catamarca", "Catania", "Catanzaro", "Catasauqua", "Catende", "Catlett", "Catonsville", "Catskill", "Cattolica", "Caucaia", "Caucasia", "Caulfield east", "Cavalcante", "Cavan", "Cave", "Cave creek", "Cavite city", "Caxias", "Caxias do sul", "Cayce", "Cayey", "Cayucos", "Cazadero", "Cazenovia", "Cazin", "Caapava", "Caete", "Cebu city", "Cedar city", "Cedar crest", "Cedar falls", "Cedar hill", "Cedar hills", "Cedar island", "Cedar lake", "Cedar park", "Cedar rapids", "Cedarburg", "Celaya", "Celebration", "Celina", "Celje", "Cellamare", "Celle", "Centallo", "Centenario", "Centennial", "Center moriches", "Center point", "Centereach", "Centerton", "Centerville", "Central", "Central and western district", "Central city", "Central coast", "Central islip", "Central jakarta city", "Central point", "Centralia", "Centreville", "Centurion", "Cerdanyola del valls", "Ceres", "Cerete", "Cergy", "Cerhovice", "Cernay", "Cerritos", "Cervera", "Cesate", "Cesena", "Cesenatico", "Ceska lipa", "Ceske budejovice", "Cessonsvign", "Cessy", "Cestas", "Ceuta", "Ceyreste", "Chagford", "Chagni", "Chagrin falls", "Chai nat", "Chakwl", "Chalcis", "Chalfont", "Chalkida", "Chalmers", "Chalmette", "Chalonsursane", "Chambana", "Chambersburg", "Chambly", "Chambourcy", "Chambry", "Chamonix", "Champagn", "Champagnsainthilaire", "Champaign", "Champignelles", "Champlain", "Champssurmarne", "Chandigarh", "Chandighar", "Chandler", "Chandlers ford", "Chandragadhi", "Changchun", "Changchun shi", "Changde", "Changsha", "Changsha shi", "Changshu", "Changwon", "Changzhou", "Chanhassen", "Chania", "Chantada", "Chanthaburi", "Chantilly", "Chanzeaux", "Chaoyang", "Chaozhou", "Chapala", "Chapec", "Chapel hill", "Chapin", "Chappell hill", "Chardon", "Charentonlepont", "Charlbury", "Charleroi", "Charles town", "Charleston", "Charlestown", "Charleville", "Charlevillemzires", "Charlotte", "Charlottenlund", "Charlottesville", "Charlottetown", "Charlton", "Charmoille", "Charter township of clinton", "Chartres", "Chascoms", "Chase", "Chaska", "Chassesurrhne", "Chasseneuildupoitou", "Chassieu", "Chatham", "Chathamkent", "Chatou", "Chattanooga", "Chaville", "Chavornay", "Cheadle", "Cheboksary", "Cheektowaga", "Chel", "Chelan", "Chelles", "Chelmsford", "Chelsea", "Cheltenham", "Chelyabinsk", "Chemnitz", "Chenab nagar", "Cheney", "Chengannur", "Chengde", "Chengdu", "Chengdu shi", "Chennai", "Chennai city corporation limits", "Chenzhou", "Cheonan", "Cheonansi", "Cheongju", "Chepstow", "Cherbourg", "Cherepovets", "Cherkasy", "Chernihiv", "Chernivtsi", "Chernogolovka", "Chernogorsk", "Cherry gardens", "Cherry hill", "Chesapeake", "Chesapeake beach", "Chesapeake city", "Chesham", "Cheshire", "Cheste", "Chester", "Chester springs", "Chesterfield", "Chesterton", "Chestertown", "Chetumal", "Chetwynd", "Cheverie", "Chevy chase", "Cheyenne", "Cheyyar", "Chemno", "Chiang mai", "Chiang rai", "Chiasso", "Chiavari", "Chiavenna", "Chiayi city", "Chiba", "Chibougamau", "Chicago", "Chichester", "Chickasha", "Chicken", "Chiclana", "Chiclana de la frontera", "Chiclayo", "Chico", "Chicoloapan", "Chicopee", "Chieri", "Chieti", "Chievres", "Chihuahua", "Chikkamagaluru", "Chikuma", "Chikushi county", "Chilaw", "Chillicothe", "Chillin", "Chilliwack", "Chilln", "Chilpancingo", "Chilpancingo de los bravo", "Chilton", "Chimalhuacan", "Chimalhuacn", "Chimbote", "China", "China grove", "Chinal", "Chinchina", "Chino", "Chino hills", "Chino valley", "Chioggia", "Chios", "Chippenham", "Chippewa falls", "Chipping campden", "Chiquimula", "Chisimayu", "Chisinau", "Chita", "Chitina", "Chittagong", "Chittaranjan", "Chittoor", "Chiuduno", "Chiyoda", "Chiyodaku", "Chiinu", "Chiinu", "Chlmec", "Chofu", "Chojnice", "Cholet", "Choloma", "Cholula de rivadavia san pedro cholula", "Choluteca", "Chomu", "Chonaslamballan", "Chongqing", "Chorley", "Chorrillos", "Chortkiv", "Chorzow", "Chorzw", "Chos malal", "Choshi", "Chowchilla", "Christchurch", "Christiansburg", "Christmas", "Chula vista", "Chuncheon", "Chuo", "Chupaca", "Chur", "Churachandpur", "Church gresley", "Churchdown", "Churchtown", "Churdan", "Chlonsenchampagne", "Chteaugontier", "Chteauthierry", "Chteauguay", "Chteauneufsurloire", "Chtenaymalabry", "Chnebourg", "Chku", "Ciamis subdistrict", "Ciampino", "Cianjur subdistrict", "Cianorte", "Cibinong", "Cicero", "Cidade ocidental", "Cidra", "Ciechanki", "Ciempozuelos", "Cienfuegos", "Cieszyn", "Cilacap", "Cilegon", "Cileungsi", "Cimahi", "Cimahi city", "Cincinnati", "Ciney", "Cintegabelle", "Cintrunigo", "Cipoletti", "Cipolletti", "Circle", "Cirebon", "Cirencester", "Cis", "Cisndie", "Citeureup", "Citrus heights", "Citt di castello", "Citt santangelo", "City", "City of cambridge", "City of edinburgh", "City of middleton", "City of turlock", "City of verona", "Cit universitaire mentouri", "Ciudad coahuila km57", "Ciudad de la costa", "Ciudad de mxico", "Ciudad del carmen", "Ciudad del este", "Ciudad guayana", "Ciudad guzmn", "Ciudad hidalgo", "Ciudad juarez", "Ciudad jurez", "Ciudad lpez mateos", "Ciudad madero", "Ciudad nezahualcyotl", "Ciudad obregon", "Ciudad obregn", "Ciudad ojeda", "Ciudad real", "Ciudad universitaria", "Ciudad valles", "Ciudad victoria", "Ciutadella de menorca", "Cividale del friuli", "Civitavecchia", "Cizos", "Clackamas", "Clamart", "Claremont", "Clarence", "Clarencerockland", "Clarendon", "Clarion", "Clark", "Clarks summit", "Clarksburg", "Clarkson", "Clarkston", "Clarksville", "Clausthalzellerfeld", "Clawson", "Claxton", "Clay", "Clayton", "Clear spring", "Clearfield", "Clearlake", "Clearwater", "Cleethorpes", "Clemmons", "Clemson", "Clermont", "Clermontferrand", "Cles", "Clevedon", "Cleveland", "Cleveland heights", "Clewiston", "Clichy", "Cliffside park", "Clifton", "Clinton", "Clintonville", "Clitheroe", "Clive", "Clonmel", "Cloppenburg", "Closter", "Cloverdale", "Clovis", "Cluj", "Clujnapoca", "Clunes", "Cluses", "Clyde", "Clyde hill", "Coacalco", "Coalville", "Coatesville", "Coatzacoalcos", "Cobham", "Cobija", "Cobourg", "Coburg", "Cochabamba", "Cochrane", "Cockeysville", "Cocoa", "Cocoa beach", "Coconut creek", "Codrington", "Codroipo", "Codsall", "Cody", "Coesfeld", "Coeur dalene", "Coevorden", "Coffeyville", "Coffs harbour", "Cogealac", "Cognac", "Cohoes", "Coimbatore", "Coimbra", "Colatina", "Colchester", "Cold spring", "Cold spring harbor", "Coldwater", "Colerain", "Coleraine", "Colfax", "Colima", "Colina", "Colleferro", "College park", "College place", "College station", "Collegedale", "Collegeville", "Collegno", "Colleyville", "Collierville", "Collingswood", "Collingwood", "Collinsville", "Collooney", "Colmar", "Colmenar viejo", "Colmenarejo", "Colne", "Cologne", "Cologno monzese", "Coloma", "Colombes", "Colombo", "Colomiers", "Colonia del sacramento", "Colorado springs", "Colton", "Columbia", "Columbia falls", "Columbiana", "Columbus", "Colder", "Coln", "Comas", "Combourg", "Comilla", "Commack", "Commerce", "Commerce charter township", "Commerce city", "Commessaggio", "Commonwealth", "Como", "Comodoro rivadavia", "Comonfort", "Comox", "Compigne", "Compton", "Concepcion", "Concepcin", "Concepcin del uruguay", "Conchali", "Concord", "Concordia", "Concn", "Concrdia", "Conflanssaintehonorine", "Congers", "Congerville", "Congleton", "Congonhas", "Conil", "Conneautville", "Connersville", "Conroe", "Conselheiro lafaiete", "Conselheiro mairinck", "Conshohocken", "Constantine", "Constana", "Contagem", "Controguerra", "Conversano", "Converse", "Conway", "Conwy", "Conyers", "Cookeville", "Cookshireeaton", "Coolbellup", "Coolum beach", "Coon rapids", "Cooperstown", "Coos bay", "Copenhagen", "Copiap", "Coppell", "Copperas cove", "Coquimbo", "Coquitlam", "Coral gables", "Coral springs", "Coralville", "Coram", "Corbeilessonnes", "Cordenons", "Cordova", "Core", "Coremas", "Corfu", "Corinth", "Cork", "Cornas", "Cornelius", "Cornell", "Cornell de llobregat", "Corning", "Cornwall", "Coro", "Coroglen", "Coromandel", "Corona", "Coronado", "Coronel fabriciano", "Coronel surez", "Corpus christi", "Corralejo", "Corrales", "Correntina", "Corrientes", "Corrimal", "Corsica", "Corsicana", "Corsico", "Cortaillod", "Corte", "Cortina dampezzo", "Cortland", "Corvallis", "Corydon", "Cosamaloapan", "Cosenza", "Coshocton", "Cosmpolis", "Cossombrato", "Costa da caparica", "Costa mesa", "Cotabato city", "Cotati", "Cotia", "Cotonou", "Cottage grove", "Cottbus", "Cotter", "Cottingham", "Cottleville", "Coulsdon", "Council bluffs", "Countryside", "County waterford", "Coupeville", "Courbevoie", "Courdimanche", "Courrires", "Courtenay", "Courtice", "Courtland", "Coutances", "Coventry", "Covina", "Covington", "Cowichan valley subd c", "Cowlesville", "Coxs bazar", "Coxen hole", "Coxim", "Coyoacn", "Cozad", "Cozumel", "Con", "Crabtree", "Cracow", "Craigavon", "Crailsheim", "Craiova", "Cranberry township", "Cranbrook", "Cranbury township", "Cranfield", "Cranford", "Cranston", "Cravinhos", "Crawley", "Creal springs", "Crecora", "Creil", "Cremlingen", "Cremona", "Crescent", "Crested butte", "Creston", "Crestview", "Crestview hills", "Creve coeur", "Crevillent", "Crewe", "Cricima", "Crick", "Cringleford", "Cristalina", "Crocy", "Crofton", "Croix", "Crolles", "Cromwell", "Cronulla", "Cross plains", "Cross roads", "Crosslake", "Crossville", "Crotononhudson", "Crowborough", "Crowley", "Crown point", "Crownsville", "Crowthorne", "Croydon", "Crozet", "Crumlin", "Cruz das almas", "Cruzeiro", "Cruzeta", "Crystal", "Crystal city", "Crystal lake", "Crystal river", "Crpyenvalois", "Crteil", "Cuarte de huerva", "Cuauhtmoc", "Cuautitln izcalli", "Cuba", "Cubelles", "Cucuta", "Cudahy", "Cuddalore", "Cuenca", "Cuernavaca", "Cuiab", "Cuijk", "Cujmir", "Culemborg", "Culiacn", "Culiacn rosales", "Cullman", "Cullowhee", "Culpeper", "Culver city", "Cumana", "Cumbaya", "Cumberland", "Cumming", "Cuneo", "Cunha por", "Cupertino", "Cuq", "Curic", "Curitiba", "Curridabat", "Curtea de arge", "Cusco", "Cushing", "Cuttack", "Cutuglahua", "Cuyahoga falls", "Cuyahoga heights", "Cwmbran", "Cyberjaya", "Cypress", "Czechowicedziedzice", "Czermin", "Czersk", "Czestochowa", "Czstochowa", "Cceres", "Cceres", "Cdiz", "Cjar", "Cret", "Crdoba", "Ccuta", "Co", "Da lat", "Da nang", "Da nang city", "Dachau", "Dacula", "Dade city", "Dadeville", "Daegu", "Daejeon", "Dahlonega", "Daiku", "Daisetta", "Dakar", "Dakota dunes", "Dalaguete", "Dalat", "Dale city", "Daleville", "Dalhousie", "Dali", "Dalian", "Dalian shi", "Dalj", "Dallas", "Dallastown", "Dalmand", "Dalmine", "Dalton", "Daly city", "Damak", "Damariscotta", "Damascus", "Damghan", "Dammam", "Dana point", "Danbury", "Dandenong", "Dandong", "Dandong shi", "Dania beach", "Dannstadtschauernheim", "Danvers", "Danville", "Danville city", "Daong", "Daphne", "Dar el beda", "Dar es salaam", "Daraa", "Darby", "Darien", "Darkhan", "Darlington", "Darmstadt", "Darnestown", "Dartford", "Dartmouth", "Daruvar", "Darwen", "Darwin", "Darca", "Dasmarias", "Dasmarias city", "Date", "Datong", "Datteln", "Daugavpils", "Dauphin", "Davao city", "Davenport", "Daventry", "David district", "Davidson", "Davie", "Davis", "Davison", "Davos", "Davutpaa", "Dawsonville", "Dax", "Dayton", "Daytona beach", "De bilt", "De kalb", "De kwakel", "De pere", "De soto", "De steeg", "Deadwood", "Dearborn", "Dearborn heights", "Debary", "Debica", "Debrecen", "Decatur", "Decin", "Decorah", "Dedovsk", "Deephaven", "Deer", "Deer lake", "Deerfield", "Deerfield beach", "Degerfors", "Dehiwalamount lavinia", "Dehli", "Dehradun", "Deidesheim", "Deil", "Deinze", "Dej", "Dekalb", "Del mar", "Del monte forest", "Del rio", "Delafield", "Deland", "Delanson", "Delaware", "Delft", "Delfzijl", "Delhi", "Delicias", "Delleyportalban", "Delmar", "Delray beach", "Delta", "Delmont", "Den haag", "Den helder", "Den hoorn", "Denbigh", "Denderleeuw", "Dendermonde", "Denham springs", "Denizli", "Denkendorf", "Denmark", "Denpasar", "Denton", "Denton township", "Denver", "Denville", "Deoghar", "Depauville", "Depok", "Depok city", "Deqen", "Derby", "Derry", "Derwood", "Des moines", "Des plaines", "Desamparados", "Desenzano", "Desenzano del garda", "Desertmartin", "Dessaurolau", "Destin", "Detmold", "Detroit", "Detva", "Deurne", "Deuxmontagnes", "Deva", "Deventer", "Devizes", "Devon", "Devonport", "Dexter", "Deyang", "Deyang shi", "Dfw airport", "Dhahran", "Dhaka", "Dhanbad", "Dhapakhel", "Dharamshala", "Dharmapuri", "Dhodial", "Diadema", "Diamantina", "Diamond bar", "Diamond point", "Dick oya", "Dickson", "Didam", "Didcot", "Didhoo", "Die", "Dieburg", "Diemen", "Dienten am hochknig", "Diepenbeek", "Diepenheim", "Diepoldsau", "Dierdorf", "Dieren", "Diest", "Dietikon", "Dighaljar", "Digne", "Dijon", "Diksmuide", "Dillingham", "Dimitrovgrad", "Dinajpur", "Dinard", "Dingxi", "Dinokwe", "Dinslaken", "Dinteloord", "Dipolog city", "Dirkshorn", "Dir", "Diss", "Ditzingen", "Divino", "Divinpolis", "Divonnelesbains", "Dixon", "Disd", "Djamaa", "Djibouti", "Dmitrov", "Dnepropetrovsk", "Dniprodzerzhynsk", "Dnipropetrovsk", "Dobbs ferry", "Dobczyce", "Dobele", "Doboj", "Dobrush", "Dodewaard", "Dodge city", "Doesburg", "Doetinchem", "Dogana", "Doha", "Dois vizinhos", "Dokkum", "Dolgoprudny", "Dolhasca", "Dolianova", "Dollar", "Doln hbity", "Dolores", "Dolores hidalgo", "Domingos martins", "Domodedovo", "Donaustadt", "Donauworth", "Doncaster", "Donegal", "Donetsk", "Dongen", "Donges", "Dongguan", "Dongguan shi", "Dongyang", "Dongying", "Donji miholjac", "Donostia gpuzkoa", "Donostiasan sebastin guipzcoa", "Donskoy", "Doorn", "Doorwerth", "Dorado", "Dordrecht", "Dormagen", "Dornbirn", "Dorohoi", "Dorsten", "Dortmund", "Dos hermanas", "Dos quebradas", "Dossenheim", "Douai", "Douala", "Douala iii", "Doubs", "Douglas", "Douglassville", "Douglasville", "Dour", "Dourados", "Dourdan", "Dover", "Dover plains", "Downers grove", "Downey", "Downingtown", "Doylestown", "Dracena", "Drachten", "Dracut", "Draguignan", "Drakenstein local municipality", "Drammen", "Draper", "Dreieich", "Dresden", "Dreux", "Driebergen", "Driebergenrijsenburg", "Driehuis", "Driel", "Driftwood", "Dripping springs", "Drni", "Drobetaturnu severin", "Drogheda", "Dromara", "Drongen", "Dronten", "Drouin", "Drummondville", "Drumnadrochit", "Drbak", "Drgani", "Dubai", "Dubbo", "Dublin", "Dubna", "Dubois", "Dubrovnik", "Dubuque", "Duchcov", "Dudelange", "Dudley", "Dufur", "Duga resa", "Duisburg", "Duiven", "Duleek", "Duluth", "Dumaguete", "Dumfries", "Dumiat", "Dummer", "Dummerston", "Dumont", "Dunaharaszti", "Dunakeszi", "Dunblane", "Duncan", "Duncannon", "Dundalk", "Dundee", "Dundrum", "Dundurn", "Dunedin", "Dunfermline", "Dunkirk", "Dunningen", "Duns", "Dunsmuir", "Dunstable", "Dunwoody", "Dupont", "Duque de caxias", "Duran", "Durango", "Durango ciudad", "Durban", "Durgapur", "Durham", "Durrs", "Dushanbe", "Duson", "Dutton", "Duvall", "Duxbury", "Dwarahat", "Dwingeloo", "Dworp", "Dyersburg", "Dsaignes", "Drentrup", "Drtyol", "Drverden", "Dtlingen", "Dbendorf", "Dren", "Dsseldorf", "Dbrowa grnicza", "Eagan", "Eagle", "Eagle mountain", "Eagle river", "Eagletown", "Eagleville", "Earby", "Earls colne", "Early", "Earth", "Earth city", "Easley", "East amherst", "East atlantic beach", "East aurora", "East brunswick", "East fishkill", "East grand rapids", "East greenbush", "East greenwich", "East grinstead", "East hampshire", "East hampton", "East hanover", "East hartford", "East herts", "East jakarta city", "East kilbride", "East kingston", "East lansing", "East london", "East longmeadow", "East los angeles", "East malling", "East melbourne", "East norriton", "East northamptonshire", "East orange", "East palo alto", "East peoria", "East petersburg", "East providence", "East rutherford", "East stroudsburg", "East troy", "East windsor", "Eastbourne", "Eastern", "Eastern heights", "Eastern passage", "Eastham", "Easthampton", "Easton", "Eastover", "Eastsound", "Eastvale", "Eastwood", "Eatontown", "Eatonville", "Eau claire", "Eaubonne", "Ebbs", "Ebenthal", "Ebern", "Ebersberg", "Eberswalde", "Eboli", "Ebstorf", "Ecatepec", "Echt", "Eckental", "Eckernfrde", "Ecublens", "Eddington", "Ede", "Edegem", "Edemissen", "Eden", "Eden prairie", "Edenkoben", "Edgbaston", "Edgewater", "Edgware", "Edina", "Edinboro", "Edinburg", "Edinburgh", "Edirne", "Edison", "Edmond", "Edmonds", "Edmonton", "Edogawa", "Edogawaku", "Edwards air force base", "Edwardsville", "Ee", "Eemnes", "Eerbeek", "Eferding", "Effingham", "Effretikon", "Efland", "Eganville", "Egchel", "Egelsbach", "Eger", "Egersund", "Egg", "Egg harbor township", "Eggensteinleopoldshafen", "Egham", "Ehingen", "Ehlerange", "Ehningen", "Ehrendingen", "Eichberg", "Eidsvoll", "Eilat", "Einbeck", "Eindhoven", "Einsiedeln", "Eisenach", "Eisenberg", "Eisenhttenstadt", "Eitorf", "Ejido", "Ekaterinburg", "El alto", "El bosque", "El bruc", "El cajon", "El campello", "El casar", "El centro", "El dorado", "El dorado hills", "El escorial", "El granada", "El hoceima", "El infierno", "El jadida ", "El kala", "El masnou", "El mirage", "El monte", "El oued", "El papiol", "El paso", "El paso city limits", "El prat de llobregat", "El puerto de santa mara", "El segundo", "El sobrante", "El tambo", "El tigre", "El vendrell", "El viga", "Elzaytoun", "Elblag", "Elburg", "Elcheelx", "Elda", "Eldorado", "Eldorado do sul", "Eldoret", "Elektrostal", "Elexalde derio", "Elgin", "Elgoibar", "Eliot", "Elista", "Elizabeth", "Elizabeth city", "Elizabethton", "Elizabethtown", "Elk", "Elk city", "Elk grove", "Elk grove village", "Elk mound", "Elk river", "Elkhart", "Elkhorn", "Elkridge", "Elkton", "Ell", "Ellensburg", "Ellenwood", "Ellesmere port", "Ellezelles", "Ellhofen", "Ellicott city", "Ellington", "Ellisville", "Ellsworth", "Elm city", "Elmbridge", "Elmhurst", "Elmira", "Elmont", "Elmsford", "Elmshorn", "Elmwood park", "Elon", "Elsdorf", "Elsene", "Elst", "Elstead", "Elstree", "Elton", "Eluru", "Elverum", "Ely", "Elyria", "Elysian", "Embrun", "Embu das artes", "Embuguau", "Emden", "Emerald hills", "Emeryville", "Emmeloord", "Emmen", "Emmerich", "Empangeni", "Empoli", "Emporia", "Empurany", "Empuriabrava", "Emsdetten", "Emst", "Encarnacion", "Encarnacin de daz", "Encausselesthermes", "Encinitas", "Ender", "Endicott", "Endwell", "Enfield", "Engelberg", "Engels", "Engelskirchen", "Engenheiro coelho", "Englewood", "Enid", "Eningen", "Enna", "Ennis", "Enniscrone", "Enniskillen", "Enoch", "Enon", "Enosburg", "Enschede", "Ensdorf", "Ense", "Ensenada", "Entebbe", "Enterprise", "Entroncamento", "Entzheim", "Enugu", "Enumclaw", "Envigado", "Epe", "Epfendorf", "Ephrata", "Eppelborn", "Eppelheim", "Epsom", "Epsom and ewell", "Erba", "Erding", "Erdweg", "Erechim", "Erftstadt", "Erfurt", "Ericeira", "Erie", "Erin", "Erk", "Erkelenz", "Erkrath", "Erlach", "Erlangen", "Erlanger", "Erlensee", "Ermelo", "Ermita", "Ermont", "Ermua", "Ernakulam", "Erode", "Erpemere", "Erquelinnes", "Errenteria", "Erzurum", "Es mercadal", "Esbjerg", "Escazu", "Eschsuralzette", "Eschborn", "Eschweiler", "Escobedo", "Escondido", "Escuintla", "Esfahan", "Eskilstuna", "Eskisehir", "Eskiehir", "Eslohe", "Eslv", "Esparreguera", "Esparto", "Espejo", "Espelkamp", "Esperance", "Espinal", "Espinardo", "Espoo", "Esporles", "Esquel", "Essaouira   ", "Essen", "Essex", "Essex junction", "Esslingen", "Esson", "Estacada", "Estacin central", "Esteio", "Estel", "Estenfeld", "Estepa", "Estepona", "Estero", "Estrla", "Estncia velha", "Ether", "Etna", "Etne", "Etoile", "Etowah", "Etoy", "Ettenleur", "Ettlingen", "Ettumanoor", "Etxebarri", "Eu", "Eugene", "Euless", "Eunpolis", "Eupen", "Eureka", "Eureka springs", "Euthal", "Eutin", "Evans", "Evanston", "Evansville", "Evendale", "Evere", "Everett", "Evergem", "Evergreen", "Evesham", "Evesham township", "Ewa beach", "Ewing township", "Ewloe", "Excelsior", "Excelsior springs", "Exeland", "Exeter", "Exloo", "Exmouth", "Exton", "Eyam", "Ezcabarte", "Ezeiza", "Ezequiel montes", "Ezhou", "Faa", "Fabriano", "Fabrica di roma", "Facatativa", "Faenza", "Fafe", "Fagernes", "Fair haven", "Fair lawn", "Fair oaks", "Fairbanks", "Fairborn", "Fairfax", "Fairfield", "Fairfield bay", "Fairford", "Fairland", "Fairless hills", "Fairlie", "Fairmont", "Fairport", "Fairview", "Fairview heights", "Faisalabad", "Faizabad", "Falkenberg", "Falkirk", "Fall city", "Fall creek", "Fall river", "Fallbrook", "Falling waters", "Fallon", "Falls church", "Fallsington", "Falmer", "Falmouth", "Falsterbo", "Falun", "Famagusta", "Fano", "Farafagana", "Fareham", "Fargo", "Farguessainthilaire", "Faribault", "Faridabad", "Farmers branch", "Farmingdale", "Farmington", "Farmington hills", "Farnborough", "Farnham", "Faro", "Farrar", "Farum", "Fatehgarh sahib", "Faulensee", "Favara", "Faversham", "Fayetteville", "Fayzabad", "Fcio varela", "Feastervilletrevose", "Federal way", "Fedora", "Feira de santana", "Feldkirch", "Feldkirchen", "Feldkirchen bei graz", "Felgueiras", "Felino", "Felixstowe", "Feliz", "Fellbach", "Felton", "Feltre", "Fene", "Feni", "Fenton", "Fenwick island", "Ferentino", "Fergana", "Fergus", "Fergus falls", "Ferguson", "Fermo", "Fermont", "Fernandina beach", "Fernando de la mora", "Ferndale", "Ferndown", "Ferneyvoltaire", "Fernie", "Fernitz", "Ferrara", "Ferraz de vasconcelos", "Ferrazzano", "Ferrol", "Ferryville", "Fes", "Fethard", "Feucherolles", "Feusisberg", "Ffarmers", "Fidenza", "Fiesse", "Fife", "Fifield", "Figline e incisa valdarno", "Figueira da foz", "Figueres", "Filderstadt", "Filiano", "Filiai", "Fillmore", "Filottrano", "Finale emilia", "Finchampstead", "Findlay", "Finland", "Fintel", "Fintry", "Firenze", "First coast", "Firth", "Fishers", "Fishkill", "Fitchburg", "Fitou", "Fitzroy", "Fiumefreddo di sicilia", "Fiumicino", "Fjellstrand", "Flagstaff", "Fleckeby", "Fleet", "Fleetwood", "Fleming island", "Flemington", "Flensburg", "Fletcher", "Fleurbaix", "Flie", "Flint", "Flitwick", "Floral park", "Florange", "Florence", "Florence township", "Florencia", "Floresta", "Floresville", "Florham park", "Floriano", "Florianpolis", "Florida", "Florida vicente lopez", "Florissant", "Flower mound", "Flowery branch", "Flowood", "Floyd", "Flushing", "Fnideq", "Focani", "Foggia", "Foix", "Foligno", "Folkestone", "Follonica", "Folsom", "Fomboni", "Fond du lac", "Fonda", "Fondi", "Fontromeuodeillovia", "Fontainebleau", "Fontana", "Fontanafredda", "Fontaniva", "Fontenayauxroses", "Fontenaylecomte", "Fontenaysousbois", "Footscray", "Forbach", "Forchheim", "Forest", "Forest city", "Forest grove", "Forest hills", "Forest lake", "Forest of dean", "Forest park", "Forest row", "Forestville", "Foristell", "Forl", "Formiga", "Formosa", "Fornebu", "Forney", "Forres", "Forrest", "Forrest city", "Fort belvoir", "Fort bragg", "Fort campbell", "Fort collins", "Fort garland", "Fort grant", "Fort hood", "Fort irwin", "Fort jones", "Fort lauderdale", "Fort lee", "Fort mcmurray", "Fort meade", "Fort mill", "Fort mitchell", "Fort mohave", "Fort myers", "Fort pierce", "Fort recovery", "Fort smith", "Fort st john", "Fort thomas", "Fort wainright", "Fort walton beach", "Fort washington", "Fort wayne", "Fort worth", "Fortdefrance", "Fortaleza", "Fortaleza de minas", "Forth", "Fossurmer", "Foshan", "Foshan shi", "Foster city", "Foulridge", "Fountain hills", "Fountain valley", "Fourques", "Fowlerville", "Foz do iguau", "Fradelos", "Fraga", "Framingham", "Franca", "Francavilla al mare", "Francheville", "Francisco alvarez", "Francisco beltro", "Francisco morato", "Frangart", "Frankenberg", "Frankfort", "Frankfurt", "Frankfurt oder", "Frankfurt am main", "Franklin", "Franklin lakes", "Franklin park", "Franklin township", "Franschhoek", "Frascati", "Frattamaggiore", "Frauenfeld", "Fray bentos", "Frazier park", "Frederick", "Fredericksburg", "Frederico westphalen", "Fredericton", "Frederiksberg", "Frederikshavn", "Frederiksvrk", "Fredonia", "Fredrikstad", "Freedom", "Freehold township", "Freeland", "Freeport", "Freetown", "Freeville", "Freiberg", "Freiburg", "Freiburg im breisgau", "Freienbach", "Freisen", "Freising", "Freital", "Frekhaug", "Fremantle", "Fremont", "Fresno", "Fresse", "Freudenberg", "Freudenstadt", "Fria", "Fribourg", "Friday harbor", "Fridley", "Friedberg", "Friedrichshafen", "Friendswood", "Friesach", "Frigiliana", "Frisco", "Frome", "Frontenex", "Froombosch", "Frosinone", "Frostburg", "Fryeburg", "Frjus", "Frndenberg", "Fuengirola", "Fuenlabrada", "Fuji", "Fujinomiya", "Fujisawa", "Fujisawashi", "Fukui", "Fukuoka", "Fukushima", "Fukuyamashi", "Fulda", "Fullerton", "Fully", "Fulshear", "Fulton", "Funabashi", "Funchal", "Fundo", "Fuquay varina", "Furtwangen", "Furuvik", "Fusagasuga", "Fushun", "Fussa", "Fuveau", "Fuzhou", "Fuzhou shi", "Frsala", "Frjestaden", "Fhren", "Frde", "Frth", "Fssen", "Gaborone", "Gabrovo", "Gadsden", "Gafsa", "Gagnoa", "Gagny", "Gahanna", "Gaillard", "Gaines", "Gainesville", "Gaithersburg", "Galabovo", "Galapa", "Galatina", "Galai", "Galdakao", "Galesburg", "Galgenen", "Gallarate", "Gallatin", "Galle", "Gallipoli", "Gallneukirchen", "Galloway", "Gallup", "Galt", "Galveston", "Galway", "Galway city", "Gama", "Gamagori", "Gambrills", "Gamleby", "Gampaha", "Ganderkesee", "Gandhidham", "Gandhinagar", "Ganda", "Gangneung", "Ganzhou city", "Gap", "Garanhuns", "Garbsen", "Garching", "Garda", "Gardanne", "Garden city", "Garden grove", "Gardena", "Garderen", "Gardner", "Garfield", "Garland", "Garmsr", "Garner", "Garnett", "Garopaba", "Garphyttan", "Garrucha", "Garstang", "Garut", "Gary", "Garyp", "Gasan", "Gaspar", "Gaspar hernandez", "Gastonia", "Gatchina", "Gateshead", "Gatineau", "Gatteo a mare", "Gavardo", "Gavi", "Gaya", "Gaza", "Gaziantep", "Gdask", "Gdynia", "Gebze", "Gedera", "Gedinne", "Geel", "Geelong", "Geertruidenberg", "Geesthacht", "Geffen", "Geisenheim", "Geislingen", "Geistown", "Geldermalsen", "Geldern", "Geldrop", "Geleen", "Gelendzhik", "Gelida", "Gelnhausen", "Gelsenkirchen", "Gemert", "Gemonde", "General deheza", "General fernndez oro", "General lamadrid", "General roca", "General san martn", "General santos", "General trias", "Geneseo", "Geneva", "Genk", "Genlis", "Gennep", "Gennevilliers", "Genoa", "Genova", "Gent", "Gentilly", "Genve", "Geochanggun", "George", "George town", "Georgetown", "Georgetown charter township", "Georgsmarienhtte", "Gera", "Geraardsbergen", "Geraberg", "Geretsried", "Gerlingen", "Germantown", "Germay", "Germering", "Germersheim", "Germiston", "Gernsbach", "Gerolstein", "Gerolzhofen", "Gersten", "Gerstheim", "Gessate", "Getafe", "Gettysburg", "Getxo", "Getzville", "Gevelsberg", "Geversdorf", "Gex", "Geyer", "Ghaziabad", "Ghent", "Ghumarwin", "Gianyar", "Giarre", "Giba", "Gibbsboro", "Gibraltar", "Gibsons", "Gibsonton", "Gieratowice", "Giessen", "Gifsuryvette", "Gifhorn", "Gifu", "Gig harbor", "Gijn", "Gijnxixn", "Gikongoro", "Gilbert", "Gilbertsville", "Gilford", "Gillette", "Gillingham", "Gilmer", "Gilowice", "Gilroy", "Gilze", "Gimposi", "Gioia del colle", "Gioiosa marea", "Girardot", "Girardota", "Giresun", "Giridih", "Girona", "Gistel", "Git", "Giubiasco", "Givatayim", "Givet", "Givisiez", "Giza", "Gires", "Gjilan", "Gjvik", "Glacier view", "Gladbeck", "Gladewater", "Gladstone", "Glanaman", "Gland", "Glarus sd", "Glasgow", "Glassboro", "Glastonbury", "Glen allen", "Glen burnie", "Glen cove", "Glen ellyn", "Glen mills", "Glen rock", "Glen waverley", "Glen wild", "Glencoe", "Glendale", "Glendale heights", "Glendora", "Glenn heights", "Glennville", "Glens falls", "Glenside", "Glenview", "Glenville", "Glenwood", "Glenwood springs", "Glinde", "Gliwice", "Globe", "Glossop", "Glostrup", "Gloucester", "Gloucester township", "Glumslv", "Glun", "Glyfada", "Glyndon", "Gnangara", "Gnesta", "Gniezno", "Goatstown", "Gobernador", "Gobernador ingeniero valentn virasoro", "Goch", "Gochsheim", "Godalming", "Goderich", "Godoy cruz", "Goes", "Goffstown", "Goginan", "Goiatuba", "Gois", "Goinia", "Gold coast", "Gold hill", "Gold river", "Golden", "Golden valley", "Goldens bridge", "Goldsboro", "Goleta", "Golpayegan", "Goma", "Gomaringen", "Gomel", "Goncelin", "Gondelsheim", "Gondia", "Gondomar", "Gonzaga", "Gonzlez catn", "Goodlettsville", "Goodnews bay", "Goodrich", "Goodwell", "Goodyear", "Goolwa", "Goose creek", "Gorade", "Gordonsville", "Gore", "Goreville", "Gorey", "Gorgan", "Gorgonzola", "Gorham", "Gorinchem", "Gorizia", "Gorj", "Gorje", "Gorlestononsea", "Gornji milanovac", "Gornoaltaysk", "Gorodishche", "Gorontalo", "Gorxheimertal", "Gorzw wielkopolski", "Gosford", "Goshen", "Goslar", "Gosport", "Gossau", "Gotha", "Gothenburg", "Gotland", "Gottmadingen", "Gottne", "Gouda", "Gouldsboro", "Gourdon", "Governador island", "Governador valadares", "Govindapura", "Goyang", "Goyangsi", "Gradaac", "Gradignan", "Grafenwhr", "Grafton", "Graham", "Grahamstown", "Grama", "Gramado", "Gramazhdano", "Grambach", "Gran tarajal", "Granada", "Granbury", "Granby", "Grand blanc", "Grand forks", "Grand haven", "Grand island", "Grand junction", "Grand prairie", "Grand rapids", "Grande pointe", "Grande prairie", "Grandview", "Grandview heights", "Grandville", "Granger", "Granite bay", "Granite city", "Granite falls", "Granite mountain", "Granollers", "Grans", "Grant park", "Grantham", "Grantownonspey", "Grants pass", "Granville", "Grapevine", "Grasberg", "Grass valley", "Grasse", "Grassobbio", "Gratkorn", "Grave", "Gravellona lomellina", "Gravesend", "Gravina in puglia", "Gray", "Grays", "Grayslake", "Grayson", "Graz", "Great barrington", "Great falls", "Great malvern", "Great neck", "Great sankey", "Great yarmouth", "Greater noida", "Grecia", "Greece", "Greeley", "Green", "Green bay", "Green park", "Greenbank", "Greenbelt", "Greenbrier", "Greencastle", "Greendale", "Greeneville", "Greenfield", "Greenhithe", "Greenland", "Greenlawn", "Greenock", "Greensboro", "Greensburg", "Greenville", "Greenwich", "Greenwood", "Greenwood village", "Greer", "Greifensee", "Greifswald", "Greiz", "Grenoble", "Grenzachwyhlen", "Gresham", "Gresik", "Gretna", "Greve strand", "Greytown", "Grid", "Griesheim", "Griesheimprsmolsheim", "Griffin", "Grigny", "Grimbergen", "Grimes", "Grimsby", "Grimstad", "Grinnell", "Grodno", "Groenlo", "Groessen", "Groix", "Gronau", "Groningen", "Grootebroek", "Grootegast", "Grossumstadt", "Grosse pointe", "Grosseto", "Grossetoprugna", "Groton", "Grottaglie", "Grottammare", "Grove city", "Groveland", "Grovertown", "Grovetown", "Grobeeren", "Groheide", "Grudzidz", "Gruitrode", "Gryazovets", "Grbenzell", "Grnwald", "Guabiruba", "Guacara", "Guadalajara", "Guadalupe", "Gualala", "Gualdo tadino", "Gualeguaychu", "Gualtar", "Guam", "Guanajuato", "Guangyuan", "Guangzhou", "Guangzhou shi", "Guapimirim", "Guaramirim", "Guarapari", "Guarapuava", "Guararapes", "Guararema", "Guarar", "Guarda", "Guariba", "Guaruj", "Guarulhos", "Guatemala city", "Guatire", "Guayaquil", "Guaymas", "Guaynabo", "Guelph", "Guerneville", "Guerrero", "Guidel", "Guidoval", "Guiguinto", "Guijuelo", "Guilderland", "Guildford", "Guilford", "Guilin", "Guimaraes", "Guiscriff", "Guiyang", "Guiyang shi", "Gujranwala", "Gujrat", "Gulf breeze", "Gulfport", "Gulgong", "Guliston", "Gumisi", "Gummersbach", "Gun barrel city city limits", "Gunalda", "Gunnison", "Gunposi", "Gunsan", "Gunsansi", "Gunten", "Guntersville", "Guntur", "Gurabo", "Gurgaon", "Gurnee", "Gurupi", "Gustavsberg", "Guwahati", "Guyuan", "Gupiles", "Guret", "Gwacheon", "Gwacheonsi", "Gwalior", "Gwangju", "Gyenesdis", "Gympie", "Gyumri", "Gyl", "Gyr", "Glvez", "Grtringen", "Gvle", "Gmez palacio", "Gd", "Glba", "Gppingen", "Grlitz", "Gtene", "Gttingen", "Gtzis", "Gssing", "Gtersloh", "Gogw maopolski", "Haag in oberbayern", "Haaglanden", "Haaksbergen", "Haaltert", "Haapajrvi", "Haapsalu", "Haarlem", "Haasrode", "Habay", "Habitvalle ceylan", "Habra", "Hachinohe", "Hachinoheshi", "Hachioji", "Hachiji", "Hacienda heights", "Hackensack", "Hackettstown", "Hacks", "Haddonfield", "Haderslev", "Hadfield", "Hadley", "Hadlow", "Hadsten", "Hadyach", "Haedo", "Haerbin", "Haerbin shi", "Hafnarfjordur", "Hagelstadt", "Hagen", "Hagenberg", "Hagenberg im mhlkreis", "Hagerman", "Hagerstown", "Hagfors", "Haguenau", "Hai duong city", "Hai phong", "Haid", "Haifa", "Haiger", "Haikou", "Haikou shi", "Haikupauwela", "Hailin", "Hailsham", "Hainau", "Haining", "Hajipur", "Hajom", "Hakodate", "Hakodateshi", "Hakone", "Hakuba", "Hala", "Halden", "Haldwani", "Haleiwa", "Halesowen", "Half moon bay", "Halfway", "Halfweg", "Halifax", "Halifax regional municipality", "Hall", "Hallam", "Hallandale beach", "Halle", "Halle saale", "Hallein", "Hallstead", "Hallsville", "Halmstad", "Halsteren", "Haltern", "Haltom city", "Halton hills", "Hamah", "Hamamatsu", "Hamar", "Hamburg", "Hamden", "Hamedan", "Hamelin", "Hamilton", "Hamilton township", "Hamirpur", "Hamlin", "Hamlyn heights", "Hamm", "Hammamet", "Hamme", "Hammelburg", "Hammenhg", "Hamminkeln", "Hammond", "Hamont", "Hampden", "Hampstead", "Hampton", "Hampton city", "Hampton township", "Hamtramck", "Hanahan", "Hanalei", "Hanamkonda", "Hanau", "Hancock", "Handan", "Handel", "Handil", "Hanford", "Hangzhou", "Hangzhou shi", "Hanko", "Hannover", "Hannut", "Hanoi", "Hanover", "Hansville", "Hanyu", "Hanzhong", "Happy valley", "Harare", "Harbin", "Harbor springs", "Hardenberg", "Harderwijk", "Harelbeke", "Hargeisa", "Haridwr", "Haripur", "Harlingen", "Harlow", "Harpenden", "Harpers ferry", "Harrisburg", "Harrison", "Harrisonburg", "Harrogate", "Hartford", "Hartford city", "Hartland", "Hartlepool", "Hartsdale", "Hartselle", "Harwell", "Harwich", "Harwinton", "Hashimotoshi", "Hasketon", "Haskovo", "Haslum", "Hassan", "Hasselt", "Hastings", "Hastingsonhudson", "Hat yai", "Hatay", "Hatboro", "Hatfield", "Hatherleigh", "Hattem", "Hattiesburg", "Hattingen", "Haubourdin", "Haugesund", "Hauppauge", "Hausach", "Hautefort", "Hautmont", "Havana", "Havant", "Havelterberg", "Haverhill", "Havertown", "Havixbeck", "Havre de grace", "Hawaiian acres", "Hawally", "Hawi", "Hawkesbury upton", "Hawley", "Hawthorn", "Hawthorne", "Hayama", "Hayami county", "Hayathem", "Hayden", "Hayle", "Hayling island", "Haymarket", "Hays", "Hayward", "Haywards heath", "Hazel green", "Hazelton", "Hazlet", "Hazleton", "Hcm", "Headley", "Healesville", "Healy", "Heapey", "Hebden bridge", "Heber", "Heber city", "Heber springs", "Hebron", "Hechingen", "Heckmondwike", "Hedehusene", "Hedesunda", "Hedge end", "Heel", "Heemskerk", "Heemstede", "Heerbrugg", "Heerde", "Heerenveen", "Heerhugowaard", "Heerlen", "Heesch", "Heeze", "Hefei", "Hefei shi", "Heffingen", "Heide", "Heidelberg", "Heiden", "Heidenau", "Heidenreichstein", "Heilbronn", "Heiligenhaus", "Heiloo", "Heino", "Heinsberg", "Heist", "Heistopdenberg", "Helena", "Helena bay", "Helenaveen", "Helfrantzkirch", "Helgeroa", "Hell", "Hella", "Hellertown", "Helln", "Helmond", "Helmstedt", "Helotes", "Helsingborg", "Helsinki", "Hem", "Hemel hempstead", "Hemer", "Hemet", "Hemiksem", "Hempstead", "Hemsbach", "Henderson", "Hendersonville", "Hendrikidoambacht", "Hengelo", "Hengoed", "Hengyang", "Henleyonthames", "Hennef", "Hennigsdorf", "Henrico", "Henrietta", "Henstedtulzburg", "Hephzibah", "Heptonstall", "Heraklion", "Herat", "Herblay", "Herceg novi", "Here", "Heredia", "Hereford", "Herent", "Herentals", "Heretsried", "Herford", "Herkenbosch", "Herlufmagle", "Hermantown", "Hermanus", "Hermiston", "Hermosa beach", "Hermosillo", "Hernani", "Herndon", "Herne", "Herning", "Heroica guaymas", "Heroica veracruz", "Heroldsbach", "Herrenberg", "Herriman", "Herrsching", "Herselt", "Hershey", "Herstal", "Herten", "Hertford", "Hertsmere", "Herval doeste", "Hervey bay", "Herwijnen", "Herzliya", "Herzliyya", "Herzogenrath", "Heslington", "Hesperia", "Hesselager", "Hessle", "Hetauda", "Hetian", "Heusdenzolder", "Heveadorp", "Hewitt", "Hexham", "Heze", "Hezhou", "Hialeah", "Hiawatha", "Hibiscus coast local municipality", "Hickory", "Hickory corners", "Hidalgo", "Hidden meadows", "Higashichikuma", "Higashiagatsuma", "Higashimatsuyama", "Higashimorokata", "Higashiosaka", "High point", "High springs", "High wycombe", "Highland", "Highland charter township", "Highland heights", "Highland park", "Highlands", "Highlands ranch", "Hightstown", "Highwood", "Hihya", "Hilden", "Hildesheim", "Hill air force base", "Hille", "Hillegom", "Hillerd", "Hilliard", "Hillo", "Hillsboro", "Hillsborough", "Hillsborough township", "Hilo", "Hilton head island", "Hilversum", "Himatnagar", "Himejishi", "Hinckley", "Hindley green", "Hinds", "Hingham", "Hino", "Hinoshi", "Hinwil", "Hinxton", "Hippolytushoef", "Hiram", "Hiroshima", "Hisar", "Hit", "Hitachishi", "Hitachinaka", "Hitchin", "Hjallerup", "Hjerm", "Hjrring", "Hlybokaye", "Ho chi minh city", "Hohokus", "Hobart", "Hobe sound", "Hoboken", "Hobro", "Hochdorf", "Hochheim am main", "Hochstatt", "Hockenheim", "Hockessin", "Hod hasharon", "Hodonn", "Hoensbroek", "Hof", "Hoffman estates", "Hofheim", "Hofheim am taunus", "Hohen neuendorf", "Hohenems", "Hohensteinernstthal", "Hohentengen", "Hohhot", "Hoisdorf", "Holbrook", "Holbk", "Holden", "Holdorf", "Holgun", "Holland", "Hollidaysburg", "Hollister", "Holliston", "Holly", "Holly springs", "Hollywood", "Holmdel", "Holmfirth", "Holon", "Holstebro", "Holt", "Holtsville", "Holyoke", "Holywood", "Holzminden", "Homagama", "Home", "Homel", "Homer", "Homer glen", "Homestead", "Hommelvik", "Homs", "Honda", "Hondarribia", "Hong kong", "Honiton", "Honnihalli", "Honolulu", "Hood river", "Hoofddorp", "Hoogeveen", "Hoogezand", "Hooghly", "Hoogvliet rotterdam", "Hook", "Hooksett", "Hookstown", "Hoopstad", "Hoorn", "Hoover", "Hope mills", "Hopkins", "Hopkinton", "Hoppegarten", "Hoppers crossing", "Horana", "Horley", "Horlivka", "Horn lake", "Hornbrook", "Hornslet", "Horsens", "Horseshoe bay", "Horseshoe bend", "Horsham", "Horst", "Horsted keynes", "Horten", "Hortolndia", "Horton", "Hortonville", "Horw", "Hoshiarpur", "Hostalric", "Hosur", "Hot springs", "Houghton", "Houghton lake", "Houlbeccocherel", "Houlgate", "Houma", "Houston", "Houten", "Houthalenhelchteren", "Hove", "Howard", "Howden", "Howell", "Howrah", "Howth", "Hoya", "Hoice", "Hradec", "Hradec krlov", "Hrodna", "Hsinchu city", "Hua hin", "Huaian", "Huaian shi", "Huainan", "Huajuapan de len", "Huancayo", "Huangshi shi", "Huaquillas", "Huatabampo", "Huatusco", "Hub", "Hubballi", "Hubli", "Huby", "Huddersfield", "Huddinge", "Hudiksvall", "Hudson", "Hudsonville", "Hue", "Huelva", "Huesca", "Huesca  uesca", "Huetamo", "Huhehaote", "Huhehaote shi", "Huissen", "Huixquilucan", "Huizen", "Huizhou", "Huizhou shi", "Hulbert", "Hull", "Hulst", "Huludao", "Humble", "Humboldt", "Hummelstown", "Hunedoara", "Hungen", "Hungerford", "Hunmanby", "Hunter", "Huntersville", "Huntingdon", "Huntingdonshire", "Huntington", "Huntington beach", "Huntington station", "Huntingtown", "Huntley", "Huntsville", "Hurdal", "Hurghada", "Hurlingham", "Huron", "Hurricane", "Hursley", "Hurst", "Huskvarna", "Husum", "Hutchinson", "Hutto", "Huy", "Huzhou", "Huzhou shi", "Hutor vega", "Hvalstad", "Hwacheongun", "Hwaseong", "Hwaseongsi", "Hyattsville", "Hyde park", "Hyderabad", "Hydra", "Hyndburn", "Hyogo ward", "Hyrum", "Hythe", "Hyres", "Hssleholm", "Hres", "Hchstdt", "Hvelhof", "Hjbjerg", "Hnefoss", "Hnfeld", "Hrth", "Hng ha", "Hi phng", "Iai", "Ibach", "Ibadan", "Ibagu", "Ibarakishi", "Ibarra", "Ibbenbren", "Ibi", "Ibirama", "Ibitinga", "Ibiza", "Ibo county", "Ica", "Icheon", "Icheonsi", "Ichikawa", "Ichtegem", "Idaho falls", "Idaho springs", "Idaroberstein", "Idore", "Ieper", "Ife", "Ifran", "Iga", "Igaci", "Igalo", "Igersheim", "Iglesias", "Ignalin", "Igoumenitsa", "Igrejinha", "Igualada", "Iguatemi", "Iguatu", "Ihringen", "Iidashi", "Iizuka", "Iizukashi", "Ijede", "Ijsselstein", "Ikast", "Ikeja", "Ikoma district", "Ikuno ward", "Ilha solteira", "Ilhabela", "Ilhus", "Iligan city", "Ilinden", "Ilion", "Ilkeston", "Illichivsk", "Illkirch", "Illschwang", "Illzach", "Ilmenau", "Ilminster", "Ilo district", "Iloilo city", "Ilorin", "Ilsede", "Imadol", "Imatra", "Imbituba", "Immenstaad", "Immenstadt", "Imola", "Imperatriz", "Imperial beach", "Imus city", "Inca", "Incheon", "Incline village", "Indaiatuba", "Independence", "Indiana", "Indianapolis", "Indianola", "Indio", "Indore", "Indulkana", "Industry", "Ingelheim am rhein", "Ingelmunster", "Ingeniero budge", "Ingleside", "Ingolstadt", "Inhumas", "Inland", "Innerleithen", "Inning am ammersee", "Innisfil", "Innsbruck", "Innsbruckstadt", "Interlaken", "Intsika yethu local municipality", "Inukami district", "Inuyama", "Inverness", "Ioannina", "Ios", "Iowa city", "Iowa park", "Ipatinga", "Ipaumirim", "Iphofen", "Ipoh", "Ipsach", "Ipswich", "Ipu", "Ipueiras", "Iqaluit", "Iquique", "Iquitos", "Iracempolis", "Iraklio", "Irapuato", "Irbit", "Irkutsk", "Irlam", "Irmo", "Iron mountain", "Irondequoit", "Ironton", "Iruma", "Irumashi", "Irun", "Irvine", "Irving", "Irvington", "Ischia", "Iserlohn", "Isernhagen", "Isernia", "Isesaki", "Isfahan", "Ishim", "Ishinomakishi", "Ishj", "Isidro casanova", "Iskenderun", "Isla cristina", "Isla de maipo", "Islamabad", "Island lake", "Isle of palms", "Ismailia", "Ismaning", "Isny im allgu", "Isparta", "Ispica", "Ispra", "Israel", "Issaquah", "Issylesmoulineaux", "Istanbul", "Istra", "Itabaiana", "Itabashi", "Itabira", "Itaituba", "Itaja", "Itajobi", "Itajub", "Italy", "Itano county", "Itapecerica da serra", "Itapejara doeste", "Itapema", "Itaperuna", "Itapetininga", "Itapeva", "Itapira", "Itapuranga", "Itaquaquecetuba", "Itarar", "Itasca", "Itatiba", "Itaugua", "Ithaca", "Ito county", "Itobi", "Ittervoort", "Ittigen", "Itu", "Ituiutaba", "Itumbiara", "Itupeva", "Ituverava", "Ituzaing", "Itzehoe", "It", "Ivanofrankivsk", "Ivanovo", "Ivoti", "Ivrea", "Ivrysurseine", "Iwakishi", "Iwami county", "Iwate", "Iwerne minster", "Ixelles", "Ixmiquilpan", "Ixtapa", "Izhevsk", "Izmail", "Izmir", "Izmit", "Izumishi", "Izcar de matamoros", "Jabalpur", "Jablonec nad nisou", "Jaboato dos guararapes", "Jaboticabal", "Jackson", "Jacksonville", "Jacksonville beach", "Jacmel", "Jacobina", "Jaffa", "Jaffna", "Jaguarina", "Jahanabad", "Jahrom", "Jahu", "Jaipur", "Jakarta", "Jakarta barat city", "Jakobstad", "Jal", "Jalandhar", "Jales", "Jalgaon", "Jalhay", "Jalpaiguri", "Jalpan de serra", "Jamay", "Jambi", "Jamboree heights", "Jamesburg", "Jamestown", "Jamison", "Jammu", "Jamshedpur", "Jamshoro", "Jamul", "Jandaia", "Jandira", "Janesville", "Janikowo", "Januria", "Japeri", "Jap", "Jaragu do sul", "Jarrie", "Jasper", "Java", "Jaworznia", "Jaworzno", "Jay", "Jan", "Jeddah", "Jefferson", "Jefferson city", "Jeffersonville", "Jeffreys bay", "Jeju", "Jejusi", "Jelczlaskowice", "Jelenia gra", "Jelgava", "Jelling", "Jember", "Jemeppesursambre", "Jena", "Jenins", "Jenkintown", "Jenks", "Jensen beach", "Jeonju", "Jepara", "Jerez", "Jerez de garca salinas", "Jerez de la frontera", "Jericho", "Jermyn", "Jersey city", "Jersey shore", "Jersey village", "Jerusalem", "Jesenice", "Jesi", "Jesolo", "Jessup", "Jesup", "Jess mara", "Jette", "Jever", "Jewett", "Jeypore", "Jhang", "Jhansi", "Jharsuguda", "Jhelum", "Jhunjhunu", "Jian", "Jiparan", "Jiamusi", "Jiangmen", "Jiangmen shi", "Jiaozuo", "Jiaxing", "Jicaltepec autopan", "Jicin", "Jieyang", "Jihlava", "Jijel", "Jilin", "Jilin shi", "Jimena de la frontera", "Jinan", "Jinan shi", "Jinchang", "Jincheng", "Jingdezhen", "Jinhua", "Jinhua shi", "Jining", "Jinseki county", "Jinzhong", "Jinzhou shi", "Jiquilpan", "Jiquipilas", "Jiujiang", "Jiujiang shi", "Jingmn", "Jikov", "Joaaba", "Joama", "Jodhpur", "Joensuu", "Johannesburg", "John c stennis space center", "Johns creek", "Johnson city", "Johnston", "Johnstone", "Johnstown", "Johor bahru", "Joigny", "Joint base lewismcchord", "Joinville", "Joinvillelepont", "Jokioinen", "Jolarpet", "Joliet", "Joliette", "Jombang", "Jona", "Jonesboro", "Jonesborough", "Jonesville", "Joondalup", "Joplin", "Jorhat", "Jos", "Joshua tree", "Jossgrund", "Jougne", "Jounieh", "Jouvenon", "Jouyenjosas", "Joulstours", "Joydebpur", "Joo monlevade", "Joo pessoa", "Juana koslay", "Juazeiro do norte", "Juba", "Juchitn de zaragoza", "Jucurutu", "Juigalpa", "Juiz de fora", "Juja", "Juliaca", "Junagadh", "Junction city", "Jundia", "Juneau", "Juneda", "Juno beach", "Junn", "Jupiter", "Jurupa valley", "Juszkowo", "Jurez", "Jyvskyl", "Jveaxbia", "Jnkping", "Jrpeland", "Jlich", "Jngzhu city", "Jrmala", "Kaaawa", "Kaarina", "Kaarst", "Kaatsheuvel", "Kabato district", "Kabul", "Kachkanar", "Kadapa", "Kadawatha", "Kadi", "Kafr manda", "Kageshwari manohara", "Kaho", "Kaifeng", "Kailua", "Kailuakona", "Kaiping", "Kaiserslautern", "Kajaani", "Kajang", "Kaka", "Kakaryal", "Kakinada", "Kakkanad", "Kako county", "Kakogawa", "Kalaburagi", "Kalach", "Kalagedihena", "Kalaheo", "Kalama", "Kalamazoo", "Kalgoorlie", "Kaliningrad", "Kalispell", "Kalisz", "Kalix", "Kalkar", "Kalkara", "Kallnach", "Kalmar", "Kalmthout", "Kalmunai", "Kalniena", "Kalocsa", "Kalpetta", "Kaluga", "Kalush", "Kalyan", "Kalyani", "Kalyanpur sarjai", "Kamyanetspodilskyi", "Kamakura", "Kamen", "Kamenz", "Kameoka", "Kameyama", "Kamiminochi", "Kamiah", "Kamigyku", "Kamloops", "Kamnik", "Kamogawa", "Kamplintfort", "Kampala", "Kampenhout", "Kanab", "Kanazawa", "Kanazawashi", "Kanchipuram", "Kanchrapara", "Kandy", "Kandy cp", "Kaneohe", "Kangasala", "Kanhangad", "Kankakee", "Kannami", "Kannapolis", "Kannur", "Kano", "Kanpur", "Kansas city", "Kansk", "Kant", "Kanyakumari", "Kanzaki county", "Kaohsiung city", "Kapellen", "Kapfenberg", "Kapolei", "Kapuskasing", "Karachi", "Karaganda", "Karagandy", "Karaikurichi", "Karaj", "Karamay", "Karanganyar subdistrict", "Karanja", "Karawang", "Karben", "Kardzhali", "Kareeberg local municipality", "Karekare", "Karkala", "Karlovac", "Karlovy vary", "Karlsdorfneuthard", "Karlshamn", "Karlskoga", "Karlskrona", "Karlsruhe", "Karlstad", "Karnal", "Karu", "Karunya nagar", "Karur", "Kasaragod", "Kashan", "Kashiwa", "Kashubian tricity", "Kaslo", "Kasoa", "Kaspiysk", "Kassel", "Kastav", "Kasterlee", "Kastrup", "Kasugai", "Kasumigaura", "Kasur", "Kasuya", "Kathmandu", "Katni", "Katoomba", "Katovice", "Katowice", "Katrineholm", "Katsushika", "Kattangal", "Katwijk", "Katwijk aan zee", "Katy", "Katzing", "Kaufbeuren", "Kauhava", "Kaukauna", "Kaunas", "Kauniainen", "Kavala", "Kawabe county", "Kawagoe", "Kawaguchi", "Kawaguchishi", "Kawana", "Kawasaki", "Kayseri", "Kaysville", "Kazan", "Kazan", "Kazanluk", "Kearney", "Kearny", "Kebumen", "Kecskemt", "Kediri", "Keele", "Keelung city", "Keene", "Keeseville", "Kegalle", "Kehlen", "Keiraville", "Keizer", "Kelaniya", "Kelheim", "Kelkheim", "Keller", "Kells", "Kellyville", "Kelowna", "Kemerovo", "Kemi", "Kempele", "Kempsey", "Kempten", "Kempton park", "Kemptville", "Kendal", "Kendalia", "Kendari", "Kendenup", "Kenilworth", "Kenitra", "Kenitra ", "Kenmore", "Kenner", "Kennesaw", "Kennewick", "Kennington", "Kennoway", "Kenora", "Kenosha", "Kensington", "Kent", "Kent city", "Kentfield", "Kentwood", "Kenyon", "Kenzingen", "Keo", "Kerava", "Kerch", "Kerman", "Kermanshah", "Kernersville", "Kerns", "Kerpen", "Kerrville", "Kerteh", "Keswick", "Keszthely", "Ketchikan", "Kettering", "Keuruu", "Key largo", "Key west", "Keyser", "Kfar habad", "Kfar saba", "Kgs lyngby", "Khabarovsk", "Khairpur", "Khamgaon", "Khanpur", "Khantymansiysk", "Kharagpur", "Kharkiv", "Khartoum", "Kherson", "Khimki", "Khipro", "Khmelnytskyi", "Khon kaen", "Khoroshyovomnyovniki district", "Khorramabad", "Khulna", "Khust", "Kiama", "Kiato", "Kichevo", "Kidderminster", "Kiel", "Kielce", "Kigali", "Kihei", "Kikinda", "Kilbarchan", "Kildare", "Kilgore", "Kilifi", "Kilimanoor", "Kilkenny", "Killarney", "Killeen", "Killorglin", "Kilworth", "Kimry", "Kincaid", "Kineshma", "King of prussia", "Kings lynn", "Kingman", "Kings beach", "Kings langley", "Kings park", "Kingsbury", "Kingsland", "Kingsport", "Kingston", "Kingston upon hull", "Kingston upon thames", "Kingsville", "Kingwood", "Kinshasa", "Kintnersville", "Kirchbach", "Kirchberg in tirol", "Kirchhain", "Kirchheim bei mnchen", "Kirchheim unter teck", "Kirkby lonsdale", "Kirkcaldy", "Kirkenes", "Kirkkonummi", "Kirkland", "Kirklees", "Kirksville", "Kirov", "Kirovohrad", "Kish", "Kislovodsk", "Kissimmee", "Kisumu", "Kita county", "Kita matsuura county", "Kita ward", "Kitaadachi", "Kitaku", "Kitagunma district", "Kitale", "Kitami", "Kitamotoshi", "Kitanagoya", "Kitchener", "Kittitas", "Kitty hawk", "Kitzbuhel", "Kitzingen", "Kiyosu", "Kladno", "Klagenfurt", "Klaipda", "Klamath falls", "Klang", "Klaten", "Klaukkala", "Klaus", "Klein nordende", "Kleinaitingen", "Kleinmachnow", "Klerksdorp", "Klettgau", "Kleve", "Klin", "Klintsy", "Klodzko", "Kloof", "Klosterneuburg", "Kloten", "Klundert", "Knaphill", "Knivsta", "Knoxville", "Knurw", "Knutsford", "Knysna", "Knysna local municipality", "Ko samui", "Kobe", "Kobiernice", "Kobilje", "Koblenz", "Kocaeli", "Kochi", "Kodad", "Kodaikanal", "Kodairashi", "Kodak", "Kodinsk", "Koganei", "Kohima", "Kohoku ward", "Kokkedal", "Kokkola", "Kokomo", "Kokshetau", "Koksijde", "Kolbermoor", "Kolbotn", "Kolbuszowa", "Kolbck", "Kolding", "Kolhapur", "Kolibki", "Kolin", "Kolkata", "Kollam", "Kolobrzeg", "Kolomna", "Kolomyya", "Komae", "Komarapalayam", "Komotini", "Komsomolskonamur", "Komrno", "Konark", "Kondro", "Kongens lyngby", "Kongsberg", "Kongsvinger", "Konin", "Konstanz", "Kontich", "Konya", "Koog aan de zaan", "Koothattukulam", "Kootwijkerbroek", "Kopargaon", "Kopavogur", "Koper", "Kopeysk", "Koprivnica", "Koratty", "Korhogo", "Koriyama", "Kornipara", "Korolyov", "Koronadal city", "Korsholm", "Kortenberg", "Kortessem", "Kortrijk", "Kos", "Kosatica", "Koscierzyna", "Koshi", "Koshigaya", "Koshigayashi", "Kostanay", "Kostenets", "Kostroma", "Koszalin", "Kot radha kishan", "Kota", "Kota bharu", "Kota kinabalu", "Kota sleman", "Kotamobagu city", "Kothamangalam", "Kotka", "Koto", "Kotor", "Kottakkal", "Kottarakkara", "Kottayam", "Kourou", "Kouvola", "Kovilpatti", "Kovrov", "Kowale", "Kowloon city district", "Kozani", "Kozhikode", "Koice", "Kragujevac", "Krakuszowice", "Krakw", "Kraljevo", "Kralupy nad vltavou", "Kramatorsk", "Kranenburg", "Kranj", "Krasnodar", "Krasnogorsk", "Krasnoyarsk", "Krasnoznamensk", "Krefeld", "Kremenchuk", "Krems an der donau", "Kreuzlingen", "Kreuztal", "Kriens", "Kriftel", "Krimpen aan den ijssel", "Krishnagiri", "Kristiansand", "Kristianstad", "Kristiansund", "Kristinehamn", "Krivoy rog", "Kri", "Krievci", "Krk", "Krnov", "Krn", "Krokom", "Kromsdorf", "Krom", "Krong preah sihanouk", "Krong siem reap", "Kronoby", "Kronshagen", "Kropswolde", "Krosno", "Krung thep maha nakhon", "Krupina", "Kryshtopivka", "Kryvyi rih", "Ksarelkebir", "Kuala lumpur", "Kuala terengganu", "Kuantan", "Kuching", "Kudowazdrj", "Kufstein", "Kulasekharam", "Kuleshovka", "Kulim", "Kulob", "Kumanovo", "Kumarapuram", "Kumasi", "Kumertau", "Kumluca", "Kumul", "Kungsbacka", "Kunglv", "Kuningan", "Kunitachi", "Kunming", "Kunming shi", "Kunnamkulam", "Kunova teplica", "Kunshan city", "Kuopio", "Kurabi brisbane", "Kurashiki", "Kurgan", "Kurim", "Kurnool", "Kurobeshi", "Kursk", "Kurukshetra", "Kurunegala", "Kusatsu", "Kuse county", "Kushinagar", "Kushiro", "Kushtia", "Kuta", "Kutna hora", "Kutztown", "Kuurne", "Kuwait city", "Kuwanashi", "Kuadas", "Kvinesdal", "Kwadendamme", "Kwidzyn", "Kwun tong district", "Kybartai", "Kyiv", "Kyotango", "Kyoto", "Klimnos", "Kvlinge", "Kln", "Knigsberg", "Knigslutter am elm", "Knigstein im taunus", "Knigswinter", "Kping", "Kbenhavn", "Kbenhavn s", "Kge", "Krnbach", "Ksnacht", "Ktahya", "Kchi", "Lampolla", "Laquila", "Lhalesroses", "Lhospitalet de linfant", "Lhospitalet de llobregat", "Llesaintdenis", "La albuera", "La argelia", "La belle", "La bisbal del peneds", "La canyada", "La caada flintridge", "La ceja", "La chapellesurerdre", "La chorrera", "La ciotat", "La conner", "La crescentamontrose", "La crosse", "La dorada", "La florida", "La flotte", "La garennecolombes", "La garriga", "La grandcroix", "La grande", "La grange", "La habra", "La honda", "La jolla", "La lima", "La loupe", "La mancha", "La matanza", "La mesa", "La mirada", "La molina", "La nube", "La orotava", "La paloma", "La paz", "La pine", "La plata", "La pobla de vallbona", "La pobla tornesa", "La porte", "La quinta", "La rioja", "La rochesurforon", "La rochesuryon", "La rochefoucauld", "La rochelle", "La serena", "La seynesurmer", "La spezia", "La talaudire", "La testedebuch", "La tourdepeilz", "La tronche", "La tuque", "La turbie", "La union", "La unin", "La vergne", "La verne", "Labastidesaintsernin", "Labelle", "Labin", "Lablachre", "Lacey", "Lachen", "Lacombe", "Ladby", "Ladenburg", "Ladera ranch", "Ladispoli", "Ladson", "Lady lake", "Lae", "Lafayette", "Lafayette hill", "Lage", "Lages", "Lagnysurmarne", "Lagoa santa", "Lagos", "Lagrange", "Laguiole", "Laguja", "Laguna", "Laguna beach", "Laguna de duero", "Laguna hills", "Laguna niguel", "Lahaina", "Lahnstein", "Lahore", "Lahr", "Lahrschwarzwald", "Lahti", "Laingsburg", "Lair", "Lajeado", "Lake argyle", "Lake arrowhead", "Lake barrington", "Lake charles", "Lake city", "Lake cowichan", "Lake dallas", "Lake elsinore", "Lake forest", "Lake forest park", "Lake geneva", "Lake grove", "Lake havasu city", "Lake in the hills", "Lake jackson", "Lake leelanau", "Lake mary", "Lake mills", "Lake minchumina", "Lake montezuma", "Lake oswego", "Lake ozark", "Lake panasoffkee", "Lake park", "Lake placid", "Lake quivira", "Lake ronkonkoma", "Lake st louis", "Lake station", "Lake stevens", "Lake worth", "Lake zurich", "Lakebay", "Lakehurst", "Lakeland", "Lakemoor", "Lakemore", "Lakeport", "Lakeshore", "Lakeside", "Lakeview", "Lakeville", "Lakewood", "Lakewood township", "Lakota", "Lalitpur", "Lamar", "Lambersart", "Lambertville", "Lambesc", "Lamezia terme", "Lamia", "Lamidanda", "Lamon", "Lamongan", "Lamoni", "Lampang", "Lampeter", "Lampung town", "Lanaja", "Lanaken", "Lancaster", "Lanciano", "Landau", "Landen", "Landenberg", "Lander", "Landers", "Landgraaf", "Landsberg am lech", "Landshut", "Landskrona", "Lanexa", "Langen", "Langenargen", "Langendorf", "Langenfeld", "Langeskov", "Langfang", "Langfang shi", "Langhorne", "Langhus", "Langkawi", "Langlade", "Langley", "Langreo", "Langres", "Langwedel", "Lanham", "Lannach", "Lannilis", "Lannion", "Lansdale", "Lansing", "Lantana", "Lanzhou", "Lans", "Laon", "Lapa", "Lapha", "Lappeenranta", "Lapulapu city", "Lara", "Laramie", "Laranjeiro", "Laredo", "Largo", "Larissa", "Larkspur", "Larne", "Larrabetzu", "Larvik", "Las chacras", "Las condes", "Las cruces", "Las lagunas", "Las palmas", "Las palmas de gran canaria", "Las pias", "Las rozas", "Las torres de cotillas", "Las vegas", "Lasa shi", "Lasalle", "Lasarteoria", "Lastra a signa", "Latacunga", "Latakia", "Latham", "Lathum", "Latina", "Latrobe", "Laudio", "Launceston", "Laupersdorf", "Laurel", "Laurencekirk", "Lauro de freitas", "Lausanne", "Lausen", "Laval", "Lavaltrie", "Lavau", "Lavilledieu", "Lavis", "Lavras", "Lavrica", "Lawrence", "Lawrence township", "Lawrenceville", "Lawton", "Laxenburg", "Laxou", "Layton", "Le beaucet", "Le blancmesnil", "Le bouchetmontcharvin", "Le bourgetdulac", "Le cannet", "Le chesnay", "Le creusot", "Le grandsaconnex", "Le havre", "Le kremlinbictre", "Le locle", "Le mans", "Le mars", "Le montsurlausanne", "Le mouret", "Le palaissurvienne", "Le passage", "Le perreuxsurmarne", "Le pertuis", "Le petitquevilly", "Le prsaintgervais", "Le puy", "Le puysainterparade", "Le pquier", "Le reculey", "Le roeulx", "Le thillot", "League city", "Leander", "Leandro n alem", "Leatherhead", "Leavenworth", "Leawood", "Lebanon", "Lebbeke", "Lebork", "Lecce", "Lecco", "Ledbury", "Lede", "Leduc", "Lee", "Lees summit", "Leeds", "Leek", "Leer", "Leersum", "Leesburg", "Leeston", "Leeuwarden", "Lefkoa", "Legans", "Legau", "Legazpi", "Legazpi city", "Legnano", "Legnaro", "Legnica", "Lehi", "Lehigh", "Lehigh acres", "Leibertingen", "Leibnitz", "Leicester", "Leichlingen", "Leiden", "Leiderdorp", "Leidschendam", "Leigh", "Leighton", "Leighton buzzard", "Leikanger", "Leimen", "Leimuiden", "Leinefeldeworbis", "Leinfeldenechterdingen", "Leioa", "Leipzig", "Leiria", "Leitrim", "Leiyang", "Lekeitio", "Lekhnath", "Leland", "Lelystad", "Lemgo", "Lemi", "Lemiers", "Lemmer", "Lemont", "Lemoyne", "Lempdes", "Lendava", "Lenexa", "Lengdorf", "Lengnau", "Lenoir", "Lenzburg", "Leoben", "Leon", "Leonberg", "Leonding", "Leonforte", "Leopoldina", "Leopoldsburg", "Lephalale local municipality", "Leppvirta", "Lerici", "Lerum", "Les abrets", "Les allues", "Les clayessousbois", "Les houches", "Les olives", "Les sablesdolonne", "Les ulis", "Leshan", "Leskovac", "Leslie", "Leszno", "Letchworth garden city", "Lethbridge", "Letterfrack", "Letterkenny", "Lety", "Leuna", "Leusden", "Leutkirch im allgu", "Leuven", "Levalloisperret", "Levanger", "Leverkusen", "Levice", "Levis", "Levittown", "Lewarde", "Lewes", "Lewisberry", "Lewisburg", "Lewiston", "Lewistown", "Lewisville", "Lexington", "Lexington park", "Leyland", "Leyment", "Leysin", "Lezennes", "Lezo", "Len", "Lhasa", "Liancourt", "Liangshan", "Lianyungang", "Lianyungang shi", "Libchavy", "Liberec", "Liberia", "Liberty", "Liberty hill", "Liberty lake", "Libertyville", "Libreville", "Lich", "Lichfield", "Lichtervelde", "Lichuan", "Lidkping", "Lido di camaiore", "Lieboch", "Liederbach am taunus", "Liepja", "Lier", "Liernu", "Lieshout", "Liestal", "Lieusaint", "Ligerz", "Lighthouse point", "Lignano sabbiadoro", "Ligonier", "Lihue", "Lijiang", "Lilburn", "Lille", "Lillehammer", "Lillesand", "Lillestrm", "Liloan", "Lilongwe", "Lima", "Limassol", "Limavady", "Limay", "Limburg", "Limeira", "Limerick", "Limmen", "Limoges", "Linares", "Linau", "Lincoln", "Lincoln city", "Lincoln park", "Lincolnshire", "Lincolnwood", "Lindaavelha", "Lindale", "Lindau bodensee", "Linden", "Lindfield", "Lindford", "Lindholmen", "Lindome", "Lindon", "Linfen", "Linfen shi", "Lingen", "Lingolsheim", "Linhai", "Linhares", "Linkping", "Linlithgow", "Lino lakes", "Lins", "Linschoten", "Linsengericht", "Lint", "Linthicum heights", "Linton", "Linyi city", "Linyi shi", "Linz", "Lipa", "Lipetsk", "Lippelo", "Lippstadt", "Lisboa", "Lisbon", "Lisburn", "Lisieux", "Lisle", "Lismore", "Lisse", "Lissone", "Litchfield", "Litchfield park", "Lith", "Lithia", "Lithonia", "Lititz", "Litovel", "Little canada", "Little elm", "Little falls", "Little rock", "Littleborough", "Littlehampton", "Littleport", "Littlerock", "Littleton", "Liupanshui", "Liuzhou", "Livermore", "Liverpool", "Liversedge", "Livingston", "Livonia", "Livorno", "Livrygargan", "Lige", "Ljubljana", "Ljutomer", "Llanarmon dyffryn ceiriog", "Llanbradach", "Llandeilo", "Llanfairpwllgwyngyll", "Llanfrothen", "Llantwit major", "Lleida", "Lloret de mar", "Llub", "Llria", "Lobito", "Lobnya", "Locarno", "Lochem", "Lochristi", "Lock", "Lock haven", "Lockport", "Lod", "Lodge gate", "Lodhrn", "Lodi", "Loenen", "Logan", "Loganville", "Logatec", "Lognes", "Logroo", "Lohja", "Lohmar", "Lohr a main", "Loja", "Lokeren", "Lom", "Loma linda", "Lomagna", "Lomita", "Lommel", "Lompoc", "Lonate pozzolo", "Lonavala", "Londerzeel", "London", "Londonderry", "Londonderryderry", "Londrina", "Lone tree", "Long ashton", "Long beach", "Long beach township", "Long grove", "Long melford", "Longares", "Longboat key", "Longchamps", "Longjumeau", "Longkou", "Longmeadow", "Longmont", "Longnan", "Longueuil", "Longview", "Longwood", "Longyearbyen", "Lookout mountain", "Loomis", "Loon", "Loon op zand", "Lopik", "Loppersum", "Lorain", "Lorca", "Lorena", "Loreto", "Lorica", "Lorient", "Loriolsurdrme", "Lorn", "Los", "Los alamitos", "Los alamos", "Los altos", "Los altos hills", "Los angeles", "Los banos", "Los barrios", "Los baos", "Los gatos", "Los mochis", "Los realejos", "Los santos", "Los teques", "Los ngeles", "Lost hills", "Lostallo", "Loubenslauragais", "Loudon", "Loudonville", "Loudun", "Loudwater", "Loughborough", "Louisburg", "Louisiana", "Louisville", "Lound", "Louny", "Louth", "Loutraki", "Louvainlaneuve", "Louveira", "Louviers", "Lovech", "Loveland", "Lovelock", "Lovendegem", "Loves park", "Lovisa", "Lovozero", "Lowell", "Lower hutt", "Lowestoft", "Lowicz", "Loxa", "Loxstedt", "Loxton", "Loznica", "Luan", "Luanda", "Lubbeek", "Lubbock", "Lubin", "Lublin", "Lubliniec", "Lubny", "Lubumbashi", "Lucan", "Lucas do rio verde", "Lucca", "Lucena", "Lucena del puerto", "Lucerne", "Luck", "Lucknow", "Ludhiana", "Ludington", "Ludlow", "Ludwigsburg", "Ludwigshafen", "Lugano", "Lugo", "Lugo di vicenza", "Lugoj", "Luhansk", "Luis eduardo magalhes", "Lujn", "Lujn de cuyo", "Lukeville", "Lule", "Lumajang", "Lumberton", "Lumbres", "Lumut", "Luna", "Luna de sus", "Lund", "Lunel", "Lunenburg", "Lungavilla", "Luohe", "Luoyang", "Luoyang shi", "Luque", "Lurin", "Lusaka", "Luserna san giovanni", "Luskville", "Luthervilletimonium", "Luton", "Lutsk", "Lutz", "Luxem", "Luxembourg", "Luxembourg city", "Luz", "Luzern", "Luzino", "Luzinia", "Lviv", "Lvliang shi", "Lyasny", "Lyle", "Lyman", "Lyme", "Lyminge", "Lymington", "Lymm", "Lynchburg", "Lynden", "Lyndhurst", "Lyndoch", "Lyngby", "Lynn", "Lynnfield", "Lynnwood", "Lyon", "Lyons", "Lyonslafort", "Lyss", "Lysychansk", "Lytkarino", "Lb", "Lzaro crdenas", "Lguevin", "Lvis", "Lrrach", "Lrenskog", "Lbbecke", "Lbeck", "Ldenscheid", "Ldinghausen", "Lleburgaz", "Lneburg", "Lnen", "Ldziny", "Lgatne", "Lhue", "Mrirt", "Maanshan", "Maarheeze", "Maarn", "Maarssenbroek", "Maasdijk", "Maasdriel", "Maaseik", "Maassluis", "Maastricht", "Mableton", "Macao peninsula", "Macapa", "Macas", "Maca", "Macaba", "Macclenny", "Macclesfield", "Macedon", "Macedonia", "Macei", "Macerata", "Machain", "Machelen", "Machida", "Mackay", "Mackmyra", "Macomb", "Macon", "Macungie", "Madang", "Madeira", "Madhyapur thimi", "Madison", "Madison heights", "Madiun", "Madona", "Madrid", "Madurai", "Mae ka", "Maebashi", "Maesycwmmer", "Mafra", "Magadan", "Magalang", "Magalia", "Magdalena del mar", "Magdeburg", "Magelang", "Magenta", "Magetan", "Magherafelt", "Maglie", "Magnano in riviera", "Magnatltrange", "Magnitogorsk", "Magnolia", "Magnylehongre", "Magog", "Magsaysay", "Mahadpur", "Mahara", "Maharagama", "Mahdia", "Mahopac", "Mahwah", "Maia", "Maidenhead", "Maidstone", "Maienfeld", "Maineville", "Mainhausen", "Maintal", "Maintenon", "Mainz", "Maiolati spontini", "Maisonsalfort", "Maitenbeth", "Maitland", "Majadahonda", "Majalengka", "Majheria", "Majuro", "Makanda", "Makarska", "Makassar", "Makati", "Makawao", "Makedonska kamenitsa", "Makhachkala", "Makiivka", "Mala district", "Mala krsna", "Malabe", "Malabo", "Malabon", "Malacca city", "Malacky", "Malahide", "Malakoff", "Malang", "Malang city", "Malappuram", "Malatya", "Malay", "Malaybalay", "Malaybalay city", "Malda", "Maldegem", "Malden", "Maldon", "Maldonado", "Maleny", "Malete", "Malibu", "Malling", "Mallow", "Malmesbury", "Malm", "Malnate", "Malolos", "Malpica de bergantios", "Malsch", "Malta", "Maltby", "Malvern", "Mamanguape", "Mamaroneck", "Mammendorf", "Mammoth cave", "Mammoth lakes", "Mamoudzou", "Mankivka", "Manado", "Manado city", "Managua", "Manalapan township", "Manama", "Mananara avaratra", "Manassas", "Manaus", "Mancherial", "Manchester", "Manchester township", "Mandaguari", "Mandalay", "Mandaluyong", "Mandan", "Mandaue city", "Mandelieula napoule", "Mandeville", "Mandi", "Mandreslesroses", "Mandurah", "Manerbio", "Mangalore", "Mangaluru", "Mango", "Manhasset", "Manhattan", "Manhattan beach", "Maniago", "Manila", "Manipal", "Manisa", "Manises", "Manitou springs", "Manitowoc", "Manizales", "Mankato", "Manlleu", "Mannarkkad", "Mannheim", "Manno", "Manof", "Manom", "Manosque", "Manresa", "Mansfield", "Mansign", "Mansle", "Mansoura", "Manta", "Manteca", "Manteslaville", "Manti", "Mantua", "Mantua township", "Manvel", "Manzanares", "Manzanillo", "Mapandan", "Maple grove", "Maple ridge", "Maple shade township", "Maple valley", "Mapleton", "Maplewood", "Mapusa", "Maputo", "Mar de aj", "Mar del plata", "Maraba", "Maracaibo", "Maracana", "Maracay", "Maracena", "Maragheh", "Maramag", "Maranello", "Maranguape", "Marau", "Maravilha", "Marawi city", "Marbach am neckar", "Marbella", "Marble", "Marble falls", "Marblehead", "Marburg", "Marck", "Marcos jurez", "Marcqenbarul", "Mardan", "Marechal cndido rondon", "Marechal deodoro", "Marenkessel", "Marfa", "Margao", "Margaret river", "Margate", "Margherita di savoia", "Marghita", "Margretetorp", "Marialva", "Mariana mantovana", "Mariano melgar", "Maribor", "Maribyrnong", "Maricopa", "Mariehamn", "Mariemont", "Marietta", "Marieville", "Marignybrizay", "Marikina", "Marilao", "Marina", "Marina del rey", "Marinette", "Maringa", "Maring", "Marinilla", "Marion", "Mariupol", "Mariupol", "Markdorf", "Market harborough", "Market rasen", "Market weighton", "Markgrningen", "Markham", "Marki", "Markinaxemein", "Markkleeberg", "Markleeville", "Markt berolzheim", "Marl", "Marlboro", "Marlboro township", "Marlborough", "Marlow", "Marmaris", "Marmoutier", "Marnelavalle", "Marneuli", "Maroochydore", "Marple", "Marquette", "Marquillies", "Marrakesh", "Marratx", "Marsaskala", "Marseille", "Marseilles", "Marshall", "Marshfield", "Marslet", "Marth", "Martigny", "Martigues", "Martin", "Martinez", "Martinsburg", "Martorell", "Martos", "Martyr worthy", "Marvdasht", "Marvejols", "Marvel", "Maryland", "Maryland heights", "Marysin", "Marysville", "Maryville", "Marzling", "Marzy", "Marlia", "Marn", "Masaya", "Mascouche", "Maser", "Maseru", "Mashhad", "Mashpee", "Maslak", "Mason", "Maspalomas", "Massa", "Massapequa park", "Massaranduba", "Massarosa", "Massena", "Massillon", "Massonnens", "Massy", "Masterton", "Matadepera", "Matagalpa", "Matalom", "Matamoras", "Matamoros", "Matanzas", "Matara", "Mataram", "Matar", "Matatiele local municipality", "Matera", "Mateus leme", "Mathews", "Mathura", "Matlock", "Matosinhos", "Matsudo", "Matsue", "Matsueshi", "Matsuyama", "Matsuyamashi", "Mattawa", "Mattawan", "Mattersburg", "Matthews", "Mattoon", "Maturin", "Maua", "Mauchline", "Mauerbach", "Mauguio", "Mauldin", "Maumee", "Maurice", "Mauves", "Mavelikara", "Mawanella", "Maxhttehaidhof", "Mayagez", "Mayenne", "Mayfield", "Mayfield heights", "Mayland", "Maynard", "Maynooth", "Mayrhofen", "Maywood", "Mazara del vallo", "Mazatln", "Mbabane", "Mbarara", "Mcallen", "Mcbride", "Mccordsville", "Mcdonough", "Mcgehee", "Mchenry", "Mckinleyville", "Mckinney", "Mclean", "Mcloud", "Mcmasterville", "Mcminnville", "Mcmurdo station", "Mcpherson", "Mcveytown", "Mead", "Meadville", "Meaux", "Mebane", "Mecca", "Mechanicsburg", "Mechanicsville", "Mechelen", "Meckenbeuren", "Meco", "Medan", "Medan city", "Medellin", "Medelln", "Medenine", "Medfield", "Medford", "Medford lakes", "Media", "Medianeira", "Medicina", "Medicine hat", "Medina", "Medina del campo", "Mediona", "Medjez el bab", "Medway", "Meerbusch", "Meerut", "Meeuwen", "Megara", "Meguro", "Meguroku", "Mehsana", "Meilen", "Meira", "Meishan", "Meizhou", "Mekel", "Meknes", "Mekns ", "Melbourne", "Melbourne airport", "Melbourne beach", "Melegnano", "Meliana", "Melick", "Melilla", "Melipilla", "Melitopol", "Melle", "Mells", "Melrose", "Melrose park", "Melton", "Melton mowbray", "Melun", "Melville", "Melvindale", "Memmingen", "Memphis", "Menasha", "Mendham", "Mendocino", "Mendoza", "Mendrisio", "Menen", "Menfi", "Mengzi", "Menifee", "Menlo park", "Menomonee falls", "Menomonie", "Mentor", "Menucourt", "Menumbok", "Meppel", "Mequon", "Meran", "Merano", "Merate", "Merca", "Merced", "Mercer island", "Merchantville", "Meredith", "Merelbeke", "Merida", "Meriden", "Meridian", "Meridian charter township", "Mering", "Merkelbeek", "Merksplas", "Merlin", "Merlo", "Merriam", "Merrick", "Merrifield", "Merrimack", "Merritt island", "Merseburg", "Mersin", "Mertert", "Merzig", "Mesa", "Mesquita", "Mesquite", "Messen", "Messina", "Mestre", "Metairie", "Metamora", "Metepec", "Metropolis", "Mettet", "Metuchen", "Metz", "Metztessy", "Metzingen", "Meudon", "Mexicali", "Mexico", "Mexico city", "Meycauayan", "Meylan", "Meyrargues", "Meyrin", "Mezzocorona", "Mezfalva", "Miami", "Miami beach", "Miami lakes", "Miami shores", "Miamisburg", "Mianyang", "Miass", "Michaniona", "Michigan city", "Mid devon district", "Middelburg", "Middenbeemster", "Middle township", "Middleborough", "Middlebury", "Middlesbrough", "Middlesex", "Middletown", "Middletown township", "Midhurst", "Midland", "Midland park", "Midlothian", "Midrand", "Midvale", "Mie county", "Miedzyrzec podlaski", "Mieres", "Mierlo", "Mifflinburg", "Miguel pereira", "Mijas", "Mijdrecht", "Mikkeli", "Mikolow", "Milan", "Milano", "Mildura", "Mile", "Milford", "Milford charter township", "Milford haven", "Milhaud", "Milheirs de poiares", "Mililani", "Mill creek", "Mill valley", "Millbrae", "Millburn", "Millbury", "Milleisles", "Milledgeville", "Millersburg", "Millerstown", "Millersville", "Millet", "Millhousen", "Milliken", "Millingen aan de rijn", "Millington", "Millis", "Millstatt", "Milltown", "Milpitas", "Milsbeek", "Milton", "Milton bryan", "Milton keynes", "Milwaukee", "Milwaukie", "Mim", "Minami ward", "Minas", "Minatitln", "Minato", "Minatoku", "Minde", "Mindelheim", "Mindelo", "Minden", "Mineola", "Mineralnye vody", "Minersville", "Mingguang", "Minglanilla", "Mingora", "Minhang", "Minneapolis", "Minnesota lake", "Minnetonka", "Minsk", "Minuwangoda", "Minya", "Mirabel", "Miracema do tocantins", "Miraflores", "Miramar", "Miramar beach", "Miramas", "Miramichi", "Miranda de ebro", "Mirandola", "Miri", "Mirigama", "Misantla", "Mishawaka", "Mishima", "Mishima district", "Miskolc", "Missaglia", "Missal", "Mission", "Mission hills", "Mission viejo", "Mississauga", "Mississippi state university", "Missoula", "Missouri city", "Mitaka", "Mitchell", "Mitchells", "Mitchellville", "Mito", "Mitrovic", "Mittelstetten", "Mittertreffling", "Mitzpe ramon", "Miyako county", "Mo i rana", "Moab", "Mobile", "Mobo", "Mockfjrd", "Mococa", "Moctezuma", "Modautal", "Modena", "Modesto", "Modica", "Modiinmaccabimreut", "Modinagar", "Modugno", "Moe", "Moergestel", "Moers", "Moffett field", "Mogadishu", "Mogi das cruzes", "Mogi mirim", "Mogiguau", "Mogilev", "Mogilno", "Mogyord", "Mohammadpur area", "Mohelnice", "Mojave", "Mojokerto", "Mokena", "Mol", "Mola di bari", "Molde", "Molina de segura", "Moline", "Molise", "Mollerussa", "Mollis", "Molteno", "Molveno", "Mombasa", "Mona vale", "Monaco", "Monastero bormida", "Monastir", "Moncks corner", "Moncton", "Mondo", "Mondsee", "Monfalcone", "Monheim", "Monheim am rhein", "Monistrol de montserrat", "Monkey bay", "Monkey island", "Monmouth", "Monongahela", "Monroe", "Monroe county", "Monrovia", "Mons", "Monsano", "Monserrat", "Monsey", "Montdemarsan", "Montlaville", "Montlaurier", "Montsaintaignan", "Montsainthilaire", "Monttremblant", "Montabaur", "Montadas", "Montague", "Montaletlebois", "Montana", "Montara", "Montauban", "Montbonnotsaintmartin", "Montbliard", "Montclair", "Monte mor", "Monte rio", "Monte sereno", "Montebello", "Montebelluna", "Montecatini terme", "Montego bay", "Monteiro", "Montello", "Montemorelos", "Monterey", "Monterey park", "Montero", "Monteros", "Monterrey", "Montera", "Montes claros", "Montevallo", "Montevarchi", "Montevideo", "Montford bridge", "Montgat", "Montgomery", "Montgomeryville", "Monthey", "Montiano", "Monticello", "Montichiari", "Montignylebretonneux", "Montignylsmetz", "Montijo", "Montilla", "Montividiu", "Montjeansurloire", "Montoggio", "Montpelier", "Montpellier", "Montpezat", "Montpreveyres", "Montreal", "Montreal city", "Montreuil", "Montreux", "Montrose", "Montrouge", "Montral", "Montralest", "Monts", "Montvale", "Montverde", "Montvrain", "Monument", "Monywa", "Monza", "Monver", "Mood", "Moon", "Moonstone", "Moore", "Moore park beach", "Mooresboro", "Moorestown", "Mooresville", "Moorhead", "Mooroobool", "Moorpark", "Moose jaw", "Mora", "Moraga", "Moraine", "Moralzarzal", "Moratuwa", "Morbegno", "Morden", "Morecambe", "Morehead", "Morelia", "Moreno", "Moreno valley", "Moretta", "Morgan hill", "Morganton", "Morgantown", "Morganza", "Morgarten", "Morges", "Moria", "Morillon", "Morioka", "Morisset", "Mormant", "Mornington", "Morpeth", "Morrinhos", "Morris", "Morris plains", "Morrison", "Morristown", "Morrisville", "Morro bay", "Morrow", "Morsbach", "Morton", "Mortsel", "Morud", "Morwell", "Morn", "Moscow", "Moses lake", "Mosfellsbr", "Moshi", "Mosinee", "Mosjen", "Moskva", "Moss", "Moss beach", "Moss landing", "Mossor", "Most", "Mostar", "Mosul", "Mota del cuervo", "Motala", "Motueka", "Mouanssartoux", "Mougins", "Moulins", "Moulis", "Moundou", "Mounds view", "Mount airy", "Mount arlington", "Mount croghan", "Mount ephraim", "Mount helen", "Mount holly", "Mount hood village", "Mount horeb", "Mount joy", "Mount juliet", "Mount kisco", "Mount laurel", "Mount laurel township", "Mount morris", "Mount olive township", "Mount olympus", "Mount pearl", "Mount pleasant", "Mount rainier", "Mount royal", "Mount sinai", "Mount vernon", "Mount waverley", "Mountain city", "Mountain home", "Mountain house", "Mountain top", "Mountain view", "Mountlake terrace", "Moura", "Mouscron", "Mozhaysk", "Mozzanella", "Mpanda", "Msida", "Mszczonow", "Mtunzini", "Much", "Mukacheve", "Mukilteo", "Mulhouse", "Mulita", "Mullens", "Mullingar", "Multan", "Mumbai", "Muncie", "Mundelein", "Mundra", "Munger", "Munich", "Municipality of the district of barrington", "Municipio oruro", "Municipio potosi", "Municipio santa ana del yacuma", "Munnar", "Munster", "Muntilan", "Muntinlupa", "Murdebarrez", "Murarrie", "Murcia", "Murfreesboro", "Muri bei bern", "Muria", "Muritiba", "Murmansk", "Murom", "Muros", "Murphy", "Murray", "Murree", "Murrieta", "Murrika", "Murtosa", "Murun", "Musashino", "Muscat", "Muscat oman", "Muscatine", "Muscle shoals", "Musile di piave", "Muskego", "Muskegon", "Muskogee", "Musquodoboit harbour", "Musselburgh", "Musson", "Mustafakemalpaa", "Muttenz", "Muvattupuzha", "Mwanza", "Myakka city", "Myjava", "Mykolaiv", "Mymensingh", "Myrtle beach", "Myslenice", "Mysore division", "Mysuru", "Mzuzu", "Mlaga", "Mcon", "Mgrine", "Mrida", "Mrignac", "Mrahalom", "Mstoles", "Mhrendorf", "Mlndal", "Mnchengladbach", "Mhldorf", "Mhlheim am main", "Mlheim", "Mnchen", "Mnster", "Mrupe", "Mlnk", "Naaharia", "Naaldwijk", "Naas", "Nabatieh", "Naberezhnye chelny", "Nablus", "Nacogdoches", "Nadiad", "Naga", "Nagano", "Nagaoka", "Nagaokashi", "Nagapattinam", "Nagareyama", "Nagasaki", "Nagaur", "Nagercoil", "Nago", "Nagoya", "Nagpur", "Nags head", "Nagua", "Naguanagua", "Nagyhegyes", "Naha", "Nahashi", "Nahant", "Nahodka", "Nailloux", "Nainital", "Nairn", "Nairobi", "Naka ward", "Nakaku", "Nakashi", "Nakahara ward", "Nakano", "Nakhon ratchasima", "Nakhon si thammarat", "Nakuru", "Nalchik", "Namakkal", "Namangan", "Nambol", "Nampa", "Namsos", "Namur", "Namyangjusi", "Namysw", "Nanaimo", "Nanchang", "Nanchital", "Nancy", "Nandi hills", "Naniwaku", "Nanjing", "Nanjing city", "Nanjing shi", "Nanj", "Nanning", "Nanning shi", "Nanping", "Nanping shi", "Nanterre", "Nantes", "Nantong", "Nantong shi", "Nantucket", "Nantwich", "Nanuet", "Nanxiong", "Nanyang", "Nanyang shi", "Napa", "Napajedla", "Naperville", "Napier", "Naples", "Napoleon", "Napoli", "Nara", "Narashi", "Naranjo de alajuela", "Narashino", "Narashinoshi", "Narath", "Narayanganj", "Narberth", "Narbonne", "Narofominsk", "Narowal", "Narrabri", "Narragansett", "Narsingdi", "Narva", "Narvik", "Nash", "Nashik", "Nashua", "Nashville", "Nashvilledavidson", "Nassau", "Nastola", "Nasukarasuyamashi", "Natal", "Natchez", "Natchitoches", "Naters", "Nathdwara", "Natick", "Natural heritage area trang", "Naturns", "Naucalpan de jurez", "Naugatuck", "Naul", "Naumburg", "Naur", "Nauvoo", "Navacchio", "Navapolatsk", "Navarre", "Navarrete", "Navi mumbai", "Navojoa", "Navojoa sonora", "Navotas", "Navsari", "Nay", "Naypyidaw", "Nazareth", "Nazar paulista", "Naice", "Ndola", "Neath", "Nebraska city", "Neckarsulm", "Neckarwestheim", "Necochea", "Nederland", "Nedervetil", "Nederweert", "Needham", "Needville", "Neemrana", "Neenah", "Neerabup", "Neerpelt", "Negombo", "Neillsville", "Neiva", "Nellore", "Nelson", "Nelsonville", "Nelspruit", "Nemo", "Nenagh", "Nepa", "Nephi", "Neptune beach", "Neptune township", "Neratovice", "Nerima", "Nesconset", "Neskowin", "Ness ziyyona", "Nesselwang", "Nesvizh", "Netanya", "Nettetal", "Neu wulmstorf", "Neuisenburg", "Neuulm", "Neubrandenburg", "Neuburg am rhein", "Neuburg an der donau", "Neuchatel", "Neufahrn bei freising", "Neufchteau", "Neufelden", "Neuhausen am rheinfall", "Neuhof", "Neuhusel", "Neuillyplaisance", "Neuillysurseine", "Neuland colony", "Neumarkt in der oberpfalz", "Neumnster", "Neunkirchen", "Neuquen", "Neuqun", "Neuruppin", "Neuss", "Neustadt", "Neustadt wied", "Neustadt am rbenberge", "Neustadt an der weinstrae", "Neustadt in holstein", "Neustupov", "Neuvillyenargonne", "Neuwied", "Nevada", "Nevada city", "Nevele", "Nevers", "Nevinnomyssk", "New albany", "New alexandria", "New baltimore", "New bedford", "New berlin", "New bern", "New boston", "New braunfels", "New brighton", "New britain", "New brunswick", "New castle", "New cordell", "New cumberland", "New delhi", "New england", "New franklin", "New glasgow", "New hampton", "New hartford", "New haven", "New holland", "New hope", "New hyde park", "New iberia", "New kensington", "New lebanon", "New lenox", "New lisbon", "New london", "New market", "New martinsville", "New milford", "New milton", "New orleans", "New palestine", "New paltz", "New philadelphia", "New plymouth", "New port richey", "New providence", "New richmond", "New rochelle", "New smyrna beach", "New springfield", "New taipei city", "New ulm", "New westminster", "New wilmington", "New windsor", "New york", "New york city", "New york mills", "Newark", "Newark and sherwood", "Newarkontrent", "Newberg", "Newborough", "Newburgh", "Newbury", "Newburyport", "Newcastle", "Newcastle upon tyne", "Newcastleunderlyme", "Newfoundland", "Newingreen", "Newington", "Newkirk", "Newmarket", "Newnan", "Newport", "Newport beach", "Newport news", "Newport news city", "Newquay", "Newry", "Newstead", "Newton", "Newton abbot", "Newtonmore", "Newtown", "Newtown square", "Newtownabbey", "Neyshabur", "Neyveli", "Nganjuk", "Ngari", "Ngawi", "Ngoro", "Nha trang", "Niagara", "Niagara falls", "Nice", "Nicorvo", "Nicosia", "Nicoya", "Nidau", "Nidda", "Niebll", "Niederrohrdorf", "Niederzirking", "Nieport", "Nieppe", "Nierstein", "Niesky", "Nieuw amsterdam", "Nieuwvennep", "Nieuwdorp", "Nieuwegein", "Nieuwkoop", "Nieuwkuijk", "Nieuwpoort", "Nigrn", "Niigata", "Niiza", "Nijehaske", "Nijeveen", "Nijkerk", "Nijlen", "Nijmegen", "Nijverdal", "Niksic", "Niles", "Nimes", "Ningbo", "Ningbo shi", "Ninove", "Niort", "Nipomo", "Nis", "Niscemi", "Niseko", "Nishi sonogi county", "Nishi ward", "Nishiku", "Nishio", "Nishitkyshi", "Nita county", "Niteri", "Nitra", "Nitro", "Nittambuwa", "Nittel", "Nitzanei oz", "Nivelles", "Niwot", "Nixa", "Nizamabad", "Nizhniy arkhyz", "Nizhniy novgorod", "Nizhny novgorod", "Nizhny tagil", "Noakhali", "Noale", "Noasca", "Noblesville", "Noda", "Noepe", "Nogales", "Nogentsurmarne", "Nogentsuroise", "Nogentsurseine", "Nogi", "Noginsk", "Noia", "Noida", "Noisiel", "Noisylegrand", "Nokomis", "Nola", "Nolensville", "Nomi", "Nomishi", "None", "Noness", "Nonoichi", "Nonthaburi", "Noordbroek", "Noordwijk", "Noordwijk aan zee", "Noosa heads", "Nootdorp", "Norcross", "Norderstedt", "Nordhausen", "Nordkisa", "Norfolk", "Norilsk", "Normal", "Norman", "Normans green", "Normandy", "Norresundby", "Norristown", "Norrkping", "Norrtlje", "Norsesund", "North adams", "North andover", "North augusta", "North barrington", "North bay", "North bend", "North bergen", "North bethesda", "North bonneville", "North branch", "North brunswick township", "North canton", "North charleston", "North chicago", "North east derbyshire", "North fork", "North kansas city", "North kingstown", "North las vegas", "North laurel", "North liberty", "North little rock", "North manchester", "North mankato", "North melbourne", "North miami", "North miami beach", "North myrtle beach", "North norfolk", "North ogden", "North pole", "North port", "North potomac", "North providence", "North reading", "North richland hills", "North salem", "North salt lake", "North shields", "North smithfield", "North sydney", "North tonawanda", "North tyneside", "North vancouver", "North vancouver district", "North vernon", "North wales", "North washington", "North wilkesboro", "Northampton", "Northampton township", "Northborough", "Northbrook", "Northeim", "Northfield", "Northglenn", "Northport", "Northvale", "Northville", "Northwest", "Northwich", "Northwood", "Norton", "Norton shores", "Norwalk", "Norway", "Norwell", "Norwich", "Norwood", "Nothing", "Notodden", "Notre dame", "Nottingham", "Nouakchott", "Noumea", "Nouma", "Nova", "Nova andradina", "Nova bandeirantes", "Nova cantu", "Nova friburgo", "Nova gorica", "Nova gradika", "Nova hartz", "Nova iguau", "Nova kakhovka", "Nova mutum", "Nova odessa", "Nova pazova", "Nova prata", "Nova trento", "Novaki bizovaki", "Novalaise", "Novara", "Novato", "Novazzano", "Novi", "Novi pazar", "Novi sad", "Noville", "Novo hamburgo", "Novo mesto", "Novocheboksarsk", "Novocherkassk", "Novokuznetsk", "Novomoskovsk", "Novomoskovsk", "Novorossiysk", "Novosibirsk", "Nov paka", "Nowogard", "Nowy dwr mazowiecki", "Nowy sacz", "Nowy targ", "Noyabrsk", "Nsukka", "Nueva rosita", "Nueva san salvador", "Nuevo casas grandes", "Nuevo chimbote district", "Nuevo laredo", "Nugegoda", "Nuitssaintgeorges", "Nukata", "Nulato", "Nules", "Numazu", "Nunawading", "Nuneaton", "Nuneaton and bedworth", "Nuoro", "Nuremberg", "Nus", "Nuth", "Nutley", "Nuuk", "Nyack", "Nyagan", "Nyandoma", "Nyborg", "Nyeri", "Nykping", "Nymburk", "Nynshamn", "Nyon", "Nysa", "Nrsnes", "Nrum", "Nstved", "Na kallikrtia", "Nmes", "Ndingenol", "Nrdlingen", "Nmbrecht", "Nrnberg", "Nrtingen", "O grove", "O milladoiro", "Ofallon", "Oak brook", "Oak creek", "Oak harbor", "Oak lawn", "Oak park", "Oak ridge", "Oakbrook terrace", "Oakdale", "Oakfield", "Oakham", "Oakland", "Oakland charter township", "Oakland park", "Oakton", "Oaktown", "Oakville", "Oakwood", "Oaxaca", "Obdam", "Oberramstadt", "Oberaudorf", "Oberentfelden", "Oberhaching", "Oberhausen", "Oberhofen", "Oberkirch", "Oberlin", "Oberstadion", "Oberthal", "Obertshausen", "Oberursel", "Oberwart", "Oberwolfach", "Obergeri", "Obninsk", "Oborishte", "Ocala", "Ocana", "Occidental", "Occoquan", "Ocean city", "Ocean grove", "Ocean springs", "Ocean view", "Oceanport", "Oceanside", "Oconomowoc", "Ocotln", "Odda", "Odenas", "Odense", "Odenton", "Oderzo", "Odesa", "Odessa", "Odiham", "Odiongan", "Odivelas", "Odorheiu secuiesc", "Odou", "Odum", "Odaci", "Oebisfelde", "Oegstgeest", "Oeiras", "Oelde", "Oelsnitz", "Oererkenschwick", "Offenbach", "Offenburg", "Offne", "Ofunato", "Ogaki", "Ogawa", "Ogden", "Ogmore vale", "Ogjares", "Ohrid", "Oieregi", "Oisterwijk", "Ojai", "Okayama", "Okazaki", "Okazakishi", "Okinawa", "Oklahoma city", "Okondo", "Okotoks", "Olathe", "Olbia", "Old", "Old bridge township", "Old colwyn", "Old town", "Old westbury", "Oldenburg", "Oldenzaal", "Oldenzijl", "Oldham", "Oldsmar", "Olean", "Oleiros", "Olen", "Olesa de montserrat", "Olesnica", "Olesno", "Olgiate molgora", "Olinda", "Olite", "Olive branch", "Oliveira do hospital", "Olivet", "Olivette", "Olivos", "Olkusz", "Olla", "Ollioules", "Olm", "Olney", "Olomouc", "Olongapo", "Olonnesurmer", "Olot", "Olpe", "Olst", "Olsztyn", "Olten", "Olympia", "Omaha", "Omi", "Ommen", "Omsk", "Onalaska", "Onarga", "Onda", "Ondres", "Oneida", "Onsala", "Ontario", "Ontinyent", "Oochi county", "Ooij", "Oostvlaanderen", "Oosterbeek", "Oosterhout", "Oosterwolde", "Oostkamp", "Ooty", "Opava", "Opfikon", "Opole", "Oppdal", "Oppenheim", "Oppenhuizen", "Or yehuda", "Ora banda", "Oradea", "Oradell", "Oral", "Oran", "Orange", "Orange city", "Orange park", "Orangeburg", "Orangevale", "Oranienburg", "Oranmore", "Orbe", "Orbey", "Orchard park", "Ordizia", "Ordos", "Oreana", "Oregon", "Oregon city", "Orekhovozuevo", "Oreland", "Orem", "Orenburg", "Orford", "Orihuela", "Orillia", "Orinda", "Orizaba", "Orlando", "Orleans", "Orlinda", "Orlov", "Orly", "Orlndia", "Orlans", "Ormiston", "Ormond beach", "Ormskirk", "Orono", "Oronogo", "Oronoko charter township", "Oropioi", "Oroville", "Orpington", "Orsay", "Orsk", "Orta di atella", "Orting", "Oruro", "Orwell", "Oryol", "Osaka", "Osansi", "Osasco", "Osbourn", "Osby", "Osceola mills", "Osh", "Oshawa", "Oshkosh", "Osiecznica", "Osijek", "Osimo", "Oskaloosa", "Oskarshamn", "Oslavany", "Oslip", "Oslo", "Osmaniye", "Osnabrck", "Osny", "Osogbo", "Osorno", "Osprey", "Oss", "Ossett", "Ossingen", "Ossining", "Ostend", "Osterholzscharmbeck", "Ostheim", "Ostrava", "Ostroda", "Ostrogozhsk", "Ostroh", "Ostrovo", "Ostrow wielkopolski", "Ostrzeszow", "Oswego", "Oswiecim", "Ota", "Otaru", "Otarushi", "Otava", "Othery", "Othmarsingen", "Otis", "Otley", "Otsu", "Ottapalam", "Ottawa", "Otterville", "Ottery saint mary", "Ottignieslouvainlaneuve", "Ottobrunn", "Ouagadougou", "Oudbeijerland", "Oudturnhout", "Oude pekela", "Oudetonge", "Oudenaarde", "Oujda ", "Oulu", "Ouray", "Ourense", "Ourinhos", "Ouro preto", "Oustmarest", "Ovar", "Over", "Overdinkel", "Overland park", "Overpelt", "Overseal", "Overstrand local municipality", "Overveen", "Ovett", "Oviedo", "Oviedo  uviu", "Owariasahi", "Owasso", "Owatonna", "Owego", "Owen sound", "Owensboro", "Owings mills", "Owosso", "Oxford", "Oxford township", "Oxnard", "Oyeplage", "Oymyakon", "Ozark", "Paarl", "Pabianice", "Pace", "Pachino", "Pachuca", "Pacific", "Pacific grove", "Pacifica", "Pacitan", "Padang", "Paderborn", "Paderno dugnano", "Padova", "Padua", "Paducah", "Padukka", "Pagani", "Pagosa springs", "Pahrump", "Paia", "Paidha", "Paimio", "Painesville", "Paintsville", "Paisley", "Paiandu", "Pak kret", "Pakse", "Palafrugell", "Palaiseau", "Palakkad", "Palampur", "Palangkaraya", "Palatine", "Palatka", "Palavaslesflots", "Palekh", "Palembang", "Palencia", "Palermo", "Palet", "Palhoa", "Palisade", "Palisades", "Palisades park", "Palm bay", "Palm beach", "Palm beach gardens", "Palm city", "Palm coast", "Palm desert", "Palm harbor", "Palm springs", "Palma", "Palmas", "Palmdale", "Palmela", "Palmerston", "Palmerston north", "Palmetto", "Palmetto bay", "Palmira", "Palmyra", "Palo", "Palo alto", "Palos park", "Palotina", "Palra", "Palu", "Palwal", "Pamplico", "Pamplona", "Panadura", "Panaji", "Panama", "Panama city", "Panama city beach", "Panambi", "Pancevo", "Panchkula", "Panevys", "Pantelleria", "Pantin", "Pantnagar", "Paoli", "Paonia", "Pap", "Papeete", "Papenburg", "Papendrecht", "Paphos", "Papillion", "Paracambi", "Paracatu", "Paracin", "Paracuru", "Paradise", "Paradise valley", "Paradiso", "Paradox", "Paragould", "Paraguau paulista", "Paramaribo", "Paramus", "Paranava", "Parangipettai", "Parauapebas", "Parazinho", "Paraso", "Paraaque", "Pardubice", "Parede", "Parelhas", "Pargas", "Parignsurbraye", "Paris", "Park city", "Park hills", "Parker", "Parkersburg", "Parkland", "Parkstein", "Parksville", "Parkville", "Parla", "Parma", "Parnamirim", "Parnaba", "Parramatta", "Parrish", "Parroquia 23 de enero", "Parroquia agua salada", "Parroquia barrancas", "Parroquia caraballeda", "Parroquia el paraiso", "Parroquia el recreo", "Parroquia guayaquil", "Parroquia la libertad", "Parroquia san antonio de los altos", "Parroquia santo domingo de los colorados", "Parroquia universidad", "Parsippanytroy hills", "Pasadena", "Pasaia", "Pasay", "Pasching", "Pasco", "Pasig", "Paso de los libres", "Paso robles", "Pass christian", "Passage west", "Passau", "Passo fundo", "Pasto", "Pasuruan", "Patan", "Pataskala", "Patchogue", "Paterno", "Paterson", "Pathanamthitta", "Pathanapuram", "Pathankot", "Pati subdistrict", "Patiala", "Patna", "Pato branco", "Patones", "Patong", "Patos", "Patos de minas", "Patras", "Pattaya", "Pattoki", "Pau", "Pau dos ferros", "Paulista", "Paullo", "Paulo afonso", "Paulsboro", "Paulnia", "Pauri", "Paverama", "Pavia", "Pavlodar", "Pavlovo", "Paw paw", "Pawling", "Pawnee", "Pawtucket", "Payerne", "Paysand", "Payson", "Payyanur", "Pazin", "Paos de ferreira", "Paovice", "Peabody", "Peachland", "Peachtree city", "Peachtree corners", "Pearcy", "Pearl city", "Pearl river", "Pearland", "Pecos", "Pedreira", "Pedro leopoldo", "Peebles", "Peekskill", "Pego", "Peine", "Peixoto de azevedo", "Pekalongan", "Pekanbaru", "Pekin", "Pelham", "Pella", "Pelotas", "Pemalang", "Pematangsiantar", "Pemberton township", "Pembroke", "Pembroke pines", "Penarth", "Pendleton", "Penha", "Penha de frana", "Penicuik", "Pennesires", "Pennington", "Pennsauken township", "Penrith", "Pensacola", "Penticton", "Pentwater", "Penza", "Penzance", "Penzberg", "Penpolis", "Peoria", "Pepperell", "Peradeniya", "Perafita", "Peredelkino", "Pereira", "Pereiro", "Pereslavlzalessky", "Pergamino", "Peridot", "Peristeri", "Perkasie", "Perlin", "Perm", "Pernik", "Perobal", "Perpignan", "Perris", "Perrosguirec", "Perry", "Perrysburg", "Persia", "Perth", "Peru", "Perugia", "Peruwelz", "Pervomaisk", "Pervomayskoye", "Pervouralsk", "Pesaro", "Pescadero", "Pescara", "Peshawar", "Pessac", "Pesse", "Petah tikva", "Petal", "Petaling jaya", "Petaluma", "Peterborough", "Petergof", "Petersburg", "Petersfield", "Petersham", "Petershausen", "Petoskey", "Petrer", "Petrijevci", "Petrolina", "Petropavlovskkamchatskiy", "Petropavlovskkamchatsky", "Petrovac", "Petrozavodsk", "Petroani", "Petrpolis", "Pettistree", "Pettisville", "Pewaukee", "Pewsey", "Pezinok", "Peafiel", "Pfaffenhofen an der ilm", "Pflugerville", "Pforzheim", "Pfungstadt", "Pfffikon", "Phagwara", "Pharr", "Phildirt inc", "Philadelphia", "Philip", "Philipsburg", "Phillipsburg", "Philmont", "Philomath", "Phitsanulok", "Phnom penh", "Pho", "Phoenix", "Phoenixville", "Phuket town", "Piacenza", "Piara waters", "Piatra neam", "Picayune", "Pickering", "Pico rivera", "Picos", "Piedrabuena", "Piera", "Pierre", "Pietermaritzburg", "Pietrasanta", "Pietravairano", "Pietrebianche", "Pieve ligure", "Pieany", "Pignan", "Pijnacker", "Pijnackernootdorp", "Pijpelheide", "Pikeville", "Pila", "Pilani", "Pilar", "Piles", "Piliscsaba", "Pilot", "Pilsen", "Pimprichinchwad", "Pinamar", "Pinar del rio", "Pinckneyville", "Pindamonhangaba", "Pine bluff", "Pine hill", "Pine lake", "Pine mountain club", "Pine river", "Pinehurst", "Piney view", "Pingding", "Pinhais", "Pinheiros", "Pink hill", "Pinneberg", "Pinole", "Pinson", "Pinxton", "Piossasco", "Piotrkw trybunalski", "Piove di sacco", "Piracicaba", "Piraeus", "Piran", "Pirapora", "Piraquara", "Piravom", "Pirdop", "Pireas", "Piripiri", "Pirk", "Pirkkala", "Pirna", "Pirot", "Pirque", "Pisa", "Piscataway township", "Pisek", "Pismo beach", "Pistoia", "Piter", "Piteti", "Pittem", "Pitts", "Pittsboro", "Pittsburg", "Pittsburgh", "Pittsfield", "Pittsfield charter township", "Pittsford", "Pittston", "Piura", "Pitrain", "Placentia", "Placerville", "Plain city", "Plain dealing", "Plainfield", "Plainsboro township", "Plainview", "Plainville", "Plaisir", "Planegg", "Planes", "Plankstadt", "Plano", "Plant city", "Plantation", "Plasencia", "Platania", "Platja daro", "Platteville", "Plattsburgh", "Plauen", "Plavsk", "Playa del carmen", "Pleasant gap", "Pleasant grove", "Pleasant hill", "Pleasant valley", "Pleasanton", "Plentywood", "Plescop", "Plestinlesgrves", "Plettenberg bay", "Pleven", "Plobannaleclesconil", "Plock", "Ploieti", "Ploubazlanec", "Plovdiv", "Plumas lake", "Plymouth", "Plymouth meeting", "Plze", "Pocatello", "Podgorica", "Podhjska", "Podolsk", "Pohang", "Pohangsi", "Poing", "Point arena", "Point cook", "Point pleasant beach", "Pointenoire", "Poissy", "Poitiers", "Pokhara", "Pola de siero", "Poland", "Poli crysochous", "Police", "Poljana", "Polk city", "Pollachi", "Polling", "Polmont", "Polokwane", "Polokwane local municipality", "Polomolok", "Polotsk", "Polska nowa wie", "Poltava", "Polverigi", "Pomas", "Pomerode", "Pomigliano darco", "Pomona", "Pomorie", "Pompano beach", "Pompton lakes", "Ponca city", "Ponce", "Ponda", "Pondicherry", "Ponferrada", "Ponorogo", "Pontacelles", "Pontsaintmartin", "Ponta delgada", "Ponta grossa", "Pontassieve", "Pontaultcombault", "Pontcharrasurturdine", "Ponte de lima", "Ponte vedra beach", "Ponteareas", "Pontedera", "Pontes e lacerda", "Pontevedra", "Pontiac", "Pontianak", "Pontoise", "Pontpoint", "Pontresina", "Pontypool", "Pontypridd", "Poole", "Pooler", "Poortugaal", "Popayan", "Popayn", "Poplar bluff", "Poplarville", "Poprad", "Poquoson city", "Pordenone", "Pori", "Porirua", "Porlamar", "Pornic", "Pornichet", "Porsgrunn", "Port", "Port alberni", "Port alfred", "Port alsworth", "Port angeles", "Port area", "Port arthur", "Port charlotte", "Port coquitlam", "Port de pollena", "Port elizabeth", "Port hadlockirondale", "Port harcourt", "Port hueneme", "Port huron", "Port jefferson station", "Port levy", "Port lincoln", "Port matilda", "Port moody", "Port of brisbane", "Port of spain", "Port orange", "Port orchard", "Port orford", "Port republic", "Port richey", "Port said", "Port st lucie", "Port sudan", "Port townsend", "Port washington", "Portauprince", "Portauxfranais", "Portvalais", "Porta westfalica", "Portadown", "Portage", "Portage charter township", "Porterville", "Portimo", "Portishead", "Portland", "Porto", "Porto alegre", "Porto de ms", "Porto ferreira", "Porto santo", "Porto seguro", "Porto velho", "Portovecchio", "Portoferraio", "Portola", "Portola valley", "Portrush", "Portsmouth", "Portugalete", "Porvoo", "Posadas", "Post falls", "Postojna", "Potchefstroom", "Poteau", "Potenza", "Poti", "Potomac", "Potomac falls", "Potos", "Potsdam", "Pottsgrove", "Pottsville", "Pottuvil", "Poughkeepsie", "Poughquag", "Pouillylemonial", "Poulsbo", "Pourrires", "Pouso alegre", "Poussan", "Povo", "Povoa de varzim", "Poway", "Powdersville", "Powell", "Poynings", "Poynton", "Poza rica", "Poza rica de hidalgo", "Pozna", "Pozuelo de alarcn", "Pozzuoli", "Poos de caldas", "Pradines", "Prague", "Prahran", "Praia", "Praia de mira", "Praia grande", "Prairie du sac", "Prairie grove", "Prairie view", "Prairie village", "Prangins", "Prato", "Pratteln", "Prattville", "Premi de mar", "Premsttten", "Prerov", "Prescott", "Prescott valley", "Presidente kennedy", "Presidente mdici", "Presidente olegrio", "Presidente prudente", "Presque isle", "Prestea", "Preston", "Prestwick", "Pretoria", "Preveza", "Preov", "Price", "Priego de crdoba", "Prievidza", "Prilep", "Prince george", "Princeton", "Pringy", "Prior lake", "Pristine", "Prizren", "Probolinggo", "Prokopyevsk", "Prospect heights", "Prosper", "Prostjov", "Protvino", "Providence", "Providencia", "Provincetown", "Provins", "Provo", "Pruszcz gdaski", "Przywidz", "Prvessinmons", "Pskov", "Pszczyna", "Ptuj", "Pucallpa", "Puchheim", "Puchong", "Puck", "Pucn", "Pudahuel", "Pudisoo", "Puebla", "Pueblo", "Puente genil", "Puerto galera", "Puerto iguaz", "Puerto la cruz", "Puerto madryn", "Puerto montt", "Puerto morelos", "Puerto ordaz", "Puerto plata", "Puerto princesa", "Puerto real", "Puerto vallarta", "Puertollano", "Pula", "Pulaski", "Pulau pinang", "Pulborough", "Pullach", "Pullman", "Pully", "Pulsnitz", "Punaauia", "Puncak alam", "Pune", "Puno", "Punta arenas", "Punta del hidalgo", "Punta gorda", "Punta lara", "Puntallana", "Puntarenas", "Punto fijo", "Purbalingga", "Purcellville", "Purkersdorf", "Purmerend", "Purulia", "Purwakarta", "Purwokerto", "Pushchino", "Pushkar", "Pushkino", "Putalibazar", "Puteaux", "Putian", "Putrajaya", "Puttaparthi", "Putten", "Puttur", "Puurs", "Puyallup", "Puyo", "Pyatigorsk", "Pyongyang", "Pyrzyce", "Pty", "Prnu", "Pcs", "Plissanne", "Prigueux", "Qabqa", "Qaen", "Qarshi", "Qazvin", "Qena", "Qingdao", "Qingdao shi", "Qingyuan", "Qinhuangdao", "Qiqihar", "Qiryat ono", "Qom", "Quakertown", "Qualicum beach", "Quanzhou", "Quarryville", "Quatre bornes", "Queanbeyan", "Quebec", "Quebec city", "Quedlinburg", "Queen creek", "Queens", "Queensbury", "Queenstown", "Querceta", "Quertaro", "Quesada", "Quetta", "Quetzaltenango", "Quevedo", "Quevedos", "Quezon", "Quezon city", "Qufu", "Quibd", "Quiberon", "Quickborn", "Quilicura", "Quilmes", "Quilpue", "Quimper", "Quincy", "Quinlan", "Quintfonsegrives", "Quintana de la serena", "Quirinpolis", "Quirnbach", "Quito", "Quixad", "Qujing", "Qujing shi", "Qung ngi", "Raanana", "Raahe", "Raalte", "Raamsdonksveer", "Raanana", "Rab", "Rabat", "Rabenstein an der pielach", "Raccoon", "Raciborz", "Racine", "Radcliff", "Radebeul", "Radevormwald", "Radford city", "Radhamohanpur", "Radkersburg", "Radnor", "Radnor township", "Radolfzell", "Radom", "Radostowice", "Radovljica", "Radzionkw", "Rafard", "Raglan", "Ragusa", "Rahden", "Rahway", "Rain", "Rainbow city", "Rainford", "Rainham", "Raipur", "Rajahmundry", "Rajapalaiyam", "Rajkot", "Rajpura", "Rajshahi", "Rakova bara", "Rakvere", "Raleigh", "Ralston", "Ramachandrapuram", "Ramat gan", "Rambouillet", "Ramenskoye", "Ramillies", "Ramona", "Ramos arizpe", "Ramos mejia", "Ramos meja", "Ramosch", "Rampur", "Ramsel", "Ramsey", "Ramsgate", "Ramsteinmiesenbach", "Ranaghat", "Rancagua", "Ranchi", "Rancho cordova", "Rancho cucamonga", "Rancho mirage", "Rancho palos verdes", "Rancho santa margarita", "Ranchos palos verdes", "Randburg", "Randers", "Randfontein", "Randolph", "Rangpur", "Ranson", "Ranst", "Ranye", "Raphine", "Rapid city", "Rapperswiljona", "Rasayani", "Rasht", "Raslina", "Rastatt", "Rataje", "Ratan pur", "Rathcoole", "Rathdrum", "Rathenow", "Rathnew", "Ratingen", "Ratnagiri", "Raub", "Rauma", "Rausu", "Ravels", "Raven", "Ravenna", "Ravensburg", "Ravina", "Rawalpindi", "Rawang", "Rawdon", "Rawson", "Ray", "Raymond", "Raymond terrace", "Raymore", "Rayong", "Razam", "Reading", "Readington township", "Recanto das emas", "Rechberghausen", "Recherswil", "Recife", "Recklinghausen", "Recoleta", "Red bank", "Red bluff", "Red cloud", "Red deer", "Red lick", "Red lion", "Red wing", "Reda", "Redcar", "Redding", "Redditch", "Redfield", "Redhill", "Redington shores", "Redlands", "Redmarley dabitot", "Redmond", "Redon", "Redondela", "Redondo beach", "Redruth", "Redwater", "Redwood", "Redwood city", "Reedley", "Reedsburg", "Reepham", "Reeuwijk", "Regensburg", "Reggio di calabria", "Reggio nellemilia", "Regina", "Rehau", "Rehburgloccum", "Rehoboth", "Rehoboth beach", "Rehovot", "Reichenbach", "Reigate", "Reigate and banstead", "Reilingen", "Reims", "Reinbek", "Reinfeld", "Reinhardshagen", "Reinheim", "Reinholds", "Reisterstown", "Reken", "Rekowo grne", "Remchingen", "Remiremont", "Remote", "Remscheid", "Remseck", "Remshalden", "Rende", "Rendsburg", "Renens", "Renfrew", "Rennes", "Renningen", "Reno", "Rensselaer", "Renton", "Renville", "Reog", "Repentigny", "Republic", "Requena", "Reserve", "Reservoir", "Resistencia", "Resko", "Restinga", "Reston", "Retford", "Rethymno", "Retie", "Rettendon common", "Reus", "Reutlingen", "Reutov", "Revda", "Revelstoke", "Revere", "Rexburg", "Rexford", "Reykjavik", "Reykjavk", "Reynosa", "Rez", "Rgbg", "Rhedawiedenbrck", "Rheden", "Rheenendal", "Rheinbreitbach", "Rheine", "Rheineck", "Rheinfelden", "Rheinstetten", "Rhenen", "Rheurdt", "Rhinebeck", "Rhinelander", "Rho", "Rhodes", "Rhoon", "Rhoose", "Rialto", "Riano", "Riaz", "Ribadeo", "Ribble valley", "Ribeira", "Ribeira do pombal", "Ribeira grande", "Ribeiro das neves", "Ribeiro pires", "Ribeiro preto", "Ribnita", "Riccarton", "Riccione", "Richardson", "Richboro", "Richfield", "Richland", "Richland city", "Richland hills", "Richmond", "Richmond hill", "Rickman", "Rickmansworth", "Ridderkerk", "Ridgecrest", "Ridgefield", "Ridgeland", "Ridgewood", "Ridgway", "Ried im innkreis", "Riegel am kaiserstuhl", "Riegelsville", "Riehen", "Rieti", "Riga", "Riihimki", "Rijeka", "Rijen", "Rijkevoort", "Rijmenam", "Rijnsburg", "Rijsbergen", "Rijssen", "Rijswijk", "Rikaze", "Rillaar", "Rillieuxlapape", "Rimini", "Rimouski", "Rincn de soto", "Rindge", "Ringgold", "Ringsted", "Ringwood", "Rinxent", "Rio", "Rio branco", "Rio claro", "Rio das ostras", "Rio de janeiro", "Rio de mouro", "Rio do sul", "Rio grande", "Rio rancho", "Rio tinto", "Rio verde", "Riobamba", "Riohacha", "Riom", "Rionegro", "Ripon", "Risorangis", "Risch", "Rishi valley", "Rishon lezion", "Ritterhude", "Riva del garda", "River edge", "River falls", "River ridge", "River rouge", "Riverbank", "Riverdale park", "Riverside", "Riverton", "Riverview", "Rivesaltes", "Rivne", "Riyadh", "Rizal", "Rize", "Rizhao", "Roanne", "Roanoke", "Robbinsville", "Robert lee", "Roberts", "Robertsbridge", "Robertson", "Robinson", "Rochdale", "Rochelle", "Rochester", "Rochester hills", "Rochlitz", "Rock hill", "Rock island", "Rockaway township", "Rockdale", "Rockford", "Rockland", "Rockledge", "Rocklin", "Rockvale", "Rockville", "Rockwall", "Rockwood", "Rocky mount", "Rocky river", "Rocquencourt", "Roda de ter", "Roden", "Rodez", "Rodmell", "Roeland park", "Roermond", "Roeselare", "Rogers", "Rogliano", "Rognac", "Rognylesseptcluses", "Rogue river", "Rohnert park", "Rohrbach in obersterreich", "Rohtak", "Roissyenbrie", "Rokitnica", "Rokkasho", "Rokua", "Rolante", "Roldanillo", "Rolde", "Rolesville", "Rolla", "Rolleston", "Rolling meadows", "Rolndia", "Roma", "Romainville", "Romakloster", "Romano di lombardia", "Romanssurisre", "Romanshorn", "Rombas", "Rome", "Romeo", "Romeoville", "Romford", "Romsey", "Romulus", "Ronchin", "Rondonopolis", "Ronkonkoma", "Ronneby", "Ronnenberg", "Roodepoort", "Roorkee", "Roosdaal", "Roosendaal", "Root", "Roquecor", "Roquesrire", "Roquevaire", "Rosario", "Rosario de lerma", "Rosarito", "Roscoe", "Roscoff", "Roseau", "Roseland", "Roselle", "Roselle park", "Rosemont", "Rosemount", "Rosenheim", "Roses", "Roseville", "Roskilde", "Rosmalen", "Rosnysousbois", "Rossano", "Rossendale", "Rostock", "Rostovondon", "Roswell", "Rota", "Rothenburg ob der tauber", "Rotherham", "Rotorua", "Rotselaar", "Rotterdam", "Roubaix", "Roudnice nad labem", "Rouen", "Rouhling", "Round lake beach", "Round rock", "Rourkela", "Rousset", "Rouveen", "Rouynnoranda", "Rouzde", "Rovaniemi", "Rover", "Roverchiara", "Roveredo", "Rovereto", "Rovigo", "Rowland heights", "Rowlands castle", "Rowlett", "Rowley", "Roxas city", "Roxboro", "Roy", "Royal leamington spa", "Royal oak", "Royal palm beach", "Royal tunbridge wells", "Royston", "Rozenburg", "Roztoky", "Ruardean", "Rubano", "Rubiera", "Rubigen", "Rubtsovsk", "Rub", "Rucphen", "Ruda lska", "Rudniki", "Rudny", "Rudraram", "Rueilmalmaison", "Rugby", "Ruislip", "Ruma municipality", "Rumelifeneri", "Rumia", "Rumilly", "Rumney", "Runcorn", "Runnells", "Runnymede", "Rupnagar", "Rupperswil", "Ruse", "Rush", "Russellville", "Russia", "Rust", "Ruston", "Ruswil", "Ruther glen", "Rutherford", "Ruthin", "Rw 01", "Rw 04", "Rw 08", "Rw 14", "Ryazan", "Rybinsk", "Rybnik", "Ryde", "Rydebck", "Rye", "Rye brook", "Rynkeby", "Rypin", "Rzeszow", "Rzeszw", "Rzhyshchiv", "Rbade", "Rgama", "Rmnicu vlcea", "Rn", "Ro cuarto", "Ro gallegos", "Ro piedras", "Ryken", "Rderswil", "Rti", "Rzekne", "Rga", "Rch gi", "Sa kaeo", "Sa pobla", "Sa viletason rapinya", "Saanichton", "Saarbrcken", "Saarlouis", "Saarwellingen", "Saas fee", "Sabac", "Sabadell", "Sabaneta", "Sabar", "Sabattus", "Sabzevar", "Sackets harbor", "Sackville", "Saclay", "Saco", "Sacramento", "Safety harbor", "Saffron walden", "Safwa", "Sag harbor", "Sagamihara", "Saginaw", "Saguenay", "Saguntosagunt", "Sagy", "Saharanpur", "Sahibzada ajit singh nagar", "Sahuarita", "Sahuayo", "Saihaku county", "Sailing", "Sainbu", "Saincaizemeauce", "Saint albans", "Saint andrews", "Saint augustine", "Saint augustine beach", "Saint austell", "Saint bonaventure", "Saint catharines", "Saint charles", "Saint cloud", "Saint francis bay", "Saint gallen", "Saint george", "Saint helens", "Saint helier", "Saint ives", "Saint john", "Saint johns", "Saint joseph", "Saint julians", "Saint leonard", "Saint leonards", "Saint louis", "Saint lucia", "Saint marys", "Saint neots", "Saint ouen", "Saint paul", "Saint peters", "Saint petersburg", "Saint simons island", "Saint stephen", "Saint thomas", "Saintamandleseaux", "Saintandrdecubzac", "Saintandrlesvergers", "Saintandrlezlille", "Saintantonindelacalm", "Saintavertin", "Saintbaudilleetpipet", "Saintbrieuc", "Saintcharlessurrichelieu", "Saintcloud", "Saintclmentlesplaces", "Saintcyrlcole", "Saintcyrsurmer", "Saintdenis", "Saintdidiersurchalaronne", "Saintdidesvosges", "Saintestve", "Sainteustache", "Saintgermainenlaye", "Saintgervaislesbains", "Saintgoazec", "Saintgrgoire", "Saintguilhemledsert", "Saintherblain", "Sainthilairedeloulay", "Saintisidoredeclifton", "Saintjacquesenvalgodemard", "Saintjeandebraye", "Saintjeandudoigt", "Saintjeansurrichelieu", "Saintjustmalmont", "Saintjustsaintrambert", "Saintlaurentblangy", "Saintlaurentdebrvedent", "Saintleudesserent", "Saintlinlaurentides", "Saintlouis", "Saintl", "Saintmartial", "Saintmartindhres", "Saintmartinencampagne", "Saintmartinleseaux", "Saintmathieudetrviers", "Saintmichelsurorge", "Saintnazaire", "Saintnomlabretche", "Saintomer", "Saintouen", "Saintpauldevarax", "Saintpaulin", "Saintpie", "Saintpierreduperray", "Saintpray", "Saintquayportrieux", "Saintquentin", "Saintraphal", "Saintrochdelachigan", "Saintrmydeprovence", "Saintsauveur", "Saintsavournin", "Saintseurinsurlisle", "Saintsbastiensurloire", "Saintviaud", "Sainttienne", "Sainteannedeslacs", "Sainteccile", "Saintegenevivedesbois", "Saintemarieauxmines", "Saintemarthesurlelac", "Saintevictoiredesorel", "Saintes", "Saipan", "Saitama", "Sakarya", "Sakura", "Sakyo ward", "Sakyku", "Sala", "Sala consilina", "Salaberrydevalleyfield", "Saladas", "Salamanca", "Salamina", "Salatiga", "Salceda de caselas", "Saldanha bay local municipality", "Sale", "Salem", "Salerno", "Sales oliveira", "Salford", "Salida", "Salihorsk", "Salina", "Salinas", "Saline", "Salisbury", "Salka", "Sallanches", "Sallisaw", "Salmiya", "Salmon arm", "Salo", "Salondeprovence", "Salou", "Salsomaggiore terme", "Salt", "Salt lake city", "Salt point", "Salta", "Saltash", "Saltillo", "Saltney ferry", "Salto", "Salto grande", "Saltsburg", "Saltsjbaden", "Salvador", "Salvador do sul", "Salvan", "Salz", "Salzburg", "Salzgitter", "Salzwedel", "Samara", "Samarinda", "Samarinda city", "Samarkand", "Sambalpur", "Samborondon", "Sammamish", "Samoa", "Samobor", "Samoissurseine", "Sampaloc", "Samsara", "Samsun", "Samut prakan", "Samut sakhon", "San agustn del guadalix", "San angelo", "San antonio", "San antonio buenavista", "San antonio de areco", "San antonio del tchira", "San benedetto del tronto", "San benito", "San bernardino", "San bernardo", "San bruno", "San carlos", "San carlos de bariloche", "San cesareo", "San clemente", "San cristobal", "San cristobal de la laguna", "San cristbal", "San cristbal de la laguna santa cruz de tenerife", "San cristbal de las casas", "San diego", "San dimas", "San don di piave", "San felipe", "San fernando", "San fernando city", "San fernando de henares", "San fernando del valle de catamarca", "San fior", "San francisco", "San gabriel", "San gaspar tlahuelilpan", "San gennaro vesuviano", "San gil", "San giorgio canavese", "San giovanni in persiceto", "San giovanni lupatoto", "San giovanni valdarno", "San giuliano milanese", "San gwann", "San isidro", "San jacinto", "San jose", "San jose de guanipa", "San jose del monte", "San jos", "San jos del cabo", "San juan", "San juan capistrano", "San juan de los morros", "San juan del ro", "San justo", "San lazzaro di savena", "San leandro", "San lorenzo", "San lorenzo almecatla", "San luis", "San luis obispo", "San luis potosi", "San luis potos", "San luis rio colorado", "San luis talpa", "San marcos", "San martn", "San martn de los andes", "San mateo", "San mateo ixtatn", "San michele", "San michele alladige", "San miguel", "San miguel de allende", "San miguel de tucuman", "San miguel de tucumn", "San miniato", "San nicola la strada", "San nicols de los arroyos", "San nicols de los garza", "San pablo", "San pedro", "San pedro garza garca", "San pedro sula", "San pellegrino terme", "San piero a grado", "San rafael", "San ramon", "San salvador", "San salvador de jujuy", "San sebastin", "San sebastin de los reyes", "San tan valley", "San vicente", "Sanpdro", "Sanaa", "Sanandaj", "Sanarysurmer", "Sanborn", "Sancoale", "Sanctuary", "Sand", "Sanda", "Sandane", "Sandbach", "Sande", "Sandefjord", "Sandhurst", "Sandisfield", "Sandl", "Sandnes", "Sandown", "Sandpoint", "Sandstone", "Sandton", "Sandusky", "Sandvika", "Sandviken", "Sandy", "Sandy bay", "Sandy hook", "Sandy springs", "Sanford", "Sangli", "Sangrur", "Sanjo", "Sankt augustin", "Sankt gallen", "Sankt leonrot", "Sankt plten", "Sankt veit an der glan", "Sankt wendel", "Sanktpeterburg", "Sanlcar de barrameda", "Sanming", "Sannois", "Sanok", "Sant boi de llobregat", "Sant cugat del valls", "Sant feliu de codines", "Sant feliu de llobregat", "Sant iscle de vallalta", "Sant joan dalacant", "Sant joan desp", "Sant just desvern", "Sant lloren savall", "Sant sadurn danoia", "Sant vicent del raspeig", "Sant vicen dels horts", "Santa ana", "Santa barbara", "Santa brbara doeste", "Santa clara", "Santa clara del mar", "Santa clarita", "Santa coloma de gramenet", "Santa coloma de queralt", "Santa cruz", "Santa cruz cabrlia", "Santa cruz de de tenerife", "Santa cruz de la sierra", "Santa cruz de mara", "Santa cruz de tenerife", "Santa cruz do rio pardo", "Santa cruz do sul", "Santa fe", "Santa f", "Santa f do sul", "Santa luzia", "Santa maria", "Santa maria capua vetere", "Santa maria da feira", "Santa maria de campos", "Santa maria del cam", "Santa marta", "Santa mesa", "Santa monica", "Santa pola", "Santa rita", "Santa rita do passa quatro", "Santa rita do sapuca", "Santa rosa", "Santa rosa beach", "Santa rosa de lima", "Santa rosa de mzquiz", "Santa rosala", "Santa tecla", "Santa venera", "Santana do ipanema", "Santana do livramento", "Santander", "Santaquin", "Santarem", "Santarm", "Santee", "Santeramo in colle", "Santiago", "Santiago de compostela", "Santiago de compostela a corua", "Santiago de cuba", "Santiago de los caballeros", "Santiago de quertaro", "Santiago de surco", "Santiago de veraguas", "Santiago do cacm", "Santo amaro", "Santo andr", "Santo antnio da patrulha", "Santo antnio da platina", "Santo antnio de pdua", "Santo augusto", "Santo domingo", "Santo domingo este", "Santo estvo", "Santo tirso", "Santos", "Santpedor", "Sanxenxo", "Sanya", "Sana", "Sapiranga", "Sapporo", "Sapucaia do sul", "Sarajevo", "Saranac", "Saranac lake", "Sarandi", "Saransk", "Sarapul", "Sarasota", "Saratoga", "Saratoga springs", "Saratov", "Sarcelles", "Sardroud", "Sari", "Sarisha", "Sarnia", "Sarny", "Saronno", "Sarov", "Sarpsborg", "Sarroca de lleida", "Sartell", "Sartrouville", "Sarzana", "Saseboshi", "Saskatoon", "Sassari", "Sassenheim", "Sassuolo", "Sastamala", "Satellite beach", "Satsuma", "Saudi", "Saugeen shores", "Saugerties", "Saugus", "Sault ste marie", "Saumur", "Sausalito", "Saussetlespins", "Sautron", "Savage", "Savannah", "Savar", "Savigliano", "Savignano sul rubicone", "Savignysurorge", "Savignysurseille", "Savise", "Savona", "Savoy", "Sawantwadi", "Sawbridgeworth", "Sawston", "Saylorsburg", "Sayre", "Scaldasole", "Scappoose", "Scarborough", "Scarsdale", "Sceaux", "Schaafheim", "Schaffhausen", "Schagen", "Schaumburg", "Schenectady", "Schenefeld", "Schermbeck", "Schertz", "Schiedam", "Schiffdorf", "Schifflange", "Schijndel", "Schiltberg", "Schiltigheim", "Schinias", "Schio", "Schiphol", "Schipholrijk", "Schipluiden", "Schirrhein", "Schkeuditz", "Schladming", "Schlangen", "Schleusegrund", "Schlieren", "Schlins", "Schlo holtestukenbrock", "Schluchsee", "Schmalkalden", "Schmitten", "Schneverdingen", "Schofield", "Scholes", "Schondorf", "Schoonebeek", "Schoonhoven", "Schoonoord", "Schoten", "Schrobenhausen", "Schroeder", "Schulzendorf", "Schwabach", "Schwabmnchen", "Schwaikheim", "Schwalbach am taunus", "Schwalmtal", "Schwanau", "Schwanewede", "Schwanstetten", "Schwarzenbek", "Schweinfurt", "Schwelm", "Schwerin", "Schwerte", "Schwetzingen", "Schwielowsee", "Schwindratzheim", "Schwbisch hall", "Schrding", "Schnefeld", "Scituate", "Scotch plains", "Scotia", "Scotland", "Scott air force base", "Scotts valley", "Scottsboro", "Scottsburg", "Scottsdale", "Scranton", "Scunthorpe", "Seabeck", "Seabrook", "Seabrook island", "Seaford", "Seagrove beach", "Seaham", "Seal beach", "Searcy", "Seascale", "Seaside", "Seattle", "Seaview", "Sebastian", "Sebastopol", "Sebourg", "Secaucus", "Sechelt", "Seclin", "Secunda", "Secunderabad", "Seddiner see", "Sedillo", "Sedlecprice", "Sedona", "Seefeld", "Seevetal", "Seffner", "Segamat district", "Segovia", "Seillonssourcedargens", "Seinjoki", "Seixal", "Sekonditakoradi", "Selby", "Selden", "Selfkant", "Seligenstadt", "Selinsgrove", "Sellersburg", "Sellersville", "Selma", "Selmer", "Semaphore", "Semarang", "Semenyih", "Seminole", "Semnan", "Senai", "Senboku district", "Sendai", "Senec", "Senftenberg", "Senigallia", "Senoia", "Senta", "Seongnam", "Seongnamsi", "Seosan", "Seoul", "Septiles", "Septmeslesvallons", "Sequim", "Serafina corra", "Seraing", "Serang", "Seregno", "Seremban", "Sergiev posad", "Seri kembangan", "Seria", "Seriate", "Serooskerke", "Seropdica", "Serpukhov", "Serra", "Serra negra", "Serra negra do norte", "Serra talhada", "Serramanna", "Serrekunda", "Serres", "Serressurarget", "Serrig", "Sertolovo", "Sesimbra", "Sesser", "Sesto calende", "Sesto san giovanni", "Sestri levante", "Sestu", "Sesvete", "Setagaya", "Setagayaku", "Setauket east setauket", "Sete lagoas", "Settat ", "Setbal municipality", "Sevastopol", "Seven hills", "Sevenans", "Sevenoaks", "Sevenum", "Severn", "Severna park", "Severnaya griva", "Severodvinsk", "Seversk", "Sevierville", "Sevilla", "Seville", "Sewanee", "Seymour", "Seynod", "Sfntu gheorghe", "Sfntugheorghe  sepsiszentgyrgy", "Shady cove", "Shady shores", "Shah alam", "Shahdol", "Shahe", "Shahrud", "Shaker heights", "Shakhty", "Shakopee", "Shallotte", "Sham shui po district", "Shambala", "Shanghai", "Shannan diqu", "Shannon", "Shantou", "Shaoguan", "Shaowu", "Shaoxing", "Shaoxing shi", "Shaoyang", "Shapleigh", "Shaqra", "Shariatpur", "Sharjah", "Sharon", "Sharonville", "Sharpsburg", "Shasta lake", "Shawinigan", "Shawnee", "Sheboygan", "Sheffield", "Sheikh zayed city", "Shelburne", "Shelburne falls", "Shelby", "Shelbyville", "Shell", "Shell cove", "Shelton", "Shenandoah", "Shenley", "Shenyang", "Shenyang shi", "Shenzhen", "Shenzhen shi", "Shepherd", "Shepherdstown", "Shepparton", "Shepperton", "Sheraval kh", "Sherbrooke", "Shere", "Sheridan", "Sherman", "Sherwood", "Sherwood park", "Shibata", "Shibuya", "Shibuyaku", "Shijiazhuang", "Shikaripur", "Shiki district", "Shillong", "Shiloh", "Shimla", "Shimoina", "Shimoda", "Shimogyku", "Shimonosekishi", "Shimotsuma", "Shinagawa", "Shinagawaku", "Shingle springs", "Shinglehouse", "Shingmura", "Shinjuku", "Shinjukuku", "Shiojiri", "Shipley", "Shippensburg", "Shippenville", "Shiraz", "Shiroi", "Shiyan", "Shizuoka", "Shkoder", "Shoham", "Shoranur", "Shorehambysea", "Shoreline", "Shoreview", "Shreveport", "Shrewsbury", "Shu", "Shumen", "Shuozhou", "Shuozhou shi", "Shuswap", "Shut", "Shutesbury", "Shymkent", "Shwaku", "Shshtar", "Sialkot", "Sibiu", "Sibley", "Sibu", "Sidi bel abbes", "Sidi bouzid", "Sidney", "Sidoarjo", "Siechnice", "Siedlce", "Siegburg", "Siegen", "Siegenfeld", "Siena", "Sierning", "Sierra madre", "Sierra vista", "Sierre", "Sievierodonetsk", "Sighioara", "Signal hill", "Signal mountain", "Sigouls", "Sigulda", "Sihanoukville", "Sikasso", "Sikeston", "Silchar", "Silea", "Silent hill", "Siliguri", "Silkeborg", "Silla", "Siloam springs", "Silver creek", "Silver lake", "Silver spring", "Silverdale", "Silverton", "Silvi", "Silvis", "Simcoe", "Simferopol", "Simi valley", "Simmerath", "Simpelveld", "Simpsonville", "Simsbury", "Sinaloa", "Sincelejo", "Sindelfingen", "Singapore", "Singaraja", "Singen", "Singkawang city", "Sinj", "Sinking spring", "Sinop", "Sinsheim", "Sint  katelijne  waver", "Sint jansteen", "Sintgenesiusrode", "Sintmaartensdijk", "Sintmartenslatem", "Sintniklaas", "Sinttruiden", "Sintra", "Sinzig", "Siolim", "Sion", "Sion mills", "Sioux city", "Sioux falls", "Siping", "Sipitang", "Sippy downs", "Siracusa", "Sirone", "Sirsa", "Sison", "Sites", "Sitges", "Sitka", "Sittard", "Sittingbourne", "Sivakasi", "Sivas", "Sixfourslesplages", "Sifok", "Skaftafell", "Skagen", "Skaneateles falls", "Skanee", "Skara", "Skarnes", "Skawina", "Skellefte", "Skene", "Skennars head", "Skepplanda", "Skien", "Skikda", "Skinners", "Skipton", "Skive", "Skjern", "Skoczw", "Skogn", "Skokie", "Skopje", "Skowhegan", "Skudai", "Skudeneshavn", "Skurup", "Skrhamn", "Skvde", "Skdstrup", "Slagelse", "Slater", "Slavgorod", "Slavonski brod", "Slavutych", "Sleepy hollow", "Slek", "Sleman", "Slemmestad", "Slidell", "Sliedrecht", "Sliema", "Sligo", "Slindon common", "Slinger", "Slippery rock", "Sliven", "Slobozia", "Slocan park", "Slough", "Slovyansk", "Sluis", "Slupsk", "Smaland", "Smederevo", "Smicksburg", "Smithfield", "Smithville", "Smolensk", "Smolian", "Smyrna", "Sneek", "Snellville", "Snohomish", "Snoqualmie", "Snowmass village", "Sobradinho", "Sobral", "Sobslav", "Sochaczew", "Sochi", "Socorro", "Soda springs", "Soest", "Sofia", "Sogamoso", "Sogndal", "Sohag", "Soissons", "Soka", "Solana beach", "Solapur", "Solaro", "Soleminis", "Solihull", "Solingen", "Solkan", "Sollebrunn", "Sollenau", "Sollentuna", "Solna", "Solomons", "Solon", "Solothurn", "Solsona", "Solwezi", "Soly", "Somaraidih", "Sombor", "Some", "Someren", "Somerset", "Somersworth", "Somerville", "Somma vesuviana", "Son", "Sondrio", "Sonitpur", "Sonnefeld", "Sonoita", "Sonoma", "Sonora", "Sonsonate", "Sontheim an der brenz", "Soortshossegor", "Sopelana", "Sopot", "Sopron", "Soquel", "Sorachi district", "Sorbas", "Sorel", "Sori", "Soria", "Soroca", "Sorocaba", "Sorong", "Sorriso", "Sosa", "Sosnovoborsk", "Sosnowiec", "Sost", "Souffelweyersheim", "Sound beach", "Souris", "Sousse", "South bend", "South brunswick township", "South burlington", "South el monte", "South elgin", "South fallsburg", "South glens falls", "South hadley", "South haven", "South hill", "South huntington", "South jakarta city", "South jakarta regency", "South jordan", "South kingstown", "South lake tahoe", "South lyon", "South melbourne", "South milford", "South orange", "South pasadena", "South plainfield", "South portland", "South riding", "South river", "South san francisco", "South shields", "South somerset district", "South tangerang city", "South weber", "South windsor", "South woodslee", "Southampton", "Southaven", "Southbank", "Southborough", "Southbury", "Southendonsea", "Southern pines", "Southfield", "Southington", "Southlake", "Southport", "Southwell", "Southwick", "Soyapango", "Soyhires", "Soyo", "Spanaway", "Spangle", "Spanish", "Spanish fork", "Sparks", "Sparta", "Sparta township", "Spartanburg", "Spearfish", "Spelle", "Spencer", "Spencerport", "Spennymoor", "Speyer", "Spicewood", "Spiegelau", "Spiez", "Spijkenisse", "Spindale", "Spinea", "Spirano", "Spirit lake", "Spisk nov ves", "Split", "Spokane", "Spokane valley", "Spotsylvania", "Spragueville", "Spring", "Spring arbor", "Spring green", "Spring hill", "Spring lake", "Spring lake heights", "Spring valley", "Springboro", "Springdale", "Springfield", "Springville", "Springwater", "Springwood", "Spruce grove", "Spruce pine", "Squamish", "Squillace", "Sragen", "Srbac", "Sreemangal", "Sri ganganagar", "Sri jayawardenapura kotte", "Sri jayawardenepura kotte", "Srikakulam", "Srinagar", "St albans", "Stbrunodemontarville", "Stgenislaval", "Stjeansr", "Stlaurentduvar", "Stmalo", "St albans", "St albert", "St anthony", "St catharines", "St charles", "St clair", "St clair shores", "St george", "St helens", "St johns", "St joseph", "St laurent", "St louis", "St louis park", "St marys", "St peter", "St peters", "Stabroek", "Stade", "Staden", "Stadskanaal", "Stadtroda", "Staffanstorp", "Stafford", "Stafford township", "Stainesuponthames", "Stakhanov", "Stalowa wola", "Stamboliyski", "Stamford", "Stanford", "Staphorst", "Star", "Stara pazova", "Stara zagora", "Stargard szczecinski", "Stargard szczeciski", "Stari ednik", "Starkville", "Starnberg", "Stary oskol", "State college", "Statesboro", "Statesville", "Statham", "Stathelle", "Staufenberg", "Staunton", "Stavanger", "Stavelot", "Stavki", "Stavropol", "Steamboat springs", "Steedman", "Steenwijk", "Stegersbach", "Steinach im kinzigtal", "Steinbach", "Steinfurt", "Steinhausen", "Steinkjer", "Stekene", "Stellenbosch", "Stellenbosch local municipality", "Stelzenberg", "Stephenson", "Stephenville", "Sterling", "Sterling heights", "Sterlitamak", "Stevenage", "Stevens point", "Stevenson ranch", "Stevensville", "Steyr", "Stiens", "Stillwater", "Stirling", "Stob", "Stockholm", "Stockport", "Stockton", "Stocktonontees", "Stoke gifford", "Stokebynayland", "Stokeontrent", "Stokesdale", "Stollberg", "Stone mountain", "Stoneham", "Stonehaven", "Stonington", "Stony brook", "Stony plain", "Stony stratford", "Stora hga", "Store merlse", "Storm lake", "Stormville", "Stornoway", "Stotfold", "Stourbridge", "Stow", "Stowe", "Stowmarket", "Stralsund", "Strandby", "Strangways", "Stranice", "Strasbourg", "Strassen", "Stratford", "Stratforduponavon", "Stratham", "Strathmore", "Strathroy", "Straubing", "Strawberry", "Strawalchen", "Streetsboro", "Stregna", "Strijen", "Strong city", "Strongsville", "Stroud", "Stroudsburg", "Struer", "Struga", "Strumica", "Strske", "Strngns", "Strmstad", "Stuart", "Studzionka", "Stupino", "Stuttgart", "Stvring", "Suamico", "Subang", "Subang jaya", "Subotica", "Suceava", "Sucha beskidzka", "Sucre", "Sucyenbrie", "Sudbury", "Suffern", "Suffield", "Suffolk", "Sugar creek", "Sugar grove", "Sugar hill", "Sugar land", "Sugar valley", "Sugarcreek", "Suginami", "Suginamiku", "Suhr", "Suitashi", "Sukabumi", "Sukadana", "Sukkur", "Sukoharjo", "Sulaymaniyah", "Suldal", "Sulingen", "Sulphur", "Sultanpur", "Suluova", "Sulzbach", "Sumar", "Sumedang", "Sumgayit", "Sumida", "Sumidaku", "Sumiyoshiku", "Summerfield", "Summerland", "Summerland key", "Summerlin south", "Summerside", "Summerville", "Summit", "Summit point", "Sumner", "Sumter", "Sumy", "Sun", "Sun city west", "Sun prairie", "Sun valley", "Sunabeda", "Sunagawa", "Sunbury", "Sunburyonthames", "Sunchales", "Suncheon", "Sundbyberg", "Sunderland", "Sundown", "Sundsvall", "Sungai petani", "Sunland park", "Sunningdale", "Sunny isles beach", "Sunnyside", "Sunnyvale", "Sunrise", "Sunriver", "Sunset hills", "Sunshine coast", "Suomi", "Superior", "Surabaya", "Surabaya city", "Surahammar", "Surakarta", "Surat", "Suratgarh", "Surbiton", "Suresnes", "Surf city", "Surfers paradise", "Surfside", "Surfside beach", "Surgut", "Surgres", "Surprise", "Surrey", "Surry", "Sussex", "Sutomore", "Sutton", "Sutton coldfield", "Suttoninashfield", "Suttons bay", "Suva", "Suwalki", "Suwanee", "Suwaki", "Suwon", "Suzano", "Suzhou", "Suzhou shi", "Svanesund", "Svendborg", "Sverdlovskaya", "Svetlogorsk", "Svishtov", "Svitlovodsk", "Svpravice", "Swale", "Swampscott", "Swanage", "Swanley", "Swannanoa", "Swansea", "Swanton", "Swanzey", "Swarthmore", "Swartz creek", "Swarzdz", "Sweden", "Swedesboro", "Sweet home", "Swellendam", "Swieqi", "Swifterbant", "Swindon", "Swinton", "Swisher", "Syberia", "Sycamore", "Sydney", "Syke", "Sykesville", "Syktyvkar", "Sylhet", "Sylvan lake", "Sylvania", "Syosset", "Syracuse", "Syzran", "Szatymaz", "Szczebrzeszyn", "Szczecin", "Szczecinek", "Szeged", "Szentendre", "Szentes", "Szigethalom", "Szirmabeseny", "Szzhalombatta", "Szkesfehrvr", "Snnicolau mare", "So benedito", "So bento do sul", "So bernardo do campo", "So caetano do sul", "So carlos", "So domingos niteri", "So gotardo", "So joaquim de bicas", "So jos", "So jos do rio preto", "So jos dos campos", "So jos dos pinhais", "So leopoldo", "So loureno", "So loureno do sul", "So lus", "So manuel", "So paulo", "So pedro", "So roque", "So sebastio do ca", "So vicente", "Svres", "Slestat", "Sngera", "Sc trng", "Sderhamn", "Sdra sandby", "Snderborg", "Srumsand", "Sn la", "Ta xbiex", "Taizz", "Taastrup", "Tabanan", "Tabernash", "Tabor", "Taboo da serra", "Tabriz", "Tabuk", "Tachikawa", "Tacloban", "Tacloban city", "Tacna", "Tacoma", "Tadley", "Taganrog", "Tagbilaran", "Tagbilaran city", "Tagish", "Taguig", "Tagum city", "Tahlequah", "Tahoe city", "Taian", "Taian shi", "Taibon", "Taichung city", "Taif", "Tainan city", "Taipa", "Taipei", "Taipei city", "Taito", "Taitku", "Taiyuan", "Taiyuan shi", "Taizhou", "Tajimi", "Takachiho", "Takaoka", "Takasakishi", "Takayama", "Takinoue", "Takoma park", "Talala", "Talarrubias", "Talavera", "Talbot campus", "Talca", "Talcahuano", "Talence", "Talent", "Talesh", "Talisay city", "Tallahassee", "Tallassee", "Tallinn", "Tallmadge", "Tamaku", "Tamale", "Tamanashi", "Tamara", "Tamarac", "Tamarin", "Tambon ban tai", "Tambon chamni", "Tambov", "Tameside", "Tampa", "Tampere", "Tampico", "Tamworth", "Tananger", "Tandil", "Taneytown", "Tangail", "Tangar da serra", "Tangerang", "Tangerang city", "Tangerang selatan", "Tangier", "Tangshan", "Tangu", "Tanjung pinang", "Tanos", "Tanta", "Tanur", "Tanza", "Taos", "Taoyuan city", "Tapachula", "Tapejara", "Taplow", "Taquara", "Taquaritinga do norte", "Taranto", "Tarapoto", "Tarashcha", "Taraz", "Tarbes", "Tarboro", "Tarcento", "Tarcetta", "Taree", "Targovishte", "Tarifa", "Tarija", "Tarlac city", "Tarnovo", "Tarnow", "Tarnowskie gory", "Tarnw", "Tarpon springs", "Tarquinia", "Tarragona", "Tarrytown", "Tartagal", "Tartu", "Tarum", "Tarusa", "Tarvasjoki", "Tarvisio", "Tashkent", "Tasikmalaya", "Tassinlademilune", "Tataouine", "Tatsuno", "Tatu", "Taubat", "Taunton", "Taupo", "Tauranga", "Tavagnacco", "Tavernes de la valldigna", "Taverny", "Tavers", "Tavira", "Tawau", "Taylor", "Taylorsville", "Taytay", "Taza ", "Tbilisi", "Tczew", "Teague", "Teaneck", "Tecumseh", "Teddington", "Tees valley", "Teeswater", "Tega cay", "Tegal", "Tegucigalpa", "Tehachapi", "Tehkummah", "Tehran", "Tehuacn", "Tehuixtla", "Teixeira de freitas", "Tel avivyafo", "Telfer", "Telford", "Telfs", "Telkwa", "Telscombe cliffs", "Teltow", "Tema", "Temara ", "Tembilahan", "Temecula", "Temirtau", "Tempe", "Temperance", "Temperley", "Temple", "Temple hills", "Temuco", "Tenafly", "Tenczynek", "Tennfjord", "Tenno", "Teno", "Teodelina", "Teolo", "Tepic", "Teplice", "Tequila", "Ter aar", "Ter apel", "Teramo", "Teresina", "Terespolis", "Terheijden", "Termoli", "Terneuzen", "Terni", "Ternitz", "Ternopil", "Teronoh", "Terra boa", "Terrace", "Terracina", "Terrassa", "Terre haute", "Terrebonne", "Terroso", "Terrou", "Terschuur", "Teruel", "Tervuren", "Teshio district", "Tessenderlo", "Test valley", "Tetbury", "Tete", "Teton", "Tetouan", "Tetovo", "Teublitz", "Teusaquillo", "Teutnia", "Tewksbury", "Texarkana", "Texcoco", "Texcoco de mora", "Teziutln", "Tezpur", "Tefilo otoni", "Thai ban", "Thailand", "Thalassery", "Thale", "Thalheim", "Thame", "Thane", "Thanesar", "Thanjavur", "Thatcham", "The colony", "The dalles", "The hague", "The lime", "The mumbles", "The valley", "The woodlands", "There", "Thermopolis", "Thessaloniki", "Thessalonki", "Thibodaux", "Thiene", "Thika", "Thimphu", "Thionville", "Thirunindravur", "Thiruvalla", "Thiruvananthapuram", "Thisted", "This", "Thodupuzha", "Thomasville", "Thompson", "Thompsons station", "Thononlesbains", "Thorndale", "Thorner", "Thorntown", "Thouarsurloire", "Thousand oaks", "Three lakes", "Thrissur", "Thun", "Thunder bay", "Thurles", "Thurnby", "Thuwal", "Thyez", "Thi bnh", "Tiana", "Tianjin", "Tibi", "Tibro", "Ticul", "Tidewater", "Tiel", "Tielt", "Tienen", "Tierp", "Tierra verde", "Tigard", "Tigliole", "Tignes", "Tigre", "Tijuana", "Tijucas", "Tikhoretsk", "Tilburg", "Tillamook", "Tilst", "Timbuktu", "Timioara", "Timmins", "Timon", "Timteo", "Tinley park", "Tinton falls", "Tipp city", "Tipton", "Tira", "Tirana", "Tiraspol", "Tiruchirappalli", "Tirunelveli", "Tirupati", "Tiruppur", "Tiruvannamalai", "Tiszacsege", "Titel", "Titusville", "Tiverton", "Tivoli", "Tizayuca", "Tizi ouzou", "Tjele", "Tlacojalpan", "Tlacotalpan", "Tlajomulco de ziga", "Tlaxcala", "Tlaxcalancingo", "Tlemcen", "Toa baja", "Toblach", "Tobolsk", "Tocaima", "Tochigi", "Todd mission", "Toddington", "Todi", "Todmorden", "Tofino", "Toin", "Tok", "Tokai", "Tokha", "Tokorozawa", "Tokushima", "Tokyo", "Tolar", "Toledo", "Toledo city", "Tolentino", "Tolland", "Tollesboro", "Tollo", "Toluca", "Toluca de lerdo", "Tolyatti", "Tomah", "Tomaj", "Tomakomai", "Tomar", "Tomball", "Tomelilla", "Toms river", "Toms river township", "Tomsk", "Tomter", "Tonal", "Tonawanda", "Tonbridge", "Tonekabon", "Tonga", "Tongeren", "Tongling", "Too", "Toowoomba", "Topeka", "Topoany", "Topsham", "Torcy", "Torgiano", "Torhout", "Torino", "Tornio", "Toronto", "Torquay", "Torrance", "Torre del campo", "Torredembarra", "Torredonjimeno", "Torrejn de ardoz", "Torrelavit", "Torremolinos", "Torrent", "Torres", "Torres novas", "Torren", "Torrijos", "Torrington", "Torroella de montgr", "Torrox costa", "Torshlla", "Tortona", "Torun", "Toru", "Toshima", "Totana", "Totnes", "Totsuka ward", "Touba", "Toulon", "Toulonsurallier", "Toulouges", "Toulouse", "Tourcoing", "Tournai", "Tours", "Towcester", "Town of rockingham", "Townsville", "Townville", "Towson", "Toyama", "Toyohashi", "Toyonaka", "Toyota", "Toyota county", "Toyotashi", "Tp hi an", "Tp kon tum", "Tp tn an", "Trabuco canyon", "Trabzon", "Tracy", "Trafford", "Trail", "Tralee", "Trambileno", "Trancoso", "Trang", "Trani", "Transylvania", "Trappe", "Trappes", "Traralgon", "Traverse city", "Treasure island", "Trebbin", "Trebinje", "Trebur", "Trecate", "Tregnago", "Treizeseptiers", "Trelew", "Trelleborg", "Tremblaylesvillages", "Tremestieri etneo", "Tremonton", "Trenggalek", "Trento", "Trenton", "Trenn", "Tres arroyos", "Tres cantos", "Tres de mayo", "Tres rios", "Treviso", "Trevor", "Tricesimo", "Trier", "Triest", "Trieste", "Triggiano", "Trikala", "Trim", "Trimbach", "Trinec", "Tring", "Trinidad", "Trinity", "Tripoli", "Trnava", "Troisrivires", "Troisdorf", "Trollhttan", "Troms", "Trondheim", "Troon", "Trophy club", "Troutdale", "Troutville", "Trowbridge", "Troy", "Troyan", "Troyes", "Trstenik", "Truckee", "Trujillo", "Trujillo alto", "Trumbull", "Truro", "Trutnov", "Trs coroas", "Trs de maio", "Trs lagoas", "Trs rios", "Trice", "Tsuchiura", "Tsugarushi", "Tsukuba", "Tsurumi ward", "Tsuruoka", "Tsuruokashi", "Tsuyama", "Tsuzukiku", "Tualatin", "Tuapse", "Tubaro", "Tuchw", "Tuckahoe", "Tucker", "Tucson", "Tudela", "Tuenno", "Tuguegarao", "Tui", "Tuil", "Tukwila", "Tula", "Tulancingo", "Tulare", "Tulcn", "Tuljapur", "Tullahoma", "Tulln", "Tulsa", "Tulungagung", "Tulu", "Tumakuru", "Tunari", "Tunceli", "Tunica", "Tunis", "Tunja", "Tupi paulista", "Turbotville", "Turcey", "Turenne", "Turin", "Turk", "Turkey", "Turku", "Turmero", "Turnhout", "Turrialba", "Tuscaloosa", "Tuscola", "Tustin", "Tuticorin", "Tuttlingen", "Tutukaka", "Tuusula", "Tuxtla gutirrez", "Tuzla", "Tver", "Twello", "Twentynine palms", "Twin falls", "Twisp", "Twistringen", "Two rivers", "Twyford", "Tx sn ty", "Tx t sn", "Tychy", "Tylden", "Tyler", "Tylertown", "Tyngsborough", "Tyrone", "Tysons corner", "Tyumen", "Tyumen", "Trrega", "Tbua", "Tn bnh", "Trgovite", "Trgu mure", "Ttouan", "Trshavn", "Tnisvorst", "Tnsberg", "Tbingen", "Trkenfeld", "Tganeshi", "Us air force academy", "Ub", "Ubatuba", "Uberaba", "Uberlandia", "Uberlndia", "Ubon ratchathani", "Ubrique", "Ubstadtweiher", "Ubud", "Uccle", "Uckfield", "Udaipur", "Uddevalla", "Uden", "Udine", "Udon thani", "Udupi", "Ueda", "Uedem", "Uelzen", "Uetersen", "Ufa", "Ugly", "Uia", "Uimaharju", "Uitgeest", "Uithuizen", "Ujjain", "Ukhta", "Ukrainsk", "Ulaanbaatar", "Ulanude", "Ulhasnagar", "Ulm", "Ulricehamn", "Ulsan", "Ultimo", "Ulverston", "Ulverton", "Ulyanovsk", "Umag", "Umdloti", "Ume", "Umgeni local municipality", "Umina beach", "Umuarama", "Umvoti local municipality", "Un", "Una", "Ungheni", "Union", "Union city", "Uniontown", "Universal city", "University city", "University park", "Unkel", "Unley", "Unna", "Unterfhring", "Unterhaching", "Unterkulm", "Untermafeld", "Unterschleiheim", "Untervaz", "Untergeri", "Upgantschott", "Upland", "Uplengen", "Upper arlington", "Upper darby", "Upper hutt", "Upper marlboro", "Upper uwchlan township", "Uppingham", "Uppsala", "Upton", "Upwell", "Upwey", "Uralsk", "Uran islampur", "Uranium city", "Urasoe", "Urayasu", "Urayasushi", "Urbana", "Urbandale", "Urbino", "Urdaneta", "Urdaneta city", "Urdorf", "Urk", "Urmar tanda", "Urmia", "Uruapan", "Urumashi", "Urussanga", "Urussu", "Uryu district", "Urzelina", "Urziceni", "Us", "Usha", "Ushuaia", "Usmate velate", "Usolyesibirskoye", "Ussurijsk", "Ustilimsk", "Ustlabinsk", "Ustkamenogorsk", "Usulutn", "Uta", "Utica", "Utiel", "Utrecht", "Utrera", "Utskarpen", "Utsunomiya", "Uvalde", "Uxbridge", "Uyo", "Uza", "Uzhhorod", "Uzice", "Uznach", "Vaals", "Vaasa", "Vaassen", "Vacaville", "Vacoas", "Vacoasphoenix", "Vadakara", "Vadakkencherry", "Vadodara", "Vadstena", "Vaggeryd", "Vagharshapat", "Vail", "Vairano patenora", "Valdor", "Valdecharmey", "Valdereuil", "Valatie", "Valbonne", "Valdagno", "Valdemarsvik", "Valdemorillo", "Valdemoro", "Valdepeas do", "Valdivia", "Valdosta", "Vale", "Vale de cambra", "Valence", "Valencia", "Valenciennes", "Valenzuela", "Valera", "Valhalla", "Valier", "Valinhos", "Valjevo", "Valkeakoski", "Valladolid", "Vallauris", "Vallbona danoia", "Valle azul", "Valle de bravo", "Valle de santiago", "Valle di maddaloni", "Valledupar", "Vallejo", "Vallenar", "Vallendar", "Vallentuna", "Valletta", "Valley center", "Valley city", "Valley cottage", "Valley forge", "Valley park", "Valley stream", "Vallikavu", "Valls", "Valmiera", "Valmontone", "Valparaiso", "Valparaso", "Valparaso de gois", "Valrico", "Valsad", "Valncia", "Van", "Van alstyne", "Van wert", "Vancouver", "Vandalia", "Vandervoort", "Vanduvrelsnancy", "Vang", "Vankleek hill", "Vannes", "Vantaa", "Vanves", "Vapi", "Varanasi", "Varadin", "Varberg", "Varde", "Vardnas", "Varedo", "Varennes", "Varese", "Vargem grande do sul", "Varginha", "Varna", "Vars", "Vasai", "Vasco da gama", "Vashon", "Vaslui", "Vasto", "Vatra dornei", "Vaughan", "Vaugneray", "Vaulxenvelin", "Vavuniya", "Veberd", "Vecindario", "Vecss", "Veelerveen", "Veenendaal", "Veghel", "Vejer de la frontera", "Vejle", "Velbert", "Velden", "Veldhoven", "Velen", "Velenje", "Veles", "Velika gorica", "Veliky novgorod", "Velk blovice", "Vellakuttai", "Vellore", "Velp", "Velpke", "Velserbroek", "Vence", "Venda nova do imigrante", "Vendargues", "Vendas novas", "Venezia", "Venice", "Venlo", "Venray", "Ventanilla", "Ventspils", "Ventura", "Venus", "Venncio aires", "Vera cruz", "Veracruz", "Vercelli", "Verdalsora", "Verden", "Verdi", "Verganovilla", "Vergennes", "Verges", "Veria", "Verl", "Vermillion", "Vernsurseiche", "Verna", "Vernier", "Vernon", "Vernon center", "Vernon hills", "Vernouillet", "Vero beach", "Verona", "Versailles", "Versoix", "Verthemex", "Vestal", "Vestavia hills", "Veszprm", "Veteli", "Veteran", "Vevey", "Viamo", "Viana do castelo", "Vianen", "Viareggio", "Viborg", "Vic", "Vicente guerrero", "Vicente lpez", "Vicenza", "Vichy", "Vicksburg", "Victor", "Victoria", "Victoriaville", "Victorville", "Vida", "Videira", "Vidin", "Vidnoye", "Viedma", "Vienna", "Vientiane", "Viernheim", "Viersen", "Vierzon", "Vieste", "View parkwindsor hills", "View royal", "Vigevano", "Vignate", "Vigneuxsurseine", "Vignola", "Vigo", "Vihti", "Viiala", "Vijayapura", "Vijayawada", "Vik", "Vila do conde", "Vila nova de gaia", "Vila nova itapetininga", "Vila real", "Vila velha", "Vilareal", "Vilaseca", "Viladecans", "Vilagarca de arousa", "Vilanova i la geltr", "Villa alemana", "Villa carlos paz", "Villa constitucin", "Villa cura brochero", "Villa de el carmen tequexquitla", "Villa de lvarez", "Villa general belgrano", "Villa la angostura", "Villa lzaro crdenas", "Villa mara", "Villa minetti", "Villa park", "Villach", "Villacidro", "Villadose", "Village of pewaukee", "Villahermosa", "Villamantilla", "Villamediana de iregua", "Villanova", "Villanueva de la caada", "Villarrica", "Villarrobledo", "Villarssouschampvent", "Villarssurglne", "Villastellone", "Villavicencio", "Ville platte", "Villedavray", "Villelagrand", "Villefontaine", "Villefranchesurmer", "Villefranchesursaone", "Villejuif", "Villenavedornon", "Villeneuvedascq", "Villeparisis", "Villerslaville", "Villetaneuse", "Villeurbanne", "Villeurbanne cedex", "Villierssaintgeorges", "Villigen", "Villingenschwenningen", "Villupuram", "Vilnius", "Vilshofen an der donau", "Vilvoorde", "Vimercate", "Vimmerby", "Vimperk", "Vimy", "Vincennes", "Vineland", "Vinezac", "Vinhedo", "Vinkovci", "Vinnytsia", "Vinton", "Vipiteno", "Virac", "Viramgam", "Virar", "Virginia", "Virginia beach", "Virginy", "Viroflay", "Virpur", "Visaginas", "Visakhapatnam", "Visalia", "Visby", "Visconde do rio branco", "Viseu", "Visoko", "Vista", "Vitacura", "Vitebsk", "Viterbo", "Vito dasio", "Vitoria", "Vitoriagasteiz", "Vitrimont", "Vitrolles", "Vittoria", "Vittorio veneto", "Vitria", "Vitria da conquista", "Vitria de santo anto", "Viviersdulac", "Vizianagaram", "Viosa", "Via del mar", "Vinjan", "Vlaardingen", "Vladikavkaz", "Vladimir", "Vladivostok", "Vlissingen", "Vodlemol cacora", "Vodnjan", "Voerde", "Voghera", "Voiron", "Volda", "Volendam", "Volgograd", "Vologda", "Volos", "Volstroff", "Volta redonda", "Volvic", "Voorburg", "Voorhees township", "Voorhout", "Voorschoten", "Voorst", "Vorden", "Voronezh", "Vossevangen", "Votkinsk", "Votorantim", "Votuporanga", "Vratsa", "Vrbovec", "Vrhnika", "Vriezenveen", "Vsetin", "Vught", "Vukovar", "Vung tau city", "Vyara", "Vyborg", "Vyshneve", "Vc", "Vrpalota", "Vstervik", "Vsters", "Vxj", "Vlezmlaga", "Vlizyvillacoublay", "Vcov", "Vlos", "Vru", "Vhl", "Vnh long", "Wa", "Waarland", "Waarschoot", "Waasmunster", "Wabash", "Wachtberg", "Waco", "Waddinxveen", "Wadesboro", "Wadesville", "Wadsworth", "Wagenberg", "Wageningen", "Wagga wagga", "Wah", "Wahlern", "Waialua", "Waiblingen", "Wailuku", "Waimea", "Wainiha", "Wainwright", "Waite park", "Waitsfield", "Waiuku", "Wakayama", "Wake forest", "Wakeeney", "Wakefield", "Wakeman", "Wako", "Walbrzych", "Waldaschaff", "Waldbronn", "Waldems", "Waldenbuch", "Waldmohr", "Waldoboro", "Waldorf", "Waldport", "Waldshuttiengen", "Walhalla", "Walheim", "Walker", "Wall township", "Walla walla", "Walldorf", "Waller", "Wallersdorf", "Wallingford", "Wallisellen", "Wallkill", "Walls", "Walnut", "Walnut creek", "Walnut ridge", "Walnutport", "Walpole", "Walsall", "Walscheid", "Walsrode", "Waltham", "Walton", "Walton hall", "Walton hills", "Walzbachtal", "Walzenhausen", "Wambrechies", "Wanaka", "Wanaque", "Wandering", "Wanganui", "Wangaratta", "Wantage", "Wapenveld", "Wappingers falls", "Warabi", "Warangal", "Waregem", "Waremme", "Waren mritz", "Warendorf", "Warminster", "Warmond", "Warner robins", "Warngau", "Warnsveld", "Warrandyte", "Warren", "Warrensburg", "Warrenton", "Warrenville", "Warri", "Warrington", "Warsaw", "Warszawa", "Wartenberg", "Wartkowice", "Warwick", "Washburn", "Washington", "Washington court house", "Washougal", "Wasilla", "Wassenaar", "Wassenberg", "Wasserburg bodensee", "Wasserburg am inn", "Watauga", "Waterbury", "Waterford", "Wateringen", "Waterloo", "Waterlooville", "Watertown", "Waterville", "Watervliet", "Watford", "Watha", "Watkins", "Watsonville", "Wattens", "Watterson park", "Wattrelos", "Wauchula", "Wauconda", "Waukee", "Waukegan", "Waukesha", "Waunakee", "Waupaca", "Wausau", "Wauseon", "Wauwatosa", "Waveney district", "Waverly", "Wavre", "Waxhaw", "Wayland", "Wayne", "Waynesboro", "Waynesville", "Wayzata", "Weatherford", "Weber city", "Webster", "Webster groves", "Wedel", "Wedmore", "Weed", "Weehawken", "Weert", "Weesp", "Wehingen", "Wehrheim", "Weiden", "Weifang", "Weifang shi", "Weihai", "Weihai shi", "Weilheim in oberbayern", "Weimar", "Weinfelden", "Weingarten", "Weinheim", "Weinstadt", "Weistrach", "Weiterstadt", "Weiz", "Wejherowo", "Welland", "Wellard", "Wellesley", "Wellesley islands", "Wellford", "Welling", "Wellington", "Wells", "Wels", "Welwyn", "Welwyn garden city", "Welwyn hatfield", "Wenatchee", "Wenham", "Wennappuwa", "Wenshan", "Wentworth falls", "Wentzville", "Wenzhou", "Wenzhou shi", "Weott", "Werl", "Wermelskirchen", "Werne", "Werneuchen", "Wernigerode", "Werribee", "Werther", "Wervicqsud", "Wesel", "Wesendorf", "Weslaco", "Wesley chapel", "Wesley hills", "West", "West allis", "West bend", "West bloomfield township", "West bridgewater", "West bridgford", "West brome", "West caldwell", "West chester", "West columbia", "West covina", "West deptford", "West des moines", "West dover", "West dundee", "West fargo", "West grove", "West haddon", "West hartford", "West haven", "West henrietta", "West hollywood", "West hurley", "West islip", "West jordan", "West kelowna", "West lafayette", "West lancashire", "West liberty", "West linn", "West long branch", "West malling", "West melbourne", "West middlesex", "West milford", "West monroe", "West new york", "West norriton", "West olive", "West orange", "West palm beach", "West plains", "West point", "West richland", "West rutland", "West sacramento", "West saint paul", "West seneca", "West springfield", "West valley city", "West vancouver", "West warwick", "West wellow", "West windsor township", "Westboro", "Westborough", "Westbrook", "Westbury", "Westerham", "Westerlo", "Westerly", "Westernport", "Westerville", "Westfield", "Westford", "Westlake", "Westlake village", "Westland", "Westminster", "Westmont", "Weston", "Westonsupermare", "Westonunderlizard", "Westover", "Westport", "Westwood", "Wetter", "Wetteren", "Wettingen", "Wetumpka", "Wetzikon", "Wetzlar", "Wewoka", "Wexford", "Weybridge", "Weyhill", "Weymouth", "Wezep", "Whangarei", "Wharepapa south", "Wheat ridge", "Wheaton", "Wheeling", "Whistler", "Whitby", "White", "White city", "White house", "White lake", "White lake charter township", "White plains", "White rock", "White salmon", "White settlement", "Whitefield", "Whitefish", "Whitefish bay", "Whitehall", "Whitehead", "Whitehorse", "Whiteley", "Whitemarsh township", "Whitewater", "Whitley bay", "Whitmore lake", "Whitpain township", "Whittier", "Wichita", "Wichita falls", "Wickenburg", "Wicklow", "Widnes", "Wiedlisbach", "Wiehl", "Wielsbeke", "Wien", "Wiensimmering", "Wiener neustadt", "Wieringerwaard", "Wiesbaden", "Wiesloch", "Wigan", "Wijchen", "Wijdenes", "Wijnegem", "Wil", "Wilamowice", "Wilaya de fes", "Wilbraham", "Wildomar", "Wildwood", "Wilhelmshaven", "Wilhermsdorf", "Wilkesbarre", "Willebroek", "Willemstad", "Williams lake", "Williamsburg", "Williamsport", "Williamston", "Williamstown", "Williamsville", "Willich", "Willingboro", "Willington", "Willis", "Williston", "Willits", "Willmar", "Willoughby", "Willunga", "Wilmette", "Wilmington", "Wilmore", "Wilmslow", "Wilson", "Wilsonville", "Wilton", "Winchester", "Winder", "Windermere", "Windham", "Windhoek", "Windisch", "Window rock", "Windsor", "Winfield", "Winnebago", "Winnenden", "Winnipeg", "Winona", "Winooski", "Winsen", "Winstonsalem", "Winter garden", "Winter haven", "Winter park", "Winter springs", "Winterborn", "Winterhaven", "Winters", "Winterswijk", "Winterthur", "Wintertononsea", "Winterville", "Winthrop", "Wipperfrth", "Wirdum", "Wirksworth", "Wiscasset", "Wisconsin dells", "Wisconsin rapids", "Wise", "Wismar", "Wisa", "Witney", "Witten", "Wittlichland", "Wixom", "Wladyslawowo", "Woburn", "Wodonga", "Woerden", "Wognum", "Woippy", "Woking", "Wokingham", "Wolcott", "Wolfeboro", "Wolfratshausen", "Wolfsberg", "Wolfsburg", "Wolfville", "Wollerau", "Wollongong", "Wolomin", "Wolvega", "Wolverhampton", "Wolverton", "Wommelgem", "Wonju", "Wonosobo", "Wood heights", "Woodbridge", "Woodbridge township", "Woodbury", "Woodcroft", "Woodhall spa", "Woodinville", "Woodland", "Woodland park", "Woodlesford", "Woodside", "Woodstock", "Woodville", "Wooster", "Worcester", "Wormer", "Wormerveer", "Wormhout", "Worms", "Worplesdon", "Worsley", "Worth", "Worthing", "Worthington", "Worton", "Woudenberg", "Wrentham", "Wrexham", "Wrocaw", "Wrzenia", "Wuhai", "Wuhan", "Wuhan shi", "Wuhu", "Wulkow", "Wulong", "Wulumuqi", "Wunstorf", "Wuppertal", "Wurzen", "Wuustwezel", "Wuxi", "Wuxi shi", "Wyandotte", "Wybcz", "Wychavon", "Wylie", "Wymondham", "Wyncote", "Wynne", "Wynnewood", "Wyoming", "Wyry", "Wysokie mazowieckie", "Wytheville", "Wchtersbach", "Wnnewilflamatt", "Wrselen", "Wrzburg", "Xalapa", "Xanthi", "Xanxer", "Xenia", "Xian", "Xiamen", "Xiamen shi", "Xian shi", "Xiangtan", "Xiangyang", "Xiantan", "Xianyang", "Xicohtzinco", "Xingning", "Xingtai", "Xining", "Xinjiang", "Xinxiang", "Xinyang", "Xinyu", "Xirivella", "Xuancheng", "Xuchang", "Xuzhou", "Xuzhou shi", "Xbia", "Xtiva", "Yaan", "Yachats", "Yacolt", "Yahatahigashiku", "Yaizu", "Yakima", "Yakutsk", "Yala", "Yalova", "Yamagata", "Yamagata county", "Yamaguchi", "Yamanashi", "Yamatsuri", "Yamoussoukro", "Yamunanagar", "Yanai", "Yanbian", "Yanbu", "Yancheng", "Yangon", "Yangzhou", "Yangzhou shi", "Yanji", "Yankeetown", "Yanshikhovochelly", "Yantai", "Yaounde", "Yardley", "Yaremcha", "Yarm", "Yarmouth", "Yaroslavl", "Yass", "Yasu", "Yasuj", "Yatesboro", "Yau tsim mong district", "Yavatmal", "Yawatahama", "Yazd", "Ye", "Yecla do", "Yekaterinburg", "Yelets", "Yellow springs", "Yellowknife", "Yelm", "Yendon", "Yeosu", "Yeovil", "Yeppoon", "Yerba buena", "Yerevan", "Yerres", "Yevpatoriia", "Yeysk", "Yibin", "Yichang", "Yinchuan", "Yinchuan shi", "Yiwu", "Yiyang", "Yogyakarta", "Yogyakarta city", "Yokneam illit", "Yokohama", "Yongin", "Yonginsi", "Yongzhou", "Yonkers", "Yopal", "Yorba linda", "York", "York springs", "Yorkshire", "Yorkton", "Yorktown", "Yorktown heights", "Yorkville", "Yosemite valley", "Yoshkarola", "Youngstown", "Youngsville", "Youngtown", "Ypres", "Ypsilanti", "Yreka", "Ystad", "Ytre enebakk", "Yubari district", "Yucaipa city of", "Yucca valley", "Yukon", "Yuma", "Yutz", "Yuzhnosakhalinsk", "Yverdonlesbains", "Yvrlvque", "Yzeuressurcreuse", "Zaamslag", "Zaandam", "Zaandijk", "Zabok", "Zabrze", "Zacatecas", "Zachary", "Zadar", "Zagreb", "Zakamensk", "Zakinthos", "Zakopane", "Zalaegerszeg", "Zama", "Zamboanga", "Zamboanga city", "Zanesville", "Zanjan", "Zanzibar", "Zaoshuang", "Zapopan", "Zaporizhia", "Zaporizhzhia", "Zaragoza", "Zarautz", "Zaraza", "Zarqa", "Zarzis", "Zarzyce wielkie", "Zaventem", "Zawiercie", "Zdiby", "Zebulon", "Zedelgem", "Zeeland", "Zeewolde", "Zeist", "Zelenograd", "Zelienople", "Zelzate", "Zemst", "Zephyr coveround hill village", "Zephyrhills", "Zermatt", "Zeropoint", "Zeven", "Zevenaar", "Zevenbergen", "Zevenhuizen", "Zeya", "Zgorzelec", "Zhangjiagang", "Zhangjiajie", "Zhangjiajie shi", "Zhangzhou", "Zhangzhou shi", "Zhangzhou zhi", "Zhanjiang", "Zhaoqing", "Zhaotong", "Zhengzhou", "Zhengzhou shi", "Zhenjiang", "Zhenjiang shi", "Zhongshan", "Zhuhai", "Zhuhai shi", "Zhukovskiy", "Zhukovsky", "Zhuzhou", "Zhytomyr", "Zibo", "Zielona gora", "Zielona gra", "Zielonka", "Zigong", "Ziguinchor", "Zikim", "Zion", "Zionsville", "Zip city", "Zirakpur", "Zlin", "Znojmo", "Zocca", "Zoersel", "Zoetermeer", "Zofingen", "Zonguldak", "Zonhoven", "Zottegem", "Zoutleeuw", "Zrenjanin", "Zuata", "Zug", "Zuidplas", "Zulte", "Zumaglia", "Zundert", "Zuni", "Zunyi", "Zurich", "Zurigo", "Zurzach", "Zutphen", "Zvolen", "Zwaag", "Zwaagdijkoost", "Zwartsluis", "Zweisimmen", "Zwettl", "Zwevegem", "Zwickau", "Zwijndrecht", "Zwingenberg", "Zwolle", "Zrich", "Zrichflughafen", "Zhedn", "Gua boa", "Gua branca", "Vila", "Tvidaberg", "An", "Anakkale", "Ubuk", "Chirolles", "Cija", "Cully", "Loyes", "Merainville", "Persy", "Pinal", "Si", "Taples", "Vianlesbains", "Vry", "Rebro", "St nad labem", "Ll", "Nl", "Rmqi", "Esk lpa", "Esk budjovice", "Esk krumlov", "Aziska grne", "Omianki dolne", "D", "Shimamachi", "Taku", "Liwiny", "Abanz", "Ki", "Kofja loka", "Tore", "Tvrtok na ostrove", "Ebbu", "Ilina", " ", "", "", "    ", " ", "", "  ", "  ", "  ", "", "", "   7", "", "", "", "  ", "", "", "", "", " ", "", "", "", " yatsushiro", "", "", "", "", "", "", "", "", " kikuchi", "", "", "", "", " "]
;
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//



;
