class BisectionMethod {
    constructor(mathParser) {
        this.parser = mathParser;
        this.method = 'Метод половинного деления';
    }

    solve(func, a, b, precision = 1e-6, maxIterations = 100) {
        try {
            let left = a;
            let right = b;
            
            if (left >= right) {
                [left, right] = [right, left];
            }

            const f = this.parser.parseFunction(func);
            const fa = f(left);
            const fb = f(right);
            
            if (!this._isNumber(fa) || !this._isNumber(fb)) {
                return {
                    root: null,
                    iterations: [],
                    converged: false,
                    message: 'Функция не определена на границах интервала',
                    method: this.method,
                    iterationsCount: 0,
                    residual: null
                };
            }
            
            if (Math.abs(fa) < precision) {
                return {
                    root: left,
                    iterations: [],
                    converged: true,
                    message: 'Уравнение решено!',
                    method: this.method,
                    iterationsCount: 0,
                    residual: Math.abs(fa)
                };
            }
            
            if (Math.abs(fb) < precision) {
                return {
                    root: right,
                    iterations: [],
                    converged: true,
                    message: 'Уравнение решено!',
                    method: this.method,
                    iterationsCount: 0,
                    residual: Math.abs(fb)
                };
            }
            
            if (fa * fb > 0) {
                return {
                    root: null,
                    iterations: [],
                    converged: false,
                    message: 'Нет смены знака на интервале [a, b]',
                    method: this.method,
                    iterationsCount: 0,
                    residual: null
                };
            }
            
            return this._bisect(f, left, right, fa, precision, maxIterations);
            
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

    _bisect(f, left, right, fLeft, precision, maxIterations) {
        let currentLeft = left;
        let currentRight = right;
        let currentFLeft = fLeft;
        const iterations = [];
        
        for (let i = 0; i < maxIterations; i++) {
            const mid = (currentLeft + currentRight) / 2;
            const fMid = f(mid);
            const error = (currentRight - currentLeft) / 2;
            
            iterations.push({
                iteration: i + 1,
                x: mid,
                fx: fMid,
                error: error
            });
            
            if (Math.abs(fMid) < precision || error < precision) {
                const residual = Math.abs(fMid);
                return {
                    root: mid,
                    iterations: iterations,
                    converged: true,
                    message: 'Уравнение решено!',
                    method: this.method,
                    iterationsCount: i + 1,
                    residual: residual
                };
            }
            
            if (currentFLeft * fMid < 0) {
                currentRight = mid;
            } else {
                currentLeft = mid;
                currentFLeft = fMid;
            }
        }
        
        const root = (currentLeft + currentRight) / 2;
        const residual = Math.abs(f(root));
        return {
            root: root,
            iterations: iterations,
            converged: false,
            message: `Достигнут предел ${maxIterations} итераций`,
            method: this.method,
            iterationsCount: maxIterations,
            residual: residual
        };
    }

    _isNumber(num) {
        return typeof num === 'number' && isFinite(num);
    }
}

export default BisectionMethod;
