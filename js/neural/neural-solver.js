import TextCorrector from './text-corrector.js';
import MethodRecommender from './method-recommender.js';

class NeuralSolver {
    constructor() {
        this.textCorrector = new TextCorrector();
        this.methodRecommender = new MethodRecommender();
        this.isReady = false;
    }
    
    async initialize() {
        await this.methodRecommender.loadHistory();
        this.isReady = true;
        console.log('Нейросетевая подсистема готова');
    }
    
    parseQuery(text) {
        // 1. Исправляем грамматические ошибки
        const corrected = this.textCorrector.correctMathExpression(text);
        console.log('Исправленный текст:', corrected);
        
        // 2. Определяем тип задачи
        let taskType = 'equation';
        if (corrected.includes('интеграл')) taskType = 'integral';
        else if (corrected.includes('дифференциальн') || corrected.includes('диффур')) taskType = 'ode';
        else if (corrected.includes('систем')) taskType = 'system';
        
        // 3. Извлекаем математическое выражение
        let expression = this.extractMath(corrected, taskType);
        
        // 4. Получаем рекомендацию метода из БД
        const recommendation = this.methodRecommender.recommend(taskType, expression);
        
        return {
            taskType: taskType,
            expression: expression,
            recommendedMethod: recommendation.method,
            confidence: recommendation.confidence,
            basedOn: recommendation.basedOn,
            originalText: text
        };
    }
    
    extractMath(text, taskType) {
        // Убираем команды
        const commands = ['реши', 'найди', 'вычисли', 'уравнение', 'интеграл', 'дифференциальное', 'система'];
        let math = text;
        
        for (const cmd of commands) {
            math = math.replace(new RegExp(cmd, 'gi'), '');
        }
        
        // Для интегралов убираем пределы
        if (taskType === 'integral') {
            math = math.replace(/от\s*\d+\s*до\s*\d+/g, '');
        }
        
        return math.trim() || 'x-0';
    }
    
    getRecommendedMethod(taskType) {
        return this.methodRecommender.recommend(taskType, '');
    }
    
    async saveResult(taskType, expression, method, converged, result) {
        await this.methodRecommender.saveResult(taskType, expression, method, converged, result);
    }
}

export default NeuralSolver;