import test from 'tape'

import {
  fold
  , map
  , tagged
  , maybe
  , either
  , Maybe
  , Either
  , valueCaseInstance
  , emptyCaseInstance
  , caseName
  , otherwise
  , sameCase
} from '../lib/index'

class ClassMaybe {
  static Just(x) {
    return valueCaseInstance(
      ClassMaybe.name,
      ClassMaybe.Just.name,
      x
    )
  }
  static Nothing() {
    return emptyCaseInstance(
      ClassMaybe.name,
      ClassMaybe.Nothing.name
    )
  }

  static map(f) {
    return o => fold(ClassMaybe)({
      Just: a => ClassMaybe.Just(f(a))
      , Nothing: () => ClassMaybe.Nothing()
    })(o)
  }
}

class Loadable {
  static Loaded(x) {
    return valueCaseInstance(
      Loadable.name,
      Loadable.Loaded.name,
      x
    )
  }
  static Loading() {
    return emptyCaseInstance(
      Loadable.name,
      Loadable.Loading.name
    )
  }
}

var ObjMaybe = {
  name: 'Maybe'
  , Just(x) {
    return valueCaseInstance(
      ObjMaybe.name,
      ObjMaybe.Just.name,
      x
    )
  }
  , Nothing() {
    return emptyCaseInstance(
      ObjMaybe.name,
      ObjMaybe.Nothing.name
    )
  }
}

test('stags', function (t) {
  const foldMaybe = fold(ClassMaybe)

  var maybeToNum = foldMaybe({
    Just: () => 1
    , Nothing: () => 0
  })

  t.equals(
    maybeToNum(ClassMaybe.Just('hi'))
    , 1
    , 'fold can fold valid types'
  )

  t.equals(
    maybeToNum(ClassMaybe.Just('hey'))
    , 1
    , 'fold can fold different types that meet the spec'
  )

  t.throws(
    () => maybeToNum(Loadable.Loaded('whatever'))
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
      valueCaseInstance(ClassMaybe.name, Loadable.Loaded.name, 1)
    )
    , /InstanceShapeInvalid/
    , 'fold identifies when a instance has the wrong case key'
  )

  t.throws(
    () => foldMaybe({
      Just: () => 1
    })
    , /MissingCases/
    , 'fold detects when there are too few cases provided'
  )

  t.throws(
    () => foldMaybe({
      Just: () => 1
      , Nothing: () => 1
      , Left: () => 1
    })
    , /ExtraCases/
    , 'fold detects when there are too few many provided'
  )

  t.equals(
    Maybe.Y( Maybe.Y({ a: 1, b: true }) )+'',
    'stags.Maybe.Y(stags.Maybe.Y({"a":1,"b":true}))',
    'toString is useful for nested objects'
  )

  t.equals(
    Maybe.Y( 'hello' )+'',
    'stags.Maybe.Y("hello")',
    'toString is useful with primative strings'
  )

  t.equals(
    Maybe.Y( 1 )+'',
    'stags.Maybe.Y(1)',
    'toString is useful with numbers'
  )

  t.end()
})

