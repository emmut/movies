# Synthetic Parquet fixtures

Generated with PyArrow 26.0.1, Zstandard compression and two rows per row group.
The fields follow Popcorn Time's published schema; all IDs and tokens are fake.

- `media.parquet`: movie and TV records sharing TMDB ID 123, plus an unmapped movie.
- `providers.parquet`: Netflix, SF Anytime, and an excluded child provider in SE.
- `links.parquet`: a movie offer with a DATE start, a show offer, and an excluded
  season offer. Includes nullable INT16 scope columns and a LIST of price types.

The tests read these with the real Parquet decoder and compressor, so DATE/LIST
handling and row-group boundaries are exercised independently of JSON mocks.
