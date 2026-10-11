import { CatalogScreen } from '@native/components/catalog-screen';
import { PersonScreen } from '@native/components/person-screen';
import { useLocalSearchParams } from 'expo-router';
export default function Detail() {
  const { type } = useLocalSearchParams<{ type: string }>();
  if (type === 'person') {
    return <PersonScreen />;
  }
  return <CatalogScreen />;
}
