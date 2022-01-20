import test from 'tape'

import {
	fold
	, valueInstance
	, emptyInstance
	, Y
	, Either

	, either
	, maybe
	, tagName
	, otherwise
	, run
	, pipe
	, decorate
	, toString
	, toJSON
	, tags
} from '../lib/index.js'

let ObjMaybe = {
	type: 'Maybe'
	, tags: ['Just', 'Nothing']
	, traits: {}
	, Just(x) {
		return valueInstance(
			ObjMaybe.type,
			ObjMaybe.Just.name,
			x
		)
	}
	, Nothing() {
		return emptyInstance(
			ObjMaybe.type,
			ObjMaybe.Nothing.name
		)
	}
}

test('sum-type', function (t) {
	const foldMaybe = fold(ObjMaybe)

	let maybeToNum = foldMaybe({
		Just: () => 1
		, Nothing: () => 0
	})

	t.equals(
		maybeToNum(ObjMaybe.Just('hi'))
		, 1
		, 'fold can fold valid types'
	)

	t.equals(
		maybeToNum(ObjMaybe.Just('hey'))
		, 1
		, 'fold can fold different types'
	)

	t.throws(
		() => maybeToNum(Y('whatever'))
		, /InstanceWrongType/
		, 'fold detects when instance of the wrong type'
	)

	t.throws(
		() => maybeToNum(null)
		, /InstanceNull/
		, 'fold identifies when a value is null'
	)

	t.throws(
		() => maybeToNum(
			valueInstance('Maybe', 'badkey', 1)
		)
		, /InstanceShapeInvalid/
		, 'fold identifies when a instance has the wrong tag key'
	)

	t.throws(
		() => foldMaybe({
			Just: () => 1
		})
		, /MissingTags/
		, 'fold detects when there are too few tags provided'
	)

	t.throws(
		() => foldMaybe({
			Just: () => 1
			, Nothing: () => 1
			, Left: () => 1
		})
		, /ExtraTags/
		, 'fold detects when there are too few many provided'
	)

	t.equals(
		Either.Y(undefined)+'',
		'sumType.Either.Y()',
		'types with a value of undefined are rendered as ()'
	)


	t.equals(
		toJSON(Either.Y(1))
		,1
		,'toJSON extracts the value'
	)
	
	t.equals(
		toJSON(Either.N())
		,null
		,'toJSON converts N to null'
	)

	{
		class MyClass {}
		t.equals(
			Either.Y( new MyClass() )+'',
			'sumType.Either.Y(new MyClass())',
			'Renders custom object types'
		)
	}

	t.equals(
		Either.Y( Either.Y({ a: 1, b: true }) )+'',
		'sumType.Either.Y(sumType.Either.Y({"a":1,"b":true}))',
		'toString is useful for nested objects'
	)

	t.equals(
		Either.Y( 'hello' )+'',
		'sumType.Either.Y("hello")',
		'toString is useful with primative strings'
	)

	t.equals(
		Either.Y( 1 )+'',
		'sumType.Either.Y(1)',
		'toString is useful with numbers'
	)

	t.equals(
		Either.N( new Error('Oh noes!') )+'',
		'sumType.Either.N(new Error("Oh noes!"))',
		'toString is useful with Errors'
	)

	t.end()
})

