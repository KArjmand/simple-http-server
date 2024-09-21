import { Middleware } from './types';

export const logger: Middleware = (req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
};

export const bodyParser: Middleware = async (req, res, next) => {
	return new Promise((resolve, reject) => {
		let body: string = '';
		req.on('data', (chunk) => {
			body += chunk.toString();
		});
		req.on('end', () => {
			try {
				Object.assign(req, { body: body ? JSON.parse(body) : {} });
				resolve({});
			} catch (err) {
				res.statusCode = 400;
				if (err instanceof Error) {
					reject(err);
				}
			}
		});
	})
		.then(() => {
			next();
		})
		.catch((err) => {
			next(err);
		});
};
