var persist = require('./lib/persist')
var mutate = require('xtend/mutable')
var expose = require('./lib/expose')
var logger = require('./lib/logger')
var css = require('sheetify')
var html = require('bel')
var choo = require('./')

css('todomvc-common/base.css')
css('todomvc-app-css/index.css')

var app = choo()
app.use(persist())
app.use(expose())
app.use(logger())
app.use(todosModel())

app.router([
  ['/', mainView],
  ['#active', mainView],
  ['#completed', mainView]
])
app.mount('body')

function mainView (state, emit) {
  emit('log:debug', 'Rendering main view')
  return html`
    <body>
      <section class="todoapp">
        ${Header(state, emit)}
        ${TodoList(state, emit)}
        ${Footer(state, emit)}
      </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>choo by <a href="https://yoshuawuyts.com/">Yoshua Wuyts</a></p>
        <p>Created by <a href="http://shuheikagawa.com">Shuhei Kagawa</a></p>
      </footer>
    </body>
  `
}

// TODO: figure out if the current todo is being edited
function todosModel () {
  return function (state, bus) {
    var localState = state.todos

    if (!localState) {
      localState = state.todos = {}

      localState.active = []
      localState.done = []
      localState.all = []

      localState.idCounter = 0
    }

    bus.on('DOMContentLoaded', function () {
      bus.emit('log:debug', 'Loading todos model')

      // CRUD
      bus.on('todos:create', create)
      bus.on('todos:update', update)
      bus.on('todos:delete', del)

      // Shorthand
      bus.on('todos:edit', edit)
      bus.on('todos:unedit', unedit)
      bus.on('todos:toggle', toggle)
      bus.on('todos:toggleAll', toggleAll)
      bus.on('todos:deleteCompleted', deleteCompleted)
    })

    function create (data) {
      var item = {
        id: localState.idCounter,
        name: data.name,
        editing: false,
        done: false
      }

      localState.idCounter += 1
      localState.active.push(item)
      localState.all.push(item)
      bus.emit('render')
    }

    function edit (id) {
      localState.all.forEach(function (todo) {
        if (todo.id === id) todo.editing = true
      })
      bus.emit('render')
    }

    function unedit (id) {
      localState.all.forEach(function (todo) {
        if (todo.id === id) todo.editing = false
      })
      bus.emit('render')
    }

    function update (newTodo) {
      var todo = localState.all.filter(function (todo) {
        return todo.id === newTodo.id
      })[0]
      var isChanged = newTodo.done === todo.done
      var isDone = todo.done
      mutate(todo, newTodo)

      if (isChanged) {
        var arr = isDone ? localState.done : localState.active
        var target = isDone ? localState.active : localState.done
        var index = arr.indexOf[todo]
        arr.splice(index, 1)
        target.push(todo)
      }
      bus.emit('render')
    }

    function del (id) {
      var i = null
      var todo = null
      state.todos.all.forEach(function (_todo, j) {
        if (_todo.id === id) {
          i = j
          todo = _todo
        }
      })
      state.todos.all.splice(i, 1)

      if (todo.done) {
        var done = localState.done
        var doneIndex = done[todo]
        done.splice(doneIndex, 1)
      } else {
        var active = localState.active
        var activeIndex = active[todo]
        active.splice(activeIndex, 1)
      }
      bus.emit('render')
    }

    function deleteCompleted (data) {
      var done = localState.done
      done.forEach(function (todo) {
        var index = state.todos.all.indexOf(todo)
        state.todos.all.splice(index, 1)
      })
      localState.done = []
      bus.emit('render')
    }

    function toggle (id) {
      var todo = localState.all.filter(function (todo) {
        return todo.id === id
      })[0]
      var done = todo.done
      todo.done = !done
      var arr = done ? localState.done : localState.active
      var target = done ? localState.active : localState.done
      var index = arr.indexOf[todo]
      arr.splice(index, 1)
      target.push(todo)
      bus.emit('render')
    }

    function toggleAll (data) {
      var todos = localState.all
      var allDone = localState.all.length &&
        localState.done.length === localState.all.length

      todos.forEach(function (todo) {
        todo.done = !allDone
      })

      if (allDone) {
        localState.done = localState.all
        localState.active = []
      } else {
        localState.done = []
        localState.active = localState.all
      }

      bus.emit('render')
    }
  }
}

