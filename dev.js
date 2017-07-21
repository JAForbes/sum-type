var Skip = {
  length: true
  ,prototype: true
  ,name: true
}

function toString(x){
    console.log('toString', x)
  if( x == null ){
    return 'null'
  } else if( x.type && x.case ){
    return x.case.name
      +'('
        + (
          'value' in x 
          ? toString(x.value)
          : x.toString()
        )
        
      +')::'
      +x.type.name
  } else {
    return x.toString()
  }
}

class StaticSumTypeError {
    static TooManyCases(T, cases, extraKeys){
        return {
            case: StaticSumTypeError.TooManyCases
            ,type: StaticSumTypeError
            ,value: { T, cases, extraKeys }
        }
    }

    static TooFewCases(T, cases, extraKeys){
        return {
            case: StaticSumTypeError.TooFewCases
            ,type: StaticSumTypeError
            ,value: { T, cases, extraKeys }
        }
    }

    static InstanceNull(T, cases, x){
        return {
            case: StaticSumTypeError.InstanceNull
            ,type: StaticSumTypeError
            ,value: { x, cases, T }
        }
    }

    static InstanceWrongType(T, cases, x){
        return {
            case: StaticSumTypeError.InstanceWrongType
            ,type: StaticSumTypeError
            ,value: { x, cases, T }
        }
    }

    static InstanceShapeInvalid(T, cases, x){
        return {
            case: StaticSumTypeError.InstanceShapeInvalid
            ,type: StaticSumTypeError
            ,value: { x, cases, T }
        }
    }

    static TooManyArguments(args){
        return {
            case: StaticSumTypeError.TooManyArguments
            ,type: StaticSumTypeError
            ,value: args
        }
    }
}

module.exports = function Dev(handleError){

    var Err = StaticSumTypeError
    var errMessage = console.error
    
    function fold(T){
        
        if( arguments.length > 1 ){
            return handleError(
                Err.TooManyArguments(arguments)
            )
        } else {

            return function devCata$T(cases){
                if( arguments.length > 1 ){
                    return handleError(
                        Err.TooManyArguments(arguments)
                    )
                } else {
                    
                    var caseKeys = 
                        Object.keys(cases)
                        
                    var tKeys = 
                        Object.getOwnPropertyNames(T)
                        .filter(function(x){
                            return !(x in Skip)
                        })
                        
                    var xKeys = [
                        [caseKeys, T]
                        ,[tKeys, cases]
                    ]
                    .map(
                        function([xs, index]){
                            return xs.filter(function(x){
                                return !(x in index)
                            })
                        }
                    )

                    var extraKeys = xKeys[0]
                    var missingKeys = xKeys[1]

            
                    if( arguments.length > 1 ){
                        return handleError(
                            Err.TooManyArguments(arguments)
                        )
                    }
                    if( extraKeys.length > 0 ){
                        return handleError(
                            Err.TooManyCases(T, cases, extraKeys) 
                        ) 
                    } else if (missingKeys.length > 0){
                        return handleError(
                            Err.TooFewCases(T, cases, missingKeys) 
                        )
                    } else {
                        return function(x){
                            
                            return (
                                arguments.length > 1
                                ? handleError(
                                    Err.TooManyArguments()
                                )
                                : x == null
                                    ? handleError(
                                        Err.InstanceNull(
                                            T, cases, x
                                        )
                                    )
                                : x.type.name !== T.name
                                    ? handleError(
                                        Err.InstanceWrongType(
                                            T, cases, x
                                        )
                                    )
                                : !( x.case.name in T )
                                    ? handleError(
                                        Err.InstanceShapeInvalid(
                                            T, cases, x
                                        )
                                    )
                                    : cases[x.case.name](x.value)
                            )
                        }
                    }
                }
            }

        }
    }

    var errMessage = 
        fold(StaticSumTypeError)({

            TooManyCases: function TooManyCases({T, cases, extraKeys}){
                return (
                    [ 'Too Many Cases!'
                    , 'Your case function must have exactly the same number of'
                    , ' keys as the type: '+T.name+'. ' 
                    , 'The following cases should not have been present:'
                    , extraKeys.join(', ') 
                    ].join(' ')
                )
            }

            ,TooFewCases: function TooFewCases({T, cases, extraKeys}){
                return (
                    [ 'Too Few Cases!'
                    , 'Your case function must have exactly the same number of' 
                    , 'keys as the type: ' + T.name + '. The following keys were'
                    , 'missing:'
                    , missingKeys.join(', ') 
                    ]
                )
                .join(' ')
            }

            ,InstanceNull: function InstanceNull({T, cases, x}){
                return (
                    'null is not a valid member of the type '+T.name
                )
            }

            ,InstanceWrongType: function InstanceWrongType({T, cases, x}){
                return (
                    [ toString(x)+' is not a valid member of the type'
                    , T.name
                    , 'which expects the following cases'
                    , Object.keys(cases).join(' | ')
                    ]
                )
                .join(' ')
            }

            ,InstanceShapeInvalid: function InstanceShapeInvalid({T, cases, x}){
                return (
                    [ toString(x)+ ' is a member of the type'
                    , T.name
                    , 'but ' + toString(x) + ' has a case that does not'
                    , 'belong to '+ T.name + '. ' 
                    , 'Please review the definition of '+T.name
                    ]
                    .join(' ')
                )
            }

            ,TooManyArguments: function TooManyArguments(args){
                return 'fold accepts 1 argument at a time but received'
                    + ' '+args.length+'.'
                    + '  Received: '+args.map(toString).join(' ')
            }
        })

    return {
        fold
        ,handleError
        ,errMessage
        ,StaticSumTypeError
    }
}