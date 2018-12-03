# static-sum-type

[![pipeline status](https://gitlab.com/JAForbes/static-sum-type/badges/master/pipeline.svg)](https://gitlab.com/JAForbes/static-sum-type/commits/master)

[![coverage report](https://gitlab.com/JAForbes/static-sum-type/badges/master/coverage.svg)](https://gitlab.com/JAForbes/static-sum-type/commits/master)

## A simple library for complex logic.


#### Quick Start

```bash
npm install static-sum-type
```

```js
import { either } from "static-sum-type";

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

First step.  Create a `static-sum-type` for every state we want to track.

```js
import { either } from 'static-sum-type'

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

We'd model that in `static-sum-type` like so:

```js
import { either } from 'static-sum-type'

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

Your stack trace is going to be particularly legible because `static-sum-type` internally avoids point free composition.

Every error that `static-sum-type` yields, is itself a transformation of 
a `static-sum-type`.  All the error types are documented in the [Errors section](#errors)


#### Specification

`static-sum-type` differentiates itself by documenting the internal structure used for types and instances of types.  This allows you to create your
own constructors/transformers in userland.  You can store the exact output
of a static-sum-type constructor in a `redux-store`, `localStorage` or even a `json` column in `postgres`.

`static-sum-type` does not care where your data came from, just that it adheres to a particular structure.

#### Ecosystem

Each module listed here adheres to the static-sum-type specification. That specification is defined at [static-sum-type/docs/spec.md](https://gitlab.com/JAForbes/static-sum-type/tree/master/docs/spec.md).

- [superouter](https://gitlab.com/harth/superouter/) A Router that both exposes and internally uses static-sum-type to model route definitions, validation and more.

#### Project Goals and Motivations

- Serializable
- 0 Dependencies
- Tiny for frontend usage
- Avoid pitfalls found in other sum type libraries

#### How does static-sum-type differ from other libraries in the ecosystem?

`static-sum-type` removes the following features because we believe they lead to brittle codebases.

- placeholder cases
- auto spreading of values in cata/fold
- auto curried constructors
- prototypes (reference equality checks / instanceof)
- serializable / useable with Redux/meiosis etc

`static-sum-type` is technically 0KB, it's an idea. You can use static-sum-type in your codebase without ever running `npm install`.


### API

#### either

```js
import { either } from 'static-sum-type'

const Loaded = 
    either('Loaded')
```

#### `either::Y`

`a -> Either Y a | N b`

#### `either::N` 

`a -> Either Y a | N b`

#### `either::map`

`( a -> c ) -> Either Y a | N b -> Either Y c | N b`

#### `either::bimap`

`(( a -> c ), ( b -> d )) -> Either Y a | N b -> Either Y c | N d`

#### `either::bifold`

`(( a -> c ), ( b -> c )) -> Either Y a | N b -> c`

#### `either::chain`

`( a -> Either Y c | N d ) -> Either Y a | N b -> Either Y c | N d`

#### `maybe`

```js
import { maybe } from 'static-sum-type'

const Selected = 
    maybe('Selected')
```

#### `maybe::Y`

`a -> Maybe Y a | N`

#### `maybe::N`

`() -> Maybe Y a | N`

#### `maybe::map`

`( a -> c ) -> Maybe Y a | N -> Maybe Y c | N`

#### `maybe::bimap`

`(( () -> b ), ( a -> b )) -> Maybe Y a | N -> Maybe Y b | N`

#### `maybe::bifold`

`(( () -> b ), ( a -> b )) -> Either Y a | N -> b`

#### `maybe::chain`

`( a -> Maybe Y b | N ) -> Maybe Y a | N -> Maybe Y b | N`

#### `tagged`

```js
import { tagged } from 'static-sum-type'

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

`Type -> { [caseName]: a -> b } -> Case -> b`

#### `mapCase`

`(a -> Case a) -> (a -> b) -> Case -> Case`

#### `foldCase`

`(b, (a -> Case b)) -> Case -> b`

#### `chainCase`

`(a -> Case a) -> (a -> Case b) -> Case -> Case`

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
        , NotACaseConstructor: ['context', 'caseConstructor']
        , VisitorNotAFunction: ['context', 'visitor']
        , NotAType: ['context', 'T']
    })
```

 Error                  | Throws ... 
------------------------|--------
 `ExtraCases`           | when a fold specifies a visitor for cases that are not of the type.
 `MissingCases`         | when a fold does not specify a visitor for each case of the type.
 `InstanceNull`         | when an argument was expected to be an instance of a sum type but was instead null.
 `InstanceWrongType`    | when an instance is a valid `static-sum-type` but not the specifically expected type for that function.
 `InstanceShapeInvalid` | when an instance has the correct `type` property but an unknown `case` property.
 `NotACaseConstructor`  | when a function was expecting a case constructor but received anything else.
 `VisitorNotAFunction`  | when a function was expected a visitor function but received anything else.
 `NotAType`             | when a function expected a `static-sum-type` `type` but received anything else.