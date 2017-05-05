const rq = require('request')
const iostream = require('socket.io-stream')
const http = require('http')
const fs = require('fs')
const shortid = require('shortid')
const sockets = {}

module.exports = (port) => {

	const app = http.createServer((req, res) => {
		
		if (!sockets.primary) {
			res.statusCode = 404
			res.statusMessage = http.STATUS_CODES[res.statusCode]
			fs.createReadStream(`${__dirname}/noclient.html`).pipe(res)
			return
		}
		
		const emitTarget = shortid.generate()
		iostream(sockets.primary).once(emitTarget, (stream, data, param) => {
			if (param.error) {
				console.log(`Error: ${param.errorCode}. Server received error response from client.`)
				res.statusCode = 404
				res.statusMessage = http.STATUS_CODES[res.statusCode]
				res.end('Client error')
				return
			}
			res.writeHead(data.statusCode, data.headers)
			stream.pipe(res)
		})
		
		const requestStream = iostream.createStream()
		iostream(sockets.primary).emit('request', requestStream, {url: req.url,  method: req.method, headers: req.headers, emitTarget})
		req.pipe(requestStream)
		
	})

	const _port = port || 3000
	const server = app.listen(_port, () => {
		console.log(`Publicify server has started.\nNow it's listening on port ${_port}.`)
	})
	const io = require('socket.io').listen(server)

	io.on('connect', socket => {
		if (!sockets.primary) {
			socket.on('disconnect', () => {
				console.log('Client disconnected.')
				sockets.primary = null
			})
			sockets.primary = socket
			console.log('Client connected.')
		} else {
			socket.disconnect()
			console.log('Client had tried to connect, but disconnected by server while a connection already exists.')
		}
	})

}
