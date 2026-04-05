class JacobiMethod {
    constructor() {
        this.method = 'Метод Якоби';
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
                    iterationsCount: 0
                };
            }

            const varNames = variables || this.generateVariableNames(n);
            
            //проверяем диагональные элементы
            for (let i = 0; i < n; i++) {
                if (Math.abs(matrix[i][i]) < 1e-10) {
                    return {
                        solution: null,
                        iterations: [],
                        converged: false,
                        message: `Нулевой диагональный элемент a[${i}][${i}] = 0`,
                        method: this.method,
                        residual: null,
                        iterationsCount: 0
                    };
                }
            }

            //начальное приближение
            let x = initialGuess || Array(n).fill(0);
            let xNew = Array(n).fill(0);
            const iterations = [];

            for (let k = 0; k < maxIterations; k++) {
                const xPrev = [...x];

                //формула Якоби
                for (let i = 0; i < n; i++) {
                    let sum = 0;
                    for (let j = 0; j < n; j++) {
                        if (j !== i) {
                            sum += matrix[i][j] * xPrev[j];
                        }
                    }
                    xNew[i] = (vector[i] - sum) / matrix[i][i];
                }

                const residual = this.calculateResidual(matrix, vector, xNew);

                iterations.push({
                    iteration: k + 1,
                    x: [...xNew],
                    residual: residual
                });

                //критерий остановки по невязке
                if (residual < precision) {
                    return {
                        solution: xNew,
                        iterations: iterations,
                        converged: true,
                        message: `Метод Якоби сошелся за ${k + 1} итераций. ` +
                                 `Финальная невязка: ${residual.toFixed(10)}`,
                        method: this.method,
                        iterationsCount: k + 1,
                        residual: residual,
                        variables: varNames
                    };
                }

                x = [...xNew];
            }

            //если не сошлось
            const finalResidual = this.calculateResidual(matrix, vector, xNew);
            return {
                solution: xNew,
                iterations: iterations,
                converged: false,
                message: `Достигнут предел ${maxIterations} итераций. ` +
                         `Текущая невязка: ${finalResidual.toFixed(6)}`,
                method: this.method,
                iterationsCount: maxIterations,
                residual: finalResidual,
                variables: varNames
            };

        } catch (error) {
            return {
                solution: null,
                iterations: [],
                converged: false,
                message: 'Ошибка: ' + error.message,
                method: this.method,
                residual: null,
                iterationsCount: 0
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

export default JacobiMethod;