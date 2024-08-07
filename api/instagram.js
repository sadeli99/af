const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Menambahkan header CORS ke dalam respons
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Mengatasi preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Mengambil nilai parameter username dari permintaan
    const username = req.query.username || 'instagram'; // Gantilah 'instagram' dengan username default jika perlu

    // URL API dengan parameter username
    const apiUrl = `https://gramsnap.com/api/ig/userInfoByUsername/${username}`;

    // Mengambil data dari API eksternal
    const response = await fetch(apiUrl);
    if (!response.ok) {
      // Jika response tidak berhasil, lempar error
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Mengubah response ke JSON
    const data = await response.json();

    // Memproses data JSON untuk mendapatkan bagian yang diperlukan
    const user = data.result.user;
    const result = {
      nama_lengkap: user.full_name || "Nama belum diisi", // Menyediakan nilai default jika full_name tidak ada
      username: user.username || "User tidak ada",
      status_akun: user.is_private
        ? `Akun atas nama ${username} ini di private rahasia`
        : `Akun atas nama ${username} ini publik`, // Menyediakan nilai deskriptif berdasarkan is_private
      biography: user.biography || "Akun ini tidak memiliki biography", // Menyediakan nilai default jika bio tidak ada
      jumlah_pengikut: user.follower_count || 0, // Menyediakan nilai default jika follower_count tidak ada
      jumlah_diikuti: user.following_count || 0, // Menyediakan nilai default jika following_count tidak ada
      jumlah_postingan: user.media_count || 0, // Menyediakan nilai default jika media_count tidak ada
      foto_profil: user.hd_profile_pic_url_info
        ? `https://media.gramsnap.com/get?uri=${encodeURIComponent(user.hd_profile_pic_url_info.url)}&__sig=${user.hd_profile_pic_url_info.url_signature.signature}&__expires=${user.hd_profile_pic_url_info.url_signature.expires}`
        : "Foto profil tidak tersedia"
    };

    // Mengirimkan respon dalam format JSON
    res.status(200).json(result);
  } catch (error) {
    // Menangani error jika terjadi
    console.error('Terjadi kesalahan:', error);
    res.status(500).json({ error: 'Akun instagram atas nama pengguna ${username} tidak ditemukan.' });
  }
};
