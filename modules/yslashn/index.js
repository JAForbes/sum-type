function either(type) {
	return {
		name: type
		, Y: function Y(value) {
			return { type: type, case: 'Y', value: value }
		}
		, N: function N(value) {
			return { type: type, case: 'N', value: value }
		}
	}
}

function maybe(type) {
	return {
		name: type
		, Y: function Y(value) {
			return { type: type, case: 'Y', value: value }
		}
		, N: function N() {
			return { type: type, case: 'N' }
		}
	}
}

module.exports = {
	either: either
	, maybe: maybe
}