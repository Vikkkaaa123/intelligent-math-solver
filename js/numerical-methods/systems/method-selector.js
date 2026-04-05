// выбор метода для решения СЛАУ
class SystemMethodSelector {
  constructor() {}

  analyze(matrix) {
    const n = matrix.length;
    const result = {
      recommendedMethod: 'gauss',
      confidence: 0,
      reasons: [],
      alternatives: []
    };

    // проверка на диагональное преобладание
    const hasDiagonalDominance = this._checkDiagonalDominance(matrix);

    if (n <= 10) {
      result.recommendedMethod = 'gauss';
      result.confidence = 0.9;
      result.reasons.push('размерность системы мала, метод Гаусса даст точное решение');
      result.alternatives = hasDiagonalDominance ? ['zeidel', 'jacobi'] : [];
      return result;
    }

    if (hasDiagonalDominance) {
      result.recommendedMethod = 'zeidel';
      result.confidence = 0.8;
      result.reasons.push('система имеет диагональное преобладание, метод Зейделя сойдётся быстро');
      result.alternatives = ['jacobi', 'gauss'];
      return result;
    }

    result.recommendedMethod = 'gauss';
    result.confidence = 0.7;
    result.reasons.push('нет диагонального преобладания, итерационные методы могут расходиться');
    result.alternatives = [];

    return result;
  }

  _checkDiagonalDominance(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
      let diag = Math.abs(matrix[i][i]);
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          sum += Math.abs(matrix[i][j]);
        }
      }
      if (diag <= sum) {
        return false;
      }
    }
    return true;
  }

  getMethodHelp(method) {
    const help = {
      gauss: {
        title: 'Метод Гаусса',
        description: 'Прямой метод решения СЛАУ, основанный на приведении матрицы к треугольному виду.',
        when: 'рекомендуется для систем небольшой размерности',
        formula: 'прямой ход (исключение) → обратный ход (подстановка)'
      },
      jacobi: {
        title: 'Метод Якоби',
        description: 'Итерационный метод, вычисляющий новые значения на основе предыдущей итерации.',
        when: 'рекомендуется для параллельных вычислений, так как шаг независим',
        formula: 'x_i^{(k+1)} = (b_i - ∑_{j≠i} a_{ij}x_j^{(k)}) / a_{ii}'
      },
      zeidel: {
        title: 'Метод Зейделя',
        description: 'Итерационный метод, использующий уже обновлённые значения на текущей итерации.',
        when: 'рекомендуется для систем с диагональным преобладанием, сходится быстрее Якоби',
        formula: 'x_i^{(k+1)} = (b_i - ∑_{j<i} a_{ij}x_j^{(k+1)} - ∑_{j>i} a_{ij}x_j^{(k)}) / a_{ii}'
      }
    };
    return help[method] || help.gauss;
  }
}

export default SystemMethodSelector;