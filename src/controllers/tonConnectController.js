const login = async () => {
  const connector = new TonConnectSDK.TonConnect();

  connector.restoreConnection();

  const unsubscribe = connector.onStatusChange(((wallet) => {
    console.log('wallet', wallet);
    store.setWallet(wallet)
    const content = store.wallet ? store.wallet.account.address : 'Connect wallet';
    button.innerHTML = content;
  }), console.error)

  const walletsList = await connector.getWallets()

  console.log('connector', connector);

  const button = document.getElementById('connect-wallet-button');
  const walletLogs = document.getElementById('wallet-logs');

  const wallet = walletsList[0];

  const tonkeeperConnectionSource = {
    universalLink: wallet.universalLink,
    bridgeUrl: wallet.bridgeUrl,
  };

  console.log('wallet', wallet)
  if (isMobile() && wallet.embedded) {
    connector.connect({ jsBridgeKey: wallet.jsBridgeKey });
    walletLogs.innerHTML = 'embedded wallet';
    return;
  }

  const unversalLink = await connector.connect(tonkeeperConnectionSource);
  
  if (isMobile()) {
    walletLogs.innerHTML = 'mobile wallet';
    window.open(unversalLink, '_self', 'noreferrer noopener');
  } else {
    walletLogs.innerHTML = JSON.stringify(wallet, null, 2);
    renderQr('#connect-wallet', unversalLink);
  }

  console.log('store', store);
}

const onWalletConnected = async () => {
  connector.onStatusChange(setWallet, console.error)
}