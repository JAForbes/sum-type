# sum-type

## A simple library for complex logic.

- 🐭 1.3kb unzipped!!!
- 💾 Serializable (perfect for localStorage)
- 🎁 Powerful OOTB (Either, Resource, get/bifold/match)
- 🛠 Extensible ( Open specification, data first ✊)
- 🚀 Makes UI and API code safer, cleaner and more fun.


## Quick Start

```bash
npm install sum-type@next
```

```typescript
const Loaded = 
    T.either("Loaded", (_: string) => _, (_: number) => _)

const loaded = 
    Loaded.Y("Hello World")

const loading = 
    Loaded.N(55)

const render = (x: T.Instance<typeof Loaded>) =>
    Loaded.bifold(
        x
        , x => `Loading: ${x}%`
        , x => `Loaded: ${x}`
    )

const transform = (x: T.Instance<typeof Loaded>) =>
    Loaded.mapY(
        x, x => x.toUpperCase()
    )

assert.deepEqual(Loaded.mapN( loading, x => x+'%' ), {...Loaded.N(55), value: '55%' })

assert.deepEqual(
    [ render( transform( loaded ) ) 
    , render( transform( loading ) )
    , render( loading )
    ],
    [
        'Loaded: HELLO WORLD',
        'Loading: 55%',
        'Loading: 55%',
    ]
)
```

## What is it?

Freedom from booleans.

Scenario: You've solving a moderately difficult problem, and there's a degree of data modelling involved. You've got several booleans for tracking loading states, save states, modified states, selected states and on and on.

Oh! and you're tracking all those states for every item in a list separately.

Depending on a specific combination of these boolean flags you need to render differently, talk to the server differently, persist state differently.

It very quicky becomes a mess. We reach for complex tools to help us manage the mess. But instead all we needed was to make it impossible to not traverse every single state.

First step. Create a subtype for every state we want to track.

```typescript
import * as T from 'sum-type'

type Data = { id: string }
const Data = T.type('Data', 
	{ Deselected: (_:any) => _
	, Loading: (_:number) => _
	, Modified: (_:Data) => _
	, Saved: (_:Data) => _
    }
)
```

Our type Data has been generated with 4 tags, each has a constructor:

```typescript
Data.Saved(data)
//=> { type: 'Data', tag: 'Y', value: data }

Data.Deselected({})
//=> { type: 'Deselected', tag: 'N', value: {} }
```

Our constructors just tag our data with a label that allows us to build logic on top of it. Normally this label would be stored separately to the data.

Something like:

```typescript
let selected = false
let data = ...
```

Which is fine at first, until it looks like this:

```typescript
let selected = true
let loaded = true
let modified = true
let saved = false
let data = x
```

We'd model that in subtype like so:

```typescript
import * as T from 'sum-type'

type Data = { id: string }
const Data = T.type('Data', 
	{ Deselected: (_:any) => _
	, Loading: (_:number) => _
	, Modified: (_:Data) => _
	, Saved: (_:Data) => _
    }
)

const data = Data.Modified(x)
```

When we want to transform the value of data we can use any number of useful helpers. Like `map[Tag]`, `flatMap[Tag]`, `get[Tag]` or where `[Tag]` is any one of your tag names. E.g. `mapLoading`.

```typescript
const f = (x: S.Instance<typeof Data>) => Data.mapLoading(
    x,
	x => x * 2
)

f( Data.Loading(2) )
//=> Data.Loading(4)

f( Data.Modified({ id: 'hi' }) )
//=> Data.Modified({ id: 'hi' })

Data.getLoading(0, Data.Saved({ ... }))
//=> 0

Data.getLoading( Data.Loading(3) )
//=> 3
```

