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
  var updateKey = 'ls_update';
  var metaKEY = '__ls_meta';
  var mainKey = 'ls';
  function Storage() {
  }
  (function (targetExport) {
    var VERSION = '0.4.12', $ = window.jQuery || window.$ || (window.$ = {}), JSON = {
        parse: window.JSON && (window.JSON.parse || window.JSON.decode) || String.prototype.evalJSON && function (str) {
          return String(str).evalJSON();
        } || $.parseJSON || $.evalJSON,
        stringify: Object.toJSON || window.JSON && (window.JSON.stringify || window.JSON.encode) || $.toJSON
      };
    if (typeof JSON.parse !== 'function' || typeof JSON.stringify !== 'function') {
      throw new Error('No JSON support found, include //cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2.js to page');
    }
    var _storage = {}, _storageService = {}, _storageElm = null, _storageSize = 0, _backend = false, _observers = {}, _observerTimeout = false, _observerUpdate = 0, _pubsubObservers = {}, _pubsubLast = +new Date(), _ttlTimeout, _XMLService = {
        isXML: function (elm) {
          var documentElement = (elm ? elm.ownerDocument || elm : 0).documentElement;
          return documentElement ? documentElement.nodeName !== 'HTML' : false;
        },
        encode: function (xmlNode) {
          if (!this.isXML(xmlNode)) {
            return false;
          }
          try {
            return new XMLSerializer().serializeToString(xmlNode);
          } catch (E1) {
            try {
              return xmlNode.xml;
            } catch (E2) {
            }
          }
          return false;
        },
        decode: function (xmlString) {
          var domParser = 'DOMParser' in window && new DOMParser().parseFromString || window.ActiveXObject && function (_xmlString) {
              var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
              xmlDoc.async = 'false';
              xmlDoc.loadXML(_xmlString);
              return xmlDoc;
            }, resultXML;
          if (!domParser) {
            return false;
          }
          resultXML = domParser.call('DOMParser' in window && new DOMParser() || window, xmlString, 'text/xml');
          return this.isXML(resultXML) ? resultXML : false;
        }
      };
    _storage[metaKEY] = { CRC32: {} };
    _storageService[mainKey] = '{}';
    function _init() {
      var localStorageReallyWorks = false;
      if ('localStorage' in window) {
        try {
          window.localStorage.setItem('_tmptest', 'tmpval');
          localStorageReallyWorks = true;
          window.localStorage.removeItem('_tmptest');
        } catch (BogusQuotaExceededErrorOnIos5) {
        }
      }
      if (localStorageReallyWorks) {
        try {
          if (window.localStorage) {
            _storageService = window.localStorage;
            _backend = 'localStorage';
            _observerUpdate = _storageService[updateKey];
          }
        } catch (E3) {
        }
      } else if ('globalStorage' in window) {
        try {
          if (window.globalStorage) {
            if (window.location.hostname == 'localhost') {
              _storageService = window.globalStorage['localhost.localdomain'];
            } else {
              _storageService = window.globalStorage[window.location.hostname];
            }
            _backend = 'globalStorage';
            _observerUpdate = _storageService[updateKey];
          }
        } catch (E4) {
        }
      } else {
        _storageElm = document.createElement('link');
        if (_storageElm.addBehavior) {
          _storageElm.style.behavior = 'url(#default#userData)';
          document.getElementsByTagName('head')[0].appendChild(_storageElm);
          try {
            _storageElm.load(mainKey);
          } catch (E) {
            _storageElm.setAttribute(mainKey, '{}');
            _storageElm.save(mainKey);
            _storageElm.load(mainKey);
          }
          var data = '{}';
          try {
            data = _storageElm.getAttribute(mainKey);
          } catch (E5) {
          }
          try {
            _observerUpdate = _storageElm.getAttribute(updateKey);
          } catch (E6) {
          }
          _storageService[mainKey] = data;
          _backend = 'userDataBehavior';
        } else {
          _storageElm = null;
          return;
        }
      }
      _loadStorage();
      _handleTTL();
      _setupObserver();
      _handlePubSub();
      if ('addEventListener' in window) {
        window.addEventListener('pageshow', function (event) {
          if (event.persisted) {
            _storageObserver();
          }
        }, false);
      }
    }
    function _reloadData() {
      var data = '{}';
      if (_backend == 'userDataBehavior') {
        _storageElm.load(mainKey);
        try {
          data = _storageElm.getAttribute(mainKey);
        } catch (E5) {
        }
        try {
          _observerUpdate = _storageElm.getAttribute(updateKey);
        } catch (E6) {
        }
        _storageService[mainKey] = data;
      }
      _loadStorage();
      _handleTTL();
      _handlePubSub();
    }
    function _setupObserver() {
      if (_backend == 'localStorage' || _backend == 'globalStorage') {
        if ('addEventListener' in window) {
          window.addEventListener('storage', _storageObserver, false);
        } else {
          document.attachEvent('onstorage', _storageObserver);
        }
      } else if (_backend == 'userDataBehavior') {
        setInterval(_storageObserver, 1000);
      }
    }
    function _storageObserver() {
      var updateTime;
      clearTimeout(_observerTimeout);
      _observerTimeout = setTimeout(function () {
        if (_backend == 'localStorage' || _backend == 'globalStorage') {
          updateTime = _storageService[updateKey];
        } else if (_backend == 'userDataBehavior') {
          _storageElm.load(mainKey);
          try {
            updateTime = _storageElm.getAttribute(updateKey);
          } catch (E5) {
          }
        }
        if (updateTime && updateTime != _observerUpdate) {
          _observerUpdate = updateTime;
          _checkUpdatedKeys();
        }
      }, 25);
    }
    function _checkUpdatedKeys() {
      var oldCrc32List = JSON.parse(JSON.stringify(_storage[metaKEY].CRC32)), newCrc32List;
      _reloadData();
      newCrc32List = JSON.parse(JSON.stringify(_storage[metaKEY].CRC32));
      var key, updated = [], removed = [];
      for (key in oldCrc32List) {
        if (oldCrc32List.hasOwnProperty(key)) {
          if (!newCrc32List[key]) {
            removed.push(key);
            continue;
          }
          if (oldCrc32List[key] != newCrc32List[key] && String(oldCrc32List[key]).substr(0, 2) == '2.') {
            updated.push(key);
          }
        }
      }
      for (key in newCrc32List) {
        if (newCrc32List.hasOwnProperty(key)) {
          if (!oldCrc32List[key]) {
            updated.push(key);
          }
        }
      }
      _fireObservers(updated, 'updated');
      _fireObservers(removed, 'deleted');
    }
    function _fireObservers(keys, action) {
      keys = [].concat(keys || []);
      var i, j, len, jlen;
      if (action == 'flushed') {
        keys = [];
        for (var key in _observers) {
          if (_observers.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        action = 'deleted';
      }
      for (i = 0, len = keys.length; i < len; i++) {
        if (_observers[keys[i]]) {
          for (j = 0, jlen = _observers[keys[i]].length; j < jlen; j++) {
            _observers[keys[i]][j](keys[i], action);
          }
        }
        if (_observers['*']) {
          for (j = 0, jlen = _observers['*'].length; j < jlen; j++) {
            _observers['*'][j](keys[i], action);
          }
        }
      }
    }
    function _publishChange() {
      var updateTime = (+new Date()).toString();
      if (_backend == 'localStorage' || _backend == 'globalStorage') {
        try {
          _storageService[updateKey] = updateTime;
        } catch (E8) {
          _backend = false;
        }
      } else if (_backend == 'userDataBehavior') {
        _storageElm.setAttribute(updateKey, updateTime);
        _storageElm.save(mainKey);
      }
      _storageObserver();
    }
    function _loadStorage() {
      if (_storageService[mainKey]) {
        try {
          _storage = JSON.parse(String(_storageService[mainKey]));
        } catch (E6) {
          _storageService[mainKey] = '{}';
        }
      } else {
        _storageService[mainKey] = '{}';
      }
      _storageSize = _storageService[mainKey] ? String(_storageService[mainKey]).length : 0;
      if (!_storage[metaKEY]) {
        _storage[metaKEY] = {};
      }
      if (!_storage[metaKEY].CRC32) {
        _storage[metaKEY].CRC32 = {};
      }
    }
    function _save() {
      _dropOldEvents();
      try {
        _storageService[mainKey] = JSON.stringify(_storage);
        if (_storageElm) {
          _storageElm.setAttribute(mainKey, _storageService[mainKey]);
          _storageElm.save(mainKey);
        }
        _storageSize = _storageService[mainKey] ? String(_storageService[mainKey]).length : 0;
      } catch (E7) {
      }
    }
    function _checkKey(key) {
      if (typeof key != 'string' && typeof key != 'number') {
        throw new TypeError('Key name must be string or numeric');
      }
      if (key == metaKEY) {
        throw new TypeError('Reserved key name');
      }
      return true;
    }
    function _handleTTL() {
      var curtime, i, TTL, CRC32, nextExpire = Infinity, changed = false, deleted = [];
      clearTimeout(_ttlTimeout);
      if (!_storage[metaKEY] || typeof _storage[metaKEY].TTL != 'object') {
        return;
      }
      curtime = +new Date();
      TTL = _storage[metaKEY].TTL;
      CRC32 = _storage[metaKEY].CRC32;
      for (i in TTL) {
        if (TTL.hasOwnProperty(i)) {
          if (TTL[i] <= curtime) {
            delete TTL[i];
            delete CRC32[i];
            delete _storage[i];
            changed = true;
            deleted.push(i);
          } else if (TTL[i] < nextExpire) {
            nextExpire = TTL[i];
          }
        }
      }
      if (nextExpire != Infinity) {
        _ttlTimeout = setTimeout(_handleTTL, Math.min(nextExpire - curtime, 2147483647));
      }
      if (changed) {
        _save();
        _publishChange();
        _fireObservers(deleted, 'deleted');
      }
    }
    function _handlePubSub() {
      var i, len;
      if (!_storage[metaKEY].PubSub) {
        return;
      }
      var pubelm, _pubsubCurrent = _pubsubLast, needFired = [];
      for (i = len = _storage[metaKEY].PubSub.length - 1; i >= 0; i--) {
        pubelm = _storage[metaKEY].PubSub[i];
        if (pubelm[0] > _pubsubLast) {
          _pubsubCurrent = pubelm[0];
          needFired.unshift(pubelm);
        }
      }
      for (i = needFired.length - 1; i >= 0; i--) {
        _fireSubscribers(needFired[i][1], needFired[i][2]);
      }
      _pubsubLast = _pubsubCurrent;
    }
    function _fireSubscribers(channel, payload) {
      if (_pubsubObservers[channel]) {
        for (var i = 0, len = _pubsubObservers[channel].length; i < len; i++) {
          try {
            _pubsubObservers[channel][i](channel, JSON.parse(JSON.stringify(payload)));
          } catch (E) {
          }
        }
      }
    }
    function _dropOldEvents() {
      if (!_storage[metaKEY].PubSub) {
        return;
      }
      var retire = +new Date() - 2000;
      for (var i = 0, len = _storage[metaKEY].PubSub.length; i < len; i++) {
        if (_storage[metaKEY].PubSub[i][0] <= retire) {
          _storage[metaKEY].PubSub.splice(i, _storage[metaKEY].PubSub.length - i);
          break;
        }
      }
      if (!_storage[metaKEY].PubSub.length) {
        delete _storage[metaKEY].PubSub;
      }
    }
    function _publish(channel, payload) {
      if (!_storage[metaKEY]) {
        _storage[metaKEY] = {};
      }
      if (!_storage[metaKEY].PubSub) {
        _storage[metaKEY].PubSub = [];
      }
      _storage[metaKEY].PubSub.unshift([
        +new Date(),
        channel,
        payload
      ]);
      _save();
      _publishChange();
    }
    function MurmurHash2(str, seed) {
      var l = str.length, h = seed ^ l, i = 0, k;
      while (l >= 4) {
        k = str.charCodeAt(i) & 255 | (str.charCodeAt(++i) & 255) << 8 | (str.charCodeAt(++i) & 255) << 16 | (str.charCodeAt(++i) & 255) << 24;
        k = (k & 65535) * 1540483477 + (((k >>> 16) * 1540483477 & 65535) << 16);
        k ^= k >>> 24;
        k = (k & 65535) * 1540483477 + (((k >>> 16) * 1540483477 & 65535) << 16);
        h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16) ^ k;
        l -= 4;
        ++i;
      }
      switch (l) {
      case 3:
        h ^= (str.charCodeAt(i + 2) & 255) << 16;
      case 2:
        h ^= (str.charCodeAt(i + 1) & 255) << 8;
      case 1:
        h ^= str.charCodeAt(i) & 255;
        h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16);
      }
      h ^= h >>> 13;
      h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16);
      h ^= h >>> 15;
      return h >>> 0;
    }
    targetExport.prototype = {
      version: VERSION,
      set: function (key, value, options) {
        _checkKey(key);
        options = options || {};
        if (typeof value == 'undefined') {
          this.deleteKey(key);
          return value;
        }
        if (_XMLService.isXML(value)) {
          value = {
            _isXml: true,
            xml: _XMLService.encode(value)
          };
        } else if (typeof value == 'function') {
          return undefined;
        } else if (value && typeof value == 'object') {
          value = JSON.parse(JSON.stringify(value));
        }
        _storage[key] = value;
        _storage[metaKEY].CRC32[key] = '2.' + new MurmurHash2(JSON.stringify(value), 2538058380);
        this.setTTL(key, options.TTL || 0);
        _fireObservers(key, 'updated');
        return value;
      },
      get: function (key, def) {
        _checkKey(key);
        if (key in _storage) {
          if (_storage[key] && typeof _storage[key] == 'object' && _storage[key]._isXml) {
            return _XMLService.decode(_storage[key].xml);
          } else {
            return _storage[key];
          }
        }
        return typeof def == 'undefined' ? null : def;
      },
      deleteKey: function (key) {
        _checkKey(key);
        if (key in _storage) {
          delete _storage[key];
          if (typeof _storage[metaKEY].TTL == 'object' && key in _storage[metaKEY].TTL) {
            delete _storage[metaKEY].TTL[key];
          }
          delete _storage[metaKEY].CRC32[key];
          _save();
          _publishChange();
          _fireObservers(key, 'deleted');
          return true;
        }
        return false;
      },
      setTTL: function (key, ttl) {
        var curtime = +new Date();
        _checkKey(key);
        ttl = Number(ttl) || 0;
        if (key in _storage) {
          if (!_storage[metaKEY].TTL) {
            _storage[metaKEY].TTL = {};
          }
          if (ttl > 0) {
            _storage[metaKEY].TTL[key] = curtime + ttl;
          } else {
            delete _storage[metaKEY].TTL[key];
          }
          _save();
          _handleTTL();
          _publishChange();
          return true;
        }
        return false;
      },
      getTTL: function (key) {
        var curtime = +new Date(), ttl;
        _checkKey(key);
        if (key in _storage && _storage[metaKEY].TTL && _storage[metaKEY].TTL[key]) {
          ttl = _storage[metaKEY].TTL[key] - curtime;
          return ttl || 0;
        }
        return 0;
      },
      flush: function () {
        _storage = {};
        _storage[metaKEY] = { CRC32: {} };
        _save();
        _publishChange();
        _fireObservers(null, 'flushed');
        return true;
      },
      storageObj: function () {
        function F() {
        }
        F.prototype = _storage;
        return new F();
      },
      index: function () {
        var index = [], i;
        for (i in _storage) {
          if (_storage.hasOwnProperty(i) && i != metaKEY) {
            index.push(i);
          }
        }
        return index;
      },
      storageSize: function () {
        return _storageSize;
      },
      currentBackend: function () {
        return _backend;
      },
      storageAvailable: function () {
        return !!_backend;
      },
      listenKeyChange: function (key, callback) {
        _checkKey(key);
        if (!_observers[key]) {
          _observers[key] = [];
        }
        _observers[key].push(callback);
      },
      stopListening: function (key, callback) {
        _checkKey(key);
        if (!_observers[key]) {
          return;
        }
        if (!callback) {
          delete _observers[key];
          return;
        }
        for (var i = _observers[key].length - 1; i >= 0; i--) {
          if (_observers[key][i] == callback) {
            _observers[key].splice(i, 1);
          }
        }
      },
      subscribe: function (channel, callback) {
        channel = (channel || '').toString();
        if (!channel) {
          throw new TypeError('Channel not defined');
        }
        if (!_pubsubObservers[channel]) {
          _pubsubObservers[channel] = [];
        }
        _pubsubObservers[channel].push(callback);
      },
      publish: function (channel, payload) {
        channel = (channel || '').toString();
        if (!channel) {
          throw new TypeError('Channel not defined');
        }
        _publish(channel, payload);
      },
      reInit: function () {
        _reloadData();
      }
    };
    _init();
  }(Storage));
  return new Storage();
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