MS_IN_ONE_LEAP_YEAR = 31622400000
SEC_IN_ONE_MONTH = 2592000

const DOMAIN_RENEW_LIMIT_IN_DAYS = 180;
const RENEW_DOMAIN_PRICE = 0.015;
const MANAGE_DOMAIN_PRICE = 0.05;

let LOCALE_CONTROLLER = new LocaleController({store, localeDict: 'index'}).init()

$('#navInputElement').placeholder = store.localeDict.start_input_placeholder
$('#startInputElement').placeholder = store.localeDict.start_input_placeholder

const IS_TESTNET = window.location.href.indexOf('testnet=true') > -1

const AUCTION_START_TIME = IS_TESTNET ? 1659125865 : 1659171600

const tonscanUrl = IS_TESTNET ? TONSCAN_ENDPOINT_TESTNET : TONSCAN_ENDPOINT

const toncenterUrl = IS_TESTNET
    ? TONCENTER_ENDPOINT_TESTNET
    : TONCENTER_ENDPOINT

const tonRootAddress = IS_TESTNET
    ? new TonWeb.Address(
        TON_ROOT_ADDRESS_TESTNET
    ).toString(true, true, true, true)
    : TON_ROOT_ADDRESS // .ton root smart contract in bounceable form

const tonweb = new TonWeb(
    new TonWeb.HttpProvider(toncenterUrl, {
        apiKey: IS_TESTNET
            ? TONCENTER_API_KEY_TESTNET
            : TONCENTER_API_KEY,
    })
)

const walletController = new WalletController({store})
const myDomainsController = new MyDomainsController();
const testnetController = new TestnetController()

makePageVisible()

const dnsCollection = new TonWeb.dns.DnsCollection(tonweb.provider, {
    address: tonRootAddress,
})

if (IS_TESTNET) {
    toggle('.testnet-badge', true, 'flex')
}

// UI
let updateIntervalId = 0
let auctionTimerIntervalId = 0
let freeQrUrl = null
let auctionQrUrl = null
let currentDomain = null
let currentOwner = null
let currentDnsItem = null
let previousBid = null

const removeListeners = {}
const DEFAULT_CARETE_HELPER_TEXT = '.ton'
const OFFSET_BETWEEN_TEXT_AND_CARRETE = 1

const FREE_DOMAIN_TYPE = 'free'
const BUSY_DOMAIN_TYPE = 'busy'
const AUCTION_DOMAIN_TYPE = 'auction'
let domainType = null

function isDomainFree(domainType){
    return domainType === FREE_DOMAIN_TYPE
}

const clear = () => {
    clearInterval(updateIntervalId)
    clearInterval(auctionTimerIntervalId)
    freeQrUrl = null
    auctionQrUrl = null
    currentDomain = null
    currentOwner = null
    currentDnsItem = null
    $('#busyDomainScreen').classList.remove('edit-expand')
    $('#busyDomainScreen').classList.remove('edit-loading')
    $('.main').classList.remove('edit-expand')
    $('.main').classList.remove('edit-loading')
}

$('.badge__dns').addEventListener('click', () => {
    clear()
    window.history.pushState('', 'TON DNS ', '#')
    setScreen('startScreen')
})

$('.badge__dns-mobile').addEventListener('click', () => {
    clear()
    closeMenu()
    window.history.pushState('', 'TON DNS ', '#')
    setScreen('startScreen')
})

// SET DOMAIN

const validateDomain = (domain) => {
    if (domain.length < 4 || domain.length > 126) {
        return store.localeDict.error_length
    }

    for (let i = 0; i < domain.length; i++) {
        if (domain.charAt(i) === '.') {
            return store.localeDict.subdomains_not_allowed
        }
        const char = domain.charCodeAt(i)
        const isHyphen = char === 45
        const isValidChar =
            (isHyphen && i > 0 && i < domain.length - 1) ||
            (char >= 48 && char <= 57) ||
            (char >= 97 && char <= 122) // '-' or 0-9 or a-z ;  abcdefghijklmnopqrstuvwxyz-0123456789

        if (!isValidChar) {
            return store.localeDict.invalid_chars
        }
    }
}

