
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./class-fixtures-factory.cjs.production.min.js')
} else {
  module.exports = require('./class-fixtures-factory.cjs.development.js')
}