You can also `match` all the cases, as every type generated by sum-type is a discrimated union. Which means (in layperson's terms), you'll get a helpful error if you don't account for every possibly tag.

```typescript
const NoData = Data.otherwise(['Selected', 'Loading'])

const f = 
	Data.match({
		... NoData( () => 'Nothing' )
		,   Saved: x => 'Saved: ' + x.id
		,   Modified: x => 'Modified: ' + x.id
	})

f( Data.Loading() )
//=> 'Nothing'

f( Data.Saved('1') )
//=> 'Saved: 1'
```

## Helpful Errors

If we pass the wrong data structure into our composition, we will get a specific, helpful error message explaining what your type looked like and what that particular method was expecting.

Your stack trace is going to be particularly legible because sum-type internally avoids point free composition and auto currying, and will report errors at compile time.

```typescript
Either.match(either, { Y: () => 'hi', N: () => 'bye' })
```

## Project Goals and Motivations

- Serializable
- 0 Dependencies
- Tiny for frontend usage
- Avoid pitfalls found in other sum type libraries
- Helpful Error Messages designed for makers

## API

### `.type`

```typescript
const Resource = T.type('Resource', {
    Loading: (_: any) => null,
    Loaded: (_: { id: string; title: string }) => _,
    Error: (_: Error) => _,
    Empty: (_: any) => _,
})

const resource = Resource.Loaded({ id: '1', title: 'Example' })
```

A declaration like the one above creates a supertype: `Resource`, within the supertype are subtypes, each subtype has a "tag" or name.

Supertype is the naming convention used in this library.  

The supertype is 

- the union of its subtypes (e.g. `Loading | Loaded | Error | Empty`)
- a name (`Resource`)
- some static methods and metadata (more on that later)

A supertype is not a union type, it *contains* a union type.

Types aren't that useful if we can't create instances of a given type, for that we use constructors.

### SubType constructors:

To construct an instance you call the constructor method on the supertype for the specific subtype.


E.g. if you want to create an instance of `Empty` you can `Resource.Empty({})`

This will return this structure:

```js
{
    type: 'Resource',
    tag: 'Empty',
    value: {}
}
```

These instances have no methods, they have these 3 properties and nothing more.  These values are designed to be serializable so they can saved/restored/transmitted without any special deserialization.

It is completely valid to directly interact with the instance's properties and use native constructs for interacting with them.  E.g. this is completely fine:

```typescript
switch (instance.tag) {
    'Empty': {
        return 0
    }
    'Loading': {
        return 1
    }
    'Error': {
        return 2
    }
    'Loaded': {
        3
    }
}
```

In fact using native constructs can be very beneficial when dealing with perf sensitive code, nested async for loops (where visitor functions simply add noise), or dealing with instances in a service that doesn't have or need the *sum-type* library to perform a simple check/validation.

But writing the same code to handle sum types can lead to bugs and mistakes, so we encode common matterns in utilities which we cover below.

### `type.is[Tag]`

The simplest util, it simply checks if an instance is a specific subtype.

```typescript
Resource.isLoaded( Resource.Empty({}) )
// => false
```

### `type.match`

Arguably the most important function for a sum type library is the ability to match on each case and receive a type error when you are missing a case.

With *sum-type* you can do that by calling `type.match` for example:

```typescript
Resource.match(instance, {
    Loaded: () => 4,
    Loading: () => 3,
    Error: () => 2,
    Empty: () => 1
})
```

The inner value is passed to each tag's function:

```typescript
const value = Resource.match(instance, {
    Loaded: ({ title }) => title === 'cool' ? 4 : 5,
    Loading: (progress) => progress == 100 ? 3 : 2,
    Error: (error) => error instanceof SyntaxError ? 3 : 2,
    Empty: () => 1
})
```

The above logic isn't meaningful, its just demonstrating that we can access each subtype's internal data and coerce each case to a single value of a single type.

### `type.otherwise`

Specifying all the cases of a smaller *sum-type* isn't a big deal, but as we add more cases it can be beneficial to group subsets and handle them in one go.  This is a bit like switch fallthrough in JS.

We can group together all the cases we're interested in like so:

```typescript
const NotLoaded = Resource.otherwise(['Loading', 'Error', 'Empty'])
```

When we invoke `NotLoaded`  with `() => null` we get the following structure back:

```typescript
{
    Loading: () => null,
    Error: () => null,
    Empty: () => null
}
```

We can then spread that structure into a call to `.match` and typescript will know whether or not we have handled every case.

```typescript
const getTitle = Resource.match(instance, {
    ...NotLoaded(() => null),
    Loaded: x => x.title
})
```

We can create an `otherwise` instance that uses all tags by just not specifying any tags.  This gives you a generic placeholder function:

```typescript
// equivalent to Resource.otherwise(['Loaded', 'loading', 'Error', 'Empty'])
const _ = Resource.otherwise()

const getTitle = Resource.match(instance, {
    ..._(() => null),
    Loaded: x => x.title
})
```

### `type.get[Tag]` <a name="getTag"></a>

`.get[Tag]` has three overloads, but they all let you safely access a value from within a union handling the case you specify with a visitor function and handling other cases with a default value.  Both the default and the visitor function can be omitted:

The follow tables are all invocations of this function:

```typescript
Resource.getLoaded(instance, defaultValue, getter)
// => result
```

| `instance` | `defaultValue` | `getter` | `result` |
|---|---|---|---|
| `Resource.Loaded({ id: 'hello', title: 'cool' })` | `-` | `-` | `{ id: 'hello', title: 'cool' }` |
| `Resource.Loading(55)` | `-` | `-` | `null` |
| `Resource.Loaded({ id: 'hello', title: 'cool' })` | `'hello` | `-` | `null` |
| `Resource.Loading(55)` | `'hello'` | `-` | `'hello'` |
| `Resource.Loaded({ id: 'hello', title: 'cool' })` | `'hello` | `x => x.title` | `'cool'` |
| `Resource.Loading(55)` | `'hello'` | `x => x.title` | `'hello'` |

If you just want to get the `instance` `value` if it is the given `tag` do not supply `defaultValue` or `getter`.  It will return `null` if the instance is any other case.

You could do the same manually with a ternary.  The following two examples are equivalent.

```typescript
instance.tag === 'Loaded' ? instance.value : null
```

```typescript
Resource.getLoaded(instance)
```

The next overload, let's you change the `defaultValue` from `null`, this can be helpful for normalizing e.g. normalizing to a number.

The following two examples are equivalent:

```typescript
instance.tag === 'Loading' ? instance.value : 0
```

```typescript
Resource.getLoaded(instance, 0)
```

The final overload allows you to transform the matching value.  The following two examples are equivalent.

```typescript
instance.tag === 'Loaded' ? instance.value.title : 'No Title'
```

```typescript
Resource.getLoaded(instance, 'No Title', x => x.title)
```

### `type.encase`

### `type.map[Tag]`

`map[Tag]` lets you transform the value of a type but maintain the same outer structure.

```typescript
const loaded = Resource.Loaded({ id: '1', title: 'cool' })
const loading = Resource.Loading(55)

Resource.mapLoaded(loaded, x => x.title)
// => { type: 'Resource', tag: 'Loaded', value: 'cool' 

Resource.mapLoaded(loading, x => x.title)
// => { type: 'Resource', tag: 'Loaded', value: { id: '1', title: 'cool' } }
```

Note that when the instance was not the specified `tag` the operation is a `no-op`.

Also note you could not instantiate this transformed value directly because the definition specifies a specific type.  

```typescript
// TypeError: should be { id: string, title: string }
Resource.Loaded('cool')
```

But typescript will respect the return value as being the same structure with a new value type for that case.

### `type.flatMap[Tag]`

`flatMap[Tag]` is most useful for changing to a different subtype based on the current value of the instance:

```typescript
Resource.flatMapLoading(
    instance
    , x => (
        x !== 100 
            ? Resource.Loading(x) 
        : data != null
            ? Resource.Loaded(data)
            : Resource.Empty({})
    )
)
```

But note, like `map[Tag]` we can also change the inner value of a tag

```typescript
const result = Resource.flatMapLoading(
    instance
    , x => ({ type: 'Resource', tag: 'Loaded', value: { different: true }})
)
```

Typescript will inforce the `type` and `tag` property conform to the original type, and will then infer a new union type result where the given tag has the new returned type.

This isn't very ergonomic when constructing objects manually, but when used in conjuction with `map[Tag]` it can be beneficial.


## Either

`Either` is a supertype factory that helps generate sum types that only have two tags `Y` and `N`.  It is great for modelling things that can succeed or fail.  For example, parsing JSON may fail if the input is not valid JSON.

### `.either`

You can create your own `Either` supertype using the exported `either` function

```typescript
import * as T from 'sum-type'

const JSONValue = T.either(
    'JSONValue',        // the name of the type
    (_: any) => _,      // the type of `value` if parsing succeeded, in this case `any`
    (_: Error) => _,    // the type of `value` if parsing failed, in this case `Error`
)
```

We could use this type to create a JSON parsing function:

```typescript
function parseJSON(s: string): JSONValue {
    try {
        return JSONValue.Y(JSON.parse(s))
    } catch (e) {
        return JSONValue.N(e as Error)
    }
}

parseJSON('invalid json')
// =>
//  { type: 'JSONValue'
//  , tag: 'N'
//  , value: new SyntaxError(
//      `Unexpected token 'i', "invalid json" is not valid JSON`,
//  ) 
//  }

parseJSON('{ "valid": true }')
// => 
//  { type: 'JSONValue'
//  , tag: 'Y'
//  , value: { valid: true }
//  }
```

> Note there is a quicker way to generate a funciton like `parseJSON` via `eitherType.encase`

### `eitherType.Y`

Produce a value that represents the successful result of your either type.

```typescript
JSONValue.Y({ some: 'parsed', ['json']})
```

### `eitherType.N`

Produce a value that represents the failed result of your either type.

```typescript
JSONValue.N(new SyntaxError(...))
```

### `eitherType.bifold`

Handle both cases simultaneously with two visitor functions:

```typescript
JSONValue.bifold( 
    parsed
    , err => 'Failed to parse JSON'
    , data => 'Successfully parsed JSON' 
)
```

### `eitherType.get`

Equivalent to calling `.getY` (See `get[Tag]`)

### `eitherType.map`

Equivalent to calling `.mapY` (See `map[Tag]`)

### `eitherType.flatMap`

Equivalent to calling `.flatMapY` (See `flatMap[Tag]`)

## Resource

### `type.resource`

In the same way that `Either` is good at modelling operations that may or may not fail, `Resource` is good at modelling the loading of data.

Because this pattern is so common, we provide a built-in type for generating custom `Resource` types.

```typescript
type File = { file_id: string, ext: string, href: string }

const FileResource = T.Resource<'Fileresource',File>('FileResource')
```

You might use it when downloading data like so:

```typescript

// uninitialized
let file : FileResource.Empty({})

async downloadFile(id){
    try {
        file = FileResource.Loading(0)

        file = FileResource.Loaded(await fetchFile(id))
    } catch (e) {
        file = FileResource.Error(e as Error)
    }
}
```

You can build generic utils on top of this data structure, for inspiration checkout: [Solid.js](https://www.solidjs.com/docs/latest/api#createresource) and / or [React Rest Hooks](https://resthooks.io/docs/api/useSuspense)

Like any other subtype you automatically get generated methods for each tag, e.g. `.mapLoaded` or `.getLoaded` and the common universal methods like `.match`

## Type Utilities

### `Value`

### `Instance`

## FAQ

### Why is Either's subtypes named `Y|N` instead of `Right|Left`

It's a night short and sweet convention and while `Right|Left` allows you to model things that aren't necessarily failable operations, generally that is what they are used for so we name it accordingly. 

### Why are the functions data first, where is partial-application / currying?

Again, informed from real world usage, we found we needed a mix of both data first and data last in different situations.  When dealing with a store API the data you need is already in scope, so creating partially applied folds ahead of time was not needed.

In the cases where we really did want to define something re-usable, the syntax cost wasn't high enough to avoid wrapping the data-first variant in an arrow function.

Finally, at [harth](harth.io) in the interest of having a smaller and [(Rich Hickey) simple](https://www.youtube.com/watch?v=SxdOUGdseq4) API, we have drifted away from auto-currying generally.  Things are either manually curried and data last (`config => options => data`) or they are data first (`(data, config, options)`).

We had cases where code wasn't running because the definition of an auto-curried function changed and the callsite simply silently failed with no type error.

We provide type helpers like `type.Instance` and `type.Value` to make it simple to re-export these utils as data last operations without losing any type information.