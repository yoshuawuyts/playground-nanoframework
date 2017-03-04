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
