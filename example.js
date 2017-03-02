var html = require('./html')
var choo = require('./')

var state = { count: 1 }
var app = choo()
app.router([ '/', mainView ])

var tree = app.start()
document.body.appendChild(tree)

function mainView () {
  console.log(state)
  return html`
    <section>
      <h1>Mutable state example</h1>
      <button onclick=${onclick}>
        Count: ${state.count}
      </button>
    </section>
  `
  function onclick () {
    state.count += 1
    console.log(state)
  }
}
