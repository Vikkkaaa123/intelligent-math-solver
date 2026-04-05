class EulerMethod {
    constructor(mathParser) {
        this.parser = mathParser;
    }

    solve(equation, x0, y0, xEnd, step = 0.1, maxSteps = 1000) {
        try {
            const f = this.parser.parseFunction(equation);
            
            if (x0 >= xEnd || step <= 0) {
                return {
                    method: "Метод Эйлера",
                    solution: null,
                    iterations: [],
                    converged: false,
                    message: 'Некорректные параметры'
                };
            }
            
            const iterations = [];
            let x = x0;
            let y = y0;
            let stepNumber = 0;
            
            iterations.push({
                step: stepNumber,
                x: x,
                y: y,
                derivative: 0,
                k1: 0, k2: 0, k3: 0, k4: 0
            });
            
            while (x < xEnd && stepNumber < maxSteps) {
                const derivative = f(x, y);
                y = y + step * derivative;
                x = x + step;
                stepNumber++;
                
                iterations.push({
                    step: stepNumber,
                    x: x,
                    y: y,
                    derivative: derivative,
                    k1: step * derivative,
                    k2: 0, k3: 0, k4: 0
                });
                
                if (!this._isFiniteNumber(y)) {
                    return {
                        method: "Метод Эйлера",
                        solution: null,
                        iterations: iterations,
                        converged: false,
                        message: 'Решение расходится'
                    };
                }
            }
            
            return {
                method: "Метод Эйлера",
                solution: {
                    x: iterations.map(point => point.x),
                    y: iterations.map(point => point.y)
                },
                iterations: iterations,
                converged: true,
                iterationsCount: stepNumber,
                final_x: x,
                final_y: y,
                step: step,
                message: `Решение получено за ${stepNumber} шагов, шаг h=${step}`
            };
            
        } catch (error) {
            return {
                method: "Метод Эйлера",
                solution: null,
                iterations: [],
                converged: false,
                message: 'Ошибка: ' + error.message
            };
        }
    }

    _isFiniteNumber(num) {
        return typeof num === 'number' && isFinite(num);
    }
}

export default EulerMethod;
