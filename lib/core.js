/* globals Symbol */

export const run = (initial, ...fns) => {
	if (fns.length == 0) {
		throw new Error(
			'You must provide an initial value and a non-empty spread of functions.',
		)
	}
	return fns.reduce((p, f) => f(p), initial)
}

export const otherwise = tagNames => f => {
	if (Array.isArray(f)) {
		const sublist = f
		const excess = sublist.filter(x => !tagNames.includes(x))

		if (excess.length) {
			throw new Error(
				'Tags provided do not match original definition.'
					+ '  The tags: ('
					+ excess.join('|')
					+ ') could not be found in the list:'
					+ ' ('
					+ tagNames.join('|')
					+ ')',
			)
		} else {
			return otherwise(sublist)
		}
	} else {
		return tagNames.reduce((p, k) => Object.assign(p, { [k]: f }), {})
	}
}

export const _fold = () => fns => M => fns[M.tag](M.value)

export const pipe = (...fns) => {
	if (fns.length == 0) {
		throw new Error('You must provide a non-empty spread of functions.')
	}
	return initial => run(initial, ...fns)
}

export const repeat = (n, x) => Array(n).fill(x)
export const repeatStr = (n, x) => n > 0 ? repeat(n, x).join('') : ''

export function annotate(visitor, value) {
	const notPrimative = Object(value) === value
	const isNil = value == null
	const isArray = notPrimative && Array.isArray(value)
	const isObject = notPrimative && !isArray
	const isFunction = notPrimative && typeof value === 'function'
	const isPrimative = !notPrimative
	const isStag = isObject && value.type && value.tag
	const valueStag = isStag && 'value' in value
	const emptyStag = isStag && !valueStag
	const isPojo = isObject && value.constructor.name == 'Object'
	const isDate = isObject && value instanceof Date
	const isError = isObject && value instanceof Error
	const isString = typeof value === 'string'

	return visitor({
		notPrimative
		,isPrimative
		,isString
		,isNil
		,isArray
		,isObject
		,isPojo
		,isDate
		,isError
		,value
		,isFunction
		,isStag
		,valueStag
		,emptyStag
	})
}

export const toString = x =>
	annotate(
		(function visitor(indentation) {
			return annotation => {
				const {
					value,
					isPojo,
					isObject,
					isArray,
					isDate,
					isError,
					valueStag,
					emptyStag,
					isString,
					isFunction,
				} = annotation

				const indentChar = ''
				const tab = repeatStr(indentation, indentChar)
				const tabLess = repeatStr(indentation - 1, indentChar)
				const tab2 = repeatStr(indentation + 1, indentChar)
				const newLine = ''

				return valueStag
					? value.type
							+ '.'
							+ value.tag
							+ '('
							+ (typeof value.value === 'undefined'
								? ''
								: annotate(visitor(indentation + 1), value.value))
							+ (indentation > 0 ? newLine + tabLess : '')
							+ newLine
							+ tab
							+ ')'
					: emptyStag
					? value.type + '.' + value.tag + '()'
					: isPojo
					? Object.keys(value).length == 0
						? '{}'
						: run(
								value,
								Object.entries,
								xs =>
									xs.map(
										([key, value]) =>
											newLine
											+ tab2
											+ '"'
											+ key
											+ '":'
											+ annotate(visitor(indentation + 1), value).replace(
												newLine + tab2,
												'',
											),
									),
								strings => newLine + tab + '{' + strings + newLine + tab + '}',
						  )
					: isArray
					? value.length == '0'
						? '[]'
						: newLine
						  + tab
						  + '['
						  + newLine
						  + tab
						  + tab
						  + value.map(x => annotate(visitor(indentation + 1), x)).join(', ')
						  + newLine
						  + tab
						  + ']'
					: isDate
					? 'new ' + value.constructor.name + '("' + value.toISOString() + '")'
					: isError
					? 'new ' + value.constructor.name + '("' + value.message + '")'
					: isFunction
					? value + ''
					: isObject
					? 'new ' + value.constructor.name + '()'
					: isString
					? JSON.stringify(value)
					: '' + value
			}
		})(0),
		x,
	)

