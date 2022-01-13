'use strict'

const proxyquire = require('proxyquire')
const verifier   = require('../alexa-verifier/alexa-verifier.js')
const test       = require('tap').test


function RED () {
  const types = { } // ghetto type registry
  return {
    nodes: {
      createNode: function(currentNode, config) {

      },

      registerType: function (typeName, node) {
        types[typeName] = node
      }
    },
    types
  }
}

test('registers type', function(t) {
  const r = RED()
  verifier(r)

  t.equal(typeof r.types['alexa-verifier'], 'function')
  t.end()
})


test('registers node-red input event', function(t) {
  const r = RED()
  verifier(r)

  let eventCount = 0
  let inputEventCount = 0
  let inputCallback

  // nodes expect an execution context provided by node-red.
  // set up an execution context that mocks this convincingly enough
  // to match what node-red actually does.
  var context = {
    error: function(str) { },
    log: function(str) { },
    on: function(eventName, callback) {
      eventCount++
      if(eventName === 'input') {
        inputEventCount++
        inputCallback = callback
      }
    },
    send: function(msg) { }
  }

  // install the node
  r.types['alexa-verifier'].call(context)

  t.equal(eventCount, 1)
  t.equal(inputEventCount, 1)
  t.equal(typeof inputCallback, 'function')
  t.end()
})


test('handles invalid JSON body', function(t) {
  const r = RED()
  verifier(r)

  let errorMessage, inputCallback

  // nodes expect an execution context provided by node-red.
  // set up an execution context that mocks this convincingly enough
  // to match what node-red actually does.
  var context = {
    error: function(str) {
      errorMessage = str
    },
    log: function(str) { },
    on: function(eventName, callback) {
      if(eventName === 'input') {
        inputCallback = callback
      }
    },
    send: function(msg) { }
  }

  // install the node
  r.types['alexa-verifier'].call(context)

  // an object with a circular reference is a valid javascript object
  // that fails to stringify into JSON
  const a = { }
  const b = { a }
  a.b = b

  const msg = {
    req: {
      body: a,
      headers: {}
    }
  }
  inputCallback(msg)

  const startsWith = 'failed to parse alexa request body:TypeError: Converting circular structure to JSON'
  t.equal(errorMessage.substring(0, startsWith.length), 'failed to parse alexa request body:TypeError: Converting circular structure to JSON')

  t.end()
})


test('calls verifier', function(t) {
  const r = RED()

  const v = proxyquire('../alexa-verifier/alexa-verifier.js', { 'alexa-verifier': function mockedVerifier(cert_url, signature, body, callback) {
    t.equal(cert_url, 'header1')
    t.equal(signature, 'header2')
    t.deepEqual(body, '{"test":true}')
  } })

  v(r)

  let inputCallback

  // nodes expect an execution context provided by node-red.
  // set up an execution context that mocks this convincingly enough
  // to match what node-red actually does.
  var context = {
    error: function(str) { },
    log: function(str) { },
    on: function(eventName, callback) {
      if(eventName === 'input') {
        inputCallback = callback
      }
    },
    send: function(msg) { }
  }

  // install the node
  r.types['alexa-verifier'].call(context)

  const msg = {
    req: {
      body: {
        test: true
      },
      headers: {
        signaturecertchainurl: 'header1',
        signature: 'header2'
      }
    }
  }
  inputCallback(msg)

  // TODO: validate that verify() gets called
  t.end()
})
