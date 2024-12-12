const crypto = require('crypto');
const base64 = require('base64-js');

// Kelas CryptoJsAes untuk enkripsi dan dekripsi
class CryptoJsAes {
    static encrypt(value, passphrase) {
        const salt = crypto.randomBytes(8);
        let salted = Buffer.from('');
        let dx = Buffer.from('');

        while (salted.length < 48) {
            dx = crypto.createHash('md5').update(dx + passphrase + salt.toString('utf-8')).digest();
            salted = Buffer.concat([salted, dx]);
        }

        const key = salted.slice(0, 32);
        const iv = salted.slice(32, 48);

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encryptedData = cipher.update(JSON.stringify(value), 'utf8', 'binary');
        encryptedData += cipher.final('binary');

        return JSON.stringify({
            ct: base64.fromByteArray(Buffer.from(encryptedData, 'binary')).toString('utf-8'),
            iv: iv.toString('hex'),
            s: salt.toString('hex')
        });
    }

    static decrypt(jsonStr, passphrase) {
        const jsonData = JSON.parse(jsonStr);
        const salt = Buffer.from(jsonData.s, 'hex');
        const iv = Buffer.from(jsonData.iv, 'hex');
        const ct = base64.toByteArray(jsonData.ct);

        const concatedPassphrase = Buffer.concat([Buffer.from(passphrase, 'utf-8'), salt]);
        let result = crypto.createHash('md5').update(concatedPassphrase).digest();

        for (let i = 0; i < 2; i++) {
            result = Buffer.concat([result, crypto.createHash('md5').update(Buffer.concat([result, concatedPassphrase])).digest()]);
        }

        const key = result.slice(0, 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decryptedData = Buffer.concat([decipher.update(ct), decipher.final()]);

        try {
            return JSON.parse(CryptoJsAes._unpad(decryptedData).toString('utf-8'));
        } catch (e) {
            console.error(`Error decoding JSON: ${e}`);
            return null;
        }
    }

    static _pad(s) {
        const padding = 16 - (s.length % 16);
        return Buffer.concat([s, Buffer.alloc(padding, padding)]);
    }

    static _unpad(s) {
        return s.slice(0, s.length - s[s.length - 1]);
    }
}

// Fungsi untuk menambahkan padding pada string base64
function addBase64Padding(b64String) {
    return b64String + '='.repeat((4 - b64String.length % 4) % 4);
}

// Fungsi untuk mendekode
function dec(r, e) {
    const rList = [];
    for (let i = 2; i < r.length; i += 4) {
        rList.push(r.substr(i, 2));
    }

    const mPadded = addBase64Padding(e.split('').reverse().join(''));
    let decodedM = '';

    try {
        decodedM = Buffer.from(mPadded, 'base64').toString('utf-8');
    } catch (e) {
        console.error(`Base64 decoding error: ${e}`);
        return '';
    }

    const decodedMList = decodedM.split('|');
    return decodedMList.map(s => {
        const index = parseInt(s);
        return (s.match(/^\d+$/) && index < rList.length) ? '\\x' + rList[index] : '';
    }).join('');
}

module.exports = { CryptoJsAes, dec };
