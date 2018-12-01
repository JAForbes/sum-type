const Skip = {
    length: true
    , prototype: true
    , name: true
}

const o = (f, g) => x => f(g(x))
const I = x => x

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
        && caseInstance.type == T.name
        && caseInstance.case in T
    )) {
        return handleError(
            Err.InstanceShapeInvalid({
                x: caseInstance
                , T: T
            })
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

const taggy = name => o =>
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

                    return Object.assign({
                        case: k
                        , type: name
                    }, ks.length == 0
                            ? {}
                            : { value }
                    )
                }

                p[k] = of

                return p
            }
            , { name }
        )

const yn = {
    bifold: T => {
        const $fold = fold(T)
        return (N, Y) => $fold({ N, Y })
    },
    bimap: T => {
        const $bifold = yn.bifold(T)
        return (N, Y) => $bifold(
            o(T.N, N)
            , o(T.Y, Y)
        )
    },
    map: T => {
        const $bimap = yn.bimap(T)
        return Y => $bimap(I, Y)
    },
    chain: T => {
        const $fold = fold(T)
        return Y => {
            
            assertValidVisitor({ context: 'chain', visitor: Y })

            const otherwise = {}
            const f = $fold({ N: () => otherwise, Y })

            return Ma => {
                    
                const out = f(Ma)
    
                if (out === otherwise) {
                    return Ma
                } else {
                    assertValidCase(T, out)
                    return out
                }
            }
        }
    }
}


function either(type) {
    const T = {
        name: type
        , Y(value) {
            return { type, case: 'Y', value }
        }
        , N(value) {
            return { type, case: 'N', value }
        },
    }

    return {
        name: T.name
        , Y: T.Y
        , N: T.N
        , fold: fold(T)
        , bifold: yn.bifold(T)
        , bimap: yn.bimap(T)
        , map: yn.map(T)
        , chain: yn.chain(T)
    }
}

function maybe(type) {
    const T = {
        name: type
        , Y: function Y(value) {
            return { type, case: 'Y', value: value }
        }
        , N: function N() {
            return { type, case: 'N' }
        }
    }

    return {
        name: T.name
        , Y: T.Y
        , N: T.N
        , fold: fold(T)
        , bifold: yn.bifold(T)
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
    } else if (x.type && x.case) {
        return x.case
            + '('
            + (
                'value' in x
                    ? toString(x.value)
                    : ''
            )

            + ')::'
            + x.type
    } else {
        return x.toString()
    }
}

const StaticSumTypeError =
    taggy('StaticSumTypeError')({
        TooManyCases: ['extraKeys']
        , TooFewCases: ['missingKeys']
        , InstanceNull: ['T']
        , InstanceWrongType: ['T', 'x']
        , InstanceShapeInvalid: ['T', 'x']
        , NotACaseConstructor: ['context', 'caseConstructor']
        , VisitorNotAFunction: ['context', 'visitor']
        , MapEmptyCase: ['context', 'instance']
        , NotAType: ['context', 'T']
    })

const ErrMessageCases =
    { TooManyCases: function TooManyCases(o) {
        return (
            ['Your case function must have exactly the same'
                , ' keys as the type: ' + o.T.name + '. '
                , 'The following cases should not have been present:'
                , o.extraKeys.join(', ')
            ].join(' ')
        )
    }
    , TooFewCases: function TooFewCases(o) {
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

    , NotACaseConstructor: function NotACaseConstructor(o) {
        return o.context + ' expected a function that returns a case object'
            + ' but instead received ' + toString(o.caseConstructor)
    }
    , VisitorNotAFunction: function (o) {
        return o.context + ' expected a visitor function '
            + ' but instead received ' + toString(o.visitor)
    }
    , MapEmptyCase: function (o) {
        return o.context + ' cannot map over a case that does not have a value:'
            + ' ' + toString(o.instance)
    }
    , NotAType: function (o) {
        return o.context + ' expected a Type ({ name: string ...caseNames })'
            + ' but received ' + toString(o.T)
    }
}


const Err = StaticSumTypeError

function handleError(err) {
    const e = new Error(err.case + ': ' + errMessage(err))
    e.case = err
    throw e
}

function fold(T) {

    assertValidType('fold', T)

    return function devCata$T(cases) {
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
                Err.TooFewCases({ T: T, cases: cases, missingKeys: missingKeys })
            )
        } else if (extraKeys.length > 0) {
            return handleError(
                Err.TooManyCases({ T: T, cases: cases, extraKeys: extraKeys })
            )
        } else {
            return function (x) {

                return (
                    x == null
                        ? handleError(
                            Err.InstanceNull({
                                T: T, cases: cases, x: x
                            })
                        )
                    : x.type !== T.name
                        ? handleError(
                            Err.InstanceWrongType({
                                T: T, cases: cases, x: x
                            })
                        )
                    : !(x.case in T)
                        ? handleError(
                            Err.InstanceShapeInvalid({
                                T: T, cases: cases, x: x
                            })
                        )
                        : cases[x.case](x.value)
                )
            }
        }

    }
}

const errMessage =
    fold(StaticSumTypeError)(ErrMessageCases)

const foldCase = Case => {
    const err = Err.NotACaseConstructor({
        caseConstructor: Case
        , context: mapCase
    })

    if (typeof Case != 'function') {
        return handleError(err)
    }

    const exampleInstance = Case() || {}
    const T = { name: exampleInstance.type }

    if (
        typeof exampleInstance.case != 'string'
        && typeof exampleInstance.type != 'string'
    ) {
        return handleError(err)
    }

    return (otherwise, visitor) => {
        assertValidVisitor({ context: 'foldCase', visitor })

        return Ma => {
            if (Ma == null) {
                return handleError(
                    Err.InstanceNull({ T })
                )
            } else if (Ma.type != exampleInstance.type) {
                const cases = {}
                cases[exampleInstance.case] = true
                return handleError(
                    Err.InstanceWrongType({
                        T: T, cases: cases, x: Ma
                    })
                )
            } else if (Ma.case != exampleInstance.case) {
                return otherwise
            } else {
                return visitor(Ma.value)
            }
        }
    }
}

// mapCase ( Loaded.Y ) ( x => x * 100 )
const mapCase = (Case) => {

    const f = foldCase(Case)

    return visitor => {
        const otherwise = {}
        const g = f(otherwise, visitor)

        return (Ma) => {

            const value = g(Ma)

            if (value == otherwise) {
                return Ma
            } else if ('value' in Ma) {
                return { case: Ma.case, value: value, type: Ma.type }
            } else {
                handleError(
                    Err.MapEmptyCase({ context: 'mapCase', instance: Ma })
                )
            }
        }
    }
}

const chainCase = (Case) => {

    const f = foldCase(Case)
    const example = Case()

    return visitor => {

        const otherwise = {}
        assertValidVisitor({ context: 'chainCase', visitor })
        const g = f(otherwise, visitor)
        const T = { name: example.type, [example.case]: true }

        return Ma => {

            const value = g(Ma)

            assertValidCase(T, value)

            if (value === otherwise) {
                return Ma
            } else {
                return value
            }
        }
    }
}

export {
    fold
    , chainCase
    , mapCase
    , foldCase
    , errMessage
    , StaticSumTypeError
    , taggy
    , maybe
    , either
}
