const $ = (selector) => document.querySelector(selector);

const getHistoryFromStorage = () => {
    try {
        const history = localStorage.getItem('dns__search__history');
        if (history) {
            return history.split(',');
        }
    } catch (e) {
        return []
    }

    return [];
}

const setHistoryToStorage = (history) => {
    try {
        localStorage.setItem('dns__search__history', history.join(','));
    } catch (e) {
        console.error(e);
    }
}

const toggle = (name, isVisible, display = 'flex', animate = true, transition) => {
    toggleByNode($(name), isVisible, display, animate, transition)
}

const toggleByNode = (node, isVisible, display = 'flex', animate = true, transition) => {
    if (!animate) {
        node.style.display = isVisible ? (display || 'flex') : 'none';
        return;
    }

    if (isVisible) {
        node.style.display = (display || 'flex');
        node.classList.add('fade');

        setTimeout(() => { node.classList.add('in') })
    } else {
        node.classList.remove('in');
        node.classList.add('fade');

        if (transition) {
            setTimeout(() => {
                node.style.display = 'none';
            }, 100)
        } else {
            node.style.display = 'none';
        }
    }
}

const toggleClassName = (element, shouldAdd, className) => {
    if (shouldAdd) {
        $(element).classList.add(className);
    } else {
        $(element).classList.remove(className);
    }
}

const shortAddress = (address) => {
    return address.substring(0, 8) + '...' + address.substring(address.length - 8);
}

const getMinPriceConfig = (domainCharCount) => {
    switch (domainCharCount) {
        case 4: return ['1000', '100'];
        case 5: return ['500', '50'];
        case 6: return ['400', '40'];
        case 7: return ['300', '30'];
        case 8: return ['200', '20'];
        case 9: return ['100', '10'];
        case 10: return ['50', '5'];
        default:
            return ['10', '1'];
    }
}

const getMinPrice = (domain) => {
    const arr = getMinPriceConfig(domain.length);
    let startMinPrice = TonWeb.utils.toNano(arr[0]);
    const endMinPrice = TonWeb.utils.toNano(arr[1]);
    const nowTime = Math.floor(Date.now() / 1000);
    const seconds = nowTime - AUCTION_START_TIME;
    const months = Math.floor(seconds / SEC_IN_ONE_MONTH);
    if (months > 21) {
        return endMinPrice;
    }
    for (let i = 0; i < months; i++) {
        startMinPrice = startMinPrice.mul(new TonWeb.utils.BN(90)).div(new TonWeb.utils.BN(100));
    }
    return startMinPrice;
}

const getAuctionDuration = () => {
    const auction_start_duration = 60 * 60 * 24 * 7; // 5 min (in mainnet 1 week)
    const auction_end_duration = 60 * 60; // 1 min (in mainnet 1 hour)

    const nowTime = Math.floor(Date.now() / 1000);
    const seconds = nowTime - AUCTION_START_TIME;
    let months = Math.floor(seconds / SEC_IN_ONE_MONTH);
    if (months > 12) {
        months = 12;
    }
    return auction_start_duration - (auction_start_duration - auction_end_duration) * months / 12;
}

const GRAM_USDT_POOL_ADDRESS = 'EQA-X_yo3fzzbDbJ_0bzFWKqtRuZFIRa1sJsveZJ1YpViO3r';
let ACTIVE_SCREEN;
let LAST_PRICE_UPDATED_DATE = null;
let LAST_PRICE;
let coinPriceRequest;

const fetchCoinPrice = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch('https://toncenter.com/api/v2/runGetMethodStd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': TONCENTER_API_KEY,
            },
            body: JSON.stringify({
                address: GRAM_USDT_POOL_ADDRESS,
                method: 'get_reserves',
                stack: [],
            }),
            signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.ok || data.result?.exit_code !== 0) {
            throw new Error('Failed to fetch GRAM/USDT reserves');
        }

        const gramReserve = Number(data.result.stack[0]?.number?.number) / 1e9;
        const usdtReserve = Number(data.result.stack[1]?.number?.number) / 1e6;
        const price = usdtReserve / gramReserve;
        if (!Number.isFinite(gramReserve) || gramReserve <= 0 || !Number.isFinite(price) || price <= 0) {
            throw new Error('Invalid GRAM/USDT reserves');
        }

        return price;
    } finally {
        clearTimeout(timeout);
    }
};

const getCoinPrice = () => {
    if (LAST_PRICE && LAST_PRICE_UPDATED_DATE && Date.now() - LAST_PRICE_UPDATED_DATE < 30000) {
        return Promise.resolve(LAST_PRICE);
    }

    if (!coinPriceRequest) {
        coinPriceRequest = fetchCoinPrice()
            .then((price) => {
                LAST_PRICE = price;
                LAST_PRICE_UPDATED_DATE = Date.now();

                return price;
            })
            .catch(() => 0)
            .finally(() => {
                coinPriceRequest = null;
            });
    }

    return coinPriceRequest;
}

