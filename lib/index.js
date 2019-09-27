/* globals Symbol */

const fromEntries = pairs =>
  pairs.reduce(
    (p, [k,v]) => ({ ...p, [k]: v }), {}
  )

function annotate(visitor, value){
  const notPrimative = Object(value) === value
  const isNil = value == null
  const isArray = notPrimative && Array.isArray(value)
  const isObject = notPrimative && !isArray
  const isPrimative = !notPrimative
  const isStag = isObject && value.type && value.case
  const valueStag = isStag && 'value' in value
  const emptyStag = isStag && !valueStag
  const isPojo = isObject && ({}).toString.call(value) == '[object Object]'
  const isDate = isObject && value instanceof Date
  const isError = isObject && value instanceof Error
  const isString = typeof value === 'string'
  
  return visitor({ 
    notPrimative, 
    isPrimative, 
    isString,
    isNil,
    isArray, 
    isObject, 
    isPojo,
    isDate,
    isError,
    value,
    isStag, 
    valueStag,
    emptyStag
  })
}

const repeat = (n,x) => Array(n).fill(x)
const repeatStr = (n,x) => n > 0 ? repeat(n,x).join('') : ''

const toString = x => 
  annotate((function visitor(indentation){
    return (annotation) => {
    
      const { 
        value
        , isPojo
        , isObject
        , isArray
        , isDate
        , isError
        , valueStag
        , emptyStag
        , isString 
      } = annotation

      const indentChar = ''
      const tab = repeatStr(indentation, indentChar)
      const tabLess = repeatStr(indentation-1, indentChar)
      const tab2 = repeatStr(indentation+1, indentChar)
      const newLine = ''

      return (
        valueStag
          ? value.type+'.'+value.case+'('
              + (typeof value.value === 'undefined'
                ? ''
                : annotate( visitor(indentation+1),  value.value ))
            + ( indentation > 0 ? newLine + tabLess : '' ) + newLine + tab + ')'
        : emptyStag
          ? value.type+'.'+value.case+'()'
        : isPojo 
          ? Object.keys(value).length == 0
            ? '{}'
            : run(
                value
                , Object.entries
                , xs => xs.map(
                    ([key, value]) => 
                        newLine + tab2 + '"' + key +'":'
                            + annotate(visitor(indentation+1), value)
                              .replace(newLine+tab2, '')
                )
                , strings => newLine+tab+'{' + strings + newLine + tab + '}'
            )
      : isArray
        ? value.length == '0' 
          ? '[]'
          : newLine + tab + '['
              + newLine + tab + tab + value.map( 
                x => annotate(visitor(indentation+1), x) 
              )
              .join(', ') 
          + newLine + tab + ']'
      : isDate
        ? 'new ' + value.constructor.name + '("' 
          + value.toISOString() 
        + '")'
      : isError
        ? 'new ' + value.constructor.name + '("' 
          + value.message 
        + '")'
      : isObject
        ? 'new ' + value.constructor.name + '(' + value + ')'
      : isString
        ? JSON.stringify(value)
      : '' + value
    )
  }
})(0), x)

const toJSON = x => 
  annotate(function visitor({
    value, isPojo, isArray, valueStag, emptyStag
  }){
    const out = (
      valueStag
        ? annotate(visitor, value.value)  
      : emptyStag
        ? null
      : isPojo 
        ? fromEntries(
          Object.entries(value).map( value => annotate(visitor, value) )
        )
      : isArray
        ? value.map( value => annotate(visitor, value) )
      : value
    )

    return out
  }, x)

const Skip = {
    length: true
    , prototype: true
    , name: true
}

const o = (f, g) => x => f(g(x))

function boundToString(){
    return toString(this)
}

function caseTypeName(caseInstance){
    return caseInstance.type
}

const proto = 
    { toString: boundToString
    , inspect: boundToString
    , [Symbol.for('nodejs.util.inspect.custom')]: boundToString
    }

function valueCaseInstance(typeName, caseName, value){
    return Object.assign( Object.create(proto), {
        type: typeName, 
        case: caseName, 
        value
    })
}

function emptyCaseInstance(typeName, caseName){
    return Object.assign( Object.create(proto), { 
        type: typeName, 
        case: caseName
    })
}

function caseName(caseInstance){
    return caseInstance.case
}

function sameCase(T){
    assertValidType('sameCase', T)
    return function sameCaseT(a,b){
        assertValidCase(T, a)
        assertValidCase(T, b)
    
        return (
            caseTypeName(a) === caseTypeName(b)
            && caseName(a) == caseName(b)
        )
    }
}

function assertValidType(context, T) {
    if (!(T != null && typeof T.name == 'string')) {
        return handleError(
            Err.NotAType({ context, T })
        )
    }
}

