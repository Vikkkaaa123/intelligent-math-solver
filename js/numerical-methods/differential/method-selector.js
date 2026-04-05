// выбор метода для решения ОДУ
class DifferentialMethodSelector {
  constructor() {}

  analyze(equation, x0, y0, xEnd) {
    const result = {
      recommendedMethod: 'runge-kutta',
      confidence: 0,
      reasons: [],
      alternatives: []
    };

    // проверка на жёсткость (упрощённо)
    const isStiff = this._isStiff(equation);
    if (isStiff) {
      result.recommendedMethod = 'none';
      result.confidence = 0.3;
      result.reasons.push('обнаружены признаки жёсткой задачи, стандартные методы могут быть неустойчивы');
      result.alternatives = [];
      return result;
    }

    // если нужна быстрая оценка
    const steps = (xEnd - x0) / 0.1;
    if (steps > 100) {
      result.recommendedMethod = 'euler';
      result.confidence = 0.6;
      result.reasons.push('требуется много шагов, метод Эйлера более экономичен');
      result.alternatives = ['runge-kutta'];
      return result;
    }

    // по умолчанию — Рунге-Кутта
    result.recommendedMethod = 'runge-kutta';
    result.confidence = 0.8;
    result.reasons.push('метод Рунге-Кутты 4-го порядка обеспечивает высокую точность');
    result.alternatives = ['euler'];

    return result;
  }

  _isStiff(equation) {
    const stiff = ['-100', '-1000', '-10*y'];
    for (const s of stiff) {
      if (equation.includes(s)) {
        return true;
      }
    }
    return false;
  }

  getMethodHelp(method) {
    const help = {
      euler: {
        title: 'Метод Эйлера',
        description: 'Простейший одношаговый метод, использующий касательную для продолжения решения.',
        when: 'рекомендуется для грубых оценок или в учебных целях',
        formula: 'y_{n+1} = y_n + h·f(x_n, y_n)'
      },
      'runge-kutta': {
        title: 'Метод Рунге-Кутты 4-го порядка',
        description: 'Одношаговый метод с высоким порядком точности (4-й).',
        when: 'рекомендуется для большинства задач, требующих высокой точности',
        formula: 'y_{n+1} = y_n + h/6·(k₁+2k₂+2k₃+k₄)'
      }
    };
    return help[method] || help['runge-kutta'];
  }
}

export default DifferentialMethodSelector;