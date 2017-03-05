var mutate = require('xtend/mutable')

module.exports = persist

function persist () {
  return function (state, bus) {
    var savedState = JSON.parse(window.localStorage.getItem('choo-todomvc'))
    mutate(state, savedState)

    bus.on('*', function (eventName, data) {
      window.localStorage.setItem('choo-todomvc', JSON.stringify(state))
    })
  }
}