const setDomain = (domain, isTimerMounted) => {
    scrollToTop()
    currentDomain = domain

    const loadDomain = async (setShimmers) => {
        if (setShimmers) {
            if (!isTimerMounted) {
                FlipTimer.unmountTimers()
            }
            setScreen('domainLoadingScreen')
            renderDomainLoadingScreen()
        } else {
            if (ACTIVE_SCREEN ==='auctionDomainScreen') {
                renderStatusLoading()
            }
        }

        const domainAddress = await dnsCollection.resolve(
            domain,
            TonWeb.dns.DNS_CATEGORY_NEXT_RESOLVER,
            true
        )
        const domainAddressString = domainAddress.toString(
            true,
            true,
            true,
            IS_TESTNET
        )
        const accountInfo = await tonweb.provider.getAddressInfo(
            domainAddressString
        )

        let dnsItem
        let domainExists = accountInfo.state === 'active'
        let ownerAddress = null

        if (domainExists) {
            dnsItem = new TonWeb.dns.DnsItem(tonweb.provider, {
                address: domainAddress,
            })
            const data = await dnsItem.methods.getData()
            if (!data.isInitialized) {
                domainExists = false
            } else {
                ownerAddress = data.ownerAddress
            }
        }
        let auctionInfo = null
        if (domainExists && !ownerAddress) {
            auctionInfo = await dnsItem.methods.getAuctionInfo()
            if (auctionInfo.auctionEndTime < Date.now() / 1000) {
                ownerAddress = auctionInfo.maxBidAddress
            }
        }
        let lastFillUpTime = 0
        if (domainExists && ownerAddress) {
            lastFillUpTime = await dnsItem.methods.getLastFillUpTime()
        }

        if (currentDomain === domain) {
            if (!domainExists) {
                storeDomainStatus('free')
                renderFreeDomain(domain)
                setScreen('freeDomainScreen')
            } else if (ownerAddress) {
                currentOwner = ownerAddress.toString(false, true, true, IS_TESTNET);
                $('#manageDomainGoBackBtn').style.display = 'none';
                const isTakenByUser = walletController.getAccountAddress() === currentOwner;

                // GG INTEGRATION
                let ggDomainData = null;
                let ggDomainState = null;

                hideGGElements(domain);
                // GG INTEGRATION

                if (isTakenByUser) {
                    $('#infoBtn').style.display = 'none';
                    $('#manageDomainBtn').style.display = 'inline-flex';

                    // ---
                    // Always allow to renew a domain if it's expried OR
                    // allow to renew it only if the expiry date is within the specified limit
                    const lastFillUpTime = await dnsItem.methods.getLastFillUpTime();
                    const expiryDate = new Date(lastFillUpTime * 1000 + MS_IN_ONE_LEAP_YEAR);

                    const isDomainExpired = expiryDate.getTime() <= new Date().getTime();
                    const { days } = getDifferenceBetweenDates(expiryDate, new Date()); // always returns absolute difference

                    const isDomainRenewable = isDomainExpired || days <= DOMAIN_RENEW_LIMIT_IN_DAYS;
                    if (isDomainRenewable) {
                        $('#renewDomainButton').style.display = 'inline-flex';
                    } else {
                        $('#renewDomainButton').style.display = 'none';
                    }
                    // ---
                } else {
                    $('#infoBtn').style.display = 'inline-flex';
                    $('#manageDomainBtn').style.display = 'none';
                    $('#renewDomainButton').style.display = 'none';

                    // GG INTEGRATION
                    const lastFillUpTime = await dnsItem.methods.getLastFillUpTime();
                    const expiryDate = new Date(lastFillUpTime * 1000 + MS_IN_ONE_LEAP_YEAR);
                    const isDomainExpired = expiryDate.getTime() <= new Date().getTime();

                    if (!isDomainExpired) {
                        ggDomainData = await getGGDomainData(domainAddressString);
                    }
                    // GG INTEGRATION
                }

                currentDnsItem = dnsItem
                storeDomainStatus('busy')
                renderBusyDomain(
                    domain,
                    domainAddressString,
                    ownerAddress.toString(true, true, true, IS_TESTNET),
                    lastFillUpTime,
                    isTakenByUser
                )

                // GG INTEGRATION
                if (!!ggDomainData) {
                    renderGGElements(ggDomainData, domain);

                    if (!!ggDomainData.sale) {
                        ggDomainState = 'onSale';
                    } else if (!!ggDomainData.auction) {
                        ggDomainState = 'onAuction';
                    }
                }
                // GG INTEGRATION

                setScreen('busyDomainScreen', ggDomainState)
            } else {
                storeDomainStatus('auction')
                renderAuctionDomain(domain, domainAddressString, auctionInfo)
                setScreen('auctionDomainScreen')
            }
        }
    }

    clearInterval(auctionTimerIntervalId)
    freeQrUrl = null
    auctionQrUrl = null
    currentOwner = null
    currentDnsItem = null
    $('#busyDomainScreen').classList.remove('edit-expand')
    $('.main').classList.remove('edit-expand')
    $('#navInput input').value = ''
    $('.start-input').value = ''
    setCareeteHelperValue('')

    setDomainName(domain, $('#domainName'))
    setScreen('main')

    clearInterval(updateIntervalId)
    updateIntervalId = setInterval(() => loadDomain(), 10 * 1000)
    return loadDomain(true)
}

let currentDomainStatus = null

const storeDomainStatus = (status) => {
    if (status !== currentDomainStatus) {
        closeBidModal()
    }

    currentDomainStatus = status
}

function closeBidModal() {
    toggle('.bid__modal--backdrop', false, 'flex', true, 200)
    toggle('.bid__modal', false)
    toggle('.bid__modal--first__step', false)
    toggle('.bid__modal--second__step', false)

    $('.bid__modal').style.justifyContent = 'center'
    $('#otherPaymentsMethods svg').classList.remove('rotate')
    $('#otherPaymentsMethodsContainer').classList.remove('show')
    $('#otherPaymentsMethodsContainer').style.display = 'none'
    $('body').classList.remove('scroll__disabled')
    $('#otherPaymentsMethods').removeEventListener('click', renderOtherPaymentsMethods)
}

const onInput = (e) => {
    if (e.key === 'Enter') {
        let domain = e.target.value.toLowerCase().trim()
        if (domain.endsWith('.ton')) {
            domain = domain.substring(0, domain.length - 4)
        }
        const error = validateDomain(domain)
        if (error) {
            setError($('.start-error'), error)
            closeHistoryContainer(e.target)
        } else {
            const history = getHistoryFromStorage().filter((item) => item !== domain)
            history.unshift(domain);

            setDomainToBrowserHistory(domain)
            setDomain(domain).then(() => {
                analyticService.sendEvent({type: 'view_domain_info'})
            })
            setHistoryToStorage(history.slice(0, 4))
            closeHistoryContainer(e.target)
        }

        hideKeyboard();
    } else {
        resetError($('.start-error'))
    }
}

$('.start-input').addEventListener('input', (e) => {
    setCareeteHelperValue(e.target.value)
})

$('.start-input').addEventListener('keydown', onInput)

$('#navInput input').addEventListener('keydown', onInput)

const processUrl = () => {
    const backdrop = $('.bid__modal--backdrop')

    if (backdrop.style.display === 'flex') {
        closeBidModal()
        return;
    }

    const domainFromUrl = decodeURIComponent(window.location.hash.substring(1)).toLowerCase()

    if (domainFromUrl === currentDomain) {
        return;
    }

    clear()

    if (domainFromUrl) {
        const error = validateDomain(domainFromUrl)

        if (domainFromUrl === '/my-domains') {
            if (walletController.isLoggedInSync()) {
                // before laoding the domain list we need to check if account authenticated
                // so if a user is not logged-in and tries to navigate to '/my-domains',
                // user will be redirected to strat screen
                setScreen('myDomainsView');
                return;
            } else {
                window.history.pushState('', 'TON DNS ', '#')
            }
        }

        if (error) {
            setScreen('startScreen')
        } else {
            setDomain(domainFromUrl).then(() => {
                analyticService.sendEvent({type: 'view_domain_info'})
            })
        }
    } else {
        setScreen('startScreen')
    }
}
processUrl()

window.onpopstate = () => processUrl()

// RENDER UI

