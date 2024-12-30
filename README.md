# FileLiber

FileLiber는 효율적이고 사용하기 쉬운 원격 파일 관리 웹앱 소프트웨어입니다. 사용자 친화적인 인터페이스와 강력한 기능으로, 여러 장치 간에 파일을 안전하고 간편하게 관리할 수 있습니다.

## 주요 기능

- **파일 업로드 및 다운로드**: 다양한 장치 간 파일 전송을 지원.
- **폴더 생성**: 사용자가 원격으로 새 폴더를 생성할 수 있음.
- **휴지통**: 삭제된 파일을 임시 저장하여 복구할 수 있는 기능 제공.
- **다중 사용자 지원**: 여러 사용자가 동일한 계정을 활용할 수 있는 역할 기반 액세스 제어.

## 설치 방법

### 1. 요구사항
- Node.js (버전 14 이상)
- MariaDB (MySQL)
- Git

### 2. 설치
```bash
# 리포지토리 클론
$ git clone https://github.com/yourusername/fileliber.git
$ cd fileliber

# 의존성 설치
$ npm install

# 환경 변수 파일 설정
$ vi .env

# 서버 실행
$ npm start
```

### 2-1. 환경 설정 파일 (.env) 내용

환경 설정 파일이 경로에 없을 경우, npm start 명령을 통해 서버 프로그램을 한번 시작하면 자동으로 생성됩니다.

```bash
MYSQL_HOST=서버주소
MYSQL_USER=사용자명
MYSQL_PASSWORD=비밀번호
MYSQL_DATABASE=DB명
```

### 3. 실행
- 웹 브라우저에서 [http://localhost:3000](http://localhost:3000)를 열어 FileLiber에 접속합니다.

## 기여하기

1. 이 리포지토리를 포크합니다.
2. 새 브랜치를 생성합니다:
   ```bash
   $ git checkout -b feature/새로운기능
   ```
3. 변경 사항을 커밋합니다:
   ```bash
   $ git commit -m "추가: 새로운 기능 설명"
   ```
4. 브랜치에 푸시합니다:
   ```bash
   $ git push origin feature/새로운기능
   ```
5. Pull Request를 생성합니다.

## 라이선스

FileLiber는 [MIT 라이선스](LICENSE)에 따라 배포됩니다.

## 문의

프로젝트 관련 문의 사항은 [bnuik77212@gmail.com](mailto:bnuik77212@gmail.com)으로 연락 주시기 바랍니다.