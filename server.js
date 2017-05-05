const rq = require('request')
const iostream = require('socket.io-stream')
const http = require('http')
const fs = require('fs')
const shortid = require('shortid')
const colors = require('colors')
const now = require(`${__dirname}/util/now`)
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

const ipValue = (ipaddr) => {
	if (ipaddr == 'unknown') return ipaddr
	return (ipaddr.match(/.+:(.*?)$/) || [null, ipaddr])[1]
}

module.exports = ({port, log}) => {

	const app = http.createServer((req, res) => {
		
		const requestIp = [ipValue(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown')]
			.map(ip => ip == '1' ? '127.0.0.1' : ip)[0]
		const _ip = colors.blue(`"${requestIp}"`)
		const _request = colors.cyan(`"${req.method} ${req.url}"`)
		if (log) console.log(`[${now()}] ${_ip} ${_request} "${req.headers['user-agent']}"`)
		
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
				const errorText = `Server received an error from client`
				console.error(`[${now()}] ${colors.red(errorTitle)} ${errorText}`)
				render({
					title: errorTitle,
					text: `<span style='color: red'>${errorTitle}</span><br />${errorText}.`,
					res
				})
				return
			}
			res.writeHead(data.statusCode, data.headers)
			stream.pipe(res)
		})
		
		const requestStream = iostream.createStream()
		iostream(sockets.primary).emit('request', requestStream, {url: req.url,  method: req.method, headers: req.headers, requestIp, emitTarget})
		req.pipe(requestStream)
		
	})

	const _port = port || 3000
	const server = app.listen(_port, () => {
		console.log(`Publicify server has started.\nNow it's listening on port ${colors.cyan(_port)}`)
	})
	const io = require('socket.io').listen(server)

	io.on('connect', socket => {
		const clientIp = (socket.conn.remoteAddress.match(/.+:(.*?)$/) || [null, socket.conn.remoteAddress])[1]
		if (!sockets.primary) {
			socket.on('disconnect', () => {
				console.log(`[${now()}] Client disconnected.`)
				sockets.primary = null
			})
			sockets.primary = socket
			console.log(`[${now()}] Client connected from ${colors.cyan(clientIp)}`)
		} else {
			socket.disconnect()
			console.log(`[${now()}] Client had tried to connect from ${colors.red(clientIp)}, but disconnected by server while a connection already exists`)
		}
	})

}
