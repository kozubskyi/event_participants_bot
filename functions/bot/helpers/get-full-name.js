module.exports = function getFullName(ctx) {
	const firstName = ctx.from.first_name
	const lastName = ctx.from.last_name
	const username = ctx.from.username

	const fullName = `${firstName ? firstName : ''}${lastName ? ` ${lastName}` : ''}${
		!firstName && !lastName ? username : ''
	}`.trim()

	return fullName
}
