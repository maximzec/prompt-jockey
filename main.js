const playBtn = document.getElementById('play-btn');
const trackBar = document.getElementById('track-bar');
let isPlaying = false;
let animationSpeed = 0.02; // Уменьшаем базовую скорость

playBtn.addEventListener('click', function () {
    playBtn.classList.add('paused');

    setTimeout(() => {
        isPlaying = !isPlaying;
        playBtn.classList.remove('paused');

        // Добавляем/убираем класс для анимации
        if (isPlaying) {
            playBtn.classList.add('playing');
            trackBar.classList.add('playing');
            animationSpeed = 0.08; // Значительно увеличиваем скорость при воспроизведении
        } else {
            playBtn.classList.remove('playing');
            trackBar.classList.remove('playing');
            animationSpeed = 0.02; // Возвращаем медленную скорость
        }
    }, 250);
});

// Обработка бегунков - влияют на визуализацию
let tempo = 120;
let mood = 50;
let complexity = 5;

// Knob functionality
class Knob {
    constructor(element) {
        this.element = element;
        this.pointer = element.querySelector('.knob-pointer');
        this.valueDisplay = element.querySelector('.knob-value');
        this.min = parseInt(element.dataset.min);
        this.max = parseInt(element.dataset.max);
        this.value = parseInt(element.dataset.value);
        this.isDragging = false;
        this.startAngle = 0;
        this.startValue = this.value;

        this.init();
    }

    init() {
        this.updateDisplay();
        this.attachEvents();
    }

    attachEvents() {
        this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Touch events for mobile
        this.element.addEventListener('touchstart', this.onTouchStart.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this));
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onMouseDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startAngle = this.getAngleFromEvent(e);
        this.startValue = this.value;
        this.element.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const currentAngle = this.getAngleFromEvent(e);
        const angleDiff = currentAngle - this.startAngle;
        const valueRange = this.max - this.min;
        const newValue = this.startValue + (angleDiff / 270) * valueRange;

        this.setValue(Math.max(this.min, Math.min(this.max, newValue)));
    }

    onMouseUp() {
        this.isDragging = false;
        this.element.style.cursor = 'pointer';
    }

    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseDown(touch);
    }

    onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseMove(touch);
    }

    onTouchEnd(e) {
        e.preventDefault();
        this.onMouseUp();
    }

    getAngleFromEvent(e) {
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = e.clientX - centerX;
        const y = e.clientY - centerY;
        return Math.atan2(y, x) * (180 / Math.PI);
    }

    setValue(newValue) {
        this.value = Math.round(newValue);
        this.updateDisplay();
        this.onValueChange();
    }

    updateDisplay() {
        // Calculate rotation angle (0 degrees = top, range: -135 to +135 degrees)
        const percentage = (this.value - this.min) / (this.max - this.min);
        const angle = -135 + (percentage * 270); // Range from -135 to +135 degrees

        this.pointer.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        this.valueDisplay.textContent = this.value;
    }

    onValueChange() {
        // Update global variables based on knob id
        if (this.element.id === 'tempo-knob') {
            tempo = this.value;
        } else if (this.element.id === 'mood-knob') {
            mood = this.value;
        } else if (this.element.id === 'complexity-knob') {
            complexity = this.value;
        }
    }
}

// Initialize knobs
const tempoKnob = new Knob(document.getElementById('tempo-knob'));
const moodKnob = new Knob(document.getElementById('mood-knob'));
const complexityKnob = new Knob(document.getElementById('complexity-knob'));

// Визуализация волны в стиле DJ пульта с частотным разделением
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('waveform');
    const trackBar = document.getElementById('track-bar');

    if (!canvas) return;

    // Устанавливаем размеры canvas
    const updateCanvasSize = () => {
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth * 2;
        canvas.height = container.offsetHeight * 2;
        canvas.style.width = container.offsetWidth + 'px';
        canvas.style.height = container.offsetHeight + 'px';
    };

    updateCanvasSize();

    const ctx = canvas.getContext('2d');
    const barsCount = 80; // Уменьшаем количество баров для минималистичности
    let phase = 0;
    let horizontalShift = 0; // Горизонтальный сдвиг для движения слева направо

    // Отрисовка анимации лиловых баров
    function drawWaveform() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / barsCount;
        const maxBarHeight = canvas.height * 0.6; // Уменьшаем максимальную высоту для минималистичности
        const centerY = canvas.height / 2;

        for (let i = 0; i < barsCount; i++) {
            const x = i * barWidth;

            // Создаем более плавную волнообразную высоту баров с горизонтальным сдвигом
            const waveHeight = Math.sin((i * 0.08) + phase + horizontalShift) * 0.4 + 0.6; // Уменьшаем амплитуду
            const randomVariation = Math.sin((i * 0.03) + phase * 0.5 + horizontalShift * 0.3) * 0.2 + 0.8; // Меньше вариаций

            // Учитываем параметры слайдеров
            const tempoInfluence = tempo / 120;
            const moodInfluence = (mood / 100) * 0.7 + 0.3; // Минимальное влияние настроения
            const complexityInfluence = (complexity / 10) * 0.5 + 0.5; // Меньше влияние сложности

            let finalHeight = (waveHeight * randomVariation * moodInfluence * complexityInfluence) * maxBarHeight;

            // Устанавливаем минимальную высоту для всех баров при старте (середина)
            if (!isPlaying) {
                finalHeight = maxBarHeight * 0.3; // Все бары одинаковой средней высоты при остановке
            }

            // Более тонкий лиловый цвет для минималистичности
            const opacity = isPlaying ? 0.8 : 0.4; // Меньше непрозрачности когда не играет
            ctx.fillStyle = `rgba(139, 69, 179, ${opacity})`; // Простой лиловый цвет без градиента

            // Рисуем тонкие бары от центра вверх и вниз
            const barThickness = barWidth * 0.6; // Делаем бары тоньше
            const barX = x + (barWidth - barThickness) / 2; // Центрируем тонкие бары

            ctx.fillRect(barX, centerY - finalHeight / 2, barThickness, finalHeight);

            // Убираем свечение для минималистичности
        }

        phase += animationSpeed * (tempo / 120);

        // Добавляем горизонтальное движение только при воспроизведении
        if (isPlaying) {
            horizontalShift += 0.05 * (tempo / 120); // Более медленное движение
        }

        requestAnimationFrame(drawWaveform);
    }

    // Интерактивность - клик для изменения параметров
    trackBar.addEventListener('click', (e) => {
        const rect = trackBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;

        // Изменяем сложность в зависимости от позиции клика
        const newComplexity = Math.floor(percentage * 10) + 1;
        complexityKnob.setValue(newComplexity);
    });

    // Инициализация
    drawWaveform();

    // Обновление при изменении размера окна
    window.addEventListener('resize', () => {
        updateCanvasSize();
    });
}); 