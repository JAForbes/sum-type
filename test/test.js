const test = require('tape')
const $ = require('sanctuary-def')
const {
  fold: devFold
  , map: devMap
  , StaticSumTypeError
} = require('../modules/fold/dev')(function(e){
  return e
})

const yslashn = require('../modules/yslashn')

const PredicatedLib = require('../modules/predicated/dev')

const { fold: prodCata, map: prodMap } = require('../modules/fold/prod')()

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
    })(o)
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
    ,'InstanceWrongType'
    ,'Fold identifies when a value is of the wrong type'
  )

  t.equals(
    devFold(Maybe, 0).case
    ,'TooManyArguments'
    ,'fold identifies when there are too many arguments level:0'
  )

  t.equals(
    devFold(Maybe)({ Just: () => 1, Nothing: () => 0 }, 1).case
    ,'TooManyArguments'
    ,'fold identifies when there are too many arguments level:1'
  )

  t.equals(
    devFold(Maybe)({ Just: () => 1, Nothing: () => 0 })( Maybe.Just(1), 1 ).case
    ,'TooManyArguments'
    ,'fold identifies when there are too many arguments level:2'
  )

  t.equals(
    maybeToNum( null ).case
    ,'InstanceNull'
    ,'fold identifies when a value is null'
  )

  t.equals(
    maybeToNum({
      type: Maybe.name
      ,case: Loadable.Loaded.name
      ,value: 1
    }).case
    ,'InstanceShapeInvalid'
    ,'fold identifies when a instance has the wrong case key'
  )

  t.equals(
    foldMaybe({
      Just: () => 1
    }).case
    ,'TooFewCases'
    ,'fold detects when there are too few cases provided'
  )

  t.equals(
    foldMaybe({
      Just: () => 1
      ,Nothing: () => 1
      ,Left: () => 1
    }).case
    ,'TooManyCases'
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

test('yslashn', function(t){

  const YNMaybe = yslashn.maybe('Maybe')

  const fromMaybe = (otherwise, f) =>
      devFold( YNMaybe )({
          Y: f
          ,N: () => otherwise
      })

  const y = YNMaybe.Y(10)
  const n = YNMaybe.N()

  t.equals(
    fromMaybe(0, x => x * x ) ( y )
    , 100
  )
  // => 100

  t.equals(
    fromMaybe(0, x => x * x)( n )
    , 0
  )

  // Selected = Y a | N
  const Selected = yslashn.maybe('Selected')

  // Loaded = Y a | N b
  const Loaded = yslashn.either()

  // 50% loaded
  const loading =
      Loaded.N( 50 )

  const complete =
      Loaded.Y( 'hello world' )

  // not selected
  const deselected =
    Selected.N()

  const f =
      devFold ( Selected ) ({
          Y: devFold ( Loaded ) ({
              Y: x => x.toUpperCase()
              ,N: x => x + '% complete'
          })
          ,N: () => 'Please select a thingy'
      })

  t.equals(
    f( loading ).case
    ,'InstanceWrongType'
  )

  t.equals(

    f(
        Selected.Y(
            loading
        )
      )
    ,'50% complete'
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
    ,'Please select a thingy'
  )

  const Credit = yslashn.nFold('Credit', ['Recharge', 'Normal', 'Insufficient'])

  t.equals(
    devFold( Credit )({
      Normal: n => n * n
      ,Recharge: () => 0
      ,Insufficient: () => 0
    })( Credit.Normal(5) )
    ,25
  )


  t.end()
})

test('bifold, bimap, map', function(t){
  const Maybe = yslashn.maybe('Maybe')

  // map is defined in terms of bimap which is defined in terms of bifold
  t.equals(
    devMap (Maybe) ( x => x * x ) ( Maybe.Y(10) ).value
    , 100
  )

  t.equals(
    prodMap (Maybe) ( x => x * x ) ( Maybe.Y(10) ).value
    , 100
  )

  t.equals(
    prodMap (Maybe) ( x => x * x ) ( Maybe.N() ).case
    , 'N'
  )

  t.end()

})