/* global Symbol,module */
const T = require('sanctuary-def')
const R = require('ramda')

const AutoPredicate = 
    f => T.NullaryType('['+f.toString()+']', f)

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
        ? T.Array
    : constr === Function 
        ? T.AnyFunction
    : constr
  ) 
};

function BuiltInType(t){
    const str = R.type(t)

    const mapped = mapConstrToFn(t)

    if(mapped != t){
        return mapped
    } else if( str === 'Function' ) {
        return AutoPredicate(t)
    } else {
        return t
    }
}

function Setup({ check, ENV=T.env }){

    const def = 
        T.create({
            checkTypes: check
            ,env: ENV
        })

    const a = T.TypeVariable('a')

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

    function staticCase(options, b, ...args){
        const f = options[b._name]
        if( f ){

            const values = b._keys.map( k => b[k] )
            return f(...[...values,...args])

        } else if (options._) {
            return options._(b)
        } else {
            //caseOn is untyped
            throw new TypeError(
                'Non exhaustive case statement'
            )
        }
    }

    function CaseRecordType(keys, enums){
        return T.RecordType(
            R.mergeAll(
                keys.map(
                    k => ({ 
                        [k]: T.Function(R.values(enums[k]).concat(a))
                    })
                )
            )
        )
    }

    const referencedUnions =
        R.pipe(
            R.values
            , R.unnest
            , R.filter(R.has('@@type'))
        )


    function Type(typeName, _enums, prototype={}){

        /* eslint-disable immutable/no-mutation,immutable/no-let */
        let Type = T.NullaryType(
            typeName
            ,a => a && a['@@type'] == typeName
        )
        /* eslint-enable immutable/no-mutation,immutable/no-let */

        const enums = R.map(
            R.map(
                R.pipe(
                    v => typeof v == 'undefined' 
                        ? Type
                        : v

                    , BuiltInType 
                )
            )
            , _enums
        )
        
        const keys =
            Object.keys(enums)
        
        const placeHolderCase = 
            T.RecordType({
                _: T.Function([Type, a])
            })

        const caseRecordType =
            CaseRecordType(keys,enums)
        
        const caseRecordUnion =
            caseRecordType

        const env = 
            R.uniq(
                ENV.concat(
                    Type
                    , caseRecordUnion
                    , caseRecordType
                    , placeHolderCase
                    , ...referencedUnions(enums)
                )
            )

        const def = T.create({ checkTypes: check, env })

        function boundStaticCase(options){
            /* eslint-disable immutable/no-this */
            return staticCase(options, this)
            /* eslint-enable immutable/no-this */
        }

        const instanceCaseDef = 
            def(
                typeName+'::case'
                ,{}
                ,[ caseRecordUnion, a ]
                ,boundStaticCase
            )

        const flexibleInstanceCase =
            R.ifElse(
                R.has('_')
                ,boundStaticCase
                ,instanceCaseDef
            )

        /* eslint-disable immutable/no-mutation */
        Type.prototype = Object.assign(
            prototype
            ,{
                '@@type': typeName
                ,case: flexibleInstanceCase
                ,env
            }
        )

        Type.prototype.case.toString =
        Type.prototype.case.inspect =
            instanceCaseDef.toString
        
        /* eslint-enable immutable/no-mutation */
        const staticCaseDef =
            def(
                typeName+'.case'
                ,{ }
                ,[ caseRecordUnion, Type, a]
                ,staticCase
            )
        
        const flexibleStaticCase = 
            R.ifElse(
                R.has('_')
                ,staticCase
                ,staticCaseDef
            )
        
        /* eslint-disable immutable/no-mutation */
        Type.case = flexibleStaticCase

        Type.case.toString =
        Type.case.inspect =
            staticCaseDef.toString

        // caseOn cannot be strongly typed because it is variadic
        // if people want to use it they can, but they are on their own
        // expects at least 4 args
        Type.caseOn = R.curryN(3, staticCase)
        /* eslint-enable immutable/no-mutation */

        function objConstructorOf(keys, name){
            return r => 
                Object.assign(
                    Object.create(Type.prototype)
                    , r
                    ,{ _keys: keys 
                    , _name: name
                    , [Symbol.iterator]: createIterator 
                    }

                )
        }

        const constructors =
            keys
                .map(function(k){

                    const type = enums[k]

                    const [keys, _types] =  
                        Array.isArray(type)
                            ? [ R.range(0, type.length), type ]
                            : [ R.keys(type), R.values(type) ]

                    const types =
                        _types.map(
                            t => typeof t === 'undefined' 
                                ? Type
                                : t
                        )

                    const recordType =
                        T.RecordType(
                            R.zipObj(keys,types)
                        )

                    return {
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
                                ,R.compose(
                                    objConstructorOf(keys, k)
                                    ,R.unapply(R.zipObj(keys))
                                )
                            ) 
                    }
                })

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
            , Type
        )

    const Anonymous = 
        def(
            'UnionType.Anonymous'
            ,{}
            ,[T.StrMap(T.Any), T.Any]
            ,function(enums){
                return Type(
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
            ,Type
        )

    return {
        Anonymous
        ,Named
        ,Class
    }
}

/* eslint-disable immutable/no-mutation */
module.exports = Setup