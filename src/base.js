'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')

class BaseStrategy {
  static disconnect () {
    return Promise.resolve()
  }

  constructor (options) {
    this.directory = options.directory
    delete options.directory

    this.options = options
    this.methods = {
      begin: this.createTxnMethod('begin'),
      commit: this.createTxnMethod('commit'),
      rollback: this.createTxnMethod('rollback')
    }
  }

  get url () {
    if (this.options.connectionString) return this.options.connectionString
    const host = this.options.host || process.env.PGHOST
    const port = this.options.port || process.env.PGPORT
    const user = this.options.user || process.env.PGUSER
    const database = this.options.database || process.env.PGDATABASE
    return `postgres://${user}@${host}:${port}/${database}`
  }

  disconnect () {
    return Promise.resolve()
  }

  hasMethod (name) {
    return name in this.methods
  }

  create (name) {
    var text
    var source
    try {
      source = path.join(this.directory, name + '.sql')
      text = fs.readFileSync(source, 'utf8')
    } catch (e) {
      return undefined
    }

    const meta = {source}
    this.extractMetaData(text, meta)

    const fn = this.createMethod(name, meta, text)
    this.methods[name] = fn
    return this.methods[name]
  }

  extractMetaData (text, meta) {
    const pattern = /^--\*\s+(\w+)\s+(\w+)/g

    var match
    while ((match = pattern.exec(text)) !== null) {
      meta[match[1]] = match[2]
    }

    return meta
  }

  desc (options) {
    return Object.assign({url: this.url}, options)
  }

  genId () {
    return Promise.fromCallback(cb => crypto.randomBytes(3, cb)).then(buf =>
      buf.toString('hex')
    )
  }

  createLogQueryFn (meta) {
    const data = Object.assign({}, meta)
    return (id, elapsed, args) => {
      data['connection-id'] = id
      data.ms = elapsed()
      data.arguments = args.map(
        p => (Buffer.isBuffer(p) ? '\\x' + p.toString('hex') : p)
      )
      this.log.info('query', data)
    }
  }
}

module.exports = BaseStrategy
