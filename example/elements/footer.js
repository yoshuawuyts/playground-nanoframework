var html = require('../../html')

module.exports = footer

function footer (state, emit) {
  var activeCount = state.items.filter(function (todo) {
    return !todo.done
  }).length

  var hasDone = state.items.filter(function (todo) {
    return todo.done
  }).length > 0

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
}

function filterButton (name, filter, currentFilter, emit) {
  var klass = filter === currentFilter ? 'selected' : ''

  return html`
    <li>
      <a href="#" class=${klass} onclick=${applyFilter}>
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
