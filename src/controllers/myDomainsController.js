class MyDomainsController {
  myDomainsView = new MyDomainsView();

  expiringPeriod = 366;
  limit = isMobile() ? 10 : 5;
  offset = 0;

  domains = []; // Array<{ name: string, expiring_at: Date, address: string }>
  accountAddress = '';
  isInitialized = false;
  isDataLoading = false;

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

  async fetchDomains() {
    try {
      this.startDataLoading();

      const response = await fetch(`${TONAPI_URL}/accounts/${this.accountAddress}/dns/expiring?period=${this.expiringPeriod}`);

      const { items } = await response.json();
      if (!items) {
        throw new Error('No items property in the response')
      }

      if (!items.length) {
        return;
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
    $('#myDomainsButton').style.display = "flex";
    $('#myDomainsMobileButton').style.display = "flex";
  }

  hideMyDomainsButton() {
    $('#myDomainsButton').style.display = "none";
    $('#myDomainsMobileButton').style.display = "none";
  }

  startLoadingMyDomainsButton() {
    $('#myDomainsButton').disabled = true;
    $('#myDomainsMobileButton').disabled = true;

    $('#myDomainsButton').classList.add('my-domains-loading-button');
    $('#myDomainsMobileButton').classList.add('my-domains-loading-button');
  }

  stopLoadingMyDomainsButton() {
    $('#myDomainsButton').disabled = false;
    $('#myDomainsMobileButton').disabled = false;

    $('#myDomainsButton').classList.remove('my-domains-loading-button');
    $('#myDomainsMobileButton').classList.remove('my-domains-loading-button');

    $('#myDomainsButton span').innerText = store.localeDict.my_domains; 
    $('#myDomainsMobileButtonTitle').innerText = store.localeDict.my_domains;
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
