const fetch = require('node-fetch');
const CryptoJsAes = require('./aes'); // Mengimpor CryptoJsAes dari file helper

class Idlix {
    constructor(videoId) {
        this.BASE_WEB_URL = 'https://tv4.idlix.asia/';
        this.video_id = 124474;
        this.embed_url = null;
    }

    // Fungsi untuk mendekode key
    dec(r, e) {
        const rList = [];
        for (let i = 2; i < r.length; i += 4) {
            rList.push(r.substr(i, 2));
        }

        const mPadded = this.addBase64Padding(e.split('').reverse().join(''));
        let decodedM = '';

        try {
            decodedM = Buffer.from(mPadded, 'base64').toString('utf-8');
        } catch (e) {
            console.error(`Base64 decoding error: ${e}`);
            return "";
        }

        const decodedMList = decodedM.split("|");
        return decodedMList.map(s => {
            const index = parseInt(s);
            return (s.match(/^\d+$/) && index < rList.length) ? "\\x" + rList[index] : '';
        }).join('');
    }

    // Fungsi untuk menambahkan padding base64
    addBase64Padding(b64String) {
        const padLength = (4 - (b64String.length % 4)) % 4;
        return b64String + '='.repeat(padLength);
    }

    // Fungsi untuk mendapatkan embed URL
    async getEmbedUrl() {
        if (!this.video_id) {
            return {
                status: false,
                message: 'Video ID is required'
            };
        }

        try {
            const response = await fetch(`${this.BASE_WEB_URL}wp-admin/admin-ajax.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'doo_player_ajax',
                    post: this.video_id,
                    nume: '1',
                    type: 'movie'
                })
            });

            const jsonResponse = await response.json();

            if (response.status === 200 && jsonResponse.embed_url) {
                this.embed_url = CryptoJsAes.decrypt(
                    jsonResponse.embed_url,
                    this.dec(jsonResponse.key, JSON.parse(jsonResponse.embed_url).m)
                );

                return {
                    status: true,
                    embed_url: this.embed_url
                };
            } else {
                return {
                    status: false,
                    message: 'Failed to get embed URL'
                };
            }
        } catch (error) {
            return {
                status: false,
                message: error.toString()
            };
        }
    }
}

module.exports = Idlix;
