// Код для плавной прокрутки (если есть)
// document.querySelectorAll('a[href^="#"]').forEach(anchor => { ... });

// --- Тетрис --- 

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris-board');
    if (!canvas) return; // Если канваса нет на странице, ничего не делаем

    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('tetris-score');
    const startButton = document.getElementById('tetris-start-button');

    const ROWS = 20; // Количество рядов
    const COLS = 10; // Количество колонок
    const BLOCK_SIZE = canvas.width / COLS; // Размер одного блока
    const EMPTY_COLOR = '#f7f7f7'; // Цвет пустой ячейки (фон поля)

    // Цвета и формы Тетромино
    const PIECES = [
        { shape: [[1, 1, 1, 1]], color: 'cyan' },    // I
        { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O
        { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },// T
        { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' }, // S
        { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },    // Z
        { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },   // J
        { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' }  // L
    ];

    let board = []; // Игровое поле (массив)
    let score = 0;
    let gameOver = false;
    let gameInterval = null;
    let currentPiece = null; // Текущая фигура
    let currentRow = 0;    // Текущая строка для верхнего левого угла фигуры
    let currentCol = 0;    // Текущая колонка для верхнего левого угла фигуры

    // Функция вращения матрицы (фигуры) по часовой стрелке
    function rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const newMatrix = [];
        for (let j = 0; j < cols; j++) {
            newMatrix[j] = Array(rows).fill(0);
        }
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                newMatrix[j][rows - 1 - i] = matrix[i][j];
            }
        }
        return newMatrix;
    }

    // Функция проверки столкновений
    function collision(shape, x, y) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                // Если это блок фигуры
                if (shape[r][c] === 1) {
                    let newX = x + c;
                    let newY = y + r;

                    // Проверка выхода за границы поля
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true; // Столкновение с границей
                    }
                    // Проверка выхода за верхнюю границу (важно при вращении)
                    if (newY < 0) { 
                        // Для обычного падения это не актуально, но для вращения может быть
                        // Если блок фигуры оказался бы выше поля, это столкновение
                        // (Хотя обычно фигуры появляются так, что это не случается без вращения)
                        continue; // Пока пропускаем, т.к. фигуры падают сверху вниз
                    }
                    // Проверка наложения на уже существующий блок на доске
                    // Убедимся, что board[newY] существует перед обращением к board[newY][newX]
                    if (board[newY] && board[newY][newX] !== EMPTY_COLOR) {
                        return true; // Столкновение с другим блоком
                    }
                }
            }
        }
        return false; // Нет столкновений
    }

    // Функция фиксации фигуры на доске
    function lockPiece() {
        if (!currentPiece) return;
        currentPiece.shape.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value === 1) {
                    // Условие newY < ROWS уже проверяется в collision, но для надежности можно оставить
                    // Также важно, чтобы не записывать блоки выше верхней границы поля, если такое возможно
                    if (currentRow + r >= 0 && currentRow + r < ROWS) { 
                        board[currentRow + r][currentCol + c] = currentPiece.color;
                    }
                }
            });
        });
    }

    // Функция очистки заполненных линий и подсчета очков
    function removeFullLines() {
        let linesRemoved = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            let isLineFull = true;
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === EMPTY_COLOR) {
                    isLineFull = false;
                    break;
                }
            }

            if (isLineFull) {
                linesRemoved++;
                // Удаляем линию, сдвигая все верхние ряды вниз
                for (let y = r; y > 0; y--) {
                    for (let c = 0; c < COLS; c++) {
                        board[y][c] = board[y - 1][c];
                    }
                }
                // Верхний ряд становится пустым
                for (let c = 0; c < COLS; c++) {
                    board[0][c] = EMPTY_COLOR;
                }
                r++; // Проверяем тот же ряд снова, так как он сместился
            }
        }

        // Начисление очков
        if (linesRemoved > 0) {
            if (linesRemoved === 1) score += 100;
            else if (linesRemoved === 2) score += 300;
            else if (linesRemoved === 3) score += 500;
            else if (linesRemoved >= 4) score += 800; // Тетрис!
            updateScoreDisplay();
        }
    }

    // Инициализация пустого поля
    function initBoard() {
        for (let r = 0; r < ROWS; r++) {
            board[r] = [];
            for (let c = 0; c < COLS; c++) {
                board[r][c] = EMPTY_COLOR; // Или 0, если будем хранить только занятость
            }
        }
    }

    // Отрисовка игрового поля
    function drawBoard() {
        // Отрисовка фона поля (пустых ячеек, которые не являются частью упавших фигур)
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                // Если на доске в этой ячейке EMPTY_COLOR (или 0), то рисуем фон
                // Если там цвет фигуры, то он уже нарисован drawPiece (в будущем - будет частью доски)
                if (board[r][c] === EMPTY_COLOR) {
                    drawSquare(c, r, EMPTY_COLOR);
                } else {
                    // Это для отрисовки уже "упавших" и зафиксированных фигур
                    drawSquare(c, r, board[r][c]);
                }
            }
        }
        // Отрисовка сетки
        context.strokeStyle = '#ccc';
        for (let c = 0; c <= COLS; c++) {
            context.beginPath();
            context.moveTo(c * BLOCK_SIZE, 0);
            context.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            context.stroke();
        }
        for (let r = 0; r <= ROWS; r++) {
            context.beginPath();
            context.moveTo(0, r * BLOCK_SIZE);
            context.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
            context.stroke();
        }
    }

    // Вспомогательная функция для отрисовки одного квадрата
    function drawSquare(x, y, color) {
        context.fillStyle = color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        // Если цвет не фоновый, можно добавить обводку блоку
        if (color !== EMPTY_COLOR) {
            context.strokeStyle = '#333'; // Цвет обводки блока
            context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    // Обновление счета
    function updateScoreDisplay() {
        if (scoreElement) scoreElement.textContent = score;
    }

    // Сброс игры
    function resetGame() {
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = null; // Сбрасываем интервал
        initBoard();
        spawnNewPiece(); // Создаем и размещаем новую фигуру
        score = 0;
        updateScoreDisplay();
        gameOver = false;
        drawBoard(); // Первоначальная отрисовка пустого поля
        drawPiece(); // Отрисовка первой фигуры
    }
    
    // Создание новой фигуры
    function spawnNewPiece() {
        const randomIndex = Math.floor(Math.random() * PIECES.length);
        currentPiece = PIECES[randomIndex];
        // Начальное положение фигуры (вверху, по центру)
        currentRow = 0;
        currentCol = Math.floor((COLS - currentPiece.shape[0].length) / 2);
        // TODO: Проверка на Game Over, если фигура не может появиться
    }

    // Отрисовка текущей фигуры
    function drawPiece() {
        if (!currentPiece) return;
        currentPiece.shape.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value === 1) {
                    drawSquare(currentCol + c, currentRow + r, currentPiece.color);
                }
            });
        });
    }

    // Начало игры
    function startGame() {
        resetGame();
        if (gameOver) return; // Если игра уже была окончена и просто нажали рестарт

        // Запускаем игровой цикл, если он еще не запущен
        if (!gameInterval) { 
            gameInterval = setInterval(gameLoop, 700); // Скорость падения - пока 700мс
        }
        if (startButton) startButton.textContent = "Перезапустить";
        console.log("Tetris game started or reset with a new piece");
    }

    if (startButton) {
        startButton.addEventListener('click', startGame);
    }

    // Основной игровой цикл
    function gameLoop() {
        if (gameOver) {
            clearInterval(gameInterval);
            gameInterval = null; // Останавливаем игру
            alert("Игра окончена! Ваш счет: " + score);
            if (startButton) startButton.textContent = "Начать Игру";
            return;
        }
        // Стереть старое положение фигуры
        erasePiece(); // Если вы решите использовать этот метод

        // Переместить фигуру вниз
        currentRow++;

        // Проверить на столкновение
        if (collision(currentPiece.shape, currentCol, currentRow)) {
            currentRow--; // Вернуть на предыдущую позицию
            lockPiece();
            removeFullLines();
            spawnNewPiece();
            // Проверка на Game Over сразу после появления новой фигуры
            if (collision(currentPiece.shape, currentCol, currentRow)) {
                gameOver = true;
                // gameLoop сам обработает gameOver в следующей итерации или в начале
            }
        }
        // Отрисовать все заново
        drawBoard();
        drawPiece();
    }

    // Вспомогательная функция для стирания текущей фигуры (если нужна для более чистого перемещения)
    // Сейчас не используется активно, так как drawBoard() перерисовывает все поле.
    function erasePiece() {
        if (!currentPiece) return;
        currentPiece.shape.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value === 1) {
                    // Проверяем, что не выходим за границы поля при стирании
                    if (currentRow + r >= 0 && currentRow + r < ROWS && currentCol + c >= 0 && currentCol + c < COLS) {
                        drawSquare(currentCol + c, currentRow + r, EMPTY_COLOR); 
                    }
                }
            });
        });
    }

    // Обработка нажатий клавиш
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) {
        if (gameOver || !currentPiece) return;

        let moved = false;
        let newCol = currentCol;
        let newRow = currentRow;

        // Стрелка влево или A
        if (event.key === 'ArrowLeft' || event.code === 'KeyA') {
            if (!collision(currentPiece.shape, currentCol - 1, currentRow)) {
                newCol = currentCol - 1;
                moved = true;
            }
        }
        // Стрелка вправо или D
        else if (event.key === 'ArrowRight' || event.code === 'KeyD') {
            if (!collision(currentPiece.shape, currentCol + 1, currentRow)) {
                newCol = currentCol + 1;
                moved = true;
            }
        }
        // Стрелка вниз или S (ускорение падения)
        else if (event.key === 'ArrowDown' || event.code === 'KeyS') {
            if (!collision(currentPiece.shape, currentCol, currentRow + 1)) {
                newRow = currentRow + 1;
                moved = true;
            } else {
                // Если дальше вниз нельзя, фиксируем фигуру
                lockPiece();
                removeFullLines();
                spawnNewPiece();
                if (collision(currentPiece.shape, currentCol, currentRow)) {
                    gameOver = true;
                }
            }
        }
        // Стрелка вверх или W (вращение)
        else if (event.key === 'ArrowUp' || event.code === 'KeyW') {
            const rotatedShape = rotateMatrix(currentPiece.shape);
            if (!collision(rotatedShape, currentCol, currentRow)) {
                currentPiece.shape = rotatedShape;
                moved = true;
            }
        }

        if (moved) {
            erasePiece(); // Стираем старое положение, если используем этот метод
            currentCol = newCol;
            currentRow = newRow;
            drawBoard(); // Перерисовываем доску
            drawPiece(); // Рисуем фигуру на новом месте
        }
    }

    // Инициализация игры при загрузке страницы
    resetGame(); // Вызываем для начальной настройки и отрисовки

}); // Конец обработчика DOMContentLoaded для Тетриса

// --- Конец Тетриса ---

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

