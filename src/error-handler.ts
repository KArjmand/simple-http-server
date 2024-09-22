import { ErrorHandler } from './types';

// Error handler middleware
export const errorHandler: ErrorHandler = (err, req, res, next) => {
	console.error(err);
	res.end(err.message);
	return;
};
