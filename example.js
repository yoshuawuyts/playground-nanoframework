var assert = require('assert')
var html = require('./html')
var choo = require('./')

var app = choo()
app.use(store([ countModel() ]))
app.router([ '/', mainView ])
app.mount('body')

function mainView (state, send) {
  return html`
    <body>
      <h1>Mutable state example</h1>
      <button onclick=${onclick}>
        Count: ${state.count}
      </button>
    </body>
  `

  function onclick () {
    send('count:increment', 1)
  }
}

function countModel () {
  return {
    namespace: 'count',
    state: function (state) {
      state.count = 0
    },
    effects: {
      increment: function (state, data, send, done) {
        state.count += data
        done()
      }
    }
  }
}

// ============================================================================

function store (arr) {
  var effects = {}
  var state = {}

  arr.forEach(push)

  return {
    state: state,
    middleware: middleware
    // source: source
  }

  function middleware (ctx, next) {
    var name = ctx.action.name
    var data = ctx.action.data

    var effect = effects[name]
    assert.ok(effect, 'architecture: effect ' + name + ' was not found')

    effect(ctx.state, data, null, function (err) {
      if (err) return next(err)
      next(null, function (err, val, next) {
        if (err) next(err)
        next()
      })
    })
  }

  function push (obj) {
    var namespace = obj.namespace
    if (obj.state) obj.state(state)
    Object.keys(obj.effects).forEach(function (key) {
      var effect = obj.effects[key]
      effects[namespace + ':' + key] = effect
    })
  }
}
