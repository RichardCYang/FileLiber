function createMessageDialog(headerText, messageText, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';

    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.textContent = headerText;

    const message = document.createElement('div');
    message.className = 'dialog-message';
    message.textContent = messageText;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';

    const okButton = document.createElement('button');
    okButton.className = 'dialog-button primary';
    okButton.textContent = 'OK';
    okButton.onclick = function () {
        if (onClose) onClose();
        document.body.removeChild(overlay);
    };

    buttonContainer.appendChild(okButton);

    dialogBox.appendChild(header);
    dialogBox.appendChild(message);
    dialogBox.appendChild(buttonContainer);

    overlay.appendChild(dialogBox);

    document.body.appendChild(overlay);
}

function createProgressDialog(headerText, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';

    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.textContent = headerText;

    const body = document.createElement('div');
    body.className = 'dialog-body';

    const progressborder = document.createElement('div');
    progressborder.type = 'text';
    progressborder.className = 'dialog-input';

    body.appendChild(progressborder);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-button secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = function () {
        document.body.removeChild(overlay);
    };

    buttonContainer.appendChild(cancelButton);

    dialogBox.appendChild(header);
    dialogBox.appendChild(body);
    dialogBox.appendChild(buttonContainer);

    overlay.appendChild(dialogBox);

    document.body.appendChild(overlay);
}

function createDialog(headerText, placeholderText, onSubmit) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';

    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.textContent = headerText;

    const body = document.createElement('div');
    body.className = 'dialog-body';

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.className = 'dialog-input';
    inputField.placeholder = placeholderText;
    inputField.focus();

    body.appendChild(inputField);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';

    const submitButton = document.createElement('button');
    submitButton.className = 'dialog-button primary';
    submitButton.textContent = 'Submit';
    submitButton.onclick = function () {
        const value = inputField.value;
        onSubmit(value);
        document.body.removeChild(overlay);
    };

    inputField.onkeydown = function (e) {
        if (e.key === "Enter")
            submitButton.click();
    };

    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-button secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = function () {
        document.body.removeChild(overlay);
    };

    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(cancelButton);

    dialogBox.appendChild(header);
    dialogBox.appendChild(body);
    dialogBox.appendChild(buttonContainer);

    overlay.appendChild(dialogBox);

    document.body.appendChild(overlay);
}