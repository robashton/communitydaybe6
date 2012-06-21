var http = require('http')
,   paperboy = require('paperboy')
,   socketio = require('socket.io')
,   azure = require('azure')


var queueService = null
,   server = null
,   io = null
,   clientName = null

function startHttp(cb) {
  server = http.createServer(function(req, res) {
    paperboy
      .deliver('site', req, res)
      .otherwise(function() {
        res.writeHead({ 'Content-Type' : 'text/plain'})
        res.end('404 not found lol')
      })
  })
  server.listen(process.env.port || 8000)
  cb()
}

function startSockets(cb) {
  io = socketio.listen(server)
  io.set('transports', [
        , 'xhr-polling'
        , 'jsonp-polling'
          ])

  io.on('connection', function(socket) {
    socket.on('command', function(data) {
      var msg = {
        body: JSON.stringify(data) 
      }
      queueService.sendTopicMessage('commands', msg, function(err) {
        console.log('sent', err)
      })
    })
  })
  cb()
}

function startServiceBus(cb) {
  process.env.AZURE_SERVICEBUS_NAMESPACE = 'communityday';
  process.env.AZURE_SERVICEBUS_ACCESS_KEY = 'xcmDM8w6gztKHLPOvIXq80iTIdXGT7tQxcH7e6VIEpU=';
  queueService = azure.createServiceBusService()
  queueService.createTopicIfNotExists('commands', function() {
    azure.RoleEnvironment.getDeploymentId(function(err, clientId) {
      clientName = clientId || "local"
      queueService.createSubscription('commands', clientName, function(err) {
        cb()
      })
    })
  })
}

function startListeningOnBus(cb) {
  nextMessage()
  cb()
}

function nextMessage() {
  queueService.receiveSubscriptionMessage('commands', clientName, function(err, msg) {
    if(err) {
      console.error(err)
      return nextMessage()
    }
    if(msg.body !== '') 
      io.sockets.emit('command', JSON.parse(msg.body))
    nextMessage()
  })
}

startServiceBus(function() {
  startHttp(function() {
    startSockets(function() {
      startListeningOnBus(function() {
        console.log('Server started')      
      })
    })
  })
})

