var nFold = require('../yslashn/index.js').nFold
var Skip = {
  length: true
  ,prototype: true
  ,name: true
}

function I(a){
    return a
}

function getCases(T){
    return Object.getOwnPropertyNames(T)
        .filter(function(o){
            return o[0] == o[0].toUpperCase()
        })
        .filter(function(x){
            return !(x in Skip)
        })
}

function toString(x){
  if( x == null ){
    return 'null'
  } else if( x.type && x.case ){
    return x.case
      +'('
        + (
          'value' in x
          ? toString(x.value)
          : x.toString()
        )

      +')::'
      +x.type
  } else {
    return x.toString()
  }
}

var StaticSumTypeError = nFold('StaticSumTypeError', [
    'TooManyCases'
    ,'TooFewCases'
    ,'InstanceNull'
    ,'InstanceWrongType'
    ,'InstanceShapeInvalid'
    ,'TooManyArguments'
])

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

    ,InstanceNull: function InstanceNull(o){
        return (
            'null is not a valid member of the type '+o.name
        )
    }

    ,InstanceWrongType: function InstanceWrongType(o){
        return (
            [ toString(o.x)+' is not a valid member of the type'
            , o.T.name
            , 'which expects the following cases'
            , getCases(o.T).join(' | ')
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
                        getCases(cases)

                    var tKeys =
                        getCases(T)


                    var xKeys = [
                        [caseKeys, T]
                        ,[tKeys, cases]
                    ]
                    .map(
                        function(t){
                            var xs = t[0]
                            var index = t[1]
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
                            Err.TooFewCases({T:T, cases:cases, missingKeys: missingKeys})
                        )
                    } else if (extraKeys.length > 0){
                        return handleError(
                            Err.TooManyCases({T:T, cases:cases, extraKeys:extraKeys})
                        )
                    } else {
                        return function(x){

                            return (
                                arguments.length > 1
                                ? handleError(
                                    Err.TooManyArguments(arguments)
                                )
                                : x == null
                                    ? handleError(
                                        Err.InstanceNull({
                                            T:T, cases:cases, x:x
                                        })
                                    )
                                : x.type !== T.name
                                    ? handleError(
                                        Err.InstanceWrongType({
                                            T:T, cases:cases, x:x
                                        })
                                    )
                                : !( x.case in T )
                                    ? handleError(
                                        Err.InstanceShapeInvalid({
                                            T:T, cases:cases, x:x
                                        })
                                    )
                                    : cases[x.case](x.value)
                            )
                        }
                    }
                }
            }

        }
    }

    var errMessage =
        fold(StaticSumTypeError)(ErrMessageCases)


    function bifold(T){
        return function bifold$T(fb, fa){
            var caseNames =
                getCases(T)

            if( caseNames.length != 2 ){
                throw new TypeError(
                    'You can only bifold when a Type\'s case count=2'
                    +' but '+T.name+' has '+caseNames.length+': '
                    + caseNames.join(' | ')
                )
            }

            // reverse because its customary to fold the failure first
            var ks = caseNames.slice().reverse()
            var kb = ks[0]
            var ka = ks[1]

            var cases = {}
            cases[ka] = fa
            cases[kb] = fb
            return fold (T) (cases)
        }
    }

    function bimap(T){
        return function bimap$T(fb, fa){
            return function(Ta){
                return bifold (T)(
                    function(b){ return T[Ta.case]( fb(b) )}
                    ,function(a){ return T[Ta.case]( fa(a) ) } 
                )(Ta)
            }
        }
    }

    function map(T){
        return function bimap$T(fa){
            return bimap (T) (I, fa)
        }
    }

    return {
        fold: fold
        ,bifold: bifold
        ,bimap: bimap
        ,map: map
        ,handleError: handleError
        ,errMessage: errMessage
        ,StaticSumTypeError: StaticSumTypeError
    }
}