const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const client = require('./pool/client.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3333;

process.setMaxListeners(0);

io.on('connection', (socket) => {
  let node = null;

  socket.emit('can start');

  // Connecteced
  socket.on('start', (params) => {
    node = client({
      version: params.version,
      algo: params.algo,
      ...params.stratum,
      autoReconnectOnError: true,
      onConnect: () => console.log('Connected to server'),
      onClose: () => console.log('Connection closed'),
      onError: (error) =>  {
        console.log('Error', error.message)
        socket.emit('error', error.message);
      },
      onNewDifficulty: (newDiff) => {
        console.log('New difficulty', newDiff)
        socket.emit('difficult', newDiff);
      },
      onSubscribe: (subscribeData) => console.log('[Subscribe]', subscribeData),
      onAuthorizeSuccess: () => console.log('Worker authorized'),
      onAuthorizeFail: () => {
        socket.emit('error', 'WORKER FAILED TO AUTHORIZE');
      },
      onNewMiningWork: (work) => {
        socket.emit('work', work);
      },
      onSubmitWorkSuccess: (error, result) => {
        socket.emit('shared', { error, result });
      },
      onSubmitWorkFail: (error, result) => {
        socket.emit('submit failed', { error, result });
      },
    });
  });

  // Worker submit work
  socket.on('work', (work) => {
    if (!node) return;
    node.submit(work);
  });

  // Worker submit work
  socket.on('hashrate', (hashrate) => {
    // console.log(hashrate);
  });

  // disconnect
  socket.on("disconnect", (reason) => {
    node.shutdown();
    node = null;
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
