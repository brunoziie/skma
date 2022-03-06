module.exports.type = function (name) {
  const ctor = function (rules) {
    return {
      type: name,
      required: true,
      nullable: false,
      rules: rules || [],
    };
  };

  ctor.nullable = (rules) => {
    return {
      ...ctor(rules),
      nullable: true,
    };
  };

  ctor.optional = (rules) => {
    return {
      ...ctor(rules),
      required: false,
    };
  };

  ctor.nullableAndOptional = (rules) => {
    return {
      ...ctor(rules),
      required: false,
      nullable: true,
    };
  };

  return ctor;
};

module.exports.rule = function (name) {
  return function (...params) {
    return {
      name,
      params,
    };
  };
};
