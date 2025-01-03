const dbmanager = require('./dbmanager');
const archiver  = require('archiver');
const crypto    = require('crypto');
const cookie    = require('cookie');
const path      = require('path');
const fs        = require('fs');

const { v4: uuidv4 }  = require('uuid');
const { PassThrough } = require('stream');

const sessions = [];

const USER_DIR = path.join(__dirname, 'users');
const RCYB_DIR = path.join(__dirname, 'recyclebin');

function findUsernameBySessionId(req) {
    const cookies = cookie.parse(req.headers.cookie || '');
    if (cookies.sessionId) {
        for (let i = 0; i < sessions.length; i++) {
            if (sessions[i].id == cookies.sessionId)
                return sessions[i].user;
        }
    }
    return null;
}

function traversalSubPathSync(dir) {
    let subdirs = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
        if (entry.isDirectory()) {
            const fullPath = path.resolve(dir, entry.name);
            subdirs.push(fullPath);

            const nestedDirs = traversalSubPathSync(fullPath);
            subdirs = subdirs.concat(nestedDirs);
        }
    });

    return subdirs;
}

function matchSubPathByHash(dir, username, hash) {
    const dirs = traversalSubPathSync(dir);
    dirs.push(dir);

    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i].replace(path.join(USER_DIR, username), '.').replaceAll('\\', '/');
        const hsh = crypto.createHash('md5').update(dir).digest('hex');

        if (hsh === hash)
            return dir;
    }

    return null;
}

function getDirInfoControl(req, res, username) {
    const directory = decodeURIComponent(req.headers['x-directory-path']);
    const workpath  = directory.startsWith('RECYCLE_BIN') ? directory.replace('RECYCLE_BIN', RCYB_DIR) : directory.replace('.', path.join(USER_DIR, username));
    
    fs.readdir(workpath, { withFileTypes: true }, (err, entries) => {
        if (err) {
            res.end('[]');
            return;
        }

        const items = [];

        for (const entry of entries) {
            const type = entry.isDirectory() ? 'folder' : 'file';
            const fullPath = path.join(workpath, entry.name);
            const stat = fs.statSync(fullPath);

            items.push({'name':entry.name, 'type':type, 'size':stat.size, 'created': stat.birthtime.getTime(), 'modified': stat.mtime.getTime()});
        }

        res.end(JSON.stringify(items));
        return;
    });
}

function uploadControl(req, res, username) {
    const directory = req.headers['x-directory-path'];
    const uploadDir = directory.replace('.', path.join(USER_DIR, username));

    if (!fs.existsSync(USER_DIR))
        fs.mkdirSync(USER_DIR);

    if (!fs.existsSync(path.join(USER_DIR, username)))
        fs.mkdirSync(path.join(USER_DIR, username));

    const boundary  = Buffer.from(`--${req.headers['content-type'].split('boundary=')[1]}`);
    const buffers   = [];

    req.on('data', (chunk) => {
        buffers.push(chunk);
    });

    req.on('end', () => {
        const rawData = Buffer.concat(buffers);
        const doneflags = [];

        let parts = [];
        let start = 0;
        while ((start = rawData.indexOf(boundary, start)) !== -1) {
            const end = rawData.indexOf(boundary, start + boundary.length);
            if (end === -1) break;
            parts.push(rawData.slice(start + boundary.length + 2, end - 2));
            start = end;
        }

        parts.forEach((part) => {
            const headerEndIndex = part.indexOf('\r\n\r\n');
            if (headerEndIndex > -1) {
                const headers = part.slice(0, headerEndIndex).toString();
                const filenameMatch = headers.match(/filename="(.+?)"/);

                if (filenameMatch) {
                    const filename = filenameMatch[1].trim();
                    const fileBuffer = part.slice(headerEndIndex + 4);

                    fs.writeFile(path.join(uploadDir, filename), fileBuffer, (err) => {
                        if (err) {
                            doneflags.push(false);
                            return;
                        }

                        doneflags.push(true);
                    });
                }
            }
        });

        const waitTimer = setInterval(() => {
            if (doneflags.length == parts.length) {
                for (let i = 0; i < doneflags.length; i++) {
                    if (!doneflags[i]) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('UPLOAD_ERR');
                        clearInterval(waitTimer);
                        return;
                    }
                }
    
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('UPLOAD_OK');
                clearInterval(waitTimer);
                return;
            }
        }, 100);
    });
}

