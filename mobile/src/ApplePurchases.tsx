import { useAuth } from '@clerk/expo';
import { getAvailablePurchases, useIAP } from 'expo-iap';
import type { Purchase } from 'expo-iap';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { createApiClient } from './api/client';
import { colors } from './theme';
import type { Locale } from './types';

export type ApplePurchaseConfiguration = {
  enabled: boolean;
  appAccountToken?: string;
  products: string[];
};

const packages = [
  { id: 'nl.mursaltheorie.course.nl.30d', locales: ['nl'], name: { nl: 'Nederlands', fa: 'هلندی', ps: 'هالنډي' } },
  { id: 'nl.mursaltheorie.course.nl.fa.30d', locales: ['nl', 'fa'], name: { nl: 'Nederlands + Dari/Farsi', fa: 'هلندی + دری/فارسی', ps: 'هالنډي + دري/فارسي' } },
  { id: 'nl.mursaltheorie.course.nl.ps.30d', locales: ['nl', 'ps'], name: { nl: 'Nederlands + Pashto', fa: 'هلندی + پشتو', ps: 'هالنډي + پښتو' } }
] as const;

type Copy = { title: string; duration: string; buy: string; restore: string; loading: string; unavailable: string; restored: string; none: string; verified: string; inactive: string; pending: string; failed: string };
const copy: Record<Locale, Copy> = {
  nl: { title: '30 dagen toegang via Apple', duration: 'Eenmalige aankoop zonder automatische verlenging', buy: 'Koop via App Store', restore: 'Herstel aankopen', loading: 'Apple-producten laden…', unavailable: 'Aankopen zijn nog niet beschikbaar. Probeer het later opnieuw.', restored: 'Je aankopen zijn gecontroleerd.', none: 'Geen aankoop gevonden voor dit Apple-account.', verified: 'Aankoop bevestigd. Je toegang is bijgewerkt.', inactive: 'Deze aankoop geeft geen actieve toegang meer.', pending: 'Je aankoop wordt nog gecontroleerd. Probeer Herstel aankopen als dit blijft staan.', failed: 'De aankoop kon nog niet worden bevestigd. Probeer Herstel aankopen.' },
  fa: { title: 'دسترسی ۳۰ روزه از اپل', duration: 'خرید یک‌باره، بدون تمدید خودکار', buy: 'خرید از اپ استور', restore: 'بازیابی خریدها', loading: 'در حال بارگیری محصولات اپل…', unavailable: 'خرید فعلاً در دسترس نیست. بعداً دوباره تلاش کنید.', restored: 'خریدهای شما بررسی شد.', none: 'برای این حساب اپل خریدی پیدا نشد.', verified: 'خرید تأیید شد. دسترسی شما به‌روز شد.', inactive: 'این خرید دیگر دسترسی فعال نمی‌دهد.', pending: 'خرید شما هنوز بررسی می‌شود. در صورت ادامه، بازیابی خریدها را بزنید.', failed: 'خرید هنوز تأیید نشد. بازیابی خریدها را امتحان کنید.' },
  ps: { title: 'د اپل له لارې ۳۰ ورځنی لاسرسی', duration: 'یو ځل پېرود، بې له اتومات تمدید څخه', buy: 'له اپ سټور څخه واخلئ', restore: 'پېرودونه بېرته ترلاسه کړئ', loading: 'د اپل محصولات بارېږي…', unavailable: 'پېرود اوس نه شته. وروسته بیا هڅه وکړئ.', restored: 'ستاسو پېرودونه وکتل شول.', none: 'د دې اپل حساب لپاره پېرود ونه موندل شو.', verified: 'پېرود تایید شو. ستاسو لاسرسی تازه شو.', inactive: 'دا پېرود نور فعال لاسرسی نه ورکوي.', pending: 'ستاسو پېرود لا کتل کېږي. که دا حالت پاتې شي، پېرودونه بېرته ترلاسه کړئ.', failed: 'پېرود لا تایید نه شو. پېرودونه بېرته ترلاسه کړئ.' }
};

