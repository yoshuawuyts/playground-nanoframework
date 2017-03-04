var html = require('../html')
var css = require('sheetify')
var choo = require('../')

var TodoList = require('./elements/todo-list')
var Header = require('./elements/header')
var Footer = require('./elements/footer')

css('todomvc-common/base.css')
css('todomvc-app-css/index.css')

var app = choo()
app.model(require('./models/todos')())
app.model(log)
app.router([ '/', mainView ])
app.mount('body')

function mainView (state, emit) {
  var todos = state.todos
  return html`
    <body>
      <section class="todoapp">
        ${Header(todos, emit)}
        ${TodoList(todos, emit)}
        ${Footer(todos, emit)}
      </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>choo by <a href="https://yoshuawuyts.com/">Yoshua Wuyts</a></p>
        <p>Created by <a href="http://shuheikagawa.com">Shuhei Kagawa</a></p>
      </footer>
    </body>
  `
}

function log (state, bus) {
  bus.on('*', function (eventName, data) {
    var date = new Date()
    var now = date.getHours() +
      ':' + date.getMinutes() +
      ':' + date.getSeconds()
    console.log(now + ' ✨ ' + eventName)
  })
}
