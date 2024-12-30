const btn_signup = document.querySelector('#btnSignup');

btn_signup.addEventListener('click', (e) => {
    const txt_username  = document.querySelector('#txtUsername');
    const pw_password   = document.querySelector('#pwPassword');
    const hs_password   = sha512(pw_password.value);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/register.do', true);
    xhr.setRequestHeader('X-Username', encodeURIComponent(txt_username.value));
    xhr.setRequestHeader('X-Password', hs_password);
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.responseText === 'REGISTER_OK') {
                window.location.href = '/';
                return;
            }

            if (xhr.responseText === 'REGISTER_AEX') {
                createMessageDialog('알림', '이미 존재하는 사용자명 입니다');
                return;
            }

            if (xhr.responseText === 'REGISTER_ERR') {
                createMessageDialog('알림', '회원가입 오류');
                return;
            }
        }
    }
});