class TrapezoidalMethod {
    constructor(mathParser) {
        this.parser = mathParser;
    }

    solve(func, a, b, precision = 1e-6, N = 100, maxIterations = 20) {
        try {
            const f = this.parser.parseFunction(func);
            
            // Используем N из входа пользователя
            let n = Math.max(1, N);
            
            let previous = 0;
            let current = this._calculate(f, a, b, n);
            const iterations = [];

            for (let i = 0; i < maxIterations; i++) {
                const h = (b - a) / n;
                const error = Math.abs(current - previous);
                
                // Используем те же поля, что и в методе Симпсона
                iterations.push({
                    n: n,          // количество отрезков
                    h: h,          // шаг интегрирования
                    I_n: current,  // значение интеграла
                    error: error   // погрешность
                });

                if (i > 0 && error < precision) {
                    return {
                        method: "Метод трапеций",
                        result: current,
                        iterations: iterations,
                        converged: true,
                        message: `Интеграл вычислен с точностью ${error.toExponential(2)}`
                    };
                }

                if (!this._isFiniteNumber(current)) {
                    return {
                        method: "Метод трапеций",
                        result: null,
                        iterations: iterations,
                        converged: false,
                        message: 'Метод расходится'
                    };
                }

                previous = current;
                n *= 2;
                
                if (n > 1000000) {
                    return {
                        method: "Метод трапеций",
                        result: current,
                        iterations: iterations,
                        converged: false,
                        message: 'Достигнут предел segments'
                    };
                }
                
                current = this._calculate(f, a, b, n);
            }

            return {
                method: "Метод трапеций",
                result: current,
                iterations: iterations,
                converged: false,
                message: `Достигнут предел ${maxIterations} итераций`
            };

        } catch (error) {
            return {
                method: "Метод трапеций",
                result: null,
                iterations: [],
                converged: false,
                message: 'Ошибка: ' + error.message
            };
        }
    }

    _calculate(f, a, b, n) {
        const h = (b - a) / n;
        let sum = (f(a) + f(b)) / 2;

        for (let i = 1; i < n; i++) {
            sum += f(a + i * h);
        }

        return h * sum;
    }

    _isFiniteNumber(num) {
        return typeof num === 'number' && isFinite(num);
    }
}

export default TrapezoidalMethod;