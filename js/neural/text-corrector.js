class TextCorrector {
    constructor() {
        // Словарь правильных слов и их вариантов с ошибками
        this.dictionary = {
            'реши': ['риши', 'решы', 'реши', 'решить', 'ришить', 'рещь'],
            'уравнение': ['урвнение', 'уровнение', 'уравнене', 'уравненте', 'уравнени'],
            'интеграл': ['интиграл', 'интиграл', 'интеграл', 'интеграл'],
            'дифференциальное': ['дифуравнение', 'дифур', 'дифференциал', 'диффур', 'ду'],
            'система': ['система', 'систему', 'систем', 'систма'],
            'найди': ['найти', 'найт', 'найти'],
            'вычисли': ['вычесли', 'высчисли', 'вычислить'],
            'от': ['ат', 'от'],
            'до': ['да', 'до']
        };
        
        // Список всех правильных слов для Fuse.js
        this.correctWords = Object.keys(this.dictionary);
        
        // Создаём Fuse.js для поиска ближайшего слова
        this.fuse = new Fuse(this.correctWords, {
            includeScore: true,
            threshold: 0.4,  // чувствительность (0 = точное совпадение, 1 = любое)
            distance: 100
        });
    }
    
    correct(text) {
        let words = text.toLowerCase().split(/\s+/);
        let correctedWords = [];
        
        for (let word of words) {
            // Ищем ближайшее правильное слово
            const result = this.fuse.search(word);
            
            if (result.length > 0 && result[0].score < 0.4) {
                // Нашли похожее слово
                const correctWord = result[0].item;
                correctedWords.push(correctWord);
            } else {
                // Оставляем как есть (может быть переменная x, y, число)
                correctedWords.push(word);
            }
        }
        
        return correctedWords.join(' ');
    }
    
    // Специальная обработка математических символов
    correctMathExpression(text) {
        let corrected = this.correct(text);
        
        // Заменяем русские буквы на латинские
        corrected = corrected
            .replace(/[хx]/g, 'x')
            .replace(/[уy]/g, 'y')
            .replace(/[ч]/g, 'x')
            .replace(/[н]/g, 'y');
        
        // Исправляем "в квадрате" → "^2"
        corrected = corrected.replace(/в\s*квадрате/g, '^2');
        corrected = corrected.replace(/в\s*кубе/g, '^3');
        
        return corrected;
    }
}

export default TextCorrector;