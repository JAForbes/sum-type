import { isValidCaseFormat } from './index.js'

export function transaction (initialValue, type) {
  let currentState = initialValue(type)

  const assertPrefix = prefix => k => 
    k.substring(0, prefix.length) == prefix ? [k.substring(prefix.length)] : []

  const assertIs = assertPrefix('is')
  const assertSet = assertPrefix('set')
  const assertAssert = assertPrefix('assert')
  const assertIsCase = k => isValidCaseFormat(k) && k in type ? [k] : []
  const assertIsCurrentState = k => currentState.case === k ? [k] : []

  const getCaseValue = k =>
	assertIsCase(k)
	  .flatMap(
		key => assertIsCurrentState(key)
			.map( () => 'value' in currentState ? currentState.value : true )
	  		.concat(null)
      )

  const getIs = key =>
	assertIs(key)
      .flatMap( key => assertIsCurrentState(key).map( () => true ).concat(false) )

  const getSet = key =>
	assertSet(key)
	  .flatMap(
		key => assertIsCase(key).flatMap( () => value => {
			currentState = type[key](value)
			return value
		})
		.concat( () => {})
		.slice(0,1)
      )

  const getAssert = key =>
	assertAssert(key)
	  .flatMap(
		key => assertIsCase(key).flatMap( () => f => 
			currentState.case == key 
				? f(currentState.value) 
				: false
		)
		.concat( () => false )
		.slice(0,1)
      )
	  
  const api = {
	commit(){
	  return currentState
    },
    all(){
        return {
            type,
            currentState,
            initialValue
        }
    },
    rollback(){
        currentState = initialValue
    }
  }

  // eslint-disable-next-line no-undef
  const proxy = new Proxy(api, {
    get(target, key){
		if( key in api ){
			return api[key]
		}
		const any = [
          getIs(key),
          getSet(key), 
          getAssert(key), 
          getCaseValue(key)
        ]
		.find( x => x.length )
		
		return any ? any[0] : undefined
    },
    set(target, key, value){
		return assertIsCase(key).map(
			() => () => currentState = type[key](value)
		)
		.concat( () => {
			throw new TypeError('case: '+key+' could not be found in type: '+type.name)
		})
		.shift()
		.call()
    },
  })

  return proxy
}

export function begin(T, initialValue, f){

    const proxy = transaction(() => initialValue, T)

    const initial = proxy.commit()
    const rollbackErr = new Error('Rollback')
    const rollback = () => {
      throw rollbackErr
    }
    try {
        f(proxy, rollback)
    } catch (err) {
        if( err == rollbackErr ){
            return initial
        } else {
            throw err
        }
        
    } 
    return proxy.commit()
}