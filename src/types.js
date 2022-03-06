const { type } = require('./constructor');
const typeCtors = {};

const types = ['string', 'number', 'boolean'].reduce((acc, cur) => {
  acc[cur] = (val) => typeof val === cur;
  typeCtors[cur] = type(cur);
  return acc;
}, {});

types.object = (val) => typeof val === 'object' && val !== null && !Array.isArray(val);
typeCtors.object = type('object');

types.array = (val) => Array.isArray(val);
typeCtors.array = type('array');

module.exports.types = typeCtors;
module.exports.validateType = (name, value) => {
  return types[name](value);
};
