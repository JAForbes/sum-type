static-sum-type
===============

A simple library for complex logic.
-----------------------------------

Logic is hard.  There are so many permuations.  Covering all the cases accurately would require some n dimensional tables.  We'd like to handle all the cases correctly but often it's hard to know what they all are.

Sum types are a great way to represent the complete possibility space.  And because they compose you can enforce that all possible cases are checked in order to access that delicious nougat centre of data.

Here's an example of 3 types: `Loadable`, `Validatable` and `Selectable`.  We're simulating some complex logic in a UI.

Observe we are forced to handle all potential cases.


```js

const { fold, errMessage } = require('static-sum-type')(
    handleError
)

const Predicated = require('static-sum-type/modules/predicated')(
    String
    ,handleError
)

function handleError(err){
    throw new TypeError( errMessage(err))
}


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

#### Differences from SumType and UnionType

This library is more a specification with some simple replaceable utilities.

Everything is exposed and there's no use of prototypes or closured variables.

This design has come from working with JS algebraic type libraries on production code and encountering lots of little problems.  This library seeks to take a different path, by removing almost all features and instead defining a data specification that other libraries can build upon in a more opinionated fashion.

#### Getting Started

- `npm install static-sum-type`
- create a file `index.js`
- Paste the following into the file

```js

const { fold, errMessage } = require('static-sum-type')(
    handleError
)

const Predicated = require('static-sum-type/modules/predicated')(
    String
    ,handleError
)

function handleError(err){
    throw new TypeError( errMessage(err))
}

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

#### Project Goals and Motivations

- 0 Dependencies 
- Tiny for frontend usage
- Represent types for raw values (like Numbers)
- Serializable types (for sending typed data over the wire)
- Interop with base static-sum-type spec
- Encourage code that is less brittle

    - No placeholder cases (like sum-type/union-type)
    - No auto spreading of values (like sum-type/union-type)
    - No auto curried constructors (like sum-type/union-type)


#### What's fold do?

`fold` let's you specify different functions to handle different cases.

If the case has a `value` property, it is passed into the provided function.

#### What's a "Type"

A type is a struct with a name property and as many keys as there are cases.

A Maybe type looks like this

```
{ name :: String
, Just :: Any
, Nothing :: Any
}
```

Keep in mind every property other than `name` is considered the name of a `Case` of that `Type`.  If you want your type to have functions, either put them on a separate (higher) namespace, or put them on the `Type`'s prototype chain.  

> Any keys in a call to `getOwnPropertyNames(Type)` will be treated as a case.

#### What is a "Case"

```
{ name :: String
, type :: Type
, case :: { name :: String }
, value? :: a
}
```

A `Case` is a struct with a `type`, `case` and an optional `value` property.
The type property must be a `Type` which includes a key with same value as the `name` property of this case.  The `case` property must have a `name` property of it's own that has the same `name` value as the object it lives on.

A case *can* have a `value` property.  But it is optional.  The `value` property can be of any type.

#### Show me some examples of some valid types.

```js
class TypeName1 {
    static Case1(){}
    static Case2(){}
}

{ name: 'TypeName2'
, 'Case1': true
, 'Case2': true
}
```

Yes the above specification is compatible with Javascript classes.  Here's why:

A class has an automatically generated property `name`.  

#### Show me some examples of some valid cases.

```js
{ name: 'Case1'
, type: TypeName1 //references above
}

{ name: 'Case2'
, type: { name: 'TypeName1' } // has same name as above which is also OK
, value: 'this is a value'
}
```

#### How do I use this library with sanctuary-def?

I'm planning on having sum-type become a thin abstraction on top of this library.  This new version of sum-type will continue to use sanctuary-def but will include type constructors and remove a lot of features that I think lead to brittle code.

You can definitely use sanctuary-def with this library, it was designed for that exact purpose.  That's why this specification for types and cases is so open.

#### What is sanctuary-def?

sanctuary-def is a runtime type system for Javascript as a library.  The type system is very similar to Haskell's.  sum-type uses sanctuary-def to provide
automatic runtime type checking.

This library has 0 dependencies but has been designed to be compatible with any decorator library (like sanctuary-def).

#### Can my sum types have methods like union-type / sum-type / daggy?

Yes, while this API deliberately does not encourage that style, it will not interfere with `fold`'s behaviour.

#### How do I let my types contain more than one value?

Just use arrays or objects as your `value` property.  The specification does not dictate how your constructors work at all.  So *if* you want, you can do stuff like this:

```js
class List {
    static NonEmpty(...value){
        return {
            type: List
            ,value: value
            ,case: List.NonEmpty
        }
    }

}
```

Thanks to Kurt Milam for this brilliant idea / approach.

#### Why is the source code ES5?

So many problems are solved by just using ES5 for library source code.  When things settle down that may change.

#### Why is this library on GitLab?

GitLab is open source, it has built in CI.  It's got a better UI and UX.  I always hope other libraries move to GitLab so I thought why not make the move myself.