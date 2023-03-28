class State {
	constructor() {
		this.actions = {}
		this.subscriptions = []
		this.history = []
	}

	subscribe = function (context, action, callback) {
		this.subscriptions[action] = this.subscriptions[action] || []
		this.subscriptions[action].push(function (data) {
			callback.apply(context, data)
		})
	}

	dispatch = function (action, data) {
		if (!Array.isArray(data)) {
			data = [data]
		} else if (Array.isArray(data)) {
			data = data || []
		}

		this.history.push([action, data])

		if ('function' === typeof this[action]) {
			this[action].apply(this, data)
		}

		data.push(action)
		data.push(this)

		this.subscriptions[action] = this.subscriptions[action] || []
		this.subscriptions[action].forEach(function (subscription) {
			subscription(data)
		})
	}
}

const store = new State()

store.domain = null
store.domainMinBid = null
store.activeScreen = null
store.localeDict = null
store.locale = null
store.domainStatus = null
store.isTestnet = window.location.href.indexOf('testnet=true') > -1
store.wallet = null
store.walletsList = null

store.setStatus = function (status) {
	this.domainStatus = status
}

store.setDomain = function (name) {
	this.domain = name
}

store.setDomainMinBid = function (minBid) {
	this.domainMinBid = minBid
}

store.setLocale = function (locale) {
	this.locale = locale
}

store.setLocaleDict = function (dict) {
	this.localeDict = dict
}

store.setTheme = function (theme) {
	this.theme = theme
}