function debounce(func, timeout = 300){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const onlyNumbers = (value) => {
    return value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
}

const setScreen = (name) => {
    ACTIVE_SCREEN = name
    toggle('#startScreen', name === 'startScreen')
    if (name === 'startScreen') {
        setTimeout(() => {
            $('.start-input').focus()
        }, 10)
    }

    toggle('#myDomainsView', name === 'myDomainsView', 'flex')
    toggle('#navInput',!['startScreen', 'myDomainsView'].includes(name), 'flex')
    toggle('.main', !['startScreen', 'myDomainsView'].includes(name))
    toggle('#auctionDomainScreen', name === 'auctionDomainScreen', 'block')
    toggle('#busyDomainScreen', name === 'busyDomainScreen', 'block')
    toggle('#freeDomainScreen', name === 'freeDomainScreen', 'block')
    toggle('#domainLoadingScreen', name === 'domainLoadingScreen', 'block')
    toggle('#domainStatus', !['main', 'myDomainsView'].includes(name))
    toggleClassName('nav .container-inner', !['startScreen', 'myDomainsView'].includes(name), 'squizedPadding')
    toggleClassName('.main', false, 'main--loading')

    if (name === 'auctionDomainScreen') {
        $('#domainStatus').classList.remove('busy')
        $('#domainStatus').classList.add('free')
        $('#domainStatus span').innerText = store.localeDict.auction
    } else if (name === 'freeDomainScreen') {
        $('#domainStatus').classList.remove('busy')
        $('#domainStatus').classList.add('free')
        $('#domainStatus span').innerText = store.localeDict.free
    } else if (name === 'busyDomainScreen') {
        // bugfix: resetting clock on busy domain screen
        $('#flip-clock-container').dataset.endDate = '';

        $('#domainStatus').classList.add('busy')
        $('#domainStatus').classList.remove('free')
        $('#domainStatus span').innerText = store.localeDict.busy;
    }
}

const setDomainToBrowserHistory = (domain) => {
    toggleClassName('#domainStatus', false, 'loading')

    window.history.pushState(
        domain,
        'TON DNS - ' + domain,
        '#' + encodeURIComponent(domain)
    )
}

const pushModalInfoToBrowserHistory = (step) => {
    const domainFromUrl = decodeURIComponent(window.location.hash.substring(1)).toLowerCase()

    window.history.pushState(
        { step },
        'TON DNS - ' + step,
        `#${domainFromUrl}`,
    )
}

const renderQr = (name, url, settings = {}) => {
    const {size = 288, margin = 10} = settings
    const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        data: url,
        image: './assets/qr_logo.svg',
        margin: margin,
        qrOptions: { typeNumber: '0', mode: 'Byte', errorCorrectionLevel: 'Q' },
        imageOptions: { hideBackgroundDots: true, imageSize: 0.2, margin: 4 },
        dotsOptions: { type: 'rounded', color: '#000000' },
        backgroundOptions: { color: '#F5F7FA' },
        type: 'svg',
        cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
        cornersDotOptions: { type: 'dot', color: '#000000' },
    })

    const canvasContainer = $(name)
    canvasContainer.innerHTML = ''
    qrCode.append(canvasContainer);
}

const setDomainName = (domain, node) => {
    node.classList.remove('domain__name--small')

    const nextDomainName = domain + '.ton';
    if (nextDomainName.length > 20) {
        node.classList.add('domain__name--small')
    }

    node.innerText = nextDomainName;
}


function setAddress(node, address) {
    node.innerText = shortAddress(address)
    node.dataset.dataAddress = address
}

function setError(node, message) {
    node.innerText = message
    toggle('.start-error', true)
    node.style.display = 'block'
}

function resetError(node) {
    node.innerText = ''
    toggle('.start-error', false)
    node.style.display = 'block'
}

