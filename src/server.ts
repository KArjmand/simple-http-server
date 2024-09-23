import http, { type ServerResponse } from 'node:http';
import type {
	ErrorHandler,
	Method,
	Middleware,
	RequestHandler,
	Request,
} from './types';

export class Server {
	private routes: Map<
		string,
		{ handler: RequestHandler; path: string; method: string; pattern: RegExp }
	> = new Map();
	private routeToRegex: Map<string, RegExp> = new Map();
	private middlewares: Middleware[] = [];
	private errorHandlers: ErrorHandler[] = [];

	/**
	 * Applies middlewares to a request handler.
	 * @param handler The request handler to which middlewares will be applied.
	 * @returns A new request handler that applies the middlewares.
	 */
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
						if (err instanceof Error) this.handleError(err, req, res, next);
					}
				}
			};
			next();
		};
	}

	/**
	 * Handles errors that occur during request processing.
	 * @param err The error that occurred.
	 * @param req The request object.
	 * @param res The response object.
	 * @param next The next middleware function.
	 */
	private handleError(
		err: Error,
		req: Request,
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

	/**
	 * Registers a new route with its handler.
	 * @param path The path of the route.
	 * @param method The HTTP method for the route (GET, POST, etc.).
	 * @param handler The request handler for the route.
	 */
	private register(path: string, method: Method, handler: RequestHandler) {
		const key = `${method} ${path}`;
		const regexString = key.replace(/:\w+/g, '([^/]+)'); // Replace path variables with regex
		const pattern = new RegExp(`^${regexString}$`);
		this.routes.set(key, {
			method,
			path,
			pattern,
			handler: this.applyMiddlewares(handler),
		});
		this.routeToRegex.set(key, pattern);
	}

	/**
	 * Matches an incoming URL against the registered routes.
	 * @param url The URL to match.
	 * @param method The HTTP method of the request.
	 * @returns An object containing the matched route's handler and parameters, or null if no match is found.
	 */
	private matchRoute(url: string, method: string = 'GET') {
		const key = `${method} ${url}`;

		for (const [route, regex] of this.routeToRegex.entries()) {
			if (!regex) return null;
			const matchResult = regex.exec(key);

			if (matchResult) {
				const params: { [key: string]: string } = {};
				const keys = route.match(/:\w+/g) || []; // Get variable names from the route

				keys.forEach((key, index) => {
					params[key.substring(1)] = matchResult[index + 1]; // Extract the variable value
				});

				return { ...this.routes.get(route), params }; // Return the handler and params if matched
			}
		}

		return null; // Return null if no route matched
	}

	/**
	 * Prints all registered routes to the console.
	 */
	printRoutes() {
		for (const [, { method, path }] of this.routes.entries())
			console.log(`[${method}] ${path}`);
	}

	/**
	 * Registers middleware or error handler.
	 * @param middleware The middleware or error handler to register.
	 */
	use(middleware: Middleware | ErrorHandler) {
		if (middleware.length === 4) {
			this.errorHandlers.push(middleware as ErrorHandler);
		} else {
			this.middlewares.push(middleware as Middleware);
		}
	}

	/**
	 * Handles the request registration for a specific HTTP method.
	 * @param path The path of the route.
	 * @param method The HTTP method for the route (GET, POST, etc.).
	 * @param handler The request handler for the route.
	 */
	private handleRequest(path: string, method: Method, handler: RequestHandler) {
		const key = `${method} ${path}`;
		this.register(path, method, handler);
	}

	/**
	 * Registers a GET route with its handler.
	 * @param path The path of the route.
	 * @param handler The request handler for the route.
	 */
	get(path: string, handler: RequestHandler) {
		this.handleRequest(path, 'GET', handler);
	}

	/**
	 * Registers a POST route with its handler.
	 * @param path The path of the route.
	 * @param handler The request handler for the route.
	 */
	post(path: string, handler: RequestHandler) {
		this.handleRequest(path, 'POST', handler);
	}

	/**
	 * Registers a PUT route with its handler.
	 * @param path The path of the route.
	 * @param handler The request handler for the route.
	 */
	put(path: string, handler: RequestHandler) {
		this.handleRequest(path, 'PUT', handler);
	}

	/**
	 * Starts the server and listens on the specified port.
	 * @param port The port on which the server will listen.
	 */
	listen(port: number) {
		// Print routes
		this.printRoutes();
		http
			.createServer((req, res) => {
				const { pathname, searchParams } = new URL(
					`http://${process.env.HOST ?? 'localhost'}${req.url}`,
				);
				const matched = this.matchRoute(pathname, req.method);

				// Convert searchParams to an object using reduce
				const query = Array.from(searchParams.entries()).reduce(
					(acc, [key, value]) => {
						acc[key] = value; // Assign each key-value pair to the accumulator object
						return acc; // Return the accumulator for the next iteration
					},
					{} as { [key: string]: string },
				);

				if (matched?.handler) {
					const { params } = matched;
					matched.handler.call(
						null,
						Object.assign(req, { params, query }),
						res,
					);
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
