Sum-Type
========

> Notice: type checking currently only works with sanctuary-def v0.14.x and older.  The v1 release will likely not natively support sanctuary-def.  You can check out the ongoing API design and experiments for v1 at the [static-sum-type](https://gitlab.com/JAForbes/static-sum-type) repository.
> You can continue to use this library without type checking or with an old sanctuary-def version.  Alternatively check out other great sum type libraries in the JS ecosystem.

[![Build Status](https://travis-ci.org/JAForbes/sum-type.svg?branch=master)](https://travis-ci.org/JAForbes/sum-type)

[![npm version](https://badge.fury.io/js/sum-type.svg)](https://badge.fury.io/js/sum-type)

A sum-type library greatly inspired by paldepind's union-type

- Better run time type checking powered by sanctuary-def
- Supports paldepind's legacy API (including built-ins)
- Supports all sanctuary-def defined types including generics

#### Quick Start

`npm install sum-type --save`

```js
const $ = require('sanctuary-def')
const Type = require('sum-type')($, { checkTypes: true, env: $.env })


const User =
    Type.Named('User', {
        Guest: {}

        ,Registered:
            { username: String
            , avatar: String
            }
    })

const renderWelcomeMessage =
    User.case({
        Guest: () =>
            '<p>Welcome <a href="/signup">Sign Up?</a><p>'
        ,Registered: (username, avatar) =>
            `<div><img src="${avatar}"/><p>${username}</p></div>`
    })

const guest =
    User.Guest()

const registered =
    User.Registered(
        'JAForbes'
        , 'https://somewebsite.com/image.jpg'
    )

renderWelcomeMessage(registered)
    //=> <div><img src="https://somewebsite.com/image.jpg"/><p>JAForbes</p></div>

renderWelcomeMessage(guest)
    //=> <p>Welcome <a href="/signup">Sign Up?</a><p>
```

#### Credits

- API Design credit goes to [paldepind/union-type](https://github.com/paldepind/union-type)
- Run time type checking thanks to [sanctuary-js/sanctuary-def](https://github.com/sanctuary-js/sanctuary-def)