function formatNumber(number, shorten) {
    if (shorten) {
        return Number(number).toLocaleString('en-US',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
    }

    return Number(number).toLocaleString('en-US', {
        maximumSignificantDigits: 10,
    })
}

function hideKeyboard() {
    document.activeElement.blur();
}

function scrollToTop() {
    window.scroll({top: 0})
}

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function setSubmitPriceLabel(node, label) {
    const svgNode = node.parentNode.querySelector('svg');

    if (label.length > 13) {
        node.innerText = '';

        if (svgNode.style.display !== 'none') {
            node.parentNode.querySelector('svg').style.display = 'none';
        }

        return;
    }

    if (svgNode.style.display === 'none') {
        svgNode.parentNode.querySelector('svg').style.display = 'block';
    }

    node.innerText = label
}

function isMobile () {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    if (window.innerWidth < 569) {
        check = true;
    }
    return check;
}

const setAppHeight = () => {
    const doc = document.body
    const prevHeight = doc.style.getPropertyValue('--app-height');

    let heightToSet;

    if (!prevHeight) {
        heightToSet = window.innerHeight
    } else {
        if (Number(prevHeight.replace('px', '')) === window.innerHeight) {
            return;
        }

        heightToSet = window.innerHeight
    }

    doc.style.setProperty('--app-height', `${heightToSet}px`)
}

const copyToClipboard = async (message, button, withIcon = true) => {
    try {
        await navigator.clipboard.writeText(message)

        if (withIcon) {
            button.style.backgroundImage = 'var(--copy--icon--completed)'

            setTimeout(() => {
                button.style.backgroundImage = 'var(--copy--icon)'
            }, 300)
        }
    } catch (e) {
        console.log(e)
    }
}

window.BROWSER = (function (agent) {
    switch (true) {
        case agent.indexOf("edge") > -1: return "MS Edge";
        case agent.indexOf("edg/") > -1: return "Edge ( chromium based)";
        case agent.indexOf("opr") > -1 && !!window.opr: return "Opera";
        case agent.indexOf("chrome") > -1 && !!window.chrome: return "Chrome";
        case agent.indexOf("trident") > -1: return "MS IE";
        case agent.indexOf("firefox") > -1: return "Mozilla Firefox";
        case agent.indexOf("safari") > -1: return "Safari";
        default: return "other";
    }
})(window.navigator.userAgent.toLowerCase());

function makePageVisible(){
    document.body.classList.remove('hidden')
}

function encodeHTML(str){
    return String(str).replace(/[^\w. ]/gi, function(c){
        return '&#'+c.charCodeAt(0)+';';
    });
}


function truncase(str, beginLength, endLength) {
    return str.slice(0, beginLength) + '...' + str.slice(-endLength)
}

function until(conditionFunction) {
    const poll = resolve => {
      if(conditionFunction()) resolve();
      else setTimeout(_ => poll(resolve), 400);
    }

    return new Promise(poll);
}

function addressToString(address, isTestNet = false) {
    return new TonWeb.Address(address).toString(true, true, true, isTestNet);
}

function normalizeAccountAddress(value) {
    if (!value) return null;
    try {
        const address = new TonWeb.Address(value);
        const rawAddress = address.toString(false).toUpperCase();
        if (typeof value === 'string' && !address.isUserFriendly && value.toUpperCase() !== rawAddress) {
            return null;
        }
        return rawAddress;
    } catch (error) {
        return null;
    }
}

function isSameAccount(first, second) {
    const address = normalizeAccountAddress(first);
    return address !== null && address === normalizeAccountAddress(second);
}

function isValidAddressForNetwork(value, isTestnet = false) {
    if (!normalizeAccountAddress(value)) return false;
    return isTestnet || !new TonWeb.Address(value).isTestOnly;
}

const displayAddressRequests = new WeakMap();

async function getDisplayAddress(address, isTestnet = false, previousAddress) {
    const rawAddress = normalizeAccountAddress(address);
    if (!rawAddress) return '';
    const fallbackAddress = previousAddress || addressToString(rawAddress, isTestnet);

    const controller = new AbortController();
    let timeoutId;
    const request = async () => {
        const book = await fetchToncenterIndex(
            'addressBook', { address: rawAddress }, isTestnet, controller.signal,
        );
        const entry = Object.entries(book).find(([key]) => normalizeAccountAddress(key) === rawAddress);
        const friendly = entry && entry[1] && entry[1].user_friendly;
        if (typeof friendly !== 'string') return fallbackAddress;

        const parsed = new TonWeb.Address(friendly);
        if (!parsed.isUserFriendly || parsed.isTestOnly !== isTestnet
            || parsed.toString(false).toUpperCase() !== rawAddress) return fallbackAddress;
        return parsed.toString(true, true, parsed.isBounceable, isTestnet);
    };

    try {
        return await Promise.race([
            request(),
            new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    controller.abort();
                    resolve(fallbackAddress);
                }, 10000);
            }),
        ]);
    } catch (error) {
        return fallbackAddress;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function setDisplayAddress(node, address, isTestnet, isCurrent) {
    if (!isCurrent()) return;
    const request = {};
    displayAddressRequests.set(node, request);
    if (!isSameAccount(node.dataset.dataAddress, address)) {
        node.innerText = '…';
        delete node.dataset.dataAddress;
    }
    const displayAddress = await getDisplayAddress(address, isTestnet, node.dataset.dataAddress);
    if (displayAddressRequests.get(node) === request && isCurrent()) {
        if (displayAddress) setAddress(node, displayAddress);
    }
}

async function getAuctionBidPayload(string) {
    let a = new TonWeb.boc.Cell();
    a.bits.writeUint(0, 32);
    a.bits.writeString(string);
    let payload = TonWeb.utils.bytesToBase64(await a.toBoc());

    return payload
}

async function getDnsBalanceReleasePayload() {
    const cell = new TonWeb.boc.Cell();
    cell.bits.writeUint(0x4ed14b65, 32);
    cell.bits.writeUint(0, 64); // query_id

    return TonWeb.utils.bytesToBase64(await cell.toBoc(false));
}

/**
 * Method to construct a transaction payload for updating a dns record.
 * Works for both claimed and unclaimed domains.
 * Creates op::change_dns_record = 0x4eb1f0f9;
 */
async function getChangeDnsRecordPayload(message) {
    const cell = new TonWeb.boc.Cell();
    cell.bits.writeUint(0x4eb1f0f9, 32);
    cell.bits.writeUint(0, 32); // queryId
    cell.bits.writeUint(0, 256);
    cell.bits.writeString(message);

    const cellBytes = await cell.toBoc(false);
    const payload = TonWeb.utils.bytesToBase64(cellBytes);

    return payload;
}

async function getManageDomainPayload(key, value) {
    const cell = await TonWeb.dns.DnsItem.createChangeContentEntryBody({
        category: key,
        value: value,
    });
    const cellBytes = await cell.toBoc(false);
    const payload = TonWeb.utils.bytesToBase64(cellBytes);

    return payload;
}

function openLink(href, target = '_self') {
	window.open(href, target, 'noreferrer noopener');
}

function addReturnStrategy(url, returnStrategy) {
	const link = new URL(url);
	link.searchParams.append('ret', returnStrategy);
	return link.toString();
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

function findSortedInsertIndex(arr, item, compareFunc) {
    let start = 0;
    let end = arr.length;

    while (start < end) {
        const mid = (start + end) >> 1;
        const comparisonResult = compareFunc(item, arr[mid]);

        if (comparisonResult === 0) {
            return mid;
        } else if (comparisonResult < 0) {
            end = mid;
        } else {
            start = mid + 1;
        }
    }

    return end;
}

function pushInOrder(arr, item, compareFunc) {
    const insetionIndex = findSortedInsertIndex(arr, item, compareFunc);
    arr.splice(insetionIndex, 0, item);
}

function sleep(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDate(date) {
    const month = store.localeDict.months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hour = date.getHours();
    let minute = date.getMinutes();
    minute = (minute < 10 ? '0' : '') + minute;

    return `${day} ${month} ${year} ${store.localeDict.at} ${hour}:${minute}`;
}

function formatDateShort(date) {
    const month = store.localeDict.months[date.getMonth()];
    const day = date.getDate();
    const hour = date.getHours();
    let minute = date.getMinutes();
    minute = (minute < 10 ? '0' : '') + minute;

    return `${day} ${month} ${store.localeDict.at} ${hour}:${minute}`;
}

function getDifferenceBetweenDates(futureDate, pastDate) {
    let delta = Math.abs(futureDate - pastDate) / 1000;

    const days = Math.floor(delta / 86400);
    delta -= days * 86400;

    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    
    return { days, hours, minutes };
}

// modalType: 'place a bid' | 'start expired auction' | 'renew' | 'manage domain'
function adjustPaymentModalCaption(modalType) {
    if (modalType === 'place a bid' || modalType === 'start expired auction') {
        $('#bidModalSubheader').innerText = store.localeDict.enter_amount;
        $('#bid__modal--bid__input').classList.remove('disabled__input');

        $('#bid__modal--submit__step--label_1').innerText = store.localeDict.place_label;
        $('#bid__modal--submit__step--label_2').innerText = store.localeDict.place_label_2;
        $('.bid__modal--payment #domainName--bid__modal--payment').innerText = store.localeDict.place_bid;
        $('.bid__modal--second__step #domainName--bid__modal--payment').innerText = store.localeDict.place_bid;

        $('#payment-message-success .payment__message--title').innerText = store.localeDict.payment_success_header;
        $('#payment-message-success .payment__message--description').innerText = store.localeDict.payment_success_description;

        return;
    }

    if (modalType === 'renew') {
        $('#bidModalSubheader').innerText = store.localeDict.renew_domain_explanation;
        $('#bid__modal--bid__input').classList.add('disabled__input');

        $('#bid__modal--submit__step--label_1').innerText = store.localeDict.pay;
        $('#bid__modal--submit__step--label_2').innerText = '';
        $('.bid__modal--payment #domainName--bid__modal--payment').innerText = store.localeDict.renew_domain;
        $('.bid__modal--second__step #domainName--bid__modal--payment').innerText = store.localeDict.renew_domain;

        $('#payment-message-success .payment__message--title').innerText = store.localeDict.payment_success_header;
        $('#payment-message-success .payment__message--description').innerText = '';

        return;
    }

    if (modalType === 'manage domain') {
        $('#bidModalSubheader').innerText = store.localeDict.manage_domain_payment_explanation;
        $('#bid__modal--bid__input').classList.add('disabled__input');

        $('#bid__modal--submit__step--label_1').innerText = store.localeDict.pay;
        $('#bid__modal--submit__step--label_2').innerText = '';
        $('.bid__modal--payment #domainName--bid__modal--payment').innerText = store.localeDict.manage_domain_payment_caption;
        $('.bid__modal--second__step #domainName--bid__modal--payment').innerText = store.localeDict.manage_domain_payment_caption;

        $('#payment-message-success .payment__message--title').innerText = store.localeDict.payment_success_header;
        $('#payment-message-success .payment__message--description').innerText = '';

        return;
    }
}


const DEFAULT_RETRY_AFTER_MS = 2000;
function getMsToSleep(retryHeaderString) {
    if (!retryHeaderString) {
        return DEFAULT_RETRY_AFTER_MS;
    }

    let msToSleep = Math.round(parseFloat(retryHeaderString) * 1000);
    if (isNaN(msToSleep)) {
        msToSleep = Math.max(0, new Date(retryHeaderString) - new Date());
    }
    return msToSleep;
}

async function fetchAndRetry(fetchFn) {
    try {
        const response = await fetchFn();
        
        if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const msToSleep = getMsToSleep(retryAfter);
            await sleep(msToSleep);
            return fetchAndRetry(fetchFn);
        }

        return response;
    } catch (e) {
        console.error(e);
    }
}

const TONCENTER_INDEX_MIN_REQUEST_INTERVAL_MS = 100;
const TONCENTER_INDEX_ADDRESS_BATCH_SIZE = 50;
const TONCENTER_INDEX_TRANSACTION_BATCH_SIZE = 10;
const TONCENTER_INDEX_HASH_BATCH_SIZE = 50;
const TONCENTER_INDEX_PAGE_LIMIT = 1000;
let toncenterIndexNextRequestAt = 0;

async function waitForToncenterIndexRequestSlot() {
    const requestAt = Math.max(Date.now(), toncenterIndexNextRequestAt);
    toncenterIndexNextRequestAt = requestAt + TONCENTER_INDEX_MIN_REQUEST_INTERVAL_MS;

    const delay = requestAt - Date.now();
    if (delay > 0) {
        await sleep(delay);
    }
}

function getToncenterIndexEndpoint(isTestnet = false) {
    return isTestnet
        ? TONCENTER_INDEX_ENDPOINT_TESTNET
        : TONCENTER_INDEX_ENDPOINT;
}

function getToncenterIndexApiKey(isTestnet = false) {
    return isTestnet
        ? TONCENTER_API_KEY_TESTNET
        : TONCENTER_API_KEY;
}

function getToncenterIndexHeaders(isTestnet = false) {
    return {
        'X-API-Key': getToncenterIndexApiKey(isTestnet),
    };
}

function appendSearchParam(searchParams, key, value) {
    if (value === undefined || value === null) {
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => appendSearchParam(searchParams, key, item));
        return;
    }

    searchParams.append(key, String(value));
}

async function readToncenterIndexResponse(response) {
    if (!response) {
        throw new Error('Toncenter v3 request failed');
    }

    const json = await response.json();
    if (!response.ok || json.error) {
        throw new Error(json.error || response.statusText);
    }

    return json;
}

async function fetchToncenterIndex(method, params = {}, isTestnet = false, signal) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => appendSearchParam(searchParams, key, value));

    const query = searchParams.toString();
    const endpoint = getToncenterIndexEndpoint(isTestnet);
    const url = `${endpoint}/${method}${query ? `?${query}` : ''}`;
    const response = await fetchAndRetry(async () => {
        await waitForToncenterIndexRequestSlot();
        if (signal?.aborted) throw new Error('Toncenter v3 request aborted');
        return fetch(url, {
            headers: getToncenterIndexHeaders(isTestnet),
            signal,
        });
    });

    return readToncenterIndexResponse(response);
}

