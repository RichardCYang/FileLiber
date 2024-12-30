const cookie    = require('cookie');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');

// 각 RESTful 요청에 대한 컨트롤러 불러오기
const controllers = require('./controllers');
const dbmanager   = require('./dbmanager');

// 메인 서버 설정
const PORT = 3000;
const HOST = '127.0.0.1';

dbmanager.initTables();

const server = http.createServer((req, res) => {
    const { url, method } = req;
    const options = {};

    if (method !== 'GET' && method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('405 - Method Not Allowed');
    }

    options.resourcePath = path.join(path.join(__dirname, 'client'), url);

    if (url === '/') {
        const cookies = cookie.parse(req.headers.cookie || '');
        if (!cookies.sessionId)
            options.resourcePath = path.join(path.join(__dirname, 'client'), 'login.html');
        else
            options.resourcePath = path.join(path.join(__dirname, 'client'), 'index.html');
    }

    switch (url) {
        case '/login.do':
            controllers.loginControl(req, res);
            return;

        case '/logout.do':
            controllers.logoutControl(req, res);
            return;

        case '/register.do':
            controllers.registerControl(req, res);
            return;

        case '/flushbin':
            controllers.flushBinControl(req, res);
            return;

        case '/recyclebin':
            controllers.recycleBinControl(req, res);
            return;

        case '/createfolder':
            controllers.createFolderControl(req, res);
            return;

        case '/download':
            controllers.downloadControl(req, res);
            return;

        case '/upload':
            controllers.uploadControl(req, res);
            return;

        case '/getdirinfo':
            controllers.getDirInfoControl(req, res);
            return;
    }

    fs.stat(options.resourcePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end('<h1>404 - NOT FOUND</h1>');
        }

        fs.readFile(options.resourcePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('500 - Internal Server Error');
            }

            const ext = path.extname(options.resourcePath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.json': 'application/json'
            };

            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});