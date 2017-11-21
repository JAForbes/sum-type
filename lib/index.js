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
                        
                // the actual constructor work after type checking
                const innerOf = value => 
                    isUnit 
                        ? { case: k, type: typeName }
                        : { value, case: k, type: typeName }
                
                // Use sanctuary-def to check types internally
                const checkInput =
                    caseDef(
                        typeName+'.'+k
                        ,{}
                        ,signature
                        , innerOf
                    )

                // Avoid curried constructors
                const Of = (...args) => 
                    !isUnit && args.length == 0
                        ? checkInput(undefined)
                        : checkInput(...args)

                // eslint-disable-next-line immutable/no-mutation
                Of.toString = checkInput.toString

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
                , R.map( 
                    // todo-james check for Builtin instead of Unit 
                    // if we add more sentinels later
                    o => o != Unit 
                        ? $.RecordType(o) 
                        : o
                    , caseValueTypes
                )
            )
        )

    const Predicate = 
        fn => $.NullaryType(
            'Predicate :: '+fn.toString()
            ,''
            ,fn 
        )
    
    return {
        Value
        ,Record
        ,Recursive
        ,Predicate
        ,Unit
        ,$
    }
}

/* eslint-disable immutable/no-mutation, no-undef */
module.exports = Setup