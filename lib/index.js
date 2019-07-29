const Skip = {
    length: true
    , prototype: true
    , name: true
}

const o = (f, g) => x => f(g(x))
// istanbul ignore next
const noop = () => {}

function boundToString(){
    return toString(this)
}

function caseTypeName(caseInstance){
    return caseInstance.type
}

function valueCaseInstance(typeName, caseName, value){
    return { 
        type: typeName, 
        case: caseName, 
        value,
        toString: boundToString
    }
}

function emptyCaseInstance(typeName, caseName){
    return { 
        type: typeName, 
        case: caseName,
        toString: boundToString
    }
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

const tagged = name => o =>
    Object.keys(o)
        .map(k => [k, o[k]])
        .reduce(
            (p, [k, ks]) => {

                const of = value => {

                    const badValue =
                        ks.length > 0
                        && (
                            value == null
                            || typeof value != 'object'
                        )

                    if (badValue) {
                        throw new TypeError(
                            k + ' expects {' + ks.join(', ') + '} but received: '
                            + value
                        )
                    }

                    const missingValues =
                        ks.filter(
                            k => !(k in value)
                        )

                    if (missingValues.length) {
                        throw new TypeError(
                            k + ' is missing expected values: '
                            + missingValues.join(',')
                        )
                    }
                    return ks.length == 0
                        ? emptyCaseInstance(name, k)
                        : valueCaseInstance(name, k, value)
                }

                p[k] = of

                return p
            }
            , { name }
        )

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
        const mapT = map(T) 
        
        return visitor => {
            assertValidVisitor({ context: 'map', visitor })
            return mapT({
                Y: visitor,
                N: noop
            })
        }
    },
    chain: T => {
        const chainT = chain(T) 
        
        return visitor => {
            assertValidVisitor({ context: 'chain', visitor })
            
            return chainT({
                Y: visitor,
                N: noop
            })
        }
    }
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
        , chain: yn.chain(T)
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
    }
}

function getCases(T) {
    return Object.getOwnPropertyNames(T)
        .filter(function (o) {
            return o[0] == o[0].toUpperCase()
        })
        .filter(function (x) {
            return !(x in Skip)
        })
}

function toString(x) {
    if (x == null) {
        return 'null'
    } else if (caseTypeName(x) && caseName(x)) {
        return [
            caseTypeName(x),'.',caseName(x),'(',
               'value' in x ? toString(x.value) : '',
            ')'
        ]
        .join('')
    } else if ( typeof x === 'string' ) {
        return '"'+x+'"'
    } else {
        const out = x.toString()
        if ( out === '[object Object]' ){
            return JSON.stringify(x)
        } else {
            return out
        }
    }
}

const StaticSumTypeError =
    tagged('StaticSumTypeError')({
        ExtraCases: ['extraKeys']
        , MissingCases: ['missingKeys']
        , InstanceNull: ['T']
        , InstanceWrongType: ['T', 'x']
        , InstanceShapeInvalid: ['T', 'x']
        , VisitorNotAFunction: ['context', 'visitor']
        , NotAType: ['context', 'T']
        , CasesShapeInvalid: ['T', 'x']
    })

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

const map = T => {
    const foldT = fold(T)

    return cases => {
        const foldCases = foldT(cases)
        return Ma => {
            assertValidCase(T, Ma)
            if( 'value' in Ma ){

                const value = foldCases(Ma)

                return valueCaseInstance(
                    caseTypeName(Ma),
                    caseName(Ma),
                    value
                )
            } else {
                return Ma
            }
        }
    }
}


const chain = T => {
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
const Either = maybe('stags.Either')

export {
    fold
    , map
    , chain
    , otherwise
    , foldT
    , errMessage
    , StaticSumTypeError
    , tagged
    , maybe
    , either
    , caseName
    , Maybe
    , Either
    , valueCaseInstance
    , emptyCaseInstance
    , getCases
    , sameCase
}
