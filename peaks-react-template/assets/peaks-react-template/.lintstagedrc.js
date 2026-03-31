module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --cache'],
  '*.{css,less,scss}': ['prettier --write'],
  '*.{md,json}': ['prettier --write'],
};