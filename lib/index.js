import 
    { valueInstance
    , emptyInstance
    , typeName
    , getTags
    , tagName
    , fold
    , mapAll
    , chainAll
    , otherwise
    , run
    , pipe
    , toJSON
    , toString
    , errMessage
    , StaticSumTypeError
    , boundToString
    , either
    , tags
    }
from './core.js'

import { trait as bifunctor } from './bifunctor.js'
import { trait as functor } from './functor.js'
import { trait as monad } from './monad.js'
import { trait as decorate } from './decorate.js'

const externalEither = name => 
    run(
        either(name)
        ,decorate
        ,bifunctor({ left: 'N', right: 'Y' })
        ,functor('Y')
        ,monad('Y')
    )

const externalMaybe = name =>
    run(
        name
        ,externalEither
        ,x => {
            const oldN = x.N
            x.N = () => oldN()
            x.traits['sum-type/maybe'] = true
            return x
        }
    )

const externalTags = (type, tagNames) => 
    decorate(tags(type, tagNames))

const decoratedEither = externalEither('T.Either')

const { 
    Y
    , N
    , bifold: Ebifold
    , getOr: EgetOr
    , getWith: EgetWith
    , bimap: Ebimap
    , map: Emap
    , mapY: EmapY
    , mapN: EmapN
    , assertY: EassertY
    , assertN: EassertN
    , chainN: EchainN
    , chainY: EchainY
    , tagBy: EtagBy
    , chain: Echain
    , toBoolean: EtoBoolean
    , encase: Eencase
    , fromNullable: EfromNullable
    , all: Eall
    , any: Eany
    , isY: EisY
    , isN: EisN
    , ys: Eys
    , ns: Ens
    , concatWith: EconcatWith
} = decoratedEither

export {
    fold
    , Y
    , N
    , Ebifold as bifold
    , EgetOr as getOr
    , EgetWith as getWith
    , Ebimap as bimap
    , Emap as map
    , EmapY as mapY
    , EmapN as mapN
    , EassertY as assertY
    , EassertN as assertN
    , EchainN as chainN
    , EchainY as chainY
    , EtagBy as tagBy
    , Echain as chain
    , EtoBoolean as toBoolean
    , Eencase as encase
    , EfromNullable as fromNullable
    , Eall as all
    , Eany as any
    , EisY as isY
    , EisN as isN
    , Eys as ys
    , Ens as ns
    , EconcatWith as concatWith
    , externalEither as either
    , externalMaybe as maybe
    , decoratedEither as Either
    , valueInstance
    , emptyInstance
    , toString
    , toJSON
    , otherwise
    , tagName
    , typeName
    , getTags
    , pipe
    , run
    , externalTags as tags
    , decorate
    , mapAll
    , chainAll
    , errMessage
    , StaticSumTypeError
    , boundToString
}


// migration
export const caseName = tagName
export const getCases = getTags
export const valueCaseInstance = valueInstance
export const emptyCaseInstance = emptyInstance
export const sameCase = (a,b) => 
    tagName(a) === tagName(b)
export const tagged = typeName => def =>
    tags(typeName, Object.keys(def))

export const Maybe = externalMaybe('T.Maybe')