function splitIntoBatches(items, batchSize = TONCENTER_INDEX_ADDRESS_BATCH_SIZE) {
    const batches = [];
    for (let offset = 0; offset < items.length; offset += batchSize) {
        batches.push(items.slice(offset, offset + batchSize));
    }
    return batches;
}

function getToncenterAddressKey(address) {
    const value = String(address || '');
    const rawAddressMatch = value.match(/^(-?\d+):([0-9a-fA-F]{64})$/);
    if (!rawAddressMatch) {
        return value;
    }

    return `${rawAddressMatch[1]}:${rawAddressMatch[2].toUpperCase()}`;
}

function getUniqueAddresses(addresses) {
    const addressesByKey = new Map();
    for (const address of addresses) {
        if (address) {
            addressesByKey.set(getToncenterAddressKey(address), address);
        }
    }
    return [...addressesByKey.values()];
}

async function fetchAccountStatesByAddresses(addresses, isTestnet = false) {
    const accountStates = [];
    const uniqueAddresses = getUniqueAddresses(addresses);

    for (const addressBatch of splitIntoBatches(uniqueAddresses)) {
        const result = await fetchToncenterIndex('accountStates', {
            address: addressBatch,
            include_boc: true,
        }, isTestnet);

        accountStates.push(...(result.accounts || []));
    }

    return accountStates;
}

