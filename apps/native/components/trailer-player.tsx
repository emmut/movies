import { trailerEmbedUrl } from '@movies/api/catalog-support';
import { applicationId } from 'expo-application';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { WebView as NativeWebView } from 'react-native-webview';
import { withUniwind } from 'uniwind';

import { ExternalLink } from './external-link';

const WebView = withUniwind(NativeWebView);
export function TrailerPlayer({ videoKey, title }: { videoKey: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !applicationId) {
    return (
      <View className="flex-1 items-start justify-center gap-3 p-4">
        <Text className="text-foreground">Trailer couldn’t load.</Text>
        <ExternalLink href={`https://www.youtube.com/watch?v=${videoKey}`}>
          Watch on YouTube
        </ExternalLink>
      </View>
    );
  }
  // YouTube identifies installed WebView clients by their actual app ID.
  const referer = `https://${applicationId.toLowerCase()}`;
  return (
    <WebView
      source={{ uri: trailerEmbedUrl(videoKey), headers: { Referer: referer } }}
      accessibilityLabel={`${title} trailer player`}
      className="flex-1 bg-black"
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      onError={() => setFailed(true)}
      onHttpError={() => setFailed(true)}
    />
  );
}
