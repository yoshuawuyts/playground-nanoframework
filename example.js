var nanologger = require('nanologger')
var mutate = require('xtend/mutable')
var css = require('sheetify')
var html = require('bel')
var choo = require('../')

css('todomvc-common/base.css')
css('todomvc-app-css/index.css')

var app = choo()
app.model(persist)
app.model(expose)
app.model(log)
app.model(todos())
app.router([
  ['/', mainView],
  ['#active', mainView],
  ['#completed', mainView]
])
app.mount('body')

function mainView (state, emit) {
  var todos = state.todos
  emit('log:debug', 'Rendering main view')
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
    if (!/^log:\w{1,6}/.test(eventName)) log.info(eventName)
  })

  bus.on('log:debug', function (data) {
    log.debug(stringify(data))
  })

  bus.on('log:info', function (data) {
    log.info(stringify(data))
  })

  bus.on('log:warn', function (data) {
    log.warn(stringify(data))
  })

  bus.on('log:error', function (data) {
    log.error(stringify(data))
  })

  bus.on('log:fatal', function (data) {
    log.fatal(stringify(data))
  })

  function stringify (data) {
    if (typeof data === 'string') return data
    return JSON.stringify(data)
  }
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

function todos () {
  return function (state, bus) {
    var localState = state.todos
    if (!localState) {
      localState = state.todos = {}
      localState.editing = null
      localState.counter = 0
      localState.filter = ''
      localState.items = []
      localState.hasDone = false
      localState.activeCount = 0
    }

    bus.on('DOMContentLoaded', function () {
      bus.emit('log:debug', 'Loading todos model')
      bus.on('todos:add', add)
      bus.on('todos:update', update)
      bus.on('todos:edit', edit)
      bus.on('todos:toggle', toggle)
      bus.on('todos:destroy', destroy)

      bus.on('todos:cancelEditing', cancelEditing)
      bus.on('todos:clearCompleted', clearCompleted)
      bus.on('todos:toggleAll', toggleAll)
      bus.on('todos:filter', filter)
    })

    function add (data) {
      var newItem = {
        id: localState.counter,
        name: data.name,
        done: false
      }

      bus.emit('log:debug', 'Creating new todo ' + data.name)

      localState.items.push(newItem)
      localState.counter += 1
      bus.emit('render')
    }

    function toggle (id) {
      var todos = localState.items
      for (var i = 0, len = todos.length; i < len; i++) {
        var todo = todos[i]
        if (todo.id === id) {
          todo.done = !todo.done
          break
        }
      }
      bus.emit('render')
    }

    function edit (id) {
      localState.editing = id
      bus.emit('render')
    }

    function cancelEditing () {
      localState.editing = null
      bus.emit('render')
    }

    function update (data) {
      localState.editing = null
      var todos = localState.items
      for (var i = 0, len = todos.length; i < len; i++) {
        var todo = todos[i]
        if (todo.id === data.id) {
          todo.name = data.name
          break
        }
      }
      bus.emit('render')
    }

    function destroy (id) {
      var todos = localState.items
      for (var i = 0, len = todos.length; i < len; i++) {
        var todo = todos[i]
        if (todo.id === id) {
          todos.splice(i, 1)
          break
        }
      }
      bus.emit('render')
    }

    function clearCompleted (data) {
      var todos = localState.items
      for (var i = 0, len = todos.length; i < len; i++) {
        var todo = todos[i]
        if (todo.done) {
          todos.splice(i, 1)
          len--
          i--
        }
      }
      bus.emit('render')
    }

    function toggleAll (data) {
      var todos = localState.items

      var doneCount = 0
      for (var i = 0, ilen = todos.length; i < ilen; i++) {
        var itodo = todos[i]
        if (itodo.done) doneCount++
      }
      var allDone = (doneCount === todos.length)

      for (var j = 0, jlen = todos.length; j < jlen; j++) {
        var jtodo = todos[j]
        jtodo.done = !allDone
      }

      bus.emit('render')
    }

    function filter (data) {
      localState.filter = data.filter
      bus.emit('render')
    }
  }
}

function Footer (state, emit) {
  // TODO: implement in models
  var activeCount = state.activeCount
  var hasDone = state.hasDone

  return html`
    <footer class="footer">
      <span class="todo-count">
        <strong>${activeCount}</strong>
        item${state.items.length === 1 ? '' : 's'} left
      </span>
      <ul class="filters">
        ${filterButton('All', '', state.filter, emit)}
        ${filterButton('Active', 'active', state.filter, emit)}
        ${filterButton('Completed', 'completed', state.filter, emit)}
      </ul>
      ${hasDone ? clearCompletedButton(emit) : ''}
    </footer>
  `

  function filterButton (name, filter, currentFilter, emit) {
    var filterClass = filter === currentFilter ? 'selected' : ''

    var uri = '#' + name.toLowerCase()
    if (uri === '#all') uri = '/'
    return html`
      <li>
        <a href=${uri} class=${filterClass} onclick=${applyFilter}>
          ${name}
        </a>
      </li>
    `

    function applyFilter () {
      emit('todos:filter', { filter: filter })
    }
  }

  function clearCompletedButton (emit) {
    return html`
      <button class="clear-completed" onclick=${clearCompleted}>
        Clear completed
      </button>
    `

    function clearCompleted () {
      emit('todos:clearCompleted')
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
        onkeydown=${addTodo} />
    </header>
  `

  function addTodo (e) {
    if (e.keyCode === 13) {
      emit('todos:add', { name: e.target.value })
      e.target.value = ''
    }
  }
}

function TodoItem (todo, editing, emit) {
  return html`
    <li class=${classList({ completed: todo.done, editing: editing })}>
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          checked="${todo.done}"
          onchange=${toggle}
        />
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
        onblur=${update}
      />
    </li>
  `

  function toggle (e) {
    emit('todos:toggle', todo.id)
  }

  function edit (e) {
    emit('todos:edit', todo.id)
  }

  function destroy (e) {
    emit('todos:destroy', todo.id)
  }

  function update (e) {
    emit('todos:update', { id: todo.id, name: e.target.value })
  }

  function handleEditKeydown (e) {
    if (e.keyCode === 13) update(e) // Enter
    else if (e.code === 27) emit('todos:cancelEditing') // Escape
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

function TodoList (todos, emit) {
  var items = todos.items
  var filteredItems = filterTodos(items, todos.filter)
  var itemViews = filteredItems.map(function (todo) {
    return TodoItem(todo, todo.id === todos.editing, emit)
  })
  var allDone = items.filter(isDone).length === items.length

  return html`
    <section class="main">
      <input
        class="toggle-all"
        type="checkbox"
        checked=${allDone}
        onchange=${toggleAll}/>
      <label for="toggle-all" style="display: none;">
        Mark all as complete
      </label>
      <ul class="todo-list">
        ${itemViews}
      </ul>
    </section>
  `

  function toggleAll () {
    emit('todos:toggleAll')
  }

  function filterTodos (items, filter) {
    switch (filter) {
      case 'active':
        return items.filter(isNotDone)
      case 'completed':
        return items.filter(isDone)
      default:
        return items
    }
  }

  function isDone (todo) {
    return todo.done
  }

  function isNotDone (todo) {
    return !todo.done
  }
}