test('errors', function (t) {
	const YNMaybe = maybe('Maybe')

	{
		const Wow = either('Wow')
		delete Wow.traits
		t.throws(
			() => {
				fold(Wow)
			}
			, /NotAType/
			, 'MissingTrait'
		)
	}
	t.throws(
		() => fold(YNMaybe)({
			Y: () => ''
			, N: () => ''
			, A: () => ''
		})
		, /ExtraTags/
		,'ExtraTags'
	)

	t.throws(
		() => fold(YNMaybe)({
			Y: () => ''
		})
		, /MissingTags/
		, 'MissingTags'
	)

	t.throws(
		() => YNMaybe.getOr(0, x => x)(null)
		, /InstanceShapeInvalid/
		, 'InstanceShapeInvalid'
	)

	t.throws(
		() => YNMaybe.getOr(0, x => x)(
			emptyInstance('Maybe', 'Unknown')
		)
		, /InstanceShapeInvalid/
		, 'InstanceShapeInvalid'
	)

	const { N: L } = either('Either')

	t.throws(
		() => YNMaybe.getOr(0, x => x * x)(L(10))
		, /InstanceShapeInvalid/
		, 'InstanceShapeInvalid'
	)

	t.throws(
		() => YNMaybe.getOr(0, x => x * x)(L({ toString() { return 'hello' } }))
		, /InstanceShapeInvalid/
		, 'InstanceShapeInvalid'
	)

	t.throws(
		() => YNMaybe.getOr(0, x => x * x)(L(null))
		, /InstanceShapeInvalid/
		, 'InstanceShapeInvalid'
	)

	const { Y, N } = Either

	t.equals(
		toString(Either.ys([Y(1), Y(2), N(2)]))
		,toString([1, 2])
		,'Either.ys'
	)
	
	t.equals(
		toString(Either.ns([Y(1), Y(2), N(2), N(3)]))
		,toString([2, 3])
		,'Either.ns'
	)

	t.equals(
		Either.concatWith ( a => b => a + b ) ( Y(1) ) ( Y(2) ) +''
		,Y(3)+''
		,'concatWith Y Y'
	)

	t.equals(
		Either.concatWith ( a => b => a + b ) ( Y(1) ) ( N(2) )+''
		,N(2)+''
		,'concatWith Y N'
	)
	
	t.equals(
		Either.concatWith ( a => b => a + b ) ( N(1) ) ( N(2) )+''
		,N(1)+''
		,'concatWith N N'
	)

	t.throws(
		() => fold(null)
		,/NotAType/
		,'NotAType'
	)

	{
		const T = either('Maybe')
		t.throws(
			() => T.chain( () => null ) (T.Y(1))
			,/InstanceNull/
			,'InstanceNull'
		)
	}


	t.end()
})

test('yslashn', function (t) {

	const YNMaybe = maybe('Maybe')

	const y = YNMaybe.Y(10)
	const n = YNMaybe.N()

	t.equals(
		YNMaybe.getOr(0)(y)
		, 10
		,'getOr with Just'
	)
	// => 100

	t.equals(
		YNMaybe.getOr(0)(n)
		, 0
		,'getOr with Nothing'
	)

	t.equals(
		YNMaybe.bimap(
			() => 100,
			() => 200
		) (YNMaybe.N()) +''
		, YNMaybe.N()+''
		,'bimap N'
	)

	t.equals(
		YNMaybe.bimap(
			() => 100,
			() => 200
		) (YNMaybe.Y()) +''
		, YNMaybe.Y(200) +''
		,'bimap Y'
	)

	t.equals(
		YNMaybe.getWith(0, x => x * x)(y)
		, 100
		,'getWith with Just'
	)
	// => 100

	t.equals(
		YNMaybe.getWith(0, x => x * x)(n)
		, 0
		,'getWith with Nothing'
	)

	// Selected = Y a | N
	const Selected = maybe('Selected')

	// Loaded = Y a | N b
	const Loaded = either('Loaded')

	// 50% loaded
	const loading =
		Loaded.N(50)

	const complete =
		Loaded.Y('hello world')

	// not selected
	const deselected =
		Selected.N()

	const f =
		fold(Selected)({
			Y: fold(Loaded)({
				Y: x => x.toUpperCase()
				, N: x => x + '% complete'
			})
			, N: () => 'Please select a thingy'
		})

	t.throws(
		() => tagName(f(loading))
		, /InstanceWrongType/
	)

	t.equals(

		f(
			Selected.Y(
				loading
			)
		)
		, '50% complete'
	)

	t.equals(
		f(
			Selected.Y(
				complete
			)
		)
		, 'HELLO WORLD'
	)

	t.equals(
		f(
			deselected
		)
		, 'Please select a thingy'
	)

	const Credit =
		tags('Credit', [
			'Recharge'
			, 'Normal'
			, 'Insufficient'
		])

	t.equals(
		fold(Credit)({
			Normal: ({ n }) => n * n
			, Recharge: () => 0
			, Insufficient: () => 0
		})(Credit.Normal({ n: 5 }))
		, 25
	)

	t.equals(
		Selected.fromNullable(null)+'',
		Selected.N()+'',
		'Maybe.fromNullable N'
	)

	
	t.equals(
		Selected.fromNullable(1)+'',
		Selected.Y(1)+'',
		'Maybe.fromNullable Y'
	)

	t.equals(
		Loaded.fromNullable(null)+'',
		Loaded.N(null)+'',
		'Either.fromNullable N'
	)
	
	t.equals(
		Loaded.fromNullable(1)+'',
		Loaded.Y(1)+'',
		'Either.fromNullable Y'
	)

	t.end()
})

