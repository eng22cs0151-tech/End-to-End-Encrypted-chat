import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { encryptMessage, decryptMessage, encryptFile, decryptFile } from '../services/encryption';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import BackupMenu from './BackupMenu';
import './ChatInterface.css';

function ChatInterface() {
  const { connection, messages, addMessage, encryptionKeys, peerPublicKey, disconnect, setPeerPublicKey } = useChatStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!connection) return;

    console.log('ChatInterface mounted, connection:', connection);
    console.log('Current peerPublicKey:', peerPublicKey);
    console.log('Current encryptionKeys:', encryptionKeys);

    const handleData = (data) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Received data in ChatInterface:', parsed);
        
        if (parsed.type === 'public-key') {
          console.log('Received peer public key in ChatInterface:', parsed.key);
          // Only set if we don't already have it
          if (!peerPublicKey) {
            setPeerPublicKey(parsed.key);
            // Send our public key back only once
            if (encryptionKeys) {
              const publicKeyBase64 = encodeBase64(encryptionKeys.publicKey);
              connection.send(JSON.stringify({ type: 'public-key', key: publicKeyBase64 }));
            }
          }
        } else if (parsed.type === 'test') {
          console.log('Received test message:', parsed.content);
        } else if (parsed.type === 'message') {
          try {
            const decrypted = decryptMessage(
              parsed.content,
              decodeBase64(peerPublicKey),
              encryptionKeys.secretKey
            );
            addMessage({
              content: decrypted,
              sender: 'peer',
              timestamp: new Date().toISOString()
            });
            setIsTyping(false);
          } catch (error) {
            console.error('Failed to decrypt message:', error);
          }
        } else if (parsed.type === 'file') {
          try {
            const decryptedFile = decryptFile(
              parsed.content,
              decodeBase64(peerPublicKey),
              encryptionKeys.secretKey
            );
            const blob = new Blob([decryptedFile], { type: parsed.fileType });
            const url = URL.createObjectURL(blob);
            
            addMessage({
              content: parsed.fileName,
              sender: 'peer',
              timestamp: new Date().toISOString(),
              isFile: true,
              fileUrl: url,
              fileType: parsed.fileType,
              fileSize: parsed.fileSize
            });
          } catch (error) {
            console.error('Failed to decrypt file:', error);
          }
        } else if (parsed.type === 'typing') {
          setIsTyping(parsed.isTyping);
        }
      } catch (e) {
        console.error('Error parsing received data:', e);
      }
    };

    connection.on('data', handleData);

    connection.on('close', () => {
      disconnect();
    });

    // Cleanup
    return () => {
      connection.off('data', handleData);
    };
  }, [connection, addMessage, encryptionKeys, peerPublicKey, disconnect, setPeerPublicKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !connection) return;

    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Input message:', inputMessage);
    console.log('Connection:', connection);
    console.log('Connection open:', connection.open);
    console.log('Encryption keys:', encryptionKeys);
    console.log('Peer public key:', peerPublicKey);

    if (!peerPublicKey || !encryptionKeys) {
      console.error('Keys not ready');
      alert('Encryption keys not ready. Please wait a moment and try again.');
      return;
    }

    try {
      // Test: Send unencrypted message first
      console.log('Testing unencrypted send...');
      connection.send(JSON.stringify({
        type: 'test',
        content: 'test message'
      }));
      console.log('Unencrypted test sent successfully');

      const peerPublicKeyUint8 = decodeBase64(peerPublicKey);
      console.log('Decoded peer public key length:', peerPublicKeyUint8.length);
      
      const encrypted = encryptMessage(
        inputMessage,
        peerPublicKeyUint8,
        encryptionKeys.secretKey
      );
      
      console.log('Encrypted message type:', typeof encrypted);
      console.log('Encrypted message:', encrypted);

      const messageData = JSON.stringify({
        type: 'message',
        content: encrypted
      });
      
      console.log('Message data to send:', messageData);
      connection.send(messageData);

      addMessage({
        content: inputMessage,
        sender: 'me',
        timestamp: new Date().toISOString()
      });

      setInputMessage('');
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !connection) return;

    const encryptedFile = await encryptFile(
      file,
      decodeBase64(peerPublicKey),
      encryptionKeys.secretKey
    );

    connection.send({
      type: 'file',
      content: encryptedFile.data,
      fileName: encryptedFile.name,
      fileType: encryptedFile.type,
      fileSize: encryptedFile.size
    });

    const blob = new Blob([file], { type: file.type });
    const url = URL.createObjectURL(blob);

    addMessage({
      content: file.name,
      sender: 'me',
      timestamp: new Date().toISOString(),
      isFile: true,
      fileUrl: url,
      fileType: file.type,
      fileSize: file.size
    });

    e.target.value = '';
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    // Removed typing indicator to avoid conflicts
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="peer-info">
          <div className="peer-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="peer-details">
            <h3>Peer</h3>
            <span className="status">Online</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowBackupMenu(true)} className="backup-btn" title="Backup & Export">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
            </svg>
          </button>
          <button onClick={disconnect} className="disconnect-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <p>No messages yet</p>
            <span>Send a message to start the conversation</span>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
            <div className="message-content">
              {msg.isFile ? (
                <div className="file-message">
                  <div className="file-icon">
                    {msg.fileType?.startsWith('image/') ? (
                      <img src={msg.fileUrl} alt={msg.content} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                    )}
                  </div>
                  <div className="file-info">
                    <span className="file-name">{msg.content}</span>
                    <span className="file-size">{formatFileSize(msg.fileSize)}</span>
                  </div>
                  <a href={msg.fileUrl} download={msg.content} className="download-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
                    </svg>
                  </a>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <button onClick={() => fileInputRef.current?.click()} className="attach-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          type="text"
          placeholder="Type a message"
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="send-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      
      {showBackupMenu && <BackupMenu onClose={() => setShowBackupMenu(false)} />}
    </div>
  );
}

export default ChatInterface;
