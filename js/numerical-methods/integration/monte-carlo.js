class MonteCarloMethod {
    constructor(mathParser) {
        this.parser = mathParser;
    }

    solve(func, a, b, precision = 5e-2, N = 10000, maxIterations = 20) {
        try {
            const f = this.parser.parseFunction(func);
            
            if (a >= b) {
                return {
                    method: "Метод Монте-Карло",
                    result: null,
                    iterations: [],
                    converged: false,
                    message: 'Интервал задан некорректно'
                };
            }
            

            const MAX_POINTS = 100000;
            let n = Math.min(Math.max(1000, N), MAX_POINTS);
            
            let previous = 0;
            let current = this._calculate(f, a, b, n);
            const iterations = [];

            for (let i = 0; i < maxIterations; i++) {
                const error = Math.abs(current - previous);
                
                iterations.push({
                    n: n,
                    h: '-',
                    I_n: current,
                    error: error
                });


                if (i > 0 && error < precision) {
                    return {
                        method: "Метод Монте-Карло",
                        result: current,
                        iterations: iterations,
                        converged: true,
                        message: `Интеграл вычислен. ${n} точек, погрешность: ${error.toExponential(2)}`
                    };
                }

                previous = current;
                

                n = Math.min(n * 2, MAX_POINTS);
                

                if (n >= MAX_POINTS && i > 5) {
                    return {
                        method: "Метод Монте-Карло",
                        result: current,
                        iterations: iterations,
                        converged: true,
                        message: `Максимум ${MAX_POINTS} точек. Результат: ${current.toFixed(6)}`
                    };
                }
                
                current = this._calculate(f, a, b, n);
            }


            return {
                method: "Метод Монте-Карло",
                result: current,
                iterations: iterations,
                converged: true,
                message: `Приближение после ${maxIterations} итераций. ${n} точек`
            };

        } catch (error) {
            return {
                method: "Метод Монте-Карло",
                result: null,
                iterations: [],
                converged: false,
                message: 'Ошибка: ' + error.message
            };
        }
    }

    _calculate(f, a, b, n) {
        let sum = 0;
        const range = b - a;

        for (let i = 0; i < n; i++) {
            const x = a + Math.random() * range;
            sum += f(x);
        }
        
        return range * (sum / n);
    }

    _isFiniteNumber(num) {
        return typeof num === 'number' && isFinite(num);
    }
}

export default MonteCarloMethod;