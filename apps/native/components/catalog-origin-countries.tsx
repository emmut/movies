import type { CatalogDetail } from '@movies/api/catalog';
import {
  getCountryFlag,
  getCountryName,
  sanitizeOriginCountryCodes,
} from '@movies/config/countries';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function CatalogOriginCountries({ item, region }: { item: CatalogDetail; region: string }) {
  const navigationPress = useScrollNavigation();
  const countries = sanitizeOriginCountryCodes(item.originCountries);
  if (countries.length === 0) {
    return null;
  }
  const media = item.type === 'movie' ? 'movies' : 'TV shows';
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        {countries.length === 1 ? 'Country of Origin' : 'Countries of Origin'}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {countries.map((code) => (
          <Link
            key={code}
            href={{
              pathname: '/discover',
              params: { with_origin_country: code, mediaType: item.type, watch_region: region },
            }}
            asChild
          >
            <Pressable
              {...navigationPress}
              accessibilityRole="link"
              accessibilityLabel={`Discover ${media} from ${getCountryName(code)}`}
              className="bg-default min-h-11 flex-row items-center gap-2 rounded-full border border-border px-3"
            >
              <Text accessible={false}>{getCountryFlag(code)}</Text>
              <Text className="text-sm text-foreground">{getCountryName(code)}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
