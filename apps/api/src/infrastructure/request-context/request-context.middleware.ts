import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { RequestContextStore } from '../../common/types/request-context.types';
import { requestContextStorage } from './request-context.storage';

const REQUEST_ID_HEADER = 'x-request-id';

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? req.ip ?? '';
  }
  return req.ip ?? '';
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerId = req.headers[REQUEST_ID_HEADER];
  const requestId = typeof headerId === 'string' && headerId.length > 0 ? headerId : uuidv4();
  res.setHeader(REQUEST_ID_HEADER, requestId);

  const store: RequestContextStore = {
    requestId,
    ip: clientIp(req),
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '',
  };

  requestContextStorage.run(store, () => {
    next();
  });
}
