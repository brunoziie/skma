const { rule } = require('./constructor');
const { get } = require('lodash');

const rules = {};
const ruleCtors = {};

function setRule(name, ruleExec) {
  rules[name] = function ({ root, path, value, errors }, params) {
    function reporter(name, params) {
      return {
        error() {
          errors.push({ path, fail: ['rule', name, ...params], value });
        },
      };
    }

    const helpers = {
      getPathValue(path, fallback = null) {
        const _path = path.replace(/^(\$\.)(.*)$/, '$2');
        const _root = path !== _path ? root : value;
        return get(_root, _path, fallback);
      },

      async execRule(name, params) {
        await getRule(name).execute(
          { root, path, value, helpers: this, reporter: reporter(name, params) },
          params
        );
      },
    };

    return ruleExec(
      { root, path, value, helpers, reporter: reporter(name, params) },
      params
    );
  };

  rules[name].execute = ruleExec;
  ruleCtors[name] = rule(name);
}

function getRule(name) {
  return rules[name];
}

setRule('gt', (ctx, params) => {
  const { value, reporter } = ctx;

  if (value <= params[0]) {
    reporter.error();
  }
});
setRule('exists', async (ctx, params) => {
  const { value, reporter } = ctx;
  const [props] = params;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  reporter.error();
});

setRule('when', async (ctx, params) => {
  const { helpers } = ctx;

  for (let _case of params) {
    const { path, value, rules } = _case;
    const pathValue = helpers.getPathValue(path);

    if (pathValue === value) {
      for (let rule of rules) {
        const { name, params } = rule;
        await helpers.execRule(name, params);
      }
    }
  }
});

module.exports = {
  getRule,
  setRule,
  rules: ruleCtors,
};
