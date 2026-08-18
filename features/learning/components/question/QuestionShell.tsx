import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type QuestionShellProps = {
  /** Tip yönergesi — `strings.question.*` (örn. 'Doğru cevabı seç') */
  instruction: string;
  /** Soru metni — içerikten */
  prompt: string;
  /** İsteğe bağlı ipucu — içerikten */
  hint?: string;
  /** Cevap alanı: şık listesi, sıralama, boşluk doldurma… */
  children: ReactNode;
  /** Cevap oluştu mu — "Kontrol et" bunun tersinde pasif */
  canSubmit: boolean;
  onSubmit: () => void;
};

/**
 * Altı soru tipinin ortak kabuğu: üstte soru, ortada tipe özel cevap alanı,
 * altta sabit "Kontrol et".
 *
 * Tek tüketicisi bugün `MultipleChoiceQuestion` — normalde projenin "ikinci
 * kullanımda soyutla" kuralına takılırdı. Baştan yazılmasının sebebi şeklin
 * TAHMİN olmaması: playbook altı tip için de aynı iskeleti tarif ediyor ve
 * Faz 2.3'ün alt bölümü devralacağı şimdiden biliniyor. Bir olası düzeltme,
 * altı kesin düzeltmeye tercih edildi.
 *
 * ⚠️ **Bu bileşen sınırlı yükseklik İSTER** (`flex: 1` ile ebeveynini doldurur).
 * Bir `ScrollView` içine konursa yükseklik sonsuza gider, `flex: 1` çöker ve
 * alt bölüm içerikten ayrılır. Ders ekranı onu doğrudan çizmeli.
 *
 * ⚠️ **Güvenli alan payı OKUMAZ.** Ekranın altında olup olmadığını bilemez;
 * alt payı Faz 2.3'te ders ekranı `SafeAreaView edges={['bottom']}` ile
 * üstlenecek. Yoksa "Kontrol et" iPhone'un ana ekran çizgisine oturur.
 * (Projenin payları bölme disiplini: ÜST → TopBar, ALT → sekme çubuğu ya da
 * ders ekranı, YATAY → Screen.)
 *
 * **Faz 2.3 göçü:** kabuğa `isAnswered?: boolean` eklenecek; doluyken alt bölüm
 * hiçbir şey çizmeyecek ve yerini ders ekranının geri bildirim paneli alacak.
 * Değişecek dosya bu — altı soru bileşeninin hiçbiri değil.
 */
export default function QuestionShell({
  instruction,
  prompt,
  hint,
  children,
  canSubmit,
  onSubmit,
}: QuestionShellProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
          Soru bloğu tek odak durağı: yönerge, metin ve ipucu birlikte okunuyor.
          `header` rolü, ekran okuyucu kullanıcısının başlıklar arasında gezinip
          soruya geri dönebilmesi için.
        */}
        <View accessible accessibilityRole="header" style={styles.questionBlock}>
          <Text style={[textStyles.labelSmall, { color: theme.textMuted }]}>{instruction}</Text>

          <Text style={[textStyles.h4, { color: theme.textPrimary }]}>{prompt}</Text>

          {hint !== undefined && hint.length > 0 ? (
            <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>{hint}</Text>
          ) : null}
        </View>

        {children}
      </ScrollView>

      {/*
        Alt bölüm kaydırmanın DIŞINDA. Kaysaydı buton her soruda başka yerde
        olurdu ve Faz 2.3'te geri bildirim paneli onun yerini alırken zıplardı.
      */}
      <View style={styles.footer}>
        {/*
          İpucu metni söküp takılmıyor, saydamlaşıyor: söküldüğünde buton yukarı
          kayardı. Emsal ve aynı gerekçe: Button'ın yükleniyorken etiketi
          `opacity: 0` ile tutması.
        */}
        <Text
          accessibilityElementsHidden={canSubmit}
          importantForAccessibility={canSubmit ? 'no-hide-descendants' : 'auto'}
          style={[
            textStyles.bodySmall,
            styles.hint,
            canSubmit ? styles.hintHidden : null,
            { color: theme.textSecondary },
          ]}
        >
          {strings.question.selectAnswerHint}
        </Text>

        <Button
          label={strings.lesson.checkAnswer}
          onPress={onSubmit}
          size="large"
          fullWidth
          disabled={!canSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  questionBlock: {
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  hint: {
    textAlign: 'center',
  },
  hintHidden: {
    opacity: 0,
  },
});
