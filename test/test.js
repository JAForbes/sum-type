import test from 'tape'

import {
  fold
  , foldCase
  , mapCase
  , chainCase
  , tagged
  , maybe
  , either
} from '../lib/index'

class Maybe {
  static Just(x) {
    return {
      value: x
      , case: Maybe.Just.name
      , type: Maybe.name
    }
  }
  static Nothing() {
    return {
      case: Maybe.Nothing.name
      , type: Maybe.name
    }
  }

  static map(f) {
    return o => fold(Maybe)({
      Just: a => Maybe.Just(f(a))
      , Nothing: () => Maybe.Nothing()
    })(o)
  }
}

class Loadable {
  static Loaded(x) {
    return {
      value: x
      , case: Loadable.Loaded.name
      , type: Loadable.name
      , toString() {
        return 'Loaded(' + x + ')'
      }
    }
  }
  static Loading() {
    return {
      of: Loadable.Loading.name
      , type: Loadable.name
      , toString() {
        return 'Loading()'
      }
    }
  }
}

var Maybe2 = {
  name: 'Maybe'
  , Just(x) {
    return {
      value: x
      , case: Maybe2.Just.name
      , type: Maybe2.name
    }
  }
  , Nothing() {
    return {
      case: Maybe2.Nothing.name
      , type: Maybe2.name
    }
  }
}

test('stags', function (t) {
  const foldMaybe = fold(Maybe)

  var maybeToNum = foldMaybe({
    Just: () => 1
    , Nothing: () => 0
  })

  t.equals(
    maybeToNum(Maybe.Just('hi'))
    , 1
    , 'fold can fold valid types'
  )

  t.equals(
    maybeToNum(Maybe2.Just('hey'))
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
    () => maybeToNum({
      type: Maybe.name
      , case: Loadable.Loaded.name
      , value: 1
    })
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

  t.end()
})

test('errors', function (t) {
  const YNMaybe = maybe('Maybe')

  const fromMaybe = (otherwise, f) =>
    fold(YNMaybe)({
      Y: f
      , N: () => otherwise
    })

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
    () => fromMaybe(0, x => x)(null)
    , /InstanceNull/
    , 'InstanceNull'
  )

  t.throws(
    () => fromMaybe(0, x => x)({ type: 'Maybe', case: 'Unknown' })
    , /InstanceShapeInvalid/
    , 'InstanceShapeInvalid'
  )

  const { N: L } = either('Either')

  t.throws(
    () => fromMaybe(0, x => x * x)(L(10))
    , /InstanceWrongType/
    , 'InstanceWrongType: Either is not Maybe'
  )

  t.throws(
    () => fromMaybe(0, x => x * x)(L({ toString() { return 'hello' } }))
    , /InstanceWrongType/
    , 'InstanceWrongType: Object is not maybe'
  )

  t.throws(
    () => fromMaybe(0, x => x * x)(L(null))
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
      ,/InstanceShapeInvalid:/
      ,'InstanceShapeInvalid'
    )
  }


  t.end()
})

test('yslashn', function (t) {

  const YNMaybe = maybe('Maybe')

  const fromMaybe = (otherwise, f) =>
    YNMaybe.bifold(
      () => otherwise, f
    )

  const y = YNMaybe.Y(10)
  const n = YNMaybe.N()

  t.equals(
    fromMaybe(0, x => x * x)(y)
    , 100
    ,'fromMaybe with Just'
  )
  // => 100

  t.equals(
    fromMaybe(0, x => x * x)(n)
    , 0
    ,'fromMaybe with Nothing'
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
    () => f(loading).case
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
    Maybe.map(x => x * x)(Maybe.N()).case
    , 'N'
  )

  t.deepEquals(
    Maybe.chain(x => Maybe.Y(x))(Maybe.Y(10))
    , { value: 10, case: 'Y', type: 'Maybe' }
  )

  t.deepEquals(
    Maybe.chain(() => Maybe.N())(Maybe.Y(10))
    , { case: 'N', type: 'Maybe' }
  )

  t.deepEquals(
    Maybe.chain(x => x)(Maybe.N())
    , { case: 'N', type: 'Maybe' }
  )

  t.throws(
    () => Maybe.chain(null)
    , /VisitorNotAFunction/
  )

  t.throws(
    () => Maybe.chain(x => x)(null)
    , /InstanceNull/
  )

  t.throws(
    () => Maybe.chain(x => x)(Either.N(2))
    , /InstanceWrongType/
  )

  t.throws(
    () => Maybe.chain(x => x)({ type: 'Maybe', case:'Bad' })
    , /InstanceShapeInvalid/
  )

  t.end()

})


test('foldCase, mapCase, chainCase', function (t) {
  const Maybe = maybe('Maybe')
  const Loaded = maybe('Loaded')

  t.equals(
    foldCase(Maybe.Y)(0, x => x * x)(Maybe.Y(10))
    , 100
  )

  t.equals(
    foldCase(Maybe.N)('No', () => 'Yes')(Maybe.N())
    , 'Yes'
  )


  t.equals(
    foldCase(Maybe.Y)('No', x => x)(Maybe.N())
    , 'No'
  )

  t.deepEquals(
    chainCase
      (Maybe.Y)
      (x => Maybe.Y(x))
      (Maybe.Y('Yes'))
    , Maybe.Y('Yes')
    ,'chainCase happy path'
  )

  t.deepEquals(
    chainCase
      (Maybe.Y)
      (x => Maybe.Y(x))
      (Maybe.N())
    , Maybe.N()
    ,'chainCase unhappy path'
  )

  t.equals(
    mapCase(Maybe.Y)(() => 'Yes')(Maybe.Y()).case
    , 'Y'
  )

  t.equals(
    mapCase(Maybe.Y)(x => x)(Maybe.N()).case
    , 'N'
  )

  t.equals(
    Maybe.map(x => x * x)(Maybe.N()).case
    , 'N'
  )

    ;[
      [() => mapCase(Maybe.Y)(null), /VisitorNotAFunction/]
      , [() => mapCase(Maybe.Y)(x => x)(null), /InstanceNull/]
      , [() => mapCase(Maybe.Y)(x => x)(Loaded.N()), /InstanceWrongType/]
    ]
      .concat(
        [() => mapCase(Maybe)
          , () => mapCase(function () { })
          , () => mapCase(null)
        ]
          .map(f => [f, /NotACaseConstructor/])
      )
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