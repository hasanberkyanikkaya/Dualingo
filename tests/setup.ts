import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Test ortamı hazırlığı — `node --import` ile testlerden ÖNCE yükleniyor.
 *
 * ⚠️ **Hiçbir test bağımlılığı yok ve olmayacak.** Node 24 TypeScript tiplerini
 * kendisi soyuyor, `node --test` koşucuyu kendisi getiriyor. `tsx` denendi ve
 * ELENDİ: bağımlılığı olan `esbuild` kurulum sırasında ikili dosyasını
 * `EBUSY` ile kilitliyor — proje klasörü OneDrive altında ve senkronizasyon
 * yeni yazılan `.exe`yi tutuyor. Her temiz `npm install`ta tekrarlardı.
 *
 * ⚠️ Tip soyma `enum`, `namespace` ve kurucu parametre özelliklerini
 * desteklemez. Proje bunların hiçbirini kullanmıyor (denetlendi); yeni kod da
 * kullanmamalı, yoksa testler çalışmaz.
 */

const projectRoot = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');

/** `@/x` → diskteki gerçek dosya. Uzantı ve `index` denemesi elle yapılıyor. */
function resolveAlias(specifier: string): string | null {
  const base = resolvePath(projectRoot, specifier.slice(2));

  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (existsSync(candidate) && !candidate.endsWith('/')) {
      // Klasörün kendisi modül değil; `index.ts` denemesi listede zaten var.
      if (candidate === base && !/\.[cm]?tsx?$/.test(candidate)) {
        continue;
      }
      return candidate;
    }
  }

  return null;
}

/**
 * `@/` takma adını çözer.
 *
 * Node'un ESM çözücüsü `tsconfig.json`daki `paths`ı bilmez. Kaynak dosyalar
 * (`answerEngine` → `@/constants/strings`) bunu DEĞER olarak import ettiği için
 * takma ad çözümü şart; `import type` satırları zaten soyulup atılıyor.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const target = resolveAlias(specifier);
      if (target !== null) {
        return nextResolve(pathToFileURL(target).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

/**
 * React Native'in genel `__DEV__` değişkeni. Node'da yok; bazı saf dosyalar
 * (`questionValidation.warnContent`) ona bakıyor ve tanımsızsa `ReferenceError`
 * düşer.
 *
 * `false` seçildi: testler geçerken konsola uyarı yağmasın. Bozuk içerik
 * davranışını sınayan testler dönen DEĞERE bakıyor, uyarıya değil.
 */
(globalThis as { __DEV__?: boolean }).__DEV__ = false;
