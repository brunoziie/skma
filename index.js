const { get, set } = require('lodash');

const types = ['string', 'number', 'boolean'].reduce((acc, cur) => {
  acc[cur] = (val) => typeof val === cur;
  return acc;
}, {});

types.object = (val) => typeof val === 'object' && val !== null && !Array.isArray(val);
types.array = (val) => Array.isArray(val);

const rules = {};

function setRule(name, ruleExec) {
  rules[name] = function ({ root, path, value, errors, payload }, params) {
    function reporter (name, params) {
      return {
        error () {
          errors.push({ path, fail: ['rule', name, ... params], value });
        }
      }
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

    return ruleExec({ root, path, value, helpers, reporter: reporter(name) }, params);
  };

  rules[name].execute = ruleExec;
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
})

async function validateValue(form, path, attrs, value, payload, errors) {
  if (attrs.nullable) {
    if (value === null) {
      set(payload, path, value);
      return;
    }
  } else {
    if (value === null) {
      errors.push({
        path,
        fail: ['presence', 'null'],
        value,
      });
      return;
    }
  }

  if (attrs.required && typeof value === 'undefined') {
    errors.push({
      path,
      fail: ['presence', 'required'],
      value,
    });
    return;
  }

  if (!types[attrs.type](value)) {
    errors.push({
      path,
      fail: ['type', attrs.type],
      value,
    });

    return;
  } else {
    if (!['object', 'array'].includes(attrs.type)) {
      set(payload, path, value);
    } else {
      if (attrs.type === 'object') {
        set(payload, path, {});
      } else {
        set(payload, path, []);
      }
    }
  }

  if (attrs.rules && Array.isArray(attrs.rules)) {
    for (let rule of attrs.rules) {
      const { name, params } = rule;
      const execRule = getRule(name);

      if (execRule) {
        await execRule({ root: form, path: path.join('.'), value, errors, payload }, params);
      }
    }
  }

  if (attrs.type === 'array' && attrs.nested) {
    for (let x = 0, len = value.length; x < len; x += 1) {
      const curPath = [path, x].join('.');
      await validateValue(
        form,
        curPath,
        attrs.nested,
        get(form, curPath),
        payload,
        errors
      );
    }
  }

  if (attrs.type === 'object' && attrs.nested) {
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        const curPath = [path, key].join('.');
        const value = get(form, curPath);
        const oAttrs = attrs.nested[key];

        await validateValue(form, curPath, oAttrs, value, payload, errors);
      }
    }
  }
}

async function validate(schema, form) {
  const payload = {};
  const errors = [];

  for (let key in schema) {
    if (schema.hasOwnProperty(key)) {
      const path = key;
      const value = get(form, path);
      const attrs = schema[key];

      await validateValue(form, [key], attrs, value, payload, errors);
    }
  }

  return {
    errors,
    payload,
  };
}

module.exports = validate;
