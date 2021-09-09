# sum-type

## A simple library for complex logic.

- 🐭 4KB Gzipped!!!
- 💾 Serializable (perfect for localStorage)
- 🎁 Powerful OOTB (Functor, Monad, Bifunctor and more!)
- 🛠 Extensible ( Open specification, data first ✊)
- 🚀 Makes UI and API code safer, cleaner and more fun.

#### Live Example

[Live Demo](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4A9GIAEAVzQAHANYBzfHSxi40rAFpiATzkwAAmhgAPYgB00sYpIAqkgLySAylvsGY160Lh2AGVoMABMYEOdJa0kYh3wYCGJCGAAnAApLECDQ8MyASh80PzsoYLCIl2jY7PL8AE0MkAAJGChSyQB1WhSoEPzC4slS0Ig0JUiqmJrw-AA5NIBWBYK0X3p-SRSmMJSJtFjJaZD8ACMIMFpejP2D2LNnAD5JAAMa0aVESQASYDNWAFJnpNbhRJPcnE9XmVwp8fn8gTcYis1mgNsQUhhURcUlg9gcjvgsBg5NdbndHmD8MRaABVOSGFIAYQwcBgaRWBxWAG5rMhNttUmlJOjMXBsVghcNypI8jLJBIIZIAORHT5NACiAQCAHlOtqAEoBAAiSusoK2aB2QpFWO6EqGZXectlCqeKsdY0+S3+prQ5oF6WFGNtOMlHvGspdYkVKu1AEEjQBJWYAcS9Cx91gAutZ8Nj1RhqIQheCniFaNQtCJ8AB3FKJNnPAA8cgecNYTbEreeeTylBotCwcmgqTwJwwJ1a-dZsGoxAg6zwAAZEEvtAAmADsiAALAs2BwQJgcHhVHABAPhMweGws1QoKMFAgUJwTzxNDp9IZ8FpjlhRvg-D9tIPR4CQxByHAiASLIigqGoGhaLoXhGAAjPgS4YdopgWPg65iCEED+Ihn5eD+WB-gBQFUF+3AgHA1D1nIoisFmrBAA)

## Quick Start

```bash
npm install sum-type@next
```

```js
// unpkg.com/sum-type@next
// let T = SumType

import * as T from 'sum-type'

const Loaded = 
    T.either("Loaded")

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
;
[ render( transform( loaded ) ) //=> 'Loaded: HELLO WORLD'
, render( transform( loading ) ) //=> 'Loading: 55%'
, render( transform( loading ) ) //=> 'LOADING: 55%'
]
.forEach( x => document.write(`<p>${x}</p>`))
```

[Live Demo](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4A9GIAEAVzQAHANYBzfHSxi40rAFpiATzkwAAmhgAPYgB00sYpIAqkgLySAylvsGY160Lh2AGVoMABMYEOdJa0kYh3wYCGJCGAAnAApLECDQ8MyASh80PzsoYLCIl2jY7PL8AE0MkAAJGChSyQB1WhSoEPzC4slS0Ig0JUiqmJrw-AA5NIBWBYK0X3p-SRSmMJSJtFjJaZD8ACMIMFpejP2D2LNnAD5JAAMa0aVESQASYDNWAFJnpNbhRJPcnE9XmVwp8fn8gTcYis1mgNsQUhhURcUlg9gcjvgsBg5NdbndHmD8MRaABVOSGFIAYQwcBgaRWBxWAG5rMhNttUmlJOjMXBsVghcNypI8jLJBIIZIAORHT5NACiAQCAHlOtqAEoBAAiSusoK2aB2QpFWO6EqGZXectlCqeKsdY0+S3+prQ5oF6WFGNtOMlHvGspdYkVKu1AEEjQBJWYAcS9Cx91gAutZ8Nj1RhqIQheCniFaNQtCJ8AB3FKJNnPAA8cgecNYTbEreeeTylBotCwcmgqTwJwwJ1a-dZsGoxAg6zwAAZEEvtAAmADsiAALAs2BwQJgcHhVHABAPhMweGws1QoKMFAgUJwTzxNDp9IZ8FpjlhRvg-D9tIPR4CQxByHAiASLIigqGoGhaLoXhGAAjPgS4YdopgWPg65iCEED+Ihn5eD+WB-gBQFUF+3AgHA1D1nIoisFmrBAA)