function renderDomainLoadingScreen() {
    $('.main').classList.toggle('main--loading')
}

let timeoutId = null;

function renderStatusLoading() {
    if (timeoutId) {
        return;
    }

    $('#domainStatus').classList.add('loading')

    timeoutId = setTimeout(() => {
        clearTimeout(timeoutId)
        timeoutId = null;
        $('#domainStatus').classList.remove('loading')
    }, 2000)

}

const renderAuctionDomain = (domain, domainItemAddress, auctionInfo) => {
    domainType = AUCTION_DOMAIN_TYPE

    const auctionEndTime = auctionInfo.auctionEndTime // unixtime
    const bestBidAmount = auctionInfo.maxBidAmount
    const bestBidAddress = auctionInfo.maxBidAddress.toString(
        true,
        true,
        true,
        IS_TESTNET
    )

    const prevDate = $('#auction-bid-flip-clock-container').dataset.endDate
    const endDate = new Date(auctionEndTime * 1000)
    const isDateEqual = String(prevDate) === String(endDate)

    if (!isDateEqual){
        $('#auction-bid-flip-clock-container').dataset.endDate = endDate
        FlipTimer.addTimer('#auction-bid-flip-clock-container', true)
    }

    const auctionAmount = TonWeb.utils.fromNano(bestBidAmount)

    if (previousBid !== auctionAmount) {
        closeBidModal()
    }

    previousBid = auctionAmount


    $('#auctionAmount').innerText = formatNumber(auctionAmount, false)

    setAddress($('#auctionOwnerAddress'), bestBidAddress)

    const minBet = TonWeb.utils.fromNano(
        bestBidAmount.mul(new TonWeb.utils.BN(105)).div(new TonWeb.utils.BN(100))
    )

    $('#auctionMinBet').innerText = formatNumber(minBet, false)

    const bidStep = TonWeb.utils.fromNano(
        bestBidAmount
            .mul(new TonWeb.utils.BN(105))
            .div(new TonWeb.utils.BN(100))
            .sub(bestBidAmount)
    )
    const bidStepToPercent = (bidStep / auctionAmount) * 100

    $('#auctionBidStep').innerText = formatNumber(bidStep, false)
    $('#auctionBidStepConverted').innerText = formatNumber(bidStepToPercent.toFixed(2))

    attachPaymentModalListeners('place a bid', domain, minBet, '#auctionBtn', domainItemAddress)

    getCoinPrice().then((price) => {
        if (price) {
            $('#auctionAmountConverted').innerText = formatNumber(auctionAmount * price, 2)
        }
        if (price) {
            $('#auctionMinBetConverted').innerText = formatNumber(minBet * price, 2)
        }

    })
}

const renderFreeDomain = async (domain) => {
    domainType = FREE_DOMAIN_TYPE

    const salePrice = TonWeb.utils.fromNano(getMinPrice(domain))

    $('#freeMinBet').innerText = formatNumber(salePrice, false)

    $('#bid-flip-clock-container').dataset.endDate = new Date(
        Date.now() + getAuctionDuration() * 1000
    ).toISOString()
    FlipTimer.addTimer('#bid-flip-clock-container', false)

    attachPaymentModalListeners('place a bid', domain, salePrice, '#bidButton')

    getCoinPrice().then((price) => {
        if (price) {
            $('#freeMinBetConverted').innerText = formatNumber(salePrice * price, 2)
        }
    }).catch((e) => {
        console.error(e)
    })
}

const renderBusyDomain = (
    domain,
    domainItemAddress,
    ownerAddress,
    lastFillUpTime,
    isTakenByUser,
) => {
    domainType = BUSY_DOMAIN_TYPE

    setAddress($('#busyOwnerAddress'), ownerAddress)
    const expiresDate = new Date(lastFillUpTime * 1000 + MS_IN_ONE_LEAP_YEAR)
    const prevDate = $('#flip-clock-container').dataset.endDate
    const isDateEqual = String(prevDate) === String(expiresDate)

    const formattedExpiryDate = expiresDate.toISOString().slice(0, 10).split('-').reverse().join(".");

    if (isTakenByUser) {
        attachPaymentModalListeners('renew', domain, RENEW_DOMAIN_PRICE, '#renewDomainButton', domainItemAddress)
    }

    if (isDateEqual) {
        return;
    }

    $('#flip-clock-container').dataset.endDate = expiresDate
    FlipTimer.addTimer('#flip-clock-container', true)

    const isDomainExpired = expiresDate.getTime() <= new Date().getTime();
    if (isDomainExpired) {
        $('#busyDomainYetToExpire').style.display = 'none';
        $('#busyDomainAlreadyExpired').style.display = 'inline';
        $('#busyDomainAlreadyExpired #expiredDate').innerText = formattedExpiryDate;
    } else {
        $('#busyDomainYetToExpire').style.display = 'inline';
        $('#busyDomainAlreadyExpired').style.display = 'none';
        $('#expiresDate').innerText = formattedExpiryDate;
    }
}

