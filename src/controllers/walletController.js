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

		this.walletConfig = WALLETS_CONFIG

		this.choosenWallet = this.walletConfig[0]

		this.connectButton = document.getElementById(CONNECT_WALLET_ID)
		this.connectButtonMobile = document.getElementById(CONNECT_WALLET_MOBILE_ID)
		this.menuConnectButton = document.getElementById(MENU_CONNECT_WALLET_ID)

		this.renderLoginButton()
		this.connector = new TonConnectSDK.TonConnect()
		this.unsubscribe = this.connector.onStatusChange((wallet) => {
			this.store.dispatch('setWallet', wallet)
			this.renderLoginButton()

			if (wallet) {
				this.handleWalletModalClose()
				toggle('.mobile-menu__wallet-menu__container', true)
			}
		}, console.error)

		this.connector.restoreConnection().then(() => this.init())

		window.addEventListener('resize', () => {
			this.renderLoginButton();
		})
	}

	async init() {
		this.renderLoginButton()

		await this.getWalletsList()

		this.renderMenuButtons()

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
			(wallet) => wallet.name === this.choosenWallet.name
		)

		const tonkeeperConnectionSource = {
			universalLink: currentWallet.universalLink,
			bridgeUrl: currentWallet.bridgeUrl,
		}

		const unversalLink = await this.connector.connect(tonkeeperConnectionSource)

		if (isMobile()) {
			window.open(unversalLink, '_blank')
		} else {
			this.renderSecondStep(unversalLink)
		}
	}

	logout(e) {
		e.preventDefault()
		e.stopPropagation()

		this.connector.disconnect()
		this.handleTooltipClose()

		closeMenu()

		toggle('.mobile-menu__wallet-menu__container', false)

		document.getElementsByName('connect-wallet-tooltip-logout').forEach((el) => {
			el.removeEventListener('click', this.boundLogout)
		})
	}

	boundLogout = this.logout.bind(this)

	renderLoginButton() {
		const isConnected = !!this.store.wallet
		const textContent = isMobile() 
			? this.store.localeDict.wallet_connect_button_mobile 
			: this.store.localeDict.wallet_connect_button
		let truncasedAdress = null;

		if (isConnected) { 
			const rawAddress = this.store.wallet.account.address
			const userFriendlyAddress = TonConnectSDK.toUserFriendlyAddress(rawAddress);
			truncasedAdress = truncase(userFriendlyAddress, 4, 4)
		}

		const addressWithIcon = `<span style="background-image: url(${this.choosenWallet.icon}); width: 24px; height: 24px"></span> ${truncasedAdress}`

		const content = isConnected
			? addressWithIcon
			: textContent

		const mobileContent = isConnected
			? addressWithIcon 
			: this.store.localeDict.wallet_connect_button
		

		if (isConnected) {
			this.connectButton.classList.add('wallet--secondary_button', 'wallet__connect--secondary')
			this.connectButtonMobile.classList.add('wallet__connect--hidden')
			this.menuConnectButton.classList.add('wallet--secondary_button', 'wallet__connect--menu')
		} else {
			this.connectButton.classList.remove('wallet--secondary_button', 'wallet__connect--secondary')
			this.connectButtonMobile.classList.remove('wallet__connect--hidden')
			this.menuConnectButton.classList.remove('wallet--secondary_button', 'wallet__connect--menu')
		}

		const clickHandler = isConnected
    ? (e) => this.renderTooltip(e)
    : (e) => this.handleConnectWalletButtonClick(e)

		const mobileClickHandler = isConnected
			? () => {}
			: (e) => this.handleConnectWalletButtonClick(e)

		const contentContainer = this.connectButton.querySelector('#connect-wallet-button-content')

		contentContainer.innerHTML = content
		this.connectButton.onclick = clickHandler

		this.connectButtonMobile.innerHTML = content
		this.connectButtonMobile.onclick = clickHandler

		this.menuConnectButton.innerHTML = mobileContent
		this.menuConnectButton.onclick = mobileClickHandler
	}

	renderMenuButtons() {
		const menuButtons = document.getElementsByClassName('connect-wallet-tooltip-logout')
		Array.from(menuButtons).forEach((el) => {
			el.addEventListener('click', this.boundLogout)
		})
	}

	renderTooltip = (e) => {
		const backdrop = $('.tooltip--backdrop')

		e.preventDefault()
		e.stopPropagation()

		toggle('#connect-wallet-tooltip', true)
		toggle('.tooltip--backdrop', true)
	
		backdrop.addEventListener('click', this.handleTooltipClose)
	}
	
	handleTooltipClose = (e) => {
		toggle('#connect-wallet-tooltip', false)
		toggle('.tooltip--backdrop', false, 'flex', true, 200)
		
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
		this.choosenWallet = wallet
		button.onclick = (e) => this.handleWalletButtonClick(e)

		return button
	}

	handleWalletModalClose = (e) => {
		if (e && !e.target.classList.contains('bid__modal--backdrop')) {
			return
		}

		const backdrop = $('.bid__modal--backdrop')

		toggle('.wallet__modal--first__step', false)
		toggle('.wallet__modal--second__step', false)
		toggle('.wallet__modal', false)
		toggle('.bid__modal--backdrop', false, 'flex', true, 200)

		backdrop.removeEventListener('click', this.handleWalletModalClose)
	}

	renderFirstStep = () => {
		const buttonContainer = document.getElementById(
			'wallet__modal--buttons__container'
		)

		const wallets = this.walletConfig.map(this.renderWalletButton)

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

		renderQr('#connect-wallet-qr-link', universalLink, {size: 288, margin: 0})

		// const backButton = document.getElementById('back-to-wallets-list-button')
		// backButton.onclick = (e) => this.toggleWalletModal(e)
	}

	handleConnectWalletButtonClick = (e) => {
		e.preventDefault()
		e.stopPropagation()

		if (isMobile()) {
			this.login()
		} else {
			this.toggleWalletModal(e)
		}
	}

	toggleWalletModal = (e) => {
		const backdrop = $('.bid__modal--backdrop')
		e.preventDefault()
		e.stopPropagation()
		scrollToTop()
		closeMenu()
		backdrop.addEventListener('click', this.handleWalletModalClose)

		toggle('.bid__modal--backdrop', true)
		toggle('.wallet__modal', true)
		toggle('.wallet__modal--first__step', false)
		toggle('.wallet__modal--second__step', false)

		$('body').classList.add('scroll__disabled')

		// this.renderFirstStep()
		this.login()
	}
}

const CONNECT_WALLET_ID = 'connect-wallet-button'
const CONNECT_WALLET_MOBILE_ID = 'connect-wallet-button-mobile'
const MENU_CONNECT_WALLET_ID = 'mobile-menu-connect-wallet-button'