function getDomainLastFillUpTimeFromDataBoc(dataBoc) {
    if (!dataBoc) {
        throw new Error('DNS item account state has no data BOC');
    }

    const dataCell = TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(dataBoc));
    const lastFillUpTimeBitLength = 64;
    const startBit = dataCell.bits.cursor - lastFillUpTimeBitLength;
    if (startBit < 0) {
        throw new Error('DNS item account state is too short');
    }

    let lastFillUpTime = 0;
    for (let bitIndex = startBit; bitIndex < dataCell.bits.cursor; bitIndex += 1) {
        lastFillUpTime = lastFillUpTime * 2 + (dataCell.bits.get(bitIndex) ? 1 : 0);
    }
    if (!Number.isSafeInteger(lastFillUpTime)) {
        throw new Error('DNS item last fill up time is outside the safe integer range');
    }

    return lastFillUpTime;
}

async function fetchDomainLastFillUpTimes(addresses, isTestnet = false) {
    const lastFillUpTimesByAddress = new Map();
    const accountStates = await fetchAccountStatesByAddresses(addresses, isTestnet);

    for (const accountState of accountStates) {
        try {
            const lastFillUpTime = getDomainLastFillUpTimeFromDataBoc(accountState.data_boc);
            lastFillUpTimesByAddress.set(
                getToncenterAddressKey(accountState.address),
                lastFillUpTime,
            );
        } catch (error) {
            console.error(`Failed to read DNS expiration from ${accountState.address}`, error);
        }
    }

    return lastFillUpTimesByAddress;
}

