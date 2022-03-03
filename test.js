const validate = require('./index.js');
const data = require('./data.js');

const schema = {
  name: {
    type: 'string',
    required: true,
    nullable: true,
    rules: [
      {
        name: 'equals',
        params: ['bruno'],
      },
      {
        name: 'len',
        params: [4],
      },
    ],
  },
  age: {
    type: 'number',
    required: true,
    nullable: false,
    rules: [
      {
        name: 'gt',
        params: [10],
      },
    ],
  },
  tags: {
    type: 'array',
    required: true,
    nullable: true,
    nested: {
      type: 'number',
      required: true,
      nullable: false,
      rules: [
        {
          name: 'gt',
          params: [10],
        },
      ],
    },
    rules: [],
  },
  props: {
    type: 'object',
    required: true,
    nullable: false,
    nested: {
      foo: {
        type: 'object',
        required: true,
        nullable: false,
        nested: {
          foo: {
            type: 'array',
            required: true,
            nullable: false,

            nested: {
              type: 'number',
              required: true,
              nullable: false,
              rules: [],
            },
          },
        },
      },
    },
  },
};

const simpleSchema = {
  table: {
    type: 'string',
    required: true,
    nullable: false,
  },

  id: {
    type: 'number',
    required: true,
    nullable: true,
    rules: [{
      name: 'when',
      params: [
       { path: '$.table', value: 'users', rules: [{ name: 'gt', params: [10] }] },
       { path: '$.table', value: 'categories', rules: [{ name: 'gt', params: [20] }] },
      ] 
    }]
  }
}

//validate(schema, data).then((res) => console.log(JSON.stringify(res, null, 2)));
validate(simpleSchema, { id: 10, table: 'categories' })
  .then((res) => console.log(JSON.stringify(res, null, 2)));
