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

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/the-open-network/'
let ACTIVE_SCREEN;
let LAST_PRICE_UPDATED_DATE = null
let LAST_PRICE;

const getCoinPrice = () => {
    if (LAST_PRICE_UPDATED_DATE && (Date.now() - LAST_PRICE_UPDATED_DATE < 100 * 60 * 5)) { // 30 sec
        return Promise.resolve(LAST_PRICE)
    }

    return fetch(COINGECKO_URL)
        .then((res) => res.json())
        .then((res) => {
            LAST_PRICE = res.market_data.current_price.usd
            LAST_PRICE_UPDATED_DATE = Date.now()

            return res.market_data.current_price.usd
        })
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
    toggle('#navInput', name !== 'startScreen', 'flex')
    toggle('.main', name !== 'startScreen')
    toggle('#auctionDomainScreen', name === 'auctionDomainScreen', 'block')
    toggle('#busyDomainScreen', name === 'busyDomainScreen', 'block')
    toggle('#freeDomainScreen', name === 'freeDomainScreen', 'block')
    toggle('#domainLoadingScreen', name === 'domainLoadingScreen', 'block')
    toggle('#domainStatus', name !== 'main')
    toggleClassName('nav .container-inner', name !== 'startScreen', 'squizedPadding')
    toggleClassName('.main', false, 'main--loading')

    if (name === 'auctionDomainScreen') {
        $('#domainStatus').classList.remove('busy')
        $('#domainStatus').classList.add('free')
        $('#domainStatus span').innerText = locale.auction
    } else if (name === 'freeDomainScreen') {
        $('#domainStatus').classList.remove('busy')
        $('#domainStatus').classList.add('free')
        $('#domainStatus span').innerText = locale.free
    } else if (name === 'busyDomainScreen') {
        $('#domainStatus').classList.add('busy')
        $('#domainStatus').classList.remove('free')
        $('#domainStatus span').innerText = locale.busy
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

const renderQr = (name, url) => {
    const qrCode = new QRCodeStyling({
        width: 288,
        height: 288,
        data: url,
        image: './assets/qr_logo.svg',
        margin: 10,
        qrOptions: { typeNumber: '0', mode: 'Byte', errorCorrectionLevel: 'Q' },
        imageOptions: { hideBackgroundDots: true, imageSize: 0.3, margin: 4 },
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

function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
