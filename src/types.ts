import { IncomingMessage, ServerResponse } from 'http';

export interface Request extends IncomingMessage {
	body?: Record<string, unknown>;
	params?: Record<string, string>;
	query: Record<string, string>;
}
export type Method = 'GET' | 'PUT' | 'POST';
export type RequestHandler = (req: Request, res: ServerResponse) => void;

export type Middleware = (
	req: Request,
	res: ServerResponse,
	next: (err?: Error) => void,
) => void;

export type ErrorHandler = (
	err: Error,
	req: Request,
	res: ServerResponse,
	next: (err?: Error) => void,
) => void;
