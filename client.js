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
		console.log(`Connected. Proxying ${hosts.remote.url} => ${hosts.local.url}`)
	})

	client.on('disconnect', () => {
		console.log(`Disconnected from ${hosts.remote.url}`)
	})

	iostream(client).on('request', (stream, data) => {
		if (hosts.local.isSSL) {
			data.headers.host = hosts.local.url.replace(startsWithProtocol, '')
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
		}
		const responseStream = iostream.createStream()
		const targetUrl = `${hosts.local.url}${data.url}`
		const requestStream = stream.pipe(rq(Object.assign(data, {
			url: targetUrl
		})))
		.on('response', response => {
			iostream(client).emit(data.emitTarget, responseStream, response.toJSON(), {error: false})
			requestStream.pipe(responseStream)
		})
		.on('error', err => {
			console.error(`Error: ${err.code}. ${targetUrl} doesn't seem to be accessible.`)
			iostream(client).emit(data.emitTarget, responseStream, null, {error: true, errorCode: err.code})
			requestStream.pipe(responseStream).end()
		})
	})

	process.on('SIGINT', () => {
		client.disconnect()
	})

}
