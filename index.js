import { readFileSync } from 'node:fs';
import { Command } from 'commander';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

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
  'Global Options:': 'Глобальні опції:',
};

program.configureHelp({
  styleTitle: (title) => helpTitles[title] ?? title,
  styleUsage: (usage) => usage
    .replace('[options]', '[опції]')
    .replace('[command]', '[команда]'),
});

program.parse();

// тимчасово, для перевірки
const data = loadData(program.opts().file);
console.log(data.order_id);