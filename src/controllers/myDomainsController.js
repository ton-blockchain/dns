class MyDomainsController {
  myDomainsView = new MyDomainsView();

  expiringPeriod = 366;
  limit = isMobile() ? 10 : 5;
  offset = 0;

  domains = []; // Array<{ name: string, expiring_at: Date, address: string }>
  accountAddress = '';
  isInitialized = false;
  isDataLoading = false;

  myDomainsButton = $('#myDomainsButton');
  myDomainsMobileButton = $('#myDomainsMobileButton');
  myDomainsButtonInnerSpan = $('#myDomainsButton span');
  myDomainsMobileButtonInnerSpan = $('#myDomainsMobileButtonTitle');

  isTestnet = window.location.href.indexOf('testnet=true') > -1;

  constructor() { }

  async initialize(accountAddress) {
    this.isInitialized = true;

    this.showMyDomainsButton();
    this.startLoadingMyDomainsButton();
  
    this.setAccountAddress(accountAddress);
    this.stopLoadingMyDomainsButton();

    await this.fetchDomains();
  }

  destructor() {
    this.isInitialized = false;

    this.hideMyDomainsButton();
    this.setAccountAddress('');
    this.setDomains([]);

    setScreen('startScreen');
  }

  async fetchDomains(sleepTime = 0) {
    try {
      this.startDataLoading();

      await sleep(sleepTime);

      const TON_API = this.isTestnet ? 'https://testnet.tonapi.io/v2' : 'https://tonapi.io/v2';

      // this endpoint doesn't provide pagination and
      // returns only up to 1000 items per account address
      const response = await fetch(`${TON_API}/accounts/${this.accountAddress}/dns/expiring?period=${this.expiringPeriod}`); 
      const { items } = await response.json();

      if (!items) {
        throw new Error('No items property in the response')
      }

      const domainsSortedByAscendingExpiryDate = items.reverse();
      this.setDomains(domainsSortedByAscendingExpiryDate);
    } catch (e) {
      console.error(e.message);
    } finally {
      this.stopDataLoading();
    }
  }

  resetPagination() {
    this.limit = isMobile() ? 10 : 5;
    this.offset = 0;
  }

  showMyDomainsButton() {
    this.myDomainsButton.style.display = "flex";
    this.myDomainsMobileButton.style.display = "flex";
  }

  hideMyDomainsButton() {
    this.myDomainsButton.style.display = "none";
    this.myDomainsMobileButton.style.display = "none";
  }

  startLoadingMyDomainsButton() {
    this.myDomainsButton.disabled = true;
    this.myDomainsMobileButton.disabled = true;

    this.myDomainsButton.classList.add('my-domains-loading-button');
    this.myDomainsMobileButton.classList.add('my-domains-loading-button');
  }

  stopLoadingMyDomainsButton() {
    this.myDomainsButton.disabled = false;
    this.myDomainsMobileButton.disabled = false;

    this.myDomainsButton.classList.remove('my-domains-loading-button');
    this.myDomainsMobileButton.classList.remove('my-domains-loading-button');

    this.myDomainsButtonInnerSpan.innerText = store.localeDict.my_domains; 
    this.myDomainsMobileButtonInnerSpan.innerText = store.localeDict.my_domains;
  }

  startDataLoading() {
    this.isDataLoading = true;
    this.resetPagination();
    this.myDomainsView.resetTable();
    this.myDomainsView.renderLoadingView();
  }

  stopDataLoading() {
    const { moreDomainsToDisplay, isLoadMore } = this.getNextDomainsToDisplay();
    this.myDomainsView.rednder(moreDomainsToDisplay, isLoadMore);
    this.isDataLoading = false;
  }

  setIsTestnet(isTestnetIn) {
    this.isTestnet = isTestnetIn;
  }

  setAccountAddress(accountAddressIn) {
    this.accountAddress = accountAddressIn;
  }

  setDomains(domainsIn) {
    this.domains = domainsIn;
  }

  getNextDomainsToDisplay() {
    const moreDomainsToDisplay = this.domains.slice(this.offset, this.offset + this.limit);
    this.offset += this.limit;

    if (this.offset >= this.domains.length) {
      return { moreDomainsToDisplay, isLoadMore: false };
    }

    return { moreDomainsToDisplay, isLoadMore: true };
  }
}
