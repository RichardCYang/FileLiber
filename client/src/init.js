// Global Definitions
const userinfo = [];
userinfo.currentPath = '.';
userinfo.selectionMode = false;

function makeStringArrayToCommaString(strarr) {
    const arr = [];

    if (!strarr)
        return '';

    for (let i = 0; i < strarr.length; i++) {
        arr.push(strarr[i]);
        if (i < strarr.length - 1)
            arr.push(',');
    }

    return arr.join('');
}

function logout() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout.do', true);
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.responseText === 'LOGOUT_OK')
                window.location.href = '/';
        }
    }
}

function loadDirectoryInfo(path, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/getdirinfo', true);
    xhr.setRequestHeader('X-Directory-Path', encodeURIComponent(path));
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status == 200) {
                if (callback)
                    callback(JSON.parse(xhr.responseText));
            }
        }
    }
}

function removeLastPath(path) {
    const tokens = path.split('/');
    let newpath = '';

    for (let i = 0; i < tokens.length - 1; i++)
        newpath += tokens[i] + '/';

    return newpath.slice(0, -1);
}

function flushBin(entries) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/flushbin', true);
    xhr.setRequestHeader('X-Files', encodeURIComponent(makeStringArrayToCommaString(entries)));
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.responseText === 'FLUSH_OK')
                refreshCurrentDirPage();
        }
    }
}

function recycleBin(entries) {
    const xhr  = new XMLHttpRequest();
    xhr.open('POST', '/recyclebin', true);
    xhr.setRequestHeader('X-Directory-Path', encodeURIComponent(userinfo.currentPath));
    xhr.setRequestHeader('X-Files', encodeURIComponent(makeStringArrayToCommaString(entries)));
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.responseText === 'MOVE_OK')
                refreshCurrentDirPage();
        }
    }
}

function createFolder(folder) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/createfolder', true);
    xhr.setRequestHeader('X-Directory-Path', userinfo.currentPath);
    xhr.setRequestHeader('X-Directory-Name', folder);
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.responseText === 'CREATE_OK')
                refreshCurrentDirPage();
        }
    }
}

function downloadFile(files) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.open('POST', '/download', true);
    xhr.setRequestHeader('X-Directory-Path', encodeURIComponent(userinfo.currentPath));
    xhr.setRequestHeader('X-Files', encodeURIComponent(makeStringArrayToCommaString(files)));
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status === 200) {
            const blob = new Blob([xhr.response]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = xhr.getResponseHeader('X-Download-Filename');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
        }
    };
}

function uploadFiles(files) {
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);
    xhr.setRequestHeader('X-Directory-Path', userinfo.currentPath);
    xhr.send(formData);

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.responseText === 'UPLOAD_OK')
                refreshCurrentDirPage();
        }
    }
}

function dateToLocalTime(date) {
    const formmated_date = [];
    formmated_date.push(date.getFullYear());
    formmated_date.push('-');
    formmated_date.push((date.getMonth() + 1).toString().padStart(2, '0'));
    formmated_date.push('-');
    formmated_date.push(date.getDate().toString().padStart(2, '0'));
    formmated_date.push(' ');
    formmated_date.push(date.getHours().toString().padStart(2, '0'));
    formmated_date.push(':');
    formmated_date.push(date.getMinutes().toString().padStart(2, '0'));
    formmated_date.push(':');
    formmated_date.push(date.getSeconds().toString().padStart(2, '0'));
    formmated_date.push('.');
    formmated_date.push(date.getMilliseconds().toString().padStart(3, '0'));
    return formmated_date.join('');
}

function clearFiles() {
    const fileGrid = document.getElementById('fileGrid');
    fileGrid.innerHTML = '';
}

