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
          : ''
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
    ,'BifoldNotInferrable'
    ,'NotACaseConstructor'
])

var ErrMessageCases =
    { TooManyCases: function TooManyCases(o){
        return (
            [ 'Your case function must have exactly the same number of'
            , ' keys as the type: '+o.T.name+'. '
            , 'The following cases should not have been present:'
            , o.extraKeys.join(', ')
            ].join(' ')
        )
    }
    ,BifoldNotInferrable: function(o){
        return (
            'You can only bifold when a Type\'s case count=2'
            +' but '+o.T.name+' has '+getCases(o.T).length+': '
            + getCases(o.T).join(' | ')
        )
    }
    ,TooFewCases: function TooFewCases(o){
        return (
            [ 'Your case function must have exactly the same number of'
            , 'keys as the type: ' + o.T.name + '. The following keys were'
            , 'missing:'
            , o.missingKeys.join(', ')
            ]
        )
        .join(' ')
    }

    ,InstanceNull: function InstanceNull(o){
        return (
            'Null is not a valid member of the type '+o.T.name
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
        return [
            toString(o.x)
            , 'is not a valid Member of the type:'
            , o.T.name+'. '
            ,'Please review the definition of '+o.T.name
        ]
        .join(' ')
    }

    ,TooManyArguments: function TooManyArguments(args){
        return 'fold accepts 1 argument at a time but received'
            + ' '+args.length+'.'
            + '  Received: '+Array.from(args).map(toString).join(' ')
    }
    ,NotACaseConstructor: function NotACaseConstructor(o){
        return o.context + ' expected a function that returns a case object'
            + ' but instead received '+toString(o.caseConstructor)
    }
    }


var Err = StaticSumTypeError

function handleError(err){

    var e = new Error(err.case+': '+errMessage(err))
    e.case = err
    throw e
}

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
    var caseNames =
        getCases(T)
    
    if( caseNames.length != 2 ){
        return handleError(   
            Err.BifoldNotInferrable({
                T: T
            })
        )
    }

    return function bifold$T(fb, fa){

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
                function(b){ 
                    return { case: Ta.case, type: T.name, value: fb(b) }
                }
                ,function(a){ 
                    return { case: Ta.case, type: T.name, value: fa(a) }
                } 
            )(Ta)
        }
    }
}

function map(T){
    return function bimap$T(fa){
        return bimap (T) (I, fa)
    }
}

// mapCase ( Loaded.Y ) ( x => x * 100 )
function mapCase(caseConstructor){

    var f = foldCase (caseConstructor)
    return function mapCase$caseConstructor(visitor){
        var g = f(visitor)
        return function mapCase$visitor(Ma){
            return {
                case: Ma.case
                ,value: g(Ma.value)
                ,type: Ma.type
            }
        }
    }
}

// mapCase ( Loaded.Y ) ( x => x * 100 )
function foldCase(caseConstructor){
    
    var err = Err.NotACaseConstructor({
        caseConstructor: caseConstructor
        ,context: mapCase.name
    })
    
    var T = { name: out.name }

    if( typeof caseConstructor != 'function' ){
        return handleError( err )
    }

    var out = caseConstructor()

    if ( !( typeof out.case == 'string' && typeof out.type == 'string') ){
        return handleError( err )
    }

    return function mapCase$caseConstructor(visitor){
        return function mapCase$visitor(Ma){
            if ( Ma == null ){
                return handleError(
                    Err.InstanceNull({ T:T })
                )

            } else if ( Ma.case != out.case || Ma.type != out.type ){
    
                var cases = {}
                cases[out.case] = true
                return handleError(
                    Err.InstanceWrongType({
                        T:T, cases:cases, x:Ma
                    })
                )
            } else {
                return visitor ( Ma.value )
            }
        }
    }
}


module.exports = {
    fold: fold
    ,bifold: bifold
    ,bimap: bimap
    ,map: map
    ,mapCase: mapCase
    ,errMessage: errMessage
    ,StaticSumTypeError: StaticSumTypeError
}
