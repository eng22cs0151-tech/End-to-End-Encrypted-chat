import { useState, useEffect } from 'react';
import { useChatStore } from './store/chatStore';
import { initializePeer } from './services/peerService';
import WelcomeScreen from './components/WelcomeScreen';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const { peerId, setPeerId, setConnection } = useChatStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { peer, id } = await initializePeer();
        setPeerId(id);
        
        peer.on('connection', (conn) => {
          console.log('Incoming connection from:', conn.peer);
          setConnection(conn);
        });
        
        peer.on('error', (err) => {
          console.error('Peer error:', err);
        });
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err.message);
        setIsInitialized(true); // Still show UI
      }
    };
    
    init();
  }, [setPeerId, setConnection]);

  if (!isInitialized) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Initializing secure connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading">
        <p style={{ color: '#ff6b6b' }}>Connection Error: {error}</p>
        <button onClick={() => window.location.reload()} style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#00a884',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer'
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      {!useChatStore.getState().connection ? (
        <WelcomeScreen />
      ) : (
        <ChatInterface />
      )}
    </div>
  );
}

export default App;
