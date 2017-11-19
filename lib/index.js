const R = {
    toString: require('ramda/src/toString')
    ,mergeAll: require('ramda/src/mergeAll')
    ,o: require('ramda/src/o')
    ,values: require('ramda/src/values')
    ,zipObj: require('ramda/src/zipObj')
    ,map: require('ramda/src/map')
    ,equals: require('ramda/src/equals')
}

function Setup($, { checkTypes , _env=[] }){
    
    const Unit = { type: 'JAForbes/sumtype.Builtin', case: 'Unit' }
    
    const env = $.env.slice()

    const a = $.Any

    env.push(..._env)

    const entryDef =
        $.create({
            checkTypes: checkTypes
            ,env
        })

    const Type = (typeName, docUrl, caseValueTypes) =>
        $.NullaryType(
            typeName
            ,docUrl
            ,a => a != null 
                && a.type == typeName 
                && a.case in caseValueTypes
        )

    function BaseWithType($Type, typeName, rawCaseValueTypes){

        const keys =
            Object.keys(rawCaseValueTypes)

        const caseTypes = 
            keys.reduce(function(p, k){
                // eslint-disable-next-line immutable/no-mutation
                p[k] =   
                    $.NullaryType(
                        typeName+'.'+k
                        , ''
                        , x => x != null
                            && x.type == typeName
                            && x.case == k
                            && x.case in rawCaseValueTypes
                    )

                return p
            }, {})
            
        {
            const badCases = 
                keys.filter(function(k){
                    return k[0].toUpperCase() != k[0]
                })
                .join(', ')

            if( badCases != '' ){
                throw new TypeError(
                    typeName +': ' 
                        + 'Case names must begin with a capital letter.  '
                        + 'The following case names failed this requirement: '
                        + badCases + '.  '
                        + 'Please update the definition of your type so all '
                        + 'case names meet this requirement.  '
                )
            }
        }
        
        const caseDef = $.create({ 
            checkTypes: checkTypes
            , env: env.concat($Type) 
        })

        const constructors =
            keys.map(function createCaseConstructor(k){
                
                const isUnit =
                    R.equals(rawCaseValueTypes[k], Unit)

                const ValueType = 
                    isUnit
                        ? $.Undefined
                        : rawCaseValueTypes[k]

                const signature = 
                    isUnit
                        ? [ caseTypes[k] ]
                        : [ rawCaseValueTypes[k], caseTypes[k] ]

                const Of =
                    caseDef(
                        typeName+'.'+k
                        ,{}
                        ,signature
                        , value =>     
                            isUnit 
                                ? { case: k, type: typeName }
                                : { value, case: k, type: typeName }
                    )

                // eslint-disable-next-line immutable/no-mutation
                Of.Type = caseTypes[k]
                // eslint-disable-next-line immutable/no-mutation
                Of.ValueType = ValueType

                return {
                    [k]: Of
                }
            })

        const $CaseOptions =
            $.RecordType(
                R.mergeAll(
                    keys.map(
                        k => ({
                            [k]:
                                R.equals(rawCaseValueTypes[k], Unit)
                                    ? $.Function( [a] )
                                    : $.Function( [rawCaseValueTypes[k], a] )
                        })
                    )
                )
            )
 
        const staticCaseDefined =
            caseDef(
                typeName+'.case'
                ,{}
                ,[ $CaseOptions, $Type, a]
                ,function( options, instance ){
                    return options[ instance.case ]( instance.value )
                }
            )

        return Object.assign(
            $Type
            , ...constructors
            , { name: typeName
            , case: staticCaseDefined
            }
        )
    }

    const Recursive =
        entryDef(
            'JAForbes/sum-type.Context'
            ,{}
            ,[ $.String, $.Function([$.Any, $.Any]), $.Any ]
            , function( typeName, f ){
                const mutableCaseContext = {}
                const $Type = Type(typeName, '', mutableCaseContext)
                const cases = f($Type)
                Object.assign( mutableCaseContext, cases )
                return BaseWithType( $Type, typeName, mutableCaseContext )
            }
        )

    const Value =
        entryDef(
            'JAForbes/sum-type.Value'
            , {}
            , [$.String, $.StrMap($.Any), $.Any]            
            , (typeName, rawCaseValueTypes) => {
                const $Type = Type(typeName, '', rawCaseValueTypes)
                return BaseWithType($Type, typeName, rawCaseValueTypes)
            }
        )

    const Record =
        entryDef(
            'JAForbes/sum-type.Record'
            , {}
            , [$.String, $.StrMap($.Any), $.Any]
            , (typeName, caseValueTypes) => BaseWithType(
                Type(typeName, '', caseValueTypes)
                ,typeName
                , R.map($.RecordType, caseValueTypes)
            )
        )

    const Predicate = 
        fn => $.NullaryType(
            'Predicate :: '+fn.toString()
            ,''
            ,fn 
        )
    

    const SST = 
        entryDef(
            'JAForbes/sum-type.SST'
            , {}
            , [$.Any, $.Any]
            , function(T){
                return $.NullaryType(
                    T.name
                    ,''
                    , x => 
                        x != null
                        && x.type == T.name
                        && x.case in T
                        && x.case[0].toUpperCase() == x.case[0]
                )
            }
        )

    return {
        Value
        ,Record
        ,Recursive
        ,Predicate
        ,Unit
        ,SST
        ,$
    }
}

/* eslint-disable immutable/no-mutation, no-undef */
module.exports = Setup