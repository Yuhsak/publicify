const rq = require('request')
const iostream = require('socket.io-stream')
const http = require('http')
const fs = require('fs')
const shortid = require('shortid')
const sockets = {}

const render = ({statusCode=503, title, text, res}={}) => {
	const template = fs.readFileSync(`${__dirname}/template.html`, 'utf-8')
	const _title = `Publicify | ${title ? title : http.STATUS_CODES[statusCode]}`
	const _text = text ? text : `${statusCode} ${http.STATUS_CODES[statusCode]}`
	const view = template.replace('{title}', _title).replace('{text}', _text)
	res.writeHead(statusCode, http.STATUS_CODES[statusCode], {'Content-Type': 'text/html'})
	res.end(view)
	return
}

module.exports = (port) => {

	const app = http.createServer((req, res) => {
		
		console.log(req.headers)
		console.log('-----')
		const ip = req.headers['x-forwarded-for'] || 
					req.connection.remoteAddress || 
					req.socket.remoteAddress ||
					req.connection.socket.remoteAddress
		console.log(ip)
		console.log('-----')
		console.log(req.headers['x-forwarded-for'])
		console.log(req.connection.remoteAddress)
		console.log(req.socket.remoteAddress)
		console.log(req.connection.socket.remoteAddress)
		console.log('-----')
		console.log(`${req.connection.remoteAddress} ${req.method} ${req.url} ${req.headers['user-agent']}`)
		
		if (!sockets.primary) {
			render({
				title: 'Welcome to Publicify!',
				text: 'Oops, there is no client connected yet.',
				res
			})
			return
		}
		
		const emitTarget = shortid.generate()
		iostream(sockets.primary).once(emitTarget, (stream, data, param) => {
			if (param.error) {
				const errorTitle = `Error: ${param.errorCode}.`
				const errorText = `Server received an error from client.`
				console.log(`${errorTitle} ${errorText}`)
				render({
					title: errorTitle,
					text: `${errorTitle}<br />${errorText}`,
					res
				})
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
			const clientIp = (socket.conn.remoteAddress.match(/.+:(.*?)$/) || [null, socket.conn.remoteAddress])[1]
			console.log(`Client connected from ${clientIp}.`)
		} else {
			socket.disconnect()
			console.log('Client had tried to connect, but disconnected by server while a connection already exists.')
		}
	})

}
