// выбор метода для интегрирования
class IntegrationMethodSelector {
  constructor(mathParser) {
    this.parser = mathParser;
  }

  analyze(funcStr, a, b) {
    try {
      const f = this.parser.parseFunction(funcStr);
      const result = {
        recommendedMethod: 'simpson',
        confidence: 0,
        reasons: [],
        alternatives: []
      };

      // 1. проверка на особенности (неограниченная производная)
      if (this._hasSingularity(funcStr, a, b)) {
        result.recommendedMethod = 'trapezoidal';
        result.confidence = 0.7;
        result.reasons.push('функция имеет особенность, метод Симпсона теряет точность');
        result.alternatives = ['rectangles'];
        return result;
      }

      // 2. проверка на осцилляции
      if (this._isOscillating(funcStr)) {
        result.recommendedMethod = 'simpson';
        result.confidence = 0.8;
        result.reasons.push('функция гладкая, метод Симпсона даст высокую точность');
        result.alternatives = ['trapezoidal'];
        return result;
      }

      // 3. по умолчанию — метод Симпсона
      result.recommendedMethod = 'simpson';
      result.confidence = 0.8;
      result.reasons.push('метод Симпсона обеспечивает наивысшую точность для гладких функций');
      result.alternatives = ['trapezoidal', 'rectangles'];

      return result;

    } catch (e) {
      return {
        recommendedMethod: 'trapezoidal',
        confidence: 0.5,
        reasons: ['не удалось проанализировать функцию, рекомендован устойчивый метод'],
        alternatives: ['rectangles']
      };
    }
  }

  _hasSingularity(funcStr, a, b) {
    const singular = ['sqrt', '1/x', 'log', 'ln'];
    for (const s of singular) {
      if (funcStr.includes(s) && a === 0) {
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

  getMethodHelp(method) {
    const help = {
      simpson: {
        title: 'Метод Симпсона (парабол)',
        description: 'Метод, основанный на аппроксимации подынтегральной функции параболами. Имеет 4-й порядок точности.',
        when: 'рекомендуется для гладких функций, когда требуется высокая точность',
        formula: '∫f(x)dx ≈ h/3·(f(a)+f(b)+4·∑f(x_{нечёт})+2·∑f(x_{чёт}))'
      },
      trapezoidal: {
        title: 'Метод трапеций',
        description: 'Метод, аппроксимирующий площадь под кривой суммой площадей трапеций. Имеет 2-й порядок точности.',
        when: 'рекомендуется для функций, заданных таблично, или при наличии особенностей',
        formula: '∫f(x)dx ≈ h·((f(a)+f(b))/2 + ∑f(x_i))'
      },
      rectangles: {
        title: 'Метод прямоугольников',
        description: 'Метод, аппроксимирующий площадь под кривой суммой площадей прямоугольников.',
        when: 'рекомендуется для быстрой грубой оценки интеграла',
        formula: '∫f(x)dx ≈ h·∑f(x_i + h/2)'
      },
      'monte-carlo': {
        title: 'Метод Монте-Карло',
        description: 'Вероятностный метод, основанный на генерации случайных точек.',
        when: 'рекомендуется для многомерных интегралов или интегралов по сложным областям',
        formula: '∫f(x)dx ≈ (b-a)/N·∑f(x_i)'
      }
    };
    return help[method] || help.simpson;
  }
}

export default IntegrationMethodSelector;