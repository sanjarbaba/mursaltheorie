import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_KEY = 'mursaltheorie.device-id.v1';

export async function getDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_KEY);
  if (existing) return existing;
  const created = `mobile:${Crypto.randomUUID()}`;
  await SecureStore.setItemAsync(DEVICE_KEY, created);
  return created;
}

