import 
	{ assertValidVisitor
	, chainAll
	, otherwise
	, tagName 
	} 
from './core.js'

export const trait = tag => T => {
	T.traits['sum-type/monad'] = tag

	T.of = T[tag]
	const chainAllT = chainAll(T)

	T.chain = f => {
		assertValidVisitor({ context: 'chain', visitor: f })

		return M => {
			return chainAllT({
				...otherwise(T.tags)(x => T[tagName(M)](x))
				,[tag]: x => f(x),
			})(M)
		}
	}
	return T
}
