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

		this.loading = true;

		this.walletConfig = WALLETS_CONFIG

		this.choosenWallet = null
		this.currentWallet = null

		this.connectButton = document.getElementById(CONNECT_WALLET_ID)
		this.connectButtonMobile = document.getElementById(CONNECT_WALLET_MOBILE_ID)
		this.menuConnectButton = document.getElementById(MENU_CONNECT_WALLET_ID)

		this.renderLoginButton()
		this.connector = new TonConnectSDK.TonConnect()
		this.unsubscribe = this.connector.onStatusChange(async(walletInfo) => {
			this.store.dispatch('setWallet', walletInfo)
			this.renderLoginButton()

			if (walletInfo) {
				this.handleWalletModalClose()
				toggle('.mobile-menu__wallet-menu__container', true)
			}

			if (walletInfo && !this.currentWallet) {
				await this.getWalletsList()

				const walletName = walletInfo.device.appName
				const currentWallet = this.walletConfig.find((wallet) => wallet.name === walletName)
				this.currentWallet = currentWallet

				this.renderLoginButton()
			}
		}, console.error)

		this.connector.restoreConnection()
			.then(() => this.loading = false)
			.then(() => this.init())

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
			this.wallets.embeddedWallet &&
			!this.connector.connected
		) {
			this.connector.connect({
				jsBridgeKey: this.wallets.embeddedWallet.jsBridgeKey,
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

		const supportedWallets = walletsList.filter((wallet) => 
			wallet.universalLink !== undefined 
			&& this.walletConfig.find((config) => config.name === wallet.name)
		)
		this.wallets = { walletsList: supportedWallets, embeddedWallet }

		return {
			walletsList,
			embeddedWallet,
		}
	}

	async login() {
		const tonkeeperConnectionSource = {
			universalLink: this.choosenWallet.universalLink,
			bridgeUrl: this.choosenWallet.bridgeUrl,
		}

		const unversalLink = await this.connector.connect(tonkeeperConnectionSource)

		if (isMobile()) {
			window.open(unversalLink, '_blank')
		} else {
			this.renderSecondStep(unversalLink)
		}

		this.connectButton.blur()
	}

	logout(e) {
		e.preventDefault()
		e.stopPropagation()

		this.connector.disconnect()
		this.handleTooltipClose()

		closeMenu()

		toggle('.mobile-menu__wallet-menu__container', false)

		this.currentWallet = null
		this.choosenWallet = null

		document.getElementsByName('connect-wallet-tooltip-logout').forEach((el) => {
			el.removeEventListener('click', this.boundLogout)
		})
	}

	async isLoggedIn() {
		let isLoggedIn = null

		await until(() => this.loading !== true)
			.then(() => isLoggedIn = !!this.currentWallet)

		return isLoggedIn
	}

	getCurrentWallet() {
		return this.currentWallet
	}

	boundLogout = this.logout.bind(this)

	toggleLoadingButton() {
		const contentContainer = this.connectButton.querySelector('#connect-wallet-button-content')

		if (this.loading) {
			this.connectButton.classList.add('wallet--secondary_button', 'wallet__connect--secondary')
			this.connectButtonMobile.classList.add('wallet__connect--hidden')

			contentContainer.classList.add('loading--animation')
			this.connectButtonMobile.classList.add('loading--animation')
			this.menuConnectButton.classList.add('loading--animation')

			contentContainer.innerHTML = LOADING_ICON
			this.connectButtonMobile.innerHTML = LOADING_ICON
			this.menuConnectButton.innerHTML = LOADING_ICON

		} else {
			contentContainer.classList.remove('loading--animation')
			this.connectButtonMobile.classList.remove('loading--animation')
			this.menuConnectButton.classList.remove('loading--animation')
		}
	}

	renderLoginButton() {
		const isConnected = !!this.store.wallet

		if (this.loading) {
			this.toggleLoadingButton()
			return
		} else {
			this.toggleLoadingButton()
		}

		const desktopText = this.store.localeDict.wallet_connect_button
		const mobileText = this.store.localeDict.wallet_connect_button_mobile
		let truncasedAdress = null;

		if (isConnected) { 
			const rawAddress = this.store.wallet.account.address
			const userFriendlyAddress = TonConnectSDK.toUserFriendlyAddress(rawAddress);

			truncasedAdress = isMobile() ? truncase(userFriendlyAddress, 10, 10) : truncase(userFriendlyAddress, 4, 4)
		}

		const addressWithIcon = `
			<span style="background-image: url(${this.currentWallet?.icon}); width: 24px; height: 24px; background-size: cover;"></span> ${truncasedAdress}`

		const content = isConnected
			? addressWithIcon
			: desktopText

		const mobileContent = isConnected
			? addressWithIcon 
			: `<span style="width: 20px; height: 20px">${WALLET_ICON}</span <span id="connect-wallet-button-mobile-content">${mobileText}</span>` 

		const mobileMenuContent = isConnected
			? addressWithIcon 
			: `<span style="width: 24px; height: 24px">${WALLET_ICON}</span <span id="connect-wallet-button-mobile-content">${desktopText}</span>` 

		if (isConnected) {
			this.connectButton.classList.add('wallet--secondary_button', 'wallet__connect--secondary')
			this.connectButtonMobile.classList.add('wallet__connect--hidden')
		} else {
			this.connectButton.classList.remove('wallet--secondary_button', 'wallet__connect--secondary')
			this.connectButtonMobile.classList.remove('wallet__connect--hidden')
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

		this.connectButtonMobile.innerHTML = mobileContent
		this.connectButtonMobile.onclick = clickHandler

		this.menuConnectButton.innerHTML = mobileMenuContent
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

	handleWalletButtonClick = (e, wallet) => {
		e.preventDefault()
		e.stopPropagation()

		this.choosenWallet = wallet
		this.login()
	}

	renderWalletButton = (wallet) => {
		const button = document.createElement('button')
		const icon = this.walletConfig.find((w) => w.name === wallet.name).icon
		button.classList.add('btn', 'wallet--secondary_button', 'wallet--wallet_button')
		button.innerHTML = `<img src="${icon}" />${wallet.name}`
		button.onclick = (e) => this.handleWalletButtonClick(e, wallet)

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

		$('body').classList.remove('scroll__disabled')

		this.choosenWallet = null
	}

	renderFirstStep = () => {
		toggle('.wallet__modal--first__step', true)
		toggle('.wallet__modal--second__step', false)

		const buttonContainer = document.getElementById(
			'wallet__modal--buttons__container'
		)

		const wallets = this.wallets.walletsList.map(this.renderWalletButton)

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

		const backButton = document.getElementById('back-to-wallets-list-button')
		backButton.onclick = (e) => this.toggleWalletModal(e)
	}

	handleConnectWalletButtonClick = (e) => {
		e.preventDefault()
		e.stopPropagation()

		this.toggleWalletModal(e)
	}

	toggleWalletModal = (e) => {
		this.choosenWallet = null
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

		if (this.wallets.walletsList.length > 1) { 
			this.renderFirstStep()
			return 
		} 

		this.choosenWallet = this.wallets.walletsList[0]
		this.login()
	}
}

const CONNECT_WALLET_ID = 'connect-wallet-button'
const CONNECT_WALLET_MOBILE_ID = 'connect-wallet-button-mobile'
const MENU_CONNECT_WALLET_ID = 'mobile-menu-connect-wallet-button'

const LOADING_ICON = `
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path
		d="M18.334 10a8.333 8.333 0 1 1-16.667 0 8.333 8.333 0 0 1 16.667 0Zm-15 0a6.667 6.667 0 1 0 13.333 0 6.667 6.667 0 0 0-13.333 0Z"
		fill="var(--separator-alpha)" />
	<path
		d="M10 2.5c0-.46.374-.837.832-.791a8.334 8.334 0 0 1 7.46 7.46c.046.457-.331.831-.792.831-.46 0-.828-.374-.885-.83a6.665 6.665 0 0 0-5.783-5.784C10.374 3.328 10 2.96 10 2.5Z"
		fill="var(--accent-default)" />
</svg>
`
const WALLET_ICON = `
<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path clip-rule="evenodd"
    d="M13.977 4.167H6.023c-1.273 0-1.746.106-2.214.356a2.29 2.29 0 0 0-.952.953c-.25.468-.357.94-.357 2.214v4.62c0 1.274.106 1.746.357 2.214.22.411.541.733.952.953.468.25.94.356 2.214.356h7.954c1.273 0 1.746-.106 2.214-.356.41-.22.733-.542.952-.953.25-.468.357-.94.357-2.214V7.69c0-1.274-.106-1.746-.357-2.214a2.29 2.29 0 0 0-.952-.953c-.468-.25-.94-.356-2.214-.356Z"
    stroke="currentColor" stroke-width="1.5" />
  <path
    d="M15.359 10H17.5v2.5H15.36c-.316 0-.62-.132-.843-.366a1.281 1.281 0 0 1-.349-.884v0c0-.332.126-.65.349-.884.223-.234.527-.366.843-.366v0ZM5 6.667h2.342"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`