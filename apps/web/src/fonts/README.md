Noto Color Emoji is bundled under the SIL Open Font License in `OFL.txt`.

Source: https://github.com/google/fonts/tree/main/ofl/notocoloremoji

`NotoColorEmoji.woff2` is the upstream `NotoColorEmoji-Regular.ttf` (weight
400), downloaded on 2026-10-31. The redundant SVG table was removed, retaining
COLRv1 color glyphs, then compressed with FontTools' WOFF2 encoder.
It provides color emoji in browsers that support COLRv1 color fonts, even
without a native emoji font. It is served by `next/font/local` and loaded on
demand rather than preloaded on every page.

Inter stays the primary font. The emoji fallback is also included in Tailwind's
`font-sans` stack so controls that explicitly select sans-serif retain it.
