refreshCurrentDirPage();

const main_area         = document.querySelector('.main');
const btn_add_folder    = document.querySelector('#btnAddFolder');
const btn_select        = document.querySelector('#btnSelect');
const btn_remove        = document.querySelector('#btnRemove');
const btn_donwload      = document.querySelector('#btnDownload');
const btn_all_files     = document.querySelector('#btnHome');
const btn_recycle_bin   = document.querySelector('#btnTrash');
const btn_logout        = document.querySelector('#btnLogout');

main_area.addEventListener('dragover', (e) => {
    e.preventDefault();
});

main_area.addEventListener('drop', (e) => {
    e.preventDefault();

    const files = e.dataTransfer.files;
    if (files.length > 0)
        uploadFiles(files);
});

btn_add_folder.addEventListener('click', (e) => {
    createDialog('Enter Folder Name', 'Type here...', function (value) {
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
        createMessageDialog('Notice', 'No selected files to delete');
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
        createMessageDialog('Notice', 'No selected files to download');
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

btn_all_files.addEventListener('click', (e) => {
    userinfo.currentPath    = '.';
    userinfo.selectionMode  = false;
    btn_select.classList.remove('menubar-button-toggle-active');
    btn_add_folder.style.removeProperty('display');
    refreshCurrentDirPage();
});

btn_recycle_bin.addEventListener('click', (e) => {
    userinfo.currentPath    = 'RECYCLE_BIN';
    userinfo.selectionMode  = false;
    btn_select.classList.remove('menubar-button-toggle-active');
    btn_add_folder.style.setProperty('display', 'none', 'important');
    refreshCurrentDirPage();
});

btn_logout.addEventListener('click', (e) => {
    logout();
});