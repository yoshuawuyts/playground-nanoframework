var documentReady = require('document-ready')
var walkRouter = require('nanorouter/walk')
var nanorouter = require('nanorouter')
var mutate = require('xtend/mutable')
var nanostack = require('nanostack')
var nanomorph = require('nanomorph')
var nanotick = require('nanotick')
var nanoraf = require('nanoraf')
var assert = require('assert')
function noop () {}

module.exports = Framework

function Framework (opts) {
  if (!(this instanceof Framework)) return new Framework(opts)
  opts = opts || {}
  this._stack = nanostack()
  this._tick = nanotick()
  this._router = null
  this._tree = null
  this._state = opts.state || {}
}

Framework.prototype.use = function (fn) {
  if (fn.source) this.source(fn.source)
  if (fn.state) this._state = fn.state
  if (fn.middleware) fn = fn.middleware
  this._stack.push(fn)
  return this
}

Framework.prototype.source = function (fn) {
  var self = this
  documentReady(function () {
    fn(function (ctx, cb) {
      self._stack.walk(ctx, cb)
    })
  })
  return this
}

Framework.prototype.router = function (opts, routes) {
  this._router = this._createRouter(opts, routes)
  return this
}

Framework.prototype.start = function () {
  return this._render()
}

Framework.prototype.mount = function (selector) {
  var tree = this.start()
  var self = this

  documentReady(function onReady () {
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

    self._tree = nanomorph(tree, root)
    assert.equal(self._tree, root, 'choo/mount: The new node root ' +
      self._tree.outerHTML.nodeName + ' is not the same type as ' +
      tree.outerHTML.nodeName + '. Choo cannot begin diffing.' +
      ' Make sure the same initial tree is rendered in the browser' +
      ' as on the server. Check out the choo handbook for more information')
  })
}

Framework.prototype.toString = function (location, state) {
  state = state || {}
  return this._router(location, state, noop)
}

Framework.prototype._render = function () {
  var self = this

  var send = this._tick(_send)
  this._tree = this._router(window.location.pathname, this._state, send)

  this._rerender = nanoraf(function (state) {
    var send = self._tick(_send)
    var newTree = self._router(window.location.pathname, state, send)
    self._tree = nanomorph(newTree, self._tree)
  })

  return this._tree

  function _send (name, data) {
    var action = {
      name: name,
      data: data
    }

    var ctx = {
      state: self._state,
      action: action
    }

    self._stack.walk(ctx, function (err, val, next) {
      if (err) throw err
      self._rerender(self._state)
      next()
    })
  }
}

Framework.prototype._createRouter = function (opts, routes) {
  if (!routes) {
    routes = opts
    opts = {}
  }
  var routerOpts = mutate({ thunk: 'match' }, opts)
  var router = nanorouter(routerOpts, routes)

  walkRouter(router, wrap)
  return router

  function wrap (route, handler) {
    return function chooWrap (params) {
      return function (state, send) {
        // state.location.params = params
        return handler(state, send)
      }
    }
  }
}