const renderSearchHistory = (node) => {
    const historyContainer = renderHistoryContainer(node)
    const history = getHistoryFromStorage()

    if (!historyContainer) {
        return
    }

    node.classList.add('focus')

    if (!history.length) {
        node.addEventListener('blur', handleBlur)
        historyContainer.style.display = 'none'
        return
    }

    toggle('.start-error', false)

    try {
        const historyMarkup = getHistoryFromStorage().map(
            (historyRecord) => {
                const sanitizedValue = encodeHTML(historyRecord)

                return `<button class="hover__button" data-record="${sanitizedValue}">
                    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.99939 12C2.99939 7.02944 7.02883 3 11.9994 3C16.97 3 20.9994 7.02944 20.9994 12C20.9994 16.9706 16.97 21 11.9994 21C9.44416 21 7.13764 19.9351 5.49939 18.225" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M0.999981 10.9999L2.98998 13.4399L4.97998 10.9999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12.0273 7.15381V12.3461H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="text--overflow__hidden" data-record="${sanitizedValue}">
                    	<span>${sanitizedValue}</span>
                    </div>
                    <svg data-record="${sanitizedValue}" class="icon history__record remove" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.00012 18L18.0001 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        <path d="M6.00012 6L17.9986 18.0015" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
            `
            }
        )

        historyContainer.innerHTML = historyMarkup.join('')
        toggleByNode(historyContainer, true, 'block')
    } catch (e) {
        console.log(e)
        return
    }

    const handleClickOutside = (e) => {
        if (!node.parentNode.contains(e.target)) {
            removeListeners()
            closeHistoryContainer(node)
            handleBlur()
        }
    }

    const onHistoryRecordClick = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const shouldBeClosed = e.target.classList.contains('remove')
            || e.target.parentNode.classList.contains('remove')

        if (shouldBeClosed) {
            const domain = e.target.parentNode.dataset.record
            let historyFromStorage = getHistoryFromStorage()

            if (historyFromStorage.includes(domain)) {
                historyFromStorage.splice(historyFromStorage.indexOf(domain), 1)
            }

            setHistoryToStorage(historyFromStorage)
            removeListeners()
            renderSearchHistory(node)

            historyFromStorage = getHistoryFromStorage()

            if (!historyFromStorage.length) {
                node.classList.remove('focus')
            }

            return
        }

        const domain = e.target.parentNode.dataset.record || e.target.dataset.record

        if (!domain) {
            return
        }

        setDomainToBrowserHistory(domain)
        setDomain(domain).then(() => {
            analyticService.sendEvent({type: 'view_domain_info'})
        })
        closeHistoryContainer(node)
    }

    const removeListeners = () => {
        historyContainer.removeEventListener('click', onHistoryRecordClick, false)
        window.removeEventListener('mousedown', handleClickOutside, false)
        window.removeEventListener('touchstart', handleClickOutside, false)
    }

    function handleBlur() {
        node.classList.remove('focus')
        hideKeyboard()
    }

    removeListeners()

    historyContainer.addEventListener('click', onHistoryRecordClick, false)
    window.addEventListener('mousedown', handleClickOutside, false)
    window.addEventListener('touchstart', handleClickOutside, false)
}

const attachPaymentModalListeners = (
    modalType,
    domain,
    price,
    modalButton,
    address,
) => {
    if (removeListeners[modalButton]) {
        removeListeners[modalButton]()
    }
    const showOtherPaymentMethods = $('#otherPaymentsMethods')

    const togglePaymentModalOnClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        togglePaymentModal({
            modalType,
            domain,
            price,
            address,
        });
    }

    $(modalButton).addEventListener('click', togglePaymentModalOnClick, false)
    showOtherPaymentMethods.addEventListener('click', renderOtherPaymentsMethods)

    removeListeners[modalButton] = () => {
        $(modalButton).removeEventListener('click', togglePaymentModalOnClick, false)
        showOtherPaymentMethods.removeEventListener('click', renderOtherPaymentsMethods)
    }
}

