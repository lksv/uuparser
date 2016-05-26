'use strict';

const grammar = require('./src/grammar');
const parser = require('./src/parser');

module.exports = Object.assign({}, grammar, parser);