export function ApplePurchases({ locale, configuration, allowedLocales, onAccessChanged }: {
  locale: Locale;
  configuration: ApplePurchaseConfiguration;
  allowedLocales: Locale[];
  onAccessChanged: () => Promise<void>;
}) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const checking = useRef(new Map<string, Promise<boolean>>());
  const finishing = useRef(new Map<string, Promise<void>>());
  const finished = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const labels = copy[locale];

  async function verify(purchase: Purchase, finish: boolean) {
    if (!configuration.products.includes(purchase.productId)) return false;
    const transactionId = 'transactionId' in purchase ? purchase.transactionId : null;
    if (!transactionId) { setMessage(labels.pending); return false; }
    let task = checking.current.get(transactionId);
    if (!task) {
      task = (async () => {
        const result = await createApiClient(() => getTokenRef.current())<{ status: string; accessUntil: string }>('/api/v1/apple-purchases', {
          method: 'POST', body: JSON.stringify({ transactionId })
        });
        return result.status === 'active' && new Date(result.accessUntil).getTime() > Date.now();
      })();
      checking.current.set(transactionId, task);
    }
    try {
      const active = await task;
      if (finish && !finished.current.has(transactionId)) {
        let finishTask = finishing.current.get(transactionId);
        if (!finishTask) {
          finishTask = finishTransaction({ purchase, isConsumable: false }).then(() => {
            finished.current.add(transactionId);
          });
          finishing.current.set(transactionId, finishTask);
        }
        try { await finishTask; }
        finally {
          if (finishing.current.get(transactionId) === finishTask) finishing.current.delete(transactionId);
        }
      }
      try {
        await onAccessChanged();
        setMessage(active ? labels.verified : labels.inactive);
      } catch {
        setMessage(labels.pending);
      }
      return active;
    } catch {
      setMessage(labels.failed);
      return false;
    } finally {
      if (checking.current.get(transactionId) === task) checking.current.delete(transactionId);
    }
  }

  const { connected, products, fetchProducts, requestPurchase, restorePurchases, finishTransaction } = useIAP({
    onPurchaseSuccess: (purchase) => { void verify(purchase, true); },
    onPurchaseError: (error) => {
      if (!String(error.code).toLowerCase().includes('cancel')) setMessage(labels.failed);
    },
    onError: () => setMessage(labels.unavailable)
  });

  useEffect(() => {
    if (!connected) return;
    void fetchProducts({ skus: configuration.products, type: 'in-app' }).catch(() => setMessage(labels.unavailable));
  }, [connected, configuration.products.join(',')]);

  async function buy(productId: string) {
    if (!connected || busy || !configuration.appAccountToken) return;
    setBusy(true);
    setMessage('');
    try {
      await requestPurchase({
        request: { apple: { sku: productId, appAccountToken: configuration.appAccountToken } },
        type: 'in-app'
      });
    } catch { setMessage(labels.failed); }
    finally { setBusy(false); }
  }

  async function restore() {
    if (!connected || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await restorePurchases({ onlyIncludeActiveItemsIOS: false });
      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: false });
      const relevant = purchases.filter((purchase) => configuration.products.includes(purchase.productId));
      if (!relevant.length) {
        await onAccessChanged();
        setMessage(labels.none);
      } else {
        let confirmed = 0;
        for (const purchase of relevant) if (await verify(purchase, false)) confirmed += 1;
        if (confirmed) setMessage(labels.restored);
      }
    } catch { setMessage(labels.failed); }
    finally { setBusy(false); }
  }

  const offered = packages.filter((item) => configuration.products.includes(item.id)
    && !item.locales.every((language) => allowedLocales.includes(language)));

  return <View style={styles.section}>
    <Text style={styles.title}>{labels.title}</Text>
    <Text style={styles.detail}>{labels.duration}</Text>
    {!connected ? <ActivityIndicator color={colors.primary} /> : !products.length ? <Text style={styles.detail}>{labels.loading}</Text> : offered.map((item) => {
      const product = products.find((value) => value.id === item.id);
      return product ? <View key={item.id} style={styles.product}>
        <View style={styles.productText}><Text style={styles.productName}>{item.name[locale]}</Text><Text style={styles.price}>{product.displayPrice}</Text></View>
        <Pressable disabled={busy} onPress={() => void buy(item.id)} accessibilityRole="button" style={[styles.button, busy && styles.disabled]}><Text style={styles.buttonText}>{labels.buy}</Text></Pressable>
      </View> : null;
    })}
    <Pressable disabled={!connected || busy} onPress={() => void restore()} accessibilityRole="button" style={[styles.restore, (!connected || busy) && styles.disabled]}><Text style={styles.restoreText}>{labels.restore}</Text></Pressable>
    {message ? <Text style={styles.detail}>{message}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12, padding: 16, borderRadius: 18, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.surface },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  product: { gap: 9, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.line },
  productText: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  productName: { color: colors.ink, fontWeight: '700', flex: 1 },
  price: { color: colors.ink, fontWeight: '800' },
  button: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  buttonText: { color: '#fff', fontWeight: '800' },
  restore: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderColor: colors.primary, borderWidth: 1 },
  restoreText: { color: colors.primary, fontWeight: '800' },
  disabled: { opacity: 0.45 }
});
