class ChartManager {
    constructor() {
        this.charts = new Map();
        this.zoomStep = 0.2;
    }

   createChart(canvasId, datasets, root = null, colors = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (this.charts.has(canvasId)) {
        this.charts.get(canvasId).destroy();
    }

    const ctx = canvas.getContext('2d');
    const bounds = this.calculateSmartBounds(datasets, root);
    
    const chartColors = colors || {
        axis: 'rgba(0, 0, 0, 0.8)',
        grid: 'rgba(0, 0, 0, 0.1)'
    };
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: { datasets }, 
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: { size: 11 },
                        filter: function(item, chart) {
                            return item.text && item.text.trim() !== '';
                        },
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels;
                            const labelsOriginal = original.call(this, chart);
                            
                            return labelsOriginal.filter(label => {
                                if (!label.text || label.text.trim() === '') {
                                    return false;
                                }

                                if (!label.fillStyle && !label.strokeStyle) {
                                    return false;
                                }
                                
                                return true;
                            });
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(6);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    type: 'linear', 
                    grid: { 
                        color: chartColors.grid,
                        lineWidth: 0.5
                    },
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.7)',
                        font: { size: 11 }
                    },
                    min: bounds.xMin,
                    max: bounds.xMax,
                    title: {
                        display: false
                    }
                },
                y: { 
                    type: 'linear', 
                    grid: { 
                        color: chartColors.grid,
                        lineWidth: 0.5
                    },
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.7)',
                        font: { size: 11 }
                    },
                    min: bounds.yMin,
                    max: bounds.yMax,
                    title: {
                        display: false
                    }
                }
            }
        }
    });

    this.charts.set(canvasId, chart);
    
    chart.originalBounds = bounds;
    
    this.addZoomButtons(canvasId);
    this.makeDraggable(chart, canvas);
    
    return chart;
}



    generatePoints(func, xMin = -1000, xMax = 1000, points = 20000) {
        const result = [];
        const step = (xMax - xMin) / points;
        
        for (let i = 0; i <= points; i++) {
            const x = xMin + i * step;
            try {
                const y = func(x);
                if (isFinite(y) && Math.abs(y) < 1e6) {
                    result.push({ x, y });
                }
            } catch (e) {}
        }
        return result;
    }

    //показываем решение и ближайшие итерации
    calculateSmartBounds(datasets, root) {
        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;

        datasets.forEach(dataset => {
            if (dataset.showLine === false) { // это точки
                dataset.data.forEach(point => {
                    if (point.x !== undefined) {
                        xMin = Math.min(xMin, point.x);
                        xMax = Math.max(xMax, point.x);
                    }
                    if (point.y !== undefined) {
                        yMin = Math.min(yMin, point.y);
                        yMax = Math.max(yMax, point.y);
                    }
                });
            }
        });

        // есть корень - центрируем вокруг него
        if (root !== null) {
            xMin = Math.min(xMin, root);
            xMax = Math.max(xMax, root);
            yMin = Math.min(yMin, 0);
            yMax = Math.max(yMax, 0);
        }

        // нет данных - стандартная область
        if (!isFinite(xMin)) {
            xMin = -10; xMax = 10;
            yMin = -10; yMax = 10;
        }

        const xRange = Math.max(5, (xMax - xMin) * 1.3);
        const yRange = Math.max(5, (yMax - yMin) * 1.3);
        
        const xCenter = (xMax + xMin) / 2;
        const yCenter = (yMax + yMin) / 2;

        return {
            xMin: xCenter - xRange / 2,
            xMax: xCenter + xRange / 2,
            yMin: yCenter - yRange / 2,
            yMax: yCenter + yRange / 2
        };
    }

    addZoomButtons(canvasId) {
        const chart = this.charts.get(canvasId);
        if (!chart) return;

        const container = document.getElementById(canvasId).parentNode;
        
        const oldButtons = container.querySelector('.zoom-buttons');
        if (oldButtons) oldButtons.remove();

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'zoom-buttons';
        buttonsDiv.style.cssText = `
            position: absolute;
            bottom: 15px;
            left: 15px;
            display: flex;
            gap: 8px;
            z-index: 100;
            background: white;
            padding: 6px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
        `;

        buttonsDiv.innerHTML = `
            <button title="Приблизить" class="zoom-btn zoom-in">+</button>
            <button title="Отдалить" class="zoom-btn zoom-out">−</button>
            <button title="Сбросить" class="zoom-btn reset-btn">⟲</button>
        `;

        container.appendChild(buttonsDiv);

        buttonsDiv.querySelector('.zoom-in').onclick = () => {
            this.zoom(chart, 0.8);
        };

        buttonsDiv.querySelector('.zoom-out').onclick = () => {
            this.zoom(chart, 1.2);
        };

        buttonsDiv.querySelector('.reset-btn').onclick = () => {
            this.resetZoom(chart);
        };
    }

    zoom(chart, factor) {
        const xCenter = (chart.scales.x.max + chart.scales.x.min) / 2;
        const yCenter = (chart.scales.y.max + chart.scales.y.min) / 2;
        
        const xRange = (chart.scales.x.max - chart.scales.x.min) * factor;
        const yRange = (chart.scales.y.max - chart.scales.y.min) * factor;
        
        chart.options.scales.x.min = xCenter - xRange / 2;
        chart.options.scales.x.max = xCenter + xRange / 2;
        chart.options.scales.y.min = yCenter - yRange / 2;
        chart.options.scales.y.max = yCenter + yRange / 2;
        
        chart.update();
    }

    resetZoom(chart) {
        if (!chart.originalBounds) return;
        
        chart.options.scales.x.min = chart.originalBounds.xMin;
        chart.options.scales.x.max = chart.originalBounds.xMax;
        chart.options.scales.y.min = chart.originalBounds.yMin;
        chart.options.scales.y.max = chart.originalBounds.yMax;
        
        chart.update();
    }

    makeDraggable(chart, canvas) {
        let isDragging = false;
        let lastX = 0, lastY = 0;

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;

            const xRange = chart.scales.x.max - chart.scales.x.min;
            const yRange = chart.scales.y.max - chart.scales.y.min;
            
            const moveX = (dx / canvas.width) * xRange * -1;
            const moveY = (dy / canvas.height) * yRange;

            chart.options.scales.x.min += moveX;
            chart.options.scales.x.max += moveX;
            chart.options.scales.y.min -= moveY;
            chart.options.scales.y.max -= moveY;
            
            chart.update();
        });

        ['mouseup', 'mouseleave'].forEach(event => {
            canvas.addEventListener(event, () => {
                isDragging = false;
                canvas.style.cursor = 'default';
            });
        });
    }

    createLine(x1, y1, x2, y2, label, color, dash = false, width = 1) {
        return {
            label,
            data: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
            borderColor: color,
            borderWidth: width,
            borderDash: dash ? [5, 5] : [],
            pointRadius: 0,
            fill: false,
            showLine: true
        };
    }

    createPoint(x, y, label, color, size = 6) {
        return {
            label,
            data: [{ x, y }],
            backgroundColor: color,
            borderColor: color,
            pointRadius: size,
            pointHoverRadius: size + 2,
            showLine: false
        };
    }
}

export default ChartManager;