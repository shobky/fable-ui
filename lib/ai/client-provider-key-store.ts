"use client";

import type { ProviderId } from "@/lib/ai/provider-config";

export type StoredProviderKey = {
  id: string;
  provider: ProviderId;
  label: string;
  fingerprint: string;
  maskedPreview: string;
  encryptedValue: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  lastTestedAt?: string;
  status: "untested" | "valid" | "invalid";
  statusMessage?: string;
  modelScope: "*" | string[];
};

export type ProviderKeyInput = {
  provider: ProviderId;
  label: string;
  apiKey: string;
  modelScope: "*" | string[];
};

const databaseName = "fable-ui-provider-keys";
const databaseVersion = 1;
const keyStoreName = "provider-keys";
const cryptoStoreName = "crypto-key";
const cryptoKeyId = "aes-gcm-key";

function assertBrowserCrypto() {
  if (
    typeof window === "undefined" ||
    !("indexedDB" in window) ||
    !globalThis.crypto?.subtle
  ) {
    throw new Error("Encrypted browser key storage requires IndexedDB and Web Crypto.");
  }
}

function openDatabase() {
  assertBrowserCrypto();

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(keyStoreName)) {
        db.createObjectStore(keyStoreName, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(cryptoStoreName)) {
        db.createObjectStore(cryptoStoreName, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function bufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function base64ToBuffer(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function textEncoder() {
  return new TextEncoder();
}

function textDecoder() {
  return new TextDecoder();
}

async function getOrCreateCryptoKey() {
  const existing = await withStore<{ id: string; key: CryptoKey } | undefined>(
    cryptoStoreName,
    "readonly",
    (store) => store.get(cryptoKeyId),
  );

  if (existing?.key) {
    return existing.key;
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  await withStore(cryptoStoreName, "readwrite", (store) =>
    store.put({ id: cryptoKeyId, key }),
  );

  return key;
}

async function encryptApiKey(apiKey: string) {
  const key = await getOrCreateCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder().encode(apiKey),
  );

  return {
    encryptedValue: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
  };
}

async function decryptApiKey(record: StoredProviderKey) {
  const key = await getOrCreateCryptoKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuffer(record.iv) },
    key,
    base64ToBuffer(record.encryptedValue),
  );

  return textDecoder().decode(decrypted);
}

async function fingerprintApiKey(apiKey: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder().encode(apiKey));
  return bufferToBase64(digest).replace(/[+/=]/g, "").slice(0, 12);
}

function maskApiKey(apiKey: string, fingerprint: string) {
  const prefix = apiKey.slice(0, Math.min(3, apiKey.length));
  const suffix = fingerprint.slice(-4);

  return `${prefix || "key"}-...${suffix}`;
}

function createId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isKeyEligibleForModel(key: StoredProviderKey, provider: ProviderId, model: string) {
  if (key.provider !== provider) {
    return false;
  }

  return key.modelScope === "*" || (model.length > 0 && key.modelScope.includes(model));
}

export async function listStoredProviderKeys() {
  return withStore<StoredProviderKey[]>(keyStoreName, "readonly", (store) => store.getAll());
}

export async function saveStoredProviderKey(input: ProviderKeyInput) {
  const apiKey = input.apiKey.trim();

  if (!apiKey) {
    throw new Error("Enter an API key before saving.");
  }

  const now = new Date().toISOString();
  const fingerprint = await fingerprintApiKey(apiKey);
  const encrypted = await encryptApiKey(apiKey);
  const record: StoredProviderKey = {
    id: createId(),
    provider: input.provider,
    label: input.label.trim() || `${input.provider} key`,
    fingerprint,
    maskedPreview: maskApiKey(apiKey, fingerprint),
    encryptedValue: encrypted.encryptedValue,
    iv: encrypted.iv,
    createdAt: now,
    updatedAt: now,
    status: "untested",
    modelScope: input.modelScope,
  };

  await withStore(keyStoreName, "readwrite", (store) => store.put(record));

  return record;
}

export async function deleteStoredProviderKey(id: string) {
  await withStore(keyStoreName, "readwrite", (store) => store.delete(id));
}

export async function renameStoredProviderKey(id: string, label: string) {
  const record = await getStoredProviderKey(id);

  if (!record) {
    return;
  }

  await withStore(keyStoreName, "readwrite", (store) =>
    store.put({ ...record, label: label.trim() || record.label, updatedAt: new Date().toISOString() }),
  );
}

export async function getStoredProviderKey(id: string) {
  return withStore<StoredProviderKey | undefined>(keyStoreName, "readonly", (store) => store.get(id));
}

export async function decryptStoredProviderKey(id: string) {
  const record = await getStoredProviderKey(id);

  if (!record) {
    throw new Error("Saved provider key was not found.");
  }

  return decryptApiKey(record);
}

export async function markStoredProviderKeyUsed(id: string) {
  const record = await getStoredProviderKey(id);

  if (!record) {
    return;
  }

  await withStore(keyStoreName, "readwrite", (store) =>
    store.put({ ...record, lastUsedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
  );
}

export async function updateStoredProviderKeyStatus(
  id: string,
  status: StoredProviderKey["status"],
  statusMessage?: string,
) {
  const record = await getStoredProviderKey(id);

  if (!record) {
    return;
  }

  await withStore(keyStoreName, "readwrite", (store) =>
    store.put({
      ...record,
      status,
      statusMessage,
      lastTestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  );
}
