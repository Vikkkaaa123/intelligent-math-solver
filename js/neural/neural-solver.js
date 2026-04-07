import TextCorrector from './text-corrector.js';
import TrainedNeuralModel from './trained-model.js';

class NeuralSolver {
    constructor() {
        this.textCorrector = new TextCorrector();
        this.neuralModel = new TrainedNeuralModel();
        this.isReady = false;
    }
    
    async initialize() {
        // Пытаемся загрузить обученную модель
        const loaded = await this.neuralModel.loadModel();
        
        if (!loaded) {
            console.log('Модель не найдена, обучаем...');
            await this.neuralModel.train(100, 30); // 100 эпох, 30 примеров на класс
            await this.neuralModel.saveModel();
        }
        
        this.isReady = true;
        console.log('Нейросетевая подсистема готова');
    }
    
    parseQuery(text) {
        const corrected = this.textCorrector.correctMathExpression(text);
        const prediction = this.neuralModel.predictTaskType(corrected);
        const methodRecommendation = this.neuralModel.recommendMethod(prediction.taskType, corrected);
        const expression = this.extractMath(corrected, prediction.taskType);
        const params = this.extractParams(corrected, prediction.taskType);
        
        return {
            taskType: prediction.taskType,
            confidence: prediction.confidence,
            allProbabilities: prediction.allProbabilities,
            expression: expression,
            recommendedMethod: methodRecommendation.method,
            methodConfidence: methodRecommendation.confidence,
            methodReason: methodRecommendation.reason,
            params: params,
            originalText: text,
            correctedText: corrected
        };
    }
    
    extractMath(text, taskType) {
    //убираем команды
    const commands = ['реши', 'найди', 'вычисли', 'уравнение', 'интеграл', 
                     'дифференциальное', 'система', 'решить', 'найти', 
                     'уравнения', 'корни', 'найдите'];
    
    let math = text.toLowerCase();
    
    for (const cmd of commands) {
        math = math.replace(new RegExp(cmd, 'gi'), '');
    }
    
    //для уравнений: убираем "=0" если есть, оставляем только левую часть
    if (taskType === 'equation') {
        // Если есть "=0", берем левую часть
        if (math.includes('=0')) {
            math = math.split('=0')[0];
        }
        //если есть просто =, переносим всё влево
        else if (math.includes('=')) {
            const parts = math.split('=');
            if (parts.length === 2) {
                math = `${parts[0]}-(${parts[1]})`;
            }
        }
    }
    
    //для интегралов
    if (taskType === 'integral') {
        math = math.replace(/от\s*\d+\s*до\s*\d+/g, '');
        math = math.replace(/dx/g, '');
        math = math.replace(/∫/g, '');
    }
    
    //для ДУ
    if (taskType === 'ode') {
        math = math.replace(/y\(\d+\)\s*=\s*\d+/g, '');
        math = math.replace(/y'=/g, '');
        math = math.replace(/dy\/dx=/g, '');
    }
    
    //очистка от лишних символов
    math = math
        .replace(/[^a-z0-9x\s\+\-\*\/\^\(\)]/gi, '') //оставляем только математические символы
        .replace(/\s+/g, '') //убираем пробелы
        .trim();
    
    //если после очистки пусто возвращаем пример по умолчанию
    if (!math || math === '') {
        if (taskType === 'equation') return 'x-3';
        if (taskType === 'integral') return 'x^2';
        if (taskType === 'ode') return 'x+y';
        return 'x-0';
    }
    
    //заменяем русские буквы на латинские
    math = math.replace(/[ху]/gi, (match) => {
        if (match === 'х' || match === 'Х') return 'x';
        if (match === 'у' || match === 'У') return 'y';
        return match;
    });
    
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
        // Сохранение в БД (опционально)
        console.log(`Сохранение результата: ${taskType}, ${method}, converged=${converged}`);
    }
    
    generateResponse(parsed, result) {
        let response = `✅ **Нейросеть решила задачу!**\n\n`;
        response += `📋 **Распознано:** ${parsed.originalText}\n`;
        response += `🧠 **Тип задачи:** ${this.getTaskTypeName(parsed.taskType)} (уверенность: ${(parsed.confidence * 100).toFixed(1)}%)\n`;
        
        if (parsed.allProbabilities && Object.keys(parsed.allProbabilities).length > 0) {
            response += `📊 **Вероятности:** уравнение=${(parsed.allProbabilities.equation*100).toFixed(1)}%, интеграл=${(parsed.allProbabilities.integral*100).toFixed(1)}%, ДУ=${(parsed.allProbabilities.ode*100).toFixed(1)}%, система=${(parsed.allProbabilities.system*100).toFixed(1)}%\n`;
        }
        
        response += `🎯 **Рекомендованный метод:** ${parsed.recommendedMethod} (уверенность: ${(parsed.methodConfidence * 100).toFixed(1)}%)\n`;
        response += `💡 **Почему:** ${parsed.methodReason}\n\n`;
        
        if (result.converged) {
            response += `📐 **Результат:** `;
            if (parsed.taskType === 'equation') response += `x ≈ ${result.root?.toFixed(6)}`;
            else if (parsed.taskType === 'integral') response += `${result.result?.toFixed(8)}`;
            else if (parsed.taskType === 'ode') response += `y(${result.final_x?.toFixed(4)}) = ${result.final_y?.toFixed(6)}`;
            else if (parsed.taskType === 'system') response += `[${result.solution?.map(x => x.toFixed(6)).join(', ')}]`;
            response += `\n`;
        } else {
            response += `⚠️ **Не удалось получить решение:** ${result.message || 'попробуйте другую формулировку'}\n`;
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
}

export default NeuralSolver;