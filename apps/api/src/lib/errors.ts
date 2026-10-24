import { HTTPException } from 'hono/http-exception';
export class ProvisioningConflict extends HTTPException {
  constructor(public readonly code: 'INSTITUTION_SLUG_TAKEN' | 'ADMIN_EMAIL_TAKEN') {
    super(409);
  }
}
export function forbidden(): never {
  throw new HTTPException(403, { message: 'Access denied' });
}
export function invalidRequest(): never {
  throw new HTTPException(400, { message: 'Invalid request' });
}
export function unauthorized(): never {
  throw new HTTPException(401, { message: 'Authentication required' });
}
export function notFound(): never {
  throw new HTTPException(404, { message: 'Resource not found' });
}
export function conflict(): never {
  throw new HTTPException(409, { message: 'Membership change conflicts with access policy' });
}
