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
      firstRender(moreDomainsToDisplay);

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
  const salePricePromise = getSalePrice(domainName); // new Promise((r) => r(100));
  const expiryDate = new Date(item.expiring_at * 1000);
  
  return { domainName, salePricePromise, expiryDate };
}

const buildDomainCell = (cell, domain) => {
  cell.classList.add('my-domains-table-cell-first');

  const domainCellDiv = document.createElement('div');
  domainCellDiv.classList.add('my-domains-table-domain-cell');
  domainCellDiv.innerText = domain;
  cell.appendChild(domainCellDiv);
}

const buildSalePriceCell = (cell, salePricePromise) => {
  cell.classList.add('my-domains-table-cell');

  const priceCellDiv = document.createElement('div');
  priceCellDiv.classList.add('my-domains-cell-container');

  // --- first row in the cell
  const firstRow = document.createElement('div');
  firstRow.classList.add('my-domains-cell-price-row');
  priceCellDiv.appendChild(firstRow);

  const spanPriceInTON = document.createElement('span');
  spanPriceInTON.classList.add('my-domains-cell-price-loading');
  spanPriceInTON.classList.add('my-domains-cell-price-title-loading');
  spanPriceInTON.innerHTML = '&nbsp;';
  firstRow.appendChild(spanPriceInTON);

  const tonLogoSpan = document.createElement('span');
  tonLogoSpan.classList.add('my-domains-cell-price-ton-logo');
  firstRow.insertBefore(tonLogoSpan, spanPriceInTON);
  // ---

  // --- second row in the cell
  const secondRow = document.createElement('div');
  secondRow.classList.add('my-domains-cell-price-row');
  priceCellDiv.appendChild(secondRow);

  const spanPriceInUSDT = document.createElement('span');
  spanPriceInUSDT.classList.add('my-domains-cell-price-loading');
  spanPriceInUSDT.classList.add('my-domains-cell-price-caption-loading');
  spanPriceInUSDT.innerText = '&nbsp;'; 
  secondRow.appendChild(spanPriceInUSDT);

  const dollarSignSpan = document.createElement('span');
  dollarSignSpan.classList.add('my-domains-cell-price-caption');
  dollarSignSpan.innerText = '≈ $';
  secondRow.insertBefore(dollarSignSpan, spanPriceInUSDT);
  // ---

  cell.appendChild(priceCellDiv);

  salePricePromise.then((priceInTON) => {
    spanPriceInTON.classList.remove('my-domains-cell-price-loading');
    spanPriceInTON.classList.remove('my-domains-cell-price-title-loading');
    spanPriceInTON.classList.add('my-domains-cell-price-title');
    spanPriceInTON.innerHTML = '&nbsp;' + formatNumber(priceInTON, 2);

    const priceInUSDT = priceInTON * tonToUsdtRatio;
    spanPriceInUSDT.classList.remove('my-domains-cell-price-loading');
    spanPriceInUSDT.classList.remove('my-domains-cell-price-caption-loading');
    spanPriceInUSDT.classList.add('my-domains-cell-price-caption');
    spanPriceInUSDT.innerText = formatNumber(priceInUSDT, 2);
  });
}

const buildExpiredDate = (node) => {
  const expiredDateSpan = document.createElement('span');
  expiredDateSpan.classList.add('my-domains-cell-expiried-date');
  expiredDateSpan.innerHTML = store.localeDict.my_domains_domain_expired;
  node.appendChild(expiredDateSpan);
}

const buildDesktopExpiryDateTitleSpan = (node, { days, hours, minutes }) => {
  const desktopExpiryDateSpan = document.createElement('span');
  desktopExpiryDateSpan.classList.add('my-domains-cell-expiry-title-desktop');

  let dayStr = '';
  if (days === 1) {
    dayStr = `1 ${store.localeDict.day} `;
  }
  if(days > 1){
    dayStr = `${days} ${store.localeDict.days} `;
  }

  desktopExpiryDateSpan.innerHTML = `${dayStr} ${hours} ${store.localeDict.hours} ${minutes} ${store.localeDict.min}`;
  node.appendChild(desktopExpiryDateSpan);
}

