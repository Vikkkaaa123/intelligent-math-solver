import MathParser from './math-parser.js';

class MathParserDE extends MathParser {
    constructor() {
        super();
    }

    cleanExpressionForDE(expression) {
        console.log('Исходное выражение ДУ:', expression);
        
        let clean = expression.trim();
        
        // ШАГ 1: Обрабатываем "="
        if (clean.includes('=')) {
            const parts = clean.split('=');
            if (parts.length === 2) {
                clean = parts[1].trim(); // Берем только правую часть
                console.log('Правая часть после =:', clean);
            }
        }
        
        // ШАГ 2: Очистка и нормализация
        clean = clean
            .toLowerCase()
            .replace(/\s+/g, '')  // Убираем все пробелы
            // Убираем возможные обозначения производной в начале
            .replace(/^y['`]/g, '')      // Убирает y' в начале
            .replace(/^dy\/dx/g, '')     // Убирает dy/dx в начале
            .replace(/^y\(1\)/g, '')     // Убирает y(1) в начале
            .replace(/^y\s*=/g, '');     // Убирает y = в начале
        
        console.log('После удаления производной:', clean);
        
        // ШАГ 3: Замены функций
        clean = clean
            .replace(/tg/g, 'tan')
            .replace(/ctg/g, 'cot')
            .replace(/arctg/g, 'atan')
            .replace(/arcctg/g, 'acot')
            .replace(/arcsin/g, 'asin')
            .replace(/arccos/g, 'acos');
        
        // ШАГ 4: Русские буквы
        clean = clean.replace(/[а-я]/g, match => {
            if (match === 'у') return 'y';
            if (match === 'х') return 'x';
            return 'x'; // Остальные буквы → x
        });
        
        console.log('После замены русских букв:', clean);
        
        // ШАГ 5: Защищаем функции ДО обработки степеней
        const functions = [
            'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
            'asin', 'acos', 'atan', 'acot',
            'sinh', 'cosh', 'tanh', 'coth',
            'log', 'log10', 'ln', 'exp', 'sqrt', 'abs'
        ];
        
        // Временная замена функций на маркеры
        functions.forEach((func, i) => {
            clean = clean.replace(new RegExp(func, 'g'), `__${i}__`);
        });
        
        // ШАГ 6: Обработка степеней
        // Заменяем x², y² и т.д.
        clean = clean.replace(/([xy])²/g, 'pow($1,2)');
        clean = clean.replace(/([xy])³/g, 'pow($1,3)');
        clean = clean.replace(/([xy])\^(\d+)/g, 'pow($1,$2)');
        
        // Функции со степенями
        for (let i = 0; i < functions.length; i++) {
            const marker = `__${i}__`;
            const regex = new RegExp(`(${marker}\\([^)]+\\))\\^(\\d+)`, 'g');
            clean = clean.replace(regex, 'POW_FUNC($1,$2)');
        }
        
        // Скобки со степенями
        clean = clean.replace(/\(([^)]+)\)\^(\d+)/g, 'POW_FUNC(($1),$2)');
        
        // Заменяем POW_FUNC на защищенный маркер
        clean = clean.replace(/POW_FUNC/g, '__POW__');
        
        // ШАГ 7: Умножение
        clean = clean
            .replace(/(\d)([xy])/g, '$1*$2')
            .replace(/([xy])(\d)/g, '$1*$2')
            .replace(/([xy])([xy])/g, '$1*$2')
            .replace(/(\d)(\()/g, '$1*$2')
            .replace(/(\))([xy])/g, '$1*$2')
            .replace(/([xy])(\()/g, '$1*$2');
        
        // Восстанавливаем функции
        functions.forEach((func, i) => {
            clean = clean.replace(new RegExp(`__${i}__`, 'g'), func);
        });
        
        // Восстанавливаем pow
        clean = clean.replace(/__POW__/g, 'pow');
        
        console.log('Финальное выражение ДУ:', clean);
        
        return clean;
    }

    parseFunctionDE(expression) {
        if (!this.ready) {
            throw new Error('Парсер не готов');
        }

        try {
            const cleanExpression = this.cleanExpressionForDE(expression);
            console.log('Выражение для math.js:', cleanExpression);
            
            // Используем this.parser (из родительского класса)
            const compiled = this.parser.compile(cleanExpression);
            
            const parsedFunction = (x, y) => {
                const scope = { 
                    x: x, 
                    y: y,
                    ...this.supportedConstants
                };
                return compiled.evaluate(scope);
            };
            
            return parsedFunction;
            
        } catch (error) {
            console.error('Ошибка парсера DE:', error);
            throw new Error(this.getSimpleError(error, expression));
        }
    }
}

export default MathParserDE;