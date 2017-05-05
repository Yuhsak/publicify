const moment = require('moment')

module.exports = () => {
	return moment().format('ddd MMM DD YYYY kk:mm:ss.SSS Z')
}