## Usage

### Recommended

Recommended usage is to simply `npm install sum-type@next` and `import * as T from 'sum-type`

### Browser / Playground

Checkout all the distributions here: https://unpkg.com/sum-type@next/dist/

### Common.js

If you `require('sum-type')` it will use the .cjs distribution out of the box

### ESM

ESM is the native format for this library.  Simply `import * as T from 'sum-type'`

## What is it

Freedom from booleans.

Scenario: You've solving a moderately difficult problem, and there's a degree of data modelling involved.  You've got several booleans for tracking loading states, save states, modified states, selected states and on and on.

Oh! and you're tracking all those states for every item in a list separately.

Depending on a specific combination of these boolean flags you need to render _differently_, talk to the server _differently_, persist state _differently_.

It very quicky becomes a mess.  We reach for complex tools to help us manage the mess.  But instead all we needed was to make it impossible to not traverse every single state.

First step.  Create a `sum-type` for every state we want to track.

```js
import * as S from 'sum-type'

const Data = S.tags('Data', 
    [ 'Deselected'
    , 'Loading'
    , 'Modified'
    , 'Saved'
    ]
)
```

Our type `Data` has been generated with 4 tags, each has a constructor:


```js
Data.Saved(data)
//=> { type: 'Data', tag: 'Y', value: data }

Data.Deselected()
//=> { type: 'Deselected', tag: 'N' }
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

We'd model that in `sum-type` like so:

```js
import * as S from 'sum-type'

const Data = S.tags('Data', 
    [ 'Deselected'
    , 'Loading'
    , 'Modified'
    , 'Saved'
    ]
)

const data = Data.Modified(x)
```

When we want to transform the value of `data` we can use any number of useful helpers.  Like `map<Tag>`, `chain<Tag>`, `get<Tag>With` or `get<Tag>Or` where `<Tag>` is one of your tag names.  E.g. `mapSaved`.

```js

const f = Data.mapSaved(
    x => x * 2
)


f( Data.Saved(2) )
// => Data.Saved(4)

f( Data.Modified(1) )
Data.Modified(1)

const g = Data.getModifiedOr(0)

g( Data.Saved(2) )
//=> 0

g( Data.Modified(3) )
//=> 3
```

> 🤓 Types generated by `sum-type` are decorated with a lot of functions for free.  Check out [lib/decorate.js](lib/decorate.js) to see how it all works.

You can also `fold` all the cases, as every type generated by `sum-type` is a discrimated union.  Which means (in layperson's terms), you'll get a helpful error if you don't account for every possibly tag.

```js
const NoData = S.otherwise(['Selected', 'Loading'])

const f = 
    Data.fold({
        ... NoData( () => 'Nothing' )
        ,   Saved: x => 'Saved: ' + x
        ,   Modified: x => 'Modified: ' + x
    })

f( Data.Loading() )
//=> 'Nothing'

