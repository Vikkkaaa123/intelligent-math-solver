import ChartManager from './chart-manager.js';

class ChartBuilder {
    constructor(mathParser) {
        this.parser = mathParser;
        this.chartManager = new ChartManager();
        
        this.colors = {
            function: 'rgba(59, 130, 246, 1)',      // синий
            process: 'rgba(245, 158, 11, 0.8)',    // оранжевый
            processLight: 'rgba(245, 158, 11, 0.3)', // светлый оранжевый
            solution: 'rgba(239, 68, 68, 1)',      // красный
            axis: 'rgba(0, 0, 0, 0.8)',            // черный
            grid: 'rgba(0, 0, 0, 0.1)',
            gray: 'rgba(100, 100, 100, 0.7)',       // серый
            initial: 'rgba(16, 185, 129, 1)',      // зеленый
        };
    }


drawEquationChart(funcStr, root, iterations, methodType) {
    try {
        const func = this.parser.parseFunction(funcStr);
        const datasets = [];
        
        // ось Ох
        datasets.push({
            data: [
                { x: -1000000, y: 0 },
                { x: 1000000, y: 0 }
            ],
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: '' 
        });
        
        // ось Оу  
        datasets.push({
            data: [
                { x: 0, y: -1000000 },
                { x: 0, y: 1000000 }
            ],
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: '' 
        });
            
            // график функции
            const points = this.chartManager.generatePoints(func, -10000, 10000, 10000);
            datasets.push({
                label: `f(x) = ${funcStr}`,
                data: points,
                borderColor: this.colors.function,
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                showLine: true,
                tension: 0.1
            });
            
            // визуализация метода
            switch(methodType) {
                case 'newton':
                    this.drawNewton(datasets, func, root, iterations);
                    break;
                case 'secant':
                    this.drawSecant(datasets, func, root, iterations);
                    break;
                case 'bisection':
                    this.drawBisection(datasets, func, root, iterations);
                    break;
                case 'iteration':
                    this.drawIteration(datasets, func, root, iterations);
                    break;
            }
            
            // решение - КРАСНЫЙ
            if (root !== null) {
                datasets.push({
                    label: 'Решение',
                    data: [{ x: root, y: 0 }],
                    backgroundColor: this.colors.solution,
                    borderColor: this.colors.solution,
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    showLine: false
                });
            }
            
            // создаем график
            this.chartManager.createChart('equation-chart', datasets, root, this.colors);
            return true;
            
        } catch (error) {
            console.error('Ошибка рисования:', error);
            return false;
        }
    }

// Метод Ньютона
  drawNewton(datasets, func, root, iterations) {
    if (!Array.isArray(iterations) || iterations.length === 0) return;
    
    const tangentPoints = [];
    const iterationPoints = [];
    
    iterations.forEach((iter, i) => {
        if (!iter.x || !iter.fx || iter.derivative === undefined || iter.derivative === null) return;
        
        const derivative = iter.derivative;
        if (Math.abs(derivative) < 1e-15) return;
        
        const k = derivative;
        const b = iter.fx - k * iter.x;
        
        const allX = iterations.map(it => it.x).filter(x => x !== null);
        const xRange = allX.length > 1 ? Math.max(...allX) - Math.min(...allX) : 5;
        const tangentLength = Math.max(0.5, xRange * 0.5);
        
        if (i > 0) {
            tangentPoints.push({ x: NaN, y: NaN });
        }
        
        tangentPoints.push(
            { x: iter.x - tangentLength, y: k * (iter.x - tangentLength) + b },
            { x: iter.x + tangentLength, y: k * (iter.x + tangentLength) + b }
        );
        
        iterationPoints.push({ x: iter.x, y: iter.fx });
    });
    
    if (tangentPoints.length > 0) {
        datasets.push({
            label: 'Касательные',
            data: tangentPoints,
            borderColor: this.colors.processLight,
            borderWidth: 1.5,
            borderDash: [],
            pointRadius: 0,
            showLine: true,
            spanGaps: false
        });
    }
    
    if (iterationPoints.length > 0) {
        datasets.push({
            label: 'Точки итераций',
            data: iterationPoints,
            backgroundColor: this.colors.process,
            borderColor: this.colors.process,
            pointRadius: 4,
            pointHoverRadius: 6,
            showLine: false
        });
    }
}





    // Метод секущих
    drawSecant(datasets, func, root, iterations) {
    if (!iterations || iterations.length < 2) return;
    
    let minX = root;
    let maxX = root;
    
    iterations.forEach(iter => {
        if (iter.x) {
            minX = Math.min(minX, iter.x);
            maxX = Math.max(maxX, iter.x);
        }
    });
    
    const range = Math.max(5, (maxX - minX) * 1.5);
    const displayMin = root - range;
    const displayMax = root + range;
    
    const secantSegments = [];
    const iterationPoints = [];
    

    for (let i = 0; i < iterations.length - 1; i++) {
        const iter1 = iterations[i];
        const iter2 = iterations[i + 1];
        
        if (!iter1 || !iter2 || !iter1.x || !iter2.x) continue;
        
        try {
            const dx = iter2.x - iter1.x;
            if (Math.abs(dx) < 1e-10) continue;
            
            const k = (iter2.fx - iter1.fx) / dx;
            const b = iter1.fx - k * iter1.x;

            if (i > 0) {
                secantSegments.push({ x: NaN, y: NaN });
            }

            secantSegments.push(
                { x: displayMin, y: k * displayMin + b },
                { x: displayMax, y: k * displayMax + b }
            );

            if (!iterationPoints.some(p => Math.abs(p.x - iter1.x) < 1e-10)) {
                iterationPoints.push({ x: iter1.x, y: iter1.fx });
            }
            if (!iterationPoints.some(p => Math.abs(p.x - iter2.x) < 1e-10)) {
                iterationPoints.push({ x: iter2.x, y: iter2.fx });
            }
            
        } catch (e) {
            console.warn('Ошибка построения секущей:', e);
        }
    }

    if (secantSegments.length > 0) {
        datasets.push({
            label: 'Секущие',
            data: secantSegments,
            borderColor: this.colors.processLight,
            borderWidth: 1.5,
            borderDash: [],
            pointRadius: 0,
            showLine: true,
            spanGaps: false
        });
    }

    if (iterationPoints.length > 0) {
        datasets.push({
            label: 'Точки итераций',
            data: iterationPoints,
            backgroundColor: this.colors.process,
            borderColor: this.colors.process,
            pointRadius: 4,
            pointHoverRadius: 6,
            showLine: false
        });
    }
}





