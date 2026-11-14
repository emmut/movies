import { BottomNavigation } from '@native/components/bottom-navigation';
import { ExternalLink } from '@native/components/external-link';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
const sources = [
  {
    name: 'The Movie Database',
    description:
      'This product uses the TMDB API but is not endorsed or certified by TMDB. Movie and TV metadata and artwork are provided by TMDB.',
    links: [{ label: 'TMDB', href: 'https://www.themoviedb.org' }],
  },
  {
    name: 'JustWatch',
    description:
      'Streaming availability is provided by JustWatch via TMDB. Availability varies by country and may change.',
    links: [{ label: 'JustWatch', href: 'https://www.justwatch.com' }],
  },
  {
    name: 'Wikidata',
    description:
      'Some provider title identifiers come from Wikidata, whose structured data is available under CC0. These identifiers help us link directly to titles; regional availability comes from JustWatch via TMDB.',
    links: [
      { label: 'Wikidata', href: 'https://www.wikidata.org' },
      { label: 'CC0 license', href: 'https://www.wikidata.org/wiki/Wikidata:Licensing' },
    ],
  },
  {
    name: 'IMDb',
    description: 'Ratings information courtesy of IMDb (imdb.com) — used with permission.',
    links: [{ label: 'IMDb', href: 'https://developer.imdb.com/non-commercial-datasets/' }],
  },
];

export function CreditsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-8 px-4 pt-6 pb-12"
      >
        {sources.map((source) => (
          <View key={source.name} className="gap-3">
            <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
              {source.name}
            </Text>
            <Text className="text-base leading-relaxed text-muted">{source.description}</Text>
            <View className="flex-row flex-wrap gap-2">
              {source.links.map((link) => (
                <ExternalLink key={link.href} href={link.href}>
                  {link.label}
                </ExternalLink>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}
