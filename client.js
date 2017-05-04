const rq = require('request')
const iostream = require('socket.io-stream')
const ioclient = require('socket.io-client')

module.exports = (remote, local) => {
	
	const client = ioclient(`http://${remote}`)

	client.on('connect', () => {
		console.log('connected')
	})

	client.on('disconnect', () => {
		console.log('disconnected')
	})

	iostream(client).on('request', (stream, data) => {
		// data.headers.host = local.replace(/https?:\/\//, '')
		const requestStream = stream.pipe(rq(Object.assign(data, {
			url: `http://${local}${data.url}`
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