test('bifold, bimap, map, chain, tagBy', function (t) {
	const Maybe = maybe('Maybe')
	const Either = either('Either')

	t.equals(typeof Maybe.map, 'function', 'ylashn has a map')
	t.equals(typeof Maybe.bifold, 'function', 'ylashn has a bifold')
	t.equals(typeof Maybe.bimap, 'function', 'ylashn has a bimap')
	t.equals(typeof Maybe.chain, 'function', 'ylashn has a chain')

	// map is defined in terms of bimap which is defined in terms of bifold
	t.equals(
		Maybe.map(x => x * x)(Maybe.Y(10)).value
		, 100
	)

	t.equals(
		tagName(Maybe.map(x => x * x)(Maybe.N()))
		, 'N'
	)

	t.deepEquals(
		Maybe.chain(x => Maybe.Y(x))(Maybe.Y(10))
		, valueInstance('Maybe', 'Y', 10)
	)

	t.deepEquals(
		Maybe.chain(() => Maybe.N())(Maybe.Y(10))
		, emptyInstance('Maybe', 'N')
	)

	t.deepEquals(
		Maybe.chain(() => Maybe.Y('does not happen'))(Maybe.N())
		, emptyInstance('Maybe', 'N')
	)

	t.deepEquals(
		Maybe.chain(x => x)(Maybe.N())
		, emptyInstance('Maybe', 'N')
	)

	t.equals(
		Maybe.map( x => x * 100 ) ( Maybe.Y(10000) )+''
		,Maybe.Y(10000 * 100)+''
		,'Maybe map positive'
	)

	t.equals(
		Maybe.map( x => x * 100 ) ( Maybe.N() )+''
		,Maybe.N()+'',
		'Maybe map negative'
	)
	
	t.equals(
		Either.map( x => x * 100 ) ( Either.Y(10000) )+''
		,Either.Y(10000 * 100)+''
		,'Either map positive'
	)

	t.equals(
		Either.map( x => x * 100 ) ( Either.N(10000) )+''
		,Either.N(10000)+'',
		'Either map negative'
	)

	t.equals(
		Either.chain( x => Either.Y(x * 100) ) ( Either.Y(10000) )+''
		,Either.Y(10000 * 100)+'',
		'Either chain positive'
	)

	t.throws(
		() => Either.chain( x => x * 100 ) ( Either.Y(10000) )+'',
		/InstanceWrongType/,
		'Either chain bad return type'
	)

	t.equals(
		Either.chain( x => x * 100 ) ( Either.N(10000) )+''
		,Either.N(10000)+'',
		'Either chain negative'
	)

	t.equals(
		Either.tagBy('negative', x => x >= 0) (-100)+''
		,Either.N('negative')+''
		,'Either tagBy negative'
	)

	t.equals(
		Either.tagBy('negative', x => x >= 0) (100)+''
		,Either.Y(100)+''
		,'Either tagBy positive'
	)

	t.throws(
		() => Maybe.chain(null)
		, /VisitorNotAFunction/
		,'Maybe.chain visitor not a function'
	)

	t.throws(
		() => Maybe.chain(x => x)(null)
		, /InstanceNull/
		,'Maybe.chain instance null'
	)

	t.throws(
		() => Maybe.chain(x => x)(Either.N(2))
		, /InstanceWrongType/
		, 'Maybe.chain InstanceWrongType'
	)

	t.throws(
		() => Maybe.chain(x => x)(
			emptyInstance('Maybe', 'Bad')
		)
		, /InstanceShapeInvalid/
		, 'Maybe.chain InstanceShapeInvalid'
	)

	t.end()

})


