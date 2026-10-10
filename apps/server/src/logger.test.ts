import { Writable } from 'node:stream';

import { createApp } from '@server/app';
import { createRequestLogger } from '@server/logger';
import { pino, type Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';

type LogLine = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
};

function setup(level: string) {
  const lines: LogLine[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(JSON.parse(String(chunk)));
      callback();
    },
  });
  const logger: Logger = pino({ level }, destination);
  const services = {
    person: { details: vi.fn(), credits: vi.fn() },
    search: { list: vi.fn() },
    discovery: { list: vi.fn(), options: vi.fn() },
    home: { list: vi.fn().mockResolvedValue([]), trending: vi.fn() },
    catalog: { details: vi.fn(), trailer: vi.fn(), providers: vi.fn(), related: vi.fn() },
  };
  const app = createApp(services, undefined, [createRequestLogger(logger)]);
  return { app, lines };
}

describe('request logger', () => {
  it('logs method, path, status and duration for each request', async () => {
    const { app, lines } = setup('info');
    await app.request('/health');
    expect(lines).toHaveLength(1);
    const [line] = lines;
    expect(line.method).toBe('GET');
    expect(line.path).toBe('/health');
    expect(line.status).toBe(200);
    expect(line.durationMs).toBeTypeOf('number');
  });
  it('stays silent when the level suppresses info', async () => {
    const { app, lines } = setup('silent');
    await app.request('/health');
    expect(lines).toHaveLength(0);
  });
});
