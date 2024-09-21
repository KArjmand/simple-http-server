import { errorHandler } from './error-handler';
import { bodyParser, logger } from './middlewares';
import { Server } from './server';

const app = new Server();

app.use(logger);
app.use(bodyParser);
app.use(errorHandler);

app.get('/', (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Hello, World!');
});

app.get('/time', (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end(new Date().toJSON());
});

app.post('/echo', (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(req.body));
});

app.post('/users', (req, res) => {
	// Handle POST request to /users
	res.statusCode = 201;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ id: 1, name: 'John Doe' }));
});

app.listen(3000);