function togglePaymentModal({
    modalType,
    domain,
    price,
    address,
    payloadIn,
    validUntilTimeMS = 1000000, // 16.7 min
}) {
    let localPrice = price;
    let paymentStatus = null;
    const destinationAddress = address || tonRootAddress;
    const bidModalInput = $("#bid__modal--bid__input")
    const submitStepButton = $("#bid__modal--submit__step")
    const submitPriceLabel = $("#bid__modal--submit__price")
    const convertedPriceSlot = $("#bid__input--converted__price")
    const error = $(".bid__input--error")
    const backdrop = $('.bid__modal--backdrop')
    const paymentLoadingWallet = $('#payment-loading-wallet')
    const paymentCloseButton = $('#paymentCloseButton')
    const qrContainer = $('#freeQr')
    const paymentLottieLoading = $('#paymentLottieLoading')
    const paymentLottieSuccess = $('#paymentLottieSuccess')
    const paymentLottieFailure = $('#paymentLottieFailure')
    const showOtherPaymentMethods = $('#otherPaymentsMethods')

    adjustPaymentModalCaption(modalType)

    const mask = IMask(bidModalInput, {
        mask: Number,
        signed: false,
        min: 0,
        scale: 100,
        radix: '.',
        mapToRadix: [','],
    });

    const handleBidInput = (e) => {
        e.preventDefault()
        e.stopPropagation()

        localPrice = Number(e.target.value)
        let priceToConvert = localPrice

        if (localPrice >= price) {
            setSubmitPriceLabel(submitPriceLabel, formatNumber(localPrice, false))
        } else {
            setSubmitPriceLabel(submitPriceLabel, formatNumber(price, false))
            priceToConvert = price
        }

        if (Number(localPrice) < Number(price)) {
            submitStepButton.setAttribute('disabled', true)
            convertedPriceSlot.style.display = 'none'
            error.style.display = 'block'
        } else {
            submitStepButton.removeAttribute('disabled')
            convertedPriceSlot.style.display = 'block'
            error.style.display = 'none'

            debouncedRenderConvertedTonPrice(convertedPriceSlot, priceToConvert)
        }
    }

    const handleModalCloseViaBackdrop = (e) => {
        if (e && !e.target.classList.contains('bid__modal--backdrop')) {
            return;
        }
        history.back()
    }

    const handleModalClose = (e) => {
        hideKeyboard()

        toggle('.bid__modal--first__step', false)
        toggle('.bid__modal--second__step', false)
        toggle('.bid__modal--payment', false)
        toggle('.bid__modal', false)
        toggle('.bid__modal--backdrop', false, 'flex', true, 200)
        $('.bid__modal').style.justifyContent = 'center'
        $('#otherPaymentsMethodsContainer').classList.remove('show')
        $('#otherPaymentsMethodsContainer').style.display = 'none'
        $('#otherPaymentsMethods svg').classList.remove('rotate')
        $('body').classList.remove('scroll__disabled')


        toggle('#paymentLottieLoading', false)
        toggle('#paymentLottieSuccess', false)
        toggle('#paymentLottieFailure', false)
        paymentLottieLoading.stop()
        paymentLottieSuccess.stop()
        paymentLottieFailure.stop()
        paymentLottieLoading.removeEventListener('loop', handlePaymentStatus)

        toggle('#payment-message-loading', false)
        toggle('#payment-message-success', false)
        toggle('#payment-message-rejection', false)
        toggle('#payment-message-error', false)

        qrContainer.innerHTML = ''
        paymentStatus = null

        bidModalInput.removeEventListener('input', handleBidInput);
        bidModalInput.removeEventListener('keypress', handleInputEnterPress);

        submitStepButton.removeEventListener('click', checkIfLoggedIn)
        submitStepButton.removeEventListener('click', checkIfLoggedIn)

        backdrop.removeEventListener('click', handleModalCloseViaBackdrop);
        window.removeEventListener('popstate', handleModalClose);

        setDomain(domain, true);
    }

    const openPaymentModal = () => {
        scrollToTop()
        backdrop.addEventListener('click',  handleModalCloseViaBackdrop)
        window.addEventListener('popstate', handleModalClose);

        paymentStatus = null

        toggle('#paymentLottieLoading', false)
        toggle('#paymentLottieSuccess', false)
        toggle('#paymentLottieFailure', false)

        toggle('#payment-message-loading', false)
        toggle('#payment-message-success', false)
        toggle('#payment-message-rejection', false)
        toggle('#payment-message-error', false)

        toggle('.bid__modal--backdrop', true)
        toggle('.bid__modal', true)
        toggle('.bid__modal--first__step', true)
        toggle('.bid__modal--second__step', false)
        toggle('.bid__modal--payment', false)
        $('body').classList.add('scroll__disabled')
        pushModalInfoToBrowserHistory('bid__modal')
        renderFirstStep()
    }

    const renderFirstStep = () => {
        const svgNode = submitPriceLabel.parentNode.querySelector('svg');
        svgNode.parentNode.querySelector('svg').style.display = 'block';
        $('#domainName--bid__modal').innerText = domain + '.ton'
        bidModalInput.setAttribute('value', localPrice);
        bidModalInput.value = localPrice;
        mask.updateValue()

        submitStepButton.removeAttribute('disabled')
        convertedPriceSlot.style.display = 'block'
        error.style.display = 'none'

        submitStepButton.addEventListener('click', checkIfLoggedIn)
        submitPriceLabel.innerText = formatNumber(localPrice)
        renderConvertedTonPrice(convertedPriceSlot, localPrice);

        bidModalInput.addEventListener('input', handleBidInput);
        bidModalInput.addEventListener('keypress', handleInputEnterPress);
    }

    const handleInputEnterPress = (e) => {
        if (e.key === 'Enter' && !submitStepButton.getAttribute('disabled')) {
            checkIfLoggedIn();
            hideKeyboard();
        }
    };

    const checkIfLoggedIn = async () => {
        const isLoggedIn = await walletController.isLoggedIn()

        if (isLoggedIn) {
            handlePaymentConfirmation()
        } else {
            renderSecondStep()
        }
    }

    const handlePaymentConfirmation = async () => {
        renderPaymentLoading()

        const addressString = addressToString(destinationAddress, IS_TESTNET);
        const message = domain;

        let payload = payloadIn;
        if (!payload) {
            payload = modalType === 'renew' ?
                await getChangeDnsRecordPayload(message) : await getAuctionBidPayload(message);
        }

        const validUntil = Date.now() + validUntilTimeMS;
        const transaction = {
            validUntil,
            messages: [
                {
                    address: addressString,
                    amount: TonWeb.utils.toNano(String(localPrice)).toString(),
                    payload,
                },
            ],
        };

        await walletController.sendTransaction(
            transaction,
            () => paymentStatus = 'success',
            () => paymentStatus = 'rejection',
            () => paymentStatus = 'error'
        )

    }

    const renderPaymentLoading = () => {
        paymentStatus = 'loading'
        updateBidModalPaymentData()
        renderPaymentMessage('loading')
        toggle('.bid__modal--payment', true)
        toggle('.bid__modal--first__step', false)

        paymentLoadingWallet.innerText = walletController.getCurrentWallet().name

        paymentLottieLoading.addEventListener('loop', handlePaymentStatus)

        paymentCloseButton.style.display = 'none'
    }

    const renderPaymentSuccess = () => {
        renderPaymentMessage('success')

        paymentCloseButton.onclick = () => handleModalClose()
        paymentCloseButton.style.display = ''
    }

    const renderPaymentFailure = ({rejection = false}) => {
        if (rejection) {
            renderPaymentMessage('rejection')
        } else {
            renderPaymentMessage('error')
        }

        paymentCloseButton.onclick = () => handleModalClose()
        paymentCloseButton.style.display = ''
    }

    const handlePaymentStatus = () => {
        if (paymentStatus === null) {
            return
        }

        if (paymentStatus === 'loading') {
            return
        }

        if (paymentStatus === 'success') {
            renderPaymentSuccess()
            return
        }

        if (paymentStatus === 'rejection') {
            renderPaymentFailure({rejection: true})
            return
        }

        if (paymentStatus === 'error') {
            renderPaymentFailure({})
            return
        }
    }

    const renderPaymentMessage = (type) => {
        if (type === 'loading') {
            toggle('#payment-message-loading', true)

            toggle('#paymentLottieLoading', true)
            toggle('#paymentLottieSuccess', false)

            paymentLottieLoading.play()

            return
        }

        if (type === 'success') {
            toggle('#payment-message-loading', false)
            toggle('#payment-message-success', true)

            toggle('#paymentLottieLoading', false)
            toggle('#paymentLottieSuccess', true)

            paymentLottieLoading.stop()
            paymentLottieSuccess.play()

            return
        }

        if (type === 'rejection' || type === 'error') {
            setTimeout(() => {
                toggle('#paymentLottieLoading', false)
                paymentLottieLoading.stop()
            }, 500)
            toggle('#paymentLottieFailure', true)

            paymentLottieFailure.play()
        }

        if (type === 'rejection') {
            toggle('#payment-message-loading', false)
            toggle('#payment-message-rejection', true)

            return
        }

        if (type === 'error') {
            toggle('#payment-message-loading', false)
            toggle('#payment-message-error', true)

            return
        }
    }

    const renderSecondStep = () => {
        updateBidModalPaymentData()
        prepareLinks();

        isDomainFree(domainType)
            ? analyticService.sendEvent({type: 'place_an_initial_bid'})
            : analyticService.sendEvent({type: 'place_a_bid'})

        $('.bid__modal').style.justifyContent = 'flex-start'
        toggle('.bid__modal--first__step', false)
        toggle('.bid__modal--second__step', true)

        renderQr('#freeQr', 'https://app.tonkeeper.com/transfer/' + destinationAddress + '?text=' + encodeURIComponent(domain) + '&amount=' + encodeURIComponent(new BigNumber(localPrice).multipliedBy(1000000000)))

        setAddress($('#transactionAddress'), destinationAddress)

        showOtherPaymentMethods.removeEventListener('click', renderOtherPaymentsMethods)
        showOtherPaymentMethods.addEventListener('click', renderOtherPaymentsMethods)
    }

    const updateBidModalPaymentData = () => {
        $('#domainName--bid__modal--payment').innerText = domain + '.ton'
        $('#freeComment').innerText = domain
        $('#freeComment').dataset.name = domain

        $('#bidPrice').innerText = formatNumber(localPrice, false)
        $('#bidPrice-payment-loading').innerText = formatNumber(localPrice, false)
    }

    const prepareLinks = () => {
        const isExtensionInstalled = !isMobile() && window.ton;
        const buyUrl = 'ton://transfer/' + destinationAddress + '?text=' + encodeURIComponent(domain) + '&amount=' + encodeURIComponent(new BigNumber(localPrice).multipliedBy(1000000000));

        if (isExtensionInstalled) {
            $('#freeBtn').href = buyUrl;
        } else {
            $('#freeBtn').href = 'https://app.tonkeeper.com/transfer/' + destinationAddress + '?text=' + encodeURIComponent(domain) + '&amount=' + encodeURIComponent(new BigNumber(localPrice).multipliedBy(1000000000));
        }

        if (isMobile()) {
            $('#freeBtn').href = buyUrl;
        }

        $('#tonkeeperButton').href = 'https://app.tonkeeper.com/transfer/' + destinationAddress + '?text=' + encodeURIComponent(domain) + '&amount=' + encodeURIComponent(new BigNumber(localPrice).multipliedBy(1000000000));
        $('#copyLinkbutton').setAttribute('address', buyUrl);
    }
    
    openPaymentModal();
}

