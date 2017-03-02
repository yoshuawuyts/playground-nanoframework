var html = require('./html')
var choo = require('./')

var opts = {
  state: { count: 0 },
  location: window.location.href
}

var routes = [ '/', mainView ]

var app = choo(opts)
app.use(architecture)
app.router(routes)
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

function architecture (ctx, next) {
  next(null, function (err, val, next) {
    if (err) throw err
    next()
  })
}