function downloadControl(req, res, username) {
    const directory = decodeURIComponent(req.headers['x-directory-path']);
    const filenames = decodeURIComponent(req.headers['x-files']);
    const pathdir   = directory.replace('.', path.join(USER_DIR, username));
    const files     = filenames.split(',');

    if (files.length == 0) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('DOWNLOAD_ERR');
        return;
    }

    if (files.length == 1) {
        // 다운 받을 파일이 하나면, 해당 파일만 다운로드 진행
        if (fs.existsSync(path.join(pathdir, files[0]))) {
            const stat          = fs.statSync(path.join(pathdir, files[0]));
            const archive       = archiver('zip', { zlib: { level: 9 } });
            
            if (stat.isDirectory()) {
                const memoryStream  = new PassThrough();
                const memoryChunks  = [];

                memoryStream.on('data', (chunk) => {
                    memoryChunks.push(chunk);
                });

                memoryStream.on('end', () => {
                    const buffer = Buffer.concat(memoryChunks);
                    res.writeHead(200, {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Expose-Headers': 'Content-Length',
                        'Content-Disposition': 'attachment; filename="' + encodeURIComponent(files[0] + '.zip') + '"',
                        'Content-Length': buffer.length,
                        'Content-Type': 'application/zip',
                        'X-Download-Filename': encodeURIComponent(files[0] + '.zip'),
                    });
                    res.end(buffer);
                });

                archive.pipe(memoryStream);
                archive.directory(path.join(pathdir, files[0]), false);
                archive.finalize();
            } else if (stat.isFile()) {
                const memoryStream  = new PassThrough();
                const memoryChunks  = [];

                memoryStream.on('data', (chunk) => {
                    memoryChunks.push(chunk);
                });

                memoryStream.on('end', () => {
                    const buffer = Buffer.concat(memoryChunks);
                    res.writeHead(200, {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Expose-Headers': 'Content-Length',
                        'Content-Disposition': 'attachment; filename="' + encodeURIComponent(files[0]) + '"',
                        'Content-Length': buffer.length,
                        'Content-Type': 'application/octet-stream',
                        'X-Download-Filename': encodeURIComponent(files[0]),
                    });
                    res.end(buffer);
                });

                fs.createReadStream(path.join(pathdir, files[0])).pipe(memoryStream);
            }
            return;
        }
    } else if (files.length > 1) {
        // 다운 받을 파일이 여러개면, 해당 파일들을 전부 ZIP 포맷으로 압축하여 다운로드 진행
        const archive       = archiver('zip', { zlib: { level: 9 } });
        const memoryStream  = new PassThrough();
        const memoryChunks  = [];

        memoryStream.on('data', (chunk) => {
            memoryChunks.push(chunk);
        });

        memoryStream.on('end', () => {
            const buffer = Buffer.concat(memoryChunks);
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': 'Content-Length',
                'Content-Disposition': 'attachment; filename="archive.zip"',
                'Content-Length': buffer.length,
                'Content-Type': 'application/zip',
                'X-Download-Filename': 'archive.zip',
            });
            res.end(buffer);
        });

        archive.pipe(memoryStream);

        for (let i = 0; i < files.length; i++) {
            const stat = fs.statSync(path.join(pathdir, files[i]));
            if (stat.isDirectory())
                archive.directory(path.join(pathdir, files[i]));
            else if (stat.isFile())
                archive.file(path.join(pathdir, files[i]), { name:files[i] });
        }
        
        archive.finalize();
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('DOWNLOAD_ERR');
}

function createFolderControl(req, res, username) {
    const directory = req.headers['x-directory-path'];
    const dirname   = req.headers['x-directory-name'];
    const pathdir   = directory.replace('.', path.join(USER_DIR, username));
    const fulldir   = path.join(pathdir, dirname);

    if (fs.existsSync(fulldir)) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('CREATE_ERR');
        return;
    }

    fs.mkdirSync(fulldir, { recursive: true });

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('CREATE_OK');
}

