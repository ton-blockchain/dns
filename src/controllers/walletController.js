class WalletController {
	constructor(props) {
		this.store = props.store
		this.store.subscribe(this, 'setWallet', (wallet) =>
			this.store.setWallet(wallet)
		)
		this.store.subscribe(
			this,
			'setWalletsList',
			({ walletsList, embeddedWallet }) => {
				this.store.setWalletsList({ walletsList, embeddedWallet })
			}
		)

		this.choosenWallet = null

		this.connectButton = document.getElementById(CONNECT_WALLET_ID)
		this.connectButtonMobile = document.getElementById(CONNECT_WALLET_MOBILE_ID)

		this.renderLoginButton()
		this.connector = new TonConnectSDK.TonConnect()
		this.unsubscribe = this.connector.onStatusChange((wallet) => {
			this.store.dispatch('setWallet', wallet)
			this.renderLoginButton()

			if (wallet) {
				this.handleWalletModalClose()
			}
		}, console.error)

		this.connector.restoreConnection().then(() => this.init())
	}

	async init() {
		this.renderLoginButton()

		await this.getWalletsList()

		if (
			isMobile() &&
			this.walletsList.embeddedWallet &&
			!this.connector.connected
		) {
			this.connector.connect({
				jsBridgeKey: this.walletsList.embeddedWallet.jsBridgeKey,
			})
			return
		}
	}

	async getWalletsList() {
		const walletsList = await this.connector.getWallets()

		const embeddedWallet = walletsList
			.filter(TonConnectSDK.isWalletInfoInjected)
			.find((wallet) => wallet.embedded)

		this.store.dispatch('setWalletsList', { walletsList, embeddedWallet })
		this.walletsList = { walletsList, embeddedWallet }

		return {
			walletsList,
			embeddedWallet,
		}
	}

	async login() {
		const walletsList = this.walletsList.walletsList
		const currentWallet = walletsList.find(
			(wallet) => wallet.name === this.choosenWallet
		)

		const tonkeeperConnectionSource = {
			universalLink: currentWallet.universalLink,
			bridgeUrl: currentWallet.bridgeUrl,
		}

		const unversalLink = await this.connector.connect(tonkeeperConnectionSource)

		if (isMobile()) {
			window.open(unversalLink, '_self', 'noreferrer noopener')
		} else {
			this.renderSecondStep(unversalLink)
		}
	}

	logout() {
		this.connector.disconnect()
	}

	renderLoginButton() {
		const isConnected = !!this.store.wallet
		const textContent = isMobile() ? 'Connect' : 'Connect wallet'
		const content = isConnected
			? this.store.wallet.account.address
			: textContent
		const clickHandler = isConnected
			? () => this.logout()
			: (e) => this.toggleWalletModal(e)

		this.connectButton.innerHTML = content
		this.connectButton.onclick = clickHandler

		this.connectButtonMobile.innerHTML = content
		this.connectButtonMobile.onclick = clickHandler
	}

	handleWalletButtonClick = (e) => {
		e.preventDefault()
		e.stopPropagation()

		this.login()
	}

	renderWalletButton = (wallet) => {
		const button = document.createElement('button')
		button.classList.add('btn', 'wallet--secondary_button')
		button.innerHTML = wallet.name
		this.choosenWallet = wallet.name
		button.onclick = (e) => this.handleWalletButtonClick(e)

		return button
	}

	handleWalletModalClose = (e) => {
		if (e && !e.target.classList.contains('bid__modal--backdrop')) {
			return
		}

		toggle('.wallet__modal--first__step', false)
		toggle('.wallet__modal--second__step', false)
		toggle('.wallet__modal', false)
		toggle('.bid__modal--backdrop', false, 'flex', true, 200)
	}

	renderFirstStep = () => {
		const modal = document.getElementById('wallet__modal--first__step')
		const buttonContainer = document.getElementById(
			'wallet__modal--buttons__container'
		)

		const wallets = WALLETS_CONFIG.map(this.renderWalletButton)

		if (buttonContainer.children.length) {
			return
		}

		wallets.forEach((wallet) => {
			buttonContainer.appendChild(wallet)
		})
	}

	renderSecondStep = (universalLink) => {
		toggle('.wallet__modal--first__step', false)
		toggle('.wallet__modal--second__step', true)

		renderQr('#connect-wallet-qr-link', universalLink)

		const backButton = document.getElementById('back-to-wallets-list-button')
		backButton.onclick = (e) => this.toggleWalletModal(e)
	}

	toggleWalletModal = (e) => {
		const backdrop = $('.bid__modal--backdrop')
		e.preventDefault()
		e.stopPropagation()
		scrollToTop()
		backdrop.addEventListener('click', this.handleWalletModalClose)

		toggle('.bid__modal--backdrop', true)
		toggle('.wallet__modal', true)
		toggle('.wallet__modal--first__step', true)
		toggle('.wallet__modal--second__step', false)

		$('body').classList.add('scroll__disabled')

		this.renderFirstStep()
	}
}

const CONNECT_WALLET_ID = 'connect-wallet-button'
const CONNECT_WALLET_MOBILE_ID = 'connect-wallet-button-mobile'

const WALLETS_CONFIG = [
	{
		name: 'Tonkeeper',
	},
]
