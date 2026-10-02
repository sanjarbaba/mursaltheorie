import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  APIError, APIException, AppStoreServerAPIClient, Environment,
  InAppOwnershipType, SignedDataVerifier, Type
} from '@apple/app-store-server-library';

export const APPLE_PRODUCTS = Object.freeze({
  'nl.mursaltheorie.course.nl.30d': 'theory_b_nl_30d',
  'nl.mursaltheorie.course.nl.fa.30d': 'theory_b_nl_fa_30d',
  'nl.mursaltheorie.course.nl.ps.30d': 'theory_b_nl_ps_30d'
});

const BUNDLE_ID = 'nl.mursaltheorie.app';
const ROOTS = [
  readFileSync(new URL('./apple-certs/AppleIncRootCertificate.cer', import.meta.url)),
  readFileSync(new URL('./apple-certs/AppleRootCA-G2.cer', import.meta.url)),
  readFileSync(new URL('./apple-certs/AppleRootCA-G3.cer', import.meta.url))
];
const verifiers = new Map();

function config(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function appleConfigurationReady() {
  return Boolean(config('APPLE_IAP_KEY_ID') && config('APPLE_IAP_ISSUER_ID')
    && config('APPLE_IAP_PRIVATE_KEY') && config('APPLE_APP_ID')
    && /^\d+$/.test(config('APPLE_APP_ID') || '')
    && (config('APPLE_ACCOUNT_TOKEN_SECRET') || '').length >= 32);
}

export function applePurchasesEnabled() {
  return config('APPLE_IAP_ENABLED') === 'true' && appleConfigurationReady();
}

export function appleAccountToken(userId) {
  const secret = config('APPLE_ACCOUNT_TOKEN_SECRET');
  if (!secret || secret.length < 32) throw new Error('Apple account token secret is not configured');
  const bytes = createHmac('sha256', secret).update(userId).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function sameAccountToken(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  const left = Buffer.from(actual.toLowerCase());
  const right = Buffer.from(expected.toLowerCase());
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifier(environment) {
  if (![Environment.PRODUCTION, Environment.SANDBOX].includes(environment)) throw new Error('Unsupported Apple environment');
  if (!verifiers.has(environment)) {
    verifiers.set(environment, new SignedDataVerifier(
      ROOTS, true, environment, BUNDLE_ID,
      environment === Environment.PRODUCTION ? Number(config('APPLE_APP_ID')) : undefined
    ));
  }
  return verifiers.get(environment);
}

function apiClient(environment) {
  return new AppStoreServerAPIClient(
    config('APPLE_IAP_PRIVATE_KEY').replaceAll('\\n', '\n'),
    config('APPLE_IAP_KEY_ID'), config('APPLE_IAP_ISSUER_ID'), BUNDLE_ID, environment
  );
}

export function sandboxAllowed(userId) {
  if (process.env.VERCEL_ENV !== 'production') return true;
  const ids = (config('APPLE_IAP_SANDBOX_TEST_USER_IDS') || '').split(',').map((item) => item.trim());
  return ids.includes(userId);
}

export async function verifiedTransactionInfo(transactionId, preferredEnvironment) {
  if (!/^[0-9]{1,30}$/.test(transactionId)) throw new Error('Invalid Apple transaction ID');
  const environments = preferredEnvironment
    ? [preferredEnvironment]
    : [Environment.PRODUCTION, Environment.SANDBOX];
  for (const environment of environments) {
    try {
      const response = await apiClient(environment).getTransactionInfo(transactionId);
      if (!response.signedTransactionInfo) throw new Error('Apple transaction has no signed data');
      const transaction = await verifier(environment).verifyAndDecodeTransaction(response.signedTransactionInfo);
      if (transaction.transactionId !== transactionId) throw new Error('Apple transaction ID mismatch');
      return { transaction, environment };
    } catch (error) {
      if (environment === Environment.PRODUCTION && !preferredEnvironment
        && error instanceof APIException && error.apiError === APIError.TRANSACTION_ID_NOT_FOUND) continue;
      throw error;
    }
  }
  throw new Error('Apple transaction not found');
}

export function validateAppleTransaction(transaction, environment, expectedToken) {
  const productKey = APPLE_PRODUCTS[transaction.productId];
  if (!productKey || transaction.bundleId !== BUNDLE_ID || transaction.environment !== environment
    || transaction.type !== Type.NON_RENEWING_SUBSCRIPTION
    || transaction.inAppOwnershipType !== InAppOwnershipType.PURCHASED
    || !sameAccountToken(transaction.appAccountToken, expectedToken)
    || !/^[0-9]{1,30}$/.test(transaction.transactionId || '')
    || !Number.isFinite(transaction.purchaseDate)
    || transaction.purchaseDate < Date.UTC(2020, 0, 1)
    || transaction.purchaseDate > Date.now() + 300_000
    || transaction.quantity !== 1) {
    throw new Error('Apple transaction does not match this app, product or account');
  }
  return {
    environment,
    transactionId: transaction.transactionId,
    productId: transaction.productId,
    productKey,
    purchaseAt: new Date(transaction.purchaseDate).toISOString(),
    revokedAt: transaction.revocationDate ? new Date(transaction.revocationDate).toISOString() : null
  };
}

export async function verifiedNotification(signedPayload) {
  if (typeof signedPayload !== 'string' || signedPayload.length > 200_000) throw new Error('Invalid Apple notification');
  const parts = signedPayload.split('.');
  if (parts.length !== 3) throw new Error('Invalid Apple notification JWS');
  const hint = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  const environmentHint = hint?.data?.environment || hint?.summary?.environment || hint?.appData?.environment;
  const environments = [Environment.PRODUCTION, Environment.SANDBOX].includes(environmentHint)
    ? [environmentHint] : [Environment.PRODUCTION, Environment.SANDBOX];
  let lastError;
  for (const environment of environments) {
    try {
      const result = await verifier(environment).verifyAndDecodeNotification(signedPayload);
      return { notification: result, environment };
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

export async function verifiedSignedTransaction(signedTransactionInfo, environment) {
  if (typeof signedTransactionInfo !== 'string' || signedTransactionInfo.length > 100_000) {
    throw new Error('Invalid Apple signed transaction');
  }
  return verifier(environment).verifyAndDecodeTransaction(signedTransactionInfo);
}
