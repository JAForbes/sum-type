static-sum-type
===============

A simple library for complex logic.
-----------------------------------

Logic is hard.  There are so many permuations.  Covering all the cases accurately would require some n dimensional tables.  We'd like to handle all the cases correctly but often it's hard to know what they all are.

Sum types are a great way to represent the complete possibility space.  And because they compose you can enforce that all possible cases are checked in order to access that delicious nougat centre of data.

Here's an example of 3 types: `Loadable`, `Validatable` and `Selectable`.  We're simulating some complex logic in a UI.

Observe we are forced to handle all potential cases.


```js

const { fold } = require('static-sum-type')

const Predicated = require('static-sum-type/modules/predicated')

const h = require('hyperscript') // or whatever
const SomeArgs = (...args) => args.length > 0
const NoArgs = (...args) => args.length == 0
const RecordT = T => keys => x 
    [x]
    .filter( x != null )
    .filter( 
        x => 
        keys
        .every( k => typeof x[k] === 'string' )
    ))
    .length > 0

const StrRecord = RecordT(x => typeof x == 'string')

const Loadable = Predicated('Loadable', {
    Loaded: SomeArgs
    ,Loading: NoArgs
})

const BandMember = Predicated('Validatable', {
    Valid: StrRecord([
        'name', 'instrument', 'band'
    ])
    ,Invalid: StrRecord([
        'name', 'instrument', 'band', 'validationMessage'
    ])
})

const Selectable = Predicated('Selectable', {
    Selected: Anything
    ,Deselected: NoArgs
})

const w = 
    Selectable.Selected(
        Loadable.Loaded(
            BandMember.Invalid({
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
    Selectalbe.Selected(
        Loadable.Loaded(
            Validatable.Valid({
                name: 'Kim Thayil'
                ,instrument: 'Guitar'
                ,band: 'Soundgarden'
            })
        )
    )

const y = 
    Selectable.Deselected()

const z = 
    Selectable.Selected( Loadable.Loading() )


const renderBandMembers = 
    fold( Selectable )({
        Selected: fold( Loadable)({
            Loaded: fold( BandMember )({
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
    Valid(
        Loading()
    )

renderBandMembers(typeError) 
//=> helpful type error
```

#### Getting Started

- `npm install static-sum-type`
- create a file `index.js`
- Paste the following into the file

```js

const { fold } = require('static-sum-type')

const Predicated = require('static-sum-type/modules/predicated')

const NArgs = n => (...args) => args.length == n

const Maybe =  Predicated('Maybe', {
    Just: NArgs(1)
    ,Nothing: NArgs(0)
})

// Maybe Number -> String
const NumToFixed = fold(Maybe)({
    Just(x){
        return x.toFixed(2)
    }
    ,Nothing(){
        return '0.00'
    }
})

console.log( NumToFixed( Maybe.Just(4.123141234) ) )
//=> "4.12"
console.log( NumToFixed( Maybe.Nothing() ))
//=> "0.00"
```

- Run `node index.js`

You should see `"4.12"` and `"0.00"` log to the console.