    // Метод половинного деления
    drawBisection(datasets, func, root, iterations) {
    if (!iterations || iterations.length === 0) return;
    
    const iterationPoints = [];
    const verticalLines = [];

    iterations.forEach((iter, i) => {
        if (!iter.x || !iter.fx) return;
        

        if (i > 0) {
            verticalLines.push({ x: NaN, y: NaN });
        }
        

        verticalLines.push(
            { x: iter.x, y: 0 },
            { x: iter.x, y: iter.fx }
        );
        

        iterationPoints.push({ x: iter.x, y: iter.fx });
    });
    
    if (verticalLines.length > 0) {
        datasets.push({
            label: 'Вертикальные проекции',
            data: verticalLines,
            borderColor: this.colors.processLight,
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            showLine: true,
            spanGaps: false 
        });
    }
    

    if (iterationPoints.length > 0) {
        datasets.push({
            label: 'Точки итераций',
            data: iterationPoints,
            backgroundColor: this.colors.process,
            borderColor: this.colors.process,
            pointRadius: 4,
            pointHoverRadius: 6,
            showLine: false
        });
    }
}



   

    drawIteration(datasets, func, root, iterations) {
        if (!iterations || iterations.length === 0) return;
        
        const lambda = iterations[0]?.lambda || 0.1;
        
        // функция фи (новая)
        const phi = (x) => {
            try {
                const fx = func(x);
                return x - lambda * fx;
            } catch (e) {
                return x;
            }
        };
        
        // диагональ y = x 
        datasets.push({
            label: 'y = x',
            data: [
                { x: -1000, y: -1000 },
                { x: 1000, y: 1000 }
            ],
            borderColor: this.colors.gray,
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            showLine: true
        });
        
        // функция фи
        try {
            const phiPoints = [];
            const step = 0.5;
            for (let x = -1000; x <= 1000; x += step) {
                const y = phi(x);
                if (isFinite(y) && Math.abs(y) < 1000) {
                    phiPoints.push({ x, y });
                }
            }
            
            datasets.push({
                label: `φ(x) = x - ${lambda}·f(x)`,
                data: phiPoints,
                borderColor: this.colors.process,
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                showLine: true
            });
        } catch (e) {
            console.warn('Не удалось нарисовать φ(x):', e);
        }
        
        // ломаная
        const brokenLine = [];
        
        for (let i = 0; i < iterations.length; i++) {
            const iter = iterations[i];
            if (!iter.x) continue;
            
            const x_n = iter.x;
            const phi_x_n = phi(x_n);
            
            brokenLine.push({ x: x_n, y: x_n });
            
            // вертикальный отрезок
            if (phi_x_n !== x_n) {
                const steps = 5;
                for (let s = 1; s <= steps; s++) {
                    const t = s / steps;
                    const y = x_n * (1 - t) + phi_x_n * t;
                    brokenLine.push({ x: x_n, y: y });
                }
            }
            
            // горизонтальный отрезок к следующей точке
            if (i < iterations.length - 1) {
                const next_x = iterations[i + 1].x;
                if (next_x !== x_n) {
                    const steps = 5;
                    for (let s = 1; s <= steps; s++) {
                        const t = s / steps;
                        const x = x_n * (1 - t) + next_x * t;
                        brokenLine.push({ x: x, y: phi_x_n });
                    }
                }
            }
        }
        
        if (brokenLine.length > 0) {
            datasets.push({
                label: 'Ломаная итераций',
                data: brokenLine,
                borderColor: this.colors.processLight,
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                showLine: true
            });
        }
        
        const allPoints = [];
        const maxPoints = Math.min(5, iterations.length);
        
        for (let i = 0; i < maxPoints; i++) {
            const iter = iterations[i];
            if (!iter.x) continue;

            allPoints.push({ 
                x: iter.x, 
                y: iter.x,
                label: i === 0 ? 'Точки Aᵢ/Bᵢ' : ''
            });

            const phi_x = phi(iter.x);
            allPoints.push({ 
                x: iter.x, 
                y: phi_x,
                label: ''
            });
        }
        
        if (allPoints.length > 0) {
            datasets.push({
                label: 'Точки Aᵢ/Bᵢ',
                data: allPoints.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: this.colors.process,
                borderColor: this.colors.process,
                pointRadius: 4,
                pointHoverRadius: 6,
                showLine: false
            });
        }
        
        // решение
        if (root !== null) {
            datasets.push({
                label: 'Решение',
                data: [{ x: root, y: root }],
                backgroundColor: this.colors.solution,
                borderColor: this.colors.solution,
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false
            });
        }
        
        return true;
    }







drawIntegrationChart(funcStr, a, b, methodType, iterations = []) {
    try {
        
        const canvas = document.getElementById('integration-chart');
        if (!canvas) {
            console.error('Canvas integration-chart не найден!');
            return false;
        }
        
        const func = this.parser.parseFunction(funcStr);
        const datasets = [];
        
        // ОСЬ X 
        datasets.push({
            data: [
                { x: -1000000, y: 0 },
                { x: 1000000, y: 0 } 
            ],
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: ''
        });
        
        // ОСЬ Y
        datasets.push({
            data: [
                { x: 0, y: -1000000 },
                { x: 0, y: 1000000 }
            ],
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: ''
        });
        
        //рисуем площадь под оригинальной функцией (бледно-голубой)
        const areaUnderFunc = this._generateAreaUnderFunction(func, a, b, 100);
        if (areaUnderFunc.length > 0) {
            datasets.push({
                label: 'Площадь под функцией',
                data: areaUnderFunc,
                borderColor: 'rgba(59, 130, 246, 0.3)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 1,
                pointRadius: 0,
                fill: true,
                showLine: true
            });
        }
        
        //график самой функции (синяя линия)
        const funcPoints = this._generateFunctionPoints(func, -100, 100, 200);
        datasets.push({
            label: `f(x) = ${funcStr}`,
            data: funcPoints,
            borderColor: this.colors.function,
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            showLine: true,
            tension: 0.1
        });
        
        //мметода интегрирования 
        let methodData = [];
        switch(methodType.toLowerCase()) {
            case 'simpson':
                methodData = this._generateSimpsonVisualization(func, a, b, iterations);
                break;
            case 'trapezoidal':
                methodData = this._generateTrapezoidalVisualization(func, a, b, iterations);
                break;
            case 'rectangles':
                methodData = this._generateRectanglesVisualization(func, a, b, iterations);
                break;
            case 'monte-carlo':
                methodData = this._generateMonteCarloVisualization(func, a, b, iterations);
                break;
            default:
                console.log('Метод не поддерживает визуализацию:', methodType);
        }
        
        if (methodData && methodData.length > 0) {
    methodData.forEach(data => {
        datasets.push(data);
    });
}
        
        //вертикальные линии границ
        datasets.push({
            label: 'Границы интегрирования',
            data: [
                { x: a, y: 0 },
                { x: a, y: func(a) || 0 }
            ],
            borderColor: this.colors.gray,
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            showLine: true
        });
        
        datasets.push({
            data: [
                { x: b, y: 0 },
                { x: b, y: func(b) || 0 }
            ],
            borderColor: this.colors.gray,
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            showLine: true,
            label: ''
        });
        
        //создаем график
        this.chartManager.createChart('integration-chart', datasets, null, {
            axis: '#000000',
            grid: this.colors.grid
        });
        
        return true;
        
    } catch (error) {
        console.error('Ошибка рисования интеграла:', error);
        return false;
    }
}




_generateAreaUnderFunction(func, a, b, points = 100) {
    const result = [];
    const step = (b - a) / points;
    
    // Начинаем на оси X
    result.push({ x: a, y: 0 });
    
    // Идем по функции от a до b
    for (let i = 0; i <= points; i++) {
        const x = a + i * step;
        try {
            const y = func(x);
            if (isFinite(y)) {
                result.push({ x, y });
            } else {
                result.push({ x, y: 0 });
            }
        } catch (e) {
            result.push({ x, y: 0 });
        }
    }
    
    // Возвращаемся на ось X
    result.push({ x: b, y: 0 });
    
    return result;
}



_generateSimpsonVisualization(func, a, b, iterations) {
    if (!iterations || iterations.length === 0) {
        return [];
    }
    
    const lastIter = iterations[iterations.length - 1]; 
    const n = lastIter.n || lastIter.segments || 4;
    const adjustedN = n % 2 === 0 ? n : n + 1;
    const h = (b - a) / adjustedN;
    const datasets = [];
    const allParabolaPoints = [];  //массив для ЛИНИЙ парабол
    const filledAreaPoints = [];  //массив для закрашенной области под параболами
    filledAreaPoints.push({ x: a, y: 0 });  // Начинаем область на оси X
    
    for (let i = 0; i < adjustedN; i += 2) {
        const x0 = a + i * h;
        const x1 = x0 + h;
        const x2 = x0 + 2 * h;

        
        if (x2 > b + 0.001) continue;
        
        try {
            const y0 = func(x0);
            const y1 = func(x1);
            const y2 = func(x2);

            //разрыв между параболами
            if (allParabolaPoints.length > 0) {
                allParabolaPoints.push({ x: NaN, y: NaN });
                filledAreaPoints.push({ x: NaN, y: NaN });
            }
            
            //начинаем новый сегмент области
            filledAreaPoints.push({ x: x0, y: 0 });
            filledAreaPoints.push({ x: x0, y: y0 });
            
            const points = 10;
            for (let j = 0; j <= points; j++) {
                const t = j / points;
                const x = x0 + 2 * h * t;
                
                //интерполяция
                const L0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
                const L1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
                const L2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
                
                const y = y0 * L0 + y1 * L1 + y2 * L2;
                
                allParabolaPoints.push({ x, y });
                filledAreaPoints.push({ x, y });
            }
            
            //завершаем сегмент области
            filledAreaPoints.push({ x: x2, y: y2 });
            filledAreaPoints.push({ x: x2, y: 0 });
            
        } catch (error) {
            console.warn(`Ошибка в параболе ${i/2}:`, error);
        }
    }
    
    
    //рисуем закрашенную область
    if (filledAreaPoints.length > 0) {
        datasets.push({
            label: '',
            data: filledAreaPoints,
            borderColor: 'rgba(255, 152, 0, 0.3)',
            backgroundColor: 'rgba(255, 152, 0, 0.15)', 
            borderWidth: 1,
            pointRadius: 0,
            fill: true,
            showLine: true,
            tension: 0
        });
    }
    
    //рисуем линии парабол
    if (allParabolaPoints.length > 0) {
        datasets.push({
            label: `Метод Симпсона`,
            data: allParabolaPoints,
            borderColor: 'rgba(255, 152, 0, 0.9)', 
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 0,
            fill: false,
            showLine: true,
            tension: 0,
        });
    }
    
    const nodePoints = [];
    for (let i = 0; i <= adjustedN; i += 2) {
        const x = a + i * h;
        try {
            const y = func(x);
            if (isFinite(y)) {
                nodePoints.push({ x, y });
            }
        } catch (e) {}
    }
    
    if (nodePoints.length > 0) {
        datasets.push({
            label: '',
            data: nodePoints,
            backgroundColor: '#FF9800',
            borderColor: '#FF9800',
            pointRadius: 1,
            pointHoverRadius: 2,
            showLine: false
        });
    }
    
    return datasets;
}






_generateTrapezoidalVisualization(func, a, b, iterations) {
    let n = 3;
    if (iterations && iterations.length > 0) {
        //берем n из первой итерации
        const firstIter = iterations[0];
        n = firstIter.n || firstIter.segments || 3;
    }
    
    const h = (b - a) / n;
    const datasets = [];
    
    for (let i = 0; i < n; i++) {
        const x1 = a + i * h;
        const x2 = x1 + h;
        
        try {
            const y1 = func(x1);
            const y2 = func(x2);
            
            if (!isFinite(y1) || !isFinite(y2)) continue;
            
            const trapezoidPoints = [
                { x: x1, y: 0 },
                { x: x1, y: y1 },
                { x: x2, y: y2 },
                { x: x2, y: 0 }
            ];
            
            datasets.push({
                label: i === 0 ? `Трапеции (n=${n})` : '',
                data: trapezoidPoints,
                borderColor: 'rgba(255, 152, 0, 0.3)',
                backgroundColor: 'rgba(255, 152, 0, 0.15)',
                borderWidth: 1,
                pointRadius: 0,
                fill: true,
                showLine: true,
                tension: 0
            });
            
        } catch (error) {
            continue;
        }
    }
    
    return datasets;
}



_generateRectanglesVisualization(func, a, b, iterations) {
    let n = 4; // Значение по умолчанию
    if (iterations && iterations.length > 0) {
        // Используем n из первой итерации
        const firstIter = iterations[0];
        n = firstIter.n || firstIter.segments || 4;
    }
    
    const h = (b - a) / n;
    const datasets = [];
    
    //создаем отдельный набор данных для каждого прямоугольника
    for (let i = 0; i < n; i++) {
        const x1 = a + i * h;
        const x2 = x1 + h;
        const x_mid = (x1 + x2) / 2; //середина отрезка
        
        try {
            const y_mid = func(x_mid);
            
            if (!isFinite(y_mid)) continue;
            
            //создаем точки для прямоугольника
            const rectanglePoints = [
                { x: x1, y: 0 },        //нижняя левая
                { x: x1, y: y_mid },    //верхняя левая
                { x: x2, y: y_mid },    //верхняя правая
                { x: x2, y: 0 }         //нижняя правая
            ];
            
            //создаем отдельный прямоугольник
            datasets.push({
                label: i === 0 ? `Средние прямоугольники (n=${n})` : '',
                data: rectanglePoints,
                borderColor: 'rgba(255, 152, 0, 0.3)',
                backgroundColor: 'rgba(255, 152, 0, 0.15)',
                borderWidth: 1,
                pointRadius: 0,
                fill: true,
                showLine: true,
                tension: 0
            });
            
        } catch (error) {
            continue;
        }
    }
    
    //точки в серединах отрезков
    const midPoints = [];
    for (let i = 0; i < n; i++) {
        const x1 = a + i * h;
        const x2 = x1 + h;
        const x_mid = (x1 + x2) / 2;
        
        try {
            const y_mid = func(x_mid);
            if (isFinite(y_mid)) {
                midPoints.push({ x: x_mid, y: y_mid });
            }
        } catch (e) {}
    }
    
    if (midPoints.length > 0) {
        datasets.push({
            label: '',
            data: midPoints,
            backgroundColor: '#FF9800',
            borderColor: '#FF9800',
            pointRadius: 3,
            pointHoverRadius: 5,
            showLine: false,
            pointStyle: 'circle'
        });
    }
    
    return datasets;
}



_generateMonteCarloVisualization(func, a, b, iterations) {
    if (!iterations || iterations.length === 0) {
        return [];
    } 
    //берем n из последней итерации
    const n = iterations[iterations.length - 1].n || 1000;
    
    //ограничиваем количество
    const pointsToShow = Math.min(n, 1000);
    
    //определяем область для точек
    const x_range = b - a;
    
    //ищем min и max функции на интервале
    let y_min = Infinity;
    let y_max = -Infinity;
    for (let i = 0; i <= 20; i++) {
        const x = a + (i / 20) * x_range;
        try {
            const y = func(x);
            if (isFinite(y)) {
                y_min = Math.min(y_min, y);
                y_max = Math.max(y_max, y);
            }
        } catch (e) {}
    }

    y_min = Math.min(y_min, 0);
    y_max = Math.max(y_max, 0);
    
    //расширяем диапазон
    const y_padding = (y_max - y_min) * 0.2;
    y_min -= y_padding;
    y_max += y_padding;
    
    const y_range = y_max - y_min;
    
    //генерируем точки
    const red_points = [];
    const orange_points = [];
    
    for (let i = 0; i < pointsToShow; i++) {
        const x = a + Math.random() * x_range;
        const y = y_min + Math.random() * y_range;
        
        try {
            const f_x = func(x);
            if (!isFinite(f_x)) continue;
            
            //точка под графиком если находится между осью X (y=0) и функцией
            if (f_x >= 0) {
                //для положительной функции точка под графиком
                if (y >= 0 && y <= f_x) {
                    red_points.push({ x, y });
                } else {
                    orange_points.push({ x, y });
                }
            } else {
                //для отрицательной функции точка под графиком
                if (y <= 0 && y >= f_x) {
                    red_points.push({ x, y });
                } else {
                    orange_points.push({ x, y });
                }
            }
        } catch (e) {}
    }
    
    const datasets = [];
    
    //оранжевые точки (вне области)
    if (orange_points.length > 0) {
        datasets.push({
            label: `Точки вне области (${orange_points.length})`,
            data: orange_points,
            backgroundColor: 'rgb(255, 152, 0)',
            borderColor: 'rgb(255, 152, 0)',
            pointRadius: 1,
            pointHoverRadius: 2,
            showLine: false
        });
    }
    
    //кКрасные точки (под графиком)
    if (red_points.length > 0) {
        datasets.push({
            label: `Точки под графиком (${red_points.length})`,
            data: red_points,
            backgroundColor: 'rgb(255, 0, 0)',
            borderColor: 'rgb(255, 0, 0)',
            pointRadius: 1,
            pointHoverRadius: 2,
            showLine: false
        });
    }
    
    return datasets;
}






// Основной метод для рисования диффуров
drawDifferentialEquationChart(equationStr, methodType, x0, y0, step, iterationsCount, iterations) {
    try {
        const canvas = document.getElementById('differential-chart');
        if (!canvas) {
            console.error('Canvas differential-chart не найден!');
            return false;
        }
        
        const datasets = [];
        
        // Ось X
        datasets.push({
            data: [
                { x: -1000000, y: 0 },
                { x: 1000000, y: 0 }
            ],
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: ''
        });
        
        // Ось Y
        datasets.push({
            data: [
                { x: 0, y: -1000000 },
                { x: 0, y: 1000000 }
            ],
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: ''
        });
        
        // Начальное условие (большая зеленая точка)
        datasets.push({
            label: 'Начальное условие',
            data: [{ x: x0, y: y0 }],
            backgroundColor: this.colors.initial,
            borderColor: this.colors.initial,
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        });
        
        // Визуализация метода
        switch(methodType) {
            case 'euler':
                this.drawEulerMethod(datasets, iterations);
                break;
            case 'runge-kutta':
                this.drawRungeKuttaMethod(datasets, iterations);
                break;
            case 'compare':
                this.drawEulerMethod(datasets, iterations.euler || []);
                this.drawRungeKuttaMethod(datasets, iterations.rungeKutta || []);
                break;
        }
        
        //чтобы полностью выводился график - прозрачные точки
if (iterations && iterations.length > 0) {
            const first = iterations[0];
            const last = iterations[iterations.length - 1];
            
            datasets.push({
                label: '', 
                data: [
                    { x: first.x, y: first.y },
                    { x: last.x, y: last.y }
                ],
                backgroundColor: 'rgba(0,0,0,0)',
                borderColor: 'rgba(0,0,0,0)',
                pointRadius: 0,
                showLine: false
            });
        }


        this.chartManager.createChart('differential-chart', datasets, null, {
            axis: '#000000',
            grid: this.colors.grid,
        });
        
        return true;
        
    } catch (error) {
        console.error('Ошибка рисования диффура:', error);
        return false;
    }
}





// Метод Эйлера
drawEulerMethod(datasets, iterations) {
    if (!iterations || iterations.length === 0) return;
    
    const points = iterations.map(iter => ({ x: iter.x, y: iter.y }));
    
    // Создаем массив для ломаной линии
    const linePoints = [];
    for (let i = 0; i < points.length; i++) {
        linePoints.push(points[i]);
        // Если не последняя точка, добавляем точку с тем же x, но y следующей
        // Это создаст "ступеньку" - ломаную линию
        if (i < points.length - 1) {
            linePoints.push({ 
                x: points[i + 1].x, 
                y: points[i].y 
            });
        }
    }
    
    // Ломаная линия Эйлера
    datasets.push({
        label: 'Метод Эйлера',
        data: linePoints,
        borderColor: this.colors.solution,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
        tension: 0,
        cubicInterpolationMode: 'monotone',
        fill: false
    });
    
}







// Метод Рунге-Кутты
drawRungeKuttaMethod(datasets, iterations) {
    if (!iterations || iterations.length === 0) return;
    
    const points = iterations.map(iter => ({ x: iter.x, y: iter.y }));
    
    // Плавная линия Рунге-Кутты
    datasets.push({
        label: 'Метод Рунге-Кутты 4-го порядка',
        data: points,
        borderColor: this.colors.function,
        backgroundColor: 'transparent',
        borderWidth: 3,
        pointRadius: 0, // Скрываем точки на линии
        showLine: true,
        tension: 0.4, // Сглаживание
        cubicInterpolationMode: 'monotone', // Добавь эту опцию
        fill: false
    });
    
}








