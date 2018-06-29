var staticCacheName = 'ce-static-v1';
var allCaches = [
  staticCacheName
];
console.log('in offline');
self.addEventListener('install', event=> {
  event.waitUntil(
    caches.open(staticCacheName).then(cache=> {
      return cache.addAll([
        './',
        './converter.html',
        'js/app.js',
        'imgs/icon.png',
        'css/style.css'
         ]);
    })
  );
});

self.addEventListener('fetch', function(event) {     
    event.respondWith(
      caches.match(event.request).then(function(response) {   
        return response || fetch(event.request.url);
      })
    );
  });
