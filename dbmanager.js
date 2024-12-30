const utils = require('./utils');
const mysql = require('mysql');

let dbconn = null;

function connect(dbconninfo) {
    // 초기 데이터베이스 연결 설정
    dbconn = mysql.createConnection({
        host: dbconninfo.HOST,
        user: dbconninfo.USER,
        password: dbconninfo.PASSWORD,
        database: dbconninfo.DATABASE
    });

    dbconn.connect((err) => {
        if (err) {
            utils.printLog('ERROR', err);
            return;
        }
    });
}

function register(username, password, callback) {
    dbconn.query('SELECT * FROM userinfo WHERE username = "' + username + '"', (outerr, outresult) => {
        if (outerr) {
            if (callback) callback('REGISTER_ERR');
            return;
        }

        if (outresult.length > 0) {
            if (callback) callback('REGISTER_AEX');
            return;
        }

        dbconn.query('INSERT INTO userinfo (username, password) VALUES ("' + username + '", "' + password + '")', (err, results) => {
            if (err) {
                if (callback) callback('REGISTER_ERR');
                return;
            }

            if (callback) callback('REGISTER_OK');
            return;
        });
    });
}

function login(username, password, callback) {
    dbconn.query('SELECT * FROM userinfo WHERE username = "' + username + '"', (err, results) => {
        if (err) {
            if (callback) callback('LOGIN_ERR');
            return;
        }

        if (results.length == 0) {
            if (callback) callback('LOGIN_NEX');
            return;
        }

        if (results[0].password !== password) {
            if (callback) callback('LOGIN_NMP');
            return;
        }

        if (callback) callback('LOGIN_OK');
        return;
    });
}

function initTables() {
    dbconn.query('CREATE TABLE IF NOT EXISTS userinfo (id INTEGER PRIMARY KEY AUTO_INCREMENT, username VARCHAR(254), password VARCHAR(512))', (err, results) => {
        if (err) {
            utils.printLog('ERROR', err);
            return;
        }
    });
}

module.exports = {
    initTables,
    register,
    connect,
    login,
};