    drawSystemChart(matrix, vector, variables, method, result) {
        try {
            const n = variables.length;
            
            // Рисуем только для 2D систем
            if (n !== 2) {
                console.log('Визуализация только для систем 2×2');
                return false;
            }
            
            // 1. Преобразуем уравнения к виду y = f(x)
            const equations = this._convertToExplicitForm(matrix, vector, variables);
            
            // 2. Находим диапазон для графика
            const range = this._calculateRange(result);
            
            // 3. Создаем график
            this._draw2DSystem(equations, variables, method, result, range);
            
            return true;
            
        } catch (error) {
            console.error('Ошибка рисования системы:', error);
            return false;
        }
    }
    
    _convertToExplicitForm(matrix, vector, variables) {
        // Преобразуем a₁x + b₁y = c₁ → y = (c₁ - a₁x)/b₁
        const equations = [];
        
        for (let i = 0; i < matrix.length; i++) {
            const a = matrix[i][0]; // коэффициент при x
            const b = matrix[i][1]; // коэффициент при y
            const c = vector[i];
            
            if (Math.abs(b) > 1e-10) {
                // Можно выразить y через x
                equations.push({
                    type: 'function',
                    label: `Уравнение ${i+1}`,
                    func: (x) => (c - a * x) / b,
                    index: i
                });
            } else {
                // Вертикальная линия: a*x = c → x = c/a
                equations.push({
                    type: 'vertical',
                    label: `Уравнение ${i+1}`,
                    x: c / a,
                    index: i
                });
            }
        }
        
        return equations;
    }
    
