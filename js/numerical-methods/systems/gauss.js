class GaussMethod {
    constructor() {
        this.method = 'Метод Гаусса';
    }

    solve(matrix, vector, variables = null) {
        try {
            const n = matrix.length;
            
            // Валидация входных данных
            if (n === 0) {
                return {
                    solution: null,
                    steps: [],
                    converged: false,
                    message: 'Матрица пустая',
                    method: this.method,
                    residual: null,
                    determinant: null
                };
            }
            
            if (n !== vector.length) {
                return {
                    solution: null,
                    steps: [],
                    converged: false,
                    message: `Размеры не совпадают: матрица ${n}×${matrix[0].length}, вектор ${vector.length}`,
                    method: this.method,
                    residual: null,
                    determinant: null
                };
            }
            
            // Проверка квадратности матрицы
            for (let i = 0; i < n; i++) {
                if (matrix[i].length !== n) {
                    return {
                        solution: null,
                        steps: [],
                        converged: false,
                        message: `Матрица не квадратная: строка ${i+1} имеет ${matrix[i].length} элементов`,
                        method: this.method,
                        residual: null,
                        determinant: null
                    };
                }
            }

            const varNames = variables || this.generateVariableNames(n);
            const steps = [];
            
            // 1. СОЗДАЕМ РАСШИРЕННУЮ МАТРИЦУ
            const augmented = this.createAugmentedMatrix(matrix, vector);
            
            // Запоминаем исходную матрицу для вывода
            const initialMatrix = this.copyMatrix(augmented);
            steps.push({
                type: 'initial',
                matrix: initialMatrix,
                label: 'Исходная расширенная матрица [A|b]'
            });
            
            let determinant = 1;

            // 2. ПРЯМОЙ ХОД (приведение к треугольному виду)
            for (let i = 0; i < n; i++) {
                // Поиск главного элемента в текущем столбце
                let maxRow = i;
                for (let j = i + 1; j < n; j++) {
                    if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
                        maxRow = j;
                    }
                }

                // Перестановка строк, если нужно
                if (maxRow !== i) {
                    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
                    determinant *= -1;
                    
                    steps.push({
                        type: 'row_swap',
                        matrix: this.copyMatrix(augmented),
                        label: `Перестановка строк ${i+1} и ${maxRow+1}`,
                        details: {
                            row1: i + 1,
                            row2: maxRow + 1
                        }
                    });
                }

                // Проверка на вырожденность
                if (Math.abs(augmented[i][i]) < 1e-12) {
                    steps.push({
                        type: 'error',
                        matrix: this.copyMatrix(augmented),
                        label: 'Матрица вырождена',
                        details: { pivot: augmented[i][i] }
                    });
                    
                    return {
                        solution: null,
                        steps: steps,
                        converged: false,
                        message: `Матрица вырождена: ведущий элемент a[${i+1}][${i+1}] ≈ ${augmented[i][i].toFixed(6)}`,
                        method: this.method,
                        residual: null,
                        determinant: 0
                    };
                }

                determinant *= augmented[i][i];

                // Обнуление элементов под диагональю
                let madeChanges = false;
                for (let j = i + 1; j < n; j++) {
                    const factor = augmented[j][i] / augmented[i][i];
                    
                    if (Math.abs(factor) > 1e-12) {
                        madeChanges = true;
                        for (let k = i; k <= n; k++) {
                            augmented[j][k] -= factor * augmented[i][k];
                        }
                        augmented[j][i] = 0; // Для точности
                    }
                }
                
                if (madeChanges && i < n - 1) {
                    steps.push({
                        type: 'elimination',
                        matrix: this.copyMatrix(augmented),
                        label: `Обнуление под диагональю в столбце ${i+1}`,
                        details: { column: i + 1 }
                    });
                }
            }

            // 3. После прямого хода
            const triangularMatrix = this.copyMatrix(augmented);
            steps.push({
                type: 'after_forward',
                matrix: triangularMatrix,
                label: 'После прямого хода (треугольная форма)'
            });

            // 4. ОБРАТНЫЙ ХОД
            const solution = new Array(n);
            const backSteps = [];
            
            for (let i = n - 1; i >= 0; i--) {
                let sum = augmented[i][n];
                
                // Формируем строку уравнения для вывода
                let equation = `${varNames[i]} = (`;
                equation += `${augmented[i][n].toFixed(4)}`;
                
                for (let j = i + 1; j < n; j++) {
                    if (Math.abs(augmented[i][j]) > 1e-12) {
                        sum -= augmented[i][j] * solution[j];
                        equation += ` - ${augmented[i][j].toFixed(4)}×${solution[j].toFixed(4)}`;
                    }
                }
                
                solution[i] = sum / augmented[i][i];
                equation += `) / ${augmented[i][i].toFixed(4)} = ${solution[i].toFixed(6)}`;
                
                backSteps.push({
                    variable: varNames[i],
                    value: solution[i],
                    equation: equation,
                    step: n - i // Номер шага обратного хода
                });
            }
            
            // 5. Шаги обратного хода
            steps.push({
                type: 'back_substitution',
                steps: backSteps,
                label: 'Обратный ход (обратная подстановка)'
            });

            // 6. ВЫЧИСЛЯЕМ НЕВЯЗКУ
            const residual = this.calculateResidual(matrix, vector, solution);

            return {
                solution: solution,
                steps: steps,
                converged: true,
                message: `Система ${n}×${n} решена методом Гаусса. ` +
                         `Определитель: ${determinant.toFixed(6)}. ` +
                         `Невязка: ${residual.toFixed(10)}`,
                method: this.method,
                iterationsCount: null, // Не используется для Гаусса
                residual: residual,
                determinant: determinant,
                variables: varNames,
                matrix: matrix,
                vector: vector
            };

        } catch (error) {
            console.error('Ошибка в методе Гаусса:', error);
            return {
                solution: null,
                steps: [],
                converged: false,
                message: 'Ошибка вычислений: ' + error.message,
                method: this.method,
                residual: null,
                determinant: null
            };
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========
    
    createAugmentedMatrix(matrix, vector) {
        const n = matrix.length;
        const augmented = [];
        
        for (let i = 0; i < n; i++) {
            augmented.push([...matrix[i], vector[i]]);
        }
        
        return augmented;
    }
    
    copyMatrix(matrix) {
        return matrix.map(row => [...row]);
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
            maxResidual = Math.max(maxResidual, residual);
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
    
    //для форматирования таблицы
    formatMatrixHTML(matrix, variables = null) {
        const n = matrix.length;
        const m = matrix[0].length; //n+1 для расширенной матрицы
        
        let html = '<table class="matrix-table">';
        
        //заголовок
        html += '<thead><tr><th></th>';
        for (let j = 0; j < m - 1; j++) {
            const varName = variables ? variables[j] : `x${j+1}`;
            html += `<th>${varName}</th>`;
        }
        html += '<th>b</th></tr></thead>';
        
        //данные
        html += '<tbody>';
        for (let i = 0; i < n; i++) {
            html += '<tr>';
            html += `<td class="row-label">${i+1}</td>`;
            
            for (let j = 0; j < m; j++) {
                const value = matrix[i][j];
                let cellClass = '';
                let displayValue = value.toFixed(4);
                
                //подсветка нулей и диагональных элементов
                if (Math.abs(value) < 1e-10) {
                    displayValue = '0.0000';
                    cellClass = 'zero';
                } else if (j === i) {
                    cellClass = 'diagonal';
                } else if (j < i && j < m - 1) {
                    cellClass = 'below-diagonal';
                }
                
                html += `<td class="${cellClass}">${displayValue}</td>`;
            }
            
            html += '</tr>';
        }
        html += '</tbody></table>';
        
        return html;
    }
}

export default GaussMethod;