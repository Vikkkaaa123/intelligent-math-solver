import app from './main.js';
import NewtonMethod from '../numerical-methods/equations/newton.js';
import BisectionMethod from '../numerical-methods/equations/bisection.js';
import IterationMethod from '../numerical-methods/equations/iteration.js';
import SecantMethod from '../numerical-methods/equations/secant.js';
import SimpsonMethod from '../numerical-methods/integration/simpson.js';
import TrapezoidalMethod from '../numerical-methods/integration/trapezoidal.js';
import RectanglesMethod from '../numerical-methods/integration/rectangles.js';
import MonteCarloMethod from '../numerical-methods/integration/monte-carlo.js';
import EulerMethod from '../numerical-methods/differential/euler.js';
import RungeKuttaMethod from '../numerical-methods/differential/runge-kutta.js';
import GaussMethod from '../numerical-methods/systems/gauss.js';
import JacobiMethod from '../numerical-methods/systems/jacobi.js';
import ZeidelMethod from '../numerical-methods/systems/zeidel.js';
import ChartBuilder from '../visualization/charts/chart-builder.js';
import MathParserDE from '../math-core/math-parserDE.js';
import SystemParser from '../math-core/system-parser.js';
import EquationMethodSelector from '../numerical-methods/equations/method-selector.js';
import IntegrationMethodSelector from '../numerical-methods/integration/method-selector.js';
import DifferentialMethodSelector from '../numerical-methods/differential/method-selector.js';
import SystemMethodSelector from '../numerical-methods/systems/method-selector.js';
import NeuralSolver from '../neural/neural-solver.js';


class EventManager {
    constructor() {
         this.methods = {};
        this.chartBuilder = null;
        this.mathParserDE = null;
        this.systemParser = null;
        this.neuralSolver = null;
}


    async initialize(appInstance) {
    this.app = appInstance;
    this.mathParserDE = new MathParserDE();
    this.mathParserDE.initialize();
    this.systemParser = new SystemParser();
    this.initMethods();
    this.equationSelector = new EquationMethodSelector(this.app.getMathParser());
    this.integrationSelector = new IntegrationMethodSelector(this.app.getMathParser());
    this.differentialSelector = new DifferentialMethodSelector();
    this.systemSelector = new SystemMethodSelector();
    this.setupTabHandlers();
    this.setupCalculationHandlers();
    this.setupEquationInterface();
    this.setupIntegrationInterface();
    this.setupDifferentialInterface();
    this.setupSystemInterface();
    this.neuralSolver = new NeuralSolver();
    await this.neuralSolver.initialize();
    console.log('Нейросеть инициализирована');
    
}


    initMethods() {
        const parser = this.app.getMathParser();

        this.methods.newton = new NewtonMethod(parser);
        this.methods.bisection = new BisectionMethod(parser);
        this.methods.iteration = new IterationMethod(parser);
        this.methods.secant = new SecantMethod(parser);
        this.methods.simpson = new SimpsonMethod(parser);
        this.methods.trapezoidal = new TrapezoidalMethod(parser);
        this.methods.rectangles = new RectanglesMethod(parser);
        this.methods.monteCarlo = new MonteCarloMethod(parser);
        this.methods.euler = new EulerMethod(this.mathParserDE);
        this.methods.rungeKutta = new RungeKuttaMethod(this.mathParserDE);
        this.methods.gauss = new GaussMethod();
        this.methods.jacobi = new JacobiMethod();
        this.methods.zeidel = new ZeidelMethod();
        this.chartBuilder = new ChartBuilder(parser);
    }


    //обработчик переключения вкладок
    setupTabHandlers() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.currentTarget.dataset.tab;
            this.app.switchToTab(tab); //переключение на выбранную вкладку
        });
    });
  }

 //динамический интерфейс для уравнений
setupEquationInterface() {
    const methodSelect = document.getElementById('equation-method');
    const container = document.getElementById('method-inputs-container');
    const funcInput = document.getElementById('equation-function');
    
    if (!methodSelect || !container) return;
    
    const updateInputs = (method) => {
        container.innerHTML = '';
        if (!method) return;
        
        const template = document.getElementById(`${method}-template`);
        if (template) {
            container.appendChild(template.content.cloneNode(true));
        }
    };
    
    methodSelect.addEventListener('change', (e) => {
        updateInputs(e.target.value);
        this.showEquationMethodHelp(e.target.value);
    });
    
    updateInputs(methodSelect.value);
    
    if (funcInput) {
        funcInput.addEventListener('input', () => this.updateEquationRecommendation());
        funcInput.addEventListener('change', () => this.updateEquationRecommendation());
        this.updateEquationRecommendation();
    }
    
    this.showEquationMethodHelp(methodSelect.value);
}


setupIntegrationInterface() {
    const methodSelect = document.getElementById('integration-method');
    const funcInput = document.getElementById('integration-function');
    const aInput = document.getElementById('integration-a');
    const bInput = document.getElementById('integration-b');
    
    if (!methodSelect) return;
    
    const update = () => this.updateIntegrationRecommendation();
    
    if (funcInput) {
        funcInput.addEventListener('input', update);
        funcInput.addEventListener('change', update);
    }
    if (aInput) {
        aInput.addEventListener('input', update);
        aInput.addEventListener('change', update);
    }
    if (bInput) {
        bInput.addEventListener('input', update);
        bInput.addEventListener('change', update);
    }
    
    methodSelect.addEventListener('change', (e) => {
        this.showIntegrationMethodHelp(e.target.value);
    });
    
    this.updateIntegrationRecommendation();
    this.showIntegrationMethodHelp(methodSelect.value);
}

setupDifferentialInterface() {
    const methodSelect = document.getElementById('diff-method');
    const eqInput = document.getElementById('diff-equation');
    
    if (!methodSelect) return;
    
    const update = () => this.updateDifferentialRecommendation();
    
    if (eqInput) {
        eqInput.addEventListener('input', update);
        eqInput.addEventListener('change', update);
    }
    
    methodSelect.addEventListener('change', (e) => {
        this.showDifferentialMethodHelp(e.target.value);
    });
    
    this.updateDifferentialRecommendation();
    this.showDifferentialMethodHelp(methodSelect.value);
}

//динамический интерфейс для систем
setupSystemInterface() {
    const methodSelect = document.getElementById('system-method');
    const container = document.getElementById('system-method-inputs');
    const countInput = document.getElementById('system-count');
    
    if (!methodSelect || !container || !countInput) return;
    
    const updateMethodInputs = (method) => {
        container.innerHTML = '';
        if (!method) return;
        
        const template = document.getElementById(`${method}-template`);
        if (template) {
            container.appendChild(template.content.cloneNode(true));
            
            if (method === 'jacobi' || method === 'zeidel') {
                setTimeout(() => {
                    createInitialGuessFields(method);
                }, 50);
            }
        }
    };
    
    const createInitialGuessFields = (method) => {
        const vectorContainer = document.getElementById(`${method}-vector-inputs`);
        if (!vectorContainer) return;
        
        const count = parseInt(countInput.value) || 2;
        vectorContainer.innerHTML = '';
        vectorContainer.className = 'vector-input-container';
        
        const leftBracket = document.createElement('span');
        leftBracket.className = 'vector-bracket';
        leftBracket.textContent = '[';
        vectorContainer.appendChild(leftBracket);
        
        for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'vector-input-field';
            input.id = `${method}-initial-${i}`;
            input.value = '0';
            input.step = 'any';
            vectorContainer.appendChild(input);
            
            if (i < count - 1) {
                const separator = document.createElement('span');
                separator.className = 'vector-separator';
                separator.textContent = ',';
                vectorContainer.appendChild(separator);
            }
        }
        
        const rightBracket = document.createElement('span');
        rightBracket.className = 'vector-bracket';
        rightBracket.textContent = ']';
        vectorContainer.appendChild(rightBracket);
    };
    
    const updateEquationInputs = (count) => {
        const eqContainer = document.getElementById('system-equations');
        if (!eqContainer) return;
        
        eqContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'equation-input-wrapper';
            
            const label = document.createElement('div');
            label.className = 'equation-label';
            label.textContent = `Уравнение ${i + 1}:`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'system-eq';
            input.placeholder = `Введите уравнение ${i + 1}`;
            
            //добавляем слушатели на каждое уравнение
            input.addEventListener('input', () => this.updateSystemRecommendation());
            input.addEventListener('change', () => this.updateSystemRecommendation());
            
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            eqContainer.appendChild(wrapper);
        }
        
        //после обновления полей вызываем рекомендацию
        setTimeout(() => this.updateSystemRecommendation(), 50);
    };
    
    //слушатели
    methodSelect.addEventListener('change', (e) => {
        updateMethodInputs(e.target.value);
        this.showSystemMethodHelp(e.target.value);
    });
    
    countInput.addEventListener('change', (e) => {
        const count = parseInt(e.target.value);
        updateEquationInputs(count);
        
        const currentMethod = methodSelect.value;
        if (currentMethod === 'jacobi' || currentMethod === 'zeidel') {
            createInitialGuessFields(currentMethod);
        }
        
        //вызываем рекомендацию после изменения количества
        setTimeout(() => this.updateSystemRecommendation(), 100);
    });
    
    //инициализация
    updateEquationInputs(parseInt(countInput.value));
    updateMethodInputs(methodSelect.value);
    
    //вызываем рекомендацию для начального состояния
    setTimeout(() => this.updateSystemRecommendation(), 100);
    
    //показываем справку для выбранного метода
    if (methodSelect.value) {
        this.showSystemMethodHelp(methodSelect.value);
    }
}




