const test = require('tape')
const $ = require('sanctuary-def')
const {
  fold
  , bifold
  , map
} = require('..')

const yslashn = require('../modules/yslashn')

const SumTypePred = require('../modules/predicated')

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
    return o => fold(Maybe) ({
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
  const foldMaybe = fold(Maybe)

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

  t.throws(
    () => maybeToNum(Loadable.Loaded('whatever'))
    , /InstanceWrongType/
    , 'fold detects when instance of the wrong type'
  )

  t.throws(
    () => fold(Maybe, 0)
    ,/TooManyArguments/
    ,'fold identifies when there are too many arguments level:0'
  )

  t.throws(
    () => fold(Maybe)({ Just: () => 1, Nothing: () => 0 }, 1)
    ,/TooManyArguments/
    ,'fold identifies when there are too many arguments level:1'
  )

  t.throws(
    () => fold(Maybe)({ Just: () => 1, Nothing: () => 0 })( Maybe.Just(1), 1 )
    ,/TooManyArguments/
    ,'fold identifies when there are too many arguments level:2'
  )

  t.throws(
    () => maybeToNum( null )
    ,/InstanceNull/
    ,'fold identifies when a value is null'
  )

  t.throws(
    () => maybeToNum({
      type: Maybe.name
      ,case: Loadable.Loaded.name
      ,value: 1
    })
    ,/InstanceShapeInvalid/
    ,'fold identifies when a instance has the wrong case key'
  )

  t.throws(
    () => foldMaybe({
      Just: () => 1
    })
    ,/TooFewCases/
    ,'fold detects when there are too few cases provided'
  )

  t.throws(
    () => foldMaybe({
      Just: () => 1
      ,Nothing: () => 1
      ,Left: () => 1
    })
    ,/TooManyCases/
    ,'fold detects when there are too few many provided'
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

  var f = fold(Shape) ({
    Circle: x => x * 2
    ,Rectangle: x => x * 2
    ,Triangle: x => x * 2
  }) 

  t.equals( f(c), 4 )

  t.equals(
    String(c), 'Shape.Circle(2)'
  )

  t.throws( 
    () => Shape.Triangle({x:'0', y:'2'})
    ,/did not satisfy the constraint for Shape.Triangle/
  )

  t.end()
})

test('errors', function(t){
  const YNMaybe = yslashn.maybe('Maybe')
  
  const fromMaybe = (otherwise, f) =>
    fold( YNMaybe )({
        Y: f
        ,N: () => otherwise
    })

  t.throws(
    () => fold( YNMaybe )({
        Y: () => ''
        ,N: () => ''
        ,A: () => ''
    })
    ,/TooManyCases/
  )

  t.throws(
    () => fold( YNMaybe )({
        Y: () => ''
    })
    ,/TooFewCases/
  )

  t.throws(
    () => fromMaybe(0, x => x )(null)
    ,/InstanceNull/
  )

  t.throws(
    () => fromMaybe(0, x=>x)( { type: 'Maybe', case: 'Unknown' })
    ,/InstanceShapeInvalid/
  )

  t.throws(
    () => fold(YNMaybe,1,2,3)
    ,/TooManyArguments/
  )

  t.throws(
    () => fold(YNMaybe) ( { Y: () => 1, N: () => 2 }, 4, 5, 6)
    ,/TooManyArguments/
  )

  t.throws(
    () => bifold( yslashn.nFold('X', ['A', 'B', 'C']))
    ,/BifoldNotInferrable/
  )

  const {N:L} = yslashn.either('Either')
  
  t.throws(
    () => fromMaybe(0, x => x * x)(L(10))
    ,/InstanceWrongType/
  )

  t.throws(
    () => fromMaybe(0, x => x * x)(L({ toString(){ return 'hello' } }))
    ,/InstanceWrongType/
  )
  
  t.throws(
    () => fromMaybe(0, x => x * x)(L(null))
    ,/InstanceWrongType/
  )


  t.end()
})

test('yslashn', function(t){

  const YNMaybe = yslashn.maybe('Maybe')

  const fromMaybe = (otherwise, f) =>
      fold( YNMaybe )({
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
      fold ( Selected ) ({
          Y: fold ( Loaded ) ({
              Y: x => x.toUpperCase()
              ,N: x => x + '% complete'
          })
          ,N: () => 'Please select a thingy'
      })

  t.throws(
    () => f( loading ).case
    ,/InstanceWrongType/
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
    fold( Credit )({
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
    map (Maybe) ( x => x * x ) ( Maybe.Y(10) ).value
    , 100
  )

  t.equals(
    map (Maybe) ( x => x * x ) ( Maybe.N() ).case
    , 'N'
  )

  t.end()

})