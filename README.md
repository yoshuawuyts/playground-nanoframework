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
var framework = require('./framework')
var architecture = require('some-architecture')

var app = framework()
var logic = architecture(require('./application-logic')
app.use(logic)

app.source(require('./websockets'))
app.source(require('./keyboard'))

app.router([ '/', mainView ])
app.mount('body')

function mainView (state, send) {
  return html`<body>hello world</body>`
}
```

## API
### app = framework()
Create a new instance

### app.use()
Register a new [nanostack](https://github.com/yoshuawuyts/nanostack) middleware

### app.source(walkFn(ctx, cb))
Register a new `stack.walk` function to walk the stack. Useful to handle
external events with like keyboard or websockets. These are started after the
application is done loading

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
