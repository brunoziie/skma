const { types, validateType } = require('./types');
const { getRule, setRule, rules } = require('./rules');
const { get, set } = require('lodash');

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

  if (!validateType(attrs.type, value)) {
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
        await execRule(
          { root: form, path: path.join('.'), value, errors, payload },
          params
        );
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

function create(definition) {
  return {
    validate(data) {
      return validate(definition, data);
    },
  };
}

module.exports = {
  schema: {
    create,
    ...types,
  },
  rules,
  rule: setRule,
};
