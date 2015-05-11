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
<%= contents %>

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
