const http = require('http');

http
  .createServer((req, res) => {
    const bodyBuffer = [];
    req
      .on('data', (chunk) => {
        bodyBuffer.push(chunk);
      })
      .on('end', () => {
        const body = Buffer.concat(bodyBuffer).toString();
        console.log(`${req.url} <- ${req.method} ${body}`);
      });

    res.writeHead(201);
    res.end();
  })
  .listen(80);