const buildMobileExpiryDateTitleSpan = (node, { days }) => {
  const mobileExpiryDateSpan = document.createElement('span');
  mobileExpiryDateSpan.classList.add('my-domains-cell-expiry-title-mobile');

  let dayStr = '';
  if (days === 1) {
    dayStr = `1 ${store.localeDict.day} `;
  }
  if(days > 1){
    dayStr = `${days} ${store.localeDict.days} `;
  }

  mobileExpiryDateSpan.innerHTML = days === 0 ? store.localeDict.today : dayStr;
  node.appendChild(mobileExpiryDateSpan);
}

const buildDesktopExpiryDateCaptionSpan = (node, expiryDate) => {
  const desktopExpiryDateCaptionSpan = document.createElement('span');
  desktopExpiryDateCaptionSpan.classList.add('my-domains-cell-expiry-caption-desktop');

  desktopExpiryDateCaptionSpan.innerText = formatDate(expiryDate); 
  node.appendChild(desktopExpiryDateCaptionSpan);
}

const buildMobileExpiryDateCaptionSpan = (node, expiryDate) => {
  const mobileExpiryDateCaptionSpan = document.createElement('span');
  mobileExpiryDateCaptionSpan.classList.add('my-domains-cell-expiry-caption-mobile');

  mobileExpiryDateCaptionSpan.innerText = formatDateShort(expiryDate); 
  node.appendChild(mobileExpiryDateCaptionSpan);
}

const buildExpiryDate = (cell, expiryDate) => {
  cell.classList.add('my-domains-table-cell');

  const expiryDateCellDiv = document.createElement('div');
  expiryDateCellDiv.classList.add('my-domains-cell-container');

  const isDomainExpired = expiryDate.getTime() <= new Date().getTime();

  if (isDomainExpired) {
    buildExpiredDate(expiryDateCellDiv);
  } else {
    const datetime = getDifferenceBetweenDates(expiryDate, new Date());

    buildDesktopExpiryDateTitleSpan(expiryDateCellDiv, datetime);
    buildMobileExpiryDateTitleSpan(expiryDateCellDiv, datetime);

    buildDesktopExpiryDateCaptionSpan(expiryDateCellDiv, expiryDate);
    buildMobileExpiryDateCaptionSpan(expiryDateCellDiv, expiryDate);
  }

  cell.appendChild(expiryDateCellDiv);
}

const buildArrowRight = (cell) => {
  cell.classList.add('my-domains-table-cell-last');

  const rightChevronLottie = document.createElement('span');
  rightChevronLottie.classList.add('my-domains-right-arrow-icon');
  cell.appendChild(rightChevronLottie);
}

function renderRow(rowData) {
  const { domainName, salePricePromise, expiryDate } = rowData;
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
  buildSalePriceCell(row.insertCell(1), salePricePromise);
  buildExpiryDate(row.insertCell(2), expiryDate);
  buildArrowRight(row.insertCell(3));
}

function renderMoreDomains(domains) {
  for (const domain of domains) {
    const row = assembleRowData(domain)
    renderRow(row);
  }
}

function firstRender(domains) {
  renderMoreDomains(domains);
  hideTableLoading();
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
$('#myDomainsLoadMoreButton').addEventListener('click', async () => {
  hideLoadMoreButtonText();
  showLoadMoreButtonSpinner();

  const { moreDomainsToDisplay, isLoadMore } = myDomainsController.getNextDomainsToDisplay();
  renderMoreDomains(moreDomainsToDisplay);
  hideLoadMoreButtonSpinner();
  showLoadMoreButtonText();

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

function hideLoadMoreButtonText() {
  $('#myDomainsLoadMoreButtonText').style.display = 'none';
}

function showLoadMoreButtonText() {
  $('#myDomainsLoadMoreButtonText').style.display = 'block';
}

function hideLoadMoreButtonSpinner() {
  $('#myDomainsLoadMoreButtonLoader').style.display = 'none';
}

function showLoadMoreButtonSpinner() {
  $('#myDomainsLoadMoreButtonLoader').style.display = 'block';
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
