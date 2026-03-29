const path = require('path');

module.exports = {
  '*.{js,cjs,mjs,ts,tsx,json,md,yml,yaml}': ['prettier --write'],
  '*.{ts,tsx}': (filenames) => {
    const cwd = process.cwd();
    const relative = filenames.map((f) => path.relative(cwd, f));
    return `eslint --max-warnings 0 --no-warn-ignored --fix ${relative.join(' ')}`;
  },
};
