# static-sum-type

[![pipeline status](https://gitlab.com/JAForbes/static-sum-type/badges/master/pipeline.svg)](https://gitlab.com/JAForbes/static-sum-type/commits/master)

[![coverage report](https://gitlab.com/JAForbes/static-sum-type/badges/master/coverage.svg)](https://gitlab.com/JAForbes/static-sum-type/commits/master)

## A simple library for complex logic.

#### What is it

A series of tiny modules that make encoding logic as data _a breeze_ ⛱️.

#### Modules

- [fold](https://gitlab.com/JAForbes/static-sum-type/tree/master/modules/fold) A module of utility functions that interop with other `static-sum-type` modules.

- [yslashn](https://gitlab.com/JAForbes/static-sum-type/tree/master/modules/yslashn) Generates spec compliant unions that mimic well known types like maybe and either with a terse Y/N naming convention.

- [taggy](https://gitlab.com/JAForbes/static-sum-type/tree/master/modules/taggy) Generates spec compliant unions that also verify the existence of properties for each case.

- [superouter](https://gitlab.com/harth/superouter/) A Router that both exposes and internally uses static-sum-type to model route definitions, validation and more.

Each module adheres to the static-sum-type specification. That specification is defined in [static-sum-type/fold](https://gitlab.com/JAForbes/static-sum-type/tree/master/fold).

The design of the spec allows for a variety of other statically analyzable syntaxes which can be viewed at [static-sum-type/fold](https://gitlab.com/JAForbes/static-sum-type/tree/master/modules/fold). But its also possible to generate types dynamically far more succintly.

#### Project Goals and Motivations

- 0 Dependencies
- Tiny for frontend usage
- Data oriented precision
- Serializable
- A simple and convenient abstraction for library interop and direct usage.

#### How does static-sum-type differ from other libraries in the ecosystem.

`static-sum-type` removes the following features because we believe they lead to brittle codebases.

- placeholder cases
- auto spreading of values in cata/fold
- auto curried constructors
- prototypes

`static-sum-type` is technically 0KB, it's an idea. You can use static-sum-type in your codebase without ever running `npm install`.

## Specification

#### What's a "Type"

A type is a struct with a name property and as many keys as there are cases.

Each case on the type must have a `name` property that matches it's key.

```
{ name :: TitlecaseString
, [a] :: any
, [b] :: any
}
```

Here is an example of a valid `Maybe` type

```js
{ name: 'Maybe'
, Just: null
, Nothing: null
}
```

Keep in mind lowercase properties other than `name` are ignored. If you want your type to have static functions or other data you can safely do so as long as the property is a `LowercaseString`
You can safely add static methods or properties to your type structure without interfing with `static-sum-type` provided they do not start with a capital letter.

> 💡 Any keys in a call to `getOwnPropertyNames(Type)` where `key[0] == key[0].toUpperCase()` will be treated as a case.

Because `.name` is auto generated for functions and classes, the following forms are spec compliant.

```js
const Maybe = {
    name: 'Maybe'
    Just(){} // Maybe.Just.name == 'Just'
    Nothing(){} //Maybe.Nothing.name == 'Nothing'
}
```

```js
class Maybe {
  static Just() {} // Maybe.Just.name == 'Just'
  static Nothing() {} // Maybe.Nothing.name == 'Nothing'
}
```

#### What is a "Case"

```
{ type :: TitlecaseString
, case :: TitlecaseString
, value? :: a
}
```

- A `Case` is a struct with a `type`, `case` and an optional `value` property.
- The type and case property must be an `TitlecaseString`.
- The `case` property must correspond to a matching key on a type object.
- The matching type object must include a property that matches the cases `case` property.

A case _can_ have a `value` property. But it is optional. The `value` property can be of any type.

> 💡 The above specification is compatible with Javascript classes because `class` has an automatically generated property `name`.

#### Show me some examples of some valid cases.

```js
{ case: 'Case1'
, type: Type1.name //references above
}

{ case: 'Case2'
, type: 'Type1' // has same name as above which is also OK
, value: 'this is a value'
}
```
