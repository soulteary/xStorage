;(function (root, factory) {
    if (typeof define === 'function') {
        define(['xStorage'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        factory();
    }
}(this, function () {
    'use strict';

    var _xStorgeObj = window.xStorage;

//WRAPPER
var xStorage;
xStorage = function () {
  var VERSION = '0.1.3', _storage = false, _storage_size = 0, _storage_available = false, _ttl_timeout = null;
  function _init() {
    window.localStorage.setItem('__simpleStorageInitTest', 'tmpval');
    window.localStorage.removeItem('__simpleStorageInitTest');
    _load_storage();
    _handleTTL();
    _setupUpdateObserver();
    if ('addEventListener' in window) {
      window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
          _reloadData();
        }
      }, false);
    }
    _storage_available = true;
  }
  function _setupUpdateObserver() {
    if ('addEventListener' in window) {
      window.addEventListener('storage', _reloadData, false);
    } else {
      document.attachEvent('onstorage', _reloadData);
    }
  }
  function _reloadData() {
    try {
      _load_storage();
    } catch (E) {
      _storage_available = false;
      return;
    }
    _handleTTL();
  }
  function _load_storage() {
    var source = localStorage.getItem('simpleStorage');
    try {
      _storage = JSON.parse(source) || {};
    } catch (E) {
      _storage = {};
    }
    _storage_size = _get_storage_size();
  }
  function _save() {
    try {
      localStorage.setItem('simpleStorage', JSON.stringify(_storage));
      _storage_size = _get_storage_size();
    } catch (E) {
      return E;
    }
    return true;
  }
  function _get_storage_size() {
    var source = localStorage.getItem('simpleStorage');
    return source ? String(source).length : 0;
  }
  function _handleTTL() {
    var curtime, i, len, expire, keys, nextExpire = Infinity, expiredKeysCount = 0;
    clearTimeout(_ttl_timeout);
    if (!_storage || !_storage.__simpleStorage_meta || !_storage.__simpleStorage_meta.TTL) {
      return;
    }
    curtime = +new Date();
    keys = _storage.__simpleStorage_meta.TTL.keys || [];
    expire = _storage.__simpleStorage_meta.TTL.expire || {};
    for (i = 0, len = keys.length; i < len; i++) {
      if (expire[keys[i]] <= curtime) {
        expiredKeysCount++;
        delete _storage[keys[i]];
        delete expire[keys[i]];
      } else {
        if (expire[keys[i]] < nextExpire) {
          nextExpire = expire[keys[i]];
        }
        break;
      }
    }
    if (nextExpire != Infinity) {
      _ttl_timeout = setTimeout(_handleTTL, Math.min(nextExpire - curtime, 2147483647));
    }
    if (expiredKeysCount) {
      keys.splice(0, expiredKeysCount);
      _cleanMetaObject();
      _save();
    }
  }
  function _setTTL(key, ttl) {
    var curtime = +new Date(), i, len, added = false;
    ttl = Number(ttl) || 0;
    if (ttl !== 0) {
      if (_storage.hasOwnProperty(key)) {
        if (!_storage.__simpleStorage_meta) {
          _storage.__simpleStorage_meta = {};
        }
        if (!_storage.__simpleStorage_meta.TTL) {
          _storage.__simpleStorage_meta.TTL = {
            expire: {},
            keys: []
          };
        }
        _storage.__simpleStorage_meta.TTL.expire[key] = curtime + ttl;
        if (_storage.__simpleStorage_meta.TTL.expire.hasOwnProperty(key)) {
          for (i = 0, len = _storage.__simpleStorage_meta.TTL.keys.length; i < len; i++) {
            if (_storage.__simpleStorage_meta.TTL.keys[i] == key) {
              _storage.__simpleStorage_meta.TTL.keys.splice(i);
            }
          }
        }
        for (i = 0, len = _storage.__simpleStorage_meta.TTL.keys.length; i < len; i++) {
          if (_storage.__simpleStorage_meta.TTL.expire[_storage.__simpleStorage_meta.TTL.keys[i]] > curtime + ttl) {
            _storage.__simpleStorage_meta.TTL.keys.splice(i, 0, key);
            added = true;
            break;
          }
        }
        if (!added) {
          _storage.__simpleStorage_meta.TTL.keys.push(key);
        }
      } else {
        return false;
      }
    } else {
      if (_storage && _storage.__simpleStorage_meta && _storage.__simpleStorage_meta.TTL) {
        if (_storage.__simpleStorage_meta.TTL.expire.hasOwnProperty(key)) {
          delete _storage.__simpleStorage_meta.TTL.expire[key];
          for (i = 0, len = _storage.__simpleStorage_meta.TTL.keys.length; i < len; i++) {
            if (_storage.__simpleStorage_meta.TTL.keys[i] == key) {
              _storage.__simpleStorage_meta.TTL.keys.splice(i, 1);
              break;
            }
          }
        }
        _cleanMetaObject();
      }
    }
    clearTimeout(_ttl_timeout);
    if (_storage && _storage.__simpleStorage_meta && _storage.__simpleStorage_meta.TTL && _storage.__simpleStorage_meta.TTL.keys.length) {
      _ttl_timeout = setTimeout(_handleTTL, Math.min(Math.max(_storage.__simpleStorage_meta.TTL.expire[_storage.__simpleStorage_meta.TTL.keys[0]] - curtime, 0), 2147483647));
    }
    return true;
  }
  function _cleanMetaObject() {
    var updated = false, hasProperties = false, i;
    if (!_storage || !_storage.__simpleStorage_meta) {
      return updated;
    }
    if (_storage.__simpleStorage_meta.TTL && !_storage.__simpleStorage_meta.TTL.keys.length) {
      delete _storage.__simpleStorage_meta.TTL;
      updated = true;
    }
    for (i in _storage.__simpleStorage_meta) {
      if (_storage.__simpleStorage_meta.hasOwnProperty(i)) {
        hasProperties = true;
        break;
      }
    }
    if (!hasProperties) {
      delete _storage.__simpleStorage_meta;
      updated = true;
    }
    return updated;
  }
  try {
    _init();
  } catch (E) {
  }
  return {
    version: VERSION,
    canUse: function () {
      return !!_storage_available;
    },
    set: function (key, value, options) {
      if (key == '__simpleStorage_meta') {
        return false;
      }
      if (!_storage) {
        return false;
      }
      if (typeof value == 'undefined') {
        return this.deleteKey(key);
      }
      options = options || {};
      try {
        value = JSON.parse(JSON.stringify(value));
      } catch (E) {
        return E;
      }
      _storage[key] = value;
      _setTTL(key, options.TTL || 0);
      return _save();
    },
    get: function (key) {
      if (!_storage) {
        return false;
      }
      if (_storage.hasOwnProperty(key) && key != '__simpleStorage_meta') {
        if (this.getTTL(key)) {
          return _storage[key];
        }
      }
    },
    deleteKey: function (key) {
      if (!_storage) {
        return false;
      }
      if (key in _storage) {
        delete _storage[key];
        _setTTL(key, 0);
        return _save();
      }
      return false;
    },
    setTTL: function (key, ttl) {
      if (!_storage) {
        return false;
      }
      _setTTL(key, ttl);
      return _save();
    },
    getTTL: function (key) {
      var ttl;
      if (!_storage) {
        return false;
      }
      if (_storage.hasOwnProperty(key)) {
        if (_storage.__simpleStorage_meta && _storage.__simpleStorage_meta.TTL && _storage.__simpleStorage_meta.TTL.expire && _storage.__simpleStorage_meta.TTL.expire.hasOwnProperty(key)) {
          ttl = Math.max(_storage.__simpleStorage_meta.TTL.expire[key] - +new Date() || 0, 0);
          return ttl || false;
        } else {
          return Infinity;
        }
      }
      return false;
    },
    flush: function () {
      if (!_storage) {
        return false;
      }
      _storage = {};
      try {
        localStorage.removeItem('simpleStorage');
        return true;
      } catch (E) {
        return E;
      }
    },
    index: function () {
      if (!_storage) {
        return false;
      }
      var index = [], i;
      for (i in _storage) {
        if (_storage.hasOwnProperty(i) && i != '__simpleStorage_meta') {
          index.push(i);
        }
      }
      return index;
    },
    storageSize: function () {
      return _storage_size;
    }
  };
}();

//WRAPPER

    xStorage.noConflict = function() {
        delete window.xStorage;

        if (_xStorgeObj) {
            window.xStorage = _xStorgeObj;
        }
        return this;
    }

    if(!_xStorgeObj){
        window.xStorage = xStorage;
    }

    return xStorage;
}));