var html = require('./html')
var choo = require('./')

var app = choo()

app.model(function (state, bus) {
  state.count = 0

  bus.on('*', function () {
    console.log('arguments', arguments)
  })

  bus.on('increment', function (count) {
    state.count += count
    bus.emit('render')
  })
})

app.router([ '/', mainView ])
app.mount('body')

function mainView (state, emit) {
  console.log('state', state)
  return html`
    <body>
      <h1>count is ${state.count}</h1>
      <button onclick=${onclick}>Increment</button>
    </body>
  `

  function onclick () {
    emit('increment', 1)
  }
}
