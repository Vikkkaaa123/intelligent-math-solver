class ChatNeural {

   constructor() {
    this.currentSession = null;
    this._waitingForInput = false;
    this.currentQuestion = null;
}


get waitingForInput() {
    return this._waitingForInput;
}

set waitingForInput(value) {
    this._waitingForInput = value;
}
    
    startDialog(userInput) {

        this.resetSession();
        
        const parsed = this.parseUserIntent(userInput);

        
        if (parsed.intent === 'ask_type') {
            this.waitingForInput = true;
            this.currentSession = {
                intent: 'ask_type',
                taskType: null,
                collected: {},
                missing: ['taskType'],
                step: 0,
                originalText: userInput
            };
            return {
                type: 'question',
                message: this.generateQuestion('taskType'),
                waitingFor: 'taskType',
                session: this.currentSession
            };
        }
        
        if (parsed.missingInfo.length > 0) {
            this.waitingForInput = true;
            this.currentSession = {
                intent: parsed.intent,
                taskType: parsed.taskType,
                collected: parsed.collected,
                missing: parsed.missingInfo,
                step: 0,
                originalText: userInput
            };
            return {
                type: 'question',
                message: this.generateQuestion(parsed.missingInfo[0], parsed.taskType),
                waitingFor: parsed.missingInfo[0],
                session: this.currentSession
            };
        }
        
        this.waitingForInput = false;
        return {
            type: 'solve',
            message: 'Решаю задачу...',
            data: parsed
        };
    }
    
    continueDialog(userAnswer) {
    if (!this.waitingForInput || !this.currentSession) {
        return this.startDialog(userAnswer);
    }
    
    const missingField = this.currentSession.missing[0];
    
    let extractedValue;
    if (missingField === 'lowerBound' || missingField === 'upperBound' || 
        missingField === 'x0' || missingField === 'y0' || missingField === 'xEnd') {
        const num = parseFloat(userAnswer);
        extractedValue = isNaN(num) ? null : num;
        if (extractedValue === null) {
            return {
                type: 'question',
                message: `Пожалуйста, введите число. ${this.generateQuestion(missingField, this.currentSession.taskType)}`,
                waitingFor: missingField,
                session: this.currentSession
            };
        }
    } else {
        extractedValue = this.extractValue(userAnswer, missingField);
    }
    
    this.currentSession.collected[missingField] = extractedValue;
    this.currentSession.missing.shift();
    
    if (this.currentSession.missing.length > 0) {
        return {
            type: 'question',
            message: this.generateQuestion(this.currentSession.missing[0], this.currentSession.taskType),
            waitingFor: this.currentSession.missing[0],
            session: this.currentSession
        };
    }
    
    // Все данные собраны - готовим решение
    const completeData = {
        intent: this.currentSession.intent,
        taskType: this.currentSession.taskType,
        collected: this.currentSession.collected,
        missingInfo: []
    };
    
    // Сбрасываем сессию ПОСЛЕ того, как собрали данные
    this.resetSession();
    
    return {
        type: 'solve',
        message: 'Спасибо! Теперь у меня есть все данные. Решаю...',
        data: completeData
    };
}


    
parseUserIntent(text) {
    const lowerText = text.toLowerCase();
    
    let taskType = 'equation';
    
    // Проверка на ДУ - ДОЛЖНА БЫТЬ ПЕРВОЙ и проверять САМОЕ НАЧАЛО
    if (lowerText.includes('диффур') || lowerText.includes('дифференциальн') || 
        lowerText.includes('диф уравнение') || lowerText.includes('диф уранение') ||
        lowerText.includes("y'") || lowerText.includes('dy/dx') || lowerText.includes('ду')) {
        taskType = 'ode';
    }
    // Проверка на интеграл
    else if (lowerText.includes('интеграл') || lowerText.includes('интграл') || 
             lowerText.includes('∫') || lowerText.includes('площадь')) {
        taskType = 'integral';
    }
    // Проверка на систему
    else if (lowerText.includes('систем')) {
        taskType = 'system';
    }
    
    console.log('Определён тип задачи:', taskType, 'из текста:', text);
    
    const collected = {};
    const missingInfo = [];
    
    switch (taskType) {
        case 'equation':
            collected.expression = this.extractEquation(text);
            if (!collected.expression) missingInfo.push('expression');
            break;
        case 'integral':
            collected.integrand = this.extractIntegrand(text);
            collected.lowerBound = this.extractLowerBound(text);
            collected.upperBound = this.extractUpperBound(text);
            if (!collected.integrand) missingInfo.push('integrand');
            if (collected.lowerBound === null) missingInfo.push('lowerBound');
            if (collected.upperBound === null) missingInfo.push('upperBound');
            break;
       case 'ode':
    let odeText = text.replace(/диффур|дифференциальн|диф уравнение|дифур|ду/gi, '');
    console.log('Текст после удаления команд ДУ:', odeText);
    
    collected.odeExpression = this.extractODE(odeText);
    collected.x0 = this.extractX0(text);
    collected.y0 = this.extractY0(text);
    collected.xEnd = this.extractXEnd(text);
    
    console.log('Извлечено ДУ:', collected.odeExpression);
    console.log('x0:', collected.x0, 'y0:', collected.y0, 'xEnd:', collected.xEnd);
    
    if (!collected.odeExpression) missingInfo.push('odeExpression');
    if (collected.x0 === null) missingInfo.push('x0');
    if (collected.y0 === null) missingInfo.push('y0');
    if (collected.xEnd === null) missingInfo.push('xEnd');
    break;
        case 'system':
            collected.equations = this.extractSystem(text);
            if (!collected.equations || collected.equations.length < 2) missingInfo.push('equations');
            break;
    }
    
    return {
        intent: 'solve',
        taskType: taskType,
        collected: collected,
        missingInfo: missingInfo,
        originalText: text
    };
}

    
    generateQuestion(field, taskType) {
        if (field === 'taskType') {
            return `Что вы хотите вычислить?\n\n1️⃣ Уравнение\n2️⃣ Интеграл\n3️⃣ Дифференциальное уравнение\n4️⃣ Систему уравнений\n\nВведите номер или название:`;
        }
        
        const questions = {
            expression: 'Какое уравнение нужно решить? (например: 4x-6=0, x^2-4=0)',
            integrand: 'Какая функция под интегралом? (например: x^2, sin(x), 2*x)',
            lowerBound: 'Какой нижний предел интегрирования? (например: 0, 1, -5)',
            upperBound: 'Какой верхний предел интегрирования? (например: 2, 10, 5)',
            odeExpression: 'Какая правая часть дифференциального уравнения? (например: x + y, x*y, x-y)',
            x0: 'Какое начальное значение x₀?',
            y0: 'Какое начальное значение y(x₀)?',
            xEnd: 'До какого значения x нужно найти решение? (конечная точка)',
            equations: 'Напишите систему уравнений через запятую (например: x+y=5, x-y=1)'
        };
        
        return questions[field] || `Введите ${field}:`;
    }
    
    extractEquation(text) {
        let cleaned = text.replace(/реши|найди|уравнение|решить|вычисли|рши|уровнения?|урвнение/gi, '');
        cleaned = cleaned.replace(/[чх]/gi, 'x');
        cleaned = cleaned.replace(/[у]/gi, 'y');
        cleaned = cleaned.replace(/[а-яё]/gi, '');
        cleaned = cleaned.replace(/x{2,}/g, 'x');
        cleaned = cleaned.replace(/y{2,}/g, 'y');
        cleaned = cleaned.replace(/\s+/g, '');
        
        if (!cleaned || cleaned === '') return null;
        if (!cleaned.includes('=')) cleaned = cleaned + '=0';
        return cleaned;
    }
    
    extractIntegrand(text) {
        const patterns = [
            /интеграл\s+([^от]+?)(?:\s+от|$)/i,
            /∫\s*([^dx]+?)(?:\s*dx|$)/i,
            /функцию\s+([^от]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                let expr = match[1].trim();
                expr = expr.replace(/[чх]/gi, 'x').replace(/[у]/gi, 'y');
                expr = expr.replace(/[а-яё]/gi, '');
                expr = expr.replace(/x{2,}/g, 'x');
                return expr;
            }
        }
        
        const expr = this.extractEquation(text);
        if (expr && expr !== '=0') return expr.replace('=0', '');
        return null;
    }
    
    extractLowerBound(text) {
        const otDoMatch = text.match(/от\s*(\d+)\s*до\s*(\d+)/i);
        if (otDoMatch) return parseFloat(otDoMatch[1]);
        
        const patterns = [/от\s*(\d+)/i, /нижний\s*предел\s*(\d+)/i, /a\s*=\s*(\d+)/i];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return parseFloat(match[1]);
        }
        return null;
    }
    
    extractUpperBound(text) {
        const otDoMatch = text.match(/от\s*(\d+)\s*до\s*(\d+)/i);
        if (otDoMatch) return parseFloat(otDoMatch[2]);
        
        const patterns = [/до\s*(\d+)/i, /верхний\s*предел\s*(\d+)/i, /b\s*=\s*(\d+)/i];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return parseFloat(match[1]);
        }
        return null;
    }
    
