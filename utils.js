function printLog(level, message) {
    console.log('[' + level + '][' + dateToLocalTime(new Date()) + ']: ' + message);
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

module.exports = {
    printLog,
    dateToLocalTime
};