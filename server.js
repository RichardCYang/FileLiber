const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database('./database.sqlite');

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'fileliber-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) next();
    else res.status(401).json({ error: '로그인이 필요합니다.' });
};

const UPLOAD_BASE_DIR = path.join(__dirname, 'uploads');

// 보안: 사용자 루트 폴더 내의 경로인지 확인
const getSafePath = (username, relativePath = '') => {
    // 상대 경로의 백슬래시를 슬래시로 통일
    const normalizedRelative = relativePath.replace(/\\/g, '/');
    const userRoot = path.join(UPLOAD_BASE_DIR, username);
    if (!fs.existsSync(userRoot)) fs.mkdirSync(userRoot, { recursive: true });
    
    const targetPath = path.join(userRoot, normalizedRelative);
    const resolvedPath = path.resolve(targetPath);
    const resolvedRoot = path.resolve(userRoot);
    
    if (!resolvedPath.startsWith(resolvedRoot)) {
        throw new Error('Invalid path access');
    }
    return resolvedPath;
};

// --- API ---

app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err) => {
        if (err) return res.status(400).json({ error: 'Duplicate username' });
        res.json({ message: 'Success' });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        req.session.user = { id: user.id, username: user.username };
        res.json({ user: { username: user.username } });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', (req, res) => {
    if (req.session.user) res.json({ user: req.session.user });
    else res.status(401).json({ error: 'Unauthorized' });
});

// 파일 목록 (경로 지원)
app.get('/api/files', isAuthenticated, (req, res) => {
    try {
        const targetDir = getSafePath(req.session.user.username, req.query.path || '');
        fs.readdir(targetDir, { withFileTypes: true }, (err, entries) => {
            if (err) return res.status(500).json({ error: 'Read error' });
            const list = entries.map(entry => {
                const stats = fs.statSync(path.join(targetDir, entry.name));
                return {
                    name: entry.name,
                    size: entry.isDirectory() ? 0 : stats.size,
                    createdAt: stats.birthtime,
                    isDirectory: entry.isDirectory()
                };
            });
            res.json(list);
        });
    } catch (e) { res.status(403).json({ error: 'Access denied' }); }
});

// 폴더 생성 (경로 지원)
app.post('/api/mkdir', isAuthenticated, (req, res) => {
    try {
        const { folderName, currentPath } = req.body;
        const targetDir = getSafePath(req.session.user.username, path.join(currentPath || '', folderName));
        if (fs.existsSync(targetDir)) return res.status(400).json({ error: 'Already exists' });
        fs.mkdirSync(targetDir);
        res.json({ message: 'Created' });
    } catch (e) { res.status(403).json({ error: 'Access denied' }); }
});

// 업로드 (경로 지원)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const currentPath = req.query.path || '';
            const targetDir = getSafePath(req.session.user.username, currentPath);
            cb(null, targetDir);
        } catch (e) { cb(e); }
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', isAuthenticated, upload.single('file'), (req, res) => {
    res.json({ message: 'Uploaded' });
});

// 다운로드 & 삭제 (경로 지원)
app.get('/api/download', isAuthenticated, (req, res) => {
    try {
        const targetFile = getSafePath(req.session.user.username, req.query.path);
        if (fs.existsSync(targetFile)) res.download(targetFile);
        else res.status(404).send('File not found');
    } catch (e) { res.status(403).send('Access denied'); }
});

app.delete('/api/delete', isAuthenticated, (req, res) => {
    try {
        const targetFile = getSafePath(req.session.user.username, req.body.path);
        if (fs.existsSync(targetFile)) {
            const stats = fs.statSync(targetFile);
            if (stats.isDirectory()) fs.rmSync(targetFile, { recursive: true });
            else fs.unlinkSync(targetFile);
            res.json({ message: 'Deleted' });
        } else res.status(404).json({ error: 'Not found' });
    } catch (e) { res.status(403).json({ error: 'Access denied' }); }
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
