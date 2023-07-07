class MyDomainsView {
  constructor() { }

  renderLoadingView() {
    showMyDomainsContainer();
    showTableLoading();
    showMyDomainsTitle();
    resetViewAlignment();
  }

  renderEmptyView() {
    hideTableLoading();
    hideMyDomainsTitle();

    showNoDomainsContainer();
    centerView();
  }

  resetTable() {
    document.querySelectorAll('.my-domains-table-row').forEach(node => node.remove());
  }

  rednder(moreDomainsToDisplay, isLoadMore) {
    if (moreDomainsToDisplay.length) {
      rednerMoreDomains(moreDomainsToDisplay);

      if (isLoadMore) {
        showLoadMoreButton();
      }
      return;
    }

    this.renderEmptyView();
  }
}


// --- UTILITY REDNER METHODS ---
let tonToUsdtRatio = 1;
const fetchTonToUsdtRatio = (async () => {
  try {
    const coinPrice = await getCoinPrice();
    tonToUsdtRatio = coinPrice;
  } catch (e) {
    console.error(e.message);
  }
})();

const assembleRowData = (item) => {
  const domainName = item.name;
  const salePrice = TonWeb.utils.fromNano(getMinPrice(domainName));
  const expiryDate = new Date(item.expiring_at * 1000);
  
  return { domainName, salePrice, expiryDate };
}

const buildDomainCell = (cell, domain) => {
  cell.classList.add('my-domains-table-cell-first');

  const domainCellDiv = document.createElement('div');
  domainCellDiv.classList.add('my-domains-table-domain-cell');
  domainCellDiv.innerText = domain;
  cell.appendChild(domainCellDiv);
}

const buildSalePriceCell = (cell, priceInTON, priceInUSDT) => {
  cell.classList.add('my-domains-table-cell');

  const priceCellDiv = document.createElement('div');
  priceCellDiv.classList.add('my-domains-cell-container');

  const spanPriceInTON = document.createElement('span');
  spanPriceInTON.classList.add('my-domains-cell-price-title');
  spanPriceInTON.innerHTML = '&nbsp;'+formatNumber(priceInTON, 2);
  priceCellDiv.appendChild(spanPriceInTON);

  const spanPriceInUSDT = document.createElement('span');
  spanPriceInUSDT.classList.add('my-domains-cell-price-caption');
  spanPriceInUSDT.innerText = formatNumber(priceInUSDT, 2); 
  priceCellDiv.appendChild(spanPriceInUSDT);

  cell.appendChild(priceCellDiv);
}

const buildDesktopSpanPriceInTON = (node, { days, hours, minutes }) => {
  const desktopSpanPriceInTON = document.createElement('span');
  desktopSpanPriceInTON.classList.add('my-domains-cell-expiry-title-desktop');

  let dayStr = '';
  if (days === 1) {
    dayStr = `1 ${store.localeDict.day} `;
  }
  if(days > 1){
    dayStr = `${days} ${store.localeDict.days} `;
  }

  desktopSpanPriceInTON.innerHTML = `${dayStr} ${hours} ${store.localeDict.hours} ${minutes} ${store.localeDict.min}`;
  node.appendChild(desktopSpanPriceInTON);
}

const buildMobileSpanPriceInTON = (node, { days }) => {
  const mobileSpanPriceInTON = document.createElement('span');
  mobileSpanPriceInTON.classList.add('my-domains-cell-expiry-title-mobile');

  let dayStr = '';
  if (days === 1) {
    dayStr = `1 ${store.localeDict.day} `;
  }
  if(days > 1){
    dayStr = `${days} ${store.localeDict.days} `;
  }

  mobileSpanPriceInTON.innerHTML = days === 0 ? store.localeDict.today : dayStr;
  node.appendChild(mobileSpanPriceInTON);
}

const buildDesktopSpanPriceInUSDT = (node, expiryDate) => {
  const desktopSpanPriceInUSDT = document.createElement('span');
  desktopSpanPriceInUSDT.classList.add('my-domains-cell-expiry-caption-desktop');

  desktopSpanPriceInUSDT.innerText = formatDate(expiryDate); 
  node.appendChild(desktopSpanPriceInUSDT);
}

const buildMobileSpanPriceInUSDT = (node, expiryDate) => {
  const mobileSpanPriceInUSDT = document.createElement('span');
  mobileSpanPriceInUSDT.classList.add('my-domains-cell-expiry-caption-mobile');

  mobileSpanPriceInUSDT.innerText = formatDateShort(expiryDate); 
  node.appendChild(mobileSpanPriceInUSDT);
}

