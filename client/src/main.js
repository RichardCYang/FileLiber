refreshCurrentDirPage();

const main_area         = document.querySelector('.main');
const btn_add_folder    = document.querySelector('#btnAddFolder');
const btn_select        = document.querySelector('#btnSelect');
const btn_all_select    = document.querySelector('#btnAllSelect');
const btn_remove        = document.querySelector('#btnRemove');
const btn_upload        = document.querySelector('#btnUpload');
const btn_donwload      = document.querySelector('#btnDownload');
const btn_all_files     = document.querySelector('#btnHome');
const btn_recycle_bin   = document.querySelector('#btnTrash');
const btn_recovery      = document.querySelector('#btnRecovery');
const btn_logout        = document.querySelector('#btnLogout');

main_area.addEventListener('dragover', (e) => {
    e.preventDefault();
});

main_area.addEventListener('drop', async(e) => {
    e.preventDefault();

    // 브라우저가 webkitGetAsEntry()를 통한 폴더 드롭을 지원하는지 확인
    // 24년 12월 31일 기준 FireFox for Android 브라우저에 지원 X
    if (typeof DataTransferItem.prototype.webkitGetAsEntry === 'function') {
        const items = e.dataTransfer.items;
        const onlyfiles = [];
        const dirfiles = [];
        const entries = [];

        for (let i = 0; i < items.length; i++)
            entries.push(items[i].webkitGetAsEntry());

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.isDirectory) {
                const subfiles = await traverseDirectoryAsync(entry);
                for (let i = 0; i < subfiles.length; i++)
                    dirfiles.push(subfiles[i]);
            } else {
                onlyfiles.push(await getFileAsync(entry));
            }
        }

        for (let i = 0; i < dirfiles.length; i++) {
            createFolder(dirfiles[i].path);
            uploadFiles([dirfiles[i].rawfile], userinfo.currentPath + '/' + dirfiles[i].path);
        }

        uploadFiles(onlyfiles);
    } else {
        uploadFiles(e.dataTransfer.files);
    }
});

btn_add_folder.addEventListener('click', (e) => {
    createDialog('폴더 생성', '폴더명 입력...', function (value) {
        createFolder(value);
    });
});

btn_remove.addEventListener('click', (e) => {
    const fileItems     = document.querySelectorAll('.file-grid-item');
    const selectedItems = [];

    for (let i = 0; i < fileItems.length; i++) {
        if (fileItems[i].selected)
            selectedItems.push(fileItems[i].fileName);
    }

    if (selectedItems.length == 0) {
        createMessageDialog('알림', '선택된 항목이 없습니다');
        return;
    }

    if (userinfo.currentPath.indexOf('RECYCLE_BIN') > -1)
        flushBin(selectedItems);
    else
        recycleBin(selectedItems);
});

btn_donwload.addEventListener('click', (e) => {
    const fileItems     = document.querySelectorAll('.file-grid-item');
    const selectedItems = [];

    for (let i = 0; i < fileItems.length; i++) {
        if (fileItems[i].selected)
            selectedItems.push(fileItems[i].fileName);
    }

    if (selectedItems.length == 0) {
        createMessageDialog('알림', '선택된 항목이 없습니다');
        return;
    }

    downloadFile(selectedItems);
});

btn_select.addEventListener('click', (e) => {
    userinfo.selectionMode = !userinfo.selectionMode;

    const checkboxs = document.querySelectorAll('.file-grid-checkbox');
    for (let i = 0; i < checkboxs.length; i++) {
        checkboxs[i].style.setProperty('display', userinfo.selectionMode ? 'block' : 'none', 'important');
    }

    if (userinfo.selectionMode)
        btn_select.classList.add('menubar-button-toggle-active');
    else
        btn_select.classList.remove('menubar-button-toggle-active');
});

btn_all_select.addEventListener('click', (e) => {
    const fileItems = document.querySelectorAll('.file-grid-item');
    userinfo.allSelectionMode = !userinfo.allSelectionMode;

    for (let i = 0; i < fileItems.length; i++) {
        fileItems[i].selected = userinfo.allSelectionMode;
        fileItems[i].checkbox.innerHTML = userinfo.allSelectionMode ? '☑️' : '🔲';
    }

    if (userinfo.allSelectionMode)
        btn_all_select.classList.add('menubar-button-toggle-active');
    else
        btn_all_select.classList.remove('menubar-button-toggle-active');
});

btn_all_files.addEventListener('click', (e) => {
    userinfo.currentPath    = '.';
    userinfo.selectionMode  = false;
    btn_select.classList.remove('menubar-button-toggle-active');
    btn_add_folder.classList.remove('hide');
    btn_donwload.classList.remove('hide');
    btn_upload.classList.remove('hide');
    btn_recovery.classList.add('hide');
    refreshCurrentDirPage();
});

btn_recycle_bin.addEventListener('click', (e) => {
    userinfo.currentPath    = 'RECYCLE_BIN';
    userinfo.selectionMode  = false;
    btn_select.classList.remove('menubar-button-toggle-active');
    btn_add_folder.classList.add('hide');
    btn_donwload.classList.add('hide');
    btn_upload.classList.add('hide');
    btn_recovery.classList.remove('hide');
    refreshCurrentDirPage();
});

btn_recovery.addEventListener('click', (e) => {
    const fileItems     = document.querySelectorAll('.file-grid-item');
    const selectedItems = [];

    for (let i = 0; i < fileItems.length; i++) {
        if (fileItems[i].selected)
            selectedItems.push(fileItems[i].fileName);
    }

    if (selectedItems.length == 0) {
        createMessageDialog('알림', '선택된 항목이 없습니다');
        return;
    }

    recoveryBin(selectedItems);
});

btn_logout.addEventListener('click', (e) => {
    logout();
});