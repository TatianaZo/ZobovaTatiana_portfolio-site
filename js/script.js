// Код для плавной прокрутки (если есть)
// document.querySelectorAll('a[href^="#"]').forEach(anchor => { ... });

// --- Лайтбокс для синематиков ---
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, существует ли элемент лайтбокса на текущей странице
    const lightbox = document.getElementById('cinematic-lightbox');
    if (!lightbox) {
        return; // Если лайтбокса нет, ничего не делаем на этой странице
    }

    const videoPlayer = document.getElementById('lightbox-video-player');
    const closeButton = document.getElementById('lightbox-close');
    const watchButtons = document.querySelectorAll('.btn-watch-cinematic');

    // Если остальные элементы для лайтбокса не найдены (хотя должны быть, если есть lightbox)
    if (!videoPlayer || !closeButton) {
        console.error("Lightbox component(s) missing!");
        return;
    }

    watchButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const videoId = button.getAttribute('data-video-src'); // Теперь это ID видео
            if (videoId) {
                // Формируем URL для встраивания YouTube видео
                // Добавляем autoplay=1 для автоматического воспроизведения и rel=0 для скрытия похожих видео
                const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`; 
                videoPlayer.setAttribute('src', embedUrl);
                lightbox.style.display = 'flex'; 
                // videoPlayer.play(); // Для iframe это не нужно, autoplay в URL
            } else {
                console.error('Video ID not found for button:', button);
            }
        });
    });

    function closeLightbox() {
        lightbox.style.display = 'none';
        // videoPlayer.pause(); // Для iframe не так актуально
        videoPlayer.setAttribute('src', ''); // Очищаем src у iframe, чтобы остановить видео и загрузку
    }

    closeButton.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) { // Закрывать только при клике на сам оверлей
            closeLightbox();
        }
    });
});
// --- Конец Лайтбокса ---

