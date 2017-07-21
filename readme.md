static-sum-type
===============

A simple library for complex logic.
-----------------------------------

Logic is hard.  There are so many permuations.  Covering all the cases accurately would require some n dimensional tables.  We'd like to handle all the cases correctly but often its hard to know what they all are.

Sum types are a great way to represent the complete possibility space.  And because they compose you can enforce that all possible cases are checked in order to access that delicious nougat centre of data.

Here's an example of 3 types: `Loadable`, `Validatable` and `Selectable`.  We're simulating some complex logic in a UI.

Observe we are forced to handle all potential cases.


```js

const { fold, errMessage } = require('static-sum-type/dev')(function(err){
    throw new TypeError( errMessage(err))
})

const h = require('hyperscript') // or whatever

class Loadable {
    static Loaded(value){
        return {
            type: Loadable
            ,case: Loadable.Loaded
            ,value
        }
    }
    static Loading(){
        return {
            type: Loadable
            ,case: Loadable.Loading
        }
    }
}


class Validatable {
    static Valid(value){
        return {
            type: Validatable
            ,case: Validatable.Valid
            ,value
        }
    }
    static Invalid(value){
        return {
            type: Validatable
            ,case: Validatable.Invalid
            ,value
        }
    }
}

class Selectable {
    static Selected(value){
        return {
            type: Selectable
            ,case: Selectable.Selected
            ,value
        }
    }
    static Deselected(){
        return {
            type: Deselected
            ,case: Selectable.Deselected
        }
    }
}

const w = 
    Selected(
        Loaded(
            Invalid({
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
    Selected(
        Loaded(
            Valid({
                name: 'Kim Thayil'
                ,instrument: 'Guitar'
                ,band: 'Soundgarden'
            })
        )
    )

const y = 
    Deselected()

const z = 
    Selected( Loading() )


const renderBandMembers = 
    fold( Selectable)({
        Selected: fold( Loadable)({
            Loaded: fold( Validatable)({
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
const { fold } = require('static-sum-type/prod')()

class Maybe {
    static Just(x){
        return {
            value: x
            , type: Maybe
            , case: Maybe.Just
        }
    }
    static Nothing(){
        return {
            , type: Maybe
            , case: Maybe.Just
        }
    }
}

// Maybe Number -> String
const NumToFixed = fold(Maybe)({
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
const { fold } = require('static-sum-type/prod')()

const Either = {
    name: 'Either'
    Left: (value) => ({
        value
        ,type: Either
        ,of: Either.Left
    }) 
    ,Right: (value) => ({
        value
        ,type: Either
        ,of: Either.Right
    }) 
}

const Either$map = f =>
    fold(Either)({
        Left(value){
            return Either.Left(value)
        }
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

#### Project Goals and Motivations

- 0 Dependencies 
- Statically Analyzable
    - Nice editor experience in VSCode or tern.js
    - Easy interop with TS/Flow
    - Less magic

- Represent types for raw values (like Numbers)
- Serializable types (for sending typed data over the wire)
- Small for Frontend usage
- Convenient base abstraction for higher abstraction libraries to build on top of
- Convenient API to be used directly by users
- Opt in everything:

    - Opt in class syntax
    - Opt in type decorators (like sanctuary-def)
    - Opt in Err handling
    - Opt in invalid case handling
    - Opt in dynamic generation of types if you need it
    - Opt in constructors

- Encourage code that is less brittle

    - No placeholder cases (like sum-type/union-type)
    - No auto spreading of values (like sum-type/union-type)


#### What's fold do?

`fold` let's you specify different functions to handle different cases.

If the case has a `value` property, it is passed into the provided function.


#### What are static-sum-type/dev and static-sum-type/prod?

These are different versions of the same function.  

Dev will check a variety of things before creating your function and before 
applying it.

Prod will just try to execute immediately.

Both functions are tiny (especially prod), but the idea is, you should design
your app to not have runtime exceptions in production, so why pay the cost
of error handling and introspection if you're confident you don't need it in
production.

Dev accepts a function that controls how the library responds to errors.

Prod ignores whatever you pass to it.  It's designed to have the same interface as dev without any type checking.  It's just 11 lines of super verbose es5 code.

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

{ name: 'Case1'
, type: TypeName1 //references above
}

{ name: 'Case2'
, type: { name: 'TypeName1' } // has same name as above which is also OK
, value: 'this is a value'
}

#### How do I use this library with sanctuary-def?

I'm planning on having sum-type become a thin abstraction on top of this library.  This new version of sum-type will continue to use sanctuary-def but will include type constructors and remove a lot of features that I think lead to brittle code.

You can definitely use sanctuary-def with this library, it was designed for that exact purpose.  That's why this specification for types and cases is so open.

#### What is sanctuary-def?

sanctuary-def is a runtime type system for Javascript as a library.  The type system is very similar to Haskell's.  sum-type uses sanctuary-def to provide
automatic runtime type checking.

This library has 0 dependencies but has been designed to be compatible with and decorator library (like sanctuary-def).

#### How do I use this library with TypeScript / Flow

Create some interfaces for your cases, and annotations to your constructors and your done.  Type systems like Flow and Typescript will be able to statically analyze the structure of your sum types as long as you aren't generating them dynamically, so you'll get code completion and some free type checks.

Caution though, we never instantiate our classes, we're just piggy backing on the syntax.  And there's other syntaxes you can use, includes pojos, named functions, method syntax on objects.  As long as it meets the specification.

#### Why are you misusing Classes?

Classes in Javascript are basically wasted syntax for functional programmers who tend to favour composition of static functions.  We're not using `new` at all and `instanceof` checks are intentionally avoided to favour easy serialization.  Essentially this library is just taking advantage of some syntax for its own needs.

Its also completely opt in.  The specification is wide open.  So even something like this (below) is completely valid:

```js
function Maybe(){

}
Maybe.Just = function(value){
    return {
        type: Maybe
        ,case: Maybe.Just
        ,value
    }
}
Maybe.Nothing = function(){
    return {
        type: Maybe
        ,case: Maybe.Nothing
        ,value
    }
}
```

Because just like `class`, function's also have an auto generated `name` property.  

> The fact classes have a name property is actually just because classes are syntactic sugar on top of constructor functions.

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