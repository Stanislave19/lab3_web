import { readFileSync } from 'node:fs';
import { Command } from 'commander';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

function fail(message) {
  console.error(`Помилка: ${message}`);
  process.exit(1);
}

function loadData(filePath) {
  let text;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch {
    fail(`не вдалося прочитати файл «${filePath}»`);
  }

  try {
    return JSON.parse(text);
  } catch {
    fail(`файл «${filePath}» містить некоректний JSON`);
  }
}

function lineSum(item) {
  const discount = item.discount ?? 0;
  return item.price * item.count * (1 - discount / 100);
}

const program = new Command();

program
  .name('orders')
  .description('Програма для перегляду замовлення з JSON-файлу')
  .version(packageJson.version, '-V, --version', 'показати версію програми')
  .helpOption('-h, --help', 'показати довідку')
  .option('-f, --file <path>', 'шлях до JSON-файлу із замовленням', 'data.json');

const helpTitles = {
  'Usage:': 'Використання:',
  'Options:': 'Опції:',
  'Commands:': 'Команди:',
  'Arguments:': 'Аргументи:',
};

program.configureHelp({
  styleTitle: (title) => helpTitles[title] ?? title,
  styleUsage: (usage) => usage
    .replace('[options]', '[опції]')
    .replace('[command]', '[команда]'),
});

program.helpCommand('help [command]', 'показати довідку для команди');

program
  .command('list')
  .description('показати стислий список позицій замовлення')
  .option('-l, --limit <number>', 'показати лише перші N позицій')
  .action((options) => {
    const data = loadData(program.opts().file);
    let items = data.items;

    if (options.limit) {
      const limit = Number(options.limit);
      if (!Number.isInteger(limit) || limit < 1) {
        fail('значення --limit має бути цілим числом більшим за 0');
      }
      items = items.slice(0, limit);
    }

    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`);
    });
  });

program
  .command('item')
  .description('показати одну позицію замовлення повністю')
  .argument('<number>', 'номер позиції у списку, починаючи з 1')
  .action((number) => {
    const data = loadData(program.opts().file);
    const item = data.items[Number(number) - 1];

    if (!item) {
      fail(`позицію «${number}» не знайдено, номер має бути від 1 до ${data.items.length}`);
    }

    console.log(JSON.stringify(item, null, 2));
  });

program
  .command('get')
  .description('показати значення окремого поля, зокрема вкладеного')
  .argument('<path>', 'шлях до поля через крапку, наприклад delivery.office.address або items.0.name')
  .action((path) => {
    const data = loadData(program.opts().file);
    let value = data;

    for (const key of path.split('.')) {
      value = value?.[key];
      if (value === undefined) {
        fail(`поля «${path}» не існує`);
      }
    }

    console.log(JSON.stringify(value, null, 2));
  });

program
  .command('items')
  .description('показати позиції замовлення із сумою за кожну')
  .option('-s, --sort', 'сортувати за сумою позиції')
  .option('-d, --desc', 'сортувати у зворотному порядку')
  .action((options) => {
    const data = loadData(program.opts().file);
    const items = data.items;

    if (options.sort) {
      items.sort((a, b) => lineSum(a) - lineSum(b));
    }
    if (options.desc) {
      items.reverse();
    }

    items.forEach((item) => {
      const discount = item.discount ?? 0;
      console.log(`${item.name}: ${item.price} × ${item.count}, знижка ${discount}%, сума ${lineSum(item).toFixed(2)} грн`);
    });
  });

program.parse();