const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\overs\\.gemini\\antigravity-ide\\brain\\3feeb8e7-167e-413e-8906-c87dbea9a54f\\cifras_app_icon_1788826339082.jpg';
const publicDir = path.resolve(__dirname, '..', 'public');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, path.join(publicDir, 'pwa-192x192.png'));
  fs.copyFileSync(src, path.join(publicDir, 'pwa-512x512.png'));
  fs.copyFileSync(src, path.join(publicDir, 'apple-touch-icon.png'));
  console.log('PWA icons copied successfully to public/');
} else {
  console.error('Source icon not found at', src);
}
