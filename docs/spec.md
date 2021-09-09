## Specification

#### What is a "Type"

A type is an object with a property: `type` a list of tag names: `tags` and a `traits` object.


```
{ type :: String
, tags :: String[]
, traits :: StrMap<any>
}
```

Here is an example of a valid `Maybe` type

```js
{ type: 'Maybe'
, tags: ['Y', 'N']
, traits: {}
}
```

#### What is an "Instance"

An instance is an object with a `type`, `tag` and an optional `value` property.

The `tag` property must correspond to a matching item in the type's `tags` list.

```
{ type :: String
, tag :: String
, value? :: a
}
```

An instance _can_ have a `value` property. But it is optional. The `value` property can be of any type.

#### What is a "Trait"?

A type has a key value map of traits, that tell's trait specific functions that a type supports some functionality.

Here is an example of some valid usage of `traits`.

```js
{ type: 'Maybe'
, tags: ['Y', 'N']
, traits: {
  'bifunctor': ['Y', 'N'],
  'functor': ['Y'],
  'monoid': 'N'
}
}
```

Your functions can then inspect `type.traits` to check if it should support the required functionality for your function.

> `sum-type` always namespaces it's trait names with the `sum-type/` prefix to separate built in traits from userland traits.

Traits allow the community to define their own type classes and associated functions, and users can share these traits without relying on the core `sum-type` library.

```js
const T = require('sum-type')
const functor = require('some-lib')
const Maybe = functor(T.either('Maybe'))

'somelib/functor' in Maybe.traits
//=> true

typeof Maybe.map
// true
```