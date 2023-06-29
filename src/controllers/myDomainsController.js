class MyDomainsController {
  expiringPeriod = 360;
  limit = isMobile() ? 10 : 5;
  offset = 0;

  domains = []; // Array<{ name: string, expiring_at: Date, address: string }>
  accountAddress = '';
  isInitialized = false;
  isDataLoading = false;
  domainListSearchCache = new Map();

  myDomainsButton = $('#myDomainsButton');
  myDomainsMobileButton = $('#myDomainsMobileButton');
  myDomainsButtonInnerSpan = $('#myDomainsButton span');
  myDomainsMobileButtonInnerSpan = $('#myDomainsMobileButtonTitle');

  isTestnet = window.location.href.indexOf('testnet=true') > -1;

  constructor() { }

  async initialize(accountAddress) {
    this.isInitialized = true;

    this.setAccountAddress(accountAddress);
    this.showMyDomainsButton();
    this.startLoadingMyDomainsButton();
    await this.fetchDomains();
  }

  destructor() {
    this.isInitialized = false;

    this.hideMyDomainsButton();
    this.setAccountAddress('');
    this.setDomains([]);

    setScreen('startScreen');
  }

  async fetchDomains() {
    try {
      const TON_API = this.isTestnet ? 'https://testnet.tonapi.io/v2' : 'https://tonapi.io/v2';
      const dnsCollectionAddress = dnsCollection.address.toString(true, true, true, this.isTestnet);

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
      this.hideMyDomainsButton();
    } finally {
      this.stopLoadingMyDomainsButton();
    }
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
    this.isDataLoading = true;

    this.myDomainsButton.disabled = true;
    this.myDomainsMobileButton.disabled = true;

    this.myDomainsButton.classList.add('my-domains-loading-button');
    this.myDomainsMobileButton.classList.add('my-domains-loading-button');
  }

  stopLoadingMyDomainsButton() {
    this.isDataLoading = false;

    this.myDomainsButton.disabled = false;
    this.myDomainsMobileButton.disabled = false;

    this.myDomainsButton.classList.remove('my-domains-loading-button');
    this.myDomainsMobileButton.classList.remove('my-domains-loading-button');

    this.myDomainsButtonInnerSpan.innerText = store.localeDict.my_domains; 
    this.myDomainsMobileButtonInnerSpan.innerText = store.localeDict.my_domains;
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

  // Cache is necessary here:
  // We don't want to iterate over domains (up to 1000 items) every time this
  // function gets called at the domain page update
  getDomainItemByName(domainName) {
    if (this.domainListSearchCache.has(domainName)) {
      return this.domainListSearchCache.get(domainName)
    }

    const fullDomainName = domainName + '.ton';
    const domainItem = this.domains.find(item => item.name === fullDomainName);
    this.domainListSearchCache.set(domainName, domainItem);
    return domainItem;
  }

  async getDomainItemByNameOnceLoaded(domainName) {
    if (this.isDataLoading) {
      await sleep();
      return this.getDomainItemByNameOnceLoaded(domainName);
    }

    return this.getDomainItemByName(domainName);
  }

  getNextDomainsToDisplay() {
    const moreDomainsToDisplay = this.domains.slice(this.offset, this.offset + this.limit);
    this.offset += this.limit;

    if (this.offset >= this.domains.length) {
      return { moreDomainsToDisplay, isShowMore: false };
    }

    return { moreDomainsToDisplay, isShowMore: true };
  }


}
