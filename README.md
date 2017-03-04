# playground-nanoframework
Building tiny frameworks yo. Fiddling around with cool new architectury things.
Mainly trying to figure out how to solve the same problems `reselect` tries to
solve but like, you know - differently.

Anyway. I'm sharing this because I believe developing in the open is cool.
Sharing ideas and / or failed experiments is even cooler. I'd appreciate it if
you let me do my thing here tho.

![kanye west quote about that silly uehhhhh, yeah creative process stuff. Dang,
I should be ashamed I thinkg - but I'm not. I like that
tweet](./a-can-of-kanye/screenshot.png)

## Usage
```js
var html = require('./html')
var choo = require('./')

var app = choo()

app.model(function (state, bus) {
  state.count = 0

  bus.on('*', function () {
    console.log('arguments', arguments)
  })

  bus.on('increment', function (count) {
    state.count += count
    bus.emit('render')
  })
})

app.router([ '/', mainView ])
app.mount('body')

function mainView (state, emit) {
  return html`
    <body>
      <h1>count is ${state.count}</h1>
      <button onclick=${onclick}>Increment</button>
    </body>
  `

  function onclick () {
    emit('increment', 1)
  }
}
```

## API
### app = framework()
Create a new instance

### app.model(callback(state, emit))
Create a new model

### app.router([opts], routes)
Register a router

### html = app.start()
Start the application

### app.mount(selector)
Mount the application on the given `querySelector` (tbi)

### app.toString(location, [state])
Render the application to a string. Useful for rendering on the server

### framework/html
Exposes [bel](https://github.com/shama/bel)

### framework/component
Exposes [nanocomponent](https://github.com/yoshuawuyts/nanocomponent)

## License
[MIT](https://tldrlegal.com/license/mit-license)
