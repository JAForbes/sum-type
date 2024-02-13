"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = exports.maybe = exports.either = exports.type = void 0;
function match(instance, options) {
    return options[instance.tag](instance.value);
}
function otherwise(tags) {
    return function (fn) { return Object.fromEntries(tags.map(function (tag) { return [tag, fn]; })); };
}
function type(type, definition) {
    var tags = Object.keys(definition);
    var api = {
        type: type,
        tags: tags,
        patterns: {},
        definition: definition,
        match: match,
        otherwise: function (tagNames) {
            if (tagNames === void 0) { tagNames = tags; }
            return otherwise(tagNames);
        },
    };
    var _loop_1 = function (tag) {
        api[tag] = function (value) {
            if (value === void 0) { value = {}; }
            return { type: type, tag: tag, value: value };
        };
        api["is".concat(tag)] = function (v) { return v.tag === tag; };
        api["get".concat(tag)] = function (v, fallback, f) {
            if (f) {
                return v.tag === tag ? f(v.value) : fallback !== null && fallback !== void 0 ? fallback : null;
            }
            return v.tag === tag ? v.value : fallback !== null && fallback !== void 0 ? fallback : null;
        };
        api["map".concat(tag)] = function (v, f) {
            return v.tag === tag ? __assign(__assign({}, v), { value: f(v.value) }) : v !== null && v !== void 0 ? v : null;
        };
        api["flatMap".concat(tag)] = function (v, f) {
            return v.tag === tag ? f(v.value) : v !== null && v !== void 0 ? v : null;
        };
    };
    for (var _i = 0, _a = Object.keys(definition); _i < _a.length; _i++) {
        var tag = _a[_i];
        _loop_1(tag);
    }
    return api;
}
exports.type = type;
function either(name, yes, no) {
    if (no === void 0) { no = function () { return ({}); }; }
    var api = type(name, {
        Y: yes,
        N: no,
    });
    function encase(fn) {
        return function (value) {
            try {
                return api.Y(fn(value));
            }
            catch (error) {
                return api.N(error);
            }
        };
    }
    ;
    api.encase = encase;
    api.get = api.getY;
    api.bifold = function (instance, noFunction, yesFunction) {
        return api.match(instance, {
            Y: yesFunction,
            N: noFunction,
        });
    };
    api.map = api.mapY;
    api.flatMap = api.flatMapY;
    return api;
}
exports.either = either;
exports.maybe = either;
function Resource(name) {
    var Resource = type(name, {
        Loading: function (_) { return _; },
        Loaded: function (_) { return _; },
        Error: function (_) { return _; },
        Empty: function (_) { return _; },
    });
    return Resource;
}
exports.Resource = Resource;
