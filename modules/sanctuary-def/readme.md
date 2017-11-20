sanctuary-def helpers
---------------------

#### Demo

```js
const $ = require('sanctary-def')
    $.sst = require('static-sum-type/modules/sanctuary-def')

const yslashn = require('yslashn')
const Maybe = yslashn.maybe('Maybe')

const MaybeType = $.sst.toNullaryType(Maybe)

const def = $.create({
    checkTypes: true
    ,env: $.env.concat([MaybeType])
})
```