const UnionType = require('.');

const $ = require('sanctuary-def');

// eslint-disable-next-line no-undef, immutable/no-mutation
module.exports = UnionType($, {
  checkTypes: true
  ,env: $.env
})
