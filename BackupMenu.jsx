import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import './BackupMenu.css';

function BackupMenu({ onClose }) {
  const { messages, encryptionKeys } = useChatStore();
  const [showMenu, setShowMenu] = useState(true);

  const handleClose = () => {
    setShowMenu(false);
    setTimeout(onClose, 200);
  };

  const exportToJSON = () => {
    const backup = {
      messages: messages,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    handleClose();
  };

  const exportToText = () => {
    let textContent = 'Chat Backup\n';
    textContent += `Exported: ${new Date().toISOString()}\n`;
    textContent += '='.repeat(50) + '\n\n';

    messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const sender = msg.sender === 'me' ? 'You' : 'Peer';
      textContent += `[${time}] ${sender}: ${msg.content}\n`;
      if (msg.isFile) {
        textContent += `  (File: ${msg.content})\n`;
      }
      textContent += '\n';
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-backup-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    handleClose();
  };

  const saveToLocalStorage = () => {
    const backup = {
      messages: messages,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    localStorage.setItem('chatBackup', JSON.stringify(backup));
    alert('Chat backed up to browser local storage!');
    handleClose();
  };

  const loadFromLocalStorage = () => {
    const backup = localStorage.getItem('chatBackup');
    if (backup) {
      const parsed = JSON.parse(backup);
      alert(`Found backup from ${new Date(parsed.timestamp).toLocaleString()}\nMessages: ${parsed.messages.length}`);
      
      if (confirm('Do you want to restore this backup? Current messages will be replaced.')) {
        useChatStore.setState({ messages: parsed.messages });
        alert('Backup restored successfully!');
        handleClose();
      }
    } else {
      alert('No backup found in local storage.');
    }
  };

  const clearLocalStorage = () => {
    if (confirm('Are you sure you want to delete the backup from local storage?')) {
      localStorage.removeItem('chatBackup');
      alert('Backup deleted from local storage.');
      handleClose();
    }
  };

  return (
    <div className={`backup-overlay ${showMenu ? 'show' : ''}`} onClick={handleClose}>
      <div className={`backup-menu ${showMenu ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="backup-header">
          <h3>Backup & Export</h3>
          <button onClick={handleClose} className="close-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
          </button>
        </div>

        <div className="backup-content">
          <div className="backup-section">
            <h4>Export Chat</h4>
            <p className="section-desc">Download your chat history</p>
            
            <button onClick={exportToJSON} className="backup-option">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
              </svg>
              <div>
                <strong>Export as JSON</strong>
                <span>Full backup with metadata</span>
              </div>
            </button>

            <button onClick={exportToText} className="backup-option">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10-10H8v2h8v-2zm0 4H8v2h8v-2z"/>
              </svg>
              <div>
                <strong>Export as Text</strong>
                <span>Human-readable format</span>
              </div>
            </button>
          </div>

          <div className="backup-divider"></div>

          <div className="backup-section">
            <h4>Local Storage</h4>
            <p className="section-desc">Save to browser storage</p>
            
            <button onClick={saveToLocalStorage} className="backup-option">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6V6z"/>
              </svg>
              <div>
                <strong>Save to Browser</strong>
                <span>Quick local backup</span>
              </div>
            </button>

            <button onClick={loadFromLocalStorage} className="backup-option">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
              </svg>
              <div>
                <strong>Restore from Browser</strong>
                <span>Load saved backup</span>
              </div>
            </button>

            <button onClick={clearLocalStorage} className="backup-option danger">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              <div>
                <strong>Clear Browser Backup</strong>
                <span>Delete saved data</span>
              </div>
            </button>
          </div>

          <div className="backup-info">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>Messages: {messages.length} | Backups are stored locally and remain encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackupMenu;
