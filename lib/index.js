/* global Symbol,module */
const R = {
    toString: require('ramda/src/toString')
    ,map: require('ramda/src/map')
    ,curryN: require('ramda/src/curryN')
}

const _ = {
    unapply: f => (...xs) => f(xs)
    ,mergeAll: xs =>
        Object.assign({}, ...xs)
    ,values: x =>
        Object.keys(x).map( k => x[k] )
    ,range: (n) =>
        [...Array(n).keys()]
    ,zipObj: a => b =>
        a.reduce(function(p, k, i){
            return Object.assign(p , { [k]: b[i] })
        }, {})
}


const B = (f,g) => (...args) =>
    f(g(...args))

function Setup(T, { checkTypes , _env=[] }){
    const env = T.env.slice()

    function AutoPredicate(f) {
        return T.NullaryType('['+f.toString()+']','', f)
    }

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

        const mapped = mapConstrToFn(t)

        if(mapped != t){
            return mapped
        } else if( typeof t == 'function') {
            return AutoPredicate(t)
        } else {
            return t
        }
    }

    const a = T.Any

    function createIterator() {
        /* eslint-disable immutable/no-this */
        return {
            idx: 0

            ,val: this

            ,next () {
                const keys = this.val._keys;

                return this.idx === keys.length
                    ? {done: true}
                    : {value: this.val[keys[this.idx++]]};
            }
        }
        /* eslint-enable immutable/no-this */
    }

    const staticCaseT = T => function staticCase(options, b, ...args){
        const f = options[b._name]

        if ( !T._test(b) ) {
            throw new TypeError(
                'Value '+R.toString(b)+' is not of type: '
                + T.name
            )
        } else if( f ){
            const values = b._keys.map( k => b[k] )
            return f(...[...values,...args])
        } else if (options._) {
            return options._(b)
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
            _.mergeAll(
                keys.map(
                    k => ({
                        [k]: T.Function(_.values(enums[k]).concat(a))
                    })
                )
            )
        )
    }

    function ObjConstructorOf(cases, prototype){

        const subtypes =
            Object.keys( cases )
                .reduce(function(p, _name){

                    const _keys =
                        Object.keys(cases[_name])

                    return Object.assign(
                        p
                        ,{ [_name]:
                            Object.assign(
                                Object.create(prototype)
                                ,{ _keys
                                , _name
                                , [Symbol.iterator]: createIterator
                                }
                            )
                        }
                    )
                }, {})

        return function objConstructorOf(keys, name){
            return r =>
                Object.assign(
                    Object.create(subtypes[name])
                    , r
                )
        }
    }

    const processRawCases =
        (Type, rawCases) =>
            R.map(
                R.map(
                    B(
                        BuiltInType
                        , v => typeof v == 'undefined'
                            ? Type
                            : v
                    )
                )
                , rawCases
            )

    function CreateCaseConstructor(def, prototype, typeName, cases){

        const objConstructorOf =
            ObjConstructorOf(cases, prototype)

        return function createCaseConstructor(k){

            const type = cases[k]

            const isArray =
                Array.isArray(type)

            const [keys, types] =
                isArray
                    ? [ _.range(type.length), type ]
                    : [ Object.keys(type), _.values(type) ]

            const recordType =
                isArray
                    ? T.RecordType(
                        _.zipObj(keys)(types)
                    )
                    : T.RecordType(type)

            const r = {
                [k+'Of']:
                    def(
                        typeName+'.'+k+'Of'
                        ,{}
                        ,[recordType, recordType]
                        ,objConstructorOf(keys, k)
                    )
                ,[k]:
                    def(
                        typeName+'.'+k
                        ,{}
                        ,types.concat(recordType)
                        ,B(
                            objConstructorOf(keys, k)
                            ,_.unapply(_.zipObj(keys))
                        )
                    )
                ,[k+'RecordType']: recordType
            }

            return r
        }
    }

    env.push(..._env)

    const def =
        T.create({
            checkTypes: checkTypes
            ,env
        })


    function CreateUnionType(typeName, rawCases, prototype={}){

        /* eslint-disable immutable/no-mutation,immutable/no-let */
        let Type = T.NullaryType(
            typeName
            ,''
            ,a => a != null && a['@@type'] == typeName
        )
        /* eslint-enable immutable/no-mutation,immutable/no-let */

        const keys =
            Object.keys(rawCases)

        env.push(Type)

        const staticCase = staticCaseT(Type)

        function boundStaticCase(options){
            /* eslint-disable immutable/no-this */
            return staticCase(options, this)
            /* eslint-enable immutable/no-this */
        }


        const def = T.create({ checkTypes: checkTypes, env })

        const cases =
            processRawCases(Type,rawCases)

        const createCaseConstructor =
            CreateCaseConstructor(
                def
                , prototype
                , typeName
                , cases
            )

        const constructors =
            keys.map(createCaseConstructor)

        const caseRecordType =
            CaseRecordType(keys,cases)

        const instanceCaseDef =
            def(
                typeName+'::case'
                ,{}
                ,[ caseRecordType, a ]
                ,boundStaticCase
            )

        const flexibleInstanceCase = function(o, ...args){
          if (o._){

            //eslint-disable-next-line immutable/no-this
            return boundStaticCase.apply(this, [o, ...args]);
          } else {
            //eslint-disable-next-line immutable/no-this
            return instanceCaseDef.apply(this, [o, ...args]);
          }
        };

        /* eslint-disable immutable/no-mutation */
        Type.prototype = Object.assign(
            prototype
            ,{
                '@@type': typeName
                , case: flexibleInstanceCase
                , env
            }
        )

        Type.prototype.case.toString =
        Type.prototype.case.inspect =
            instanceCaseDef.toString

        /* eslint-enable immutable/no-mutation */
        const staticCaseDef =
            def(
                typeName+'.case'
                ,{}
                ,[ caseRecordType, Type, a]
                ,staticCase
            )

        function flexibleStaticCase(o, ...args){
          if (o._){
            //eslint-disable-next-line immutable/no-this
            return R.curryN(2, staticCase).apply(this, [o, ...args]);
          } else {
            //eslint-disable-next-line immutable/no-this
            return staticCaseDef.apply(this, [o, ...args]);
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

        return Object.assign(
            Type
            ,...constructors
        )
    }

    const Named =
        def(
            'UnionType.Named'
            , {}
            , [T.String, T.StrMap(T.Any), T.Any]
            , CreateUnionType
        )

    const Anonymous =
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

    const Class =
        def(
            'UnionType.Class'
            ,{}
            ,[T.String, T.StrMap(T.Any), T.Object, T.Any]
            ,CreateUnionType
        )

    return {
        Anonymous
        ,Named
        ,Class
    }
}

/* eslint-disable immutable/no-mutation */
module.exports = Setup
