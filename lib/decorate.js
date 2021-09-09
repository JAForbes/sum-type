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
from './core'


export function trait(T){
    if( T.traits['sum-type/decorated'] ){
        return T
    } else {
        // Do not expose this, they need to define their own _
        const _ = otherwise(getTags(T))

        const mapT = mapAll(T)
        const chainT = chainAll(T)
        const foldT = fold(T)
    
        getTags(T).forEach(
            k => {
                T['is'+k] = T['is'+k] || (M => {
                    assertValidTag(T, M)
                    return tagName(M) === k
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
                    ..._( Either.N )
                    ,[k]: Either.Y
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

        T.traits['sum-type/decorated'] = true
        return T
    }
}