    _calculateRange(result) {
        let xMin = -10, xMax = 10;
        let yMin = -10, yMax = 10;
        
        // Если есть решение - центрируем вокруг него
        if (result && result.solution) {
            const [solX, solY] = result.solution;
            const padding = 5;
            xMin = solX - padding;
            xMax = solX + padding;
            yMin = solY - padding;
            yMax = solY + padding;
        }
        
        // Если есть итерации - расширяем диапазон чтобы все вместить
        if (result && result.iterations) {
            result.iterations.forEach(iter => {
                if (iter.x && iter.x.length >= 2) {
                    xMin = Math.min(xMin, iter.x[0]);
                    xMax = Math.max(xMax, iter.x[0]);
                    yMin = Math.min(yMin, iter.x[1]);
                    yMax = Math.max(yMax, iter.x[1]);
                }
            });
            
            // Добавляем отступ
            const xPadding = Math.max(1, (xMax - xMin) * 0.2);
            const yPadding = Math.max(1, (yMax - yMin) * 0.2);
            xMin -= xPadding;
            xMax += xPadding;
            yMin -= yPadding;
            yMax += yPadding;
        }
        
        return { xMin, xMax, yMin, yMax };
    }
    
    _draw2DSystem(equations, variables, method, result, range) {
        const datasets = [];
        
        // 1. Оси координат
        datasets.push({
            data: [
                { x: range.xMin, y: 0 },
                { x: range.xMax, y: 0 }
            ],
            borderColor: this.colors.axis,
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: ''
        });
        
        datasets.push({
            data: [
                { x: 0, y: range.yMin },
                { x: 0, y: range.yMax }
            ],
            borderColor: this.colors.axis,
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            label: ''
        });
        
        // 2. Уравнения (линии)
        equations.forEach((eq, index) => {
            if (eq.type === 'function') {
                const points = this._generateFunctionPoints(eq.func, range.xMin, range.xMax, 100);
                const color = index === 0 ? this.colors.function1 : this.colors.function2;
                
                datasets.push({
                    label: eq.label,
                    data: points,
                    borderColor: color,
                    backgroundColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    showLine: true,
                    tension: 0
                });
            } else if (eq.type === 'vertical') {
                datasets.push({
                    label: eq.label,
                    data: [
                        { x: eq.x, y: range.yMin },
                        { x: eq.x, y: range.yMax }
                    ],
                    borderColor: index === 0 ? this.colors.function1 : this.colors.function2,
                    borderWidth: 2,
                    pointRadius: 0,
                    showLine: true,
                    tension: 0
                });
            }
        });
        
        // 3. Решение (красная точка)
        if (result && result.solution) {
            const [solX, solY] = result.solution;
            
            datasets.push({
                label: 'Решение системы',
                data: [{ x: solX, y: solY }],
                backgroundColor: this.colors.solution,
                borderColor: this.colors.solution,
                borderWidth: 2,
                pointRadius: 8,
                pointHoverRadius: 12,
                showLine: false
            });
            
            // Подпись решения
            datasets.push({
                label: '',
                data: [
                    { x: solX, y: solY },
                    { x: solX + 0.5, y: solY + 0.5 }
                ],
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                pointRadius: 0,
                showLine: false,
                datalabels: {
                    display: true,
                    align: 'top',
                    anchor: 'start',
                    formatter: () => `(${solX.toFixed(3)}, ${solY.toFixed(3)})`,
                    color: this.colors.solution,
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            });
        }
        
        // 4. Итерации для Якоби/Зейделя
        if ((method.includes('Якоби') || method.includes('Зейдель')) && 
            result.iterations && result.iterations.length > 0) {
            this._drawIterations(datasets, result.iterations, result.solution);
        }
        
        // 5. Начальное приближение для итерационных методов
        if ((method.includes('Якоби') || method.includes('Зейдель')) && 
            result.iterations && result.iterations.length > 0) {
            const firstIter = result.iterations[0];
            if (firstIter.x && firstIter.x.length >= 2) {
                datasets.push({
                    label: 'Начальное приближение',
                    data: [{ x: firstIter.x[0], y: firstIter.x[1] }],
                    backgroundColor: this.colors.initialPoint,
                    borderColor: this.colors.initialPoint,
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    showLine: false
                });
            }
        }
        
        // 6. Создаем график
        const chartOptions = {
            axis: this.colors.axis,
            grid: this.colors.grid,
            xMin: range.xMin,
            xMax: range.xMax,
            yMin: range.yMin,
            yMax: range.yMax
        };
        
        this.chartManager.createChart('system-chart', datasets, null, chartOptions);
    }
    
    _drawIterations(datasets, iterations, solution) {
        if (!iterations || iterations.length < 2) return;
        
        // Собираем точки итераций
        const iterationPoints = [];
        const pathPoints = [];
        
        iterations.forEach((iter, index) => {
            if (iter.x && iter.x.length >= 2) {
                const point = { 
                    x: iter.x[0], 
                    y: iter.x[1],
                    iteration: index + 1
                };
                
                iterationPoints.push(point);
                pathPoints.push(point);
                
                // Разрыв для лучшей видимости
                if (index < iterations.length - 1) {
                    pathPoints.push({ x: NaN, y: NaN });
                }
            }
        });
        
        // 1. Траектория (оранжевый пунктир)
        if (pathPoints.length > 0) {
            datasets.push({
                label: 'Траектория итераций',
                data: pathPoints,
                borderColor: this.colors.iterationPath,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                showLine: true,
                tension: 0
            });
        }
        
        // 2. Точки итераций (оранжевые)
        if (iterationPoints.length > 0) {
            datasets.push({
                label: 'Точки итераций',
                data: iterationPoints,
                backgroundColor: this.colors.process,
                borderColor: this.colors.process,
                borderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6,
                showLine: false
            });
            
            // Подписи к точкам (первые и последние)
            [0, iterationPoints.length - 1].forEach(idx => {
                if (iterationPoints[idx]) {
                    datasets.push({
                        label: '',
                        data: [
                            iterationPoints[idx],
                            { x: iterationPoints[idx].x + 0.3, y: iterationPoints[idx].y + 0.3 }
                        ],
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        pointRadius: 0,
                        showLine: false,
                        datalabels: {
                            display: true,
                            align: 'top',
                            anchor: 'start',
                            formatter: () => `x${idx+1}(${iterationPoints[idx].iteration})`,
                            color: this.colors.process,
                            font: {
                                size: 10
                            }
                        }
                    });
                }
            });
        }
        
        // 3. Стрелки направления (если достаточно точек)
        if (iterationPoints.length >= 2) {
            for (let i = 0; i < iterationPoints.length - 1; i++) {
                const start = iterationPoints[i];
                const end = iterationPoints[i + 1];
                
                // Рассчитываем вектор и его длину
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0.1) { // Не рисуем слишком маленькие стрелки
                    // Нормализуем
                    const ndx = dx / length;
                    const ndy = dy / length;
                    
                    // Сокращаем стрелку на 20%
                    const arrowLength = length * 0.8;
                    const arrowEndX = start.x + ndx * arrowLength;
                    const arrowEndY = start.y + ndy * arrowLength;
                    
                    datasets.push({
                        label: '',
                        data: [
                            { x: start.x, y: start.y },
                            { x: arrowEndX, y: arrowEndY }
                        ],
                        borderColor: this.colors.process,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        tension: 0
                    });
                }
            }
        }
    }
    




drawSystemChart(matrix, vector, variables, methodType, result) {
    console.log('=== НАЧИНАЕМ РИСОВАТЬ СИСТЕМУ (через ChartManager) ===');
    console.log('Метод:', methodType);
    console.log('Матрица:', matrix);
    console.log('Vector:', vector);
    console.log('Variables:', variables);
    console.log('Решение:', result.solution);
    console.log('Итерации:', result.iterations);
    
    try {
        // Проверяем, что система 2D
        if (matrix.length !== 2 || matrix[0].length !== 2) {
            console.warn('График строится только для систем 2x2');
            return false;
        }
        
        const datasets = [];
        
        // 1. Ось X - ЧЕРНАЯ (через ChartManager)
        datasets.push(this.chartManager.createLine(
            -1000, 0, 1000, 0, '', '#000000', false, 2
        ));
        
        // 2. Ось Y - ЧЕРНАЯ (через ChartManager)  
        datasets.push(this.chartManager.createLine(
            0, -1000, 0, 1000, '', '#000000', false, 2
        ));
        
        // 3. Первое уравнение - СИНИЙ
        const a1 = matrix[0][0];
        const b1 = matrix[0][1];
        const c1 = vector[0];
        
        console.log(`Уравнение 1: ${a1}x + ${b1}y = ${c1}`);
        
        if (Math.abs(b1) > 1e-10) {
            // y = (c1 - a1*x)/b1
            const func1 = (x) => (c1 - a1 * x) / b1;
            const points1 = this._generateEquationLinePoints(func1, -10, 10, 200);
            
            datasets.push({
                label: `Уравнение 1: ${a1}${variables[0]} + ${b1}${variables[1]} = ${c1}`,
                data: points1,
                borderColor: '#3b82f6', // СИНИЙ
                backgroundColor: '#3b82f6',
                borderWidth: 3,
                pointRadius: 0,
                fill: false,
                showLine: true,
                tension: 0
            });
        } else {
            // Вертикальная линия: x = c1/a1
            const x1 = c1 / a1;
            datasets.push(this.chartManager.createLine(
                x1, -10, x1, 10,
                `Уравнение 1: ${a1}${variables[0]} = ${c1}`,
                '#3b82f6', false, 3
            ));
        }
        
        // 4. Второе уравнение - ЗЕЛЕНЫЙ
        const a2 = matrix[1][0];
        const b2 = matrix[1][1];
        const c2 = vector[1];
        
        console.log(`Уравнение 2: ${a2}x + ${b2}y = ${c2}`);
        
        if (Math.abs(b2) > 1e-10) {
            // y = (c2 - a2*x)/b2
            const func2 = (x) => (c2 - a2 * x) / b2;
            const points2 = this._generateEquationLinePoints(func2, -10, 10, 200);
            
            datasets.push({
        label: `Уравнение 2: ${a2}${variables[0]} + ${b2}${variables[1]} = ${c2}`,
        data: points2,
        borderColor: '#0d9488',
        backgroundColor: '#0d9488',
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
        showLine: true,
        tension: 0
    });
        } else {
            // Вертикальная линия: x = c2/a2
            const x2 = c2 / a2;
            datasets.push(this.chartManager.createLine(
                x2, -10, x2, 10,
                `Уравнение 2: ${a2}${variables[0]} = ${c2}`,
                '#10b981', false, 3
            ));
        }
        
        // 5. Решение - КРАСНАЯ точка (через ChartManager)
        if (result.solution && result.solution.length >= 2) {
            console.log('Рисуем решение:', result.solution[0], result.solution[1]);
            
            datasets.push(this.chartManager.createPoint(
                result.solution[0], result.solution[1],
                'Решение системы',
                '#ef4444', // КРАСНЫЙ
                10
            ));
        }
        
       // 6. ДОПОЛНИТЕЛЬНО: Для Якоби/Зейделя - рисуем траекторию
if ((methodType === 'jacobi' || methodType === 'zeidel') && 
    result.iterations && result.iterations.length > 0) {
    console.log('Добавляем траекторию для метода:', methodType);
    console.log('Количество итераций:', result.iterations.length);
    console.log('Начальное приближение в result:', result.initialGuess);
    console.log('Результат передаваемый в метод:', result);
    
    this._addIterativeTrajectoryToDatasets(datasets, result.iterations, methodType, result);
    
    console.log('Метод _addIterativeTrajectoryToDatasets вызван для', methodType);
}

        
        console.log('Всего datasets:', datasets.length);
        
        // Определяем диапазон для графика
        const bounds = this._calculateSystemBounds(result);
        console.log('Границы графика:', bounds);
        
        // 7. Создаем график ЧЕРЕЗ CHARTMANAGER
        const success = this.chartManager.createChart(
            'system-chart', 
            datasets, 
            null, // нет отдельного корня
            {
                axis: '#000000',
                grid: 'rgba(0,0,0,0.1)',
                xMin: bounds.xMin,
                xMax: bounds.xMax,
                yMin: bounds.yMin,
                yMax: bounds.yMax
            }
        );
        
        console.log('График создан через ChartManager:', success ? 'успешно' : 'ошибка');
        return success;
        
    } catch (error) {
        console.error('Ошибка рисования системы:', error);
        return false;
    }
}

// Вспомогательный метод для расчета границ графика системы
_calculateSystemBounds(result) {
    // Начинаем с решения
    let xMin = -10, xMax = 10, yMin = -10, yMax = 10;
    
    if (result.solution && result.solution.length >= 2) {
        const [solX, solY] = result.solution;
        xMin = solX - 5;
        xMax = solX + 5;
        yMin = solY - 5;
        yMax = solY + 5;
    }
    
    // Для итерационных методов расширяем границы
    if ((result.method && (result.method.includes('Якоби') || result.method.includes('Зейделя'))) && 
        result.iterations && result.iterations.length > 0) {
        
        // Находим min/max всех итераций
        let iterXMin = Infinity, iterXMax = -Infinity;
        let iterYMin = Infinity, iterYMax = -Infinity;
        
        result.iterations.forEach(iter => {
            if (iter.x && iter.x.length >= 2) {
                iterXMin = Math.min(iterXMin, iter.x[0]);
                iterXMax = Math.max(iterXMax, iter.x[0]);
                iterYMin = Math.min(iterYMin, iter.x[1]);
                iterYMax = Math.max(iterYMax, iter.x[1]);
            }
        });
        
        if (isFinite(iterXMin)) {
            xMin = Math.min(xMin, iterXMin - 1);
            xMax = Math.max(xMax, iterXMax + 1);
            yMin = Math.min(yMin, iterYMin - 1);
            yMax = Math.max(yMax, iterYMax + 1);
        }
    }
    
    // Убедимся, что границы не слишком маленькие
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    
    if (xRange < 5) {
        const centerX = (xMin + xMax) / 2;
        xMin = centerX - 2.5;
        xMax = centerX + 2.5;
    }
    
    if (yRange < 5) {
        const centerY = (yMin + yMax) / 2;
        yMin = centerY - 2.5;
        yMax = centerY + 2.5;
    }
    
    return { xMin, xMax, yMin, yMax };
}


// Вспомогательный метод для добавления траектории итераций
_addIterativeTrajectoryToDatasets(datasets, iterations, methodType, result) {
    console.log('=== РИСУЕМ ТРАЕКТОРИЮ ===');
    console.log('Метод:', methodType);
    
    if (!iterations || iterations.length === 0) return;
    
    // Определяем начальное приближение
    let initialPoint = { x: 0, y: 0 };
    if (result.initialGuess && Array.isArray(result.initialGuess) && result.initialGuess.length >= 2) {
        initialPoint = { 
            x: result.initialGuess[0], 
            y: result.initialGuess[1] 
        };
    }
    
    // 1. Начальное приближение - ЗЕЛЕНАЯ точка
    datasets.push({
        label: 'Начальное приближение',
        data: [{ 
            x: initialPoint.x, 
            y: initialPoint.y 
        }],
        backgroundColor: '#10b981', // ЗЕЛЕНЫЙ
        borderColor: '#10b981',
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 12,
        showLine: false
    });
    
    // 2. Траектория от начальной точки через все итерации - оранжевый пунктир
    const trajectoryPoints = [];
    
    // Начинаем с начальной точки
    trajectoryPoints.push({ x: initialPoint.x, y: initialPoint.y });
    
    // Добавляем все итерации
    for (let i = 0; i < iterations.length; i++) {
        const iter = iterations[i];
        
        if (iter.x && Array.isArray(iter.x) && iter.x.length >= 2) {
            const x = iter.x[0];
            const y = iter.x[1];
            
            trajectoryPoints.push({ x, y });
            
            // Разрыв между точками (кроме последней)
            if (i < iterations.length - 1) {
                trajectoryPoints.push({ x: NaN, y: NaN });
                // Начинаем новый сегмент с текущей точки
                trajectoryPoints.push({ x, y });
            }
        }
    }
    
    if (trajectoryPoints.length > 0) {
        const trajectoryLabel = methodType === 'jacobi' 
            ? 'Траектория метода Якоби' 
            : 'Траектория метода Зейделя';
            
        datasets.push({
            label: trajectoryLabel,
            data: trajectoryPoints,
            borderColor: 'rgba(245, 158, 11, 0.6)', // ОРАНЖЕВЫЙ бледный
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5], // ПУНКТИР
            pointRadius: 0,
            showLine: true,
            tension: 0.1,
            fill: false,
            spanGaps: true
        });
    }
    
