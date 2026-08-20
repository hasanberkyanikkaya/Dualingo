import { FlatList, StyleSheet } from 'react-native';

import OptionCard from '@/components/OptionCard';
import { layout } from '@/constants/spacing';

type PickerItem = {
  id: string;
  name: string;
};

type DistrictPickerListProps = {
  items: readonly PickerItem[];
  onSelect: (id: string) => void;
};

/**
 * İl ya da ilçe listesi.
 *
 * ⚠️ **`OptionCard` yeniden kullanılıyor, yeni bir kart YAZILMIYOR** (mimari
 * kural 3). O bileşen 2.2a'da ölçülmüş renk kararlarını taşıyor: 2px
 * `borderControl` kenarlık (zemine 3.64 açık / 3.46 koyu), 0.98 basma ölçeği,
 * "sınırı kenarlık taşır, dolgu değil" kuralı. Kendi kartımızı yazmak bütün o
 * ölçümleri ikinci kez yapmak olurdu — 2.6'nın kademe seçimi de tam bu sebeple
 * `OptionCard`a taşınmıştı.
 *
 * `selected` her zaman `false`: burada seçim kalıcı bir durum değil, dokunmanın
 * kendisi eylemi tetikliyor. Radyo göstergesi yine de listenin dokunulabilir
 * olduğunu söylüyor.
 *
 * ⚠️ 973 ilçeyi kapsayabildiği için `FlatList` — `map` ile çizmek İstanbul
 * listesinde ilk kareyi gözle görülür biçimde geciktirirdi.
 */
export default function DistrictPickerList({ items, onSelect }: DistrictPickerListProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <OptionCard label={item.name} selected={false} onPress={() => onSelect(item.id)} />
      )}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: layout.listGap,
    paddingBottom: layout.sectionGap,
  },
});