//настройка обработчиков кнопок расчета - привязывает функции расчета к соответсвующим кнопкам
    setupCalculationHandlers() {
        document.getElementById('calculate-equation')?.addEventListener('click', () => this.solveEquation());
        document.getElementById('compare-equation-methods')?.addEventListener('click', () => this.compareEquationMethods());
        document.getElementById('calculate-integration')?.addEventListener('click', () => this.solveIntegration());
        document.getElementById('compare-integration-methods')?.addEventListener('click', () => this.compareIntegrationMethods());
        document.getElementById('calculate-differential')?.addEventListener('click', () => this.solveDifferential());
        document.getElementById('compare-diff-methods')?.addEventListener('click', () => this.compareDiffMethods());
        document.getElementById('calculate-system')?.addEventListener('click', () => this.solveSystem());
        document.getElementById('compare-system-methods')?.addEventListener('click', () => this.compareSystemMethods());
        document.getElementById('neural-solve-btn')?.addEventListener('click', () => this.solveWithNeural());
    }




    //Нейросеть
async solveWithNeural() {
    const queryTextarea = document.getElementById('neural-query');
    const query = queryTextarea?.value.trim();
    
    if (!query) {
        this.app.showError('Введите математическую задачу');
        return;
    }
    
    this.app.setLoadingState(true);
    const resultsContainer = document.getElementById('neural-results');
    
    try {
        // 1. Парсим запрос нейросетью
        const parsed = this.neuralSolver.parseQuery(query);
        console.log('Распознано:', parsed);
        
        // 2. Показываем, что распознали
        resultsContainer.innerHTML = `
            <div class="result-info">
                <i class="fas fa-brain"></i>
                <strong>Нейросеть распознала:</strong>
                <p>Тип задачи: ${this.getTaskTypeName(parsed.taskType)}</p>
                <p>Выражение: ${parsed.expression || '—'}</p>
                ${parsed.params.a !== undefined ? `<p>Пределы: от ${parsed.params.a} до ${parsed.params.b}</p>` : ''}
                ${parsed.params.x0 !== undefined ? `<p>Начальные условия: y(${parsed.params.x0}) = ${parsed.params.y0}</p>` : ''}
                <div class="loading-spinner">🤖 Вычисляю...</div>
            </div>
        `;
        
            // 3. Вызываем соответствующий численный метод
    let result;
    switch (parsed.taskType) {
        case 'equation':
            result = await this.solveEquationFromNeural(parsed);
            break;
        case 'integral':
            result = await this.solveIntegralFromNeural(parsed);
            break;
        case 'ode':
            result = await this.solveODEFromNeural(parsed);
            break;
        case 'system':
            result = await this.solveSystemFromNeural(parsed);
            break;
        default:
            throw new Error('Неизвестный тип задачи');
    }
        
        // 4. Показываем результат
        const response = this.neuralSolver.generateResponse(parsed, result);
        resultsContainer.innerHTML = `
            <div class="result-success">
                <div class="result-main">
                    <div class="result-icon"></div>
                    <div class="result-text">Нейросеть решила задачу!</div>
                </div>
                <div class="result-details">
                    <div class="detail-row">
                        <span class="detail-label">Распознано:</span>
                        <span class="detail-value">${parsed.originalText}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Тип:</span>
                        <span class="detail-value">${this.getTaskTypeName(parsed.taskType)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Решение:</span>
                        <span class="detail-value"><pre>${response}</pre></span>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Ошибка нейросети:', error);
        resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                Ошибка: ${error.message}
            </div>
        `;
    } finally {
        this.app.setLoadingState(false);
    }

    if (result && result.converged) {
    await this.saveResultToDatabase(
        parsed.taskType,
        parsed.expression,
        parsed.recommendedMethod,
        result
    );
}
}

// Вспомогательные методы
getTaskTypeName(type) {
    const names = {
        equation: '📐 Уравнение',
        integral: '∫ Интеграл',
        ode: '📈 Дифференциальное уравнение',
        system: '🔢 Система уравнений'
    };
    return names[type] || type;
}

async solveEquationFromNeural(parsed) {
    // Очищаем выражение
    let func = parsed.expression;
    
    // Если выражение пустое, пробуем извлечь из исходного текста
    if (!func || func === '') {
        const match = parsed.originalText.match(/(\d*x\s*[+\-*/]?\s*\d+)/i);
        if (match) {
            func = match[0].replace(/[хx]/g, 'x');
        } else {
            func = 'x-3'; // значение по умолчанию
        }
    }
    
    // Дополнительная очистка
    func = func
        .replace(/[^0-9x\s\+\-\*\/\^]/gi, '') // убираем всё кроме математики
        .replace(/\s+/g, '')
        .trim();
    
    // Если функция пустая или это просто число
    if (!func || /^\d+$/.test(func)) {
        func = 'x-3';
    }
    
    // Если нет переменной x, добавляем
    if (!func.includes('x') && !func.includes('х')) {
        func = func + '-x';
    }
    
    console.log('Решаем уравнение:', func);
    
    // Автоматически определяем интервал для метода половинного деления
    // или используем метод Ньютона
    const x0 = 1.0;
    const precision = 0.0001;
    
    if (!this.methods.newton) {
        return { converged: false, message: 'Метод Ньютона не загружен' };
    }
    
    try {
        // Пробуем метод Ньютона
        const result = this.methods.newton.solve(func, x0, precision);
        
        // Если не сошелся, пробуем метод половинного деления
        if (!result.converged && this.methods.bisection) {
            console.log('Метод Ньютона не сошелся, пробуем метод половинного деления');
            const a = 0;
            const b = 10;
            const bisectionResult = this.methods.bisection.solve(func, a, b, precision);
            if (bisectionResult.converged) {
                return bisectionResult;
            }
        }
        
        return result;
    } catch (error) {
        console.error('Ошибка решения:', error);
        return { converged: false, message: 'Ошибка: ' + error.message };
    }
}


async solveIntegralFromNeural(parsed) {
    let func = parsed.expression;
    const a = parsed.params.a || 0;
    const b = parsed.params.b || 1;
    
    // Очистка выражения
    func = func
        .replace(/[^0-9x\s\+\-\*/\(\)]/gi, '')
        .trim();
    
    if (!func || func === '') {
        func = 'x^2';
    }
    
    if (!func.includes('x')) {
        func = func + '*x';
    }
    
    console.log('Вычисляем интеграл:', func, 'от', a, 'до', b);
    
    if (!this.methods.simpson) {
        return { converged: false, message: 'Метод Симпсона не загружен' };
    }
    
    try {
        const result = this.methods.simpson.solve(func, a, b, 0.0001, 100, 50);
        return result;
    } catch (error) {
        return { converged: false, message: 'Ошибка: ' + error.message };
    }
}


async solveODEFromNeural(parsed) {
    let equation = parsed.expression;
    const x0 = parsed.params.x0 !== undefined ? parsed.params.x0 : 0;
    const y0 = parsed.params.y0 !== undefined ? parsed.params.y0 : 1;
    const xEnd = 1;
    const step = 0.1;
    
    // Очистка уравнения
    equation = equation
        .replace(/[^0-9xy\s\+\-\*/\(\)]/gi, '')
        .trim();
    
    if (!equation || equation === '') {
        equation = 'x+y';
    }
    
    console.log('Решаем ДУ:', equation, 'с начальными условиями y(', x0, ')=', y0);
    
    if (!this.methods.euler) {
        return { converged: false, message: 'Метод Эйлера не загружен' };
    }
    
    try {
        const result = this.methods.euler.solve(equation, x0, y0, xEnd, step);
        return result;
    } catch (error) {
        return { converged: false, message: 'Ошибка: ' + error.message };
    }
}


async solveSystemFromNeural(parsed) {
    // Парсим уравнения из текста
    const text = parsed.originalText;
    let equations = [];
    
    // Извлекаем уравнения из текста
    // Ищем паттерны вида: x-3=9, 3x+8=2, x+y=5, и т.д.
    const equationPattern = /([a-z]\s*[+\-*/]?\s*\d*\s*[=]\s*\d+)/gi;
    const matches = text.match(equationPattern);
    
    if (matches && matches.length >= 2) {
        equations = matches;
    } else {
        // Альтернативный парсинг: ищем два уравнения через пробел или запятую
        const parts = text.split(/[\s,;]+/);
        for (const part of parts) {
            if (part.includes('=')) {
                equations.push(part);
            }
        }
    }
    
    if (equations.length < 2) {
        return { converged: false, message: 'Не удалось распознать систему уравнений. Пример: x+y=5, x-y=1' };
    }
    
    console.log('Распознанные уравнения:', equations);
    
    // Парсим уравнения в матрицу
    try {
        const { matrix, vector, variables } = this.systemParser.parseEquations(equations);
        
        console.log('Матрица:', matrix);
        console.log('Вектор:', vector);
        
        // Проверяем, что система 2x2
        if (matrix.length !== 2 || matrix[0].length !== 2) {
            return { converged: false, message: 'Нейросеть пока решает только системы 2×2' };
        }
        
        // Используем метод Гаусса
        const result = this.methods.gauss.solve(matrix, vector, variables);
        
        return result;
        
    } catch (error) {
        console.error('Ошибка парсинга системы:', error);
        return { converged: false, message: 'Ошибка: ' + error.message };
    }
}



// Добавьте этот метод в класс MathParser
validateExpression(expression) {
    if (!expression || typeof expression !== 'string') {
        return false;
    }
    
    // Проверяем, что есть переменная или числа
    const hasValidContent = /[0-9x]/.test(expression);
    if (!hasValidContent) return false;
    
    // Проверяем баланс скобок
    let balance = 0;
    for (const char of expression) {
        if (char === '(') balance++;
        if (char === ')') balance--;
        if (balance < 0) return false;
    }
    if (balance !== 0) return false;
    
    return true;
}




