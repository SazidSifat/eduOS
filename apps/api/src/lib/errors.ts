import { HTTPException } from 'hono/http-exception';
export function forbidden(): never {
  throw new HTTPException(403, { message: 'Access denied' });
}
export function unauthorized(): never {
  throw new HTTPException(401, { message: 'Authentication required' });
}
