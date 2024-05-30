const CACHE_NAME = 'qr-code-scanner-cache-v1';
const urlsToCache = [
    '/',
    '/src/index.html',
    '/src/css/style.css',
    '/src/components/scanner.js',
    'https://unpkg.com/html5-qrcode'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache resources:', error);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(error => {
                console.error('Fetch error:', error);
            })
    );
});

self.addEventListener('sync', event => {
    if (event.tag === 'sync-scanned-data') {
        event.waitUntil(syncScannedData());
    }
});

async function syncScannedData() {
    try {
        const db = await openIndexedDB();
        const tx = db.transaction('scannedData', 'readwrite');
        const store = tx.objectStore('scannedData');
        const allScans = await store.getAll();

        for (const scan of allScans) {
            try {
                const url = `http://localhost:3000/users/${scan.userID}/record`;
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type: scan.type })
                });
                store.delete(scan.id);
            } catch (error) {
                console.error('Failed to sync scan:', error);
            }
        }
    } catch (error) {
        console.error('Failed to sync data:', error);
    }
}

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('QRScannerDB', 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore('scannedData', { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        request.onerror = event => {
            reject(event.target.error);
        };
    });
}
