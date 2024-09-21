# Simple HTTP Server

A simple HTTP server implementation using TypeScript.

## Features

- Routing for GET and POST requests
- Middleware support
- Error handling
- Promise-based body parsing


## Usage

1. Install dependencies:

```bash
npm install 
```

2. Run the server:

```bash
npm run start 
```

The server will start listening on `http://localhost:3000`.

3. Use the server:

```typescript
import App from './App';

const app = new App();

app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!');
});

app.post('/users', (req, res) => {
  // Handle POST request to /users
  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ id: 1, name: 'John Doe' }));
});

app.listen(3000);
```