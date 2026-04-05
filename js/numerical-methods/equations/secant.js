class SecantMethod {
    constructor(mathParser) {
        this.parser = mathParser;
        this.method = 'Метод секущих';
    }

    solve(func, x0, x1, precision = 1e-6, maxIterations = 100) {
        try {
            const f = this.parser.parseFunction(func);
            const iterations = [];
            
            let xPrev = x0;
            let xCurr = x1;
            let fPrev = f(xPrev);
            let fCurr = f(xCurr);
            
            for (let i = 0; i < maxIterations; i++) {
                if (Math.abs(fCurr - fPrev) < 1e-15) {
                    return {
                        root: null,
                        iterations: iterations,
                        converged: false,
                        message: 'Деление на ноль (f(xn) - f(xn-1) ≈ 0)',
                        method: this.method,
                        iterationsCount: i,
                        residual: Math.abs(fCurr)
                    };
                }
                
                const xNew = xCurr - ((xCurr - xPrev) * fCurr) / (fCurr - fPrev);
                
                if (Math.abs(xNew) > 1e10 || !isFinite(xNew)) {
                    return {
                        root: null,
                        iterations: iterations,
                        converged: false,
                        message: 'Метод расходится',
                        method: this.method,
                        iterationsCount: i + 1,
                        residual: Math.abs(fCurr)
                    };
                }
                
                const error = Math.abs(xNew - xCurr);
                
                iterations.push({
                    iteration: i + 1,
                    x: xCurr,
                    fx: fCurr,
                    error: error
                });
                
                if (error < precision || Math.abs(fCurr) < precision) {
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
                
                xPrev = xCurr;
                fPrev = fCurr;
                xCurr = xNew;
                fCurr = f(xCurr);
            }
            
            const residual = Math.abs(fCurr);
            return {
                root: xCurr,
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
                method: this.method,
                iterationsCount: 0,
                residual: null
            };
        }
    }
}

export default SecantMethod;
