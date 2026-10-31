import { createServer, type Server } from 'node:http';
import { randomBytes } from 'node:crypto';
export async function startFixtureServer(
  fetch: (request: Request) => Promise<Response> | Response,
  port: number,
): Promise<Server> {
  // A synthetic proxy identity keeps separate test runs out of each other's
  // limiter bucket. Preserve limits within a run and overwrite browser headers.
  const clientIp = `2001:db8:${randomBytes(2).toString('hex')}:${randomBytes(2).toString('hex')}::1`;
  const server = createServer((request, response) => {
    void (async () => {
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers))
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      headers.set('x-eduos-client-ip', clientIp);
      const chunks: Buffer[] = [];
      for await (const chunk of request)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      const body = Buffer.concat(chunks);
      const result = await fetch(
        new Request(`http://localhost:${port}${request.url ?? '/'}`, {
          method: request.method ?? 'GET',
          headers,
          ...(body.length ? { body } : {}),
        }),
      );
      response.statusCode = result.status;
      result.headers.forEach((value, key) => {
        if (key !== 'set-cookie') response.setHeader(key, value);
      });
      const cookies = result.headers.getSetCookie();
      if (cookies.length) response.setHeader('set-cookie', cookies);
      response.end(Buffer.from(await result.arrayBuffer()));
    })().catch(() => {
      response.statusCode = 500;
      response.end();
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}
