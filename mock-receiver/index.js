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
        console.log(
          `${req.url} <- ${req.method} (${req.headers.authorization}) ${body}`
        );
      });

    res.writeHead(201, {
      'www-authenticate': 'Basic realm="Protokolibri device"',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'access-control-allow-headers': 'Authorization, Content-Type, Origin',
      'access-control-allow-credentials': true,
      'access-control-max-age': 86400,
    });
    res.end();
  })
  .listen(80);
