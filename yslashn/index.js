function either(type){
	return {
		name: type
		,Y: function Y(value){
			return { type, case: 'Y', value }
		}
		,N: function N(value){
			return { type, case: 'N', value }
		}
	}
}

function maybe(type){
	return {
		name: type
		,Y: function Y(value){
			return { type: type, case: 'Y', value }
		}
		,N: function N(){
			return { type: type, case: 'N' }
		}
	}
}

function nFold(type, cases){
	return cases.reduce(function(p, k){

		// eslint-disable-next-line fp/no-mutation
		p[k] = function(value) {
			return {
				case: k
				,type: type
				,value: value
			}
		}

		return p
	}, { name: type })
}

module.exports = {
	either: either
	,maybe: maybe
	,nFold: nFold
}