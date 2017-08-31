var Skip = {
  length: true
  ,prototype: true
  ,name: true
}

function toString(x){
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

    static TooFewCases(T, cases, missingKeys){
        return {
            case: StaticSumTypeError.TooFewCases
            ,type: StaticSumTypeError
            ,value: { T, cases, missingKeys }
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

var ErrMessageCases =
    { TooManyCases: function TooManyCases(o){
        return (
            [ 'Too Many Cases!'
            , 'Your case function must have exactly the same number of'
            , ' keys as the type: '+o.T.name+'. '
            , 'The following cases should not have been present:'
            , o.extraKeys.join(', ')
            ].join(' ')
        )
    }

    ,TooFewCases: function TooFewCases(o){
        return (
            [ 'Too Few Cases!'
            , 'Your case function must have exactly the same number of'
            , 'keys as the type: ' + o.T.name + '. The following keys were'
            , 'missing:'
            , o.missingKeys.join(', ')
            ]
        )
        .join(' ')
    }

    ,InstanceNull: function InstanceNull(){
        return (
            'null is not a valid member of the type '+o.name
        )
    }

    ,InstanceWrongType: function InstanceWrongType(o){
        return (
            [ toString(o.x)+' is not a valid member of the type'
            , o.T.name
            , 'which expects the following cases'
            , Object.keys(o.cases).join(' | ')
            ]
        )
        .join(' ')
    }

    ,InstanceShapeInvalid: function InstanceShapeInvalid(o){
        return (
            [ toString(o.x)+ ' is a member of the type'
            , o.T.name
            , 'but ' + toString(o.x) + ' has a case that does not'
            , 'belong to '+ o.T.name + '. '
            , 'Please review the definition of '+o.T.name
            ]
            .join(' ')
        )
    }

    ,TooManyArguments: function TooManyArguments(args){
        return 'fold accepts 1 argument at a time but received'
            + ' '+args.length+'.'
            + '  Received: '+args.map(toString).join(' ')
    }
    }

module.exports = function Dev(handleError){

    var Err = StaticSumTypeError

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
                    if( missingKeys.length > 0 ){
                        return handleError(
                            Err.TooFewCases(T, cases, missingKeys)
                        )
                    } else if (extraKeys.length > 0){
                        return handleError(
                            Err.TooManyCases(T, cases, extraKeys)
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
        fold(StaticSumTypeError)(ErrMessageCases)

    return {
        fold
        ,handleError
        ,errMessage
        ,StaticSumTypeError
    }
}