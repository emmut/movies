import { asyncBufferFromFile, parquetMetadataAsync, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

/** Decode one row group at a time; never expand every column of the catalogue. */
export async function* readParquetBatches(path: string, columns: string[]) {
  const file = await asyncBufferFromFile(path);
  const metadata = await parquetMetadataAsync(file);
  const fields = new Set(metadata.schema.map((column) => column.name));
  for (const column of columns) {
    if (!fields.has(column)) throw new Error(`Popcorn Time Parquet is missing column ${column}`);
  }
  if (Number(metadata.num_rows) === 0) throw new Error('Popcorn Time Parquet file is empty');
  let rowStart = 0;
  for (const group of metadata.row_groups) {
    const rowEnd = rowStart + Number(group.num_rows);
    yield await parquetReadObjects({ file, metadata, columns, rowStart, rowEnd, compressors });
    rowStart = rowEnd;
  }
}

export async function readParquetRows(path: string, columns: string[]) {
  const rows: unknown[] = [];
  for await (const batch of readParquetBatches(path, columns)) {
    for (const row of batch) rows.push(row);
  }
  return rows;
}
