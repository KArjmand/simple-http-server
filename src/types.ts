import { IncomingMessage, ServerResponse } from 'http';

export interface RequestWithBody extends IncomingMessage {
	body?: Record<string, unknown>;
}

export type RequestHandler = (
	req: RequestWithBody,
	res: ServerResponse,
) => void;

export type Middleware = (
	req: RequestWithBody,
	res: ServerResponse,
	next: (err?: Error) => void,
) => void;

export type ErrorHandler = (
	err: Error,
	req: RequestWithBody,
	res: ServerResponse,
	next: (err?: Error) => void,
) => void;
