var http = require('http')
,   paperboy = require('paperboy')
,   socketio  = require('socket.io')

,   io = null


var server = http.createServer(function(req, res) {
  paperboy
    .deliver('site', req, res)
    .otherwise(function() {
      res.writeHead({ 'Content-Type' : 'text/plain'})
      res.end('404 not found ahhahahaah')
    })
});

server.listen(process.env.port || 8000)

io = socketio.listen(server)
io.set('transports', [
  'xhr-polling'
])

io.on('connection', function(socket) {
  socket.on('command', function(data) {
    data.sender= socket.id
    io.sockets.emit('command', data)

  })

})