export const toJSON = x =>
	annotate(function visitor({ value, isPojo, isArray, valueStag, emptyStag }) {
		const out = valueStag
			? annotate(visitor, value.value)
			: emptyStag
			? null
			: isPojo
			? fromEntries(
					Object.entries(value).map(value => annotate(visitor, value)),
			  )
			: isArray
			? value.map(value => annotate(visitor, value))
			: value

		return out
	}, x)

export function boundToJSON() {
	return toJSON(this)
}

export function boundToString() {
	return toString(this)
}

export function typeName(instance) {
	return instance.type
}

export function tagName(instance) {
	return instance.tag
}

export const proto = {
	toString: boundToString
	,inspect: boundToString
	// , toJSON: boundToJSON
	,[Symbol.for('nodejs.util.inspect.custom')]: boundToString
}

export function valueInstance(type, tag, value) {
	return Object.assign(Object.create(proto), {
		type
		,tag
		,value,
	})
}

export function emptyInstance(type, tag) {
	return Object.assign(Object.create(proto), {
		type
		,tag
	})
}

export const fromEntries = pairs => 
	pairs.reduce((p, [k, v]) => ({ ...p, [k]: v }), {})

export const StaticSumTypeError = [
	'ExtraTags'
	,'MissingTags'
	,'InstanceNull'
	,'InstanceWrongType'
	,'InstanceShapeInvalid'
	,'VisitorNotAFunction'
	,'NotAType'
	,'TagsShapeInvalid'
,].reduce(
	(p, n) => {
		p[n] = value => valueInstance(p.type, n, value)
		p.tags.push(n)
		return p
	},
	{
		type: 'StaticSumTypeError'
		,tags: []
		,traits: {}
	},
)

export function getTags(T) {
	return T.tags
}

export const ErrMessageTags = {
	ExtraTags: function ExtraTags(o) {
		return [
			'Your tag function must have exactly the same'
			,' keys as the type: ' + o.T.type + '. '
			,'The following tags should not have been present:'
			,o.extraKeys.join(', ')
		,].join(' ')
	}
	,MissingTags: function MissingTags(o) {
		return
		;[
			'Your tag function must have exactly the same'
			,'keys as the type: ' + o.T.type + '. The following keys were'
			,'missing:'
			,o.missingKeys.join(', ')
		,].join(' ')
	}

	,InstanceNull: function InstanceNull(o) {
		return 'Null is not a valid member of the type ' + o.T.type
	}

	,InstanceWrongType: function InstanceWrongType(o) {
		return
		;[
			toString(o.x) + ' is not a valid member of the type'
			,o.T.type
			,'which expects the following tags'
			,getTags(o.T).join(' | ')
		,].join(' ')
	}

	,InstanceShapeInvalid: function InstanceShapeInvalid(o) {
		return [
			toString(o.x)
			,'is not a valid Member of the type:'
			,o.T.type + '. '
			,'Please review the definition of ' + o.T.type
		,].join(' ')
	}
	,VisitorNotAFunction: function (o) {
		return (
			o.context
			+ ' expected a visitor function '
			+ ' but instead received '
			+ toString(o.visitor)
		)
	}
	,NotAType: function (o) {
		return (
			o.context
			+ ' expected a Type ({ type: string, tags: string[] })'
			+ ' but received '
			+ toString(o.T)
		)
	}
	,TagsShapeInvalid(T, tags) {
		return (
			'fold('
			+ typeName(T)
			+ ') tags provided were not the right shape.  '
			+ 'Expected { [tag]: f } but received '
			+ toString(tags)
		)
	},
}