function normalizeDomainName(domain) {
    if (!domain) {
        return null;
    }

    return domain.endsWith('.ton') ? domain : `${domain}.ton`;
}

function getDomainNameFromNftItem(nftItem) {
    return normalizeDomainName(nftItem.content && nftItem.content.domain);
}

async function getDomainNameFromContract(address) {
    const dnsItem = new TonWeb.dns.DnsItem(tonweb.provider, { address });
    const domain = await dnsItem.methods.getDomain();
    return domain.endsWith('.ton') ? domain : `${domain}.ton`;
}

async function fetchDnsNftItemsByOwner(ownerAddress, isTestnet = false) {
    const collectionAddress = isTestnet ? TON_ROOT_ADDRESS_TESTNET : TON_ROOT_ADDRESS;
    const limit = 1000;
    const nftItems = [];
    let offset = 0;

    while (true) {
        const result = await fetchToncenterIndex('nft/items', {
            owner_address: ownerAddress,
            collection_address: collectionAddress,
            include_on_sale: true,
            limit,
            offset,
        }, isTestnet);

        const pageItems = result.nft_items || [];
        nftItems.push(...pageItems);

        if (pageItems.length < limit) {
            break;
        }

        offset += limit;
    }

    return nftItems;
}

async function fetchWonDnsAuctionsByBidder(bidderAddress, isTestnet = false) {
    if (isTestnet) {
        return [];
    }

    const limit = 1000;
    const auctions = [];
    let after;

    while (true) {
        const result = await fetchToncenterIndex('dns/activeAuctions', {
            bidder: bidderAddress,
            state: 'won',
            include_nft_items: true,
            after,
            limit,
        });

        auctions.push(...(result.auctions || []));

        if (!result.next_cursor) {
            break;
        }
        if (result.next_cursor === after) {
            throw new Error('Toncenter DNS auctions pagination cursor did not advance');
        }

        after = result.next_cursor;
    }

    return auctions;
}

function getDomainExpirationTime(lastFillUpTime) {
    return Number(lastFillUpTime) + Math.floor(MS_IN_ONE_LEAP_YEAR / 1000);
}

function isDomainInExpiringPeriod(expiringAt, expiringThreshold) {
    return Number.isFinite(expiringAt) && expiringAt <= expiringThreshold;
}

function getTonPriceFromNano(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    return TonWeb.utils.fromNano(value.toString());
}

async function assembleDomainItems(nftItems, lastFillUpTimesByAddress, expiringPeriodInDays) {
    const domainItems = [];
    const expiringThreshold = Math.floor(Date.now() / 1000) + expiringPeriodInDays * 24 * 60 * 60;

    for (const nftItem of nftItems) {
        const address = nftItem.address;
        const name = getDomainNameFromNftItem(nftItem) || await getDomainNameFromContract(address);
        const lastFillUpTime = lastFillUpTimesByAddress.get(getToncenterAddressKey(address));
        if (!Number.isFinite(lastFillUpTime)) {
            console.error(`The expiration time for the given domain (${name}) was not found`);
            continue;
        }

        const expiring_at = getDomainExpirationTime(lastFillUpTime);

        if (!isDomainInExpiringPeriod(expiring_at, expiringThreshold)) {
            continue;
        }

        const domainItem = {
            name,
            expiring_at,
            address,
            on_sale: nftItem.on_sale,
            sale_contract_address: nftItem.sale_contract_address,
            auction_contract_address: nftItem.auction_contract_address,
        };

        pushInOrder(domainItems, domainItem, (a, b) => {
            if (a.expiring_at < b.expiring_at) {
                return 1;
            }
            if (a.expiring_at > b.expiring_at) {
                return -1;
            }
            return 0;
        });
    }

    return domainItems;
}

