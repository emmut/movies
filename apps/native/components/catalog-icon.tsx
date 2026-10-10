import NativeSvg, { Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';

const Svg = withUniwind(NativeSvg);
// Lucide geometry (ISC): https://lucide.dev/license.
const calendar = [
  'M8 2v4',
  'M16 2v4',
  'M3 10h18',
  'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
];
const tv = [
  'm17 2-5 5-5-5',
  'M4 7h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2',
];
const icons: Record<string, string[]> = {
  'TMDB Rating': ['m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.9Z'],
  Runtime: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M12 6v6l4 2'],
  Seasons: tv,
  Streaming: tv,
  Free: [
    'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z',
    'm9 12 2 2 4-4',
  ],
  Rent: ['M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z'],
  Buy: [
    'm2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18',
    'M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25',
    'M20 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
    'M10 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  ],
  Released: calendar,
  'First Aired': calendar,
  Popularity: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
};

export function CatalogIcon({ label, className }: { label: string; className: string }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      accessible={false}
    >
      {icons[label]?.map((path) => (
        <Path key={path} d={path} />
      ))}
    </Svg>
  );
}
