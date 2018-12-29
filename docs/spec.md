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
You can safely add static methods or properties to your type structure without interfing with `stags` provided they do not start with a capital letter.

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
