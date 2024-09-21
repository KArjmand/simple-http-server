import http, { IncomingMessage, ServerResponse } from 'http';
import {
	ErrorHandler,
	Middleware,
	RequestHandler,
	RequestWithBody,
} from './types';

export class Server {
	private routes: { [key: string]: RequestHandler } = {};
	private middlewares: Middleware[] = [];
	private errorHandlers: ErrorHandler[] = [];

	private applyMiddlewares(handler: RequestHandler): RequestHandler {
		return (req, res) => {
			let index = 0;
			const next = (err?: Error) => {
				if (err) {
					this.handleError(err, req, res, next);
				} else if (index < this.middlewares.length) {
					this.middlewares[index++](req, res, next);
				} else {
					try {
						handler(req, res);
					} catch (err) {
						this.handleError(err, req, res, next);
					}
				}
			};
			next();
		};
	}
	private handleError(
		err: any,
		req: RequestWithBody,
		res: ServerResponse,
		next: (err?: Error) => void,
	) {
		for (const errorHandler of this.errorHandlers) {
			errorHandler(err, req, res, next);
		}
		if (!res.headersSent) {
			res.statusCode = 500;
			res.end('Internal Server Error');
		}
	}

	use(middleware: Middleware | ErrorHandler) {
		if (middleware.length === 4) {
			this.errorHandlers.push(middleware as ErrorHandler);
		} else {
			this.middlewares.push(middleware as Middleware);
		}
	}

	get(path: string, handler: RequestHandler) {
		this.routes[`GET ${path}`] = this.applyMiddlewares(handler);
	}

	post(path: string, handler: RequestHandler) {
		this.routes[`POST ${path}`] = this.applyMiddlewares(handler);
	}

	listen(port: number) {
		http
			.createServer((req, res) => {
				const { pathname, searchParams } = new URL(
					`http://${process.env.HOST ?? 'localhost'}${req.url}`,
				);
				console.log({ pathname, searchParams });
				const key = `${req.method} ${pathname}`;

				if (this.routes[key]) {
					this.routes[key](req, res);
				} else {
					res.statusCode = 404;
					res.end('Not found');
				}
			})
			.listen(port, () => {
				console.log(`Server running on port ${port}`);
			});
	}
}
