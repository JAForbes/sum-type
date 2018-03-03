taggy
=====

What is it?
-----------

An interface inspired by [taggy](https://github.com/fantasyland/taggy)'s taggedSum.

Quick Start
-----------

`npm install static-sum-type`

```js
const sst = require('static-sum-type')
const taggy = require('static-sum-type/modules/taggy')

const UploadState = taggy ('UploadState') ({
    Inactive: 
        []
    ,Unconfirmed: 
        ['file', 'id', 'preview']
    ,Signing: 
        ['file', 'id', 'preview']
    ,Uploading: 
        ['progress', 'id', 'file', 'preview']
    ,Failed: 
        ['error', 'id', 'file', 'preview']
    ,Processing: 
        ['file', 'id', 'progress', 'preview']
    ,Processed: 
        ['file', 'id', 'url', 'preview']
})

// UploadState -> Boolean
const buttonDisabled = sst.fold (UploadState) ({
  Inactive: () => true
  ,Unconfirmed: () => false
  ,Processing: () => true
  ,Processed: () => true
  ,Failed: () => false
  ,Uploading: () => true
  ,Signing: () => true
})

// UploadState -> HyperScript
const uploadStatusMessage = sst.fold (UploadState) ({
  Inactive: () => 'Waiting for file input.'
  ,Unconfirmed: () => 'Upload when ready.'
  ,Processing: () => 'File is being processed'
  ,Processed: () => 'File uploaded.  Upload more?'
  ,Failed: ({error}) => h('span.red',error.message)
  ,Uploading: ({progress}) => progress+'% Uploaded'
  ,Signing: () => 'Signing ...'
})

```