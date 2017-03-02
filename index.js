var documentReady = require('document-ready')
var nanorouter = require('nanorouter')
var nanostack = require('nanostack')
var nanomorph = require('nanomorph')
var nanotick = require('nanotick')
var nanoraf = require('nanoraf')
function noop () {}

module.exports = Framework

function Framework () {
  if (!(this instanceof Framework)) return new Framework()
  this._stack = nanostack()
  this._tick = nanotick()
  this._router = null
  this._state = {}
}

Framework.prototype.use = function (fn) {
  this.stack.push(fn)
}

Framework.prototype.source = function (fn) {
  var self = this
  documentReady(function () {
    fn(function (ctx, cb) {
      self._stack.walk(ctx, cb)
    })
  })
}

Framework.prototype.router = function (opts, routes) {
  this._router = nanorouter(opts, routes)
}

Framework.prototype.start = function () {
  return this._render()
}

Framework.prototype.toString = function (location, state) {
  state = state || {}
  return this._router(location, state, noop)
}

Framework.prototype._render = function () {
  var self = this
  var tree = this._router(window.location.pathname, self._state, send)

  var render = nanoraf(function (state) {
    var newTree = self._router(window.location.pathname, state, send)
    nanomorph(newTree, tree)
  })

  return tree

  function send (name, data) {
    var ctx = {
      action: {
        name: name,
        data: data
      }
    }

    self._tick(function () {
      self._stack.walk(ctx, function (err, val) {
        if (err) throw err
        render(self._state)
      })
    })
  }
}
