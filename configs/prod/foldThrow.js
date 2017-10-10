var o = require('../../modules/fold/prod')(function(err){
    throw new Error(o.errMessage(err))
})

module.exports = o