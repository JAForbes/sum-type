const test = require('tape')
const { 
  fold: devCata
  , errMessage
  , StaticSumTypeError 
} = require('../dev')(function(e){
  return e
})

const { fold: prodCata } = require('../prod')()

class Maybe {
  static Just(x) {
    return { 
      value: x
      , case: Maybe.Just
      , type: Maybe
    } 
  }
  static Nothing() { 
    return { 
      case: Maybe.Nothing 
      , type: Maybe
    } 
  }
}

class Loadable {
  static Loaded(x) {
    return {
      value: x
      , case: Loadable.Loaded
      , type: Loadable
      , toString(){
        return 'Loaded('+x+')'
      }
    } 
  }
  static Loading() { 
    return { 
      of: Loadable.Loading
      , type: Loadable
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
      , case: Maybe2.Just
      , type: Maybe2
    }
  }
  ,Nothing(){
    return { 
      case: Maybe2.Nothing
      , type: Maybe2
    }
  }
}

var x = Maybe.Just(2)
var y = Loadable.Loaded(x)


test('static-sum-type', function(t){
  const foldMaybe = devCata(Maybe)

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
    devCata(Maybe, 0).case
    ,StaticSumTypeError.TooManyArguments
    ,'fold identifies when there are too many arguments level:0'
  )

  t.equals(
    devCata(Maybe)({ Just: () => 1, Nothing: () => 0 }, 1).case
    ,StaticSumTypeError.TooManyArguments
    ,'fold identifies when there are too many arguments level:1'
  )

  t.equals(
    devCata(Maybe)({ Just: () => 1, Nothing: () => 0 })( Maybe.Just(1), 1 ).case
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
      type: Maybe
      ,case: Loadable.Loaded
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
  t.end()
})