function assertValidCase(T, caseInstance) {
    if (!(
        caseInstance != null
        && caseTypeName(caseInstance) == T.name
        && caseName(caseInstance) in T
    )) {
        return handleError(
            Err.InstanceShapeInvalid({
                x: caseInstance
                , T: T
            })
        )
    }
}

function assertValidCases(T, cases){
    if( 
        !Array.isArray(cases) 
        && cases != null
        && typeof cases == 'object'
    ) {
        return true
    } else {
        const err = Err.CasesShapeInvalid({
            x: cases,
            T
        })
        return handleError(
            err
        )
    }
}

function assertValidVisitor(o) {
    if (typeof o.visitor != 'function') {
        return handleError(
            Err.VisitorNotAFunction({ context: o.context, visitor: o.visitor })
        )
    }
}

const yn = {
    fold,
    bifold: T => {
        const $fold = fold(T)
        return (N, Y) => $fold({ N, Y })
    },
    getOr: T => otherwise =>
        yn.bifold(T) (
            () => otherwise, x => x
        )
    ,
    getWith: T => (otherwise, f) =>
        yn.bifold(T) (
            () => otherwise, x => f(x)
        )
    ,
    bimap: T => {
        const $bifold = yn.bifold(T)
        return (N, Y) => $bifold(
            o(T.N, N)
            , o(T.Y, Y)
        )
    },
    map: T => {
        const mapT = mapAll(T) 
        
        return visitor => {
            assertValidVisitor({ context: 'map', visitor })
            return mapT({
                Y: visitor,
                N: x => x
            })
        }
    },
    tagBy: T => {
        fold(T) // just validates T
        return (otherwise, visitor) => a => {
            assertValidVisitor({ context: 'tagBy', visitor })
            return visitor(a) ? T.Y(a) : T.N(otherwise)
        }
    },
    chain: T => {
        const chainT = chainAll(T) 
        
        return visitor => {
            assertValidVisitor({ context: 'chain', visitor })
            
            return chainT({
                Y: visitor,
                N: T.N
            })
        }
    },
    toBoolean: T => fold(T)({
        Y: () => true,
        N: () => false
    }),
    fromNullable: T => x => x == null ? T.N(x) : T.Y(x),
    encase: T => f => x => {
        try {
            return T.Y(f(x))
        } catch (e) {
            return T.N(e)
        }
    },
    all: T => Ms => {
        const bad = Ms.filter( M => !yn.toBoolean(T) (M) )

        if( bad.length > 0 ) {
            return T.N( bad.map( x => x.value ) )
        } else {
            return T.Y( Ms.map( yn.getOr(T) ( null) ) )
        }
    },

    any: T => Ms =>
        Ms.some( yn.toBoolean(T) )
            ? T.Y( Ms.filter( yn.toBoolean(T)).map( yn.getOr(T)(null) ) )
            : Ms.find( M => !yn.toBoolean(T) (M) ),
    
    concatWith: T => f => A => B => 
        run(
            [A,B]
            ,yn.all(T)
            ,yn.chain(T)(
                ([a,b]) => T.Y( f(a) (b) )
            )
            ,yn.bifold(T)(
                xs => T.N(xs[0]),
                T.Y
            )
        )
}

function either(type) {
    const T = {
        name: type
        , Y(value) {
            return valueCaseInstance(type, 'Y', value)
        }
        , N(value) {
            return valueCaseInstance(type, 'N', value)
        },
    }

    return {
        name: T.name
        , Y: T.Y
        , N: T.N
        , fold: yn.fold(T)
        , bifold: yn.bifold(T)
        , getOr: yn.getOr(T)
        , getWith: yn.getWith(T)
        , bimap: yn.bimap(T)
        , map: yn.map(T)
        , tagBy: yn.tagBy(T)
        , chain: yn.chain(T)
        , toBoolean: yn.toBoolean(T)
        , encase: yn.encase(T)
        , fromNullable: yn.fromNullable(T)
        , all: yn.all(T)
        , any: yn.any(T)
        , concatWith: yn.concatWith(T)
    }
}

function maybe(type) {
    const T = {
        name: type
        , Y(value) {
            return valueCaseInstance(type, 'Y', value)
        }
        , N() {
            return emptyCaseInstance(type, 'N')
        }
    }

    return {
        name: T.name
        , Y: T.Y
        , N: T.N
        , fold: fold(T)
        , bifold: yn.bifold(T)
        , getOr: yn.getOr(T)
        , getWith: yn.getWith(T)
        , bimap: yn.bimap(T)
        , map: yn.map(T)
        , chain: yn.chain(T)
        , toBoolean: yn.toBoolean(T)
        , encase: yn.encase(T)
        , fromNullable: yn.fromNullable(T)
        , all: yn.all(T)
        , any: yn.any(T)
        , concatWith: yn.concatWith(T)
    }
}

