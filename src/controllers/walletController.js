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
        testnetController.update()
        this.currentWallet = this.tonConnectUI.wallet
      }
    );

    this.tonConnectUI.connectionRestored.then(restored => {
      if (!restored) {
				return;
      }

			this.currentWallet = this.tonConnectUI.wallet
      testnetController.update()
    });
  }


  async createTransaction(address, amount, message) {
		const rawAddress = getRawAddress(address)
		const encodedMessage = await getPayload(message)

		const transaction = {
			validUntil: Date.now() + 1000000,
			messages: [
				{
					address: rawAddress,
					amount: String(Number(amount) * 1000000000),
					payload: encodedMessage,
				},
			],
		}

		return transaction
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

  async isTestnet() {
		return this.tonConnectUI.account.chain === CHAIN.TESTNET
	}

  getCurrentWallet() {
		return this.currentWallet
	}

  getAccountAddress() {
		const { address, chain} = this.currentWallet?.walletInfo?.account || {}


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