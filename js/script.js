// Код для плавной прокрутки (если есть)
// document.querySelectorAll('a[href^="#"]').forEach(anchor => { ... });

// --- Мини-Игра "Котик и Креветки" ---

// Игровые элементы DOM
const gameArea = document.getElementById('game-area');
const catImage = document.getElementById('cat-image'); // Теперь это img
const catPaw = document.getElementById('cat-paw-image'); // Обновленный ID и теперь это img
const scoreDisplay = document.getElementById('score');
const gameOverMessage = document.getElementById('game-over-message');
const restartButton = document.getElementById('restart-button');
const actionButton = document.getElementById('action-button');
// const catSadImage = document.getElementById('cat-sad-placeholder'); // или cat-sad-image если используем img

// Игровые переменные
let score = 0;
let gameInterval;
let objects = []; // Массив для хранения "проплывающих" объектов
let gameSpeed = 5; // Скорость движения объектов (пикселей за кадр)
let objectCreationInterval = 3500; // Интервал создания новых объектов (мс)
let isGameOver = false;
let isAttacking = false; // Флаг, чтобы предотвратить многократное быстрое нажатие

// --- Инициализация игры ---
function initGame() {
    isGameOver = false;
    score = 0;
    updateScoreDisplay();
    gameOverMessage.style.display = 'none';
    actionButton.disabled = false;
    objects.forEach(obj => obj.element.remove()); // Удаляем старые объекты
    objects = [];
    
    // Сброс положения лапки, если оно менялось не только через класс
    if (catPaw) {
        catPaw.classList.remove('attacking');
    }
    // catImage.src = 'assets/cat_normal.png'; // Вернуть нормального кота

    startGameLoop();
}

// --- Игровой цикл --- 
function startGameLoop() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        if (isGameOver) {
            clearInterval(gameInterval);
            return;
        }
        moveObjects();
        //createRandomObject(); // Пока не вызываем, создадим вручную для теста
    }, 50); // Частота обновления игрового поля (мс)

    // Отдельный интервал для создания объектов
    if (objectCreatorInterval) clearInterval(objectCreatorInterval);
    objectCreatorInterval = setInterval(createRandomObject, objectCreationInterval);
}
let objectCreatorInterval; // для управления интервалом создания объектов

// --- Действие: Удар лапкой ---
function pawAttack() {
    if (isGameOver || isAttacking || !catPaw || !cat) return;

    isAttacking = true;
    catPaw.classList.add('attacking');

    // Предполагаемая длина "вытянутой" лапы от ее точки вращения (top center)
    // Это значение нужно будет подобрать экспериментально!
    const pawReach = 80; // Например, 80px
    // Угол атаки лапы в радианах (70 градусов)
    const attackAngle = 70 * Math.PI / 180;

    // Координаты "кончика" лапы в момент максимального удара
    // Центр кота по X: cat.offsetLeft + cat.offsetWidth / 2
    // Смещение лапы от центра кота по X примерно 0, т.к. translateX(-50%)
    // Начало лапы по Y: cat.offsetTop + catPaw.offsetTop (относительно gameArea)
    const pawPivotX = cat.offsetLeft + (cat.offsetWidth / 2) + (catPaw.offsetLeft + catPaw.offsetWidth / 2 - cat.offsetWidth / 2); // X точки вращения лапы
    const pawPivotY = cat.offsetTop + catPaw.offsetTop;

    const pawTipX = pawPivotX + pawReach * Math.sin(attackAngle); // X кончика лапы
    const pawTipY = pawPivotY + pawReach * Math.cos(attackAngle); // Y кончика лапы

    objects.forEach(obj => {
        if (!obj.hit) { 
            const objRect = obj.element.getBoundingClientRect();
            const gameAreaRect = gameArea.getBoundingClientRect();

            const objLeft = objRect.left - gameAreaRect.left;
            const objRight = objRect.right - gameAreaRect.left;
            const objTop = objRect.top - gameAreaRect.top;
            const objBottom = objRect.bottom - gameAreaRect.top;

            // Проверка попадания: кончик лапы (pawTipX, pawTipY) должен быть внутри объекта
            if (pawTipX >= objLeft && pawTipX <= objRight &&
                pawTipY >= objTop && pawTipY <= objBottom) {
                handleHit(obj);
            }
        }
    });

    setTimeout(() => {
        catPaw.classList.remove('attacking');
        isAttacking = false;
    }, 150); 
}

// --- Создание случайного объекта (креветка/конфетка) ---
function createRandomObject() {
    if (isGameOver || !gameArea) return;

    const type = Math.random() < 0.6 ? 'shrimp' : 'candy'; 
    const objectElement = document.createElement('div');
    objectElement.classList.add('game-object', type);
    objectElement.textContent = type === 'shrimp' ? '🦐' : '🍬'; 

    // Начальное положение: справа за пределами gameArea, Y фиксирован снизу CSS-ом (bottom: 10px)
    objectElement.style.right = '-50px'; 
    // objectElement.style.bottom = '10px'; // Уже задано в CSS, но можно и тут для ясности
    // Удаляем установку top, так как теперь позиционируем по bottom
    // const randomTop = Math.random() * (gameArea.clientHeight - 80 - 50) + 50; 
    // objectElement.style.top = `${randomTop}px`;

gameArea.appendChild(objectElement);
    objects.push({ element: objectElement, type: type, hit: false });
}

// --- Движение объектов ---
function moveObjects() {
    objects = objects.filter(obj => {
        let currentRight = parseFloat(obj.element.style.right);
        currentRight += gameSpeed;
        obj.element.style.right = `${currentRight}px`;

        // Удаляем объект, если он ушел далеко за левый край
        if (currentRight > gameArea.offsetWidth + 50) { 
            obj.element.remove();
            return false; // Удалить из массива
        }
        return true; // Оставить в массиве
    });
}

// --- Обработка попадания ---
function handleHit(object) {
    if (object.hit) return; // Уже обработано
    object.hit = true; 
    // Можно добавить эффект исчезновения или анимацию "ловли"
    object.element.style.opacity = '0.5'; // Полупрозрачный при попадании
    // object.element.remove(); // Или сразу удаляем

    if (object.type === 'shrimp') {
        score++;
    } else if (object.type === 'candy') {
        score--;
    }
    updateScoreDisplay();
    checkGameOver();
}

// --- Обновление счета ---
function updateScoreDisplay() {
    if(scoreDisplay) scoreDisplay.textContent = score;
}

// --- Проверка на конец игры ---
function checkGameOver() {
    if (score < 0) {
        isGameOver = true;
        if(gameOverMessage) gameOverMessage.style.display = 'block';
        if(actionButton) actionButton.disabled = true;
        // catImage.src = 'assets/cat_sad.png'; // Показать грустного кота
        // или catSadPlaceholder.style.display = 'block';
        if(objectCreatorInterval) clearInterval(objectCreatorInterval); // Остановить создание новых объектов
    }
}

// --- Слушатели событий ---
if (actionButton) {
    actionButton.addEventListener('click', pawAttack);
}
if (restartButton) {
    restartButton.addEventListener('click', initGame);
}

// --- Запуск игры при загрузке страницы ---
// Вызываем initGame, когда DOM полностью загружен
document.addEventListener('DOMContentLoaded', () => {
    // Проверка наличия элементов перед инициализацией, чтобы не было ошибок на других страницах
    if (document.getElementById('mini-game-section')) {
        initGame();
    }
});

// Получение ссылки на кота для точного позиционирования лапы (если нужно)
const cat = document.getElementById('cat'); 