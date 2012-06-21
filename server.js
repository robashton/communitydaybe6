var http = require('http')
,   paperboy = require('paperboy')
,   socketio = require('socket.io')


var server = http.createServer(function(req, res) {
  paperboy
    .deliver('site', req, res)
    .otherwise(function() {
      res.writeHead({ 'Content-Type' : 'text/plain'})
      res.end('404 not found lol')
    })
})

server.listen(process.env.port || 8000)
var io = socketio.listen(server)
io.set('transports', [
      , 'xhr-polling'
      , 'jsonp-polling'
        ]);

io.on('connection', function(socket) {
  socket.on('command', function(data) {
    socket.broadcast.emit('command', data)
  })
})
