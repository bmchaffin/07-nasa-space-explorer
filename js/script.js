// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const getImagesButton = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');
const spaceFact = document.getElementById('spaceFact');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalImage = document.getElementById('modalImage');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');
const NASA_API_KEY = '6BhKNP7CGbtzMBTmdmQF6HFJQWqDwTjhgwLDbG7b';

const spaceFacts = [
	'A day on Venus is longer than a year on Venus.',
	'Neutron stars can spin hundreds of times every second.',
	'Saturn would float in water because it is less dense than water.',
	'The footprints left on the Moon could last for millions of years.',
	'Light from the Sun takes about eight minutes to reach Earth.'
];

// Pick a new fact whenever the page loads.
spaceFact.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

function showLoadingMessage() {
	gallery.innerHTML = '<div class="status-message" role="status">🔄 Loading space photos...</div>';
}

function showErrorMessage(message = 'We could not load space photos right now. Please try again.') {
	gallery.innerHTML = `<div class="status-message error-message" role="alert">${message}</div>`;
}

function formatApiContent(content) {
	const contentContainer = document.createElement('div');
	contentContainer.innerHTML = content || '';
	contentContainer.querySelectorAll('script, style, iframe, object, embed').forEach((element) => element.remove());
	return contentContainer.innerHTML;
}

function openModal(photo) {
	modalImage.src = photo.hdurl || photo.url;
	modalImage.alt = photo.title;
	modalDate.textContent = photo.date;
	modalTitle.innerHTML = formatApiContent(photo.title);
	modalExplanation.innerHTML = formatApiContent(photo.explanation);
	imageModal.hidden = false;
	closeModalButton.focus();
}

function closeModal() {
	imageModal.hidden = true;
	modalImage.src = '';
}

function createGalleryItem(photo) {
	const item = document.createElement('article');
	item.className = 'gallery-item';

	if (photo.media_type === 'video') {
		item.innerHTML = `
			<div class="video-preview">VIDEO</div>
			<div class="item-details">
				<p class="photo-date">${photo.date}</p>
				<h2>${photo.title}</h2>
				<a href="${photo.url}" target="_blank" rel="noopener">Watch this APOD video</a>
			</div>`;
		return item;
	}

	item.innerHTML = `
		<button class="photo-button" type="button" aria-label="View details for ${photo.title}">
			<img src="${photo.hdurl || photo.url}" alt="${photo.title}" loading="lazy" />
			<span class="item-details">
				<span class="photo-date">${photo.date}</span>
				<span class="photo-title">${photo.title}</span>
			</span>
		</button>`;
	item.querySelector('.photo-button').addEventListener('click', () => openModal(photo));
	return item;
}

async function getSpaceImages() {
	showLoadingMessage();
	getImagesButton.disabled = true;

	try {
		const millisecondsPerDay = 24 * 60 * 60 * 1000;
		const latestDate = new Date(`${endInput.max}T00:00:00Z`);
		const selectedStartDate = new Date(`${startInput.value}T00:00:00Z`);
		const daysFromLatest = Math.max(0, Math.floor((latestDate - selectedStartDate) / millisecondsPerDay));
		const page = Math.floor(daysFromLatest / 25) + 1;
		const requestUrl = `https://science.nasa.gov/wp-json/wp/v2/apod-basic/?api_key=${NASA_API_KEY.trim()}&page=${page}&per_page=25`;
		const response = await fetch(requestUrl);
		const responseData = await response.json();

		if (!response.ok) {
			throw new Error(responseData.error?.message || 'NASA API request failed. Check that the API key is valid.');
		}

		const photos = Array.isArray(responseData) ? responseData : [responseData];
		const usablePhotos = photos.filter((photo) => {
			return photo.url && photo.date >= startInput.value && photo.date <= endInput.value;
		});

		if (usablePhotos.length === 0) {
			throw new Error('No APOD entries were found for that date range. Please choose another range and try again.');
		}

		gallery.innerHTML = '';
		usablePhotos.reverse().forEach((photo) => gallery.appendChild(createGalleryItem(photo)));
	} catch (error) {
		showErrorMessage(error.message);
	} finally {
		getImagesButton.disabled = false;
	}
}

getImagesButton.addEventListener('click', getSpaceImages);
closeModalButton.addEventListener('click', closeModal);
imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeModal();
	}
});
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !imageModal.hidden) {
		closeModal();
	}
});
