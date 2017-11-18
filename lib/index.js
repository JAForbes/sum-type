const R = {
    toString: require('ramda/src/toString')
    ,mergeAll: require('ramda/src/mergeAll')
    ,o: require('ramda/src/o')
    ,values: require('ramda/src/values')
    ,zipObj: require('ramda/src/zipObj')
}

function Setup($, { checkTypes , _env=[] }){
    const Unit = { type: 'JAForbes/sumtype.Builtin', case: 'Unit' }
    const Self = { type: 'JAForbes/sumtype.Builtin', case: 'Self' }

    const env = $.env.slice()

    const a = $.Any

    env.push(..._env)

    const entryDef =
        $.create({
            checkTypes: checkTypes
            ,env
        })


    function Base(typeName, docUrl, caseValueTypes){

        const $Type = $.NullaryType(
            typeName
            ,docUrl
            ,a => a != null 
                && a.type == typeName 
                && a.case in caseValueTypes
        )

        const keys =
            Object.keys(caseValueTypes)

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
                            && x.case in caseValueTypes
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
    
                return {
                    [k]:
                        caseDef(
                            typeName+'.'+k
                            ,{}
                            ,[caseValueTypes[k], caseTypes[k]]
                            ,value => ({
                                value
                                ,case: k
                                ,type: typeName
                            })
                        )
                }
            })

        const $CaseOptions =
            $.RecordType(
                R.mergeAll(
                    keys.map(
                        k => ({
                            [k]: $.Function( [caseValueTypes[k], a] )
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
            ...constructors
            ,{ sanctuaryDef: 
                { $Type
                }
            , name: typeName
            , case: staticCaseDefined
            , toString: staticCaseDefined.toString
            , inspect: staticCaseDefined.toString
            }
        )
    }

    return {
        Base: entryDef(
            'JAForbes/sum-type.Base'
            , {}
            , [$.String, $.String, $.StrMap($.Any), $.Any]
            , Base
        )
        , Value: entryDef(
            'JAForbes/sum-type.Value'
            , {}
            , [$.String, $.StrMap($.Any), $.Any]
            , (typeName, caseValueTypes) => Base(typeName, '', caseValueTypes)
        )
        , Record: entryDef(
            'JAForbes/sum-type.Record'
            , {}
            , [$.String, $.StrMap($.Any), $.Any]
            , (typeName, caseValueTypes) => Base(
                typeName
                , ''
                , R.map($.RecordType, caseValueTypes)
            )
        )
        , Predicated: entryDef(
            'JAForbes/sum-type.Predicated'
            , {}
            , [$.String, $.StrMap($.Any), $.Any]
            , ( typeName, caseValueTypes ) => Base(
                typeName, '', Object.keys.reduce(function(p, n){
                    // eslint-disable-next-line immutable/no-mutation
                    p[n] = $.NullaryType(
                        typeName+'.'+n
                        ,''
                        ,caseValueTypes[n]
                    )
                    return p
                }, {})
            )
        )
        ,Unit
        ,Self
    }
}

/* eslint-disable immutable/no-mutation, no-undef */
module.exports = Setup