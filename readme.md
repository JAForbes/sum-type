static-sum-type
===============

A simple library for complex logic.
-----------------------------------


#### What is it

This library is a series of tiny composeable modules designed to make working with sum-types more flexible without losing any power.

Each module interops with every other module because they all share a base specification.  That specification is defined in [static-sum-type/fold](./fold/readme.md) because all behaviour we need can be defined in terms of `fold`.

`fold` requires a data structure that can be written manually using a variety of syntax.  The interface was designed to piggy back on some default behaviours of Javascript types (like functions and classes) to avoid manual typing.  But its completely possible (albeit verbose) to define a type as a simple pojo.

```js
// A type
const Maybe {
    name: 'Maybe'
    ,Just: {}
    ,Nothing: {}
}

// A case instance
const just = {
    type: { name: 'Maybe' }
    ,case: { name: 'Just' }
    ,value: 2
}

fold(Maybe)({
    Just: x => x * 2
    Nothing: () => 0
})(just) //=> 4
```

The design of the spec allows for a variety of other statically analyzable syntaxes which can be viewed at [static-sum-type/fold](./fold/readme.md).  But its also possible to generate types dynamically far more succintly.

The predicated module is an example of a type generator that is spec compliant but also checks if values meet a predicate.  This can be seen as a low level type checking system when you don't want to pay the filesize cost of a more completely type checking library like sanctuary-def.

```js
const Maybe = Predicated('Maybe', {
    Just: (...args) => args.length == 1
    ,Nothing: (...args) => args.length == 0
})

const just = Maybe.Just(2)

fold(Maybe)({
    Just: x => x * 2
    Nothing: () => 0
})(just) //=> 3
```

Check out the [predicated module here](./predicated/readme.md)

The plan is to build several tiny modules that cover specific use cases.  A sanctuary-def module, a typescript module etc.

Each module will always have a production counterpart that assumes types are 100% correct so you do not pay the performance or network load cost in production.

#### Project Goals and Motivations

- 0 Dependencies 
- Tiny for frontend usage ( prod is 11 LOC, ~200B )
- Statically Analyzable
    - Nice editor experience in VSCode or tern.js
    - Easy interop with TS/Flow
    - Less magic

- Represent types for raw values (like Numbers)
- Serializable types (for sending typed data over the wire)
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
    - No auto curried constructors (like sum-type/union-type)
