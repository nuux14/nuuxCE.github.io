
/*
* THIS WORK BELONGS TO MUBAREK MOHAMMED
*/

const staticCacheName = 'ce-static-v1';
const allCaches = [
  staticCacheName
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        './',
        'index.html',
        'favicon.ico',
        'js/app.js',
        'imgs/icon.png',
        'imgs/icon-192.png',
        'imgs/icon-512.png',
        'css/style.css',
        'manifest.json'
         ]);
    })
  );
});

self.addEventListener('fetch', event => {     
    event.respondWith(
      caches.match(event.request).then(response => {   
        return response || fetch(event.request.url);
      })
    );
  });
