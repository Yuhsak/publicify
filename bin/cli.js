const argv = require('optimist').argv
const command = argv._[0]

if (command == 'server') {
	const server = require(`${__dirname}/../server`)
	server(argv._[1])
} else if (command == 'client') {
	const client = require(`${__dirname}/../client`)
	client(argv._[1], argv._[2])
}
