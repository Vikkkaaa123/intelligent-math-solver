// НЕ импортируем tf, он уже глобальный из CDN

class TrainedNeuralModel {
    constructor() {
        this.model = null;
        this.tokenizer = null;
        this.wordIndex = {};
        this.maxLength = 50;
        this.isTrained = false;
        
        // Словарь ключевых слов для признаков
        this.features = {
            equation: ['уравнение', 'реши', 'найди корень', 'x', 'равно', '= 0', 'корни'],
            integral: ['интеграл', 'площадь', '∫', 'от', 'до', 'dx', 'интегрируй'],
            ode: ['дифференциальн', 'диффур', 'dy/dx', "y'", 'y(', 'ду', 'одy'],
            system: ['систем', 'совместно', 'несколько уравнений', 'x + y', 'x - y']
        };
        
        this.methodLabels = {
            equation: ['newton', 'bisection', 'secant', 'iteration'],
            integral: ['simpson', 'trapezoidal', 'rectangles', 'monte-carlo'],
            ode: ['euler', 'runge-kutta'],
            system: ['gauss', 'jacobi', 'zeidel']
        };
    }
    
    // Создание модели нейросети
    createModel(inputDim, outputDim) {
        // Используем глобальный tf из CDN
        if (typeof tf === 'undefined') {
            console.error('TensorFlow.js не загружен!');
            return null;
        }
        
        const model = tf.sequential();
        
        // Входной слой
        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            inputShape: [inputDim]
        }));
        
        model.add(tf.layers.dropout({ rate: 0.3 }));
        
        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu'
        }));
        
        model.add(tf.layers.dense({
            units: outputDim,
            activation: 'softmax'
        }));
        
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        return model;
    }
    
    // Извлечение признаков из текста
    extractFeatures(text) {
        const features = [];
        const lowerText = text.toLowerCase();
        
        // 1. Признаки по ключевым словам
        for (const [taskType, keywords] of Object.entries(this.features)) {
            for (const keyword of keywords) {
                features.push(lowerText.includes(keyword) ? 1 : 0);
            }
        }
        
        // 2. Признак длины текста (нормализованный)
        features.push(Math.min(text.length / 200, 1));
        
        // 3. Признак наличия чисел
        features.push(/\d/.test(text) ? 1 : 0);
        
        // 4. Математические символы
        features.push(text.includes('=') ? 1 : 0);
        features.push(text.includes('+') ? 1 : 0);
        features.push(text.includes('-') ? 1 : 0);
        features.push(text.includes('*') ? 1 : 0);
        features.push(text.includes('/') ? 1 : 0);
        features.push(text.includes('^') ? 1 : 0);
        features.push(text.includes('∫') ? 1 : 0);
        
        // 5. Переменные
        features.push(/[xy]/i.test(text) ? 1 : 0);
        
        // 6. Специальные паттерны
        features.push(/\d+\s*[+\-*/]\s*\d+/.test(text) ? 1 : 0);
        features.push(/\([^)]+\)/.test(text) ? 1 : 0);
        features.push(/'/.test(text) ? 1 : 0);
        
        // 7. Дополнительные признаки для лучшего распознавания
        features.push(lowerText.includes('реши') ? 1 : 0);
        features.push(lowerText.includes('найди') ? 1 : 0);
        features.push(lowerText.includes('вычисли') ? 1 : 0);
        
        return features;
    }
    
    getFeatureDimension() {
        let dim = 0;
        for (const keywords of Object.values(this.features)) {
            dim += keywords.length;
        }
        dim += 14; // все дополнительные признаки
        return dim;
    }
    
    getTaskTypeOutputDim() {
        return Object.keys(this.features).length;
    }
    
    generateTrainingData(samplesPerClass = 40) {
        const inputs = [];
        const outputs = [];
        
        const taskTypes = ['equation', 'integral', 'ode', 'system'];
        
        // Расширенные шаблоны
        const templates = {
            equation: [
                'реши уравнение {expr}',
                'найди корни {expr} = 0',
                'решить {expr}',
                'найдите x из уравнения {expr}',
                'реши {expr}',
                'найти решение {expr}',
                'вычисли корни {expr}',
                'решить уравнение {expr}'
            ],
            integral: [
                'вычисли интеграл от {a} до {b} от {expr} dx',
                'найди определённый интеграл ∫_{a}^{b} {expr} dx',
                'проинтегрируй {expr} от {a} до {b}',
                'интеграл {expr} dx на интервале [{a},{b}]',
                'вычисли ∫ {expr} dx',
                'найти интеграл {expr}'
            ],
            ode: [
                "реши дифференциальное уравнение y' = {expr}",
                'решить ду y\' = {expr}, y({x0}) = {y0}',
                'найди решение dy/dx = {expr}',
                'дифференциальное уравнение {expr}',
                'решить y\' = {expr}',
                'найти решение ду {expr}'
            ],
            system: [
                'реши систему {eq1}, {eq2}',
                'найти решение системы {eq1} и {eq2}',
                'система уравнений {eq1}, {eq2}',
                'решить систему {eq1}',
                'найти x и y из {eq1}'
            ]
        };
        
        const expressions = {
            equation: ['x^2 - 4 = 0', 'x^3 - x = 0', '2x + 5 = 0', 'x^2 + 3x - 4 = 0', 'sin(x) = 0.5', 'x^2 = 9', 'x - 5 = 0'],
            integral: ['x^2', 'sin(x)', 'cos(x)', 'e^x', '1/x', '2*x', 'x^3'],
            ode: ['x + y', 'x * y', 'sin(x) + y', 'x^2 + y', '2*x*y', 'y + x'],
            system: ['x + y = 2, x - y = 0', '2x + 3y = 5, x - y = 1', 'x + 2y = 4, 3x + y = 5']
        };
        
        for (const taskType of taskTypes) {
            const typeTemplates = templates[taskType];
            const typeExpressions = expressions[taskType];
            
            for (let i = 0; i < samplesPerClass; i++) {
                const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
                const expr = typeExpressions[Math.floor(Math.random() * typeExpressions.length)];
                
                let text = template.replace('{expr}', expr);
                
                if (taskType === 'integral') {
                    const a = Math.floor(Math.random() * 5);
                    const b = a + 1 + Math.floor(Math.random() * 5);
                    text = text.replace('{a}', a).replace('{b}', b);
                }
                
                if (taskType === 'ode') {
                    const x0 = Math.floor(Math.random() * 5);
                    const y0 = Math.floor(Math.random() * 10);
                    text = text.replace('{x0}', x0).replace('{y0}', y0);
                }
                
                if (taskType === 'system' && expr.includes(',')) {
                    const parts = expr.split(',');
                    text = text.replace('{eq1}', parts[0]);
                    if (parts[1]) text = text.replace('{eq2}', parts[1]);
                }
                
                const features = this.extractFeatures(text);
                inputs.push(features);
                
                const output = [0, 0, 0, 0];
                const typeIndex = taskTypes.indexOf(taskType);
                output[typeIndex] = 1;
                outputs.push(output);
            }
        }
        
        // Перемешивание
        for (let i = inputs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [inputs[i], inputs[j]] = [inputs[j], inputs[i]];
            [outputs[i], outputs[j]] = [outputs[j], outputs[i]];
        }
        
        return { inputs, outputs };
    }
    
    async train(epochs = 80, samplesPerClass = 40) {
        console.log('Начинаем обучение нейросети...');
        
        if (typeof tf === 'undefined') {
            console.error('TensorFlow.js не загружен!');
            return null;
        }
        
        const { inputs, outputs } = this.generateTrainingData(samplesPerClass);
        
        const inputDim = inputs[0].length;
        const outputDim = outputs[0].length;
        
        console.log(`Размерность входа: ${inputDim}, выхода: ${outputDim}`);
        console.log(`Обучающих примеров: ${inputs.length}`);
        
        this.model = this.createModel(inputDim, outputDim);
        
        if (!this.model) {
            console.error('Не удалось создать модель');
            return null;
        }
        
        const xs = tf.tensor2d(inputs);
        const ys = tf.tensor2d(outputs);
        
        const history = await this.model.fit(xs, ys, {
            epochs: epochs,
            validationSplit: 0.2,
            shuffle: true,
            verbose: 0,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 20 === 0 || epoch === epochs - 1) {
                        console.log(`Эпоха ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                    }
                }
            }
        });
        
        xs.dispose();
        ys.dispose();
        
        this.isTrained = true;
        const finalAcc = history.history.acc[history.history.acc.length - 1];
        console.log(`Обучение завершено! Финальная точность: ${(finalAcc * 100).toFixed(1)}%`);
        
        return history;
    }
    
    predictTaskType(text) {
        if (!this.isTrained || !this.model) {
            console.warn('Модель не обучена, используем fallback');
            return this.fallbackPredict(text);
        }
        
        try {
            const features = this.extractFeatures(text);
            const inputTensor = tf.tensor2d([features]);
            const prediction = this.model.predict(inputTensor);
            const probabilities = prediction.dataSync();
            
            const taskTypes = ['equation', 'integral', 'ode', 'system'];
            const maxIndex = probabilities.indexOf(Math.max(...probabilities));
            
            inputTensor.dispose();
            prediction.dispose();
            
            return {
                taskType: taskTypes[maxIndex],
                confidence: probabilities[maxIndex],
                allProbabilities: {
                    equation: probabilities[0],
                    integral: probabilities[1],
                    ode: probabilities[2],
                    system: probabilities[3]
                }
            };
        } catch (error) {
            console.error('Ошибка предсказания:', error);
            return this.fallbackPredict(text);
        }
    }
    
    recommendMethod(taskType, text) {
        const methodsByType = {
            equation: ['newton', 'bisection', 'secant', 'iteration'],
            integral: ['simpson', 'trapezoidal', 'rectangles', 'monte-carlo'],
            ode: ['runge-kutta', 'euler'],
            system: ['gauss', 'zeidel', 'jacobi']
        };
        
        const methods = methodsByType[taskType] || methodsByType.equation;
        const lowerText = text.toLowerCase();
        
        // Эвристики для выбора метода
        if (taskType === 'equation') {
            if (lowerText.includes('sin') || lowerText.includes('cos') || lowerText.includes('exp')) {
                return { method: 'newton', confidence: 0.85, reason: 'нелинейная функция, метод Ньютона эффективен' };
            }
            if (lowerText.includes('|') || lowerText.includes('abs')) {
                return { method: 'bisection', confidence: 0.8, reason: 'функция с разрывом производной' };
            }
            if (lowerText.includes('x^3') || lowerText.includes('x³')) {
                return { method: 'secant', confidence: 0.75, reason: 'метод секущих устойчив для кратных корней' };
            }
            return { method: 'newton', confidence: 0.7, reason: 'стандартный метод для уравнений' };
        }
        
        if (taskType === 'integral') {
            if (lowerText.includes('sin') || lowerText.includes('cos')) {
                return { method: 'simpson', confidence: 0.9, reason: 'гладкая функция, метод Симпсона оптимален' };
            }
            if (lowerText.includes('1/x') || lowerText.includes('log')) {
                return { method: 'trapezoidal', confidence: 0.8, reason: 'метод трапеций устойчив для функций с особенностями' };
            }
            return { method: 'simpson', confidence: 0.7, reason: 'наиболее точный метод' };
        }
        
        if (taskType === 'ode') {
            return { method: 'runge-kutta', confidence: 0.85, reason: 'высокая точность для ОДУ' };
        }
        
        if (taskType === 'system') {
            if (lowerText.includes('2x') || lowerText.includes('3x')) {
                return { method: 'gauss', confidence: 0.9, reason: 'малая размерность, метод Гаусса' };
            }
            return { method: 'gauss', confidence: 0.7, reason: 'прямой метод для СЛАУ' };
        }
        
        return { method: methods[0], confidence: 0.5, reason: 'рекомендован по умолчанию' };
    }
    
    fallbackPredict(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('интеграл') || lowerText.includes('∫') || lowerText.includes('dx')) {
            return { taskType: 'integral', confidence: 0.8, allProbabilities: {} };
        }
        if (lowerText.includes("y'") || lowerText.includes('dy/dx') || lowerText.includes('дифференциальн') || lowerText.includes('диффур')) {
            return { taskType: 'ode', confidence: 0.8, allProbabilities: {} };
        }
        if (lowerText.includes('систем') || (lowerText.includes('x +') && lowerText.includes('x -'))) {
            return { taskType: 'system', confidence: 0.8, allProbabilities: {} };
        }
        
        return { taskType: 'equation', confidence: 0.7, allProbabilities: {} };
    }
    
    async saveModel(name = 'math-solver-model') {
        if (!this.model) return;
        try {
            await this.model.save(`localstorage://${name}`);
            console.log(`Модель сохранена: ${name}`);
        } catch (e) {
            console.warn('Не удалось сохранить модель:', e);
        }
    }
    
    async loadModel(name = 'math-solver-model') {
        if (typeof tf === 'undefined') return false;
        
        try {
            this.model = await tf.loadLayersModel(`localstorage://${name}`);
            this.isTrained = true;
            console.log('Модель загружена из localStorage');
            return true;
        } catch (e) {
            console.log('Сохранённая модель не найдена, потребуется обучение');
            return false;
        }
    }
}

export default TrainedNeuralModel;