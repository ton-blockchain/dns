class WalletController {
	constructor(props) {
		this.store = props.store
    this.store.subscribe(this, 'setWallet', (wallet) => this.store.setWallet(wallet))
		this.store.subscribe(this, 'setWalletsList', ({walletsList, embeddedWallet}) => {
      this.store.setWalletsList({walletsList, embeddedWallet})
		})

    this.wallet = null;

    this.connectButton = document.getElementById(CONNECT_WALLET_ID);
    this.connectButtonMobile = document.getElementById(CONNECT_WALLET_MOBILE_ID);
    this.walletLogs = document.getElementById('wallet-logs');

    this.renderButtons()
    this.connector = new TonConnectSDK.TonConnect();
    this.unsubscribe = this.connector.onStatusChange(((wallet) => {
      this.wallet = wallet
      this.store.dispatch('setWallet', wallet)
      this.renderButtons()
    }), console.error)


    this.connector.restoreConnection().then((wallet) => this.init())

	}

	async init() {
    this.renderButtons()

    await this.getWalletsList()

    if (isMobile() && this.walletsList.embeddedWallet && !this.connector.connected) {
      this.connector.connect({ jsBridgeKey: this.walletsList.embeddedWallet.jsBridgeKey });
      return;
    }
	}

  async getWalletsList() {
    const walletsList = await this.connector.getWallets();

		const embeddedWallet = walletsList.filter(TonConnectSDK.isWalletInfoInjected).find((wallet) => wallet.embedded);

    this.store.dispatch('setWalletsList', { walletsList, embeddedWallet })
    this.walletsList = { walletsList, embeddedWallet }
    
		return {
			walletsList,
			embeddedWallet,
		};
  }

  async login() {
    const walletsList = this.walletsList.walletsList
    const currentWallet = walletsList[0]
    const tonkeeperConnectionSource = {
      universalLink: currentWallet.universalLink,
      bridgeUrl: currentWallet.bridgeUrl,
    };

    const unversalLink = await this.connector.connect(tonkeeperConnectionSource);
  
    if (isMobile()) {
      window.open(unversalLink, '_self', 'noreferrer noopener');
    } else {
      renderQr('#connect-wallet', unversalLink);
    }
  } 

  logout() {
    this.connector.disconnect();
  }

  renderButtons() {
    const isConnected = !!this.store.wallet
    const content = isConnected ? this.store.wallet.account.address : 'Connect wallet'
    const clickHandler = isConnected ? () => this.logout() : () => this.login()

    this.connectButton.innerHTML = content
    this.connectButton.onclick = clickHandler

    this.connectButtonMobile.innerHTML = content
    this.connectButtonMobile.onclick = clickHandler
  }
}


const CONNECT_WALLET_ID = 'connect-wallet-button'
const CONNECT_WALLET_MOBILE_ID = 'connect-wallet-button-mobile'