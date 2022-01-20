import {
	assertValidVisitor
	, assertValidType
	, assertValidTag
	, fold
	, mapAll
	, tagName
}
	from './core.js'

export const all = T => Ms => {
	const bad = Ms.filter(M => !T.toBoolean(M))

	if (bad.length > 0) {
		return T.left(bad.map(x => x.value))
	} else {
		return T.right(Ms.map(T.getOr(null)))
	}
}

export const any = T => Ms =>
	Ms.some(T.toBoolean)
		? T.right(Ms.filter(T.toBoolean).map(T.getOr(null)))
		: Ms.find(M => !T.toBoolean(M))

export const _bifold = T => {
	const $fold = fold(T)
	const { left, right } = T.traits['sum-type/bifunctor']

	return (leftF, rightF) =>
		$fold({ [left]: leftF, [right]: rightF })
}

export const bifold = T => {
	assertValidType('bifold', T)

	return _bifold(T)
}

export const _bimap = T => {
	const _mapAll = mapAll(T)
	const { left, right } = T.traits['sum-type/bifunctor']

	return (leftF, rightF) =>
		_mapAll({
			[left]: leftF, [right]: rightF
		})
}

export const bimap = T => {
	assertValidType('bimap', T)

	return _bimap(T)
}

export const _getOr = T => or =>
	_bifold(T)(
		() => or, x => x
	)

export const getOr = T => {
	assertValidType('getOr', T)

	return or => {
		return M => {
			assertValidTag(T, M)

			return _getOr(T)(or)(M)
		}
	}
}

export const getWith = T => (otherwise, f) =>
	bifold(T)(
		() => otherwise, x => f(x)
	)

export const tagBy = T => {
	fold(T) // just validates T
	return (otherwise, visitor) => a => {
		assertValidVisitor({ context: 'tagBy', visitor })
		return visitor(a) ? T.right(a) : T.left(otherwise)
	}
}

export const toBoolean = T =>
	T.bifold(
		() => false
		, () => true
	)

export const fromNullable = T => x =>
	x == null ? T.left(x) : T.right(x)

export const encase = T => f => x => {
	try {
		return T.right(f(x))
	} catch (e) {
		return T.left(e)
	}
}

export const _concatWith = T => f => A => B => {
	const { left, right } = T.traits['sum-type/bifunctor']

	return tagName(A) == left
		? A
		: tagName(B) == left
		? B
		: T[right](f(A.value)(B.value))
}

export const concatWith = T => {
	assertValidType('concatWith', T)

	return f => {
		assertValidVisitor({
			context: 'concatWith'
			,visitor: f
		})


		return A => {
			assertValidTag(T, A)

			return B => {
				assertValidTag(T, B)
				return _concatWith(T)(f)(A)(B)
			}
		}
	}
}

export const trait = ({ left, right }) => T => {
	T.traits['sum-type/bifunctor'] = { left, right }

	T.left = x => T[left](x)
	T.right = x => T[right](x)
	T.bifold = bifold(T)
	T.bimap = bimap(T)
	T.getOr = getOr(T)
	T.getWith = getWith(T)
	T.tagBy = tagBy(T)
	T.encase = encase(T)
	T.toBoolean = toBoolean(T)
	T.fromNullable = fromNullable(T)
	T.all = all(T)
	T.any = any(T)

	T.concatWith = concatWith(T)

	return T
}
