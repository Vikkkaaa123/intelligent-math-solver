import MathParser from './math-parser.js';

class SystemParser extends MathParser {
    constructor() {
        super();
        this.method = 'SystemParser';
    }

    parseEquations(equations) {
        console.log('=== ПАРСИМ СИСТЕМУ ===');
        console.log('Уравнения:', equations);
        
        // 1. Очистка
        const cleanedEquations = equations.map(eq => eq.trim()).filter(eq => eq);
        const n = cleanedEquations.length;
        
        // 2. Находим ВСЕ переменные (сохраняем оригинальные имена)
        const variables = this.extractVariables(cleanedEquations, n);
        console.log('Переменные системы:', variables);
        
        // 3. Создаем матрицу и вектор
        const matrix = Array(n).fill().map(() => Array(variables.length).fill(0));
        const vector = Array(n).fill(0);
        
        // 4. Парсим каждое уравнение
        for (let i = 0; i < n; i++) {
            console.log(`\n--- Уравнение ${i+1}: "${cleanedEquations[i]}" ---`);
            const result = this.parseEquation(cleanedEquations[i], variables, i);
            matrix[i] = result.coeffs;
            vector[i] = result.constant;
            console.log(`Результат: coeffs=${result.coeffs}, const=${result.constant}`);
        }
        
        console.log('\n=== РЕЗУЛЬТАТ ПАРСИНГА ===');
        console.log('Матрица:', matrix);
        console.log('Вектор:', vector);
        console.log('Переменные:', variables);
        
        return { matrix, vector, variables };
    }
    
    extractVariables(equations, n) {
        const vars = new Set();
        
        equations.forEach(eq => {
            // Убираем всё кроме переменных
            const cleaned = eq.replace(/[^a-zа-я0-9]/gi, ' ');
            
            // Ищем последовательности букв+цифр
            const matches = cleaned.match(/[a-zа-я][a-zа-я0-9]*/gi) || [];
            
            matches.forEach(match => {
                // Проверяем, что это не число
                if (isNaN(parseFloat(match))) {
                    // Проверяем, что это не функция или константа
                    const lower = match.toLowerCase();
                    if (!this.isMathFunction(lower) && !this.isConstant(lower)) {
                        vars.add(match); // Сохраняем оригинальное имя!
                    }
                }
            });
        });
        
        // Если не нашли переменные или их слишком много
        if (vars.size === 0) {
            // Стандартные имена
            if (n <= 3) {
                return ['x', 'y', 'z'].slice(0, n);
            } else {
                return Array.from({length: n}, (_, i) => `x${i+1}`);
            }
        }
        
        // Сортируем для единообразия
        const sorted = Array.from(vars).sort();
        
        // Проверяем количество
        if (sorted.length > n) {
            console.warn(`Переменных (${sorted.length}) больше чем уравнений (${n})`);
        }
        
        return sorted;
    }
    
    parseEquation(eq, variables, eqIndex) {
    console.log(`Парсим: "${eq}"`);
    
    // 1. Подготовка
    let expr = eq.replace(/\s+/g, '');
    
    // 2. Обработка "="
    if (expr.includes('=')) {
        const parts = expr.split('=');
        if (parts.length !== 2) {
            throw new Error(`Некорректное уравнение: ${eq}`);
        }
        
        let left = parts[0] || '';
        let right = parts[1] || '';
        
        if (right !== '0') {
            // ПРАВИЛЬНО меняем знаки у правой части
            // Проходим по правой части и меняем все знаки
            let rightWithChangedSigns = '';
            let i = 0;
            
            while (i < right.length) {
                if (right[i] === '+') {
                    rightWithChangedSigns += '-';
                    i++;
                } else if (right[i] === '-') {
                    rightWithChangedSigns += '+';
                    i++;
                } else if (i === 0) {
                    // Если первый символ не знак, добавляем минус
                    rightWithChangedSigns += '-';
                    // Ищем начало слагаемого
                    let j = i;
                    while (j < right.length && !'+-'.includes(right[j])) {
                        j++;
                    }
                    rightWithChangedSigns += right.substring(i, j);
                    i = j;
                } else {
                    // Копируем слагаемое без изменения
                    let j = i;
                    while (j < right.length && !'+-'.includes(right[j])) {
                        j++;
                    }
                    rightWithChangedSigns += right.substring(i, j);
                    i = j;
                }
            }
            
            expr = left + rightWithChangedSigns;
        } else {
            expr = left;
        }
    }
    
    console.log(`Выражение для парсинга: "${expr}"`);
    
    // 3. Добавляем умножение
    expr = expr.replace(/(\d)([a-zа-я])/gi, '$1*$2');
    expr = expr.replace(/([a-zа-я])(\d)/gi, '$1*$2');
    
    // 4. Разбиваем на простые слагаемые (без скобок!)
    const terms = this.splitSimpleTerms(expr);
    console.log(`Слагаемые:`, terms);
        
        // 5. Парсим
        const coeffs = Array(variables.length).fill(0);
        let constant = 0;
        
        for (const term of terms) {
            this.parseTerm(term, variables, coeffs, {value: constant});
        }
        
        // Пересчитываем константу
        constant = 0;
        for (const term of terms) {
            constant += this.getConstantFromTerm(term, variables);
        }
        
        const rightHandSide = -constant;
        
        console.log(`Результат: coeffs=[${coeffs}], const=${rightHandSide}`);
        
        return { coeffs, constant: rightHandSide };
    }
    