function isValidCaseFormat(k){
    return k[0] == k[0].toUpperCase() && !(k in Skip)
}

function getCases(T) {
    return Object.getOwnPropertyNames(T)
        .filter(isValidCaseFormat)
}

const StaticSumTypeError =
    [
        'ExtraCases'
        , 'MissingCases'
        , 'InstanceNull'
        , 'InstanceWrongType'
        , 'InstanceShapeInvalid'
        , 'VisitorNotAFunction'
        , 'NotAType'
        , 'CasesShapeInvalid'
    ]
    .reduce(
        (p,n) => {
            p[n] = value => valueCaseInstance(p.name, n, value)
            return p
        }
        ,{
            name: 'StaticSumTypeError'
        }
    )
    

const ErrMessageCases =
    { ExtraCases: function ExtraCases(o) {
        return (
            ['Your case function must have exactly the same'
                , ' keys as the type: ' + o.T.name + '. '
                , 'The following cases should not have been present:'
                , o.extraKeys.join(', ')
            ].join(' ')
        )
    }
    , MissingCases: function MissingCases(o) {
        return (
            [
                'Your case function must have exactly the same'
                , 'keys as the type: ' + o.T.name + '. The following keys were'
                , 'missing:'
                , o.missingKeys.join(', ')
            ]
        )
            .join(' ')
    }

    , InstanceNull: function InstanceNull(o) {
        return (
            'Null is not a valid member of the type ' + o.T.name
        )
    }

    , InstanceWrongType: function InstanceWrongType(o) {
        return (
            [toString(o.x) + ' is not a valid member of the type'
                , o.T.name
                , 'which expects the following cases'
                , getCases(o.T).join(' | ')
            ]
        )
            .join(' ')
    }

    , InstanceShapeInvalid: function InstanceShapeInvalid(o) {
        return [
            toString(o.x)
            , 'is not a valid Member of the type:'
            , o.T.name + '. '
            , 'Please review the definition of ' + o.T.name
        ]
            .join(' ')
    }
    , VisitorNotAFunction: function (o) {
        return o.context + ' expected a visitor function '
            + ' but instead received ' + toString(o.visitor)
    }
    , NotAType: function (o) {
        return o.context + ' expected a Type ({ name: string ...caseNames })'
            + ' but received ' + toString(o.T)
    }
    , CasesShapeInvalid(T, cases){
        return 'fold('+caseTypeName(T)+') cases provided were not the right shape.  '
            + 'Expected { [caseName]: f } but received ' + toString(cases)
    }
}


const Err = StaticSumTypeError

function handleError(err) {
    const e = new Error(caseName(err) + ': ' + errMessage(err))
    throw e
}


function beforeFoldEval(T, cases, x){
    return x == null
        ? handleError(
            Err.InstanceNull({
                T: T, cases: cases, x: x
            })
        )
    : caseTypeName(x) !== T.name
        ? handleError(
            Err.InstanceWrongType({
                T: T, cases: cases, x: x
            })
        )
    : !(caseName(x) in T)
        ? handleError(
            Err.InstanceShapeInvalid({
                T: T, cases: cases, x: x
            })
        )
        : true
}

function foldT( getT ) {
    const T = getT()
    assertValidType('fold', T)
    return function devCata$T(cases) {
        assertValidCases(T, cases)

        const caseKeys =
            getCases(cases)

        const tKeys =
            getCases(T)


        const xKeys = [
            [caseKeys, T]
            , [tKeys, cases]
        ]
            .map(
                function (t) {
                    const xs = t[0]
                    const index = t[1]
                    return xs.filter(function (x) {
                        return !(x in index)
                    })
                }
            )

        const extraKeys = xKeys[0]
        const missingKeys = xKeys[1]

        if (missingKeys.length > 0) {
            return handleError(
                Err.MissingCases({ T: T, cases: cases, missingKeys: missingKeys })
            )
        } else if (extraKeys.length > 0) {
            return handleError(
                Err.ExtraCases({ T: T, cases: cases, extraKeys: extraKeys })
            )
        } else {
            return function (x) {

                return beforeFoldEval(T, cases, x) 
                    && cases[caseName(x)](x.value)
            }
        }

    }
}


function fold(T) {
    return foldT( () => T )
}

const errMessage =
    fold(StaticSumTypeError)(ErrMessageCases)

