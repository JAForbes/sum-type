yslashn
=======

Dedicated to [Mr Wlaschin](https://twitter.com/ScottWlaschin)

Quick start
-----------

```
npm install static-sum-type
```

```js
const yslashn = require('static-sum-type/yslashn')
const { fold } = require('static-sum-type')
const Maybe = yslashn.maybe('Maybe')

const fromMaybe = (otherwise, f)
    fold( Maybe )({
        Y: f
        ,N: () => otherwise
    })

const y = Maybe.Y(10)
const n = Maybe.N()

fromMaybe(0, x => x * x ) ( y )
// => 100

fromMaybe(0, x => x * x)( n )
// => 0

```

Whaaaat??
---------

A lot of the time all we want is a new type that mimics the behaviour of well known existing types like Maybe and Either.

This library gives you the ability to define new types with extreme brevity but enjoy helpful type errors when composing folds.

```js
// Selected = Y a | N
const Selected = yslashn.maybe('Selected')

// Loaded = Y a | N b
const Loaded = yslashn.either('Loaded')

// 50% loaded
const loading =
    Loaded.N( 50 )

const complete =
    Loaded.Y( 'hello world' )

// not selected
const deselected = Selected.N()

const f =
    fold ( Selected ) ({
        Y: fold ( Loaded ) ({
            Y: x => x.toUpperCase()
            ,N: x => x + '% complete'
        })
        ,N: () => 'Please select a thingy'
    })

f( loading ) // Type error Loaded != Selected

f(
    Selected.Y(
        loading
    )
) //=> "50% complete"

f(
    Selected.N(
        complete
    )
) // => 'HELLO WORLD'

f(
    deselected
) // => 'Please select a thingy'
```

### API

> All `ylashn` functions return a static-sum-type spec compliant `static-sum-type` algebraic type!

`yslashn.maybe = string -> Y a | N`

Provide the name of a type, and `yslashn.maybe` will give you a type that mimics the structure of a `Maybe`.  `Y` is an alias for the word "yes" and corresponds to the traditionally named `Maybe.Just` which usually represents the happy path in a computation.

`N` is an alias for the word "no" and corresponds to what is tradtionally named `Maybe.Nothing`.

`Y` can contain a value, and `N` cannot.

`ylashn` returns a spec compliant `static-sum-type` so you can type against that structure.

`yslashn.either = string -> Y a | N b`

Provide the name of a type, and `yslashn.either` will give you a type that mimics the structure of an `Either`.  `Y` is an alias for the word "yes" and corresponds to the traditionally named `Either.RIght` which usually represents the happy path in a computation.

`N` is an alias for the word "no" and corresponds to what is tradtionally named `Either.Left`.

Both `Y` and `N` can contain values.


`yslashn.nFold = (string, string[]) -> A a | B b ... | Z z `

Provide the name of a type and a list of case names and `yslashn.nFold` will give you a `static-sum-type` compliant type with as many cases as you provided.

`nFold` is helpful for quickly generating types that represent domain logic in your system.  Each case can contain 1 value, if you need more values, just store a list or object as that `value`.


What's with the name?
---------------------

This library encourages a naming convention `Y/N` which isn't a valid identifier so its expanded to `yslashn` which as a happy coincidence sounds a lot like the pronunciation of Scott Wlashchin's surame.

Who is Scott Wlaschin?
-----------------------

Scott Wlaschin is most well known for his book / blog F# for fun and profit.  He's especially well known for evangelizing sum types to encode business logic at the type level.  Something this project attempts to simulate in Javascript.