let otherPaymentsTimerId = null;
function renderOtherPaymentsMethods() {
    const svgArrow = $('#otherPaymentsMethods svg')
    const otherPaymentsContainer = $('#otherPaymentsMethodsContainer')

    if (svgArrow.classList.contains('rotate')) {
        svgArrow.classList.remove('rotate')
    } else {
        svgArrow.classList.add('rotate')
    }

    if (otherPaymentsContainer.classList.contains('show')) {
        otherPaymentsContainer.classList.remove('show')


        otherPaymentsTimerId && clearTimeout(otherPaymentsTimerId)
        otherPaymentsTimerId = setTimeout(() => {
            otherPaymentsMethodsContainer.style.display = 'none'
        }, 300)
    } else {
        otherPaymentsMethodsContainer.style.display = ''

        otherPaymentsTimerId && clearTimeout(otherPaymentsTimerId)
        otherPaymentsTimerId = setTimeout(() => {
            otherPaymentsContainer.classList.add('show')
            otherPaymentsContainer.scrollIntoView({behavior: 'smooth', block: 'start'})
        }, 100)
    }
}

const renderConvertedTonPrice = (node, priceToCovert) => {
    getCoinPrice().then((price) => {
        if (price) {
            node.innerText = formatNumber(priceToCovert * price, 2)
        }
    })
}

const debouncedRenderConvertedTonPrice = debounce(renderConvertedTonPrice, 500);

const renderHistoryContainer = (node) => {
    let historyContainer = node.parentNode.querySelector('.suggestions-container')

    if (historyContainer) {
        return historyContainer
    }

    historyContainer = document.createElement('div')
    historyContainer.classList.add('suggestions-container')
    node.parentNode.appendChild(historyContainer)

    return historyContainer
}

const closeHistoryContainer = (node) => {
    const historyContainer = renderHistoryContainer(node)
    toggleByNode(historyContainer, false, 'flex', true, 100)
    historyContainer.style.display = 'none'
    node.classList.remove('focus')
}

const createEditBtn = (containerName) => {
    const container = $(containerName)
    container.innerHTML = ''
    const btn = document.createElement('a')
    btn.innerText = store.localeDict.save
    btn.classList.add('edit-btn')
    container.appendChild(btn)
    return btn
}

