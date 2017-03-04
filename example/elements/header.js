var html = require('../../html')

module.exports = header

function header (todos, emit) {
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
