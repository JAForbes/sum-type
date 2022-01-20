import 
	{ assertValidTag
	, getTags
	, tagName
	, fold
	, mapAll
	, chainAll
	, otherwise
	, Either
	}
from './core.js'

export function trait(T) {
	if (T.traits['sum-type/decorated']) {
		return T
	} else {
		// Do not expose this, they need to define their own _
		const _ = otherwise(getTags(T))

		const mapT = mapAll(T)
		const chainT = chainAll(T)
		const foldT = fold(T)

		getTags(T).forEach(k => {
			const options = [
				[k, k, k]
				,[k, '_' + k, '_' + k + '_']
			,]

			options.forEach(([tag, fnName, wrapFnName]) => {
				T['is' + fnName] =
					T['is' + fnName]
					|| (M => {
						assertValidTag(T, M)
						return tagName(M) === tag
					})

				T['map' + fnName] =
					T['map' + fnName]
					|| (f =>
						mapT({
							..._(x => x)
							,[tag]: f,
						}))

				T['get' + wrapFnName + 'Or'] =
					T['get' + wrapFnName + 'Or']
					|| (otherwise =>
						foldT({
							..._(() => otherwise)
							,[tag]: x => x,
						}))

				T['get' + wrapFnName + 'With'] =
					T['get' + wrapFnName + 'With']
					|| ((otherwise, f) =>
						foldT({
							..._(() => otherwise)
							,[tag]: x => f(x),
						}))

				T['chain' + fnName] =
					T['chain' + fnName]
					|| (f => x =>
						chainT({
							..._(() => x)
							,[tag]: f,
						})(x))

				T['assert' + fnName] =
					T['assert' + fnName]
					|| foldT({
						..._(Either.N)
						,[tag]: Either.Y,
					})

				T[tag.toLowerCase() + 's'] =
					T[tag + 's']
					|| (xs =>
						xs.reduce(
							(p, n) => p.concat(T['is' + tag](n) ? [n.value] : []),
							[],
						))
			})
		})
		T.fold = T.fold || foldT
		T.mapAll = T.mapAll || mapT
		T.chainAll = T.chainAll || chainT

		T.traits['sum-type/decorated'] = true
		return T
	}
}
