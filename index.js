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

program.parse();