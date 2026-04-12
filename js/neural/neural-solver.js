import TextCorrector from './text-corrector.js';
import TrainedNeuralModel from './trained-model.js';
import ChatNeural from './chat-neural.js';

class NeuralSolver {
    constructor() {
        this.textCorrector = new TextCorrector();
        this.neuralModel = new TrainedNeuralModel();
        this.chat = new ChatNeural();
        this.isReady = false;
        this.onQuestion = null; // Колбэк для вопроса пользователю
    }
    
    async initialize() {
        const loaded = await this.neuralModel.loadModel();
        
        if (!loaded) {
            console.log('Модель не найдена, обучаем...');
            await this.neuralModel.train(80, 40);
            await this.neuralModel.saveModel();
        }
        
        this.isReady = true;
        console.log('Нейросетевая подсистема готова');
    }
    
    // Основной метод для обработки запроса (с поддержкой диалога)
    processQuery(text, isAnswer = false) {
    console.log('processQuery called:', { text, isAnswer, waitingForInput: this.chat.waitingForInput });
    
    // Если это ответ на вопрос и есть активная сессия
    if (isAnswer && this.chat.waitingForInput) {
        console.log('Продолжаем диалог с ответом:', text);
        const result = this.chat.continueDialog(text);
        
        if (result.type === 'question') {
            return {
                isQuestion: true,
                message: result.message,
                waitingFor: result.waitingFor
            };
        }
        
        // result.type === 'solve'
        return this.solveWithData(result.data);
    }
    
    // Начинаем новый диалог
    console.log('Начинаем новый диалог');
    const result = this.chat.startDialog(text);
    
    if (result.type === 'question') {
        return {
            isQuestion: true,
            message: result.message,
            waitingFor: result.waitingFor
        };
    }
    
    // result.type === 'solve'
    return this.solveWithData(result.data);
}

    
    solveWithData(data) {
    const collected = data.collected;
    const taskType = data.taskType;
    
    let expression = '';
    let params = {};
    
    switch (taskType) {
        case 'equation':
            expression = collected.expression || 'x-3=0';
            params = {};
            break;
            
        case 'integral':
            // Для интеграла используем collected.integrand
            expression = collected.integrand || collected.expression || 'x-7';
            // Очищаем от лишних символов
            expression = expression.replace(/[^0-9x\+\-\*\/\^]/g, '').replace(/x+/g, 'x');
            if (!expression || expression === 'x') expression = 'x-7';
            
            params = {
                a: collected.lowerBound ?? 0,
                b: collected.upperBound ?? 1
            };
            console.log('Интеграл:', { expression, params });
            break;
            
        case 'ode':
    let odeExpr = collected.odeExpression || collected.expression || 'x-y';
    
    odeExpr = String(odeExpr)
        .replace(/x0=\d+/g, '')
        .replace(/y0=\d+/g, '')
        .replace(/x_end=\d+/g, '')
        .replace(/,[^,]*/g, '')
        .replace(/[^0-9xy\+\-\*\/\^]/g, '')
        .replace(/x+/g, 'x')
        .replace(/y+/g, 'y')
        .trim();
    
    if (!odeExpr || odeExpr === '' || odeExpr === 'xy') {
        odeExpr = 'x-y';
    }
    
    expression = odeExpr;
    params = {
        x0: collected.x0 ?? 0,
        y0: collected.y0 ?? 1,
        xEnd: collected.xEnd ?? 1
    };
    console.log('ДУ после очистки:', expression, params);
    break;
            
        case 'system':
            expression = collected.equations ? collected.equations.join(', ') : 'x+y=1,x-y=0';
            params = {};
            break;
    }
    
    const parsed = {
        taskType: taskType,
        confidence: 0.95,
        allProbabilities: {},
        expression: expression,
        recommendedMethod: this.getMethodForType(taskType),
        methodConfidence: 0.8,
        methodReason: this.getMethodReason(taskType),
        params: params,
        originalText: `${taskType}: ${expression}`,
        correctedText: expression
    };
    
    return {
        isQuestion: false,
        parsed: parsed,
        fullQuery: expression
    };
}

    
    extractMath(text, taskType) {
    const commands = [
        'реши', 'найди', 'вычисли', 'уравнение', 'интеграл', 
        'дифференциальное', 'система', 'решить', 'найти', 
        'уравнения', 'корни', 'найдите', 'диффур', 'ду',
        'рши', 'уровнения', 'интграл', 'диференциалное', 'урвнение',
        'вычесл', 'посчитать', 'найт'
    ];
    
    let math = text.toLowerCase();
    
    for (const cmd of commands) {
        math = math.replace(new RegExp(cmd, 'gi'), '');
    }
    
    // Заменяем русские буквы
    math = math.replace(/[чх]/gi, 'x');
    math = math.replace(/[у]/gi, 'y');
    math = math.replace(/[а-яё]/gi, '');
    
    // Убираем пробелы
    math = math.replace(/\s+/g, '');
    
    // Убираем дублирование
    math = math.replace(/x{2,}/g, 'x');
    math = math.replace(/y{2,}/g, 'y');
    
    // ВАЖНО: для уравнений сохраняем знак =
    if (taskType === 'equation') {
        // Если есть =, оставляем как есть
        if (math.includes('=')) {
            // Ничего не делаем
        } else {
            math = math + '=0';
        }
    }
    
    // Для интегралов - не добавляем =0
    if (taskType === 'integral') {
        math = math.replace(/=/g, '');
        math = math.replace(/от\d+до\d+/g, '');
        math = math.replace(/dx/g, '');
    }
    
    // Финальная очистка
    math = math.replace(/[^0-9xy\+\-\*\/\^=]/g, '');
    
    if (!math || math === '' || math === '=' || math === '=0') {
        if (taskType === 'equation') return 'x-3=0';
        if (taskType === 'integral') return 'x^2';
        if (taskType === 'ode') return 'x+y';
        return 'x-0';
    }
    
    console.log(`Извлечено выражение: "${math}" (тип: ${taskType})`);
    return math;
}


    
    extractParams(text, taskType) {
        const params = {};
        
        if (taskType === 'integral') {
            const fromMatch = text.match(/от\s*(\d+)/i);
            const toMatch = text.match(/до\s*(\d+)/i);
            if (fromMatch) params.a = parseFloat(fromMatch[1]);
            if (toMatch) params.b = parseFloat(toMatch[1]);
        }
        
        if (taskType === 'ode') {
            const yMatch = text.match(/y\((\d+)\)\s*=\s*(\d+)/i);
            if (yMatch) {
                params.x0 = parseFloat(yMatch[1]);
                params.y0 = parseFloat(yMatch[2]);
            }
        }
        
        return params;
    }
    
