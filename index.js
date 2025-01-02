const cookie    = require('cookie');
const utils     = require('./utils');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');

// 각 RESTful 요청에 대한 컨트롤러 불러오기
const controllers = require('./controllers');
const dbmanager   = require('./dbmanager');

// 메인 서버 설정
const SERVER_CONFIG = {};
const MYSQL_CONFIG  = {};

// 초기 사용자 정보 폴더 및 휴지통 폴더 확인 -> 없으면 기본 생성
if (!fs.existsSync(path.join(__dirname, 'users')))
    fs.mkdirSync(path.join(__dirname, 'users'));

if (!fs.existsSync(path.join(__dirname, 'recyclebin')))
    fs.mkdirSync(path.join(__dirname, 'recyclebin'));

// 초기 .env 파일 확인 -> 없으면 기본 생성
if (!fs.existsSync(path.join(__dirname, '.env'))) {
    const defaultCtx = [];
    defaultCtx.push('MYSQL_HOST=\n');
    defaultCtx.push('MYSQL_USER=\n');
    defaultCtx.push('MYSQL_PASSWORD=\n');
    defaultCtx.push('MYSQL_DATABASE=\n');
    defaultCtx.push('SERVER_PORT=\n');
    defaultCtx.push('SERVER_HOST=');
    try {
        fs.writeFileSync(path.join(__dirname, '.env'), defaultCtx.join(''), { encoding: 'utf8' });
        utils.printLog('INFO', 'The .env file has been successfully created.');
        utils.printLog('INFO', 'Please configure the file and run the program again.');
        process.exit(0);
    } catch (error) {
        utils.printLog('ERROR', error);
        process.exit(0);
    }
} else {
    try {
        const envFileContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
        const envConfig = {};

        envFileContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, value] = trimmedLine.split('=');
                if (key)
                    envConfig[key.trim()] = value ? value.trim() : '';
            }
        });

        MYSQL_CONFIG.HOST       = envConfig['MYSQL_HOST'];
        MYSQL_CONFIG.USER       = envConfig['MYSQL_USER'];
        MYSQL_CONFIG.PASSWORD   = envConfig['MYSQL_PASSWORD'];
        MYSQL_CONFIG.DATABASE   = envConfig['MYSQL_DATABASE'];
        SERVER_CONFIG.HOST      = envConfig['SERVER_HOST'];
        SERVER_CONFIG.PORT      = parseInt(envConfig['SERVER_PORT']);

        if (!MYSQL_CONFIG.HOST || MYSQL_CONFIG.HOST === '') {
            utils.printLog('ERROR', 'The `MYSQL_HOST` field is empty.');
            process.exit(0);
        }

        if (!MYSQL_CONFIG.USER || MYSQL_CONFIG.USER === '') {
            utils.printLog('ERROR', 'The `MYSQL_USER` field is empty.');
            process.exit(0);
        }

        if (!MYSQL_CONFIG.PASSWORD || MYSQL_CONFIG.PASSWORD === '') {
            utils.printLog('ERROR', 'The `MYSQL_PASSWORD` field is empty.');
            process.exit(0);
        }

        if (!MYSQL_CONFIG.DATABASE || MYSQL_CONFIG.DATABASE === '') {
            utils.printLog('ERROR', 'The `MYSQL_DATABASE` field is empty.');
            process.exit(0);
        }

        if (!SERVER_CONFIG.HOST || SERVER_CONFIG.HOST === '') {
            utils.printLog('ERROR', 'The `SERVER_HOST` field is empty.');
            process.exit(0);
        }

        if (isNaN(SERVER_CONFIG.PORT)) {
            utils.printLog('ERROR', 'The `SERVER_PORT` field is empty.');
            process.exit(0);
        }
    } catch (error) {
        utils.printLog('ERROR', error);
    }
}

dbmanager.connect(MYSQL_CONFIG);
dbmanager.initTables();

const server = http.createServer((req, res) => {
    const { url, method } = req;
    const options = {};

    if (method !== 'GET' && method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('405 - Method Not Allowed');
    }

    options.resourcePath = path.join(path.join(__dirname, 'client'), url);
    options.username = controllers.findUsernameBySessionId(req);

    if (url === '/') {
        const cookies = cookie.parse(req.headers.cookie || '');
        if (!cookies.sessionId)
            options.resourcePath = path.join(path.join(__dirname, 'client'), 'login.html');
        else
            options.resourcePath = path.join(path.join(__dirname, 'client'), 'index.html');
    }

    const controller_group = [];
    controller_group.push({url: '/login.do', callback: controllers.loginControl});
    controller_group.push({url: '/logout.do', callback: controllers.logoutControl});
    controller_group.push({url: '/register.do', callback: controllers.registerControl});
    controller_group.push({url: '/flushbin', callback: controllers.flushBinControl, sessioncheck: true});
    controller_group.push({url: '/recyclebin', callback: controllers.recycleBinControl, sessioncheck: true, passusername: true});
    controller_group.push({url: '/recoverybin', callback: controllers.recoveryBinControl, sessioncheck: true, passusername: true});
    controller_group.push({url: '/createfolder', callback: controllers.createFolderControl, sessioncheck: true, passusername: true});
    controller_group.push({url: '/download', callback: controllers.downloadControl, sessioncheck: true, passusername: true});
    controller_group.push({url: '/upload', callback: controllers.uploadControl, sessioncheck: true, passusername: true});
    controller_group.push({url: '/getdirinfo', callback: controllers.getDirInfoControl, sessioncheck: true, passusername: true});

    for (let i = 0; i < controller_group.length; i++) {
        const controller_info = controller_group[i];
        if (controller_info.url === url) {
            if (controller_info.callback) {
                if (controller_info.sessioncheck && !options.username) return;
                controller_info.callback(req, res, options.username);
            }
            return;
        }
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

server.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST, () => {
    console.log(`Server running on http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`);
});