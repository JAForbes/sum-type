static-sum-type
===============

A simple library for complex logic.
-----------------------------------

Business logic can be tricky. There can be so many permuations.  Covering all the cases accurately would require some n dimensional tables.  We'd like to handle all the cases correctly but often it's hard to know what they all are.

Sum types are a great way to represent the complete possibility space.  And because they compose you can enforce that all possible cases are checked in order to access that delicious nougat centre of data.

The code sample below is going to hurt to read the first time.  And it will also demonstrate how working with sum types encourages you to write code that handles every case.  Sum types mean less bugs and less surprises.

Here's an example of 3 types: `Loaded`, `Valid` and `Selected`.  We're simulating some complex logic in a UI.

Observe we are forced to model and handle all potential cases.


```js
const { fold } = require('static-sum-type')
const { either, maybe } = require('yslashn')
const h = require('hyperscript') // or whatever

const [Loaded, Selected] = ['Loaded', 'Selected'].map(either)
const Valid = maybe('Valid')

const w =
    Selected.Y(
        Loaded.Y(
            Valid.N({
                name: 'kym theel'
                ,instrument: null
                ,band: 'Audioslave'
                ,validationMessage:
                    [ 'Wrong band, no instrument, wrong spelling.'
                    , 'You can do this!'
                    ]
                    .join('  ')
            })
        )
    )

const x =
    Selected.Y(
        Loaded.Y(
            Valid.Y({
                name: 'Kim Thayil'
                ,instrument: 'Guitar'
                ,band: 'Soundgarden'
            })
        )
    )

const y =
    Selected.N()

const z =
    Selected.Y( Loaded.N() )


const renderBandMembers =
    fold( Selectable ) ({
        Selected: fold( Loadable ) ({
            Loaded: fold( Validatable ) ({
                Valid({
                    name
                    , instrument
                    , band
                }){
                    return h('form.valid', [
                        h(
                            'div.success'
                            , 'This band member is so valid'
                        )
                        ,nameInput(name)
                        ,instrumentChooser(instrument)
                        ,bandChooser(band)
                        ,saveButton({ disabled: false })
                    ])
                }
                ,Invalid({
                    name
                    , instrument
                    , band
                    , validationMessage
                }){
                    return h('form.invalid', [
                        h('div.warning', validationMessage)
                        ,nameInput(name)
                        ,instrumentChooser(instrument)
                        ,bandChooser(band)
                        ,saveButton({ disabled: true })
                    ])
                }
            })
            ,Loading: () => 'Loading...'
        })
        ,Deselected:
            () => 'Please select a band member'
    })

renderBandMembers(w) //=> Invalid Form
renderBandMembers(x) //=> ValidForm
renderBandMembers(y) //=> 'Please select a band member'
renderBandMembers(z) //=> 'Loading'


var typeError =
    Validatable.Valid(
        Loadable.Loading()
    )

renderBandMembers(typeError)
//=> helpful type error because the structure does not match the `fold`
```

#### Getting Started

- `npm install static-sum-type`
- create a file `index.js`
- Paste the following into the file

```js
const { fold } = require('static-sum-type')

class Maybe {
    static Just(x){
        return {
            value: x
            , type: Maybe.name
            , case: Maybe.Just.name
        }
    }
    static Nothing(){
        return {
            , type: Maybe.name
            , case: Maybe.Nothing.name
        }
    }
}

// Maybe Number -> String
const NumToFixed = fold(Maybe) ({
    Just(x){
        return x.toFixed(2)
    }
    ,Nothing(){
        return '0.00'
    }
})

console.log(NumToFixed( Maybe.Just(4.123141234) ) )
//=> "4.12"
console.log(NumToFixed( Maybe.Nothing() ))
//=> "0.00"
```

API
---

#### fold


`fold` let's you specify different functions to handle different cases.

If the case has a `value` property, it is passed into the provided function.

```js
const f = 
    fold (Either) ({
        Left( leftValue ){
            return leftValue + '!'
        }, 
        Right( rightValue ){
            return rightValue * 2
        }
    })

f ( Either.Left('Hi') ) //=> 'Hi!'

f ( Either.Right(2) ) //=> 4
```

#### bifold

`bifold` allows you to fold over a type with 2 cases without having tp specify the case name.

```js
const f = bifold (Either) (
    b => 'B:' + b
    ,a => 'A:' + a
)

f ( Either.Left('b') ) //=> 'B:b'
f ( Either.Right('A') ) //=> 'A:a'
```

Function order is in reverse defintion order.

So if your type was defined as:

```js
const Either = 
    { name: 'Either'
    , Right(){}
    , Left(){}
    }
```

Then you specify your bifold like so:

```js
fold ( Either ) (
    leftFn
    ,rightFn
)
```

#### bimap

Like `bifold` but maintains it's original encoding.

#### map

Like `bimap` but only visitors the first case defined in your type.

#### chain

Like `map` but unwraps 1 layer of encoding.

#### foldCase

`fold` acts like `fold` but allows you to constrain the type of the instance to a specific case.

Useful if you only want to run logic against 1 case.

```js
const f = foldCase (Maybe.Y) ( 0, x => x + 1 )

f ( Maybe.Y(2) ) //=> 3

f ( Maybe.N() ) //=> Type Error!
```

#### mapCase

`mapCase` acts like `map` but allows you to constrain the type of the instance to be a specific case.

`mapCase` also enables mapping over types with 1 or more than 2 cases, unlike `map` which expects exactly 2.

```js
const f = mapCase (Maybe.Y) ( x => x + 1 )

f ( Maybe.Y(2) ) //=> Maybe.Y(3)

f ( Maybe.N() ) //=> Type Error!
```

`mapCase`, like `map` will not execute visitor functions on valueless cases.

```js
//=> Type Error!
const f = mapCase (Maybe.N) 
```

#### Why is the source code ES5?

So many problems are solved by just using ES5 for library source code.  When things settle down that will change.

> If anyone knows how to get coverage working with es6, let me know!