const toggleManageDomainForm = async (domain, dnsItem) => {
    if (currentOwner !== walletController.getAccountAddress()) {
        alert(store.localeDict.not_owner)
        return
    }

    const tonConnectAccauntAddress = walletController.getAccountAddress()
    if (tonConnectAccauntAddress !== currentOwner) {
        alert(store.localeDict.not_owner)
        return
    }

    FlipTimer.unmountTimers();
    setScreen('domainLoadingScreen');
    renderDomainLoadingScreen();

    $('#renewDomainButton').style.display = 'none';
    $('#manageDomainBtn').style.display = 'none';
    $('#manageDomainGoBackBtn').style.display = 'inline-flex';
    $('#manageDomainGoBackBtn').setAttribute('disabled', true);
    clearInterval(updateIntervalId);

    $('#manageDomainGoBackBtn').addEventListener('click', () => {
        $('#manageDomainGoBackBtn').style.display = 'none';
        setDomain(domain);
    });

    try {
        const dnsRecordWallet = await dnsItem.resolve(
            '.',
            TonWeb.dns.DNS_CATEGORY_WALLET
        )
        const dnsRecordSite = await dnsItem.resolve(
            '.',
            TonWeb.dns.DNS_CATEGORY_SITE
        )
        const isSiteInStorage = dnsRecordSite instanceof TonWeb.utils.StorageBagId;
        const dnsRecordStorage = await dnsItem.resolve(
            '.',
            TonWeb.dns.DNS_CATEGORY_STORAGE
        )
        const dnsRecordResolver = await dnsItem.resolve(
            '.',
            TonWeb.dns.DNS_CATEGORY_NEXT_RESOLVER
        )

        if (domain === currentDomain) {
            $('#editWalletRow input').value = dnsRecordWallet
                ? dnsRecordWallet.toString(true, true, true, IS_TESTNET)
                : ''
            $('#editAdnlRow input').value = dnsRecordSite ? dnsRecordSite.toHex() : ''
            $('#siteStorage').checked = isSiteInStorage
            $('#editStorageRow input').value = dnsRecordStorage ? dnsRecordStorage.toHex() : ''
            $('#editResolverRow input').value = dnsRecordResolver
                ? dnsRecordResolver.toString(true, true, true, IS_TESTNET)
                : ''

            const setTx = async (btnToOpenModalId, key, value) => {
                const dnsItemAddress = await dnsItem.getAddress();
                const destinationAddress = dnsItemAddress.toString(
                    true,
                    true,
                    true,
                    IS_TESTNET
                );

                const payload = await getManageDomainPayload(key, value);

                togglePaymentModal({
                    modalType: 'manage domain',
                    domain,
                    price: MANAGE_DOMAIN_PRICE,
                    address: destinationAddress,
                    payloadIn: payload,
                    validUntilTimeMS: 60 * 1000, // 1 minute
                });
            }

            $('#editWalletRow input').placeholder = store.localeDict.address

            createEditBtn('#editWalletRow .edit__button').addEventListener(
                'click',
                () => {
                    const addresType = document.querySelector('input[name=addr-radio-btns]:checked').value;
                    // 'wallet' or 'service'
                    console.log("🚀 ~ file: index.js:1211 ~ toggleManageDomainForm ~ radios:", addresType);

                    const value = $('#editWalletRow input').value
                    if (!value || TonWeb.Address.isValid(value)) {
                        setTx(
                            '#editWalletRow',
                            TonWeb.dns.DNS_CATEGORY_WALLET,
                            value ?
                                TonWeb.dns.createSmartContractAddressRecord(new TonWeb.Address(value))
                                : null
                        )
                    } else {
                        alert(store.localeDict.invalid_address)
                    }

                    hideKeyboard()
                }
            )

            $('#editAdnlRow input').placeholder = store.localeDict.adnl

            createEditBtn('#editAdnlRow .edit__button').addEventListener('click', () => {
                const value = $('#editAdnlRow input').value // hex
                let record = null
                if (value) {
                    try {
                        if ($('#siteStorage').checked) {
                            const bagId = new TonWeb.utils.StorageBagId(value)
                            record = TonWeb.dns.createStorageBagIdRecord(bagId)
                        } else {
                            const adnlAddress = new TonWeb.utils.AdnlAddress(value)
                            record = TonWeb.dns.createAdnlAddressRecord(adnlAddress)
                        }
                    } catch (e) {
                        console.error(e)
                        alert(store.localeDict.invalid_adnl_address);
                        return
                    }
                }
                setTx('#editAdnlRow', TonWeb.dns.DNS_CATEGORY_SITE, value ? record : null)
            })

            createEditBtn('#editStorageRow .edit-btn').addEventListener('click', () => {
                const value = $('#editStorageRow input').value; // hex

                let record = null;
                if (value) {
                    try {
                        const bagId = new TonWeb.utils.StorageBagId(value);
                        record = TonWeb.dns.createStorageBagIdRecord(bagId);
                    } catch (e) {
                        console.error(e);
                        alert(store.localeDict.invalid_hex_address);
                        return;
                    }
                }

                setTx('#editStorageRow', TonWeb.dns.DNS_CATEGORY_STORAGE, value ? record : null);
            });

            $('#editResolverRow input').placeholder = store.localeDict.address

            createEditBtn('#editResolverRow .edit__button').addEventListener(
                'click',
                () => {
                    const value = $('#editResolverRow input').value
                    if (!value || TonWeb.Address.isValid(value)) {
                        setTx(
                            '#editResolverRow',
                            TonWeb.dns.DNS_CATEGORY_NEXT_RESOLVER,
                            value ?
                                TonWeb.dns.createNextResolverRecord(new TonWeb.Address(value))
                                : null
                        )
                    } else {
                        alert(store.localeDict.invalid_address)
                    }
                }
            )
        }
        $('#manageDomainGoBackBtn').setAttribute('disabled', false);
        setScreen('busyDomainScreen');
    } catch (e) {
        console.error(e)
        alert(store.localeDict.manage_domain_unavailable);
        $('#manageDomainGoBackBtn').style.display = 'none';
        setDomain(domain);
        return
    }

    $('#busyDomainScreen').classList.add('edit-expand')
    $('.main').classList.add('edit-expand')

    analyticService.sendEvent({type: 'edit_domain'})
}

$('#manageDomainBtn').addEventListener('click', () => toggleManageDomainForm(currentDomain, currentDnsItem))

$(".reset__input--icon").addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    $('.start-input').value = ''
    resetError($('.start-error'))
})

// GG INTEGRATION
function getGGUIData() {
    return {
        ggHiddenClassName: 'gg__hidden',
        ggElements: {
            ggSalePriceRow: $('#ggSalePriceRow'),
            ggAuctionMinBidRow: $('#ggAuctionMinBidRow'),
            ggAuctionMaxBidRow: $('#ggAuctionMaxBidRow'),
            ggBuyBtn: $('#ggBuyBtn'),
            ggPlaceBidBtn: $('#ggPlaceBidBtn'),
            ggMakeOfferBtn: $('#ggMakeOfferBtn'),
        }
    };
}

function hideGGElements(domain) {
    const { ggHiddenClassName, ggElements } = getGGUIData();

    Object.values(ggElements).forEach((node) => {
        if (!!node && !node.classList.contains(ggHiddenClassName) && node.dataset.domain !== domain) {
            node.classList.add(ggHiddenClassName);
        }
    })
}

