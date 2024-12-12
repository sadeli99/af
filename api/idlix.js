const axios = require('axios');
const { CryptoJsAes, dec } = require('./aes');

class Idlix {
    constructor(video_id) {
        this.video_id = 124474;
        this.BASE_WEB_URL = 'https://tv4.idlix.asia/'; // Ganti dengan URL dasar yang sesuai
        this.embed_url = null;
    }

    async getEmbedUrl() {
        if (!this.video_id) {
            return {
                status: false,
                message: 'Video ID is required'
            };
        }

        try {
            const response = await axios.post(this.BASE_WEB_URL + 'wp-admin/admin-ajax.php', new URLSearchParams({
                'action': 'doo_player_ajax',
                'post': this.video_id,
                'nume': '1',
                'type': 'movie'
            }));

            if (response.status === 200 && response.data.embed_url) {
                const embedUrlData = response.data.embed_url;
                const keyData = response.data.key;

                // Mendekode embed_url menggunakan CryptoJsAes
                this.embed_url = CryptoJsAes.decrypt(
                    embedUrlData,
                    dec(keyData, JSON.parse(embedUrlData).m)
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
        } catch (error_get_embed_url) {
            return {
                status: false,
                message: error_get_embed_url.toString()
            };
        }
    }
}

module.exports = Idlix;
