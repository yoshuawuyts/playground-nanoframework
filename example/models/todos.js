module.exports = todos

function todos () {
  return function (state, bus) {
    state.todos = {}
    state.todos.editing = null
    state.todos.filter = ''
    state.todos.counter = 0
    state.todos.items = []

    bus.on('todos:add')
    bus.on('todos:toggle')
    bus.on('todos:edit')
    bus.on('todos:unedit')
    bus.on('todos:update')
    bus.on('todos:destroy')
    bus.on('todos:clearCompleted')
    bus.on('todos:toggleAll')
    bus.on('todos:filter')
  }
}
