import Peer from 'peerjs';

export const initializePeer = () => {
  return new Promise((resolve, reject) => {
    // Use PeerJS cloud server for reliability
    const peer = new Peer({
      debug: 2
    });

    peer.on('open', (id) => {
      console.log('Connected to PeerJS server with ID:', id);
      resolve({ peer, id });
    });

    peer.on('error', (error) => {
      console.error('PeerJS error:', error);
      // Still resolve with a fallback to prevent infinite loading
      if (error.type === 'network' || error.type === 'server-error') {
        setTimeout(() => {
          const retryPeer = new Peer();
          retryPeer.on('open', (id) => {
            console.log('Retry successful with ID:', id);
            resolve({ peer: retryPeer, id });
          });
        }, 1000);
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!peer.id) {
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
};

export const connectToPeer = (peer, targetId) => {
  return peer.connect(targetId, {
    reliable: true,
    serialization: 'binary'
  });
};
