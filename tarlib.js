const fs    = require('fs');
const path  = require('path');
const { Readable } = require("stream");

function createTarHeader(filename, size) {
    // Tar 헤더 크기: 512 바이트
    const header = Buffer.alloc(512);

    // 파일 이름 (최대 100바이트)
    const name = path.basename(filename);
    header.write(name, 0, 100, "utf-8");

    // 파일 모드 (8진수, 8바이트)
    header.write("0000777\0", 100, 8, "utf-8");

    // 사용자 ID와 그룹 ID (8바이트씩, 0으로 설정)
    header.write("0000000\0", 108, 8, "utf-8"); // UID
    header.write("0000000\0", 116, 8, "utf-8"); // GID

    // 파일 크기 (8진수, 12바이트)
    const sizeOctal = size.toString(8).padStart(11, "0") + "\0";
    header.write(sizeOctal, 124, 12, "utf-8");

    // 파일 수정 시간 (8진수, 12바이트)
    const mtimeOctal = Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + "\0";
    header.write(mtimeOctal, 136, 12, "utf-8");

    // 체크섬 계산을 위한 초기값
    header.fill(" ", 148, 156); // 체크섬 필드는 공백으로 초기화

    // 파일 타입 (1바이트, 일반 파일은 '0')
    header.write("0", 156, 1, "utf-8");

    // 체크섬 계산
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    const checksumOctal = checksum.toString(8).padStart(6, "0") + "\0 ";
    header.write(checksumOctal, 148, 8, "utf-8");

    return header;
}

function createTarBuffer(files, pathdir) {
    const buffers = [];

    files.forEach((filePath) => {
        const fullPath = path.join(pathdir, filePath);
        const content = fs.readFileSync(fullPath);
        const header = createTarHeader(fullPath, content.length);

        buffers.push(header);
        buffers.push(content);

        // 512바이트 블록으로 정렬 (패딩 추가)
        const padding = Buffer.alloc(512 - (content.length % 512), 0);
        if (padding.length > 0) {
            buffers.push(padding);
        }
    });

    // tar 파일 종료 마커 (빈 블록 두 개)
    const endMarker = Buffer.alloc(1024, 0);
    buffers.push(endMarker);

    // 버퍼 합치기
    return Buffer.concat(buffers);
}

function tarBufferToStream(tarBuffer) {
    const stream = new Readable();
    stream.push(tarBuffer);
    stream.push(null);
    return stream;
}

module.exports = {
    createTarHeader,
    createTarBuffer,
    tarBufferToStream
};