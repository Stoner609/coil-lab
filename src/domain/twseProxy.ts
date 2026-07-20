export const finMindProxyOptions = {
  target: 'https://api.finmindtrade.com',
  changeOrigin: true,
  rewrite: (path: string) => path.replace(/^\/finmind/, ''),
};