function Footer (state, emit) {
  var filter = window.location.hash.replace(/^#/, '')
  var activeCount = state.todos.active.length
  var hasDone = state.todos.done.length

  return html`
    <footer class="footer">
      <span class="todo-count">
        <strong>${activeCount}</strong>
        item${state.todos.all === 1 ? '' : 's'} left
      </span>
      <ul class="filters">
        ${filterButton('All', '', filter, emit)}
        ${filterButton('Active', 'active', filter, emit)}
        ${filterButton('Completed', 'completed', filter, emit)}
      </ul>
      ${hasDone ? deleteCompleted(emit) : ''}
    </footer>
  `

  function filterButton (name, filter, currentFilter, emit) {
    var filterClass = filter === currentFilter
      ? 'selected'
      : ''

    var uri = '#' + name.toLowerCase()
    if (uri === '#all') uri = '/'
    return html`
      <li>
        <a href=${uri} class=${filterClass}>
          ${name}
        </a>
      </li>
    `
  }

  function deleteCompleted (emit) {
    return html`
      <button class="clear-completed" onclick=${deleteAllCompleted}>
        Clear completed
      </button>
    `

    function deleteAllCompleted () {
      emit('todos:deleteCompleted')
    }
  }
}

function Header (todos, emit) {
  return html`
    <header class="header">
      <h1>todos</h1>
      <input class="new-todo"
        autofocus
        placeholder="What needs to be done?"
        onkeydown=${createTodo} />
    </header>
  `

  function createTodo (e) {
    if (e.keyCode === 13) {
      emit('todos:create', { name: e.target.value })
      e.target.value = ''
    }
  }
}

function TodoItem (todo, emit) {
  return html`
    <li class=${classList({ completed: todo.done, editing: todo.editing })}>
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          checked="${todo.done}"
          onchange=${toggle} />
        <label ondblclick=${edit}>${todo.name}</label>
        <button
          class="destroy"
          onclick=${destroy}
        ></button>
      </div>
      <input
        class="edit"
        value=${todo.name}
        onkeydown=${handleEditKeydown}
        onblur=${update} />
    </li>
  `

  function toggle (e) {
    emit('todos:toggle', todo.id)
  }

  function edit (e) {
    emit('todos:edit', todo.id)
  }

  function destroy (e) {
    emit('todos:delete', todo.id)
  }

  function update (e) {
    emit('todos:update', {
      id: todo.id,
      editing: false,
      name: e.target.value
    })
  }

  function handleEditKeydown (e) {
    if (e.keyCode === 13) update(e)              // Enter
    else if (e.code === 27) emit('todos:unedit') // Escape
  }

  function classList (classes) {
    var str = ''
    var keys = Object.keys(classes)
    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i]
      var val = classes[key]
      if (val) str += (key + ' ')
    }
    return str
  }
}

function TodoList (state, emit) {
  var filter = window.location.hash.replace(/^#/, '')
  var items = filter === 'completed'
    ? state.todos.done
    : filter === 'active'
      ? state.todos.active
      : state.todos.all

  var allDone = state.todos.done.length === state.todos.all.length

  var nodes = items.map(function (todo) {
    return TodoItem(todo, emit)
  })

  return html`
    <section class="main">
      <input
        class="toggle-all"
        type="checkbox"
        checked=${allDone}
        onchange=${toggleAll}/>
      <label for="toggle-all" style="display: none;">
        Mark all as done
      </label>
      <ul class="todo-list">
        ${nodes}
      </ul>
    </section>
  `

  function toggleAll () {
    emit('todos:toggleAll')
  }
}