test('otherwise = fold, map, chain', function (t) {
	const Maybe = maybe('Maybe')
	const Loaded = maybe('Loaded')

	const _ = otherwise(['Y', 'N'])

	const foldY = (otherwise, f) => Maybe.fold({
		..._(() => otherwise)
		,Y: f
	})

	const foldN = (otherwise, f) => Maybe.fold({
		..._(() => otherwise)
		,N: f
	})

	const chainY = f => Ma => Maybe.fold({
		..._( () => Ma )
		,Y: f
	}) (Ma)

	t.equals(
		foldY(0, x => x * x)(Maybe.Y(10))
		, 100
		,'foldY'
	)

	t.equals(
		foldN('No', () => 'Yes')(Maybe.N())
		, 'Yes'
		,'foldN'
	)


	t.equals(
		foldY('No', x => x)(Maybe.N())
		, 'No'
		,'foldY with N'
	)

	t.deepEquals(
		chainY
			( x => Maybe.Y(x) )
			(Maybe.Y('Yes'))
		, Maybe.Y('Yes')
		,'chainTag happy path'
	)

	t.deepEquals(
		chainY
			(x => Maybe.Y(x))
			(Maybe.N())
		, Maybe.N()
		,'chainTag unhappy path'
	)

	t.equals(
		Maybe.map(
			() => 'Yes'
		) 
		( Maybe.Y() )
		+ ''
		, 'Maybe.Y("Yes")'
		, 'Maybe map positive'
	)

	t.equals(
		Maybe.map(
			() => 'Yes'
		) 
		( Maybe.N() )
		+ ''
		, 'Maybe.N()'
		, 'Maybe map negative'
	)

	t.equals(
		tagName(Maybe.map(x => x * x)(Maybe.N()))
		, 'N'
		, 'tagName Maybe N'
	)

	const validVisitor = 
		() => 'Yes'
	
	const validFold = {
		Y: () => 'Yes'
		,N: () => 'No'
	}

	;
	[ [() => Maybe.map(null), /VisitorNotAFunction/]
	, [() => Maybe.map(validVisitor)(null), /InstanceShapeInvalid/]
	, [() => Maybe.map(validVisitor)(Loaded.N()), /InstanceShapeInvalid/]
	, [() => fold(Maybe)(null), /TagsShapeInvalid/]
	, [() => fold(Maybe)(validFold)(null), /InstanceNull/]
	, [() => fold(Maybe)(validFold)(Loaded.N), /InstanceWrongType/]
	]
	.forEach(([f, pattern]) => t.throws(f, pattern, f + ''))

	t.end()

})

test('toBoolean', t => {
	const Maybe = maybe('Maybe')
	const a = Maybe.Y(100)
	const b = Maybe.N()
	const A = Either.Y(100)

	t.equals(
		Maybe.toBoolean(a),
		true,
		'toBoolean Y'
	)

	t.equals(
		Maybe.toBoolean(b),
		false,
		'toBoolean N'
	)

	t.throws(
		() => Maybe.toBoolean(A),
		'/InstanceShapeInvalid/',
		'sameTag different types'
	)

	t.end()
})


test('encase', t => {
	const Maybe = maybe('Maybe')
	const maybeJSON = Maybe.encase(JSON.parse)
	const eitherJSON = Either.encase(JSON.parse)

	t.equals(
		maybeJSON(JSON.stringify({ yes: 1 }))+'',
		Maybe.Y({ yes: 1 })+'',
		'encase Maybe Y'
	)
	
	t.equals(
		maybeJSON('<a>No</a>')+'',
		Maybe.N()+'',
		'encase Maybe N'
	)

	t.equals(
		eitherJSON(JSON.stringify({ yes: 1 }))+'',
		Either.Y({ yes: 1 })+'',
		'encase Maybe Y'
	)
	
	t.equals(
		eitherJSON('<a>No</a>')+'',
		'sumType.Either.N(new SyntaxError("Unexpected token < in JSON at position 0"))',
		'encase Either N'
	)

	t.end()
})


test('all / any', t => {
	const Maybe = maybe('Maybe')
	let a = Maybe.Y(3)
	let b = Maybe.Y(2)
	let c = Maybe.N()

	let A = Either.Y(3)
	let B = Either.Y(2)
	let C = Either.N('Error')

	t.equals(
		Maybe.all([a,b])+'',
		Maybe.Y([a,b].map( x => x.value ))+'',
		'Maybe#all affirmative'
	)

	t.equals(
		Maybe.all([a,b,c])+'',
		Maybe.N()+'',
		'Maybe#all negative'
	)

	t.equals(
		Either.all([A,B])+'',
		Either.Y([A,B].map( x => x.value ))+'',
		'Either#all affirmative'
	)

	t.equals(
		Either.all([A,B,C])+'',
		Either.N([C.value])+'',
		'Either#all negative'
	)

	
	t.equals(
		Maybe.any([a,b,c])+'',
		Maybe.Y([a,b].map( x => x.value ))+'',
		'Maybe#any affirmative'
	)

	t.equals(
		Maybe.any([c, c, c])+'',
		Maybe.N()+'',
		'Maybe#any negative'
	)

	t.equals(
		Either.any([A,B,C])+'',
		Either.Y([A,B].map( x => x.value ))+'',
		'Either#any affirmative'
	)

	t.equals(
		Either.any([C,C,C])+'',
		C+'',
		'Either#any negative'
	)

	t.end()
})

