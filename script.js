const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 描画状態管理
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingHistory = [];
let currentStep = -1;
let activePointerId = null;

// キャンバスのサイズを設定
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (currentStep >= 0) {
        const img = new Image();
        img.src = drawingHistory[currentStep];
        img.onload = () => ctx.drawImage(img, 0, 0);
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 描画の設定を取得
function getDrawingSettings() {
    const color = document.getElementById('colorPicker').value;
    const size = document.getElementById('sizeSlider').value;

    if (currentTool === 'eraser') {
        return {
            strokeStyle: '#ffffff',
            lineWidth: size,
            globalCompositeOperation: 'destination-out',
        };
    } else {
        return {
            strokeStyle: color,
            lineWidth: size,
            globalCompositeOperation: 'source-over',
        };
    }
}

// 一番上のタッチ点を取得
function getTopTouch(touches) {
    let topTouch = null;
    let topY = Infinity;

    for (const touch of touches) {
        if (touch.clientY < topY) {
            topY = touch.clientY;
            topTouch = touch;
        }
    }
    return topTouch;
}

// 描画の開始
function startDrawing(e) {
    e.preventDefault();

    const topTouch = e.type === 'touchstart' ? getTopTouch(e.touches) : e;
    if (!topTouch) return;

    isDrawing = true;
    [lastX, lastY] = [topTouch.clientX, topTouch.clientY];
}

// 描画の実行
function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const topTouch = e.type === 'touchmove' ? getTopTouch(e.touches) : e;
    if (!topTouch) return;

    const settings = getDrawingSettings();
    const [currentX, currentY] = [topTouch.clientX, topTouch.clientY];

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = settings.strokeStyle;
    ctx.lineWidth = settings.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = settings.globalCompositeOperation;
    ctx.stroke();

    [lastX, lastY] = [currentX, currentY];
}

// 描画の終了
function stopDrawing(e) {
    e.preventDefault();
    if (!isDrawing) return;

    isDrawing = false;
    saveState(); // 描画履歴に保存
}

// 描画状態の保存
function saveState() {
    currentStep++;
    drawingHistory = drawingHistory.slice(0, currentStep); // 元に戻す履歴を切り詰める
    drawingHistory.push(canvas.toDataURL());
}

// イベントリスナーの設定
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// ツールバー機能
let currentTool = 'pen';
document.getElementById('penTool').addEventListener('click', () => {
    currentTool = 'pen';
});
document.getElementById('eraserTool').addEventListener('click', () => {
    currentTool = 'eraser';
});

// キャンバスをクリア
document.getElementById('clearButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
});

// 元に戻す
document.getElementById('undoButton').addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        const img = new Image();
        img.src = drawingHistory[currentStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

// サイズと色の変更
document.getElementById('sizeSlider').addEventListener('input', updateSizePreview);
document.getElementById('colorPicker').addEventListener('input', updateSizePreview);

// 初期状態
saveState();
updateSizePreview();
