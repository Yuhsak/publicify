const rq = require('request')
const iostream = require('socket.io-stream')
const ioclient = require('socket.io-client')
const colors = require('colors')
const now = require(`${__dirname}/util/now`)

module.exports = ({remote, local, log, pass, index}) => {
	
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
		client.once('authResult', data => {
			if (data.success) {
				console.log(`[${now()}] Connected. Proxying ${colors.cyan(hosts.remote.url)} => ${colors.cyan(hosts.local.url)}`)
			} else {
				console.log(`[${now()}] ${colors.red('Invalid clientPass')}`)
			}
		})
		client.emit('auth', {pass})
	})

	client.on('disconnect', () => {
		console.log(`[${now()}] Disconnected from ${colors.red(hosts.remote.url)}`)
	})

	iostream(client).on('request', (stream, data) => {
		if (hosts.local.isSSL) {
			data.headers.host = hosts.local.url.replace(startsWithProtocol, '')
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
		}
		const responseStream = iostream.createStream()
		const path = data.url
		const realPath = index ? data.url.replace(/\/$/, `/${index}`) : data.url
		const requestStream = stream.pipe(rq(Object.assign(data, {
			url: `${hosts.local.url}${realPath}`
		})))
		.on('response', response => {
			const statusColor = [
				{re: /^1/, color: 'green'},
				{re: /^2/, color: 'cyan'},
				{re: /^3/, color: 'yellow'},
				{re: /^4/, color: 'red'},
				{re: /^5/, color: 'magenta'}
			].map(item => Object.assign(item, {matched: item.re.test(response.statusCode)})).find(item => item.matched).color
			if (log) console.log(`[${now()}] "${colors.blue(data.requestIp)}" ${colors[statusColor]('"'+data.method+' '+path+' '+response.statusCode+' '+response.statusMessage+'"')} "${data.headers['user-agent']}"`)
			iostream(client).emit(data.emitTarget, responseStream, response.toJSON(), {error: false})
			requestStream.pipe(responseStream)
		})
		.on('error', err => {
			console.error(`[${now()}] ${colors.red('Error: '+err.code+'.')} ${colors.red(data.url)} doesn't seem to be accessible`)
			iostream(client).emit(data.emitTarget, responseStream, null, {error: true, errorCode: err.code})
			requestStream.pipe(responseStream).end()
		})
	})

	process.on('SIGINT', () => {
		client.disconnect()
	})

}