function matchIcon(type, name) {
    if (type === 'folder')
        return '📁';

    name = name.toLowerCase();

    const extensions = [
        {type: 'image', extension: '.jpeg'},
        {type: 'image', extension: '.png'},
        {type: 'image', extension: '.jpg'},
        {type: 'image', extension: '.bmp'},
        {type: 'image', extension: '.tga'},
        {type: 'image', extension: '.gif'},
        {type: 'sound', extension: '.wma'},
        {type: 'sound', extension: '.wav'},
        {type: 'sound', extension: '.ogg'},
        {type: 'sound', extension: '.mp3'},
        {type: 'archive', extension: '.zip'},
        {type: 'archive', extension: '.tar'},
        {type: 'archive', extension: '.jar'},
        {type: 'archive', extension: '.war'},
        {type: 'archive', extension: '.egg'},
        {type: 'archive', extension: '.alz'},
        {type: 'document', extension: '.pdf'},
        {type: 'document', extension: '.hwp'},
        {type: 'document', extension: '.xls'},
        {type: 'document', extension: '.docx'}
    ];

    for (let i = 0; i < extensions.length; i++) {
        if (name.indexOf(extensions[i].extension) > -1) {
            switch (extensions[i].type) {
                case 'image':
                    return '🖼️';

                case 'sound':
                    return '🎵';

                case 'archive':
                    return '📦';

                case 'document':
                    return '📑';

                default:
                    return '📄';
            }
        }
    }
}

function addFile(name, type, size, created, modified) {
    const fileGrid = document.getElementById('fileGrid');
    const fileItem = document.createElement('div');
    const fileIcon = document.createElement('i');
    const fileName = document.createElement('span');
    const fileCHBX = document.createElement('i');
    const icon = matchIcon(type, name);
    fileIcon.innerHTML = icon;
    fileName.innerHTML = name;
    fileCHBX.innerHTML = '🔲';
    fileCHBX.classList.add('file-grid-checkbox');
    fileItem.appendChild(fileIcon);
    fileItem.appendChild(fileName);
    fileItem.appendChild(fileCHBX);
    fileItem.selected  = false;
    fileItem.fileName  = name;
    fileItem.className = 'file-grid-item';
    fileItem.clickWait = null;
    fileItem.clickCnt  = 0;
    fileItem.addEventListener('click', () => {
        if (userinfo.selectionMode) {
            fileItem.selected = !fileItem.selected;
            fileCHBX.innerHTML = fileItem.selected ? '☑️' : '🔲';
            return;
        }

        fileItem.clickCnt++;
        if (fileItem.clickWait == null) {
            fileItem.clickWait = setTimeout(() => {
                if (fileItem.clickCnt === 1) {
                    // Single-Clicked Event Handling
                    showDetails(name, type, size, created, modified);
                } else {
                    // Double-Clicked Event Handling
                    if (type === 'folder') {
                        if (name === '..') {
                            userinfo.currentPath = removeLastPath(userinfo.currentPath);
                        } else {
                            userinfo.currentPath = userinfo.currentPath + '/' + name;
                        }
                        refreshCurrentDirPage();
                    }
                }
                fileItem.clickWait = null;
                fileItem.clickCnt = 0;
            }, 150);
        }
    });
    fileGrid.appendChild(fileItem);
}

function showDetails(name, type, bytesizes, created, modified) {
    const detailsSidebar = document.getElementById('detailsSidebar');
    document.getElementById('fileName').textContent = name;
    document.getElementById('fileType').textContent = type === 'folder' ? 'Folder' : 'File';
    document.getElementById('fileCreated').textContent = dateToLocalTime(new Date(created));
    document.getElementById('fileModified').textContent = dateToLocalTime(new Date(modified));
    document.getElementById('fileSize').textContent = ((bytesizes / 1024) / 1024).toFixed(2) + ' MB';
    detailsSidebar.classList.add('active');
    document.querySelector('.toggle-btn').textContent = '▶';
}

function toggleDetails() {
    const detailsSidebar = document.getElementById('detailsSidebar');
    const toggleButton = document.querySelector('.toggle-btn');
    if (detailsSidebar.classList.contains('active')) {
        detailsSidebar.classList.remove('active');
        toggleButton.textContent = '▶';
    } else {
        detailsSidebar.classList.add('active');
        toggleButton.textContent = '◀';
    }
}

function refreshCurrentDirPage() {
    clearFiles();
    loadDirectoryInfo(userinfo.currentPath, (data) => {
        if (data == null)
            return;

        if (userinfo.currentPath !== '.' && userinfo.currentPath !== 'RECYCLE_BIN')
            addFile('..', 'folder', 0, Date.now(), Date.now());

        for (let i = 0; i < data.length; i++)
            addFile(data[i].name, data[i].type, data[i].size, data[i].created, data[i].modified);
    });
}