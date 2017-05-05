const rq = require('request')
const iostream = require('socket.io-stream')
const ioclient = require('socket.io-client')

module.exports = (remote, local) => {
	
	const startsWithProtocol = new RegExp(/^https?:\/\//)
	const isSSL = new RegExp(/^https/)
	
	const hosts = {remote, local}
	Object.keys(hosts).forEach(key => {
		hosts[key] = {
			url: startsWithProtocol.test(hosts[key]) ? hosts[key] : `http://${hosts[key]}`,
			isSSL: isSSL.test(hosts[key])
		}
	})
	
	const client = ioclient(hosts.remote.url)

	client.on('connect', () => {
		console.log('connected')
	})

	client.on('disconnect', () => {
		console.log('disconnected')
	})

	iostream(client).on('request', (stream, data) => {
		if (hosts.local.isSSL) {
			data.headers.host = hosts.local.url.replace(startsWithProtocol, '')
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
		}
		const requestStream = stream.pipe(rq(Object.assign(data, {
			url: `${hosts.local.url}${data.url}`
		})))
		const responseStream = iostream.createStream()
		requestStream.on('response', response => {
			iostream(client).emit(data.emitTarget, responseStream, response.toJSON())
			requestStream.pipe(responseStream)
		})
	})

	process.on('SIGINT', () => {
		client.disconnect()
	})

}