const buildExpiryDate = (cell, expiryDate) => {
  cell.classList.add('my-domains-table-cell');

  const priceCellDiv = document.createElement('div');
  priceCellDiv.classList.add('my-domains-cell-container');

  const datetime = getDifferenceBetweenDates(expiryDate, new Date());
  buildDesktopSpanPriceInTON(priceCellDiv, datetime);
  buildMobileSpanPriceInTON(priceCellDiv, datetime);

  buildDesktopSpanPriceInUSDT(priceCellDiv, expiryDate);
  buildMobileSpanPriceInUSDT(priceCellDiv, expiryDate);

  cell.appendChild(priceCellDiv);
}

const buildArrowRight = (cell) => {
  cell.classList.add('my-domains-table-cell-last');

  const rightChevronLottie = document.createElement('span');
  rightChevronLottie.classList.add('my-domains-right-arrow-icon');
  cell.appendChild(rightChevronLottie);
}

function rednerMoreDomains(domains) {
  hideTableLoading();

  const myDomainsTableElement = $('.my-domains-table');
  for (const item of domains) {
    const { domainName, salePrice, expiryDate } = assembleRowData(item);
    const row = $('.my-domains-table').insertRow(-1);
    row.classList.add('my-domains-table-row');

    row.onclick = function () {
      const domainNameWithoutDotTon = domainName.slice(0, -4);
      setDomainToBrowserHistory(domainNameWithoutDotTon);
      setDomain(domainNameWithoutDotTon).then(() => {
          analyticService.sendEvent({ type: 'view_domain_info' })
      });
    };

    buildDomainCell(row.insertCell(0), domainName);
    buildSalePriceCell(row.insertCell(1), salePrice, salePrice * tonToUsdtRatio);
    buildExpiryDate(row.insertCell(2), expiryDate);
    buildArrowRight(row.insertCell(3));
  }
}
// -----------------------

// --- BUTTONS ---
// Navigate to starting page
$('#noDomainsStartNowButton').addEventListener('click', () => {
  clear();
  window.history.pushState('', 'TON DNS ', '#');
  setScreen('startScreen');
});

// Load more button click
$('#myDomainsLoadMoreButton').addEventListener('click', () => {
  const { moreDomainsToDisplay, isLoadMore } = myDomainsController.getNextDomainsToDisplay();
  rednerMoreDomains(moreDomainsToDisplay);

  if (!isLoadMore) {
    hideLoadMoreButton();
  }
});

// --- Navigation button click
function navigateToMyDomainsView () {
  clear();
  window.history.pushState({}, 'TON DNS ', '#/my-domains');
  setScreen('myDomainsView');
}

$('#myDomainsButton').addEventListener('click', navigateToMyDomainsView);
$('#myDomainsMobileButton').addEventListener('click', () => {
  navigateToMyDomainsView();
  toggleMobileMenu();
});
// ---------------

// --- HIDE/SHOW TOGGLE METHODS ---
function hideLoadMoreButton() {
  $('#myDomainsLoadMoreButton').style.display = 'none';
}

function showLoadMoreButton() {
  $('#myDomainsLoadMoreButton').style.display = 'flex';
}

function showMyDomainsContainer() { // and hide noDomainsContainer
  $('#myDomainsContainer').style.display = 'flex';
  $('#noDomainsContainer').style.display = 'none';
}

function showNoDomainsContainer() { // and hide myDomainsContainer
  $('#myDomainsContainer').style.display = 'none';
  $('#noDomainsContainer').style.display = 'flex';
}

function showTableLoading() {
  $('.my-domains-title').classList.add('my-domains-title-loading');
  $('.my-domains-table-loading').style.display = 'flex';
  hideMyDomainsTable();
}

function hideTableLoading() {
  $('.my-domains-title').classList.remove('my-domains-title-loading');
  $('.my-domains-table-loading').style.display = 'none';
  showMyDomainsTable();
}

function showMyDomainsTable() {
  $('.my-domains-table').removeAttribute('style');
}

function hideMyDomainsTable() {
  $('.my-domains-table').style.display = 'none';
}

function showMyDomainsTitle() {
  $('.my-domains-title').removeAttribute('style');
}

function hideMyDomainsTitle() {
  $('.my-domains-title').style.display = 'none';
}

function centerView() {
  $('#myDomainsView').style.justifyContent = 'center';
}

function resetViewAlignment() {
  $('#myDomainsView').style.justifyContent = 'flex-start';
}

// --------------------------------
