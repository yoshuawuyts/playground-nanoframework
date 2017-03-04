var onHistoryChange = require('nanorouter/history')
var documentReady = require('document-ready')
var walkRouter = require('nanorouter/walk')
var onHref = require('nanorouter/href')
var nanorouter = require('nanorouter')
var mutate = require('xtend/mutable')
var nanomount = require('nanomount')
var nanomorph = require('nanomorph')
var nanotick = require('nanotick')
var nanoraf = require('nanoraf')
var nanobus = require('nanobus')
var assert = require('assert')

module.exports = Framework

function Framework (opts) {
  opts = opts || {}

  var tick = nanotick()
  var bus = nanobus()
  var rerender = null
  var router = null
  var tree = null
  var state = {}

  return {
    router: createRouter,
    toString: toString,
    model: createModel,
    mount: mount,
    start: start
  }

  function createRouter (opts, routes) {
    if (!routes) {
      routes = opts
      opts = {}
    }

    var routerOpts = mutate({ thunk: 'match' }, opts)
    router = nanorouter(routerOpts, routes)

    walkRouter(router, function (route, handler) {
      return function chooWrap (params) {
        return function (state, emit) {
          state.params = params
          return handler(state, emit)
        }
      }
    })
  }

  function createModel (cb) {
    cb(state, bus)
  }

  function start () {
    tree = router(createLocation(), state, tick(emit))
    rerender = nanoraf(function () {
      var newTree = router(createLocation(), state, tick(emit))
      tree = nanomorph(tree, newTree)
    })

    bus.on('render', rerender)

    if (opts.history !== false) {
      onHistoryChange(function (href) {
        bus.emit('pushState', window.location.href)
        scrollIntoView()
      })

      if (opts.href !== false) {
        onHref(function (location) {
          var href = location.href
          var currHref = window.location.href
          if (href === currHref) return
          window.history.pushState({}, null, href)
          bus.emit('pushState', window.location.href)
          bus.emit('render')
          scrollIntoView()
        })
      }
    }

    documentReady(function () {
      bus.emit('DOMContentLoaded')
    })

    return tree

    function emit (eventName, data) {
      bus.emit(eventName, data)
    }
  }

  function mount (selector) {
    var newTree = start()
    documentReady(function () {
      var root = document.querySelector(selector)
      assert.ok(root, 'could not query selector: ' + selector)
      nanomount(root, newTree)
      tree = root
    })
  }

  function toString (location, state) {
    state = state || {}
    return router(location, state)
  }
}

function scrollIntoView () {
  var hash = window.location.hash
  if (hash) {
    try {
      var el = document.querySelector(hash)
      if (el) el.scrollIntoView(true)
    } catch (e) {}
  }
}

function createLocation () {
  return window.location.pathname + window.location.hash
}
