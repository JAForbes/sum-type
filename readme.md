Sum-Type
========

A sum-type library greatly inspired by paldepind's union-type

- Better run time type checking powered by sanctuary-def
- Supports paldepind's legacy API (including built-ins)
- Supports all sanctuary-def defined types including generics

#### Quick Start

`npm install sum-type --save`

```js

const Type = require('sum-type')({ check: true })

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

- API Design credit goes to [https://github.com/paldepind/union-type]()
- Run time type checking thanks to [https://github.com/sanctuary-js/sanctuary-def]()
