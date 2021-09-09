Patterns for building instances
===============================

> Adopted from a question raised by @laduke as an [issue](https://gitlab.com/harth/stags/issues/34).

It's all well and good to have well typed, well defined unions that model our business logic as data, but how do we take arbitrary unsafe, untrusted data form the _real world_ and convert it to our well known tree?

With other libraries, `instanceof` and reference equality is relevant, so we tend to need to rebuild the world from scratch on initialization.

But because `sum-type` has such a simple deserialization strategy (`JSON.parse`), it's rare to need to check all conditions immediately. Instead we can react to events and update our tree gradually based on context. 

An example could be a nested structure of `Selected.Y(Loaded.Y(Modified.Y(Saved.Y(x))))`.  At the start of our data's story we can initialize with the empty Selected state: `Selected.N()`.  We do not need to set up the entire tree, as when the data isn't selected, it _can't_ be loaded.  And if it's not loaded, we aren't concerned if it's modified or saved yet.

When the data is Selected, when can react to that event, be setting the shape to `Selected.Y(Loaded.N())` and when the data arrives, we can map over the selected and loaded state, and only initialize that interal binary question: modified and saved.

We can also create helpful initializers for common states.  E.g. creating a brand new record could be a function:

```js
const create = x => Selected.Y(Loaded.Y(Modified.N(Saved.N(x))))

create({ name: 'Hello' })

Selected.Y(Loaded.Y(Modified.N(Saved.N({ name: 'Hello' }))))

```

Or a helper for updating an existing record:

```js
const update = Selected.map(
    Loaded.map(
        Modified.bifold(Modified.Y, Modified.Y)
    )
)

var a = create({ name: 'Hello' })
// => Selected.Y(Loaded.Y(Modified.N(Saved.N({ name: 'Hello' }))))

update(a)
// => Selected.Y(Loaded.Y(Modified.Y(Saved.N({ name: 'Hello' }))))
```

The event is the point where we convert from untrusted to trusted data for a particular location in the tree - as opposed to deserialization time.

---

If you do have all the state on initialization and are creating a new `sum-type` structure from scratch I tend to have a function called `infer` that accepts `any` and returns a well defined stag tree.

```js
// any -> Selected Loaded Modified Saved a
function infer(state, x){
  const A = state.selected ? Selected.Y : Selected.N
  const B = state.selected 
    ? state.loaded
      ? Loaded.Y
      : Loaded.N
    : identity
  const C = B == identity 
    ? identity 
    : state.modified != null 
      ? Modified.Y 
      : Modified.N

  const D = C == identity
    ? identity
    : state.saved != null
      ? Saved.Y
      : Saved.N

  return A(B(C(D(x))))
}
```

But I want to stress, this sort of function is less common than with other union type libraries.  Usually you just adjust an intermediate type based on an event and start with the least privileged state.  The fact you can save the complete structure in local storage or in a database sort of negates the need to "rebuild" existing trees.  Just `JSON.parse(existingTree)` and you are good.