//уравнения
    async solveEquation() {
    try {
        const func = document.getElementById('equation-function')?.value;
        const method = document.getElementById('equation-method')?.value;
        
        if (!func) {
            this.app.showError('Введите функцию');
            return;
        }
        
        if (!method) {
            this.app.showError('Выберите метод решения');
            return;
        }
        
        this.app.setLoadingState(true);
        let result;
        
        switch (method) {
            case 'newton': 
                const newtonX0 = parseFloat(document.getElementById('newton-x0')?.value) || 1.0;
                const newtonPrecision = parseFloat(document.getElementById('newton-precision')?.value) || 0.0001;
                result = this.methods.newton.solve(func, newtonX0, newtonPrecision); 
                break;
                
            case 'bisection': 
                const a = parseFloat(document.getElementById('bisection-a')?.value) || 0;
                const b = parseFloat(document.getElementById('bisection-b')?.value) || 1;
                const bisectionPrecision = parseFloat(document.getElementById('bisection-precision')?.value) || 0.0001;
                result = this.methods.bisection.solve(func, a, b, bisectionPrecision); 
                break;
                
            case 'iteration': 
                const iterationX0 = parseFloat(document.getElementById('iteration-x0')?.value) || 1.0;
                const iterationLambda = parseFloat(document.getElementById('iteration-lambda')?.value) || 0.1;
                const iterationPrecision = parseFloat(document.getElementById('iteration-precision')?.value) || 0.0001;
                result = this.methods.iteration.solve(func, iterationX0, iterationLambda, iterationPrecision); 
                break;
                
            case 'secant': 
                const x1 = parseFloat(document.getElementById('secant-x1')?.value) || 0.5;
                const x2 = parseFloat(document.getElementById('secant-x2')?.value) || 1.0;
                const secantPrecision = parseFloat(document.getElementById('secant-precision')?.value) || 0.0001;
                result = this.methods.secant.solve(func, x1, x2, secantPrecision); 
                break;
                
            default: 
                this.app.showError('Неизвестный метод'); 
                this.app.setLoadingState(false);
                return;
        }
        
        if (result && result.converged) {
    const func = document.getElementById('equation-function')?.value;
    const method = document.getElementById('equation-method')?.value;
    await this.saveResultToDatabase('equation', func, method, result);
}


        this.displayEquationResult(result);
        this.app.setLoadingState(false);
    } catch (error) {
        this.app.showError('Ошибка расчета: ' + error.message);
        this.app.setLoadingState(false);
    }
}


