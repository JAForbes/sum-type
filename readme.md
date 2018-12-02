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

// Create different Either types
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

Oh and you're tracking all those states for every item in a list separately.

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

If we wanted to traverse and extract at the same time, we could use `fold` instead of `map`.

We can flatten this composition with standard function composition.

```js
import { compose } from 'ramda'

const f =
    compose(
        Selected.map
        ,Loaded.map
        ,Modified.map
        ,Saved.bimap(
            x => 'unsaved'
            ,x => 'saved'
        )
    )

f( data )
//=> Selected.Y( Loaded.Y( Modified.Y( Saved.N('unsaved') ) ) )
```

If we pass the wrong data structure into our composition, we will get a specific, helpful error message explaining what your type looked like
and what that particular method was expecting.

Your stack trace is going to be legible because `static-sum-type` internally avoids point free composition.

Every error that `static-sum-type` yields, is itself a transformation of 
a `static-sum-type`.  All the error types are documented too.


#### Specification

`static-sum-type` differentiates itself by document the internal structure used for types and instances of types.  This allows you to create your
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

#### How does static-sum-type differ from other libraries in the ecosystem.

`static-sum-type` removes the following features because we believe they lead to brittle codebases.

- placeholder cases
- auto spreading of values in cata/fold
- auto curried constructors
- prototypes (reference equality checks / instanceof)

`static-sum-type` is technically 0KB, it's an idea. You can use static-sum-type in your codebase without ever running `npm install`.


### API

#### either

#### either.map

#### either.bimap

#### either.bifold

#### either.fold

#### either.chain

#### maybe

#### maybe.map

#### maybe.bimap

#### maybe.bifold

#### maybe.chain

#### tag

#### fold

#### mapCase

#### foldCase

#### chainCase


### Errors