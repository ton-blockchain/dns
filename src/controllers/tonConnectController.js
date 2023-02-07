const login = async () => {
  const connector = new TonConnectSDK.TonConnect();

  connector.restoreConnection();

  const walletsList = await connector.getWallets()

  console.log('connector', connector);

  const wallet = walletsList[0];

  const tonkeeperConnectionSource = {
    universalLink: walletsList[0].universalLink,
    bridgeUrl: walletsList[0].bridgeUrl,
  };

  const unversalLink = await connector.connect(tonkeeperConnectionSource);

  console.log('universalLink', unversalLink);

  renderQr('#connect-wallet', unversalLink);

  const unsubscribe = connector.onStatusChange(((wallet) => {
    console.log('wallet', wallet);
    store.setWallet(wallet)
  }), console.error)

  console.log('store', store);
}

const onWalletConnected = async () => {
  connector.onStatusChange(setWallet, console.error)
}