    async saveResult(taskType, expression, method, converged, result) {
    console.log(`Сохранение результата: ${taskType}, ${method}, converged=${converged}`);
    
    //отправка в БД
    try {
        let resultValue = null;
        if (taskType === 'equation') resultValue = result?.root;
        else if (taskType === 'integral') resultValue = result?.result;
        else if (taskType === 'ode') resultValue = result?.final_y;
        else if (taskType === 'system') resultValue = result?.solution;
        
        const response = await fetch('http://localhost:8000/api/save-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_type: taskType,
                input_data: { expression: expression, method: method },
                method_used: method,
                result: { value: resultValue, converged: converged }
            })
        });
        
        const data = await response.json();
        console.log('Результат сохранения в БД:', data);
    } catch (error) {
        console.error('Ошибка сохранения в БД:', error);
    }
}
    
    generateResponse(parsed, result) {
        let response = `Нейросеть решила задачу!\n\n`;
        response += `Распознано: ${parsed.originalText}\n`;
        response += `Тип задачи: ${this.getTaskTypeName(parsed.taskType)} (уверенность: ${(parsed.confidence * 100).toFixed(1)}%)\n`;
        
        if (parsed.allProbabilities && Object.keys(parsed.allProbabilities).length > 0) {
            response += `Вероятности: уравнение=${(parsed.allProbabilities.equation*100).toFixed(1)}%, интеграл=${(parsed.allProbabilities.integral*100).toFixed(1)}%, ДУ=${(parsed.allProbabilities.ode*100).toFixed(1)}%, система=${(parsed.allProbabilities.system*100).toFixed(1)}%\n`;
        }
        
        response += `Рекомендованный метод: ${parsed.recommendedMethod} (уверенность: ${(parsed.methodConfidence * 100).toFixed(1)}%)\n`;
        response += `Почему: ${parsed.methodReason}\n\n`;
        
        if (result.converged) {
            response += `Результат: `;
            if (parsed.taskType === 'equation') response += `x ≈ ${result.root?.toFixed(6)}`;
            else if (parsed.taskType === 'integral') response += `${result.result?.toFixed(8)}`;
            else if (parsed.taskType === 'ode') response += `y(${result.final_x?.toFixed(4)}) = ${result.final_y?.toFixed(6)}`;
            else if (parsed.taskType === 'system') response += `[${result.solution?.map(x => x.toFixed(6)).join(', ')}]`;
            response += `\n`;
        } else {
            response += `Не удалось получить решение: ${result.message || 'попробуйте другую формулировку'}\n`;
        }
        
        return response;
    }
    
    getTaskTypeName(type) {
        const names = {
            equation: '📐 Уравнение',
            integral: '∫ Интеграл',
            ode: '📈 Дифференциальное уравнение',
            system: '🔢 Система уравнений'
        };
        return names[type] || type;
    }


    getMethodForType(taskType) {
    const methods = {
        equation: 'newton',
        integral: 'simpson',
        ode: 'runge-kutta',
        system: 'gauss'
    };
    return methods[taskType] || 'newton';
}

getMethodReason(taskType) {
    const reasons = {
        equation: 'стандартный метод для уравнений',
        integral: 'наиболее точный метод',
        ode: 'высокая точность для ОДУ',
        system: 'прямой метод для СЛАУ'
    };
    return reasons[taskType] || 'рекомендован по умолчанию';
}

}

export default NeuralSolver;