    splitTerms(expression) {
        if (!expression) return [];
        
        const terms = [];
        let current = '';
        let bracketDepth = 0;
        
        // Добавляем + если нужно
        let expr = expression;
        if (expr && !'+-'.includes(expr[0])) {
            expr = '+' + expr;
        }
        
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            
            if (char === '(') {
                bracketDepth++;
                current += char;
            } else if (char === ')') {
                bracketDepth--;
                current += char;
            } else if ((char === '+' || char === '-') && bracketDepth === 0) {
                if (current !== '') {
                    terms.push(current);
                }
                current = char;
            } else {
                current += char;
            }
        }
        
        if (current !== '') {
            terms.push(current);
        }
        
        return terms.filter(t => t && t !== '+' && t !== '-');
    }

    splitSimpleTerms(expression) {
    // Самый простой разбор без скобок
    if (!expression) return [];
    
    const terms = [];
    let current = '';
    
    // Добавляем + если первый символ не оператор
    let expr = expression;
    if (expr && !'+-'.includes(expr[0])) {
        expr = '+' + expr;
    }
    
    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];
        
        if ((char === '+' || char === '-') && i > 0) {
            if (current !== '') {
                terms.push(current);
            }
            current = char;
        } else {
            current += char;
        }
    }
    
    if (current !== '') {
        terms.push(current);
    }
    
    return terms.filter(t => t && t !== '+' && t !== '-');
}
    
    parseTerm(term, variables, coeffs, constantObj) {
        const isNegative = term.startsWith('-');
        let body = term.replace(/^[+-]/, '');
        
        if (!body) return;
        
        // Ищем переменные
        for (let i = 0; i < variables.length; i++) {
            const varName = variables[i];
            
            // Проверяем, содержит ли слагаемое эту переменную
            if (body.includes(varName)) {
                // Извлекаем коэффициент
                let coeffStr = body;
                
                // Убираем все вхождения переменной
                const regex = new RegExp(varName, 'g');
                coeffStr = coeffStr.replace(regex, '');
                
                // Убираем *
                coeffStr = coeffStr.replace(/\*/g, '');
                
                // Определяем коэффициент
                let coefficient = 1;
                if (coeffStr !== '') {
                    coefficient = this.evaluateSimple(coeffStr);
                }
                
                if (isNegative) coefficient = -coefficient;
                
                coeffs[i] += coefficient;
                return;
            }
        }
        
        // Если не нашли переменных - это константа
        const value = this.evaluateSimple(body) * (isNegative ? -1 : 1);
        constantObj.value += value;
    }
    
    getConstantFromTerm(term, variables) {
        const isNegative = term.startsWith('-');
        let body = term.replace(/^[+-]/, '');
        
        // Проверяем, содержит ли слагаемое переменные
        for (const varName of variables) {
            if (body.includes(varName)) {
                return 0; // Содержит переменную - не константа
            }
        }
        
        // Это константа
        const value = this.evaluateSimple(body);
        return isNegative ? -value : value;
    }
    
    evaluateSimple(expr) {
        if (!expr) return 0;
        
        // Убираем внешние скобки
        let clean = expr;
        while (clean.startsWith('(') && clean.endsWith(')')) {
            clean = clean.slice(1, -1);
        }
        
        // Пустое
        if (clean === '') return 0;
        
        // Число
        const num = parseFloat(clean);
        if (!isNaN(num)) return num;
        
        // Пробуем вычислить
        try {
            // Заменяем ВСЕ переменные на 1 для вычисления
            const mathExpr = clean.replace(/[a-zа-я][a-zа-я0-9]*/gi, '1');
            
            if (this.parser) {
                const compiled = this.parser.compile(mathExpr);
                return compiled.evaluate({});
            }
        } catch (error) {
            console.warn(`Не удалось вычислить: ${expr}`, error);
        }
        
        return 0;
    }
    
    isMathFunction(name) {
        const functions = [
            'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
            'asin', 'acos', 'atan', 'acot',
            'sinh', 'cosh', 'tanh', 'coth',
            'log', 'log10', 'ln', 'exp', 'sqrt', 'abs',
            'ceil', 'floor', 'round', 'sign', 'pow'
        ];
        return functions.includes(name.toLowerCase());
    }
    
    isConstant(name) {
        const constants = ['pi', 'e', 'inf', 'nan'];
        return constants.includes(name.toLowerCase());
    }
}

export default SystemParser;