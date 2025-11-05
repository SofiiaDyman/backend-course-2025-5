const { Command } = require('commander');
const fs = require('fs');
const http = require('http');
const path = require('path');

const program = new Command();

// Параметри командного рядка 
program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <path>', 'Cache directory');

program.parse(process.argv);
const options = program.opts();

const host = options.host;
const port = parseInt(options.port, 10);
const cacheDir = path.resolve(options.cache);

// Створення кеш-директорію, якщо її немає
fs.promises.mkdir(cacheDir, { recursive: true })
  .then(() => console.log(`Cache directory ready: ${cacheDir}`))
  .catch(err => {
    console.error('Error creating cache directory:', err);
    process.exit(1);
  });

// HTTP сервер
const server = http.createServer(async (req, res) => {
  const method = req.method;
  const code = req.url.slice(1); // "/200" → "200"
  const filePath = path.join(cacheDir, `${code}.jpg`);

  try {
    // GET
    if (method === 'GET') {
      try {
        const data = await fs.promises.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
      } catch {
        // Якщо файл не знайдено
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }

    // PUT
    } else if (method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk); // збираємо дані з тіла запиту
      const body = Buffer.concat(chunks);

      await fs.promises.writeFile(filePath, body); // запис у кеш
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end('Created');

    // DELETE
    } else if (method === 'DELETE') {
      try {
        await fs.promises.unlink(filePath); // видаляємо файл з кешу
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Deleted');
      } catch {
        // Якщо файл не знайдено
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }

    // Інші методи
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  } catch (error) {
    // Обробка помилок сервера
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

// Запуск сервера
server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