extractODE(text) {
    // Убираем команды
    let cleaned = text.replace(/реши|дифференциальн|диффур|дифур|ду|уравнение/gi, '');
    
    // Заменяем русские буквы
    cleaned = cleaned.replace(/[чх]/gi, 'x');
    cleaned = cleaned.replace(/[у]/gi, 'y');
    cleaned = cleaned.replace(/[а-яё]/gi, '');
    
    // Убираем пробелы
    cleaned = cleaned.replace(/\s+/g, '');
    
    // Убираем дублирование
    cleaned = cleaned.replace(/x{2,}/g, 'x');
    cleaned = cleaned.replace(/y{2,}/g, 'y');
    
    console.log('extractODE результат:', cleaned);
    
    // Если после очистки пусто - возвращаем null
    if (!cleaned || cleaned === '') return null;
    
    // Если осталось что-то типа "x-y" или "x+y" - это нормально
    // Не добавляем лишних проверок
    return cleaned;
}

    
    extractX0(text) {
    const match1 = text.match(/x0\s*=\s*(\d+)/i);
    if (match1) return parseFloat(match1[1]);
    
    const match2 = text.match(/y\((\d+)\)/i);
    if (match2) return parseFloat(match2[1]);
    
    const match3 = text.match(/,\s*x0\s*=\s*(\d+)/i);
    if (match3) return parseFloat(match3[1]);
    
    return null;
}

    
    extractY0(text) {
    const match1 = text.match(/y0\s*=\s*(\d+)/i);
    if (match1) return parseFloat(match1[1]);
    
    const match2 = text.match(/y\((\d+)\)\s*=\s*(\d+)/i);
    if (match2) return parseFloat(match2[2]);
    
    const match3 = text.match(/,\s*y0\s*=\s*(\d+)/i);
    if (match3) return parseFloat(match3[1]);
    
    return null;
}

    
    extractXEnd(text) {
    const match1 = text.match(/x_end\s*=\s*(\d+)/i);
    if (match1) return parseFloat(match1[1]);
    
    const match2 = text.match(/xend\s*=\s*(\d+)/i);
    if (match2) return parseFloat(match2[1]);
    
    const match3 = text.match(/,\s*x_end\s*=\s*(\d+)/i);
    if (match3) return parseFloat(match3[1]);
    
    const match4 = text.match(/до\s*x\s*=\s*(\d+)/i);
    if (match4) return parseFloat(match4[1]);
    
    return null;
}
    
    extractSystem(text) {
        const equationPattern = /([+-]?\d*[xy]?\s*[+-]\s*\d*[xy]?\s*=\s*[+-]?\d+)/gi;
        const matches = text.match(equationPattern);
        if (matches && matches.length >= 2) {
            return matches.map(eq => eq.replace(/[чх]/gi, 'x').replace(/[у]/gi, 'y'));
        }
        return null;
    }
    
    extractValue(answer, field) {
        const lowerAnswer = answer.toLowerCase();
        
        if (field === 'x0') {
            const match = lowerAnswer.match(/x0\s*=\s*(\d+)/i);
            if (match) return parseFloat(match[1]);
        }
        if (field === 'y0') {
            const match = lowerAnswer.match(/y0\s*=\s*(\d+)/i);
            if (match) return parseFloat(match[1]);
        }
        if (field === 'xEnd') {
            const match = lowerAnswer.match(/x[_]?end\s*=\s*(\d+)/i);
            if (match) return parseFloat(match[1]);
        }
        
        switch (field) {
            case 'expression': case 'integrand': case 'odeExpression':
                return this.extractEquation(answer);
            case 'lowerBound': case 'upperBound': case 'x0': case 'y0': case 'xEnd':
                const num = parseFloat(answer);
                return isNaN(num) ? null : num;
            case 'equations':
                return this.extractSystem(answer);
            default:
                return answer;
        }
    }


resetSession() {
    this.currentSession = null;
    this._waitingForInput = false;
    this.currentQuestion = null;
    console.log('Сессия сброшена');
}


}

export default ChatNeural;