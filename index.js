var documentReady = require('document-ready')
var walkRouter = require('nanorouter/walk')
var nanorouter = require('nanorouter')
var mutate = require('xtend/mutable')
var nanomorph = require('nanomorph')
var nanotick = require('nanotick')
var nanoraf = require('nanoraf')
var nanobus = require('nanobus')
var assert = require('assert')
function noop () {}

module.exports = Framework

function Framework () {
  var tick = nanotick()
  var bus = nanobus()
  var rerender = null
  var router = null
  var tree = null
  var state = {}

  return {
    router: createRouter,
    model: createModel,
    mount: mount,
    toString: toString
  }

  function createRouter (opts, routes) {
    if (!routes) {
      routes = opts
      opts = {}
    }

    var routerOpts = mutate({ thunk: 'match' }, opts)
    router = nanorouter(routerOpts, routes)

    walkRouter(router, wrap)

    function wrap (route, handler) {
      return function chooWrap (params) {
        return function (state, send) {
          state.params = params
          return handler(state, send)
        }
      }
    }
  }

  function createModel (cb) {
    cb(state, bus)
  }

  function start () {
    var send = tick(_send)
    tree = router(window.location.pathname, state, send)

    rerender = nanoraf(function (state) {
      var send = tick(_send)
      var newTree = router(window.location.pathname, state, send)
      tree = nanomorph(newTree, tree)
    })

    bus.on('render', function () {
      rerender(state)
    })

    documentReady(function () {
      bus.emit('documentReady')
    })

    return tree

    function _send (eventName, data) {
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
    return router(location, state, noop)
  }
}
