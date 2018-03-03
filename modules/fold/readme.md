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

- Run `node index.js`

You should see `"4.12"` and `"0.00"` log to the console.

#### Give me a different syntax example

```js
const { fold } = require('static-sum-type')

const Either = {
    name: 'Either'

    Left: (value) => ({
        value
        ,type: Either.name
        ,case: Either.Left.name
    })
    
    ,Right: (value) => ({
        value
        ,type: Either.name
        ,case: Either.Right.name
    })
}

const Either$map = f =>
    fold(Either) ({
        Left: Either.Left
        ,Right(value){
            return Either.Right(f(value))
        }
    })

var doubleEither = Either$map( x => x * 2 )

doubleEither(
    Either.Left('Error Message')
)
//=> Either.Left('Error Message)

doubleEither(
    Either.Right(2)
)
//=> Either.Right(4)
```


#### What's fold do?

`fold` let's you specify different functions to handle different cases.

If the case has a `value` property, it is passed into the provided function.

#### How do I let my types contain more than one value?

Just use arrays or objects as your `value` property.  The specification does not dictate how your constructors work at all.  So *if* you want, you can do stuff like this:

```js
class List {
    static NonEmpty(...value){
        return {
            type: List.name
            ,value: value
            ,case: List.NonEmpty.name
        }
    }

}
```

Thanks to [Kurt Milam](https://github.com/kurtmilam) for this brilliant idea / approach.

#### Why is the source code ES5?

So many problems are solved by just using ES5 for library source code.  When things settle down that will change.

> If anyone knows how to get coverage working with es6, let me know!

#### Why is this library on GitLab?

GitLab is open source, it has built in CI.  It's got a better UI and UX.  I always hope other libraries move to GitLab so I thought why not make the move myself.