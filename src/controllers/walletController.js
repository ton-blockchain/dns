const UserRejectsError = TonConnectSDK.UserRejectsError;

class WalletController {
	constructor(props) {
		this.store = props.store
		this.currentWallet = null

    this.connector = new TonConnectSDK.TonConnect();
    this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      connector: this.connector,
      buttonRootId: 'connect-wallet-button'
    });

    const currentTheme = themeController.getTheme()
    const locale = store.locale

    this.tonConnectUI.uiOptions = {
      language: locale,
      uiPreferences: {
        theme: UPPER_CASE_THEME[currentTheme],
        colorsSet: COLORS_SET
      },
      actionsConfiguration: {
        modals: [],
        notifications: []
      }
    };

    const unsubscribe = this.tonConnectUI.onStatusChange(
      (walletInfo) => {
				testnetController.update().then(() => {
					this.currentWallet = this.tonConnectUI.wallet
					this.updateMyDomainController();
				});
      }
    );

    this.tonConnectUI.connectionRestored.then(restored => {
			if (!restored) {
				myDomainsController.destructor();
				return;
      }

			testnetController.update().then(() => {
				this.currentWallet = this.tonConnectUI.wallet
				this.updateMyDomainController();
			});
    });
  }

	updateMyDomainController() {
		if (!this.currentWallet) {
			myDomainsController.destructor();
			return;
		}

		if (myDomainsController.isInitialized) {
			return;
		}

		const addr = this.currentWallet.account.address;
		myDomainsController.initialize(addr);
	}

  async sendTransaction(
		transaction, 
		onPaymentSuccess = () => {},
		onPaymentRejection = () => {}, 
		onPaymentError = () => {}
	) {
		try {
			const result = await this.tonConnectUI.sendTransaction(transaction)
				.then(() => onPaymentSuccess());

		} catch (e) {
			if (e instanceof UserRejectsError) {
					onPaymentRejection()
			} else {
					onPaymentError()
			}
		}
	}

  updateTheme(theme) {
    this.tonConnectUI.uiOptions = {
      uiPreferences: {
        theme,
      }
    }
  }

  async isLoggedIn() {
		return !!this.tonConnectUI.connected
	}

	isLoggedInSync() {
		return !!this.tonConnectUI.connected
	}

  async isTestnet() {
		return this.tonConnectUI.account.chain === CHAIN.TESTNET
	}

  getCurrentWallet() {
		return this.currentWallet
	}

	getAccountAddress() {
		const { address, chain } = this.currentWallet?.account || {}

		if (!address || !chain) {
			return null
		}

		return this.getUserFriendlyAddress(address, chain)
	}

  getUserFriendlyAddress(address, chain) {
		if (!address) {
			return '';
		}

		return TonConnectSDK.toUserFriendlyAddress(address, chain === CHAIN.TESTNET);
	}

}