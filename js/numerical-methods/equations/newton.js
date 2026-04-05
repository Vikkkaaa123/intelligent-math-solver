class NewtonMethod {
    constructor(mathParser) {
        this.parser = mathParser;
        this.method = 'Метод Ньютона';
    }

    solve(func, x0, precision = 1e-6, maxIterations = 100) {
        try {
            const f = this.parser.parseFunction(func);
            let x = x0;
            const iterations = [];
            
            for (let i = 0; i < maxIterations; i++) {
                const fx = f(x);
                const dfx = this._derivative(f, x);
                
                if (Math.abs(dfx) < 1e-10) {
                    return {
                        root: null,
                        iterations: iterations,
                        converged: false,
                        message: 'Производная близка к нулю',
                        method: this.method
                    };
                }
                
                const xNew = x - fx / dfx;
                
                if (Math.abs(xNew) > 1e10 || !isFinite(xNew)) {
                    return {
                        root: null,
                        iterations: iterations,
                        converged: false,
                        message: 'Метод расходится',
                        method: this.method
                    };
                }
                
                const error = Math.abs(xNew - x);
                
                iterations.push({
                    iteration: i + 1,
                    x: x,
                    fx: fx,
                    derivative: dfx,
                    xNew: xNew,
                    error: error
                });
                
                if (error < precision || Math.abs(fx) < precision) {
                    const residual = Math.abs(f(xNew));
                    return {
                        root: xNew,
                        iterations: iterations,
                        converged: true,
                        message: `Сошлось за ${i + 1} итераций`,
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
                message: `Достигнут предел ${maxIterations} итераций`,
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
                method: this.method
            };
        }
    }

    _derivative(func, x, h = 1e-7) {
        const h0 = Math.max(1e-10, 1e-7 * Math.abs(x || 1));
        return (func(x + h0) - func(x - h0)) / (2 * h0);
    }
}

export default NewtonMethod;