test('run / pipe', t => {
	const Maybe = maybe('Maybe')
	t.throws(
		() => run(),
		/non-empty spread of functions/,
		'Empty run throws'
	)

	t.throws(
		() => pipe(),
		/non-empty spread of functions/,
		'Empty pipe throws'
	)

	t.equals(
		run(
			null,
			Maybe.fromNullable,
			Maybe.getOr('It worked')
		),
		'It worked',
		'run works'
	)

	
	t.equals(
		pipe(
			Maybe.fromNullable,
			Maybe.getOr('It worked')
		) (null),
		'It worked',
		'pipe works'
	)
	t.end()
})

test('decorate', t => {

	{
		const oldChainN = Either.chainN
		const newChainN = decorate(Either).chainN

		t.equals(
			oldChainN
			, newChainN
			, 'Decorate only decorates one time'
		)
	}

	{
		t.equals(
			Either.isY( Either.N() ),
			false,
			'isY with N'
		)

		t.equals(
			Either.isN( Either.N() ),
			true,
			'isN with N'
		)
	}

	{
		const good = {}
		const bad = {}

		t.equals(
			Either.mapY( () => bad ) (Either.N(good) ).value,
			good,
			'mapY with N'
		)

		t.equals(
			Either.mapN( () => good ) ( Either.N(bad) ).value,
			good,
			'mapN with N'
		)
	}

	{
		const good = {}
		const bad = {}

		t.equals(
			Either.chainY( () => Either.Y(bad) ) (Either.N(good) ).value,
			good,
			'chainY with N'
		)

		t.equals(
			Either.chainN( () => Either.Y(good) ) ( Either.N(bad) ).value,
			good,
			'chainN with N'
		)
	}

	{
		const good = {}
		const bad = {}

		t.equals(
			Either.getYOr( good ) (Either.N(bad) ),
			good,
			'getYOr with N'
		)

		t.equals(
			Either.getNOr( bad ) ( Either.N(good) ),
			good,
			'getNOr with N'
		)
	}


	{
		const good = {}
		const bad = {}

		t.equals(
			Either.getYWith( good, x => x ) (Either.N(bad) ),
			good,
			'getYWith with N'
		)

		t.equals(
			Either.getNWith(  bad, x => x ) ( Either.N(good) ),
			good,
			'getNWith with N'
		)
	}

	t.end()
})


test('annotate', t => {
	const Maybe = maybe('Maybe')
	t.equals(toString({}), '{}', 'empty object')

	t.equals(toString([]), '[]', 'empty array')

	t.equals(
		toString(new Date('2012-01-01T00:00:00.000Z'))
		, 'new Date("2012-01-01T00:00:00.000Z")'
		, 'Date'
	)

	t.equals(
		toJSON(1),
		1,
		'toJSON(1)'
	)

	t.equals(
		toJSON(Either.Y(1)),
		1,
		'toJSON(Either.Y(1))'
	)

	t.equals(
		toJSON(Maybe.N()),
		null,
		'toJSON(Maybe.N())'
	)

	t.equals(
		toString(toJSON({ a: 1 })),
		'{"a":1}',
		'toJSON({"a":1})'
	)

	t.equals(
		toString(toJSON([1,2,3])),
		'[1, 2, 3]',
		'toJSON([1, 2, 3])'
	)

	t.end()
})

test('tags', t => {
	const State = tags('State', ['None', 'V1'])

	t.equals(
		State.V1(1)+''
		,'State.V1(1)'
		, 'tags value constructor'
	)

	t.equals(
		State.None()+''
		,'State.None()'
		, 'tags null constructor'
	)
	t.end()
})
