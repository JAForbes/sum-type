## Specification

#### What is a "Type"

A type is an object with a property: `type` a list of tag names: `tags` and a `specs` object.


```
{ type :: String
, tags :: String[]
, specs :: StrMap<any>
}
```

Here is an example of a valid `Maybe` type

```js
{ type: 'Maybe'
, tags: ['Y', 'N']
, specs: {}
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

#### What is a "Spec"?

A type has a key value map of specifications, that tell's functions that a type supports some functionality.

Here is an example of some valid usage of `specs`.

```js
{ type: 'Maybe'
, tags: ['Y', 'N']
, specs: {
  'bifunctor': ['Y', 'N'],
  'functor': ['Y'],
  'monoid': 'N'
}
}
```

Your functions can then inspect `type.specs` to check if it should support the required functionality for your function.

> stags always namespaces it's specification names with the `stags/` prefix to separate stags built in functionality from user land functionality.

Specs allow the community to define their own type classes and associated functions, and users can share these specs without relying on the core stags library.

```js
const stags = require('stags')
const functor = require('some-lib')
const Maybe = functor(stags.either('Maybe'))

'somelib/functor' in Maybe.specs
//=> true

typeof Maybe.map
// true
```