var html = require('../../html')

module.exports = todoItem

function todoItem (todo, editing, emit) {
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
    emit('todos:toggle', { id: todo.id })
  }

  function edit (e) {
    emit('todos:edit', { id: todo.id })
  }

  function destroy (e) {
    emit('todos:destroy', { id: todo.id })
  }

  function update (e) {
    emit('todos:update', { id: todo.id, name: e.target.value })
  }

  function handleEditKeydown (e) {
    if (e.keyCode === 13) { // Enter
      update(e)
    } else if (e.code === 27) { // Escape
      emit('todos:cancelEditing')
    }
  }
}

function classList (classes) {
  return Object.keys(classes).reduce(function (acc, k) {
    if (classes[k]) {
      acc.push(k)
    }
    return acc
  }, []).join(' ')
}
