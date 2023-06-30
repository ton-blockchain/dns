// --- Fetch Ton to Usdt ratio
let tonToUsdtRatio = 1;
const fetchTonToUsdtRatio = (async () => {
  try {
    const coinPrice = await getCoinPrice();
    tonToUsdtRatio = coinPrice;
  } catch (e) {
    console.error(e.message);
  }
})();
// ---

// --- Navigation button click
// isFirstClick allows to fetch first domain items from myDomainsController
// and prevents the view from rendering additional items in the
// table for every "My domains" button click
let isFirstClick = true;
function navigateToMyDomainsView () {
  clear();
  if (isFirstClick) {
    isFirstClick = false;

    const { moreDomainsToDisplay, isShowMore } = myDomainsController.getNextDomainsToDisplay();
    if (moreDomainsToDisplay.length) {
      showMyDomainsContainer();
      rednerMoreDomains(moreDomainsToDisplay);
    } else {
      renderEmptyView();
    }

    if (!isShowMore) {
      hideShowMoreButton();
    }
  }
  window.history.pushState({}, 'TON DNS ', '#/my-domains');
  setScreen('myDomainsView');
}

$('#myDomainsButton').addEventListener('click', navigateToMyDomainsView);
$('#myDomainsMobileButton').addEventListener('click', () => {
  navigateToMyDomainsView();
  toggleMobileMenu();
});
// ---

// --- Load more button click
const showMoreButton = $('#myDomainsShowMoreButton');
showMoreButton.addEventListener('click', () => {
  const { moreDomainsToDisplay, isShowMore } = myDomainsController.getNextDomainsToDisplay();
  rednerMoreDomains(moreDomainsToDisplay);

  if (!isShowMore) {
    hideShowMoreButton();
  }
});

function hideShowMoreButton() {
  showMoreButton.style.display = 'none';
}
// ---

// --- Navigate to start screen
$('#noDomainsStartNowButton').addEventListener('click', () => {
  clear();
  window.history.pushState('', 'TON DNS ', '#');
  setScreen('startScreen');
});
// ---

const assembleRowData = (item) => {
  const domainName = item.name;
  const salePrice = TonWeb.utils.fromNano(getMinPrice(domainName));
  const expiryDate = new Date(item.expiring_at * 1000);
  
  return { domainName, salePrice, expiryDate };
}

const buildDomainCell = (cell, domain) => {
  cell.classList.add("my-domains-table-cell-first");

  const domainCellDiv = document.createElement('div');
  domainCellDiv.classList.add("my-domains-table-domain-cell");
  domainCellDiv.innerText = domain;
  cell.appendChild(domainCellDiv);
}

const buildSalePriceCell = (cell, priceInTON, priceInUSDT) => {
  cell.classList.add("my-domains-table-cell");

  const priceCellDiv = document.createElement('div');
  priceCellDiv.classList.add("my-domains-cell-container");

  const spanPriceInTON = document.createElement('span');
  spanPriceInTON.classList.add("my-domains-cell-price-title");
  spanPriceInTON.innerHTML = '&nbsp;'+formatNumber(priceInTON, 2);
  priceCellDiv.appendChild(spanPriceInTON);

  const spanPriceInUSDT = document.createElement('span');
  spanPriceInUSDT.classList.add("my-domains-cell-price-caption");
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
  desktopSpanPriceInUSDT.classList.add("my-domains-cell-expiry-caption-desktop");

  desktopSpanPriceInUSDT.innerText = formatDate(expiryDate); 
  node.appendChild(desktopSpanPriceInUSDT);
}

const buildMobileSpanPriceInUSDT = (node, expiryDate) => {
  const mobileSpanPriceInUSDT = document.createElement('span');
  mobileSpanPriceInUSDT.classList.add("my-domains-cell-expiry-caption-mobile");

  mobileSpanPriceInUSDT.innerText = formatDateShort(expiryDate); 
  node.appendChild(mobileSpanPriceInUSDT);
}

const buildExpiryDate = (cell, expiryDate) => {
  cell.classList.add("my-domains-table-cell");

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
  cell.classList.add("my-domains-table-cell-last");

  cell.classList.add('my-domains-table-last-cell');
  const rightChevronLottie = document.createElement('span');
  rightChevronLottie.classList.add('my-domains-right-arrow-icon');
  cell.appendChild(rightChevronLottie);
}

function showMyDomainsContainer() {
  const container = document.getElementById('myDomainsContainer');
  container.style.display = "flex";
}

function rednerMoreDomains(domains) {
  const myDomainsTableElement = $('.my-domains-table');
  for (const item of domains) {
    const { domainName, salePrice, expiryDate } = assembleRowData(item);
    const row = myDomainsTableElement.insertRow(-1);
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

function renderEmptyView() {
  const container = document.getElementById('noDomainsContainer');
  container.style.display = "flex";

  const view = document.getElementById('myDomainsView');
  view.style.justifyContent = 'center';
}