    // 3. Точки итераций (все в одном dataset) - оранжевые
    const iterationPointsLabel = methodType === 'jacobi' 
        ? 'Точки итераций Якоби' 
        : 'Точки итераций Зейделя';
    
    const iterationPointsData = [];
    
    for (let i = 0; i < iterations.length; i++) {
        const iter = iterations[i];
        
        if (iter.x && Array.isArray(iter.x) && iter.x.length >= 2) {
            const x = iter.x[0];
            const y = iter.x[1];
            
            // Проверяем, не совпадает ли с решением
            const isSolution = result.solution && result.solution.length >= 2 &&
                              Math.abs(x - result.solution[0]) < 0.0001 &&
                              Math.abs(y - result.solution[1]) < 0.0001;
            
            // Проверяем, не совпадает ли с начальным приближением
            const isInitial = Math.abs(x - initialPoint.x) < 0.0001 &&
                             Math.abs(y - initialPoint.y) < 0.0001;
            
            if (!isSolution && !isInitial) {
                iterationPointsData.push({ x, y });
            }
        }
    }
    
    if (iterationPointsData.length > 0) {
        datasets.push({
            label: iterationPointsLabel,
            data: iterationPointsData,
            backgroundColor: 'rgba(245, 158, 11, 0.8)', // ОРАНЖЕВЫЙ
            borderColor: 'rgba(245, 158, 11, 1)',
            pointRadius: 5,
            pointHoverRadius: 8,
            showLine: false
        });
    }
}



