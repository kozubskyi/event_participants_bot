module.exports = function getFullName(ctx) {
	const firstName = ctx.from.first_name
	const lastName = ctx.from.last_name
	const fullName = `${firstName ? firstName : ''}${lastName ? ` ${lastName}` : ''}`.trim()

	return fullName
}