const mapAll = T => {
    const foldT = fold(T)

    return cases => {
        const foldCases = foldT(cases)
        return Ma => {
            assertValidCase(T, Ma)
            const value = foldCases(Ma)
            return valueCaseInstance(
                caseTypeName(Ma),
                caseName(Ma),
                value
            )
        }
    }
}


const chainAll = T => {
    const foldT = fold(T)

    return cases => {
        const foldCases = foldT(cases)

        return Ma => {
            beforeFoldEval(
                T, cases, Ma
            )
            if( 'value' in Ma ){

                const nestedValue = foldCases(Ma)

                return beforeFoldEval(
                    T, cases, nestedValue
                )
                && nestedValue
            } else {
                return Ma
            }
        }
    }
}

const otherwise = caseKeys => f => 
    caseKeys.reduce(
        (p,k) => Object.assign(p, { [k]: f }), {}
    )

const Maybe = maybe('stags.Maybe')
const Either = either('stags.Either')

const run = (initial, ...fns) => {
    if( fns.length == 0){
        throw new Error(
            'You must provide an initial value and a non-empty spread of functions.'
        )
    }
    return fns.reduce( (p, f) => f(p), initial )
}

const pipe = (...fns) => {
    if( fns.length == 0){
        throw new Error(
            'You must provide a non-empty spread of functions.'
        )
    }
    return initial => run(initial, ...fns)
}

function decorate(T){
    if( T['stags/decorated'] ){
        return T
    } else {
        // Do not expose this, they need to define their own _
        const _ = otherwise(getCases(T))

        const mapT = mapAll(T)
        const chainT = chainAll(T)
        const foldT = fold(T)
    
        getCases(T).forEach(
            k => {
                T['is'+k] = T['is'+k] || (M => {
                    assertValidCase(T, M)
                    return caseName(M) === k
                })
    
                T['map'+k] = T['map'+k] || (f => mapT({
                    ..._( x => x )
                    ,[k]: f
                }))
    
                T['get'+k+'Or'] = T['get'+k+'Or'] || (otherwise => foldT({
                    ..._( () => otherwise )
                    ,[k]: x => x
                }))
    
                T['get'+k+'With'] = T['get'+k+'With'] || ((otherwise, f) => foldT({
                    ..._( () => otherwise )
                    ,[k]: x => f(x)
                }))
    
                T['chain'+k] = T['chain'+k] || (f => x => 
                    chainT({
                        ..._( () => x )
                        ,[k]: f
                    }) (x))

                T['assert'+k] = T['assert'+k] || (foldT({
                    ..._( Maybe.N )
                    ,[k]: Maybe.Y
                }))

                T[k.toLowerCase()+'s'] = T[k+'s'] || (xs => xs.reduce(
                    (p,n) => p.concat(
                        T['is'+k](n) ? [n.value] : []
                    )
                    , []
                ))
            }
        )
        T.fold = T.fold || foldT
        T.mapAll = T.mapAll || mapT
        T.chainAll = T.chainAll || chainT

        T['stags/decorated'] = true
        return T
    }
}

const decoratedMaybe = decorate(Maybe)
const decoratedEither = decorate(Either)

const { 
    Y
    , N
    , bifold
    , getOr
    , getWith
    , bimap
    , map
    , mapY
    , mapN
    , assertY
    , assertN
    , chainN
    , chainY
    , tagBy
    , chain
    , toBoolean
    , encase
    , fromNullable
    , all
    , any
    , isY
    , isN
    , ys
    , ns
    , concatWith
} = decoratedEither

const externalEither = name => decorate(either(name))
const externalMaybe = name => decorate(maybe(name))

const tags = (typeName, caseNames) => {
    return decorate({
        name: typeName,
        ...fromEntries(
            caseNames.map(
                caseName => [ caseName, (...args) => 
                    args.length 
                        ? valueCaseInstance(typeName, caseName, args[0]) 
                        : emptyCaseInstance(typeName, caseName)
                ]
            )
        )
    })
}

export {
    fold
    
    // Either methods
    , map
    , chain
    , getOr
    , getWith
    , tagBy
    , isY
    , isN
    , mapY
    , mapN
    , assertY
    , assertN
    , chainN
    , chainY
    , all
    , any
    , fromNullable
    , encase
    , toBoolean
    , bimap
    , bifold
    , concatWith
    , Y
    , N
    , run
    , tags
    , ns
    , ys

    , otherwise

    , mapAll
    , chainAll
    , errMessage
    , StaticSumTypeError

    , decoratedMaybe as Maybe
    , decoratedEither as Either
    
    , externalMaybe as maybe
    , externalEither as either
    , caseName
    , valueCaseInstance
    , emptyCaseInstance
    , isValidCaseFormat
    , getCases
    , sameCase
    , toString
    , toJSON
    , boundToString
    , pipe
    , decorate
}