// Вспомогательный метод для генерации точек линии уравнения
_generateEquationLinePoints(func, xMin, xMax, points = 200) {
    const result = [];
    const step = (xMax - xMin) / points;
    
    for (let i = 0; i <= points; i++) {
        const x = xMin + i * step;
        try {
            const y = func(x);
            if (isFinite(y) && Math.abs(y) < 1000) {
                result.push({ x, y });
            }
        } catch (e) {
            // Пропускаем точки с ошибками
        }
    }
    
    return result;
}



    // Вспомогательные методы:

    _generateFunctionPoints(func, a, b, points = 200) {
        const result = [];
        const step = (b - a) / points;
        
        for (let i = 0; i <= points; i++) {
            const x = a + i * step;
            try {
                const y = func(x);
                if (isFinite(y)) {
                    result.push({ x, y });
                }
            } catch (e) {}
        }
        return result;
    }


    _getMinY(func, a, b, points = 100) {
        let minY = 0;
        const step = (b - a) / points;
        
        for (let i = 0; i <= points; i++) {
            const x = a + i * step;
            try {
                const y = func(x);
                if (isFinite(y)) {
                    minY = Math.min(minY, y);
                }
            } catch (e) {}
        }
        return minY;
    }

    _getMaxY(func, a, b, points = 100) {
        let maxY = 0;
        const step = (b - a) / points;
        
        for (let i = 0; i <= points; i++) {
            const x = a + i * step;
            try {
                const y = func(x);
                if (isFinite(y)) {
                    maxY = Math.max(maxY, y);
                }
            } catch (e) {}
        }
        return maxY;
    }

    

    _derivative(func, x, h = 0.001) {
        return (func(x + h) - func(x - h)) / (2 * h);
    }
}

export default ChartBuilder;
