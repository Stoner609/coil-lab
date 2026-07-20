import { describe, expect, it } from 'vitest';
import { finMindProxyOptions } from './twseProxy';

describe('FinMind development proxy', () => {
  it('proxies FinMind interval requests through the development server', () => {
    expect(finMindProxyOptions).toMatchObject({
      target: 'https://api.finmindtrade.com',
      changeOrigin: true,
    });
  });
});
