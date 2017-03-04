var nanologger = require('nanologger')
var mutate = require('xtend/mutable')
var html = require('../html')
var css = require('sheetify')
var choo = require('../')

var TodoList = require('./elements/todo-list')
var Header = require('./elements/header')
var Footer = require('./elements/footer')

css('todomvc-common/base.css')
css('todomvc-app-css/index.css')

var app = choo()
app.model(persist)
app.model(expose)
app.model(log)
app.model(require('./models/todos')())
app.router([
  ['/', mainView],
  ['#active', mainView],
  ['#completed', mainView]
])
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

function persist (state, bus) {
  var savedState = JSON.parse(window.localStorage.getItem('choo-todomvc'))
  mutate(state, savedState)

  bus.on('*', function (eventName, data) {
    window.localStorage.setItem('choo-todomvc', JSON.stringify(state))
  })
}

function log (state, bus) {
  var log = nanologger('choo')

  window.getState = function () {
    console.log(state)
  }

  bus.on('*', function (eventName, data) {
    log.info(eventName)
  })
}

function expose (state, bus) {
  window.choo = {}
  window.choo.state = state
  window.choo.emit = function (eventName, data) {
    bus.emit(eventName, data)
  }

  window.choo.on = function (eventName, listener) {
    bus.on(eventName, listener)
  }
}
