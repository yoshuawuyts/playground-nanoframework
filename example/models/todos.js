var xtend = require('xtend')

module.exports = todos

function todos () {
  return function (state, bus) {
    var localState = state.todos
    if (!localState) {
      localState = state.todos = {}
      localState.editing = null
      localState.counter = 0
      localState.filter = ''
      localState.items = []
    }

    bus.on('todos:add', add)
    bus.on('todos:toggle', toggle)
    bus.on('todos:edit', edit)
    bus.on('todos:cancelEditing', cancelEditing)
    bus.on('todos:update', update)
    bus.on('todos:destroy', destroy)
    bus.on('todos:clearCompleted', clearCompleted)
    bus.on('todos:toggleAll', toggleAll)
    bus.on('todos:filter', filter)

    function add (data) {
      var newItem = {
        id: localState.counter,
        name: data.name,
        done: false
      }

      localState.items.push(newItem)
      localState.counter += 1
      bus.emit('render')
    }

    function toggle (id) {
      localState.items = localState.items.map(function (todo) {
        return (todo.id === id)
          ? xtend({}, todo, { done: !todo.done })
          : todo
      })
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
        if (todo.id !== data.id) continue
        todo.name = data.name
        break
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
      var allDone = localState.items.filter(function (todo) {
        return todo.done
      }).length === localState.items.length

      localState.items = localState.items.map(function (todo) {
        return xtend({}, todo, { done: !allDone })
      })

      bus.emit('render')
    }

    function filter (data) {
      localState.filter = data.filter
      bus.emit('render')
    }
  }
}
