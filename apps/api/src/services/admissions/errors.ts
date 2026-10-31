import { HTTPException } from 'hono/http-exception';
export class AdmissionError extends HTTPException {
  constructor(
    public readonly code: string,
    message: string,
    status: 400 | 409 = 400,
  ) {
    super(status, { message });
  }
}
export function admissionConflict(): never {
  throw new AdmissionError(
    'ADMISSION_CONFLICT',
    'This record changed. Refresh it before trying again.',
    409,
  );
}
