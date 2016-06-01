module.exports = {
    "extends": "airbnb",
    "plugins": [
        //"react"
    ],
    "rules": {
      "valid-jsdoc": "error",
      // use this for private methods (even facebook do it)
      "no-underscore-dangle": 0,
      "prefer-template": 0,

      // it temporary - waiting to node support modules natively
      "strict": [0, "global"],
    },
    "globals": {
      "after": false,
      "afterEach": false,
      "before": false,
      "beforeEach": false,
      "describe": false,
      "it": false,
      "require": false,
      "context": false
    },
};
