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
        id: state.counter,
        name: data.name,
        done: false
      }

      localState.items.push(newItem)
      localState.counter += 1
      bus.emit('render')
    }

    function toggle (data) {
      localState.items = localState.items.map(function (todo) {
        return (todo.id === data.id)
          ? xtend({}, todo, { done: !todo.done })
          : todo
      })
      bus.emit('render')
    }

    function edit (data) {
      localState.editing = data.id
      bus.emit('render')
    }

    function cancelEditing (data) {
      localState.editing = null
      bus.emit('render')
    }

    function update (data) {
      localState.editing = null
      localState.items = localState.items.map(function (todo) {
        return (todo.id === data.id)
          ? xtend({}, todo, { name: data.name })
          : todo
      })
      bus.emit('render')
    }

    function destroy (data) {
      localState.items = localState.items.filter(function (todo) {
        return (todo.id !== data.id)
      })
      bus.emit('render')
    }

    function clearCompleted (data) {
      localState.items = localState.items.filter(function (todo) {
        return !todo.done
      })
      bus.emit('render')
    }

    function toggleAll (data) {
      var allDone = localState.items.filter(function (todo) {
        return todo.done
      }).length === localState.items.length

      localState.items = state.items.map(function (todo) {
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