async compareEquationMethods() {
    try {
        const func = document.getElementById('equation-function').value;
        console.log('Функция:', func);

        if (!func) {
            this.app.showError('Введите функцию');
            return;
        }
        
        this.app.setLoadingState(true);
        
        const p = this.autoDetectParameters(func);
        const parser = this.app.getMathParser();
        const f = parser.parseFunction(func);
        
        const results = {};
        
        let start = performance.now();
        results.newton = this.methods.newton.solve(func, p.newtonX0);
        results.newton.timeMs = performance.now() - start;
        
        start = performance.now();
        results.bisection = this.methods.bisection.solve(func, p.interval[0], p.interval[1]);
        results.bisection.timeMs = performance.now() - start;
        
        start = performance.now();
        results.iteration = this.methods.iteration.solve(func, p.newtonX0, p.lambda);
        results.iteration.timeMs = performance.now() - start;
        
        start = performance.now();
        results.secant = this.methods.secant.solve(func, p.secantX1, p.secantX2);
        results.secant.timeMs = performance.now() - start;
        
        const container = document.getElementById('equation-results');
        if (!container) return;
        
        if (results.newton.converged) {
            this.chartBuilder.drawEquationChart(func, results.newton.root, null, 'newton');
        }
        
        let html = '<div class="comparison-results">';
        html += '<h3>Сравнение методов</h3>';
        html += '<p><small>Интервал корня: [' + p.interval[0].toFixed(2) + ', ' + p.interval[1].toFixed(2) + ']</small></p>';
        html += '<table class="comparison-table">';
        html += '<thead><tr><th>Метод</th><th>Корень x</th><th>Итерации</th><th>Невязка f(x)</th><th>Время (мс)</th><th>Статус</th></tr></thead>';
        html += '<tbody>';
        
        for (const [method, res] of Object.entries(results)) {
            const methodName = {
                newton: 'Метод Ньютона',
                bisection: 'Метод половинного деления',
                iteration: 'Метод простой итерации',
                secant: 'Метод секущих'
            }[method];
            
            if (res.converged && res.root !== null && res.root !== undefined) {
                const residual = Math.abs(f(res.root));
                const iterations = res.iterationsCount || res.iterations?.length || '—';
                const time = res.timeMs ? res.timeMs.toFixed(2) : '—';
                
                html += '<tr class="status-success">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td>' + res.root.toFixed(8) + '</td>';
                html += '<td>' + iterations + '</td>';
                html += '<td>' + residual.toExponential(4) + '</td>';
                html += '<td>' + time + '</td>';
                html += '<td class="status-success">Сходится</td>';
                html += '</tr>';
            } else {
                html += '<tr class="status-error">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td>—</td>';
                html += '<td>—</td>';
                html += '<td>—</td>';
                html += '<td>—</td>';
                html += '<td class="status-error">Расходится</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody></table>';
        
        const histData = {};
        for (const [method, res] of Object.entries(results)) {
            if (res.converged && res.root !== null) {
                const name = {
                    newton: 'Метод Ньютона',
                    bisection: 'Метод половинного деления',
                    iteration: 'Метод простой итерации',
                    secant: 'Метод секущих'
                }[method];
                histData[name] = res.iterationsCount || res.iterations?.length || 0;
            }
        }
        
        const histId = 'hist-' + Date.now();
        html += '<div class="chart-container" style="margin-top: 2rem;">';
        html += '<h4>Количество итераций</h4>';
        html += '<canvas id="' + histId + '" style="width: 100%; height: 450px;"></canvas>';
        html += '</div>';
        
        const accuracyId = 'accuracy-' + Date.now();
        html += '<div class="chart-container" style="margin-top: 2rem;">';
        html += '<h4>График точности</h4>';
        html += '<canvas id="' + accuracyId + '" style="width: 100%; height: 450px;"></canvas>';
        html += '</div>';
        
        container.innerHTML = html;
        
        const histCanvas = document.getElementById(histId);
        if (histCanvas && Object.keys(histData).length > 0) {
            new Chart(histCanvas, {
                type: 'bar',
                data: {
                    labels: Object.keys(histData),
                    datasets: [{
                        label: 'Итерации',
                        data: Object.values(histData),
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Количество итераций' },
                            ticks: { stepSize: 1, precision: 0 }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
        
        const accuracyCanvas = document.getElementById(accuracyId);
if (accuracyCanvas) {
    const datasets = [];
    const colors = {
        newton: '#2563eb',
        bisection: '#10b981',
        iteration: '#f59e0b',
        secant: '#ef4444'
    };
    const names = {
        newton: 'Метод Ньютона',
        bisection: 'Метод половинного деления',
        iteration: 'Метод простой итерации',
        secant: 'Метод секущих'
    };
    
    for (const [method, res] of Object.entries(results)) {
        if (!res.converged || !res.iterations || res.iterations.length === 0) continue;
        
        const data = [];
        for (let i = 0; i < res.iterations.length; i++) {
            const iter = res.iterations[i];
            let residual = null;
            
            if (iter.error !== undefined) residual = Math.abs(iter.error);
            else if (iter.fx !== undefined) residual = Math.abs(iter.fx);
            else if (iter.fCurrent !== undefined) residual = Math.abs(iter.fCurrent);
            
            if (residual !== null && residual > 0 && isFinite(residual)) {
                data.push({ x: Math.log10(residual), y: i + 1 });
            }
        }
        
        if (data.length > 0) {
            datasets.push({
                label: names[method],
                data: data,
                borderColor: colors[method],
                backgroundColor: colors[method],
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: colors[method],
                showLine: true,
                tension: 0.1,
                fill: false
            });
        }
    }
    
    if (datasets.length > 0) {
        new Chart(accuracyCanvas, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        title: { display: true, text: 'log₁₀|f(x)| (точность)' },
                        reverse: true
                    },
                    y: {
                        title: { display: true, text: 'Номер итерации' },
                        ticks: { stepSize: 1, precision: 0 },
                        min: 0
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const residual = Math.pow(10, ctx.raw.x);
                                return ctx.dataset.label + ': итерация ' + ctx.raw.y + ', невязка = ' + residual.toExponential(2);
                            }
                        }
                    }
                }
            }
        });

    } else {
        accuracyCanvas.parentElement.innerHTML += '<p style="color: gray; text-align: center;">Нет данных для построения графика точности</p>';
    }
}
        
        this.app.setLoadingState(false);
        
    } catch (error) {
        this.app.showError('Ошибка сравнения: ' + error.message);
        this.app.setLoadingState(false);
    }
}


displayEquationResult(result) {
    //контейнер для графика
    const chartContainer = document.querySelector(`#${this.app.currentTab}-tab .visualization-container`);
    if (chartContainer) {
        chartContainer.style.display = 'none';
    }
    
    //контейнер для результатов
    const resultsContainer = document.getElementById('equation-results');
    if (!resultsContainer) {
        console.error('Контейнер equation-results не найден');
        return;
    }
    
    if (!result.converged) {
        resultsContainer.innerHTML = `<div class="error-message">${result.message}</div>`;
        return;
    }
    
    //формируем HTML
    let content = `
        <div class="result-success">
            <h3>Результаты расчета</h3>
            <div class="result-main">
                <div class="result-icon">✅</div>
                <div class="result-text">Уравнение решено!</div>
            </div>
            <div class="result-details">
                <div class="detail-row">
                    <span class="detail-label">Метод:</span>
                    <span class="detail-value">${result.method || 'Не указан'}</span>
                </div>
    `;
    
    if (result.iterationsCount !== undefined) {
        content += `
                <div class="detail-row">
                    <span class="detail-label">Количество итераций:</span>
                    <span class="detail-value">${result.iterationsCount}</span>
                </div>
        `;
    }
    
    if (result.residual !== undefined) {
        content += `
                <div class="detail-row">
                    <span class="detail-label">Невязка:</span>
                    <span class="detail-value">${result.residual.toFixed(10)}</span>
                </div>
        `;
    }
    
    if (result.root !== undefined && result.root !== null) {
        content += `
                <div class="detail-row">
                    <span class="detail-label">Результат:</span>
                    <span class="detail-value">x ≈ ${result.root.toFixed(6)}</span>
                </div>
        `;
    }
    
    content += `
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = content;
    
    if (result.iterations && result.iterations.length > 0) {
        this.displayIterationsTable(resultsContainer, result.iterations);
    }
    
    //рисуем график
    if (result.converged && result.root !== null) {
        const method = document.getElementById('equation-method').value;
        const func = document.getElementById('equation-function').value;
        this.chartBuilder.drawEquationChart(func, result.root, result.iterations, method);
        
        //показываем контейнер с графиком после отрисовки
        if (chartContainer) {
            chartContainer.style.display = 'block';
        }
    }
}





//интегралы
    async solveIntegration() {
    try {
        const func = document.getElementById('integration-function').value;
        const method = document.getElementById('integration-method').value;
        const a = parseFloat(document.getElementById('integration-a').value);
        const b = parseFloat(document.getElementById('integration-b').value);
        const precision = parseFloat(document.getElementById('integration-precision').value) || 1e-6;
        const N = parseInt(document.getElementById('integration-n').value) || 100;
        const maxIterations = 50;
        
        if (!func || isNaN(a) || isNaN(b)) {
            this.app.showError('Введите функцию и пределы интегрирования');
            return;
        }
        
        this.app.setLoadingState(true);
        let result;
        
        switch (method) {
            case 'simpson': 
                result = this.methods.simpson.solve(func, a, b, precision, N, maxIterations); 
                break;
            case 'trapezoidal': 
                result = this.methods.trapezoidal.solve(func, a, b, precision, N, maxIterations); 
                break;
            case 'rectangles': 
                result = this.methods.rectangles.solve(func, a, b, precision, N, maxIterations); 
                break;
            case 'monte-carlo': 
                result = this.methods.monteCarlo.solve(func, a, b, precision, N, maxIterations); 
                break;
            default: 
                this.app.showError('Неизвестный метод'); 
                this.app.setLoadingState(false);
                return;
        }
        
        if (result && result.converged) {
        const func = document.getElementById('integration-function')?.value;
        const method = document.getElementById('integration-method')?.value;
        await this.saveResultToDatabase('integral', func, method, result);
}

        this.displayIntegrationResult(result);
        this.app.setLoadingState(false);
        
    } catch (error) {
        this.app.showError('Ошибка расчета: ' + error.message);
        this.app.setLoadingState(false);
    }
}


async compareIntegrationMethods() {
    try {
        const func = document.getElementById('integration-function').value;
        const a = parseFloat(document.getElementById('integration-a').value);
        const b = parseFloat(document.getElementById('integration-b').value);
        const precision = parseFloat(document.getElementById('integration-precision').value) || 1e-6;
        const N = parseInt(document.getElementById('integration-n').value) || 100;
        const maxIterations = 50;
        
        if (!func || isNaN(a) || isNaN(b)) {
            this.app.showError('Введите функцию и пределы интегрирования');
            return;
        }
        
        this.app.setLoadingState(true);
        
        const parser = this.app.getMathParser();
        const f = parser.parseFunction(func);
        
        const results = {};
        
        let start = performance.now();
        results.simpson = this.methods.simpson.solve(func, a, b, precision, N, maxIterations);
        results.simpson.timeMs = performance.now() - start;
        
        start = performance.now();
        results.trapezoidal = this.methods.trapezoidal.solve(func, a, b, precision, N, maxIterations);
        results.trapezoidal.timeMs = performance.now() - start;
        
        start = performance.now();
        results.rectangles = this.methods.rectangles.solve(func, a, b, precision, N, maxIterations);
        results.rectangles.timeMs = performance.now() - start;
        
        start = performance.now();
        results.monteCarlo = this.methods.monteCarlo.solve(func, a, b, precision, N, maxIterations);
        results.monteCarlo.timeMs = performance.now() - start;
        
        const container = document.getElementById('integration-results');
        if (!container) return;
        
        this.chartBuilder.drawIntegrationChart(func, a, b, 'compare', null);
        
        let html = '<div class="comparison-results">';
        html += '<h3>Сравнение методов интегрирования</h3>';
        html += '<p><small>Точность: ' + precision + ', начальное N: ' + N + '</small></p>';
        html += '<table class="comparison-table">';
        html += '<thead><tr><th>Метод</th><th>Значение интеграла</th><th>Итерации</th><th>Конечное N</th><th>Погрешность</th><th>Время (мс)</th><th>Статус</th></tr></thead>';
        html += '<tbody>';
        
        for (const [method, res] of Object.entries(results)) {
            const methodName = {
                simpson: 'Метод Симпсона',
                trapezoidal: 'Метод трапеций',
                rectangles: 'Метод прямоугольников',
                monteCarlo: 'Метод Монте-Карло'
            }[method];
            
            if (res.converged && res.result !== null) {
                const iterations = res.iterations.length;
                const lastIter = res.iterations[res.iterations.length - 1];
                const finalN = lastIter.n;
                
                let error = null;
                if (lastIter.error !== undefined && lastIter.error > 0) {
                    error = lastIter.error;
                } else if (iterations > 1) {
                    const prevIter = res.iterations[res.iterations.length - 2];
                    if (prevIter.error !== undefined && prevIter.error > 0) {
                        error = prevIter.error;
                    }
                }
                
                const time = res.timeMs ? res.timeMs.toFixed(2) : '—';
                
                html += '<tr class="status-success">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td>' + res.result.toFixed(8) + '</td>';
                html += '<td>' + iterations + '</td>';
                html += '<td>' + finalN + '</td>';
                html += '<td>' + (error ? error.toExponential(4) : '< 1e-15') + '</td>';
                html += '<td>' + time + '</td>';
                html += '<td class="status-success">Сходится</td>';
                html += '</tr>';
            } else {
                html += '<tr class="status-error">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td colspan="5">—</td>';
                html += '<td class="status-error">' + (res.message || 'Расходится') + '</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody></table>';
        
        const histData = {};
        for (const [method, res] of Object.entries(results)) {
            if (res.converged) {
                const name = {
                    simpson: 'Симпсон',
                    trapezoidal: 'Трапеции',
                    rectangles: 'Прямоугольники',
                    monteCarlo: 'Монте-Карло'
                }[method];
                histData[name] = res.iterations.length;
            }
        }
        
        const histId = 'hist-' + Date.now();
        html += '<div class="chart-container" style="margin-top: 2rem;">';
        html += '<h4>Количество итераций</h4>';
        html += '<canvas id="' + histId + '" style="width: 100%; height: 450px;"></canvas>';
        html += '</div>';
        
        const accuracyId = 'accuracy-' + Date.now();
        html += '<div class="chart-container" style="margin-top: 2rem;">';
        html += '<h4>График точности</h4>';
        html += '<canvas id="' + accuracyId + '" style="width: 100%; height: 450px;"></canvas>';
        html += '</div>';
        
        container.innerHTML = html;
        
        const histCanvas = document.getElementById(histId);
        if (histCanvas && Object.keys(histData).length > 0) {
            new Chart(histCanvas, {
                type: 'bar',
                data: {
                    labels: Object.keys(histData),
                    datasets: [{
                        label: 'Итерации',
                        data: Object.values(histData),
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Количество итераций' },
                            ticks: { stepSize: 1, precision: 0 }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
        
        const accuracyCanvas = document.getElementById(accuracyId);
        if (accuracyCanvas) {
            const datasets = [];
            const colors = {
                simpson: '#2563eb',
                trapezoidal: '#10b981',
                rectangles: '#f59e0b',
                monteCarlo: '#ef4444'
            };
            const names = {
                simpson: 'Симпсон',
                trapezoidal: 'Трапеции',
                rectangles: 'Прямоугольники',
                monteCarlo: 'Монте-Карло'
            };
            
            for (const [method, res] of Object.entries(results)) {
                if (!res.converged || !res.iterations || res.iterations.length === 0) continue;
                
                const data = [];
                for (let i = 0; i < res.iterations.length; i++) {
                    const iter = res.iterations[i];
                    if (iter.error !== undefined && iter.error !== null && iter.error > 0 && isFinite(iter.error)) {
                        data.push({ x: Math.log10(iter.error), y: i + 1 });
                    }
                }
                
                if (data.length > 0) {
                    datasets.push({
                        label: names[method],
                        data: data,
                        borderColor: colors[method],
                        backgroundColor: colors[method],
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: colors[method],
                        showLine: true,
                        tension: 0.1,
                        fill: false
                    });
                }
            }
            
            if (datasets.length > 0) {
                new Chart(accuracyCanvas, {
                    type: 'scatter',
                    data: { datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                title: { display: true, text: 'log₁₀(погрешность)' },
                                reverse: true
                            },
                            y: {
                                title: { display: true, text: 'Номер итерации' },
                                ticks: { stepSize: 1, precision: 0 },
                                min: 0
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        const error = Math.pow(10, ctx.raw.x);
                                        return ctx.dataset.label + ': итерация ' + ctx.raw.y + ', погрешность = ' + error.toExponential(2);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        
        this.app.setLoadingState(false);
        
    } catch (error) {
        this.app.showError('Ошибка сравнения: ' + error.message);
        this.app.setLoadingState(false);
    }
}



displayIntegrationResult(result) {
    //контейнер для графика
    const chartContainer = document.querySelector(`#${this.app.currentTab}-tab .visualization-container`);
    if (chartContainer) {
        chartContainer.style.display = 'none';
    }
    
    //контейнер для результатов
    const container = document.getElementById('integration-results');
    if (!container) {
        console.error('Контейнер integration-results не найден');
        return;
    }
    
    if (!result.converged) {
        container.innerHTML = `<div class="error-message">${result.message}</div>`;
        return;
    }
    
    const func = document.getElementById('integration-function').value;
    const a = parseFloat(document.getElementById('integration-a').value);
    const b = parseFloat(document.getElementById('integration-b').value);
    const method = document.getElementById('integration-method').value;
    
    //рисуем график
    if (func && !isNaN(a) && !isNaN(b) && method) {
        this.lastIntegrationData = { func, a, b, method, iterations: result.iterations };
        this.chartBuilder.drawIntegrationChart(func, a, b, method, result.iterations);
        
        //показываем контейнер с графиком после отрисовки
        if (chartContainer) {
            chartContainer.style.display = 'block';
        }
    }
    
    const resultValue = typeof result.result === 'string' 
        ? parseFloat(result.result) 
        : result.result;
    
    let html = `
        <div class="result-success">
            <h3>Результаты интегрирования</h3>
            <div class="result-main">
                <div class="result-icon">✅</div>
                <div class="result-text">Интеграл вычислен!</div>
            </div>
            <div class="result-details">
                <div class="detail-row">
                    <span class="detail-label">Метод:</span>
                    <span class="detail-value">${result.method || 'Метод Симпсона'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Результат:</span>
                    <span class="detail-value">${resultValue !== null && resultValue !== undefined ? resultValue.toFixed(8) : '—'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Итераций:</span>
                    <span class="detail-value">${result.iterations?.length || 0}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Погрешность:</span>
                    <span class="detail-value">${result.iterations?.length > 0 ? 
                        (typeof result.iterations[result.iterations.length - 1].error === 'number' ? 
                         result.iterations[result.iterations.length - 1].error.toFixed(10) : '—') : '—'}</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    if (result.iterations && result.iterations.length > 0) {
        this.displayIterationsTable(container, result.iterations, {
            columns: ['Итерация', 'n', 'h', 'Iₙ', 'Погрешность'],
            extractRow: (iter, index) => [
                index + 1,
                iter.n || '-',
                typeof iter.h === 'number' ? iter.h.toFixed(8) : iter.h || '-',
                typeof iter.I_n === 'number' ? iter.I_n.toFixed(8) : 
                typeof iter.result === 'number' ? iter.result.toFixed(8) : '-',
                iter.error?.toFixed(8) || '-'
            ],
            title: 'Процесс интегрирования:'
        });
    }
}






//диффуры
    async solveDifferential() {
    try {
        const func = document.getElementById('diff-equation').value;
        const method = document.getElementById('diff-method').value;
        const x0 = parseFloat(document.getElementById('diff-x0').value);
        const y0 = parseFloat(document.getElementById('diff-y0').value);
        const xEnd = parseFloat(document.getElementById('diff-end').value);
        const step = parseFloat(document.getElementById('diff-step')?.value) || 0.1;
        
        if (!func) {
            this.app.showError('Введите уравнение');
            return;
        }
        
        if (isNaN(x0) || isNaN(y0) || isNaN(xEnd)) {
            this.app.showError('Введите корректные числовые значения');
            return;
        }
        
        if (step <= 0) {
            this.app.showError('Шаг должен быть положительным');
            return;
        }
        
        this.app.setLoadingState(true);
        let result;
        
        switch (method) {
            case 'euler': 
                result = this.methods.euler.solve(func, x0, y0, xEnd, step);
                break;
            case 'runge-kutta': 
                result = this.methods.rungeKutta.solve(func, x0, y0, xEnd, step);
                break;
            default: 
                this.app.showError('Неизвестный метод'); 
                this.app.setLoadingState(false);
                return;
        }

        if (result && result.converged) {
        const equation = document.getElementById('diff-equation')?.value;
        const method = document.getElementById('diff-method')?.value;
        await this.saveResultToDatabase('ode', equation, method, result);
}
        
        this.displayDifferentialResult(result);
        this.app.setLoadingState(false);
    } catch (error) {
        console.error('Ошибка расчета диффура:', error);
        this.app.showError('Ошибка расчета: ' + error.message);
        this.app.setLoadingState(false);
    }
}



    async compareDiffMethods() {
    try {
        const func = document.getElementById('diff-equation').value;
        const x0 = parseFloat(document.getElementById('diff-x0').value);
        const y0 = parseFloat(document.getElementById('diff-y0').value);
        const xEnd = parseFloat(document.getElementById('diff-end').value);
        const step = parseFloat(document.getElementById('diff-step')?.value) || 0.1;
        
        if (!func || isNaN(x0) || isNaN(y0) || isNaN(xEnd)) {
            this.app.showError('Введите уравнение и начальные условия');
            return;
        }
        
        if (step <= 0) {
            this.app.showError('Шаг должен быть положительным');
            return;
        }
        
        this.app.setLoadingState(true);
        
        const results = {};
        
        let start = performance.now();
        results.euler = this.methods.euler.solve(func, x0, y0, xEnd, step);
        results.euler.timeMs = performance.now() - start;
        
        start = performance.now();
        results.rungeKutta = this.methods.rungeKutta.solve(func, x0, y0, xEnd, step);
        results.rungeKutta.timeMs = performance.now() - start;
        
        const container = document.getElementById('differential-results');
        if (!container) return;
        
        if (results.euler.iterations && results.rungeKutta.iterations) {
            this.chartBuilder.drawDifferentialEquationChart(
                func,
                'compare',
                x0,
                y0,
                step,
                Math.max(results.euler.iterationsCount || 0, results.rungeKutta.iterationsCount || 0),
                {
                    euler: results.euler.iterations,
                    rungeKutta: results.rungeKutta.iterations
                }
            );
        }
        
        let html = '<div class="comparison-results">';
        html += '<h3>Сравнение методов решения ДУ</h3>';
        html += '<table class="comparison-table">';
        html += '<thead><tr><th>Метод</th><th>y(x_end)</th><th>Шагов</th><th>Время (мс)</th><th>Статус</th></tr></thead>';
        html += '<tbody>';
        
        for (const [method, res] of Object.entries(results)) {
            const methodName = {
                euler: 'Метод Эйлера',
                rungeKutta: 'Метод Рунге-Кутты 4-го порядка'
            }[method];
            
            if (res.converged) {
                const steps = res.iterationsCount || res.iterations?.length || '—';
                const time = res.timeMs ? res.timeMs.toFixed(2) : '—';
                const finalY = res.final_y !== undefined ? res.final_y.toFixed(8) : '—';
                
                html += '<tr class="status-success">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td>' + finalY + '</td>';
                html += '<td>' + steps + '</td>';
                html += '<td>' + time + '</td>';
                html += '<td class="status-success">Сходится</td>';
                html += '</tr>';
            } else {
                html += '<tr class="status-error">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td colspan="3">—</td>';
                html += '<td class="status-error">' + (res.message || 'Расходится') + '</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody></table></div>';
        
        container.innerHTML = html;
        
        this.app.setLoadingState(false);
        
    } catch (error) {
        this.app.showError('Ошибка сравнения: ' + error.message);
        this.app.setLoadingState(false);
    }
}



displayDifferentialResult(result) {
    //контейнер для графика
    const chartContainer = document.querySelector(`#${this.app.currentTab}-tab .visualization-container`);
    if (chartContainer) {
        chartContainer.style.display = 'none';
    }
    
    //контейнер для результатов
    const container = document.getElementById('differential-results');
    if (!container) {
        console.error('Контейнер differential-results не найден');
        return;
    }
    
    if (!result.converged) {
        container.innerHTML = `<div class="error-message">${result.message}</div>`;
        return;
    }
    
    let html = `
        <div class="result-success">
            <h3>Дифференциальные уравнения</h3>
            <div class="result-main">
                <div class="result-icon">✅</div>
                <div class="result-text">Уравнение решено!</div>
            </div>
            <div class="result-details">
                <div class="detail-row">
                    <span class="detail-label">Метод:</span>
                    <span class="detail-value">${result.method || 'Не указан'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Уравнение:</span>
                    <span class="detail-value">y' = ${document.getElementById('diff-equation').value}</span>
                </div>
    `;
    
    if (result.parameters) {
        html += `
                <div class="detail-row">
                    <span class="detail-label">Начальные условия:</span>
                    <span class="detail-value">y(${result.parameters.x0}) = ${result.parameters.y0}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Конечная точка:</span>
                    <span class="detail-value">x_end = ${result.parameters.xEnd}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Шаг h:</span>
                    <span class="detail-value">${result.parameters.step}</span>
                </div>
        `;
    }
    
    html += `
                <div class="detail-row">
                    <span class="detail-label">Итераций (шагов):</span>
                    <span class="detail-value">${result.iterationsCount || result.iterations?.length || 0}</span>
                </div>
    `;
    
    if (result.final_y !== undefined && result.final_x !== undefined) {
        html += `
                <div class="detail-row">
                    <span class="detail-label">Финальная точка:</span>
                    <span class="detail-value">(${result.final_x.toFixed(6)}, ${result.final_y.toFixed(6)})</span>
                </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    //таблица итераций для ДУ
    if (result.iterations && result.iterations.length > 0) {
        const isEuler = result.method?.includes('Эйлер');
        const isRungeKutta = result.method?.includes('Рунге-Кутт');
        
        let columns = ['Шаг', 'x', 'y'];
        let extractRow;
        
        if (isEuler) {
            columns.push('Производная');
            extractRow = (iter) => [
                iter.step || 0,
                iter.x.toFixed(6),
                iter.y.toFixed(6),
                (iter.derivative || 0).toFixed(6)
            ];
        } else if (isRungeKutta) {
            columns.push('k1', 'k2', 'k3', 'k4');
            extractRow = (iter) => [
                iter.step || 0,
                iter.x.toFixed(6),
                iter.y.toFixed(6),
                (iter.k1 || 0).toFixed(6),
                (iter.k2 || 0).toFixed(6),
                (iter.k3 || 0).toFixed(6),
                (iter.k4 || 0).toFixed(6)
            ];
        } else {
            extractRow = (iter) => [
                iter.step || 0,
                iter.x.toFixed(6),
                iter.y.toFixed(6)
            ];
        }
        
        this.displayIterationsTable(container, result.iterations, {
            columns,
            extractRow,
            title: 'Процесс решения:'
        });
    }
    
    //рисуем график
    if (result.iterations && result.iterations.length > 0) {
        const step = parseFloat(document.getElementById('diff-step')?.value) || 0.1;
        const method = document.getElementById('diff-method').value;
        
        this.chartBuilder.drawDifferentialEquationChart(
            document.getElementById('diff-equation').value,
            method,
            result.iterations[0].x,
            result.iterations[0].y,
            step,
            result.iterationsCount || result.iterations.length,
            result.iterations
        );
        
        //показываем контейнер с графиком после отрисовки
        if (chartContainer) {
            chartContainer.style.display = 'block';
        }
    }
}






//системы
async solveSystem() {
    try {
        const equationInputs = document.querySelectorAll('.system-eq');
        const equations = Array.from(equationInputs).map(input => input.value).filter(eq => eq.trim());
        
        if (equations.length === 0) {
            this.app.showError('Введите уравнения системы');
            return;
        }
        
        const method = document.getElementById('system-method').value;
        this.app.setLoadingState(true);
        
        const { matrix, vector, variables } = this.systemParser.parseEquations(equations);
        
        let result;
        
        switch (method) {
            case 'gauss': 
                result = this.methods.gauss.solve(matrix, vector, variables);
                break;
                
            case 'jacobi': 
            case 'zeidel': 
                const params = this.getIterationParameters(method, matrix.length);
                result = this.methods[method].solve(
                    matrix, 
                    vector, 
                    params.initialGuess,
                    variables,
                    params.precision,
                    params.maxIterations
                );
                result.initialGuess = params.initialGuess;
                break;
                
            default: 
                this.app.showError('Неизвестный метод'); 
                this.app.setLoadingState(false);
                return;
        }
        
        //добавляем данные для графика
        result.matrix = result.matrix || matrix;
        result.vector = result.vector || vector;
        result.variables = result.variables || variables;


        if (result && result.converged) {
    // Собираем уравнения системы в одну строку
    const eqInputs = document.querySelectorAll('.system-eq');
    const equations = Array.from(eqInputs).map(inp => inp.value).join('; ');
    const method = document.getElementById('system-method')?.value;
    await this.saveResultToDatabase('system', equations, method, result);
}
        
        this.displaySystemResult(result);
        this.app.setLoadingState(false);
        
    } catch (error) {
        console.error('Ошибка решения системы:', error);
        this.app.showError('Ошибка решения системы: ' + error.message);
        this.app.setLoadingState(false);
    }
}


getIterationParameters(method, n) {    
    let precision = 1e-6;
    let maxIterations = 1000;
    
    //точность
    const precisionInput = document.getElementById(`${method}-precision`);
    if (precisionInput && precisionInput.value) {
        precision = parseFloat(precisionInput.value);
    }
    
    //макс итераций
    const maxIterationsInput = document.getElementById(`${method}-max-iterations`);
    if (maxIterationsInput && maxIterationsInput.value) {
        maxIterations = parseInt(maxIterationsInput.value);
    }
    
    //начал приближение
    let initialGuess = Array(n).fill(0);
    
    try {
        const values = [];
        for (let i = 0; i < n; i++) {
            const input = document.getElementById(`${method}-initial-${i}`);
            if (input && input.value !== '') {
                const val = parseFloat(input.value);
                values.push(!isNaN(val) ? val : 0);
            } else {
                values.push(0);
            }
        }
        
        if (values.length === n && values.every(v => !isNaN(v))) {
            initialGuess = values;
        }
        
    } catch (e) {
        console.warn(`Ошибка чтения начального приближения ${method}:`, e);
    }
    
    return { precision, maxIterations, initialGuess };
}



    async compareSystemMethods() {
    try {
        const equationInputs = document.querySelectorAll('.system-eq');
        const equations = Array.from(equationInputs).map(input => input.value).filter(eq => eq.trim());
        
        if (equations.length === 0) {
            this.app.showError('Введите уравнения системы');
            return;
        }
        
        this.app.setLoadingState(true);
        
        const { matrix, vector, variables } = this.systemParser.parseEquations(equations);
        const n = matrix.length;
        
        const results = {};
        
        //метод Гаусса
        let start = performance.now();
        results.gauss = this.methods.gauss.solve(matrix, vector, variables);
        results.gauss.timeMs = performance.now() - start;
        
        //метод Якоби
        start = performance.now();
        const jacobiInitialGuess = Array(n).fill(0);
        results.jacobi = this.methods.jacobi.solve(
            matrix, 
            vector, 
            jacobiInitialGuess,
            variables,
            1e-6,
            1000
        );
        results.jacobi.timeMs = performance.now() - start;
        
        //метод Зейделя
        start = performance.now();
        const zeidelInitialGuess = Array(n).fill(0);
        results.zeidel = this.methods.zeidel.solve(
            matrix, 
            vector, 
            zeidelInitialGuess,
            variables,
            1e-6,
            1000
        );
        results.zeidel.timeMs = performance.now() - start;
        
        const container = document.getElementById('system-results');
        if (!container) return;
        
        //рисуем график для двумерн систем
        if (variables.length === 2 && results.gauss.converged) {
            this.chartBuilder.drawSystemChart(
                matrix,
                vector,
                variables,
                'compare',
                results.gauss
            );
        }
        
        //таблица сравнения
        let html = '<div class="comparison-results">';
        html += '<h3>Сравнение методов решения систем</h3>';
        html += '<table class="comparison-table">';
        html += '<thead>';
        html += '<tr><th>Метод</th><th>Решение</th><th>Итерации</th><th>Невязка</th><th>Время (мс)</th><th>Статус</th></tr>';
        html += '</thead>';
        html += '<tbody>';
        
        for (const [method, res] of Object.entries(results)) {
            const methodName = {
                gauss: 'Метод Гаусса',
                jacobi: 'Метод Якоби',
                zeidel: 'Метод Зейделя'
            }[method];
            
            if (res.converged && res.solution) {
                const solutionStr = res.solution.map(x => x.toFixed(6)).join(', ');
                const iterations = method === 'gauss' ? '-' : (res.iterationsCount || res.iterations?.length || '—');
                const residual = res.residual !== undefined && isFinite(res.residual) ? res.residual.toExponential(4) : '—';
                const time = res.timeMs ? res.timeMs.toFixed(2) : '—';
                
                html += '<tr class="status-success">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td>[' + solutionStr + ']</td>';
                html += '<td>' + iterations + '</td>';
                html += '<td>' + residual + '</td>';
                html += '<td>' + time + '</td>';
                html += '<td class="status-success">Сходится</td>';
                html += '</tr>';
            } else {
                const message = res.message || 'Расходится';
                html += '<tr class="status-error">';
                html += '<td><strong>' + methodName + '</strong></td>';
                html += '<td colspan="4">—</td>';
                html += '<td class="status-error">' + message + '</td>';
                html += '</tr>';
            }
        }
        
        html += '</tbody></table></div>';
        
        //диаграмма итераций
        const histData = {};
        if (results.jacobi.converged && results.jacobi.iterationsCount) {
            histData['Якоби'] = results.jacobi.iterationsCount;
        }
        if (results.zeidel.converged && results.zeidel.iterationsCount) {
            histData['Зейдель'] = results.zeidel.iterationsCount;
        }
        
        if (Object.keys(histData).length > 0) {
            const histId = 'hist-' + Date.now();
            html += '<div class="chart-container" style="margin-top: 2rem;">';
            html += '<h4>Количество итераций (итерационные методы)</h4>';
            html += '<canvas id="' + histId + '" style="width: 100%; height: 450px;"></canvas>';
            html += '</div>';
            container.innerHTML = html;
            
            const histCanvas = document.getElementById(histId);
            if (histCanvas) {
                new Chart(histCanvas, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(histData),
                        datasets: [{
                            label: 'Итерации',
                            data: Object.values(histData),
                            backgroundColor: '#3b82f6',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: 'Количество итераций' },
                                ticks: { stepSize: 1, precision: 0 }
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        } else {
            container.innerHTML = html;
        }
        
        //график сходимости для итерационных методов
        const hasJacobiData = results.jacobi.iterations && results.jacobi.iterations.length > 0 && results.jacobi.converged;
        const hasZeidelData = results.zeidel.iterations && results.zeidel.iterations.length > 0 && results.zeidel.converged;
        
        if (hasJacobiData || hasZeidelData) {
            const accuracyId = 'accuracy-' + Date.now();
            const accuracyHtml = '<div class="chart-container" style="margin-top: 2rem;">' +
                '<h4>График сходимости итерационных методов</h4>' +
                '<canvas id="' + accuracyId + '" style="width: 100%; height: 450px;"></canvas>' +
                '</div>';
            
            container.insertAdjacentHTML('beforeend', accuracyHtml);
            
            const accuracyCanvas = document.getElementById(accuracyId);
            if (accuracyCanvas) {
                const datasets = [];
                const colors = {
                    jacobi: '#f59e0b',
                    zeidel: '#10b981'
                };
                const names = {
                    jacobi: 'Метод Якоби',
                    zeidel: 'Метод Зейделя'
                };
                
                for (const [method, res] of Object.entries(results)) {
                    if (method !== 'jacobi' && method !== 'zeidel') continue;
                    if (!res.converged || !res.iterations || res.iterations.length === 0) continue;
                    
                    const data = [];
                    for (let i = 0; i < res.iterations.length; i++) {
                        const iter = res.iterations[i];
                        let residual = null;
                        
                        if (iter.residual !== undefined && isFinite(iter.residual) && iter.residual > 0) {
                            residual = Math.abs(iter.residual);
                        } else if (iter.error !== undefined && isFinite(iter.error) && iter.error > 0) {
                            residual = Math.abs(iter.error);
                        }
                        
                        if (residual !== null && residual > 0 && isFinite(residual)) {
                            const logVal = Math.log10(residual);
                            if (isFinite(logVal)) {
                                data.push({ x: logVal, y: i + 1 });
                            }
                        }
                    }
                    
                    if (data.length > 0) {
                        datasets.push({
                            label: names[method],
                            data: data,
                            borderColor: colors[method],
                            backgroundColor: colors[method],
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: colors[method],
                            showLine: true,
                            tension: 0.1,
                            fill: false
                        });
                    }
                }
                
                if (datasets.length > 0) {
                    new Chart(accuracyCanvas, {
                        type: 'scatter',
                        data: { datasets },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            scales: {
                                x: {
                                    title: { display: true, text: 'log₁₀(невязка)' },
                                    reverse: true
                                },
                                y: {
                                    title: { display: true, text: 'Номер итерации' },
                                    ticks: { stepSize: 1, precision: 0 },
                                    min: 0
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => {
                                            const residual = Math.pow(10, ctx.raw.x);
                                            return ctx.dataset.label + ': итерация ' + ctx.raw.y + ', невязка = ' + residual.toExponential(2);
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
        
        this.app.setLoadingState(false);
        
    } catch (error) {
        console.error('Ошибка сравнения систем:', error);
        this.app.showError('Ошибка сравнения: ' + error.message);
        this.app.setLoadingState(false);
    }
}



    displaySystemResult(result) {
    //контейнер для графика
    const chartContainer = document.querySelector(`#${this.app.currentTab}-tab .visualization-container`);
    if (chartContainer) {
        chartContainer.style.display = 'none';
    }
    
    const container = document.getElementById('system-results');
    if (!container) {
        console.error('Контейнер system-results не найден!');
        return;
    }
    
    if (!result.converged) {
        container.innerHTML = `<div class="error-message">${result.message}</div>`;
        return;
    }
    
    let html = `
        <div class="result-success">
            <h3>${result.method}</h3>
            <div class="result-main">
                <div class="result-icon">✅</div>
                <div class="result-text">
                    ${result.message || 'Система решена!'}
                </div>
            </div>
            <div class="result-details">
                <div class="detail-row">
                    <span class="detail-label">Метод:</span>
                    <span class="detail-value">${result.method}</span>
                </div>
    `;
    
    //для гаусса показываем определитель
    if (result.method === 'Метод Гаусса' && result.determinant !== null && result.determinant !== undefined) {
        html += `
                <div class="detail-row">
                    <span class="detail-label">Определитель:</span>
                    <span class="detail-value">${result.determinant.toFixed(6)}</span>
                </div>
        `;
    }
    
    //для итерационных методов показываем количество итераций
    if ((result.method === 'Метод Якоби' || result.method === 'Метод Зейделя') && 
        result.iterationsCount !== null && result.iterationsCount !== undefined) {
        html += `
                <div class="detail-row">
                    <span class="detail-label">Итераций:</span>
                    <span class="detail-value">${result.iterationsCount}</span>
                </div>
        `;
    }
    
    if (result.residual !== null && result.residual !== undefined) {
        html += `
                <div class="detail-row">
                    <span class="detail-label">Невязка:</span>
                    <span class="detail-value">${result.residual.toFixed(10)}</span>
                </div>
        `;
    }
    
    html += `
                <div class="detail-row">
                    <span class="detail-label">Решение:</span>
                    <span class="detail-value solution">
    `;
    
    //вывод решения с именами переменных
    if (result.variables && result.solution) {
        result.variables.forEach((varName, idx) => {
            html += `${varName} = ${result.solution[idx].toFixed(6)}<br>`;
        });
    } else if (result.solution) {
        html += `[${result.solution.map(x => x.toFixed(6)).join(', ') || '—'}]`;
    }
    
    html += `</span>
                </div>
            </div>
        </div>
    `;
    
    if (result.method === 'Метод Гаусса' && result.steps) {
        html += this.displayGaussSteps(result.steps, result.variables);
    }
    if ((result.method === 'Метод Якоби' || result.method === 'Метод Зейделя') && 
        result.iterations && result.iterations.length > 0) {
        const tempDiv = document.createElement('div');
        this.displayIterationsTable(tempDiv, result.iterations, {
            columns: ['Итерация', ...result.variables, 'Невязка'],
            extractRow: (iter, index) => [
                iter.iteration || index + 1,
                ...result.variables.map((_, idx) => 
                    (iter.x?.[idx] || iter.solution?.[idx] || 0).toFixed(6)
                ),
                iter.residual?.toFixed(6) || '-'
            ],
            title: 'Процесс итераций:'
        });
        html += tempDiv.innerHTML;
    }
    
    container.innerHTML = html;
    
    //проверяем что система 2д и рисуем основной график
    if (result.variables && result.variables.length === 2 && 
        result.matrix && result.matrix.length === 2 && 
        result.vector && result.vector.length === 2 &&
        result.solution && result.solution.length === 2) {
        
        setTimeout(() => {
            try {
                let methodType = 'gauss';
                if (result.method.includes('Якоби')) methodType = 'jacobi';
                if (result.method.includes('Зейделя') || result.method.includes('Зейдел')) methodType = 'zeidel';
                
                this.chartBuilder.drawSystemChart(
                    result.matrix,
                    result.vector,
                    result.variables,
                    methodType,
                    result
                );
                
                //показываем контейнер с графиком после отрисовки
                if (chartContainer) {
                    chartContainer.style.display = 'block';
                }
                
            } catch (error) {
                console.warn('Ошибка построения основного графика:', error);
            }
        }, 100);
    }
}

displayGaussSteps(steps, variables) {
    if (!steps || steps.length === 0) return '';
    
    let html = '<div class="gauss-steps">';
    html += '<h4>Пошаговое решение методом Гаусса</h4>';
    
    steps.forEach((step, index) => {
        html += `<div class="gauss-step step-${step.type}">`;
        html += `<h5>${step.label}</h5>`;
        
        if (step.type === 'initial' || step.type === 'after_forward' || 
            step.type === 'row_swap' || step.type === 'elimination') {
            //выводим матрицу
            html += '<div class="matrix-container">';
            html += this.formatMatrixTable(step.matrix, variables);
            html += '</div>';
            
            //дополнительная информация
            if (step.details) {
                if (step.type === 'row_swap') {
                    html += `<p class="step-details">Переставлены строки ${step.details.row1 + 1} и ${step.details.row2 + 1}</p>`;
                } else if (step.type === 'elimination') {
                    html += `<p class="step-details">Обнулены элементы под диагональю в столбце ${step.details.column + 1}</p>`;
                }
            }
            
        } else if (step.type === 'back_substitution') {
            //выводим шаги обратной подстановки
            html += '<div class="back-substitution">';
            if (step.steps && step.steps.length > 0) {
                step.steps.forEach(subStep => {
                    html += `
                        <div class="substitution-step">
                            <span class="step-number">Шаг ${subStep.step}:</span>
                            <span class="variable">${subStep.variable}</span>
                            <span class="equation">${subStep.equation}</span>
                        </div>
                    `;
                });
            }
            html += '</div>';
        } else if (step.type === 'error') {
            html += '<div class="error-step">';
            html += '<p>Матрица вырождена, решение невозможно</p>';
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    return html;
}

formatMatrixTable(matrix, variables) {
    const n = matrix.length;
    const m = matrix[0].length; //n+1 для расширенной матрицы
    
    let table = '<table class="matrix-table">';
    
    //заголовок с именами переменных
    table += '<thead>';
    table += '<tr><th></th>';
    for (let j = 0; j < m - 1; j++) {
        const varName = variables && variables[j] ? variables[j] : `x${j+1}`;
        table += `<th>${varName}</th>`;
    }
    table += '<th class="vector-col">b</th>';
    table += '</tr></thead>';
    
    //данные матрицы
    table += '<tbody>';
    for (let i = 0; i < n; i++) {
        table += '<tr>';
        table += `<td class="row-label">${i+1}</td>`;
        
        for (let j = 0; j < m; j++) {
            const value = matrix[i][j];
            let displayValue = value.toFixed(4);
            let cellClass = '';
            
            if (Math.abs(value) < 1e-10) {
                displayValue = '0.0000';
                cellClass = 'zero';
            } else if (j === i) {
                cellClass = 'diagonal';
            } else if (j < i && j < m - 1) {
                cellClass = 'below-diagonal';
            }
            
            //последний столбец (вектор b)
            if (j === m - 1) {
                cellClass += ' vector-cell';
            }
            
            table += `<td class="${cellClass}">${displayValue}</td>`;
        }
        
        table += '</tr>';
    }
    table += '</tbody></table>';
    
    return table;
}




//метод для отображения таблиц итераций с возможностью разворачивания
displayIterationsTable(container, iterations, config = {}) {
    if (!iterations || iterations.length === 0) return;
    
    const {
        columns = ['Итерация', 'x', 'f(x)', 'Ошибка'],
        extractRow = (iter, index) => [
            iter.iteration || index + 1,
            iter.x?.toFixed(6) || iter.mid?.toFixed(6) || '-',
            iter.fx?.toFixed(6) || iter.fMid?.toFixed(6) || iter.fCurrent?.toFixed(6) || '-',
            iter.error?.toFixed(6) || '-'
        ],
        title = 'Процесс итераций:',
        showFirst = 10,
        showLast = 5,
        collapseThreshold = 30
    } = config;
    
    const total = iterations.length;
    const shouldCollapse = total > collapseThreshold;
    
    //уникальный id для этой таблицы
    const tableId = 'iter-table-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    
    let tableHTML = `
        <div class="iterations-table-container" id="${tableId}">
            <h4>${title} (всего ${total} итераций)</h4>
            <table class="iterations-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="iterations-body">
    `;
    
    //функция добавления строк
    const addRows = (start, end) => {
        let rows = '';
        for (let i = start; i < end; i++) {
            const row = extractRow(iterations[i], i);
            rows += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
        }
        return rows;
    };
    
    if (shouldCollapse) {
        const hiddenCount = total - showFirst - showLast;
        
        //первые строки
        tableHTML += addRows(0, showFirst);
        
        //строка-кнопка показать
        tableHTML += `
            <tr class="expand-row show-btn" id="${tableId}-show-btn">
                <td colspan="${columns.length}" class="expand-cell">
                    <button class="expand-btn show-btn" data-table="${tableId}">
                        <span class="expand-text">⋯ еще ${hiddenCount} промежуточных итераций ⋯</span>
                    </button>
                  </td>
              </tr>
        `;
        
        //скрытые промежуточные строки
        tableHTML += `
            <tbody class="hidden-iterations" style="display: none;" id="${tableId}-hidden">
                ${addRows(showFirst, total - showLast)}
            </tbody>
        `;
        
        //Последние строки
        tableHTML += addRows(total - showLast, total);
        
        //кнопка скрыть
        tableHTML += `
            <tr class="collapse-row" style="display: none;" id="${tableId}-collapse-btn">
                <td colspan="${columns.length}" class="expand-cell">
                    <button class="expand-btn collapse-btn" data-table="${tableId}">
                        <span class="collapse-text">скрыть промежуточные итерации</span>
                    </button>
                  </td>
              </tr>
        `;
        
    } else {
        //если итераций меньше 30 показываем все
        tableHTML += addRows(0, total);
    }
    
    tableHTML += `
                </tbody>
              </table>
        </div>
    `;
    
    //добавляем таблицу в контейнер
    container.insertAdjacentHTML('beforeend', tableHTML);
    
    //добавляем обработчики на кнопки
    const showBtn = document.querySelector(`#${tableId}-show-btn .expand-btn`);
    const collapseBtn = document.querySelector(`#${tableId}-collapse-btn .expand-btn`);
    const showRow = document.getElementById(`${tableId}-show-btn`);
    const collapseRow = document.getElementById(`${tableId}-collapse-btn`);
    const hiddenRows = document.getElementById(`${tableId}-hidden`);
    
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            //разворачиваем
            showRow.style.display = 'none';
            hiddenRows.style.display = 'table-row-group';
            collapseRow.style.display = 'table-row';
        });
    }
    
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            //сворачиваем
            showRow.style.display = 'table-row';
            hiddenRows.style.display = 'none';
            collapseRow.style.display = 'none';
        });
    }
}



