/**
 * Soru içeriğinin çalışma anı denetimleri.
 *
 * Hiçbiri hata fırlatmaz ve hiçbiri kullanıcıya bir şey göstermez — yalnızca
 * `__DEV__` altında uyarır. İçerik elle yazılıyor; hata er geç olacak ve
 * uygulamanın o yüzden çökmemesi gerekiyor (ProgressBar'ın "bozuk girdi
 * sessizce boş çubuk" doktrini).
 */

/**
 * Aynı kimliğin iki kez geçmesi sessiz bir arayüz hatası doğurur: iki kart
 * birlikte seçili görünür, iki çip birlikte tükenir. Emsal: `contentLoader`'ın
 * yinelenen seviye kimliği uyarısı.
 */
export function warnOnDuplicateIds(
  items: readonly { id: string }[],
  context: string,
): void {
  if (!__DEV__) {
    return;
  }

  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      console.warn(`[içerik] ${context}: "${item.id}" kimliği yineleniyor.`);
    }
    seen.add(item.id);
  }
}

/** Geliştirme uyarısı — soru içeriği kullanılabilir ama kusurlu. */
export function warnContent(context: string, message: string): void {
  if (__DEV__) {
    console.warn(`[içerik] ${context}: ${message}`);
  }
}
