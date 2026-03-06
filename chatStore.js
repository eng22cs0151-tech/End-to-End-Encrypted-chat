import { create } from 'zustand';

export const useChatStore = create((set) => ({
  peerId: null,
  connection: null,
  messages: [],
  encryptionKeys: null,
  peerPublicKey: null,
  
  setPeerId: (id) => set({ peerId: id }),
  setConnection: (conn) => set({ connection: conn }),
  setEncryptionKeys: (keys) => set({ encryptionKeys: keys }),
  setPeerPublicKey: (key) => set({ peerPublicKey: key }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: Date.now() }]
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  disconnect: () => set({
    connection: null,
    messages: [],
    peerPublicKey: null
  })
}));
