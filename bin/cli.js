#!/usr/bin/env node

const cli = require('commander')

cli
	.version(require(`${__dirname}/../package.json`).version)
	.on('--help', () => {
		console.log('  Examples:');
		console.log();
		console.log('    $ publicify server 3000');
		console.log('    $ publicify client ysk.im:3000 localhost:8000');
		console.log();
	})

cli
	.command('server <port>')
	.description('Starts the remote server')
	.option("-b, --basicAuth <username:password>", "Set basic authentication", val => {const b = val.split(':'); return {user:b[0],pass:b[1]}})
	.option("-c, --clientAuth <username:password>", "Set basic authentication for publicify client", val => {const b = val.split(':'); return {user:b[0],pass:b[1]}})
	.option("-l, --log", "Show server access log on stdout")
	.action((port, options) => {
		require(`${__dirname}/../server`)({
			port,
			log: options.log,
			clientAuth: options.clientAuth,
			basicAuth: options.basicAuth
		})
	})
	.on('--help', () => {
		console.log('  Examples:');
		console.log();
		console.log('    $ publicify server 3000 --basicAuth testuser:testpass');
		console.log('    $ publicify server 3000 --clientAuth clientuser:clientpass');
		console.log('    $ publicify server 3000 --log');
		console.log();
	})
	
cli
	.command('client <remotehost> <localhost>')
	.description('Proxy access for server to local')
	.option('-i, --indexFile <file>', 'Set index file when access to /')
	.option('-c, --clientAuth <username:password>', 'Set basic authentication')
	.option('-l, --log', 'Show access log on stdout')
	.action((remotehost, localhost, options) => {
		require(`${__dirname}/../client`)({
			remote: remotehost,
			local: localhost,
			log: options.log,
			clientAuth: options.clientAuth,
			index: options.indexFile
		})
	})
	.on('--help', () => {
		console.log('  Examples:');
		console.log();
		console.log('    $ publicify client ysk.im:3000 localhost:8000 --indexFile mypage.html');
		console.log('    $ publicify client ysk.im:3000 localhost:8000 --clientAuth clientuser:clientpass');
		console.log('    $ publicify client ysk.im:3000 localhost:8000 --log');
		console.log();
	})

cli.parse(process.argv)

if (!process.argv.slice(2).length) {
	cli.outputHelp()
}
