const R = {
    toString: require('ramda/src/toString')
    ,mergeAll: require('ramda/src/mergeAll')
    ,o: require('ramda/src/o')
    ,values: require('ramda/src/values')
    ,zipObj: require('ramda/src/zipObj')
    ,map: require('ramda/src/map')
}

function Setup($, { checkTypes , _env=[] }){
    
    const Builtin = 
        { name: 'JAForbes/sumtype.Builtin'
        , Unit: 'Unit'
        , Self: 'Self' 
        }

    const Unit = { type: Builtin.name, case: Builtin.Unit }
    const Self = { type: Builtin.name, case: Builtin.Self }

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
                rawCaseValueTypes[k].type == Builtin.name
                
                const isBuiltin =
                    rawCaseValueTypes[k].type == Builtin.name

                const ValueType = 
                    isBuiltin
                        ? $.Undefined
                        : rawCaseValueTypes[k]

                const signature = 
                    isBuiltin
                        ? [ caseTypes[k] ]
                        : [ rawCaseValueTypes[k], caseTypes[k] ]

                const Of =
                    caseDef(
                        typeName+'.'+k
                        ,{}
                        ,signature
                        ,value => ({
                            value
                            ,case: k
                            ,type: typeName
                        })
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
                                rawCaseValueTypes[k].type == Builtin.name
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
            , toString: staticCaseDefined.toString
            , inspect: staticCaseDefined.toString
            }
        )
    }

    const $types =
        R.mergeAll(
            Object.keys($)
                .filter( k => $[k] instanceof $.Any.constructor )
                .map( k => ({ [k]: $[k] }) )
        )

    const builtins = { Unit }

    return {
        Base: entryDef(
            'JAForbes/sum-type.Base'
            , {}
            , [$.String, $.String, $.StrMap($.Any), $.Any]
            , (typeName, url, rawCaseValueTypes) => {
                const $Type = Type(typeName, url, rawCaseValueTypes)

                return BaseWithType($Type, typeName, rawCaseValueTypes)
            }
        )
        , Context: entryDef(
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
        , Value: entryDef(
            'JAForbes/sum-type.Value'
            , {}
            , [$.String, $.StrMap($.Any), $.Any]
            
            , (typeName, rawCaseValueTypes) => {
                
                const $Type = Type(typeName, '', rawCaseValueTypes)

                return BaseWithType($Type, typeName, rawCaseValueTypes)
            }
        )
        , Record: entryDef(
            'JAForbes/sum-type.Record'
            , {}
            , [$.String, $.StrMap($.Any), $.Any]
            , (typeName, caseValueTypes) => BaseWithType(
                Type(typeName, '', caseValueTypes)
                ,typeName
                , R.map($.RecordType, caseValueTypes)
            )
        )
        , Recursive: entryDef(
            'JAForbes/sum-type.Value'
            , {}
            , [$.String, $.Function( [ $.StrMap($.Any), $.Any ] ), $.Any]
            
            , (typeName, rawCaseValueTypesFn) => {
                
                const caseObj = {}

                const $Type = Type(typeName, '', caseObj)

                const returnedCases = rawCaseValueTypesFn(
                    $Type
                )

                Object.assign(caseObj, returnedCases)

                return BaseWithType($Type, typeName, returnedCases)
            }
        )
        ,builtins
        ,b: builtins
        ,$
    }
}

/* eslint-disable immutable/no-mutation, no-undef */
module.exports = Setup