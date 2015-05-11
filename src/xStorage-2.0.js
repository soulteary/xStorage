/* jshint browser: true */
/* global define: false */

define(function () {
    'use strict';

    var metaKEY = '__ls_meta';
    var mainKey = 'ls2';

    var
        VERSION            = '0.1.3',

        /* This is the object, that holds the cached values */
        _storage           = false,

        /* How much space does the storage take */
        _storageSize      = 0,

        _storageAvailable = false,

        _ttlTimeout       = null;

    // This method might throw as it touches localStorage and doing so
    // can be prohibited in some environments
    function _init () {

        // If localStorage does not exist, the following throws
        // This is intentional
        window.localStorage.setItem('__simpleStorageInitTest', 'tmpval');
        window.localStorage.removeItem('__simpleStorageInitTest');

        // Load data from storage
        _loadStorage();

        // remove dead keys
        _handleTTL();

        // start listening for changes
        _setupUpdateObserver();

        // handle cached navigation
        if ('addEventListener' in window) {
            window.addEventListener('pageshow', function (event) {
                if (event.persisted) {
                    _reloadData();
                }
            }, false);
        }

        _storageAvailable = true;
    }

    /**
     * Sets up a storage change observer
     */
    function _setupUpdateObserver () {
        if ('addEventListener' in window) {
            window.addEventListener('storage', _reloadData, false);
        } else {
            document.attachEvent('onstorage', _reloadData);
        }
    }

    /**
     * Reload data from storage when needed
     */
    function _reloadData () {
        try {
            _loadStorage();
        } catch (E) {
            _storageAvailable = false;
            return;
        }
        _handleTTL();
    }

    function _loadStorage () {
        var source = localStorage.getItem(mainKey);

        try {
            _storage = JSON.parse(source) || {};
        } catch (E) {
            _storage = {};
        }

        _storageSize = _getStorageSize();
    }

    function _save () {
        try {
            localStorage.setItem(mainKey, JSON.stringify(_storage));
            _storageSize = _getStorageSize();
        } catch (E) {
            return E;
        }
        return true;
    }

    function _getStorageSize () {
        var source = localStorage.getItem(mainKey);
        return source ? String(source).length : 0;
    }

    function _handleTTL () {
        var curtime, i, len, expire, keys, nextExpire = Infinity,
            expiredKeysCount                          = 0;

        clearTimeout(_ttlTimeout);

        if (!_storage || !_storage[metaKEY] || !_storage[metaKEY].TTL) {
            return;
        }

        curtime = +new Date();
        keys = _storage[metaKEY].TTL.keys || [];
        expire = _storage[metaKEY].TTL.expire || {};

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

        // set next check
        if (nextExpire != Infinity) {
            _ttlTimeout = setTimeout(_handleTTL, Math.min(nextExpire - curtime, 0x7FFFFFFF));
        }

        // remove expired from TTL list and save changes
        if (expiredKeysCount) {
            keys.splice(0, expiredKeysCount);

            _cleanMetaObject();
            _save();
        }
    }

    function _setTTL (key, ttl) {
        var curtime       = +new Date(),
            i, len, added = false;

        ttl = Number(ttl) || 0;

        // Set TTL value for the key
        if (ttl !== 0) {
            // If key exists, set TTL
            if (_storage.hasOwnProperty(key)) {

                if (!_storage[metaKEY]) {
                    _storage[metaKEY] = {};
                }

                if (!_storage[metaKEY].TTL) {
                    _storage[metaKEY].TTL = {
                        expire: {},
                        keys  : []
                    };
                }

                _storage[metaKEY].TTL.expire[key] = curtime + ttl;

                // find the expiring key in the array and remove it and all before it (because of sort)
                if (_storage[metaKEY].TTL.expire.hasOwnProperty(key)) {
                    for (i = 0, len = _storage[metaKEY].TTL.keys.length; i < len; i++) {
                        if (_storage[metaKEY].TTL.keys[i] == key) {
                            _storage[metaKEY].TTL.keys.splice(i);
                        }
                    }
                }

                // add key to keys array preserving sort (soonest first)
                for (i = 0, len = _storage[metaKEY].TTL.keys.length; i < len; i++) {
                    if (_storage[metaKEY].TTL.expire[_storage[metaKEY].TTL.keys[i]] > (curtime + ttl)) {
                        _storage[metaKEY].TTL.keys.splice(i, 0, key);
                        added = true;
                        break;
                    }
                }

                // if not added in previous loop, add here
                if (!added) {
                    _storage[metaKEY].TTL.keys.push(key);
                }
            } else {
                return false;
            }
        } else {
            // Remove TTL if set
            if (_storage && _storage[metaKEY] && _storage[metaKEY].TTL) {

                if (_storage[metaKEY].TTL.expire.hasOwnProperty(key)) {
                    delete _storage[metaKEY].TTL.expire[key];
                    for (i = 0, len = _storage[metaKEY].TTL.keys.length; i < len; i++) {
                        if (_storage[metaKEY].TTL.keys[i] == key) {
                            _storage[metaKEY].TTL.keys.splice(i, 1);
                            break;
                        }
                    }
                }

                _cleanMetaObject();
            }
        }

        // schedule next TTL check
        clearTimeout(_ttlTimeout);
        if (_storage && _storage[metaKEY] && _storage[metaKEY].TTL && _storage[metaKEY].TTL.keys.length) {
            _ttlTimeout = setTimeout(_handleTTL, Math.min(Math.max(_storage[metaKEY].TTL.expire[_storage[metaKEY].TTL.keys[0]] - curtime, 0), 0x7FFFFFFF));
        }

        return true;
    }

    function _cleanMetaObject () {
        var updated       = false,
            hasProperties = false,
            i;

        if (!_storage || !_storage[metaKEY]) {
            return updated;
        }

        // If nothing to TTL, remove the object
        if (_storage[metaKEY].TTL && !_storage[metaKEY].TTL.keys.length) {
            delete _storage[metaKEY].TTL;
            updated = true;
        }

        // If meta object is empty, remove it
        for (i in _storage[metaKEY]) {
            if (_storage[metaKEY].hasOwnProperty(i)) {
                hasProperties = true;
                break;
            }
        }

        if (!hasProperties) {
            delete _storage[metaKEY];
            updated = true;
        }

        return updated;
    }

    ////////////////////////// PUBLIC INTERFACE /////////////////////////

    try {
        _init();
    } catch (E) {
    }

    return {

        version: VERSION,

        canUse: function () {
            return !!_storageAvailable;
        },

        set: function (key, value, options) {
            if (key == metaKEY) {
                return false;
            }

            if (!_storage) {
                return false;
            }

            // undefined values are deleted automatically
            if (typeof value == 'undefined') {
                return this.deleteKey(key);
            }

            options = options || {};

            // Check if the value is JSON compatible (and remove reference to existing objects/arrays)
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

            if (_storage.hasOwnProperty(key) && key != metaKEY) {
                // TTL value for an existing key is either a positive number or an Infinity
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
                if (_storage[metaKEY] &&
                    _storage[metaKEY].TTL &&
                    _storage[metaKEY].TTL.expire &&
                    _storage[metaKEY].TTL.expire.hasOwnProperty(key)) {

                    ttl = Math.max(_storage[metaKEY].TTL.expire[key] - (+new Date()) || 0, 0);

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
                localStorage.removeItem(mainKey);
                return true;
            } catch (E) {
                return E;
            }
        },

        index: function () {
            if (!_storage) {
                return false;
            }

            var index = [],
                i;
            for (i in _storage) {
                if (_storage.hasOwnProperty(i) && i != metaKEY) {
                    index.push(i);
                }
            }
            return index;
        },

        storageSize: function () {
            return _storageSize;
        }
    };
});