export function foldT(getT) {
	const T = getT()
	assertValidType('fold', T)
	return function devCata$T(tags) {
		assertValidCata(T, tags)

		const tagNames = Object.keys(tags)

		const tKeys = getTags(T)

		const xKeys = [
			[tagNames, T]
			,[tKeys, tags]
		,].map(function (t) {
			const xs = t[0]
			const index = t[1]
			return xs.filter(function (x) {
				return !(x in index)
			})
		})

		const extraKeys = xKeys[0]
		const missingKeys = xKeys[1]

		if (missingKeys.length > 0) {
			return handleError(
				Err.MissingTags({ T: T, tags, missingKeys: missingKeys }),
			)
		} else if (extraKeys.length > 0) {
			return handleError(Err.ExtraTags({ T: T, tags, extraKeys: extraKeys }))
		} else {
			return function (x) {
				return beforeFoldEval(T, tags, x) && tags[tagName(x)](x.value)
			}
		}
	}
}

export const errMessage = err => _fold(StaticSumTypeError)(ErrMessageTags)(err)

export function handleError(err) {
	const e = new Error(tagName(err) + ': ' + errMessage(err))
	throw e
}

export const Err = StaticSumTypeError

export function assertValidType(context, T) {
	if (
		T == null
		|| !(
			T != null
			&& typeof T.type == 'string'
			&& Array.isArray(T.tags)
			&& 'traits' in T
		)
	) {
		return handleError(Err.NotAType({ context, T }))
	}
	return null
}

export function assertValidVisitor(o) {
	if (typeof o.visitor != 'function') {
		return handleError(
			Err.VisitorNotAFunction({ context: o.context, visitor: o.visitor }),
		)
	}
	return null
}

export function assertValidTag(T, instance) {
	if (
		!(
			instance != null
			&& typeName(instance) == T.type
			&& getTags(T).includes(tagName(instance))
		)
	) {
		return handleError(
			Err.InstanceShapeInvalid({
				x: instance
				,T: T,
			}),
		)
	}
	return null
}

export function assertValidCata(T, tags) {
	if (tags != null && !Array.isArray(tags) && typeof tags === 'object') {
		return true
	} else {
		const err = Err.TagsShapeInvalid(T, tags)
		return handleError(err)
	}
}

export function beforeFoldEval(T, tags, x) {
	return x == null
		? handleError(
				Err.InstanceNull({
					T: T
					,tags
					,x: x,
				}),
		  )
		: typeName(x) !== T.type
		? handleError(
				Err.InstanceWrongType({
					T: T
					,tags
					,x: x,
				}),
		  )
		: !getTags(T).includes(tagName(x))
		? handleError(
				Err.InstanceShapeInvalid({
					T: T
					,tags
					,x: x,
				}),
		  )
		: true
}

export function fold(T) {
	return foldT(() => T)
}

export const mapAll = T => {
	const foldT = fold(T)

	return tags => {
		const foldTags = foldT(tags)
		return Ma => {
			assertValidTag(T, Ma)
			const value = foldTags(Ma)
			return T[tagName(Ma)](value)
		}
	}
}

export const chainAll = T => {
	const foldT = fold(T)

	return tags => {
		const foldTags = foldT(tags)

		return Ma => {
			beforeFoldEval(T, tags, Ma)
			if ('value' in Ma) {
				const nestedValue = foldTags(Ma)

				return beforeFoldEval(T, tags, nestedValue) && nestedValue
			} else {
				return Ma
			}
		}
	}
}

export const tags = (type, tagNames) => {
	return {
		type
		,traits: {}
		,tags: tagNames
		,...fromEntries(
			tagNames.map(tagName => [
				tagName
				,(...args) =>
					args.length
						? valueInstance(type, tagName, args[0])
						: emptyInstance(type, tagName)
			,]),
		),
	}
}

export function either(type) {
	return tags(type, ['Y', 'N'])
}

export const Either = either('sumType.Either')
