// eslint.config.js
import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: true,
  stylistic: {
    semi: true,
  },
  rules: {
    'antfu/if-newline': ['off'],
  },
});
