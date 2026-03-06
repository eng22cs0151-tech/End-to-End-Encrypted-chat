import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// Manual UTF8 encoding/decoding to avoid issues
const encodeUTF8 = (str) => {
  return new TextEncoder().encode(str);
};

const decodeUTF8 = (arr) => {
  return new TextDecoder().decode(arr);
};

export const generateKeyPair = () => {
  return nacl.box.keyPair();
};

export const encryptMessage = (message, theirPublicKey, mySecretKey) => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = encodeUTF8(message);
  const encrypted = nacl.box(messageUint8, nonce, theirPublicKey, mySecretKey);
  
  if (!encrypted) {
    throw new Error('Encryption failed');
  }
  
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  
  return encodeBase64(fullMessage);
};

export const decryptMessage = (messageWithNonce, theirPublicKey, mySecretKey) => {
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength);
  
  const decrypted = nacl.box.open(message, nonce, theirPublicKey, mySecretKey);
  
  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }
  
  return decodeUTF8(decrypted);
};

export const encryptFile = async (file, theirPublicKey, mySecretKey) => {
  const arrayBuffer = await file.arrayBuffer();
  const fileUint8 = new Uint8Array(arrayBuffer);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  
  const encrypted = nacl.box(fileUint8, nonce, theirPublicKey, mySecretKey);
  
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  
  return {
    data: encodeBase64(fullMessage),
    name: file.name,
    type: file.type,
    size: file.size
  };
};

export const decryptFile = (encryptedData, theirPublicKey, mySecretKey) => {
  const messageWithNonceAsUint8Array = decodeBase64(encryptedData);
  const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength);
  
  const decrypted = nacl.box.open(message, nonce, theirPublicKey, mySecretKey);
  
  if (!decrypted) {
    throw new Error('Could not decrypt file');
  }
  
  return decrypted;
};
