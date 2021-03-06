const { EventEmitter } = require('events')
const crypto = require('crypto')

class Session extends EventEmitter {
  constructor (webserver, remoteAddress, secure) {
    super()
    this.webserver = webserver
    this.id = `${Math.floor(Date.now() / 1000).toString(16)}v${crypto.randomBytes(4).toString('hex')}`
    if (remoteAddress) {
      this.remoteAddress = (remoteAddress.startsWith('::ffff:')) ? remoteAddress.substr(7) : remoteAddress
    } else {
      this.remoteAddress = null
    }
    this.secure = secure
    this.startTime = Date.now()
    this.endTime = null
    this.bytesIn = 0
    this.bytesOut = 0
    this.clientCertificate = null
    this.streams = new Set()
    this.context = {}
  }

  process () {
    this.webserver.sessions.add(this)
    const params = {
      sessionId: this.id,
      remoteAddress: this.remoteAddress,
      secure: this.secure
    }
    if (this.clientCertificate && this.clientCertificate.subject.CN) {
      params.clientCertificate = this.clientCertificate.subject.CN
    }
    this.webserver.emit('log', 'session.start', params)
    this.webserver.emit('session', this)
  }

  close () {
    this.endTime = Date.now()
    this.webserver.sessions.delete(this)
    this.webserver.emit('log', 'session.end', {
      sessionId: this.id,
      duration: this.endTime - this.startTime,
      bytesIn: this.bytesIn,
      bytesOut: this.bytesOut
    })
    this.emit('close')
  }
}

module.exports = Session
