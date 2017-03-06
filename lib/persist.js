var mutate = require('xtend/mutable')
var key = 'choo-todomvc'

module.exports = persist

function persist () {
  return function (state, bus) {
    var savedState = JSON.parse(window.localStorage.getItem('choo-todomvc'))
    mutate(state, savedState)

    bus.on('*', function (eventName, data) {
      window.localStorage.setItem(key, JSON.stringify(state))
    })

    bus.on('clear', function () {
      window.localStorage.setItem(key, '{}')
      bus.emit('log:warn', 'Wiping localStorage')
    })
  }
}
