class MathParser {
    constructor() {
        this.parser = null;
        this.ready = false;
        
        this.supportedFunctions = [
            'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
            'asin', 'acos', 'atan', 'acot',
            'sinh', 'cosh', 'tanh', 'coth',
            'log', 'log10', 'ln', 'exp', 'sqrt',
            'abs', 'ceil', 'floor', 'round', 'sign'
        ];
        
        this.supportedConstants = {
            'pi': Math.PI,
            'e': Math.E,
            'inf': Infinity
        };
    }

    initialize() {
        if (this.ready) return;

        if (typeof math === 'undefined') {
            throw new Error('Библиотека math.js не загружена');
        }
        
        this.parser = math;
        this.addCustomFunctions();
        this.ready = true;
    }

    addCustomFunctions() {
        this.parser.import({
            cot: x => 1 / Math.tan(x),
            sec: x => 1 / Math.cos(x),
            csc: x => 1 / Math.sin(x),
            acot: x => Math.PI / 2 - Math.atan(x),
            coth: x => 1 / Math.tanh(x),
            log: (x, base = 10) => Math.log(x) / Math.log(base),
            ln: x => Math.log(x)
        }, { override: true });
    }

cleanExpression(expression) {    
    let clean = expression
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[а-я]/g, 'x')

        //заменяем функции
        .replace(/tg/g, 'tan')
        .replace(/ctg/g, 'cot')
        .replace(/arctg/g, 'atan')
        .replace(/arcctg/g, 'acot')
        .replace(/arcsin/g, 'asin')
        .replace(/arccos/g, 'acos');
    
    
    //защищаем все функции ДО обработки степеней

    const functions = [
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'asin', 'acos', 'atan', 'acot',
        'sinh', 'cosh', 'tanh', 'coth',
        'log', 'log10', 'ln', 'exp', 'sqrt', 'abs'
    ];
    
    // временная замена функций на маркеры с защитой
    functions.forEach((func, i) => {
        clean = clean.replace(new RegExp(func, 'g'), `__${i}__`);
    });
    
    // теперь обрабатываем степени    
    // функции со скобками
    for (let i = 0; i < functions.length; i++) {
        const marker = `__${i}__`;
        const regex = new RegExp(`(${marker}\\([^)]+\\))\\^(\\d+)`, 'g');
        clean = clean.replace(regex, 'POW_FUNC($1,$2)');
    }
    
    // скобки
    clean = clean.replace(/\(([^)]+)\)\^(\d+)/g, 'POW_FUNC(($1),$2)');
    
    // простые переменные
    clean = clean.replace(/([a-z])\^(\d+)/g, 'POW_FUNC($1,$2)');
    
    // теперь заменяем POW_FUNC на pow, но защищаем его
    clean = clean.replace(/POW_FUNC/g, '__POW__');
    
    // заменяем все оставшиеся буквы на x
    // Сначала защищаем все маркеры
    // Временная двойная защита маркеров
    clean = clean.replace(/__(\d+)__/g, '[[$1]]');
    clean = clean.replace(/__POW__/g, '[[POW]]');
    
    // заменяем буквы
    clean = clean.replace(/[a-z]/g, 'x');
    
    // Возвращаем маркеры из двойной защиты
    clean = clean.replace(/\[\[(\d+)\]\]/g, '__$1__');
    clean = clean.replace(/\[\[POW\]\]/g, '__POW__');
    
    // умножение
    clean = clean
        .replace(/(\d)(x)/g, '$1*$2')
        .replace(/(x)(\d)/g, '$1*$2')
        .replace(/(\d)(\()/g, '$1*$2')
        .replace(/(\))(x)/g, '$1*$2')
        .replace(/(\))(\()/g, '$1*$2')
        .replace(/(x)(\()/g, '$1*$2');
    
    // добавляем умножение для чисел перед функциями
    clean = clean.replace(/(\d)(__\d+__)/g, '$1*$2');
    
    // восстанавливаем функции из маркеров
    functions.forEach((func, i) => {
        clean = clean.replace(new RegExp(`__${i}__`, 'g'), func);
    });
    
    // восстанавливаем pow
    clean = clean.replace(/__POW__/g, 'pow');

    this.checkBrackets(clean);
    
            console.log(`После очистки: "${clean}"`);
    return clean;
}

    // В MathParser изменяем parseFunction:
parseFunction(expression) {
    if (!this.ready) {
        throw new Error('Парсер не готов');
    }

    if (!expression || typeof expression !== 'string') {
        throw new Error('Введите функцию');
    }

    try {
        // ШАГ 1: Обрабатываем "=" если есть
        let finalExpression = expression;
        if (expression.includes('=')) {
            finalExpression = this.moveAllToLeft(expression);
        }
        
        // ШАГ 2: Очищаем выражение (существующий код)
        const cleanExpression = this.cleanExpression(finalExpression);
        
        // ШАГ 3: Компилируем
        const compiled = this.parser.compile(cleanExpression);
        
        // ШАГ 4: Создаем функцию
        const parsedFunction = (x, variables = {}) => {
            const scope = { x, ...variables, ...this.supportedConstants };
            return compiled.evaluate(scope);
        };

        
        return parsedFunction;
        
    } catch (error) {
        console.error('Ошибка парсера:', error);
        throw new Error(this.getSimpleError(error, expression));
    }
}

// Новый метод для переноса через "="
moveAllToLeft(expression) {
    // Разделяем по "="
    const parts = expression.split('=');
    if (parts.length !== 2) {
        throw new Error('Неверный формат уравнения. Используйте один знак "="');
    }
    
    const left = parts[0].trim();
    const right = parts[1].trim();
    
    // Если справа "0", оставляем как есть
    if (right === '0') {
        return left;
    }
    
    // Если справа не "0", переносим все влево
    return `(${left}) - (${right})`;
}

    checkBrackets(expression) {
        let count = 0;
        
        for (let char of expression) {
            if (char === '(') count++;
            if (char === ')') count--;
            if (count < 0) throw new Error('Ошибка в скобках');
        }
        
        if (count !== 0) throw new Error('Ошибка в скобках');
    }

    getSimpleError(error, expression) {
        const message = error.message.toLowerCase();
        
        if (message.includes('undefined function')) {
            const name = message.match(/undefined function (\w+)/)?.[1];
            return `Неизвестная функция "${name}"`;
        }
        
        if (message.includes('undefined symbol')) {
            const symbol = message.match(/undefined symbol (\w+)/)?.[1];
            return `Неизвестный символ "${symbol}"`;
        }
        
        return 'Ошибка в выражении';
    }
}

export default MathParser;