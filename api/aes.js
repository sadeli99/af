const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/proxy', createProxyMiddleware({
    target: 'https://jeniusplay.com', // Ganti dengan server sumber
    changeOrigin: true,
    pathRewrite: {
        '^/proxy': '', // Menghapus '/proxy' dari URL
    },
}));

// Ekspor aplikasi untuk digunakan oleh Vercel
module.exports = app;
