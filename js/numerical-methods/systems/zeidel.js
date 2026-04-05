class ZeidelMethod {
    constructor() {
        this.method = 'Метод Зейделя';
    }

    solve(matrix, vector, initialGuess = null, variables = null, precision = 1e-6, maxIterations = 1000) {
        try {
            const n = matrix.length;
            
            if (n !== vector.length) {
                return {
                    solution: null,
                    iterations: [],
                    converged: false,
                    message: 'Несовместимые размеры матрицы и вектора',
                    method: this.method,
                    residual: null,
                    iterationsCount: 0,
                    initialGuess: initialGuess || Array(n).fill(0)
                };
            }

            const varNames = variables || this.generateVariableNames(n);
            
            //сохраняем начальное приближение
            const savedInitialGuess = initialGuess ? [...initialGuess] : Array(n).fill(0);
            
            //проверка диагональных элементов
            for (let i = 0; i < n; i++) {
                if (Math.abs(matrix[i][i]) < 1e-10) {
                    return {
                        solution: null,
                        iterations: [],
                        converged: false,
                        message: `Нулевой диагональный элемент a[${i}][${i}] = 0`,
                        method: this.method,
                        residual: null,
                        iterationsCount: 0,
                        initialGuess: savedInitialGuess
                    };
                }
            }

            let x = savedInitialGuess;
            const iterations = [];

            for (let k = 0; k < maxIterations; k++) {
                const xPrev = [...x];
                
                // Формула Зейделя
                for (let i = 0; i < n; i++) {
                    let sum1 = 0;
                    let sum2 = 0;
                    
                    for (let j = 0; j < i; j++) {
                        sum1 += matrix[i][j] * x[j];
                    }
                    
                    for (let j = i + 1; j < n; j++) {
                        sum2 += matrix[i][j] * xPrev[j];
                    }
                    
                    x[i] = (vector[i] - sum1 - sum2) / matrix[i][i];
                }

                const residual = this.calculateResidual(matrix, vector, x);

                iterations.push({
                    iteration: k + 1,
                    x: [...x],
                    residual: residual
                });

                if (residual < precision) {
                    return {
                        solution: x,
                        iterations: iterations,
                        converged: true,
                        message: `Метод Зейделя сошелся за ${k + 1} итераций. ` +
                                 `Финальная невязка: ${residual.toFixed(10)}`,
                        method: this.method,
                        iterationsCount: k + 1,
                        residual: residual,
                        variables: varNames,
                        initialGuess: savedInitialGuess
                    };
                }
            }

            const finalResidual = this.calculateResidual(matrix, vector, x);
            return {
                solution: x,
                iterations: iterations,
                converged: false,
                message: `Достигнут предел ${maxIterations} итераций. ` +
                         `Текущая невязка: ${finalResidual.toFixed(6)}`,
                method: this.method,
                iterationsCount: maxIterations,
                residual: finalResidual,
                variables: varNames,
                initialGuess: savedInitialGuess
            };

        } catch (error) {
            return {
                solution: null,
                iterations: [],
                converged: false,
                message: 'Ошибка: ' + error.message,
                method: this.method,
                residual: null,
                iterationsCount: 0,
                initialGuess: initialGuess || Array(matrix.length || 2).fill(0)
            };
        }
    }

    calculateResidual(matrix, vector, solution) {
        const n = matrix.length;
        let maxResidual = 0;
        
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += matrix[i][j] * solution[j];
            }
            const residual = Math.abs(vector[i] - sum);
            if (residual > maxResidual) {
                maxResidual = residual;
            }
        }
        
        return maxResidual;
    }

    generateVariableNames(n) {
        if (n <= 3) {
            return ['x', 'y', 'z'].slice(0, n);
        } else {
            return Array.from({length: n}, (_, i) => `x${i+1}`);
        }
    }
}

export default ZeidelMethod;