test('errors', function (t) {
  const YNMaybe = maybe('Maybe')

  t.throws(
    () => fold(YNMaybe)({
      Y: () => ''
      , N: () => ''
      , A: () => ''
    })
    , /ExtraCases/
    ,'ExtraCases'
  )

  t.throws(
    () => fold(YNMaybe)({
      Y: () => ''
    })
    , /MissingCases/
    , 'MissingCases'
  )

  t.throws(
    () => YNMaybe.getOr(0, x => x)(null)
    , /InstanceNull/
    , 'InstanceNull'
  )

  t.throws(
    () => YNMaybe.getOr(0, x => x)(
      emptyCaseInstance('Maybe', 'Unknown')
    )
    , /InstanceShapeInvalid/
    , 'InstanceShapeInvalid'
  )

  const { N: L } = either('Either')

  t.throws(
    () => YNMaybe.getOr(0, x => x * x)(L(10))
    , /InstanceWrongType/
    , 'InstanceWrongType: Either is not Maybe'
  )

  t.throws(
    () => YNMaybe.getOr(0, x => x * x)(L({ toString() { return 'hello' } }))
    , /InstanceWrongType/
    , 'InstanceWrongType: Object is not maybe'
  )

  t.throws(
    () => YNMaybe.getOr(0, x => x * x)(L(null))
    , /InstanceWrongType/
    , 'InstanceWrongType: Either of null is not Maybe'
  )

  t.throws(
    () => fold(null)
    ,/NotAType/
    ,'NotAType'
  )

  {
    const T = maybe('Maybe')
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
    () => caseName(f(loading))
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
    tagged('Credit')({
      Recharge: []
      , Normal: ['n']
      , Insufficient: []
    })

  t.equals(
    fold(Credit)({
      Normal: ({ n }) => n * n
      , Recharge: () => 0
      , Insufficient: () => 0
    })(Credit.Normal({ n: 5 }))
    , 25
  )

  t.end()
})

test('bifold, bimap, map, chain', function (t) {
  const Maybe = maybe('Maybe')
  const Either = maybe('Either')

  
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
    caseName(Maybe.map(x => x * x)(Maybe.N()))
    , 'N'
  )

  t.deepEquals(
    Maybe.chain(x => Maybe.Y(x))(Maybe.Y(10))
    , valueCaseInstance('Maybe', 'Y', 10)
  )

  t.deepEquals(
    Maybe.chain(() => Maybe.N())(Maybe.Y(10))
    , emptyCaseInstance('Maybe', 'N')
  )

  t.deepEquals(
    Maybe.chain(() => Maybe.Y('does not happen'))(Maybe.N())
    , emptyCaseInstance('Maybe', 'N')
  )

  t.deepEquals(
    Maybe.chain(x => x)(Maybe.N())
    , emptyCaseInstance('Maybe', 'N')
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
      emptyCaseInstance('Maybe', 'Bad')
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
    ..._(() => otherwise),
    Y: f
  })

  const foldN = (otherwise, f) => Maybe.fold({
    ..._(() => otherwise),
    N: f
  })

  const chainY = f => Ma => Maybe.fold({
    ..._( () => Ma ),
    Y: f
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
    ,'chainCase happy path'
  )

  t.deepEquals(
    chainY
      (x => Maybe.Y(x))
      (Maybe.N())
    , Maybe.N()
    ,'chainCase unhappy path'
  )

  t.equals(
    map (Maybe) ({
      ..._( () => 'No' ),
      Y: () => 'Yes'
    }) 
    ( Maybe.Y() )
    + ''
    , 'Maybe.Y("Yes")'
  )

  t.equals(
    map (Maybe) ({
      ..._( () => 'No' ),
      Y: () => 'Yes'
    }) 
    ( Maybe.N() )
    + ''
    , 'Maybe.N()'
  )

  t.equals(
    caseName(Maybe.map(x => x * x)(Maybe.N()))
    , 'N'
  )

  const validFold = {
    N: () => 'No',
    Y: () => 'Yes'
  }

  ;
  [ [() => map(Maybe)(null), /CasesShapeInvalid/]
  , [() => map(Maybe)(validFold)(null), /InstanceShapeInvalid/]
  , [() => map(Maybe)(validFold)(Loaded.N()), /InstanceShapeInvalid/]
  ]
  .forEach(([f, pattern]) => t.throws(f, pattern, f + ''))

  t.end()

})

test('tagged', t => {
  const T = tagged('T')({
    A: ['a'],
    B: []
  })

  t.throws(
    () => T.A()
    , /A expects {a} but received: undefined/
  )

  t.throws(
    () => T.A({})
    , /A is missing expected values: a/
  )

  const b1 = T.B(1, 2, 3).value
  const b2 = T.B({}).value
  const b3 = T.B().value

  t.equals(
    JSON.stringify({ b1, b2, b3 })
    , JSON.stringify({})
  )

  t.end()
})

test('sameCase, foldSameCase', t => {
  const a = Maybe.Y(100)
  const b = Maybe.Y(200)
  const A = Either.Y(100)

  t.equals(
    sameCase(Maybe)(a,b),
    true,
    'sameCase affirmative'
  )

  t.equals(
    sameCase(Maybe)(a,b),
    true,
    'sameCase negative'
  )

  t.throws(
    () => sameCase(Either)(A,b),
    '/InstanceShapeInvalid/',
    'sameCase different types'
  )

  t.end()
})