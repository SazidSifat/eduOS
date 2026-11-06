# School UI fonts

The school admin self-hosts Noto Sans Bengali for Bengali glyphs and Plus Jakarta
Sans for Latin text. Both use variable weights from 400 to 700, including real
medium and semibold weights for labels and table headers. Plus Jakarta Sans also
includes an italic face. Body and control text remains 16px with generous line
height for Bengali vowel marks; headings remain 28px.

The WOFF2 files come from Google Fonts' CSS API and retain the original font
names. Noto Sans Bengali uses its Bengali subset; Plus Jakarta Sans uses its
Latin subset, including Western numerals and common punctuation. The CSS limits
Noto to its script coverage so English consistently uses Plus Jakarta Sans,
including on mixed-language pages.

Upstream sources and licenses:

- [Noto Sans Bengali](https://github.com/google/fonts/tree/main/ofl/notosansbengali),
  licensed under SIL OFL 1.1; see `noto-sans-bengali-OFL.txt`.
- [Plus Jakarta Sans](https://github.com/google/fonts/tree/main/ofl/plusjakartasans),
  licensed under SIL OFL 1.1; see `plus-jakarta-sans-OFL.txt`.

Fonts are served with the application's assets; browsers do not contact Google
Fonts. The platform console retains its separate typography.
