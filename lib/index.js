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

export const externalEither = name => 
	run(
		either(name)
		,decorate
		,bifunctor({ left: 'N', right: 'Y' })
		,functor('Y')
		,monad('Y')
	)

export const externalMaybe = name =>
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

export const externalTags = (type, tagNames) => 
	decorate(tags(type, tagNames))

export const decoratedEither = 
	externalEither('sumType.Either')

export const {
	Y,
	N,
	bifold: Ebifold,
	getOr: EgetOr,
	getWith: EgetWith,
	bimap: Ebimap,
	map: Emap,
	mapY: EmapY,
	mapN: EmapN,
	assertY: EassertY,
	assertN: EassertN,
	chainN: EchainN,
	chainY: EchainY,
	tagBy: EtagBy,
	chain: Echain,
	toBoolean: EtoBoolean,
	encase: Eencase,
	fromNullable: EfromNullable,
	all: Eall,
	any: Eany,
	isY: EisY,
	isN: EisN,
	ys: Eys,
	ns: Ens,
	concatWith: EconcatWith,
} = decoratedEither

export const fromNullable = EfromNullable

export { Ebifold as bifold }
export { EgetOr as getOr }
export { EgetWith as getWith }
export { Ebimap as bimap }
export { Emap as map }
export { EmapY as mapY }
export { EmapN as mapN }
export { EassertY as assertY }
export { EassertN as assertN }
export { EchainN as chainN }
export { EchainY as chainY }
export { EtagBy as tagBy }
export { Echain as chain }
export { EtoBoolean as toBoolean }
export { Eencase as encase }
export { Eall as all }
export { Eany as any }
export { EisY as isY }
export { EisN as isN }
export { Eys as ys }
export { Ens as ns }
export { EconcatWith as concatWith }
export { externalEither as either }
export { externalMaybe as maybe }
export { decoratedEither as Either }

export { externalTags as tags }
export { fold }
export { valueInstance }
export { emptyInstance }
export { toString }
export { toJSON }
export { otherwise }
export { tagName }
export { typeName }
export { getTags }
export { pipe }
export { run }
export { decorate }
export { mapAll }
export { chainAll }
export { errMessage }
export { StaticSumTypeError }
export { boundToString }