autoDetectParameters(func) {
    const parser = this.app.getMathParser();
    const f = parser.parseFunction(func);
    
    // Начинаем поиск с диапазона от -10 до 10
    let start = -10;
    let end = 10;
    let step = 0.5;
    let interval = null;
    let maxAttempts = 5;  //макс расширений
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        //ищем корень в текущем диапазоне
        for (let x = start; x <= end - step; x += step) {
            const fx = f(x);
            const fxNext = f(x + step);
            
            if (fx * fxNext < 0) {
                interval = [x, x + step];
                break;
            }
        }
        
        //нашли — возвращаем
        if (interval) {
            break;
        }
        
        //не нашли — расширяем диапазон на 20 и увелич шаг
        const expand = 20; 
        start -= expand;
        end += expand;
        step = Math.min(step * 1.5, 5);
    }
    
    //все равно не нашли — интервал от -50 до 50
    if (!interval) {
        interval = [-50, 50];
    }
    
    //параметры для методов
    const newtonX0 = (interval[0] + interval[1]) / 2;
    const secantX1 = interval[0];
    const secantX2 = interval[1];
    
    //подбираем лямбда для метода простой итерации
    let lambda = 0.1;
    const lambdas = [0.01, 0.03, 0.05, 0.08, 0.1, 0.15, 0.2, 0.3, 0.5, 0.8, 1.0];
    
    for (const l of lambdas) {
        try {
            let x = newtonX0;
            let converged = true;
            for (let i = 0; i < 100; i++) {
                const newX = x - l * f(x);
                if (Math.abs(newX - x) < 1e-8) {
                    lambda = l;
                    break;
                }
                if (Math.abs(newX) > 1e10 || !isFinite(newX)) {
                    converged = false;
                    break;
                }
                x = newX;
            }
            if (converged) {
                lambda = l;
                break;
            }
        } catch(e) {}
    }
    
    return { interval, newtonX0, secantX1, secantX2, lambda };
}