function assembleAuctionDomainItems(auctions, expiringPeriodInDays) {
    const domainItems = [];
    const expiringThreshold = Math.floor(Date.now() / 1000) + expiringPeriodInDays * 24 * 60 * 60;

    for (const auction of auctions) {
        const nftItem = auction.nft_item || {};
        const address = auction.nft_item_address || nftItem.address;
        const name = normalizeDomainName(auction.domain) || getDomainNameFromNftItem(nftItem);
        const expiring_at = getDomainExpirationTime(auction.last_fill_up_time);

        if (!address || !name || !isDomainInExpiringPeriod(expiring_at, expiringThreshold)) {
            continue;
        }

        domainItems.push({
            name,
            expiring_at,
            address,
            on_sale: nftItem.on_sale,
            sale_contract_address: nftItem.sale_contract_address,
            auction_contract_address: nftItem.auction_contract_address,
            sale_price: getTonPriceFromNano(auction.max_bid_amount),
        });
    }

    return domainItems;
}

function mergeDomainItems(...domainItemGroups) {
    const domainItemsByAddress = new Map();

    for (const domainItem of domainItemGroups.flat()) {
        const existingItem = domainItemsByAddress.get(domainItem.address);
        if (!existingItem) {
            domainItemsByAddress.set(domainItem.address, domainItem);
            continue;
        }

        if (existingItem.sale_price === undefined || existingItem.sale_price === null) {
            existingItem.sale_price = domainItem.sale_price;
        }
    }

    return [...domainItemsByAddress.values()];
}

function isDomainDeploymentTransaction(transaction) {
    if (!transaction || !transaction.in_msg) {
        return false;
    }
    if (transaction.orig_status !== 'nonexist' && transaction.orig_status !== 'uninit') {
        return false;
    }
    if (transaction.end_status !== 'active') {
        return false;
    }
    if (transaction.description && transaction.description.aborted === true) {
        return false;
    }

    const { value } = transaction.in_msg;
    return value !== undefined && value !== null;
}

function isActiveNonAbortedTransaction(transaction) {
    if (!transaction || !transaction.in_msg) {
        return false;
    }
    if (transaction.orig_status !== 'active' || transaction.end_status !== 'active') {
        return false;
    }

    return !transaction.description || transaction.description.aborted !== true;
}

function isPotentialDomainAuctionBidTransaction(transaction) {
    if (!isActiveNonAbortedTransaction(transaction)) {
        return false;
    }

    const { decoded_opcode, opcode } = transaction.in_msg;
    return decoded_opcode === 'text_comment'
        || opcode === '0x00000000'
        || opcode === 0
        || opcode === null; // Toncenter represents an empty message body this way.
}

function isDomainReauctionStartTransaction(transaction) {
    if (!isActiveNonAbortedTransaction(transaction)) {
        return false;
    }

    const { decoded_opcode, opcode, value } = transaction.in_msg;
    if (value === undefined || value === null) {
        return false;
    }

    return decoded_opcode === 'dns_balance_release'
        || opcode === '0x4ed14b65'
        || opcode === 0x4ed14b65;
}

async function fetchAuctionBidActionsByTransactionHashes(transactionHashes, isTestnet = false) {
    const actions = [];
    const uniqueTransactionHashes = [...new Set(transactionHashes.filter(Boolean))];

    for (const transactionHashBatch of splitIntoBatches(
        uniqueTransactionHashes,
        TONCENTER_INDEX_HASH_BATCH_SIZE,
    )) {
        const result = await fetchToncenterIndex('actions', {
            tx_hash: transactionHashBatch,
            action_type: 'auction_bid',
            limit: TONCENTER_INDEX_PAGE_LIMIT,
            sort: 'desc',
        }, isTestnet);

        actions.push(...(result.actions || []));
    }

    return actions;
}

function getAuctionBidAddress(action) {
    const details = action && action.details;
    return details && (details.auction || details.nft_item);
}

function getAuctionBidAmount(action) {
    const details = action && action.details;
    return details && details.amount;
}

function getDomainTransactionKey(address, transactionHash) {
    if (!address || !transactionHash) {
        return null;
    }

    return `${getToncenterAddressKey(address)}:${transactionHash}`;
}

