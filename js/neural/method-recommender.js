class MethodRecommender {
    constructor() {
        this.history = []; // Здесь будут данные из PostgreSQL
    }
    
    // Загрузить историю из PostgreSQL
    async loadHistory() {
        try {
            const response = await fetch('http://localhost:8000/api/history');
            const data = await response.json();
            this.history = data;
            console.log(`Загружено ${this.history.length} решений из БД`);
        } catch (error) {
            console.warn('Не удалось загрузить историю:', error);
            this.history = [];
        }
    }
    
    // Рекомендовать метод на основе истории
    recommend(taskType, expression) {
        if (this.history.length === 0) {
            return this.getDefaultMethod(taskType);
        }
        
        // Фильтруем задачи того же типа
        const similarTasks = this.history.filter(item => item.task_type === taskType);
        
        if (similarTasks.length === 0) {
            return this.getDefaultMethod(taskType);
        }
        
        // Считаем успешность каждого метода
        const methodStats = {};
        
        for (const task of similarTasks) {
            const method = task.method_used;
            if (!methodStats[method]) {
                methodStats[method] = { success: 0, total: 0 };
            }
            methodStats[method].total++;
            if (task.converged) {
                methodStats[method].success++;
            }
        }
        
        // Находим метод с наибольшим процентом успеха
        let bestMethod = null;
        let bestRate = 0;
        
        for (const [method, stats] of Object.entries(methodStats)) {
            const rate = stats.success / stats.total;
            if (rate > bestRate) {
                bestRate = rate;
                bestMethod = method;
            }
        }
        
        return {
            method: bestMethod || this.getDefaultMethod(taskType),
            confidence: bestRate,
            basedOn: similarTasks.length
        };
    }
    
    getDefaultMethod(taskType) {
        const defaults = {
            equation: 'newton',
            integral: 'simpson',
            ode: 'runge-kutta',
            system: 'gauss'
        };
        return defaults[taskType] || 'newton';
    }
    
    // Сохранить результат решения в БД
    async saveResult(taskType, expression, method, converged, result) {
        try {
            const data = {
                task_type: taskType,
                input_data: { expression: expression },
                method_used: method,
                result: { converged: converged, value: result },
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('http://localhost:8000/api/save-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('Результат сохранён в БД');
                // Обновляем локальную историю
                await this.loadHistory();
            }
        } catch (error) {
            console.warn('Не удалось сохранить результат:', error);
        }
    }
}

export default MethodRecommender;