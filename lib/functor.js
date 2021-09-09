import 
    { assertValidVisitor
    , otherwise
    , mapAll
    } 
from './core'

export const trait = (tag) => T => {
    T.traits['sum-type/functor'] = tag

    T.of = T[tag]
    T.map = f => {
        assertValidVisitor({ context: 'map', visitor: f })
        return mapAll(T) ({
            ...otherwise(T.tags) ( x => x )
            ,[tag]: f
        })
    }

    return T
}
