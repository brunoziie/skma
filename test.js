const { rules, schema } = require('./index.js');
const data = require('./data.js');

const validator = schema.create({
  name: schema.string(),
  age: schema.number([
    rules.when({ path: '$.name', value: 'bruno', rules: [rules.gt(10)] }),
  ]),
});

validator.validate(data).then((res) => console.log(JSON.stringify(res, 2)));