function recoveryBinControl(req, res, username) {
    const files     = decodeURIComponent(req.headers['x-files']);
    const filenames = files.split(',');
    
    for (let i = 0; i < filenames.length; i++) {
        if (filenames[i].indexOf('_HSH_') < 0)
            continue;

        const sidx = filenames[i].indexOf('_HSH_');
        const hash = filenames[i].substring(sidx + 5);
        const match = matchSubPathByHash(path.join(USER_DIR, username), username, hash);
        if (match) {
            const targetPath = match.replace('.', path.join(USER_DIR, username));
            fs.rename(path.join(RCYB_DIR, filenames[i]), path.join(targetPath, filenames[i].substring(0, sidx)), (err) => {
                if (err) {
                    return;
                }
            });
        }
    }

    res.writeHead(200, { 'Content-Type' : 'text/plain'});
    res.end('RECOVERY_OK');
}

function recycleBinControl(req, res, username) {
    const directory = decodeURIComponent(req.headers['x-directory-path']);
    const files     = decodeURIComponent(req.headers['x-files']);
    const hash      = crypto.createHash('md5').update(directory).digest('hex');

    const currentpath   = directory.replace('.', path.join(USER_DIR, username));
    const movepath      = path.join(__dirname, 'recyclebin');

    const filenames = files.split(',');
    const doneflags = [];
    for (let i = 0; i < filenames.length; i++) {
        fs.rename(path.join(currentpath, filenames[i]), path.join(movepath, filenames[i] + '_HSH_' + hash), (err) => {
            if (err) {
                doneflags.push(false);
                return;
            }

            doneflags.push(true);
        });
    }
    
    const waitTimer = setInterval(() => {
        if (doneflags.length == filenames.length) {
            for (let i = 0; i < doneflags.length; i++) {
                if (!doneflags[i]) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('MOVE_ERR');
                    clearInterval(waitTimer);
                    return;
                }
            }

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('MOVE_OK');
            clearInterval(waitTimer);
            return;
        }
    }, 100);
}

function flushBinControl(req, res) {
    const files     = decodeURIComponent(req.headers['x-files']);
    const binpath   = path.join(__dirname, 'recyclebin');

    const filenames = files.split(',');
    const doneflags = [];
    for (let i = 0; i < filenames.length; i++) {
        fs.rm(path.join(binpath, filenames[i]), { recursive: true, force: true }, (err) => {
            if (err) {
                doneflags.push(false);
                return;
            }

            doneflags.push(true);
        });
    }

    const waitTimer = setInterval(() => {
        if (doneflags.length == filenames.length) {
            for (let i = 0; i < doneflags.length; i++) {
                if (!doneflags[i]) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('FLUSH_ERR');
                    clearInterval(waitTimer);
                    return;
                }
            }

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('FLUSH_OK');
            clearInterval(waitTimer);
            return;
        }
    }, 100);
}

function logoutControl(req, res) {
    const cookies = cookie.parse(req.headers.cookie || '');
    if (cookies.sessionId) {
        res.setHeader(
            'Set-Cookie',
            cookie.serialize('sessionId', '', {
                httpOnly: true,
                expires: new Date(0),
            }
        ));
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LOGOUT_OK');
}

function loginControl(req, res) {
    const username = decodeURIComponent(req.headers['x-username']);
    const password = req.headers['x-password'];

    dbmanager.login(username, password, (state) => {
        if (state === 'LOGIN_OK') {
            const cookies   = cookie.parse(req.headers.cookie || '');
            const sessionId = uuidv4(); 
            sessions.push({user: username, id: sessionId});
            if (!cookies.sessionId) {
                res.setHeader(
                    'Set-Cookie',
                    cookie.serialize('sessionId', sessionId, {
                    httpOnly: true,
                    maxAge: 60 * 60,
                }));
            }
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(state);
    });
}

function registerControl(req, res) {
    const username = decodeURIComponent(req.headers['x-username']);
    const password = req.headers['x-password'];

    dbmanager.register(username, password, (state) => {
        // 회원가입 성공하면 해당 사용자 작업 공간 폴더 생성
        if (state === 'REGISTER_OK') {
            fs.mkdir(path.join(USER_DIR, username), (err) => {
                if (err) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('REGISTER_ERR');
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(state);
                return;
            });
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(state);
        return;
    });
}

module.exports = {
    loginControl,
    logoutControl,
    registerControl,
    flushBinControl,
    recycleBinControl,
    recoveryBinControl,
    createFolderControl,
    findUsernameBySessionId,
    getDirInfoControl,
    downloadControl,
    uploadControl,
};