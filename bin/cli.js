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
	.option("-l, --log", "Show server access log on stdout")
	.action((port, options) => {
		require(`${__dirname}/../server`)({port, log: options.log})
	})
	.on('--help', () => {
		console.log('  Example:');
		console.log();
		console.log('    $ publicify server 3000 --log');
		// console.log('    $ deploy exec async');
		console.log();
	})
	
cli
	.command('client <remotehost> <localhost>')
	.description('Proxy access for server to local')
	.option('-l, --log', 'Show access log on stdout')
	.action((remotehost, localhost, options) => {
		// console.log(remotehost, localhost)
		require(`${__dirname}/../client`)({remote: remotehost, local: localhost, log: options.log})
	})
	.on('--help', () => {
		console.log('  Example:');
		console.log();
		console.log('    $ publicify client ysk.im:3000 localhost:8000 --log');
		// console.log('    $ publicify client https://ysk.im:3000 https://localhost:8000 --log');
		console.log();
	})

cli.parse(process.argv)

if (!process.argv.slice(2).length) {
	cli.outputHelp()
}
