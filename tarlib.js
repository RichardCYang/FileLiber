const fs    = require('fs');
const path  = require('path');
const { Readable } = require("stream");

function getFilesInDirectory(dirPath) {
    let files = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            // 하위 디렉토리 탐색
            const subFiles = getFilesInDirectory(fullPath);
            files = files.concat(subFiles);
        } else {
            // 파일 경로 추가
            files.push(fullPath);
        }
    }

    return files;
}

function getTotalFilesInDirectories(filePaths, pathdir) {
    let totalFiles = 0;

    for (const filePath of filePaths) {
        const stats = fs.statSync(path.join(pathdir, filePath));

        if (stats.isDirectory()) {
            const filesInDir = getFilesInDirectory(path.join(pathdir, filePath));
            totalFiles += filesInDir.length;
        } else {
            totalFiles += 1;
        }
    }

    return totalFiles;
}

function calculateExpectedTarSize(filePaths, pathdir) {
    let totalSize = 0;
  
    for (const filePath of filePaths) {
        const stats = fs.statSync(path.join(pathdir, filePath));

        if (stats.isDirectory()) {
            // 디렉토리인 경우 하위 파일 탐색
            const filesInDir = getFilesInDirectory(path.join(pathdir, filePath));
            for (const file of filesInDir) {
                const fileStats = fs.statSync(file);
                totalSize += fileStats.size;
            }
        } else {
            // 파일인 경우 크기 더하기
            totalSize += stats.size;
        }
    }

    // 추가적으로 TAR 헤더(512바이트씩)를 계산할 수도 있음
    const totalFiles = filePaths.length + getTotalFilesInDirectories(filePaths, pathdir);
    const tarHeaderSize = totalFiles * 512;
    totalSize += tarHeaderSize;

    return totalSize;    
}  

function createTarHeader(filename, size, isDirectory = false) {
    // Tar 헤더 크기: 512 바이트
    const header = Buffer.alloc(512);

    // 파일 이름 (최대 100바이트)
    const name = path.basename(filename) + (isDirectory ? '/' : '');
    header.write(name, 0, 100, "utf-8");

    // 파일 모드 (8진수, 8바이트)
    header.write("0000777\0", 100, 8, "utf-8");

    // 사용자 ID와 그룹 ID (8바이트씩, 0으로 설정)
    header.write("0000000\0", 108, 8, "utf-8"); // UID
    header.write("0000000\0", 116, 8, "utf-8"); // GID

    // 파일 크기 (8진수, 12바이트, 폴더는 0)
    const sizeOctal = size.toString(8).padStart(11, "0") + "\0";
    header.write(sizeOctal, 124, 12, "utf-8");

    // 파일 수정 시간 (8진수, 12바이트)
    const mtimeOctal = Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + "\0";
    header.write(mtimeOctal, 136, 12, "utf-8");

    // 체크섬 계산을 위한 초기값
    header.fill(" ", 148, 156); // 체크섬 필드는 공백으로 초기화

    // 파일 타입 (1바이트, 일반 파일은 '0', 폴더는 '5')
    header.write(isDirectory ? "5" : "0", 156, 1, "utf-8");

    // 체크섬 계산
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    const checksumOctal = checksum.toString(8).padStart(6, "0") + "\0 ";
    header.write(checksumOctal, 148, 8, "utf-8");

    return header;
}

function createTarStream(files, pathdir) {
    const stream = new Readable({
        read() {}
    });

    function processPath(filePath) {
        const fullPath = path.join(pathdir, filePath);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            // 폴더인 경우, 폴더 헤더 추가
            const header = createTarHeader(filePath, 0, true);
            stream.push(header);

            // 내부 파일 및 폴더를 재귀적으로 처리
            const subFiles = fs.readdirSync(fullPath);
            subFiles.forEach((subFile) => {
                processPath(path.join(filePath, subFile));
            });
        } else if (stats.isFile()) {
            // 파일인 경우, 헤더 및 내용을 tar 스트림에 추가
            const content = fs.readFileSync(fullPath);
            const header = createTarHeader(filePath, content.length, false);

            stream.push(header);
            stream.push(content);

            // 512바이트 블록으로 정렬 (패딩 추가)
            const padding = Buffer.alloc(512 - (content.length % 512), 0);
            if (padding.length > 0) {
                stream.push(padding);
            }
        }
    }

    files.forEach((filePath) => {
        processPath(filePath);
    });

    // tar 파일 종료 마커 (빈 블록 두 개)
    const endMarker = Buffer.alloc(1024, 0);
    stream.push(endMarker);
    stream.push(null);

    return stream;
}

module.exports = {
    createTarHeader,
    createTarStream,
    calculateExpectedTarSize,
};