function renderGGElements(ggDomainData, domain) {
    const { ggHiddenClassName, ggElements } = getGGUIData();
    const {
        ggSalePriceRow,
        ggAuctionMinBidRow,
        ggAuctionMaxBidRow,
        ggBuyBtn,
        ggPlaceBidBtn,
        ggMakeOfferBtn,
    } = ggElements;
    const ggPrimaryBtnClassName = getBtnClassName('primary');
    const ggOutlineBtnClassName = getBtnClassName('outline');
    const ggTertiaryBtnClassName = getBtnClassName('tertiary');

    ggMakeOfferBtn.setAttribute('href', ggDomainData.make_offer_url);
    ggMakeOfferBtn.onclick = function () {
        analyticService.sendEvent({ type: 'make_offer_click' });
    };

    if (!!ggDomainData.sale) {
        $('#ggSalePrice').innerText = ggDomainData.sale.price.ton;
        $('#ggSalePriceConverted').innerText = ggDomainData.sale.price.usd;
        ggSalePriceRow.classList.remove(ggHiddenClassName);
        ggBuyBtn.setAttribute('href', ggDomainData.sale.buy_url);
        ggBuyBtn.className = ggPrimaryBtnClassName;
        ggMakeOfferBtn.className = ggOutlineBtnClassName;
    } else if (!!ggDomainData.auction) {
        $('#ggAuctionMinBid').innerText = ggDomainData.auction.min_bid.ton;
        $('#ggAuctionMinBidConverted').innerText = ggDomainData.auction.min_bid.usd;
        ggAuctionMinBidRow.classList.remove(ggHiddenClassName);
        ggPlaceBidBtn.setAttribute('href', ggDomainData.auction.make_bid_url);

        if (!!ggDomainData.auction.max_bid) {
            $('#ggAuctionMaxBid').innerText = ggDomainData.auction.max_bid.ton;
            $('#ggAuctionMaxBidConverted').innerText = ggDomainData.auction.max_bid.usd;
            ggAuctionMaxBidRow.classList.remove(ggHiddenClassName);
            ggBuyBtn.setAttribute('href', ggDomainData.auction.buy_now_url);
            ggBuyBtn.className = ggPrimaryBtnClassName;
            ggPlaceBidBtn.className = ggOutlineBtnClassName;
            ggMakeOfferBtn.className = ggTertiaryBtnClassName;
        } else {
            ggPlaceBidBtn.className = ggPrimaryBtnClassName;
            ggMakeOfferBtn.className = ggOutlineBtnClassName;
        }
    } else {
        ggMakeOfferBtn.className = ggPrimaryBtnClassName;
    }

    Object.values(ggElements).forEach((element) => {
        element.setAttribute('data-domain', domain);
    });

    function getBtnClassName(btnStyle) {
        return `btn gg__btn gg__btn__${btnStyle}`;
    }
}
// GG INTEGRATION

// COMMON
var oldStartInputValue = '';

function setCareeteHelperValue(value) {
    const helper = $('.careete__helper');
    const windowWidth = window.innerWidth;
    const resetInputIcon = $('.icon.reset__input--icon')
    const careeteHelper = $('.start-input-container__domain--container')
    const careeteHelperText = $('.start-input-container__domain')

    function getSubStrAfterSubStr(str, substring) {
        let lastIndex = str.lastIndexOf(substring);
        if (lastIndex === -1) {
            return 0;
        }

        return str.slice(lastIndex)
    }

    const cuttedHintText = getSubStrAfterSubStr(value, DEFAULT_CARETE_HELPER_TEXT[0])

    $('.start-input-container__domain').innerText = cuttedHintText && DEFAULT_CARETE_HELPER_TEXT.includes(cuttedHintText)
        ? DEFAULT_CARETE_HELPER_TEXT.slice(cuttedHintText.length)
        : DEFAULT_CARETE_HELPER_TEXT

    if (value !== oldStartInputValue) {
        oldStartInputValue = value;
        helper.innerText = value.replaceAll(' ', `${'\u00A0'}`);

        const {width} = helper.getBoundingClientRect();

        if (careeteHelper) {
            careeteHelper.style.left = `${(windowWidth > 568 ? 72 : 56) + width + OFFSET_BETWEEN_TEXT_AND_CARRETE}px`

            const iconDimensions = resetInputIcon.getBoundingClientRect();
            const careeteHelperDimensions = careeteHelperText.getBoundingClientRect();

            if (careeteHelperDimensions.x > iconDimensions.x - careeteHelperDimensions.width) {
                careeteHelper.style.visibility = 'hidden';
            } else {
                careeteHelper.style.visibility = 'visible';
            }
        }
    }
}

$('.start-input-container__domain--container').addEventListener('click', () => {
    $('.start-input').focus();
})

document.querySelectorAll('.copy__addr').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        copyToClipboard(
            e.target.parentNode.querySelector('.addr').dataset.dataAddress,
            e.target.parentNode.querySelector('button'),
        );
    })
})

let prevInterval = null;

document.querySelector('#copyLinkbutton').addEventListener('click', () => {
    copyToClipboard(
        $('#copyLinkbutton').getAttribute('address'),
        null,
        false
    ).then(() => {
        if (prevInterval) {
            return;
        }

        $('#copyLinkbutton').classList.add('copied')

        prevInterval = setTimeout(() => {
            $('#copyLinkbutton').classList.remove('copied')

            prevInterval = null;
        }, 1000)
    });
})

document.querySelector('.copy__name').addEventListener('click', (e) => {
    copyToClipboard(
        document.getElementById('freeComment').dataset.name,
        e.target,
    );
})

document.querySelectorAll('.addr').forEach((node) => {
    node.addEventListener('click', e => {
        e.preventDefault()
        e.stopPropagation()
        window.open(tonscanUrl + '/address/' + node.dataset.dataAddress, '_blank')
    })
})

let prevTimeoutId = null;

document.querySelectorAll("input:not([type=checkbox])").forEach((node) => {
    node.addEventListener(('mousedown'), (e) => {
        e.target.classList.add('input__clicked')

        if (prevTimeoutId) {
            clearTimeout(prevTimeoutId)
        }

        prevTimeoutId = setTimeout(() => {
            if (e.target.classList.contains('input__clicked')) {
                e.target.classList.remove('input__clicked')
            }
        }, 500)
    })
})

document.querySelectorAll('input').forEach((node) => {
    node.addEventListener(('mouseup'), (e) => {
        e.target.classList.remove('input__clicked')
    })
})

const handleWindowResize = () => {
    setAppHeight()
    oldStartInputValue = ''
    setCareeteHelperValue($('.start-input').value)
}

const debouncedHandleWindowResize = debounce(handleWindowResize, 100)

window.addEventListener('resize', debouncedHandleWindowResize)

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.suggestions__input').forEach((input) => {
        input.addEventListener('focus', (e) => {
            renderSearchHistory(input)
        })
    })
    setAppHeight()

    if (BROWSER === 'Safari') {
        $('body').classList.add('safari')
    }
})
