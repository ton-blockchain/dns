class TestnetController {
  constructor() {
    this.isTestnet = window.location.href.indexOf('testnet=true') > -1

    this.update()
  }

  async update() {
    const isLoggedIn = await walletController.isLoggedIn()
    if (!isLoggedIn) {
      return
    }

    const isTestnet = await walletController.isTestnet()

    if (isTestnet) {
      this.turnOn()
    } else {
      this.turnOff()
    }
  }

  turnOn() {
    if (this.isTestnet) {
      return
    }

    this.isTestnet = true

    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("testnet", "true");
    window.location.search = searchParams.toString();
  }

  turnOff() {
    if (!this.isTestnet) {
      return
    }

    this.isTestnet = false

    const searchParams = new URLSearchParams(window.location.search)
    searchParams.delete("testnet");
    window.location.search = searchParams.toString();
  }
}