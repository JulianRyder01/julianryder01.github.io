const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const imageStatus = document.getElementById('imageStatus');

let originalImage = new Image();
let originalImageRatio = 1; // 存储原始图片的缩放比例，用于坐标转换

/**
 * 将坐标字符串转换为数组 [x1, y1, x2, y2]
 * @param {string} coordsStr - 格式为 "x1,y1,x2,y2" 的字符串
 * @returns {number[] | null}
 */
function parseCoords(coordsStr) {
    try {
        const parts = coordsStr.split(',').map(p => parseInt(p.trim()));
        if (parts.length === 4 && parts.every(Number.isInteger)) {
            return parts;
        }
    } catch (e) {
        console.error("坐标解析失败:", e);
    }
    return null;
}

/**
 * 核心绘图函数：在指定坐标框内绘制文本
 * @param {string} text - 要绘制的文本
 * @param {string} coordsStr - 坐标字符串 "x1,y1,x2,y2" (原始图片像素)
 * @param {string} fontName - 字体名称 (Web Font)
 * @param {number} fontSize - 字体大小 (原始图片像素)
 * @param {string} alignment - 对齐方式: 'center', 'left', 'right'
 * @param {number} spacing - 字符间距 (仅用于 top_time)
 */
function drawTextInBox(text, coordsStr, fontName, fontSize, alignment, spacing = 0) {
    const coords = parseCoords(coordsStr);
    if (!coords) return;

    const [x1, y1, x2, y2] = coords;
    const boxWidth = x2 - x1;
    const boxHeight = y2 - y1;

    // 1. 绘制黑色背景矩形
    ctx.fillStyle = '#161616';
    ctx.fillRect(x1, y1, boxWidth, boxHeight);
    
    // 2. 准备文本样式
    ctx.fillStyle = '#D0D0D0';
    ctx.font = `${fontSize}px ${fontName}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; // 使用 left/right 作为基础，自行计算居中

    // 3. 计算文本绘制的 X 坐标
    let drawX;
    let totalTextWidth;

    if (spacing === 0) { // 绘制普通文本
        totalTextWidth = ctx.measureText(text).width;
        
        if (alignment === 'left') drawX = x1;
        else if (alignment === 'right') drawX = x2 - totalTextWidth;
        else drawX = x1 + (boxWidth - totalTextWidth) / 2;
        
        ctx.fillText(text, drawX, y1 + boxHeight / 2);
        
    } else { // 绘制带间距的文本 (top_time)
        let currentX = x1;
        totalTextWidth = 0;
        let charWidths = [];
        
        // 计算带间距的总宽度
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = ctx.measureText(char).width;
            charWidths.push(charWidth);
            totalTextWidth += charWidth;
            if (i < text.length - 1) {
                totalTextWidth += spacing;
            }
        }
        
        if (alignment === 'left') currentX = x1;
        else if (alignment === 'right') currentX = x2 - totalTextWidth;
        else currentX = x1 + (boxWidth - totalTextWidth) / 2;

        // 逐字绘制
        const drawY = y1 + boxHeight / 2;
        for (let i = 0; i < text.length; i++) {
            ctx.fillText(text[i], currentX, drawY);
            currentX += charWidths[i] + spacing;
        }
    }
}

/**
 * 生成一个简单的随机交易单号
 * @param {Date} forDate - 用于生成日期的 Date 对象
 * @returns {string}
 */
function generateTransactionId(forDate) {
    const prefix = "4200002564";
    const year = forDate.getFullYear().toString();
    const month = (forDate.getMonth() + 1).toString().padStart(2, '0');
    const day = forDate.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const randomDigits = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `${prefix}${dateStr}${randomDigits}`;
}

/**
 * 主绘制函数：读取所有输入并更新 Canvas
 */
window.redrawCanvas = function() {
    if (!originalImage.src) return;

    // 清除 Canvas 并绘制原图
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0);

    // 获取所有参数
    const mainFontSize = parseInt(document.getElementById('mainFontSize').value) || 52;
    const topTimeFontSize = parseInt(document.getElementById('topTimeFontSize').value) || 46;
    const topTimeSpacing = parseInt(document.getElementById('topTimeSpacing').value) || 0;
    const alignment = document.getElementById('alignment').value;
    const defaultFont = "Microsoft YaHei UI, SimHei, Arial, sans-serif"; // Web安全字体
    
    const today = new Date();
    document.getElementById('dateText').value = document.getElementById('dateText').value || `${today.getFullYear()}年${(today.getMonth() + 1).toString().padStart(2, '0')}月${today.getDate().toString().padStart(2, '0')}日`;
    document.getElementById('transactionIdText').value = generateTransactionId(today);
    
    // 1. 绘制日期
    drawTextInBox(
        document.getElementById('dateText').value,
        document.getElementById('dateCoords').value,
        defaultFont,
        mainFontSize,
        alignment
    );
    
    // 2. 绘制支付时分秒
    drawTextInBox(
        document.getElementById('paymentTimeText').value,
        document.getElementById('paymentTimeCoords').value,
        defaultFont,
        mainFontSize,
        alignment
    );

    // 3. 绘制交易单号
    drawTextInBox(
        document.getElementById('transactionIdText').value,
        document.getElementById('transactionIdCoords').value,
        defaultFont,
        mainFontSize,
        alignment
    );
    
    // 4. 绘制左上角时间 (使用独立字号和字间距)
    drawTextInBox(
        document.getElementById('topTimeText').value,
        document.getElementById('topTimeCoords').value,
        defaultFont,
        topTimeFontSize,
        alignment,
        topTimeSpacing
    );
    
    // 更新 Canvas 尺寸信息 (提示用户当前坐标是基于这个尺寸)
    document.getElementById('canvasSizeInfo').innerText = `原图尺寸: ${canvas.width}x${canvas.height} 像素。所有坐标基于此尺寸。`;
};

/**
 * 处理图片加载
 */
imageLoader.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage.onload = () => {
            imageStatus.innerText = `图片已加载: ${originalImage.width}x${originalImage.height}`;
            redrawCanvas(); // 首次加载后绘制
        };
        originalImage.src = event.target.result;
    };
    if (e.target.files[0]) {
        reader.readAsDataURL(e.target.files[0]);
    }
});

/**
 * 图片下载函数
 */
window.downloadImage = function() {
    if (!originalImage.src) {
        alert("请先加载图片！");
        return;
    }
    // 确保最新状态已绘制
    redrawCanvas(); 
    
    const link = document.createElement('a');
    link.download = `modified_image_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("图片已生成并下载。");
}

// 页面加载完成时尝试加载默认图片
document.addEventListener('DOMContentLoaded', () => {
    // 尝试加载同目录下的默认图片 pay.png
    originalImage.onload = () => {
        imageStatus.innerText = `默认图片加载成功: ${originalImage.width}x${originalImage.height}`;
        redrawCanvas();
    };
    originalImage.onerror = () => {
        imageStatus.innerText = "未找到默认图片 'pay.png'，请手动加载。";
    };
    originalImage.src = 'pay.png';
});
