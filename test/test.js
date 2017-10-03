const test = require('tape')
const $ = require('sanctuary-def')
const {
  fold: devFold
  , StaticSumTypeError
} = require('../fold/dev')(function(e){
  return e
})

const PredicatedLib = require('../predicated/dev')

const { fold: prodCata } = require('../fold/prod')()

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

  static map(f){
    return o => devFold(Maybe) ({
      Just: a => Maybe.Just(f(a))
      ,Nothing: () => Maybe.Nothing()
    })
  }
}

class Loadable {
  static Loaded(x) {
    return {
      value: x
      , case: Loadable.Loaded.name
      , type: Loadable.name
      , toString(){
        return 'Loaded('+x+')'
      }
    }
  }
  static Loading() {
    return {
      of: Loadable.Loading.name
      , type: Loadable.name
      , toString(){
        return 'Loading()'
      }
    }
  }
}

var Maybe2 ={
  name: 'Maybe'
  ,Just(x){
    return {
      value: x
      , case: Maybe2.Just.name
      , type: Maybe2.name
    }
  }
  ,Nothing(){
    return {
      case: Maybe2.Nothing.name
      , type: Maybe2.name
    }
  }
}

var x = Maybe.Just(2)
var y = Loadable.Loaded(x)


test('static-sum-type', function(t){
  const foldMaybe = devFold(Maybe)

  var maybeToNum = foldMaybe({
    Just: () => 1
    ,Nothing: () => 0
  })

  t.equals(
    maybeToNum(Maybe.Just('hi'))
    , 1
    ,'fold can fold valid types'
  )

  t.equals(
    maybeToNum(Maybe2.Just('hey'))
    , 1
    , 'fold can fold different types that meet the spec'
  )

  t.equals(
    maybeToNum(Loadable.Loaded('whatever')).case
    ,StaticSumTypeError.InstanceWrongType
    ,'Fold identifies when a value is of the wrong type'
  )

  t.equals(
    devFold(Maybe, 0).case
    ,StaticSumTypeError.TooManyArguments
    ,'fold identifies when there are too many arguments level:0'
  )

  t.equals(
    devFold(Maybe)({ Just: () => 1, Nothing: () => 0 }, 1).case
    ,StaticSumTypeError.TooManyArguments
    ,'fold identifies when there are too many arguments level:1'
  )

  t.equals(
    devFold(Maybe)({ Just: () => 1, Nothing: () => 0 })( Maybe.Just(1), 1 ).case
    ,StaticSumTypeError.TooManyArguments
    ,'fold identifies when there are too many arguments level:2'
  )

  t.equals(
    maybeToNum( null ).case
    ,StaticSumTypeError.InstanceNull
    ,'fold identifies when a value is null'
  )

  t.equals(
    maybeToNum({
      type: Maybe.name
      ,case: Loadable.Loaded.name
      ,value: 1
    }).case
    ,StaticSumTypeError.InstanceShapeInvalid
    ,'fold identifies when a instance has the wrong case key'
  )

  t.equals(
    foldMaybe({
      Just: () => 1
    }).case
    ,StaticSumTypeError.TooFewCases
    ,'fold detects when there are too few cases provided'
  )

  t.equals(
    foldMaybe({
      Just: () => 1
      ,Nothing: () => 1
      ,Left: () => 1
    }).case
    ,StaticSumTypeError.TooManyCases
    ,'fold detects when there are too few many provided'
  )

  t.equals(
    prodCata(
      Loadable
    )({
      Loaded: () => 1
    })(
      Loadable.Loaded(1)
    )
    ,1
    ,'prodCata ignores errors and blindy tries to do its job'
  )

  const SumTypePred = PredicatedLib(
    x => x != null && x.toString()
    , e => {
      throw new Error(e.message)
    }
  )

  const Shape = SumTypePred('Shape', {
    Rectangle: $.test([], $.RecordType({
      w: $.Number
      ,h: $.Number
    }))
    ,Triangle: $.test([], $.RecordType({
      w: $.Number
      ,h: $.Number
    }))
    ,Circle: x => typeof x == 'number'
  })

  const c = Shape.Circle(2)

  var r = devFold(Shape)({
    Circle: x => x * 2
    ,Rectangle: x => x * 2
    ,Triangle: x => x * 2
  })(
    c
  )
  console.log(r)

  t.end()
})