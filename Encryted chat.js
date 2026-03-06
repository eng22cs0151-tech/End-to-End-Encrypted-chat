import express from 'express';
import { ExpressPeerServer } from 'peer';
import cors from 'cors';

const app = express();
const PORT = 9000;

app.use(cors());

const server = app.listen(PORT, () => {
  console.log(`PeerJS server running on port ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
  allow_discovery: true,
  debug: true
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log('Client connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('Client disconnected:', client.getId());
});
