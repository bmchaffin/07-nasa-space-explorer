const SHELL_CACHE = 'space-explorer-shell-v1';
const API_CACHE = 'space-explorer-api-v1';
const APP_SHELL = [
	'./',
	'./index.html',
	'./style.css',
	'./manifest.json',
	'./js/dateRange.js',
	'./js/script.js',
	'./img/nasa-worm-logo.png',
	'./img/app-icon.svg'
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	const requestUrl = new URL(event.request.url);
	if (requestUrl.hostname === 'science.nasa.gov' && requestUrl.pathname.startsWith('/wp-json/')) {
		event.respondWith(networkFirst(event.request));
		return;
	}

	event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
	const cachedResponse = await caches.match(request);
	return cachedResponse || fetch(request);
}

async function networkFirst(request) {
	const apiCache = await caches.open(API_CACHE);

	try {
		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			await apiCache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		const cachedResponse = await apiCache.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}
		throw error;
	}
}