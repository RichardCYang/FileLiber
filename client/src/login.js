const btn_login = document.querySelector('#btnLogin');

btn_login.addEventListener('click', (e) => {
    const txt_username  = document.querySelector('#txtUsername');
    const pw_password   = document.querySelector('#pwPassword');
    const hs_password   = sha512(pw_password.value);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/login.do', true);
    xhr.setRequestHeader('X-Username', encodeURIComponent(txt_username.value));
    xhr.setRequestHeader('X-Password', hs_password);
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.responseText === 'LOGIN_OK') {
                window.location.href = '/';
                return;
            }

            if (xhr.responseText === 'LOGIN_NEX') {
                createMessageDialog('알림', '미등록 계정 입니다');
                return;
            }

            if (xhr.responseText === 'LOGIN_NMP') {
                createMessageDialog('알림', '잘못된 비밀번호 입니다');
                return;
            }

            if (xhr.responseText === 'LOGIN_ERR') {
                createMessageDialog('알림', '로그인 오류');
                return;
            }
        }
    }
});