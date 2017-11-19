sum-type
========

[![Build Status](https://travis-ci.org/JAForbes/sum-type.svg?branch=master)](https://travis-ci.org/JAForbes/sum-type)

[![npm version](https://badge.fury.io/js/sum-type.svg)](https://badge.fury.io/js/sum-type)

Serializable, static, strongly typed and most of all: simple.

- Run time type checking powered by [sanctuary-def]
- Serializable: send types over the wire
- Supports all [sanctuary-def] defined types including generics
- Adheres to the [static-sum-type] specification and compatible with [static-sum-type] functions

Quick Start
-----------

```
npm install sum-type --save
```

```js
const { Record, Unit, $ } = 
    require('sum-type')


const User =
    Record (
        'User'
        ,{ Guest: Unit

        , Registered:
            { username: $.String
            , avatar: $.String
            }
        })

const renderWelcomeMessage =
    User.case ({
        Guest: () =>
            '<p>Welcome <a href="/signup">Sign Up?</a><p>'
        
        ,Registered: ({username, avatar}) =>
            `<div><img src="${avatar}"/><p>${username}</p></div>`
    })

const guest =
    User.Guest ()

const registered =
    User.Registered ({
        username: 'JAForbes'
        , avatar: 'https://somewebsite.com/image.jpg'
    })

renderWelcomeMessage (registered)
//=> <div><img src="https://somewebsite.com/image.jpg"/><p>JAForbes</p></div>

renderWelcomeMessage (guest)
//=> <p>Welcome <a href="/signup">Sign Up?</a><p>
```

What are sum type's and why are they fantastic?
-----------------------------------------------

It's common for our business models to contain properties that may not exist in certain situations.  This leads to null checks throughout our codebase.  Sum types are a way to define all the possible valid states, and those states can have wildly different structures.

A common scenario could be some data that isn't saved yet.  If it hasn't been sent to the server it likely doesn't have an id. But within that context its valid to not have an id yet.

Whereas, if the record has been saved and the id is null - that's a bug.  Without sum-types we may find ourselves assuming invalid data is valid and vice versa.  Without sum-types how are we to know whether this data is in a valid state?  Is the id intentionally null, or accidentally null?

Here's a demonstration of creating a `User` type with distinct states: `New` and `Saved`.

```js
const User = 
    T.Record ({
        New: 
            { user_username: T.$.String 
            }

        ,Saved: 
            { user_id: T.$.Number
            , user_username: T.$.String 
            }
    })

User.Saved ({ user_username: 'JAForbes' })
// Type Error: Missing user_id!

User.New ({ user_username: 'JAForbes' })
//=> { type: 'User'
//=> , case: 'New'
//=> , value: { user_username: 'JAForbes' } 
//=> }

```

Sum types allow us to define distinct states and tag them with a name.  Once we've defined our valid states, we can check which `case` our type's value adheres to.  This allows us to remove all `null` checks from our codebase and have complete confidence in any property accessors.

```js
const hasId = 
    User.case ({
        New: ({ user_username }) => false
        ,Saved: ({ user_id, user_username }) => true
    })

const newUser =
    User.New ({ user_username: 'JAForbes' })

hasId ( newUser )
//=> false
```

Sum types go by many names.  sum types, union types and enumerated types are equivalent terms.  You may also hear the term algebraic type.  An algebraic type is a type comprised of other types, and `sum-type`'s are the most common form of algebraic type (but there are others like subtraction and intersection types too.)

Sum types allow us to push as much of our business model as possible into the type system.  This is often referred to as Domain Driven Design, a great introduction and argument for DDD is Scott Wlaschin's talk [Railway Oriented Programming]

All in all, sum types are very cool.  They are useful in solving problems in almost any domain and it's highly likely you can benefit from using them in your projects.

What is this library's interpretation of sum types?
---------------------------------------------------

There are many popular JS sum-type libraries.  But they tend to have similar interpretations.  Both [daggy] and [union-type] allow you to treat your sum types as prototypical classes with methods.

This library used to have the same interpretation.  But after using that interface in a lot of projects I shifted towards a more opinionated take on sum type's with hopefully less edge cases.  

This iteration eschews numerous points of complexity by adhering to static functions only.  Type signature's are simple and variadics are avoided wherever possible.  `sum-type` takes advantage of a powerful Haskell like type system by using the module [sanctuary-def] behind the scenes.

`sum-type` also sits on top of a very simple specification: `static-sum-type` that attempts to create a protocol for various sum-type and functional libraries to interact.

One of the core tenets of [static-sum-type] is serializable case values.

```js
const newUser = 
    User.New ({ user_username: 'JAForbes' })

const literallyTheSameThing =
    JSON.parse(JSON.stringify(newUser))

// totally fine
User.case( ... ) ( literallyTheSameThing )
```

`sum-type` is an opinionated layer sitting on top of another opionated layer.  If there are particular aspects of this library that seem a bridge too far I suggest checking out other great libraries in this space like the aforementioned [daggy] and [union-type].

Even just internalizing the idea of sum types is incredibly valuable.

Initialization
--------------

#### Default configuration

```js
const T = require('sum-type')

const Point = T.Record('Point', {
    X: { x: T.$.Number }
    ,XY: { x: T.$.Number, y: T.$.Number }
    ,XYZ: { x: T.$.Number, y: T.$.Number, z: T.$.Number }
})

Point.XY({ x:0, y:0 })
```

`sum-type` uses a library called [sanctuary-def] to perform runtime type checking.  

```js

Point.XY(0, 0)
// Type Error: 
// too many arguments

Point.XY([0, 0])
// Type Error: 
// [0,0] is not a member of Point.XY ({ x:0, y:0 })
```

[sanctuary-def] is highly configurable but the learning curve can be quite steep for new users.  That's why `sum-type` has a default entry point that set's up [sanctuary-def] automatically.

The `$` variable allows us to access [sanctuary-def] types like `$.Number` or `$.String`.

For a full list of of [sanctuary-def] types, please refer to the [documentation](https://github.com/sanctuary-js/sanctuary-def#types).

```js
const T = 
    require('sum-type')

const R = 
    require('ramda')

const Point = 
    T.Record (
        'Point'
        ,{ X: 
            { x: T.$.Number 
            }
        , XY: 
            { x: T.$.Number
            , y: T.$.Number 
            }
        , XYZ: 
            { x: T.$.Number
            , y: T.$.Number
            , z: T.$.Number 
            }
        }
    )

const o = 
    f => g => x => f(g(x))

Point.map = 
    f => Point.case ({
        X: o(Point.X) (f)
        ,XY: o(Point.XY) (f)
        ,XYZ: o(Point.XYZ) (f)
    })

Point.multiply = 
    x => Point.map (
        R.map ( R.multiply (x) )
    )

Point.multiply (4) ( Point.XYZ ({ x:1, y:2, y: 3 }) )
//=> Point.XYZ ({ x: 4, y: 8, z: 12 })

```

Nested types
------------

You can compose type definitions because the type constructors return [sanctuary-def] compatible `NullaryType`'s.  These types verify the `case` and `type` property are valid when initializing your union.

```js
const Point = 
    T.Record (
        'Point'
        ,{ Point: 
            { x: T.$.Number
            , y: T.$.Number
            }
        }
    )

const Shape = 
    T.Record (
        'Shape'
        ,{ Circle: 
            { radius: T.$.Number
            , origin: Point 
            }
        , Rectangle: 
            { topLeft: Point
            , bottomRight: Point
            }
    })
```

API
---

- [T.Value](#tvalue)
- [T.Record](#trecord)
- [T.$](#t)
- [T.Predicate](#tpredicate)
- [T.Unit (Advanced)](#tunit)
- [T.Recursive (Advanced)](#trecursive)
- [T.SST (Advanced)](#tsst)

#### T.Value

A type constructor for defining union types with raw values.

```js
const ISO8601 =
    T.Value('ISO8601', {
      MM: T.$.Number
      ,SS: T.$.Number
      ,MS: T.$.Number
      ,HH: T.$.Number
    })

const to = {
    ms: ISO8601.case({
        MS: n => n
        ,SS: n => to.ms(ISO8601.MS(n/1000))
        ,MM: n => to.ms(ISO8601.SS(n/60))
        ,HH: n => to.ms(ISO8601.MM(n/60))
    })
}

to.ms( ISO8601.MM(1) )
//=> 60000

```

#### T.Record

A convenience type constructor for defining union types where each case is a record

```js
const Point = T.Record(
    'Point'
    ,{Point: {x: T.$.Number, y: T.$.Number}}
)

const Shape = T.Record('Shape', {
    Circle: { radius: T.$.Number, origin: Point }
    ,Rectangle: { topLeft: Point, bottomRight: Point}
})

Shape.center = 
    Shape.case({
        Circle: (o) => o.origin
        
        ,Rectangle: ({ 
            topLeft: { value: { x: x1, y: y1 }
            , bottomRight: { value: { x: x2, y2 } } 
        }) => Point.Point ({ 
                x: x1 + (x2 - x1) / 2
                , y: y1 + (y2 - y1) / 2
            })  
    })

Shape.center ( 
    Shape.Circle ( 
        Point.Point ({ x:2, y: 3 })
    ) 
)
// => Point.Point ({ x:2, y: 3 })

Shape.center ( 
    Shape.Rectange ( 
        Point.Point ({ x:10, y: 20 })) 
        ,Point.Point ({ x:20, y: 30 })) 
    )
)
// => Point.Point ({ x: 15, y: 25 })
```

#### T.Recursive

A type constructor that allows a type to refer to itself.

```js
const List =
    T.Recursive (
        'List'
        , $T => ({
            Nil: T.Unit
            ,Cons: $.Pair( $.Any, $T )
        }))

const toString =
    List.case ({
        Cons: ([head, tail]) => `${head} : ${toString(tail)}`
        ,Nil: () => 'Nil'
    })

const cons = List.Cons
const nil = List.Nil

const list =
cons ([1, cons ([2, cons ([3, nil()]) ]) ])

toString(list)
//=> '1 : 2 : 3 : Nil'
```

#### T.Unit

A sentinel value used to signify that a constructor case receives no value.

```js
const Maybe = 
    T.Value ('Maybe', {
        Just: T.$.Any
        ,Nothing: T.Unit
    })

Maybe.Just (2)
//=> Maybe.Just(2)

Maybe.Nothing () // Valid thanks to T.Unit!
//=> Maybe.Nothing()
```

#### T.$

A reference to the underlying [sanctuary-def] module.

Please refer to the [sanctuary-def] [documentation](https://github.com/sanctuary-js/sanctuary-def) for reference

#### T.Predicate

Create a Nullary type from a predicate function.

```js
const isUUID = 
    require('is-uuid')

T.$.UUID = 
    T.Predicate(
        x => isUUID.v4(x)
    )

const ID = 
    T.Value(
        'ID'
        ,{ Sequence: T.$.Number
        , UUID: T.$.UUID
        }
    )
```

#### T.SST

Convert a [static-sum-type] union into a [sanctuary-def] Nullary type.

```js
const yslashn = 
    require('static-sum-type/modules/yslashn')

const Registered = 
    yslashn.maybe('Registered')

const { fold, map } = 
    require('static-sum-type/configs/dev/foldThrow')

const User = 
    T.Value ('User', {
        User: T.SST (Registered)
    })

User.User (
    Registered.Y ( Date.now() )
)

fold ( User ) ({
    User: fold ( Registered ) ({
        Y: (when) => 'User registered at: ' + when
        N: () => 'User is a guest'
    })
})

const signupDate =
    map ( User ) (
        map( Registered ) (
            when => new Date( when )
        )
    )

```


Advanced
--------

Below is stuff you do not need to know to use this library effectively, but it's cool stuff that may interest you.

#### Interop with [static-sum-type]

`sum-type`'s are compatible with [static-sum-type] for free.  That means you can pass a `sum-type` you've created into [static-sum-type] functions or within a type definition.  

However, if you want to use a [static-sum-type] in a `sum-type` definition you'll need to convert the type into a [sanctuary-def] `NullaryType` using `T.SST`.

Here's a little demo:

```js
// A helper for generating common `sum-type`s
const yslashn = 
    require('static-sum-type/modules/yslashn')

// Functions that work on static-sum-type's
const { fold, map, bimap } = 
    require('static-sum-type/configs/dev/foldThrow')

// Create a type: Registered with a maybe-like structure
const Registered = 
    yslashn.maybe ('Registered')

// Create a maybe
const Maybe = 
    yslashn.maybe ('Maybe')

const User = 
    T.Value ('User', {
        User: T.SST (Registered)
    })

User.User (
    Registered.Y ( Date.now() )
)

fold ( User ) ({
    User: fold ( Registered ) ({
        Y: (when) => 'User registered at: ' + when
        N: () => 'User is a guest'
    })
})

const signupDate =
    fold ( User ) ({
        User: bifold( Registered ) (
            Maybe.N
            mwhen => Maybe.Y( new Date( when ) )
        )
    })


signupDate ( User.User( Registered.Y ( Date.now() ) ) )
//=> Maybe.Y( DateObject )

signupDate ( User.User( Registered.N () ) )
//=> Maybe.N
```

You can read more about [static-sum-type] here: gitlab.com/JAForbes/static-sum-type.  [static-sum-type] is an evolving project, utilities and modules built on top of it are constantly changing: but the specification itself can be considered stable.


#### Custom sanctuary-def configuration

For users familiar with [sanctuary-def] you are free to customize the [sanctuary-def] instance passed to `sum-type`.

```js
const $ = require('sanctuary-def')
const T = require('sum-type/custom')({
    checkTypes: true
    ,env: $.env
})
```

You may want to customize the environment if you are using type variables with your sum-types.  Or you may want to reduce the default environment to improve performance.  You may just want to disable type checking altogether.

FAQ
---

#### What is [sanctuary-def]

[sanctuary-def] is a library that emulates a Haskell like type system in Javascript.

#### Do I need to understand [sanctuary-def] to use this library?

For basic usage you can get away with using `sum-type` without knowing any [sanctuary-def].  For moderate usage you may from time to time refer to the available types available in [sanctuary-def].  For advanced users you may find familiarizing yourself with [sanctuary-def] extremely valuable.

#### How do I turn off type checking?

See the manual configuration section.

#### What is [static-sum-type]?

[static-sum-type] is a simple specification for defining union types.  It aims to solve some common problems that occur when using union type libraries in Javascript like serialization, variadic signatures, payload size, performance and more.

You can use [static-sum-type] directly, or you can use libraries or modules that are compatible with the spec.  If you have a type that adheres to the spec you'll be able to take advantage of predefined functions like `map`, `bimap`, `fold`, `bifold` and more.

#### Do I need to understand [static-sum-type] to use `sum-type`?

Certainly not.  But its quite simple, just a few data structures.

#### What is the actual structure of the returned case instances?

A struct with at least 2 properties: `type`, `case` and potentially `value` if it's not a Unit case.

For example:

```js
const Maybe = 
    T.Value ('Maybe', {
        Just: T.$.Any
        ,Nothing: T.Unit
    })

Maybe.Just (2)
//=> { type: 'Maybe', case: 'Just', value: 2 }

Maybe.Nothing ()
//=> { type: 'Maybe', case: 'Nothing' }


```
#### Why are unit types nullary functions instead of just an object?

Other libraries like [union-type] skip creating constructor functions for types that contain no value.  This mimicks Haskell more closely but I've found it's awkward in practice when composing several levels of types together, so I've bucked the trend.

#### Can I define instance methods on my types?

This library encourages static methods and so this API no longer provides any affordances for that style unlike other libraries like [daggy], and [union-type].  But adding methods to a case will not break interop with this library or [static-sum-type] as long as those methods do not begin with a capital letter ( as per [the spec](https://gitlab.com/JAForbes/static-sum-type/tree/master/modules/fold#whats-a-type) ).

#### How do I define a case that contains more than 1 value.

Use a pair, a list, a record etc.  

#### Why doesn't `sum-type` support the placeholder case like [union-type] and previous versions of this library.

In practice I found it leads to brittle error prone code.  You can often avoid repeating branches by wrapping your result in a Maybe/Either etc.

#### Why can't I create an Anonymous type anymore?  

It's not advisable as it makes for worse type signatures, but you can easily avoid creating a name by passing in an empty string as the name.

#### Why can't I pass in a documentation URL like other [sanctuary-def] types.

I'm happy to be proven wrong here, but I think this library is used more for internal business logic and not as predefined types you can export.  The URL feature makes a lot of sense if your types themselves have end users.  It makes sense for [sanctuary-def] to include a url property so that sanctuary can benefit from well documented errors.  But within a project it rarely makes sense and add's another argument to the signature.

> Note, there may be an undocumented way to do this but I'll leave that as an exercise for the reader.

#### How do I access the value with in a type?

Every type has a `.value` property.

#### How do I access the type of a case instance?

Every case has a `type` and `case` property.

#### Why can't I initialize types with a spread of values?

This library used to support that, but I vound it leads to brittle code and is hard to read.

It's very useful that constructor signatures are not variadic.  There are unit constructors which are thunks and receive no args.  And there are value constructors which accept one value.  If you pass too few, too many, or the wrong types you'll get a helpful error message.  In previous versions you'd receive no type feedback until the curried function executed, so it was quite difficult to track down the source of bugs.

#### How does `sum-type` differ from [union-type]?

This library initially intended to be mimic [union-type]'s API but with [sanctuary-def] as a backend for better type errors.  After using [union-type] to solve a lot of problems at work I discovered various parts of the API caused friction and brittle code.  This library is in many ways a response to that initial interface.

- `sum-type` case instances are serializable, where as [union-type] uses instanceof checks and prototypical methods
- case's can contain 0 or 1 values, where as union type cases can contain 0-9 values (due to a limitation in ramda's curry function)
- Union type's supports a placeholder case, this library removes that feature as it leads to brittle code
- Various convenience features are removed like `caseOn` 
- [union-type] supports defining type's as either records or tuples.  This library only supports cases with a single value.
- [union-type] uses `Symbol.iterator` to extract values from a case instance, the library simply exposes the `value` property

[sanctuary-def]: https://github.com/sanctuary-js/sanctuary-def
[static-sum-type]: https://gitlab.com/JAForbes/static-sum-type
[union-type]: https://github.com/paldepind/union-type
[Railway Oriented Programming]: https://vimeo.com/97344498
[daggy]: https://github.com/fantasyland/daggy