f( Data.Saved('cool') )
//=> 'Saved: Cool'
```

There's loads of other helpful utilities, and `sum-type` will guide you with helpful error messages if you make a mistake.  That's one of our design goals!

## Helpful Errors

If we pass the wrong data structure into our composition, we will get a specific, helpful error message explaining what your type looked like
and what that particular method was expecting.

Your stack trace is going to be particularly legible because `sum-type` internally avoids point free composition and auto currying, and will report errors at the first incorrect invocation.

So even though `fold` requires 3 calls:

```js
fold (Type) ({ Y: () => 'hi', N: () => 'bye' }) ( Type.Y() )
```

`sum-type` will error if any one of those invocations didn't satisfy the required constraints.

> 🤓 Every error that `sum-type` yields, is itself a transformation of 
a `sum-type`.  All the error types are documented in the [Errors section](#errors)


## Specification

`sum-type` differentiates itself from other sum type library by documenting the internal structure used for types and instances of types.  This allows you to create your
own constructors/transformers in userland.  You can store the exact output
of a sum-type constructor in a `redux-store`, `localStorage` or even a `json` column in your favourite database.

`sum-type` does not care where your data came from, just that it adheres to a particular structure.

## Ecosystem

Each module listed here adheres to the sum-type specification. That specification is defined at [docs/spec.md](https://github.com/JAForbes/sum-type/blob/jf/main/docs/spec.md).

- [superouter](https://github.com/JAForbes/superouter/) A Router that both exposes and internally uses sum-type to model route definitions, validation and more.

## Project Goals and Motivations

- Serializable
- 0 Dependencies
- Tiny for frontend usage
- Avoid pitfalls found in other sum type libraries
- Helpful Error Messages designed for makers

## How does sum-type differ from other libraries in the ecosystem?

`sum-type` removes the following features because we believe they lead to brittle codebases.

- placeholder cases
  - replaced by `otherwise` which is slightly more verbose but way safer and more powerful
- auto spreading of values in cata/fold
  - sum-type just have 1 value, and that's what get's passed in to a fold
  - use a list, or an object to have an instance carry more values
- auto curried constructors
  - Functions are manually curried and report errors per invocation
- prototypes (reference equality checks / instanceof)
  - Makes it hard to share type checkings for data across serialization boundaries and realms (e.g. Electron apps)

`sum-type` is technically 0KB, it's an idea. You can use sum-type in your codebase without ever running `npm install`.  But this library is only 4kb gzipped, so even the non-idea part is pretty small.


## API

These docs are a bit stale as sum-type goes through some API churn.

## either

```js
import { either } from 'sum-type'

const Loaded = 
    either('Loaded')
```

### `either::Y`

`a -> Either Y a | N b`

### `either::N`

`b -> Either Y a | N b`

### `either::map`

`( a -> c ) -> Either Y c | N b`

### `either::bimap`

`(( a -> c ), ( b -> d )) -> Either Y c | N d`

### `either::bifold`

`(( a -> c ), ( b -> c )) -> Either Y a | N b -> c`

### `either::getWith`

`( c , ( b -> c )) -> Either Y a | N b -> c`

### `either::getOr`

`c -> Either Y a | N b -> c`

### `either::fold`

`Type -> { Y: a -> c, N: b -> c } -> tag -> c`

### `either::chain`

`( a -> Either Y c | N b ) -> Either Y c | N b`

### `toBoolean`

`Either Y a | N -> boolean`

> ⚠ You should almost always avoid coercing a sum type to a boolean.  If you are checking for `Y`, try `.map`.  If you are checking for `N` try `getOr`.  Booleans have no context, no associated data, but there's almost always associated data in your model so `toBoolean` is much like moving from a lossless format to a lossy format.

### `either::encase`

`( a -> b ) -> Either Y b | N Error`

Takes a potentially unsafe function and decorates it to return an Either where non thrown values are encased in `Either.Y` and thrown values are encased in `Either.N`.

### `maybe`

```js
import { maybe } from 'sum-type'

const Selected = 
    maybe('Selected')
```

### `maybe::Y`

`a -> Maybe Y a | N`

### `maybe::N`

`() -> Maybe Y a | N`

### `maybe::map`

`( a -> c ) -> Maybe Y c | N`

### `maybe::bimap`

`(( () -> b ), ( a -> b )) -> Maybe Y b | N`

### `maybe::bifold`

`(( () -> b ), ( a -> b )) -> Maybe Y a | N -> b`

### `maybe::getWith`

`( b , ( a -> b )) -> Maybe Y a | N -> b`

### `maybe::getOr`

`b -> Maybe Y a | N -> b`

### `maybe::fold`

`Type -> { Y: a -> b, N: () -> b } -> tag -> b`

### `maybe::chain`

`( a -> Maybe Y b | N ) -> Maybe Y b | N`

### `toBoolean`

`Maybe Y a | N -> boolean`

> ⚠ You should almost always avoid coercing a sum type to a boolean.  If you are checking for `Y`, try `.map`.  If you are checking for `N` try `getOr`.  Booleans have no context, no associated data, but there's almost always associated data in your model so `toBoolean` is much like moving from a lossless format to a lossy format.


### `maybe::encase`

`( a -> b ) -> Maybe Y b | N Error`

Takes a potentially unsafe function and decorates it to return an Maybe where non thrown values are encased in `Maybe.Y` and thrown values are represented as `Maybe.N()`.  If the specific error value is relevant try `Either.encase` instead as it will return your error object in an `Either.N` structure.

### Canonical Either

In the future some functions will return optional values.  This library encourages you to define your own but this library exports a pregenerated Either type that can be used canonically as the "real" Either which can be helpful when doing natural transformations and conversions between types and safe and unsafe data.

```js
import { Y, N, getOr } from sum-type

