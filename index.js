var onHistoryChange = require('nanorouter/history')
var documentReady = require('document-ready')
var walkRouter = require('nanorouter/walk')
var onHref = require('nanorouter/href')
var nanorouter = require('nanorouter')
var mutate = require('xtend/mutable')
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
    tree = router(window.location.pathname, state, tick(emit))
    rerender = nanoraf(function () {
      var newTree = router(window.location.pathname, state, tick(emit))
      tree = nanomorph(newTree, tree)
    })

    bus.on('render', rerender)

    if (opts.history !== false) {
      onHistoryChange(scrollIntoView)
      bus.on('pushState', function (href) {
        window.history.pushState({}, null, href)
        scrollIntoView()
      })
    }

    if (opts.href !== false) {
      onHref(function (href) {
        var currHref = window.location.href
        if (href !== currHref) bus.emit('pushState')
      })
    }

    documentReady(function () {
      bus.emit('DOMContentLoaded')
    })

    return tree

    function scrollIntoView () {
      var hash = window.location.hash
      if (hash) {
        try {
          var el = document.querySelector(hash)
          if (el) el.scrollIntoView(true)
        } catch (e) {}
      }
    }

    function emit (eventName, data) {
      bus.emit(eventName, data)
    }
  }

  function mount (selector) {
    var newTree = start()

    documentReady(function () {
      var root = document.querySelector(selector)
      assert.ok(root, 'could not query selector: ' + selector)

      // copy script tags from the old tree to the new tree so
      // we can pass a <body> element straight up
      if (root.nodeName === 'BODY') {
        var children = root.childNodes
        for (var i = 0; i < children.length; i++) {
          if (children[i].nodeName === 'SCRIPT') {
            tree.appendChild(children[i].cloneNode(true))
          }
        }
      }

      tree = nanomorph(newTree, root)
      assert.equal(tree, root, 'choo/mount: The new node root ' +
        tree.outerHTML.nodeName + ' is not the same type as ' +
        root.outerHTML.nodeName + '. Choo cannot begin diffing.' +
        ' Make sure the same initial tree is rendered in the browser' +
        ' as on the server. Check out the choo handbook for more information')
    })
  }

  function toString (location, state) {
    state = state || {}
    return router(location, state)
  }
}
