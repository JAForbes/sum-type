# stags

[![pipeline status](https://gitlab.com/JAForbes/static-sum-type/badges/master/pipeline.svg)](https://gitlab.com/JAForbes/static-sum-type/commits/master)

[![coverage report](https://gitlab.com/JAForbes/static-sum-type/badges/master/coverage.svg)](https://gitlab.com/JAForbes/static-sum-type/commits/master)

## A simple library for complex logic.


#### Quick Start

```bash
npm install stags@next
```

```js
import { either } from "stags";

// Create specific types for specific scenarios.
const Loaded = 
    either("Loaded")

const loaded = 
    Loaded.Y("Hello World")

const loading = 
    Loaded.N(55)

const render = 
    Loaded.bifold(
        x => `Loading: ${x}%`
        , x => `Loaded: ${x}`
    )

const transform = 
    Loaded.map(
        x => x.toUpperCase()
    )



render( transform( loaded ) )
//=> 'Loaded: HELLO WORLD'

render( transform( loading ) )
//=> 'Loading: 55%'

transform( render( loading ) )
//=> 'LOADING: 55%'
```

#### What is it

Freedom from booleans.

Scenario: You've solving a moderately difficult problem, and there's a degree of data modelling involved.  You've got several booleans for tracking loading states, save states, modified states, selected states and on and on.

Oh! and you're tracking all those states for every item in a list separately.

Depending on a specific combination of these boolean flags you need to render _differently_, talk to the server _differently_, persist state _differently_.

It very quicky becomes a mess.  We reach for complex tools to help us manage the mess.  But instead all we needed was to make it impossible to not traverse every single state.

First step.  Create a `stags` for every state we want to track.

```js
import { either } from 'stags'

const [Selected, Loaded, Modified, Saved] =
    ['Selected', 'Loaded', 'Modified', 'Saved'].map(either)
```

Every one of your types has a `Y` and `N` constructor that will return a simple object around any value you want to wrap.

`Y` is a shorthand for `Yes` and `N` is a shorthand for `No`.

```js
Selected.Y(data)
//=> { type: 'Selected', case: 'Y', value: data }

Selected.N(data)
//=> { type: 'Selected', case: 'N', value: data }
```

Our constructors just tag our data with a label that allows us to build logic 
on top of it. Normally this label would be stored separately to the data.

Something like:

```js
var selected = false
var data = ...
```

Which is fine at first, until it looks like this:


```js
var selected = true
var loaded = true
var modified = true
var saved = false
var data = x
```

We'd model that in `stags` like so:

```js
import { either } from 'stags'

const [Selected, Loaded, Modified, Saved] =
    ['Selected', 'Loaded', 'Modified', 'Saved'].map(either)

const data =
    Selected.Y( Loaded.Y( Modified.Y( Saved.N( x ) ) ) )
```

The above would create a giant nested object which would be awkward to traverse manually.  But that's a good thing.  We should never manually
peek into the returned object's inner state in application code.

Instead we can use any number of useful helpers.  Like `map`, `fold`, `bimap`
`chain` or `bifold`.

```js

const f =
    Selected.map(
        Loaded.map(
            Modified.map(
                Saved.bimap(
                    x => 'unsaved'
                    ,x => 'saved'
                )
            )
        )
    )

f( data )
//=> Selected.Y( Loaded.Y( Modified.Y( Saved.N('unsaved') ) ) )
```

If we wanted to traverse and extract at the same time, we could use `fold` instead of `map`.  But then we have to handle all the `N` states along the way too.


```js

const f =
    Selected.bifold(
        () => 'unselected',
        Loaded.bifold(
            () => 'loading',
            Modified.map(
                () => 'unmodified',
                Saved.bimap(
                    x => 'unsaved'
                    ,x => 'saved'
                )
            )
        )
    )

f( data )
//=> 'unsaved'
```

If we pass the wrong data structure into our composition, we will get a specific, helpful error message explaining what your type looked like
and what that particular method was expecting.

Your stack trace is going to be particularly legible because `stags` internally avoids point free composition.

Every error that `stags` yields, is itself a transformation of 
a `stags`.  All the error types are documented in the [Errors section](#errors)


#### Specification

`stags` differentiates itself by documenting the internal structure used for types and instances of types.  This allows you to create your
own constructors/transformers in userland.  You can store the exact output
of a stags constructor in a `redux-store`, `localStorage` or even a `json` column in `postgres`.

`stags` does not care where your data came from, just that it adheres to a particular structure.

#### Ecosystem

Each module listed here adheres to the stags specification. That specification is defined at [stags/docs/spec.md](https://gitlab.com/JAForbes/static-sum-type/tree/master/docs/spec.md).

- [superouter](https://gitlab.com/harth/superouter/) A Router that both exposes and internally uses stags to model route definitions, validation and more.

#### Project Goals and Motivations

- Serializable
- 0 Dependencies
- Tiny for frontend usage
- Avoid pitfalls found in other sum type libraries

#### How does stags differ from other libraries in the ecosystem?

`stags` removes the following features because we believe they lead to brittle codebases.

- placeholder cases
- auto spreading of values in cata/fold
- auto curried constructors
- prototypes (reference equality checks / instanceof)
- serializable / useable with Redux/meiosis etc

`stags` is technically 0KB, it's an idea. You can use stags in your codebase without ever running `npm install`.


### API

#### either

```js
import { either } from 'stags'

const Loaded = 
    either('Loaded')
```

#### `either::Y`

`a -> Either Y a | N b`

#### `either::N`

`b -> Either Y a | N b`

#### `either::map`

`( a -> c ) -> Either Y c | N b`

#### `either::bimap`

`(( a -> c ), ( b -> d )) -> Either Y c | N d`

#### `either::bifold`

`(( a -> c ), ( b -> c )) -> Either Y a | N b -> c`

#### `either::getWith`

`( c , ( b -> c )) -> Either Y a | N b -> c`

#### `either::getOr`

`c -> Either Y a | N b -> c`

#### `either::fold`

`Type -> { Y: a -> c, N: b -> c } -> case -> c`

#### `either::chain`

`( a -> Either Y c | N b ) -> Either Y c | N b`

#### `maybe`

```js
import { maybe } from 'stags'

const Selected = 
    maybe('Selected')
```

#### `maybe::Y`

`a -> Maybe Y a | N`

#### `maybe::N`

`() -> Maybe Y a | N`

#### `maybe::map`

`( a -> c ) -> Maybe Y c | N`

#### `maybe::bimap`

`(( () -> b ), ( a -> b )) -> Maybe Y b | N`

#### `maybe::bifold`

`(( () -> b ), ( a -> b )) -> Maybe Y a | N -> b`

#### `maybe::getWith`

`( b , ( a -> b )) -> Maybe Y a | N -> b`

#### `maybe::getOr`

`b -> Maybe Y a | N -> b`

#### `maybe::fold`

`Type -> { Y: a -> b, N: () -> b } -> case -> b`

#### `maybe::chain`

`( a -> Maybe Y b | N ) -> Maybe Y b | N`

#### Canonical Maybe / Either

In the future some functions will return optional values.  This library encourages you to define your own but this library exports two pregenerated Maybe / Either types that can be used canonically as the "real" Maybe or Either which can be helpful when doing natural transformations and conversions between types and safe and unsafe data.

```js
import { Maybe, Either } from stags

const yes = Maybe.Y(100)
const no = Maybe.N()

const f = Maybe.getOr(0)

f(yes)
// => 100

g(no)
// => 0
```

#### `tagged`

```js
import { tagged } from 'stags'

const Geom = 
    tagged ('Geom') ({
        Point: ['x', 'y'],
        Line: ['p1', 'p2'],
        Poly: ['p1', 'p2', 'rest']
    })

const p1 = Geom.Point({ x:0, y: 0 })

const p2 = p1

const line = Geom.Line({ p1, p2 })

const poly = Geom.Poly({ p1, p2, rest: [p3]})
```

#### `fold`

`Type -> { [caseName]: a -> b } -> case -> b`

#### `foldT`

`( () -> Type ) -> { [caseName]: a -> b } -> case -> b`

Like fold, but receives a function to obtain the type.  Useful for defining folds on the type at the time of definition.

#### `map`

`Type -> { [caseName]: a -> b } -> case -> Type b`


> ⚠ Both `map` and `chain` will skip executing cases when their instance has no `.value` property (usually determined by their type constructor).

#### `chain`

`Type -> { [caseName]: a -> Type b } -> case -> Type b`

> ⚠ Both `map` and `chain` will skip executing cases when their instance has no `.value` property (usually determined by their type constructor).

But when using `map` and `chain` you are still required to pass in a handler for every case.

It's recommended to use `otherwise` with `map` and `chain` to prefill values that are not relevant to the fold.

#### otherwise

`string[] -> f -> { [key:string]: f }`

A helper function for generating folds that are versioned separately to the type definition.

```js

const { Y, N } = stags.Maybe
const Platform = stags.tagged ('Platform') ({
    ModernWindows: [],
    XP: [],
    Linux: [],
    Darwin: []
})

// defined separately to detect changes in intent
const rest = stags.otherwise([
    'ModernWindows',
    'XP',
    'Linux',
    'Darwin'
])

const windows = stags.otherwise([
    'ModernWindows',
    'XP'
])

const foldWindows = f => stags.map(Platform) ({
    ... rest(N),
    ... windows( () => Y(f()) )
})

const winPing = 
    foldWindows
        ( () => 'ping \\t www.google.com' )

winPing( Platform.Darwin() )
// => stags.Maybe.N()

winPing( Platform.XP() )
// => stags.Maybe.Y('ping \t www.google.com')

```

At a later date, you may add support for WSL.  Which will likely break earlier assumptions because it's both linux _and_ windows.

```js
const Platform = stags.tagged ('Platform') ({
    ModernWindows: [],
    XP: [],
    WSL: [], // NEW!
    Linux: [],
    Darwin: []
})
```

Now `stags` will helpfully throw a `MissingCases` error for all the usages of our original `otherwise` functions that no longer discriminate the union.

We can now create a new otherwise for that assumption:

```js


const windows = stags.otherwise([ //OLD
    'ModernWindows',
    'XP'
])

const rest = stags.otherwise([ //OLD
    'ModernWindows',
    'XP',
    'Linux',
    'Darwin'
])

const rest2 = stags.otherwise([ // NEW!
    'ModernWindows',
    'XP',
    'WSL', // NEW
    'Linux',
    'Darwin',
])

const windowsGUI = stags.otherwise([ // NEW
    'ModernWindows',
    'XP',
])

const foldWindowsGUI = f => stags.map(Platform) ({ // NEW
    ... rest2(N),
    ... windowsGUI( () => Y(f()) )
})

const foldWindows = f => stags.map(Platform) ({ // OLD
    ... rest(N),
    ... windows( () => Y(f()) )
})

```

Our original `ping` function is using our old function, let's revisit our assumptions:

```js
const winPing = 
    foldWindows
        ( () => 'ping \\t www.google.com' )

const winPing2 =
    foldWindowsGUI
        ( () => 'ping \\t www.google.com' )
```

When we've updated all the references, `stags` will stop throwing errors on initialization.  You can then delete the old definitions and update the new definitions to have the old names.  Leaving us with:

```js

const rest = stags.otherwise([ // renamed
    'ModernWindows',
    'XP',
    'WSL',
    'Linux',
    'Darwin',
])

const windowsGUI = stags.otherwise([
    'ModernWindows',
    'XP',
])

const foldWindowsGUI = f => stags.map(Platform) ({
    ... rest2(N),
    ... windowsGUI( () => Y(f()) )
})

const winPing =
    foldWindowsGUI
        ( () => 'ping \\t www.google.com' )

```

If we hadn't versioned our `otherwise` structures separately to the type, we'd get no initialization errors and instead our code would break in unpredictable ways.  For example `WSL` has it's own `ping` and `\t` doesn't do anything on the linux version.  This is what makes separately versioned placeholders so powerful. 

```js
import { foldT } from 'stags'

const Example = {
  name: 'Example'
  A(value){
    return { type: 'Example', case: 'A', value }
  },
  B(){
    return { type: 'Example', case: 'B' }
  },
  // Example doesn't exist at the time of definition
  // So the type is referenced lazily.
  isA: foldT( () => Example ) ({
      A: () => true,
      B: () => false
  })
}
```

---

## Experimental

These functions are likely to change at any moment.

#### `caseName`

`caseName` -> `caseName:string`

Extract the name of a case from an instance of a type.

#### `sameCase`

`T` -> `(Ta, Tb)` -> `boolean`

Returns `true` if two case instances have the same subtype.

#### `getCases`

`T` -> `(caseName:string)[]`

Returns a list of the `caseName`'s for a given type `T`.

### Errors

Below is the source code definition for the internal errors this library throws. 

```js
const StaticSumTypeError =
    tagged('StaticSumTypeError')({
        ExtraCases: ['extraKeys']
        , MissingCases: ['missingKeys']
        , InstanceNull: ['T']
        , InstanceWrongType: ['T', 'x']
        , InstanceShapeInvalid: ['T', 'x']
        , InvalidCase: ['context']
        , VisitorNotAFunction: ['context', 'visitor']
        , NotAType: ['context', 'T']
    })
```

 Error                  | Throws ... 
------------------------|--------
 `ExtraCases`           | when a fold specifies a visitor for cases that are not of the type.
 `MissingCases`         | when a fold does not specify a visitor for each case of the type.
 `InstanceNull`         | when an argument was expected to be an instance of a sum type but was instead null.
 `InstanceWrongType`    | when an instance is a valid `stags` but not the specifically expected type for that function.
 `InstanceShapeInvalid` | when an instance has the correct `type` property but an unknown `case` property.
 `VisitorNotAFunction`  | when a function was expected a visitor function but received anything else.
 `NotAType`             | when a function expected a `stags` `type` but received anything else.