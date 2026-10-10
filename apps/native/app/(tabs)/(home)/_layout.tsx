import { CatalogStack } from '@native/components/catalog-stack';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeLayout() {
  return <CatalogStack title="Home" />;
}
