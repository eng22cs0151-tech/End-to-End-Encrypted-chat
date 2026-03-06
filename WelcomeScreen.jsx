import { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { connectToPeer } from '../services/peerService';
import { generateKeyPair } from '../services/encryption';
import { encodeBase64 } from 'tweetnacl-util';
import Peer from 'peerjs';
import './WelcomeScreen.css';

function WelcomeScreen() {
  const { peerId, setConnection, setEncryptionKeys, setPeerPublicKey, addMessage } = useChatStore();
  const [targetPeerId, setTargetPeerId] = useState('');
  const [copied, setCopied] = useState(false);
  const [peer, setPeer] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const keys = generateKeyPair();
    setEncryptionKeys(keys);
    
    // Create a new peer instance (PeerJS will auto-generate unique ID)
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      console.log('Peer ready with ID:', id);
      setPeer(newPeer);
    });
    
    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      setError(err.message || 'Connection error');
    });
    
    newPeer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      
      conn.on('open', () => {
        console.log('Connection opened, sending public key');
        const publicKeyBase64 = encodeBase64(keys.publicKey);
        console.log('My public key:', publicKeyBase64);
        conn.send(JSON.stringify({ type: 'public-key', key: publicKeyBase64 }));
      });
      
      conn.on('data', (data) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          console.log('Received data:', parsed);
          if (parsed.type === 'public-key') {
            console.log('Received peer public key:', parsed.key);
            setPeerPublicKey(parsed.key);
            setConnection(conn);
          }
        } catch (e) {
          console.error('Error parsing data:', e);
        }
      });
      
      conn.on('error', (err) => {
        console.error('Connection error:', err);
        setError('Connection failed: ' + err.message);
        setConnecting(false);
      });
    });
  }, [peerId, setEncryptionKeys, setConnection, setPeerPublicKey]);

  const handleConnect = () => {
    if (!targetPeerId.trim() || !peer) return;
    
    // Prevent connecting to self
    if (targetPeerId === peerId) {
      setError('Cannot connect to yourself! Open another browser window and use that Peer ID.');
      return;
    }
    
    setConnecting(true);
    setError('');
    console.log('Connecting to:', targetPeerId);
    
    const conn = connectToPeer(peer, targetPeerId);
    const keys = useChatStore.getState().encryptionKeys;
    
    conn.on('open', () => {
      console.log('Outgoing connection opened, sending public key');
      const publicKeyBase64 = encodeBase64(keys.publicKey);
      console.log('My public key:', publicKeyBase64);
      conn.send(JSON.stringify({ type: 'public-key', key: publicKeyBase64 }));
    });
    
    conn.on('data', (data) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Received data:', parsed);
        if (parsed.type === 'public-key') {
          console.log('Received peer public key:', parsed.key);
          setPeerPublicKey(parsed.key);
          setConnection(conn);
          setConnecting(false);
        }
      } catch (e) {
        console.error('Error parsing data:', e);
      }
    });
    
    conn.on('error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect. Make sure the Peer ID is correct.');
      setConnecting(false);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (connecting) {
        setError('Connection timeout. The peer might be offline.');
        setConnecting(false);
      }
    }, 10000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-card">
        <div className="welcome-header">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.31-3.86-.86l-.28-.15-2.9.49.49-2.9-.15-.28C4.31 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
          <h1>Secure P2P Chat</h1>
          <p className="subtitle">End-to-end encrypted messaging</p>
        </div>

        <div className="connection-section">
          <div className="your-id-section">
            <label>Your ID</label>
            <div className="id-display">
              <code>{peerId}</code>
              <button onClick={copyToClipboard} className="copy-btn">
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="hint">Share this ID with your peer to receive messages</p>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="connect-section">
            <label>Connect to Peer</label>
            <div className="connect-input-group">
              <input
                type="text"
                placeholder="Enter peer ID"
                value={targetPeerId}
                onChange={(e) => setTargetPeerId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                disabled={connecting}
              />
              <button onClick={handleConnect} className="connect-btn" disabled={connecting}>
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>

        <div className="security-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          <span>All messages are end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
