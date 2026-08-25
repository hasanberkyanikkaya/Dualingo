import * as Crypto from 'expo-crypto';

/** Sunucudaki UUID sütunuyla uyumlu, kriptografik mutasyon kimliği. */
export function createMutationId(): string {
  return Crypto.randomUUID();
}
