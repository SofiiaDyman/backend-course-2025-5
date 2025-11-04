const { Command } = require('commander');
const fs = require('fs');
const http = require('http');
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <path>', 'Cache directory');

program.parse(process.argv);

const options = program.opts();
const host = options.host;
const port = parseInt(options.port);
const cacheDir = path.resolve(options.cache);

// Створення кеш-директорії, якщо її нема
fs.promises.mkdir(cacheDir, { recursive: true })
  .then(() => console.log(`Cache directory ready: ${cacheDir}`))
  .catch(err => console.error('Error creating cache directory:', err));

//Створення простого HTTP-сервера
  const server = http.createServer((req, res) => {
    res.end('Server works!');
});

server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