// ========== РЕКОМЕНДАЦИИ И СПРАВКИ ==========

updateEquationRecommendation() {
    const funcInput = document.getElementById('equation-function');
    const methodSelect = document.getElementById('equation-method');
    if (!funcInput || !methodSelect) return;
    
    const funcStr = funcInput.value;
    if (!funcStr) return;
    
    try {
        const analysis = this.equationSelector.analyze(funcStr);
        const recommended = analysis.recommendedMethod;
        
        const options = methodSelect.options;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const value = option.value;
            let originalText = '';
            if (value === 'newton') originalText = 'Метод Ньютона';
            else if (value === 'bisection') originalText = 'Метод половинного деления';
            else if (value === 'iteration') originalText = 'Метод простой итерации';
            else if (value === 'secant') originalText = 'Метод секущих';
            else originalText = value;
            
            if (value === recommended) {
                option.text = originalText + ' (рекомендуется)';
            } else {
                option.text = originalText;
            }
        }
    } catch (e) {
        console.warn('ошибка анализа:', e);
    }
}

showEquationMethodHelp(method) {
    const container = document.getElementById('equation-method-help');
    if (!container) return;

    if (!method || method === '') {
        container.style.display = 'none';
        return;
    }
    
    const help = this.equationSelector.getMethodHelp(method);
    if (!help) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = `
        <h4>${help.title}</h4>
        <p>${help.description}</p>
        <p><strong>когда применять:</strong> ${help.when}</p>
        <div class="formula">${help.formula}</div>
    `;
    container.style.display = 'block';
}

