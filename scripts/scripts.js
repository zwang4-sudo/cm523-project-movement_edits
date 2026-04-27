document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const studioCards = document.querySelectorAll('.studio-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');

            const genre = this.getAttribute('data-genre');

            studioCards.forEach(card => {
                const genres = card.dataset.genres
                    ? card.dataset.genres.toLowerCase().split(' ')
                    : [card.querySelector('.card-tag').textContent.toLowerCase()];

                if (genre === 'all' || genres.includes(genre)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});