async function fetchDomainAuctionPrices(
    addresses,
    isTestnet = false,
    onAddressBatchLoaded = () => {},
) {
    const pricesByAddress = new Map();
    const uniqueAddresses = getUniqueAddresses(addresses);

    for (const addressBatch of splitIntoBatches(
        uniqueAddresses,
        TONCENTER_INDEX_TRANSACTION_BATCH_SIZE,
    )) {
        const missingAddressKeys = new Set(addressBatch.map(getToncenterAddressKey));
        let offset = 0;

        try {
            while (missingAddressKeys.size > 0) {
                const result = await fetchToncenterIndex('transactions', {
                    account: addressBatch,
                    limit: TONCENTER_INDEX_PAGE_LIMIT,
                    offset,
                    sort: 'desc',
                }, isTestnet);
                const transactions = result.transactions || [];

                const potentialBidTransactionHashes = transactions
                    .filter((transaction) => (
                        missingAddressKeys.has(getToncenterAddressKey(transaction.account))
                        && isPotentialDomainAuctionBidTransaction(transaction)
                    ))
                    .map((transaction) => transaction.hash);
                const auctionBidActions = await fetchAuctionBidActionsByTransactionHashes(
                    potentialBidTransactionHashes,
                    isTestnet,
                );

                const potentialBidTransactionHashSet = new Set(potentialBidTransactionHashes);
                const auctionBidAmountsByTransaction = new Map();
                for (const action of auctionBidActions) {
                    const amount = getAuctionBidAmount(action);
                    const address = getAuctionBidAddress(action);
                    if (
                        action.success !== true
                        || !address
                        || !Array.isArray(action.transactions)
                        || amount === undefined
                        || amount === null
                    ) {
                        continue;
                    }

                    for (const transactionHash of action.transactions) {
                        if (!potentialBidTransactionHashSet.has(transactionHash)) {
                            continue;
                        }

                        const transactionKey = getDomainTransactionKey(address, transactionHash);
                        if (transactionKey) {
                            auctionBidAmountsByTransaction.set(transactionKey, amount);
                        }
                    }
                }

                for (const transaction of transactions) {
                    const addressKey = getToncenterAddressKey(transaction.account);
                    if (!missingAddressKeys.has(addressKey)) {
                        continue;
                    }

                    const transactionKey = getDomainTransactionKey(
                        transaction.account,
                        transaction.hash,
                    );
                    if (transactionKey && auctionBidAmountsByTransaction.has(transactionKey)) {
                        pricesByAddress.set(
                            addressKey,
                            auctionBidAmountsByTransaction.get(transactionKey),
                        );
                        missingAddressKeys.delete(addressKey);
                        continue;
                    }

                    if (isDomainReauctionStartTransaction(transaction)) {
                        pricesByAddress.set(addressKey, transaction.in_msg.value);
                        missingAddressKeys.delete(addressKey);
                        continue;
                    }

                    if (!isDomainDeploymentTransaction(transaction)) {
                        continue;
                    }

                    pricesByAddress.set(addressKey, transaction.in_msg.value);
                    missingAddressKeys.delete(addressKey);
                }

                if (missingAddressKeys.size === 0 || transactions.length < TONCENTER_INDEX_PAGE_LIMIT) {
                    break;
                }

                offset += TONCENTER_INDEX_PAGE_LIMIT;
            }
        } catch (error) {
            console.error('Failed to load DNS auction prices from Toncenter', error);
        }

        const batchPricesByAddress = new Map();
        for (const address of addressBatch) {
            const addressKey = getToncenterAddressKey(address);
            if (pricesByAddress.has(addressKey)) {
                batchPricesByAddress.set(addressKey, pricesByAddress.get(addressKey));
            }
        }
        onAddressBatchLoaded(batchPricesByAddress, addressBatch);
    }

    return pricesByAddress;
}

async function attachDomainSalePrices(
    domainItems,
    isTestnet = false,
    onSalePricesUpdated = () => {},
) {
    const domainsWithoutPrice = domainItems.filter((domainItem) => (
        domainItem.address
        && (domainItem.sale_price === undefined || domainItem.sale_price === null)
    ));
    const domainsByAddress = new Map(domainsWithoutPrice.map((domainItem) => (
        [getToncenterAddressKey(domainItem.address), domainItem]
    )));

    await fetchDomainAuctionPrices(
        domainsWithoutPrice.map((domainItem) => domainItem.address),
        isTestnet,
        (pricesByAddress, addressBatch) => {
            const updatedDomainItems = [];

            for (const address of addressBatch) {
                const addressKey = getToncenterAddressKey(address);
                const domainItem = domainsByAddress.get(addressKey);
                if (!domainItem) {
                    continue;
                }

                const price = pricesByAddress.get(addressKey);
                try {
                    if (price === undefined || price === null) {
                        console.error(`The auction price for the given domain (${domainItem.name}) was not found`);
                        domainItem.sale_price = null;
                    } else {
                        domainItem.sale_price = getTonPriceFromNano(price);
                    }
                } catch (error) {
                    console.error(`Failed to parse the sale price for ${domainItem.name}`, error);
                    domainItem.sale_price = null;
                }

                updatedDomainItems.push(domainItem);
            }

            onSalePricesUpdated(updatedDomainItems);
        },
    );

    return domainItems;
}

async function fetchExpiringDomains(accountAddress, period, isTestnet = false) {
    const nftItems = await fetchDnsNftItemsByOwner(accountAddress, isTestnet);
    const [lastFillUpTimesByAddress, wonAuctions] = await Promise.all([
        fetchDomainLastFillUpTimes(nftItems.map((nftItem) => nftItem.address), isTestnet),
        fetchWonDnsAuctionsByBidder(accountAddress, isTestnet).catch((error) => {
            console.error('Failed to load won DNS auctions from Toncenter', error);
            return [];
        }),
    ]);

    const ownedDomainItems = await assembleDomainItems(nftItems, lastFillUpTimesByAddress, period);
    const auctionDomainItems = assembleAuctionDomainItems(wonAuctions, period);
    const domainItems = mergeDomainItems(ownedDomainItems, auctionDomainItems);

    return domainItems.sort((a, b) => b.expiring_at - a.expiring_at);
}