updateIntegrationRecommendation() {
    const funcInput = document.getElementById('integration-function');
    const aInput = document.getElementById('integration-a');
    const bInput = document.getElementById('integration-b');
    const methodSelect = document.getElementById('integration-method');
    if (!funcInput || !methodSelect) return;
    
    const funcStr = funcInput.value;
    const a = parseFloat(aInput?.value);
    const b = parseFloat(bInput?.value);
    if (!funcStr || isNaN(a) || isNaN(b)) return;
    
    try {
        const analysis = this.integrationSelector.analyze(funcStr, a, b);
        const recommended = analysis.recommendedMethod;
        
        const options = methodSelect.options;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const value = option.value;
            let originalText = '';
            if (value === 'simpson') originalText = 'Метод Симпсона';
            else if (value === 'trapezoidal') originalText = 'Метод трапеций';
            else if (value === 'rectangles') originalText = 'Метод прямоугольников';
            else if (value === 'monte-carlo') originalText = 'Метод Монте-Карло';
            else originalText = value;
            
            if (value === recommended) {
                option.text = originalText + ' (рекомендуется)';
            } else {
                option.text = originalText;
            }
        }
    } catch (e) {
        console.warn('ошибка анализа:', e);
    }
}

showIntegrationMethodHelp(method) {
    const container = document.getElementById('integration-method-help');
    if (!container) return;

    if (!method || method === '') {
        container.style.display = 'none';
        return;
    }
    
    const help = this.integrationSelector.getMethodHelp(method);
    if (!help) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = `
        <h4>${help.title}</h4>
        <p>${help.description}</p>
        <p><strong>когда применять:</strong> ${help.when}</p>
        <div class="formula">${help.formula}</div>
    `;
    container.style.display = 'block';
}

