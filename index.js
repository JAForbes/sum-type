/* global Symbol,module */
var T = require('sanctuary-def')
var R = require('ramda')

var env = T.env.slice()

function AutoPredicate
    (f) { return T.NullaryType('['+f.toString()+']','', f) }

function mapConstrToFn(constr) {
  return (
    constr === String
        ? T.String
    : constr === Number
        ? T.Number
    : constr === Boolean
        ? T.Boolean
    : constr === Object
        ? T.Object
    : constr === Array
        ? T.Array(T.Any)
    : constr === Function
        ? T.AnyFunction
    : constr
  )
};

function BuiltInType(t){

    var mapped = mapConstrToFn(t)

    if(mapped != t){
        return mapped
    } else if( R.type(t) === 'Function' ) {
        return AutoPredicate(t)
    } else {
        return t
    }
}

var a = T.Any

function createIterator() {
    /* eslint-disable immutable/no-this */
    return {
        idx: 0

        ,val: this

        ,next: function next () {
            var keys = this.val._keys;

            return this.idx === keys.length
                ? {done: true}
                : {value: this.val[keys[this.idx++]]};
        }
    }
    /* eslint-enable immutable/no-this */
}

function staticCase(options, b){
    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    var f = options[b._name]
    if( f ){

        var values = b._keys.map( function (k) { return b[k]; } )
        return f.apply(void 0, values.concat( args))

    } else if (options._) {
        return options._(b)
    } else if ( b && !b._name ) {
        throw new TypeError(
            'Value was not created using UnionType constructor'
            +' Value: '+R.toString(b)
            +' Cases: '+Object.keys(options).join(' | ')
        )
    } else {
        // caseOn is untyped
        // so this is possible
        throw new TypeError(
            'Non exhaustive case statement Found: '
                + Object.keys(options)
                +'  Needed: '+b._name
        )
    }
}

function CaseRecordType(keys, enums){
    return T.RecordType(
        R.mergeAll(
            keys.map(
                function (k) { return (( obj = {}, obj[k] = T.Function(R.values(enums[k]).concat(a)), obj ))
                  var obj;; }
            )
        )
    )
}

function ObjConstructorOf(prototype){

    return function objConstructorOf(keys, name){
        return function (r) { return Object.assign(
                Object.create(prototype)
                , r
                ,( obj = { _keys: keys
                , _name: name
                }, obj[Symbol.iterator] = createIterator, obj )
            )
              var obj;; }
    }
}

var processRawCases =
    function (Type, rawCases) { return R.map(
            R.map(
                R.pipe(
                    function (v) { return typeof v == 'undefined'
                        ? Type
                        : v; }
                    , BuiltInType
                )
            )
            , rawCases
        ); }

function CreateCaseConstructor(def, prototype, typeName, cases){

    var objConstructorOf =
        ObjConstructorOf(prototype)

    return function createCaseConstructor(k){

        var type = cases[k]

        var isArray =
            Array.isArray(type)

        var ref =
            isArray
                ? [ R.range(0, type.length), type ]
                : [ R.keys(type), R.values(type) ];
        var keys = ref[0];
        var types = ref[1];

        var recordType =
            isArray
                ? T.RecordType(
                    R.zipObj(keys,types)
                )
                : T.RecordType(type)

        var r = {};
        r[k+'Of'] = def(
                    typeName+'.'+k+'Of'
                    ,{}
                    ,[recordType, recordType]
                    ,objConstructorOf(keys, k)
                );
        r[k] = def(
                    typeName+'.'+k
                    ,{}
                    ,types.concat(recordType)
                    ,R.compose(
                        objConstructorOf(keys, k)
                        ,R.unapply(R.zipObj(keys))
                    )
                )

        return r
    }
}


function boundStaticCase(options){
    /* eslint-disable immutable/no-this */
    return staticCase(options, this)
    /* eslint-enable immutable/no-this */
}

function Setup(T, ref){
    var checkTypes = ref.checkTypes;
    var _env = ref._env; if ( _env === void 0 ) _env = [];


    env.push.apply(env, _env)

    var def =
        T.create({
            checkTypes: checkTypes
            ,env: env
        })


    function CreateUnionType(typeName, rawCases, prototype){
        if ( prototype === void 0 ) prototype={};


        /* eslint-disable immutable/no-mutation,immutable/no-let */
        var Type = T.NullaryType(
            typeName
            ,''
            ,function (a) { return a && a['@@type'] == typeName; }
        )
        /* eslint-enable immutable/no-mutation,immutable/no-let */

        var keys =
            Object.keys(rawCases)

        env.push(Type)

        var def = T.create({ checkTypes: checkTypes, env: env })

        var cases =
            processRawCases(Type,rawCases)

        var createCaseConstructor =
            CreateCaseConstructor(
                def
                , prototype
                , typeName
                , cases
            )

        var constructors =
            keys.map(createCaseConstructor)

        var caseRecordType =
            CaseRecordType(keys,cases)

        var instanceCaseDef =
            def(
                typeName+'::case'
                ,{}
                ,[ caseRecordType, a ]
                ,boundStaticCase
            )

        var flexibleInstanceCase = function(o){
          var args = [], len = arguments.length - 1;
          while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

          if (o._){

            //eslint-disable-next-line immutable/no-this
            return boundStaticCase.apply(this, [o ].concat( args));
          } else {
            //eslint-disable-next-line immutable/no-this
            return instanceCaseDef.apply(this, [o ].concat( args));
          }
        };

        /* eslint-disable immutable/no-mutation */
        Type.prototype = Object.assign(
            prototype
            ,{
                '@@type': typeName
                , case: flexibleInstanceCase
                , env: env
            }
        )

        Type.prototype.case.toString =
        Type.prototype.case.inspect =
            instanceCaseDef.toString

        /* eslint-enable immutable/no-mutation */
        var staticCaseDef =
            def(
                typeName+'.case'
                ,{}
                ,[ caseRecordType, Type, a]
                ,staticCase
            )

        function flexibleStaticCase(o){
          var args = [], len = arguments.length - 1;
          while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

          if (o._){
            //eslint-disable-next-line immutable/no-this
            return R.curryN(2, staticCase).apply(this, [o ].concat( args));
          } else {
            //eslint-disable-next-line immutable/no-this
            return staticCaseDef.apply(this, [o ].concat( args));
          }
        };

        /* eslint-disable immutable/no-mutation */
        Type.case = R.curryN(2, flexibleStaticCase)

        Type.case.toString =
        Type.case.inspect =
            staticCaseDef.toString

        // caseOn opts out of typing because I'm
        // not smart enough to do it efficiently
        Type.caseOn = R.curryN(3, staticCase)
        /* eslint-enable immutable/no-mutation */

        return Object.assign.apply(
            Object, [ Type ].concat( constructors )
        )
    }

    var Named =
        def(
            'UnionType.Named'
            , {}
            , [T.String, T.StrMap(T.Any), T.Any]
            , CreateUnionType
        )

    var Anonymous =
        def(
            'UnionType.Anonymous'
            ,{}
            ,[T.StrMap(T.Any), T.Any]
            ,function(enums){
                return CreateUnionType(
                    '('+Object.keys(enums).join(' | ')+')'
                    , enums
                )
            }
        )

    var Class =
        def(
            'UnionType.Class'
            ,{}
            ,[T.String, T.StrMap(T.Any), T.Object, T.Any]
            ,CreateUnionType
        )

    return {
        Anonymous: Anonymous
        ,Named: Named
        ,Class: Class
    }
}

/* eslint-disable immutable/no-mutation */
module.exports = Setup