const yes = Y(100)
const no = N()

const f = getOr(0)

f(yes)
// => 100

f(no)
// => 0
```

### `tags`

```js
import { tags } from 'sum-type'

const Geom = 
    tags ('Geom') (
        ['Point' // : {x, y},
        ,'Line' // [p1, p2],
        ,'Poly' // [p1, p2, rest]
        ]
    )

const p1 = Geom.Point({ x:0, y: 0 })

const p2 = p1

const line = Geom.Line([p1, p2])

const poly = Geom.Poly([p1, p2, [p3]])
```

### `fold`

`Type -> { [tag]: a -> b } -> tag -> b`

### `mapAll`

`Type -> { [tag]: a -> b } -> tag -> Type b`


> ⚠ Both `map` and `chain` will skip executing tags when their instance has no `.value` property (usually determined by their type constructor).

### `chainAll`

`Type -> { [tag]: a -> Type b } -> tag -> Type b`

> ⚠ Both `map` and `chain` will skip executing tags when their instance has no `.value` property (usually determined by their type constructor).

But when using `map` and `chain` you are still required to pass in a handler for every tag.

It's recommended to use `otherwise` with `map` and `chain` to prefill values that are not relevant to the fold.

### otherwise

`string[] -> f -> { [key:string]: f }`

A helper function for generating folds that are versioned separately to the type definition.  It's useful when you want to avoid specifying each clause in a fold without losing type safety or introducing [other modelling problems](https://github.com/JAForbes/sum-type/issues/13)

Read more about `otherwise` [here](https://github.com/JAForbes/sum-type/blob/jf/main/docs/otherwise.md)

```js
const { Y, N } = T.Maybe
const Platform = T.tags ('Platform') (
    ['ModernWindows'
    ,'XP'
    ,'Linux'
    ,'Darwin'
    ]
)

const rest = T.otherwise([ // renamed
    'ModernWindows',
    'XP',
    'WSL',
    'Linux',
    'Darwin',
])

const windowsGUI = T.otherwise([
    'ModernWindows',
    'XP',
])

const foldWindowsGUI = f => T.mapAll(Platform) ({
    ... rest2(N),
    ... windowsGUI( () => Y(f()) )
})

const winPing =
    foldWindowsGUI
        ( () => 'ping \\t www.google.com' )

winPing( Platform.Darwin() )
// => T.Maybe.N()

winPing( Platform.XP() )
// => T.Maybe.Y('ping \t www.google.com')

```

---

## Experimental

These functions are likely to change at any moment.

### `tagName`

`tagName` -> `tagName:string`

Extract the name of a tag from an instance of a type.

### `getTags`

`T` -> `(tag:string)[]`

Returns a list of the `tag`'s for a given type `T`.

## Errors

Below is the source code definition for the internal errors this library throws. 

```js
const StaticSumTypeError =
    tags('StaticSumTypeError', [
        , 'ExtraTags' // {extraKeys}
        , 'MissingTags' // {missingKeys}
        , 'InstanceNull' // {T}
        , 'InstanceWrongType' // {T, x}
        , 'InstanceShapeInvalid' // {T, x}
        , 'tag' // {context}
        , 'VisitorNotAFunction' // {context, visitor}
        , 'NotAType' // {context, T}
    ])
```

 Error                  | Throws ... 
------------------------|--------
 `ExtraTags`            | when a fold specifies a visitor for tags that are not of the type.
 `MissingTags`          | when a fold does not specify a visitor for each tag of the type.
 `InstanceNull`         | when an argument was expected to be an instance of a sum type but was instead null.
 `InstanceWrongType`    | when an instance is a valid `sum-type` but not the specifically expected type for that function.
 `InstanceShapeInvalid` | when an instance has the correct `type` property but an unknown `tag` property.
 `VisitorNotAFunction`  | when a function was expected a visitor function but received anything else.
 `NotAType`             | when a function expected a `sum-type` `type` but received anything else.