updateDifferentialRecommendation() {
    const eqInput = document.getElementById('diff-equation');
    const methodSelect = document.getElementById('diff-method');
    if (!eqInput || !methodSelect) return;
    
    const equation = eqInput.value;
    if (!equation) return;
    
    try {
        const analysis = this.differentialSelector.analyze(equation, 0, 0, 1);
        const recommended = analysis.recommendedMethod;
        
        const options = methodSelect.options;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const value = option.value;
            let originalText = '';
            if (value === 'euler') originalText = 'Метод Эйлера';
            else if (value === 'runge-kutta') originalText = 'Метод Рунге-Кутты 4-го порядка';
            else originalText = value;
            
            if (value === recommended) {
                option.text = originalText + ' (рекомендуется)';
            } else {
                option.text = originalText;
            }
        }
    } catch (e) {
        console.warn('ошибка анализа:', e);
    }
}

showDifferentialMethodHelp(method) {
    const container = document.getElementById('differential-method-help');
    if (!container) return;

    if (!method || method === '') {
        container.style.display = 'none';
        return;
    }
    
    const help = this.differentialSelector.getMethodHelp(method);
    if (!help) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = `
        <h4>${help.title}</h4>
        <p>${help.description}</p>
        <p><strong>когда применять:</strong> ${help.when}</p>
        <div class="formula">${help.formula}</div>
    `;
    container.style.display = 'block';
}

updateSystemRecommendation() {
    const eqInputs = document.querySelectorAll('.system-eq');
    const methodSelect = document.getElementById('system-method');
    if (!methodSelect) return;
    
    const equations = Array.from(eqInputs).map(inp => inp.value).filter(e => e.trim());
    if (equations.length === 0) return;
    
    try {
        const { matrix } = this.systemParser.parseEquations(equations);
        const analysis = this.systemSelector.analyze(matrix);
        const recommended = analysis.recommendedMethod;
        
        const options = methodSelect.options;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const value = option.value;
            let originalText = '';
            if (value === 'gauss') originalText = 'Метод Гаусса';
            else if (value === 'jacobi') originalText = 'Метод Якоби';
            else if (value === 'zeidel') originalText = 'Метод Зейделя';
            else originalText = value;
            
            if (value === recommended) {
                option.text = originalText + ' (рекомендуется)';
            } else {
                option.text = originalText;
            }
        }
    } catch (e) {
        console.warn('ошибка анализа:', e);
    }
}

showSystemMethodHelp(method) {
    const container = document.getElementById('system-method-help');
    if (!container) return;

    if (!method || method === '') {
        container.style.display = 'none';
        return;
    }
    
    const help = this.systemSelector.getMethodHelp(method);
    if (!help) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = `
        <h4>${help.title}</h4>
        <p>${help.description}</p>
        <p><strong>когда применять:</strong> ${help.when}</p>
        <div class="formula">${help.formula}</div>
    `;
    container.style.display = 'block';
}




// Общий метод сохранения результата в БД
async saveResultToDatabase(taskType, expression, method, result) {
    if (!this.neuralSolver) return;
    
    const converged = result.converged === true;
    let resultValue = null;
    
    // Извлекаем значение результата в зависимости от типа
    if (taskType === 'equation') {
        resultValue = result.root;
    } else if (taskType === 'integral') {
        resultValue = result.result;
    } else if (taskType === 'ode') {
        resultValue = result.final_y;
    } else if (taskType === 'system') {
        resultValue = result.solution;
    }
    
    await this.neuralSolver.saveResult(
        taskType,
        expression,
        method,
        converged,
        resultValue
    );
}

}

export default EventManager;
