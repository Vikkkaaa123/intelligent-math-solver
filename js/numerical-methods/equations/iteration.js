class SimpleIterationMethod {
    constructor(mathParser) {
        this.parser = mathParser;
        this.method = 'Метод простой итерации';
    }

    solve(func, x0, lambda = 0.1, precision = 1e-6, maxIterations = 100) {
        try {
            if (lambda <= 0 || lambda > 2) {
                return {
                    root: null,
                    iterations: [],
                    converged: false,
                    message: 'Параметр λ должен быть: 0 < λ ≤ 2',
                    method: this.method,
                    iterationsCount: 0,
                    residual: null
                };
            }

            const f = this.parser.parseFunction(func);
            let x = x0;
            const iterations = [];
            
            for (let i = 0; i < maxIterations; i++) {
                const fx = f(x);
                const xNew = x - lambda * fx;
                
                if (Math.abs(xNew) > 1e10 || !isFinite(xNew)) {
                    return {
                        root: null,
                        iterations: iterations,
                        converged: false,
                        message: `Метод расходится. Попробуйте уменьшить λ (текущее: ${lambda})`,
                        method: this.method,
                        iterationsCount: i + 1,
                        residual: Math.abs(fx)
                    };
                }
                
                const error = Math.abs(xNew - x);
                
                iterations.push({
                    iteration: i + 1,
                    x: x,
                    fx: fx,
                    error: error,
                    lambda: lambda  // показываем в таблице
                });

                if (error < precision || Math.abs(fx) < precision) {
                    const residual = Math.abs(f(xNew));
                    return {
                        root: xNew,
                        iterations: iterations,
                        converged: true,
                        message: 'Уравнение решено!',
                        method: this.method,
                        iterationsCount: i + 1,
                        residual: residual
                    };
                }
                
                x = xNew;
            }
            
            const residual = Math.abs(f(x));
            return {
                root: x,
                iterations: iterations,
                converged: false,
                message: `Достигнут предел ${maxIterations} итераций. Попробуйте изменить λ (текущее: ${lambda})`,
                method: this.method,
                iterationsCount: maxIterations,
                residual: residual
            };
            
        } catch (error) {
            return {
                root: null,
                iterations: [],
                converged: false,
                message: 'Ошибка: ' + error.message,
                method: this.method,
                iterationsCount: 0,
                residual: null
            };
        }
    }
}

export default SimpleIterationMethod;
