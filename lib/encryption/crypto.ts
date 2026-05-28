/**
 * Client-Side E2E Progress Photo Encryption Utility
 * Utilizes the native browser Web Crypto API (AES-GCM 256-bit).
 * Encrypts images in the browser before uploading to Supabase Storage.
 */

// Helper to convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a secure AES-GCM Key from a user passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: BufferSource): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a File using the Web Crypto API
 * Returns the salt, initialization vector (iv), and encrypted base64 payload.
 */
export async function encryptFile(
  file: File,
  passphrase = "fitforge-private-key-salt"
): Promise<{ salt: string; iv: string; ciphertext: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(passphrase, salt);
  const fileData = await file.arrayBuffer();

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    fileData
  );

  return {
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(encryptedData),
  };
}

/**
 * Decrypts an Encrypted Base64 Payload back into a Data-URL for browser rendering
 */
export async function decryptPayload(
  ciphertextBase64: string,
  saltBase64: string,
  ivBase64: string,
  passphrase = "fitforge-private-key-salt"
): Promise<string> {
  const salt = base64ToArrayBuffer(saltBase64);
  const iv = base64ToArrayBuffer(ivBase64);
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);

  const key = await deriveKey(passphrase, salt);

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  const blob = new Blob([decryptedData], { type: "image/jpeg" });
  return URL.createObjectURL(blob);
}
