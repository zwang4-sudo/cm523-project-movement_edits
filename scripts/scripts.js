document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const studioCards = document.querySelectorAll('.studio-card');
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // Single main map centered on Boston
    const mainMap = L.map(document.querySelector('.studio-map'), {
        scrollWheelZoom: false,
        zoomControl: true,
    }).setView([42.355, -71.12], 11);

    L.tileLayer(tileUrl, { attribution }).addTo(mainMap);

    // Build markers (array per card) but keep them off the map initially
    const cardMarkers = new Map();
    let activeMarkers = [];

    studioCards.forEach(card => {
        const name = card.querySelector('h3')?.textContent || '';
        let locations = [];

        if (card.dataset.locations) {
            try { locations = JSON.parse(card.dataset.locations); } catch {}
        }

        if (!locations.length) {
            const lat = parseFloat(card.dataset.lat);
            const lng = parseFloat(card.dataset.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                locations = [{ lat, lng, label: name }];
            }
        }

        const markers = locations.map(loc =>
            L.marker([loc.lat, loc.lng]).bindPopup(loc.label || name)
        );
        cardMarkers.set(card, markers);
    });

    function showMarkerFor(card) {
        const markers = cardMarkers.get(card);
        if (!markers || !markers.length) return;

        // Remove previous markers
        activeMarkers.forEach(m => m.remove());
        activeMarkers = markers;

        // Add all markers for this card
        markers.forEach(m => m.addTo(mainMap));

        // Fit map to show all pins
        if (markers.length === 1) {
            const ll = markers[0].getLatLng();
            mainMap.flyTo([ll.lat, ll.lng], 14, { duration: 0.8 });
        } else {
            const group = L.featureGroup(markers);
            mainMap.flyToBounds(group.getBounds().pad(0.25), { duration: 0.8 });
        }
    }

    // Track intersection ratios to find the most-visible card
    const visibilityMap = new Map();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            visibilityMap.set(entry.target, entry.intersectionRatio);
        });

        let bestCard = null;
        let bestRatio = 0.1;
        visibilityMap.forEach((ratio, card) => {
            if (ratio > bestRatio && card.style.display !== 'none') {
                bestRatio = ratio;
                bestCard = card;
            }
        });

        if (bestCard) {
            const lat = parseFloat(bestCard.dataset.lat);
            const lng = parseFloat(bestCard.dataset.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                mainMap.flyTo([lat, lng], 14, { duration: 0.8 });
                showMarkerFor(bestCard);
                studioCards.forEach(c => c.classList.remove('active-card'));
                bestCard.classList.add('active-card');
            }
        }
    }, {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
    });

    studioCards.forEach(card => observer.observe(card));

    // Click a card → map flies to its location
    studioCards.forEach(card => {
        card.addEventListener('click', () => {
            showMarkerFor(card);
            studioCards.forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');
        });
    });

    // On mobile the cards scroll horizontally — detect which card is centred in the grid
    const studioGrid = document.querySelector('.studio-grid');
    if (studioGrid) {
        studioGrid.addEventListener('scroll', () => {
            const gridRect = studioGrid.getBoundingClientRect();
            const centerX = gridRect.left + gridRect.width / 2;

            let closestCard = null;
            let closestDist = Infinity;

            studioCards.forEach(card => {
                if (card.style.display === 'none') return;
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.left + rect.width / 2;
                const dist = Math.abs(cardCenter - centerX);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestCard = card;
                }
            });

            if (closestCard) {
                const lat = parseFloat(closestCard.dataset.lat);
                const lng = parseFloat(closestCard.dataset.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    mainMap.flyTo([lat, lng], 14, { duration: 0.6 });
                    showMarkerFor(closestCard);
                    studioCards.forEach(c => c.classList.remove('active-card'));
                    closestCard.classList.add('active-card');
                }
            }
        }, { passive: true });
    }

    const genreBackgrounds = {
        classical:    'https://i.pinimg.com/736x/2a/46/22/2a4622dee70bc1e5093a88fc33e824ec.jpg',
        contemporary: 'https://i.pinimg.com/736x/7c/08/37/7c0837747c035d25c27546049777037f.jpg',
        urban:        'https://i.pinimg.com/736x/e6/90/50/e69050ad32a0480c398357cd3a5c55da.jpg',
        jazz:         'https://i.pinimg.com/1200x/d6/8d/19/d68d194b380300c35e6561429826d3c6.jpg',
        ballroom:     'https://i.pinimg.com/736x/32/7d/f0/327df0bd6809f97dd4b6faeedeafe758.jpg',
    };
    const defaultBackground = 'https://i.pinimg.com/736x/10/21/83/102183e94d7d7cb74490d159ff7481f3.jpg';

    function setBackground(url) {
        document.body.style.backgroundImage = `url('${url}')`;
    }

    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const genre = this.getAttribute('data-genre');

            setBackground(genreBackgrounds[genre] || defaultBackground);

            activeMarkers.forEach(m => m.remove());
            activeMarkers = [];

            studioCards.forEach(card => {
                const genres = card.dataset.genres
                    ? card.dataset.genres.toLowerCase().split(' ')
                    : [card.querySelector('.card-tag').textContent.toLowerCase()];

                card.style.display = genre === 'all' || genres.includes(genre) ? '' : 'none';
            });
        });
    });

});
