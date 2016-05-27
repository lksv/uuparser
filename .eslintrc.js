module.exports = {
    "extends": "airbnb",
    "plugins": [
        //"react"
    ],
    "rules": {
      "valid-jsdoc": "error",
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
