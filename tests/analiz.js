(async function zapusk() {
  const rezultaty = {
    uravneniya: [],
    integraly: [],
    diffury: [],
    sistemy: [],
    vremya: new Date().toISOString()
  };

  function pauza(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function vyvod(tablica, nazvanie) {
    console.log(`\n=== ${nazvanie} ===`);
    console.table(tablica);
  }

  function sbratTablicuUravneniy() {
    const konteyner = document.getElementById('equation-results');
    if (!konteyner) return [];
    const tablica = konteyner.querySelector('table.comparison-table');
    if (!tablica) return [];
    const stroki = tablica.querySelectorAll('tbody tr');
    const dannye = [];
    for (const stroka of stroki) {
      const yacheyki = stroka.querySelectorAll('td');
      if (yacheyki.length < 6) continue;
      dannye.push({
        metod: yacheyki[0]?.innerText?.trim() || '',
        koren: parseFloat(yacheyki[1]?.innerText) || null,
        iteracii: parseInt(yacheyki[2]?.innerText) || null,
        nevyazka: parseFloat(yacheyki[3]?.innerText) || null,
        vremya: parseFloat(yacheyki[4]?.innerText) || null,
        status: yacheyki[5]?.innerText?.trim() || ''
      });
    }
    return dannye;
  }

  function sbratTablicuIntegralov() {
    const konteyner = document.getElementById('integration-results');
    if (!konteyner) return [];
    const tablica = konteyner.querySelector('table.comparison-table');
    if (!tablica) return [];
    const stroki = tablica.querySelectorAll('tbody tr');
    const dannye = [];
    for (const stroka of stroki) {
      const yacheyki = stroka.querySelectorAll('td');
      if (yacheyki.length < 7) continue;
      dannye.push({
        metod: yacheyki[0]?.innerText?.trim() || '',
        znachenie: parseFloat(yacheyki[1]?.innerText) || null,
        iteracii: parseInt(yacheyki[2]?.innerText) || null,
        n: parseInt(yacheyki[3]?.innerText) || null,
        pogreshnost: parseFloat(yacheyki[4]?.innerText) || null,
        vremya: parseFloat(yacheyki[5]?.innerText) || null,
        status: yacheyki[6]?.innerText?.trim() || ''
      });
    }
    return dannye;
  }

  function sbratTablicuDiffurov() {
    const konteyner = document.getElementById('differential-results');
    if (!konteyner) return [];
    const tablica = konteyner.querySelector('table.comparison-table');
    if (!tablica) return [];
    const stroki = tablica.querySelectorAll('tbody tr');
    const dannye = [];
    for (const stroka of stroki) {
      const yacheyki = stroka.querySelectorAll('td');
      if (yacheyki.length < 5) continue;
      dannye.push({
        metod: yacheyki[0]?.innerText?.trim() || '',
        y_end: parseFloat(yacheyki[1]?.innerText) || null,
        shagi: parseInt(yacheyki[2]?.innerText) || null,
        vremya: parseFloat(yacheyki[3]?.innerText) || null,
        status: yacheyki[4]?.innerText?.trim() || ''
      });
    }
    return dannye;
  }

  function sbratTablicuSystem() {
    const konteyner = document.getElementById('system-results');
    if (!konteyner) return [];
    const tablica = konteyner.querySelector('table.comparison-table');
    if (!tablica) return [];
    const stroki = tablica.querySelectorAll('tbody tr');
    const dannye = [];
    for (const stroka of stroki) {
      const yacheyki = stroka.querySelectorAll('td');
      if (yacheyki.length < 6) continue;
      dannye.push({
        metod: yacheyki[0]?.innerText?.trim() || '',
        reshenie: yacheyki[1]?.innerText?.trim() || '',
        iteracii: yacheyki[2]?.innerText === '-' ? null : parseInt(yacheyki[2]?.innerText),
        nevyazka: parseFloat(yacheyki[3]?.innerText) || null,
        vremya: parseFloat(yacheyki[4]?.innerText) || null,
        status: yacheyki[5]?.innerText?.trim() || ''
      });
    }
    return dannye;
  }

  async function testUravnenie(func) {
    const poleFunkcii = document.getElementById('equation-function');
    if (poleFunkcii) poleFunkcii.value = func;
    await pauza(200);
    const knopka = document.getElementById('compare-equation-methods');
    if (knopka) {
      knopka.click();
      await pauza(3000);
    }
    const dannye = sbratTablicuUravneniy();
    vyvod(dannye, `УРАВНЕНИЕ: ${func}`);
    return { funkciya: func, dannye };
  }

  async function testIntegral(func, a, b) {
    const poleFunkcii = document.getElementById('integration-function');
    if (poleFunkcii) poleFunkcii.value = func;
    const poleA = document.getElementById('integration-a');
    if (poleA) poleA.value = a;
    const poleB = document.getElementById('integration-b');
    if (poleB) poleB.value = b;
    await pauza(200);
    const knopka = document.getElementById('compare-integration-methods');
    if (knopka) {
      knopka.click();
      await pauza(4000);
    }
    const dannye = sbratTablicuIntegralov();
    vyvod(dannye, `ИНТЕГРАЛ: ${func} на [${a}, ${b}]`);
    return { funkciya: func, a, b, dannye };
  }

  async function testDiffur(uravnenie, x0, y0, konec) {
    const poleUravneniya = document.getElementById('diff-equation');
    if (poleUravneniya) poleUravneniya.value = uravnenie;
    const poleX0 = document.getElementById('diff-x0');
    if (poleX0) poleX0.value = x0;
    const poleY0 = document.getElementById('diff-y0');
    if (poleY0) poleY0.value = y0;
    const poleKonec = document.getElementById('diff-end');
    if (poleKonec) poleKonec.value = konec;
    const poleShag = document.getElementById('diff-step');
    if (poleShag) poleShag.value = '0.1';
    await pauza(200);
    const knopka = document.getElementById('compare-diff-methods');
    if (knopka) {
      knopka.click();
      await pauza(3000);
    }
    const dannye = sbratTablicuDiffurov();
    vyvod(dannye, `ДИФФУР: y' = ${uravnenie}, y(${x0})=${y0}, до ${konec}`);
    return { uravnenie, x0, y0, konec, dannye };
  }

  async function testSistema(uravneniya) {
    const poleKolichestva = document.getElementById('system-count');
    if (poleKolichestva) {
      poleKolichestva.value = uravneniya.length;
      poleKolichestva.dispatchEvent(new Event('change'));
    }
    await pauza(300);
    const polya = document.querySelectorAll('.system-eq');
    for (let i = 0; i < uravneniya.length && i < polya.length; i++) {
      polya[i].value = uravneniya[i];
    }
    await pauza(200);
    const knopka = document.getElementById('compare-system-methods');
    if (knopka) {
      knopka.click();
      await pauza(3000);
    }
    const dannye = sbratTablicuSystem();
    vyvod(dannye, `СИСТЕМА: ${uravneniya.join(', ')}`);
    return { uravneniya, dannye };
  }

  console.log('=== ЗАПУСК АВТОМАТИЧЕСКОГО ТЕСТИРОВАНИЯ ===');
  console.log('результаты будут появляться по мере выполнения\n');

  // 1. уравнения
  console.log('\n=== 1. УРАВНЕНИЯ ===');
  const testyUravneniy = [
    'x^2 - 4',
    'x^3 - 6*x^2 + 11*x - 6',
    '(x-2)^3',
    'exp(x) - 2',
    'x*cos(x)',
    'x^5 - 5*x^4 + 10*x^3 - 10*x^2 + 5*x - 1',
    'sin(x) - 0.5',
    'ln(x) - 1',
    '1/x - 1'
  ];

  for (const func of testyUravneniy) {
    console.log(`\nтест: ${func}`);
    const rez = await testUravnenie(func);
    rezultaty.uravneniya.push(rez);
    await pauza(500);
  }

  // 2. интегралы
  console.log('\n=== 2. ИНТЕГРАЛЫ ===');
  const testyIntegralov = [
    { func: 'x^2', a: 0, b: 1 },
    { func: 'sin(x)', a: 0, b: Math.PI },
    { func: 'exp(x)', a: 0, b: 1 },
    { func: '1/x', a: 1, b: 2 },
    { func: 'x^5', a: 0, b: 1 },
    { func: 'sqrt(x)', a: 0, b: 1 },
    { func: 'cos(x)^2', a: 0, b: Math.PI },
    { func: 'x*exp(-x^2)', a: 0, b: 2 }
  ];

  for (const test of testyIntegralov) {
    console.log(`\nтест: ${test.func} на [${test.a}, ${test.b}]`);
    const rez = await testIntegral(test.func, test.a, test.b);
    rezultaty.integraly.push(rez);
    await pauza(500);
  }

  // 3. диффуры
  console.log('\n=== 3. ДИФФУРЫ ===');
  const testyDiffurov = [
    { uravnenie: 'y', x0: 0, y0: 1, konec: 1 },
    { uravnenie: 'x', x0: 0, y0: 0, konec: 1 },
    { uravnenie: '2*x', x0: 0, y0: 0, konec: 1 },
    { uravnenie: 'sin(x)', x0: 0, y0: 0, konec: Math.PI },
    { uravnenie: 'y*cos(x)', x0: 0, y0: 1, konec: Math.PI/2 },
    { uravnenie: 'x*y', x0: 0, y0: 1, konec: 1 }
  ];

  for (const test of testyDiffurov) {
    console.log(`\nтест: y' = ${test.uravnenie}`);
    const rez = await testDiffur(test.uravnenie, test.x0, test.y0, test.konec);
    rezultaty.diffury.push(rez);
    await pauza(500);
  }

  // 4. системы
  console.log('\n=== 4. СИСТЕМЫ ===');
  const testySystem = [
    { uravneniya: ['2*x + y = 5', 'x + 2*y = 4'] },
    { uravneniya: ['4*x + y = 9', 'x + 5*y = 8'] },
    { uravneniya: ['x + 2*y + 3*z = 14', '2*x + y + 2*z = 10', '3*x + 2*y + z = 10'] },
    { uravneniya: ['10*x + y = 11', 'x + 10*y = 11'] },
    { uravneniya: ['x + 2*y = 5', '3*x + 4*y = 11'] }
  ];

  for (const test of testySystem) {
    console.log(`\nтест: ${test.uravneniya.join(', ')}`);
    const rez = await testSistema(test.uravneniya);
    rezultaty.sistemy.push(rez);
    await pauza(500);
  }

  console.log('\n=== ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ ===');
  console.log('полные результаты в формате JSON:');
  console.log(JSON.stringify(rezultaty, null, 2));
})();