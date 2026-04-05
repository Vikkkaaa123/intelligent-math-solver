class EquationMethodSelector {
  constructor(mathParser) {
    this.parser = mathParser;
  }

  // анализ функции и возврат рекомендуемого метода
  analyze(funcStr) {
    try {
      const f = this.parser.parseFunction(funcStr);
      const result = {
        recommendedMethod: 'newton',
        confidence: 0,
        reasons: [],
        alternatives: []
      };

      // 1. проверка на разрывы
      if (this._hasDiscontinuity(funcStr)) {
        result.recommendedMethod = 'bisection';
        result.confidence = 0.8;
        result.reasons.push('функция имеет разрывы, метод половинного деления более устойчив');
        result.alternatives = ['secant'];
        return result;
      }

      // 2. проверка на осцилляции
      if (this._isOscillating(funcStr)) {
        result.recommendedMethod = 'secant';
        result.confidence = 0.6;
        result.reasons.push('функция осциллирующая, метод секущих более устойчив');
        result.alternatives = ['bisection', 'newton'];
        return result;
      }

      // 3. проверка на кратный корень (поиск точек где f(x) и f'(x) близки к 0)
      const hasMultipleRoot = this._checkMultipleRoot(f, funcStr);
      if (hasMultipleRoot) {
        result.recommendedMethod = 'bisection';
        result.confidence = 0.7;
        result.reasons.push('обнаружен кратный корень, метод Ньютона теряет скорость');
        result.alternatives = ['secant'];
        return result;
      }

      // 4. проверка на наличие производной
      const hasDerivative = this._canComputeDerivative(funcStr);
      if (!hasDerivative) {
        result.recommendedMethod = 'secant';
        result.confidence = 0.9;
        result.reasons.push('производная недоступна, метод секущих не требует её вычисления');
        result.alternatives = ['bisection'];
        return result;
      }

      // 5. по умолчанию — метод Ньютона
      result.recommendedMethod = 'newton';
      result.confidence = 0.7;
      result.reasons.push('функция гладкая, метод Ньютона обеспечивает быструю сходимость');
      result.alternatives = ['secant', 'bisection'];

      return result;

    } catch (e) {
      return {
        recommendedMethod: 'bisection',
        confidence: 0.5,
        reasons: ['не удалось проанализировать функцию, рекомендован наиболее устойчивый метод'],
        alternatives: ['secant']
      };
    }
  }

  _hasDiscontinuity(funcStr) {
    const dangerous = ['1/x', 'tan', 'cot', 'sec', 'csc', 'log', 'ln'];
    for (const d of dangerous) {
      if (funcStr.includes(d) && !funcStr.includes('^')) {
        return true;
      }
    }
    return false;
  }

  _isOscillating(funcStr) {
    const oscillating = ['sin', 'cos'];
    for (const o of oscillating) {
      if (funcStr.includes(o)) {
        return true;
      }
    }
    return false;
  }

  _checkMultipleRoot(f, funcStr) {
    return funcStr.includes('^3') || funcStr.includes('^4') || funcStr.includes('^5');
  }

  _canComputeDerivative(funcStr) {
    const complexFuncs = ['abs', 'floor', 'ceil', 'round'];
    for (const cf of complexFuncs) {
      if (funcStr.includes(cf)) {
        return false;
      }
    }
    return true;
  }

  // получение краткой справки о методе
  getMethodHelp(method) {
    const help = {
      newton: {
        title: 'Метод Ньютона (касательных)',
        description: 'Итерационный метод, использующий производную функции. Обладает квадратичной сходимостью.',
        when: 'рекомендуется для гладких функций с простыми корнями при наличии хорошего начального приближения',
        formula: 'x_{n+1} = x_n - f(x_n)/f\'(x_n)'
      },
      bisection: {
        title: 'Метод половинного деления',
        description: 'Метод последовательного деления интервала пополам. Гарантированно сходится.',
        when: 'рекомендуется для непрерывных функций, если известен интервал со сменой знака',
        formula: 'x = (a+b)/2, интервал сокращается вдвое на каждой итерации'
      },
      secant: {
        title: 'Метод секущих',
        description: 'Метод, не требующий вычисления производной. Сверхлинейная сходимость.',
        when: 'рекомендуется, когда производная недоступна, но есть два начальных приближения',
        formula: 'x_{n+1} = x_n - f(x_n)·(x_n - x_{n-1})/(f(x_n)-f(x_{n-1}))'
      },
      iteration: {
        title: 'Метод простой итерации',
        description: 'Метод, основанный на преобразовании уравнения к виду x = φ(x).',
        when: 'требует предварительного анализа и подбора параметра λ, без этого может расходиться',
        formula: 'x_{n+1} = x_n + λ·f(x_n)'
      }
    };
    return help[method] || help.newton;
  }
}

export default EquationMethodSelector;