const TIMER_CONFIG = [
    {type: 'seconds', accessor: 'secondsLeft'},
    {type: 'minutes', accessor: 'minutesLeft'},
    {type: 'hours', accessor: 'hoursLeft'},
    {type: 'days', accessor: 'daysLeft'},
]

let isTimerMounted = false

const getEndDate = (container) => {
    if (!container) {
        return;
    }

    const endDate = container.dataset.endDate
    const formattedDate = new Date(endDate)

    if (!endDate || !formattedDate) {
        return new Date()
    }

    return formattedDate
}

const NUMBER_CHARACTER_TO_COPY = 3

const calculateExpiresTime = (endDate) => {
    const ONE_SECOND = 1000
    const ONE_MINUTE = ONE_SECOND * 60
    const ONE_HOUR = ONE_MINUTE * 60
    const ONE_DAY = 24 * 60 * 60 * 1000

    const todayDateTimestamp = new Date().getTime()
    const todayDateString = String(todayDateTimestamp)
    const stringEndDateTimestamp = String(endDate.getTime())
    const arrayEndDateTimestamp = stringEndDateTimestamp.split('')

    for (let i = 1; i < NUMBER_CHARACTER_TO_COPY + 1; i++) {
        arrayEndDateTimestamp[arrayEndDateTimestamp.length - i] = todayDateString[todayDateString.length - i]
    }

    const formattedEndDateTimestamp = Number(arrayEndDateTimestamp.join(''))
    const dateDifference = Math.abs(todayDateTimestamp - formattedEndDateTimestamp)

    const daysLeft = Math.max(0, Math.floor(dateDifference / ONE_DAY))
    const hoursLeft = Math.max(0, Math.floor((dateDifference / ONE_HOUR) % 24))
    const minutesLeft = Math.max(
        0,
        Math.floor((dateDifference / ONE_MINUTE) % 60)
    )
    const secondsLeft = Math.max(
        0,
        Math.floor((dateDifference / ONE_SECOND) % 60)
    )

    return {
        daysLeft,
        hoursLeft,
        minutesLeft,
        secondsLeft,
    }
}

const createElement = (value, type) => {
    return `<li class="flip-item-${type}">${value}</li>`
}

const initTimer = (selector, start) => {
    const container = $(selector)
    const endDate = getEndDate(container)
    const isValid = isValidDate(endDate)

    if (!endDate || !isValid) {
        return;
    }

    const expiresTime = calculateExpiresTime(endDate)

    container.innerHTML = TIMER_CONFIG.map(function ({type, accessor}) {
        const currentExpires = expiresTime[accessor]
        return createElement(currentExpires, type)
    }).join('')

    renderTimer(jQuery, start)
}

const unmountTimer = () => {
    isTimerMounted = false
    document.querySelectorAll('.flip-clock-container').forEach((container) => {
        container.innerHTML = ''
    })
}

const initFlipTimer = (selector, start) => {
        initTimer(selector, start)
        isTimerMounted = true
}

function isValidDate(d) {
    if (Object.prototype.toString.call(d) === "[object Date]") {
        return !isNaN(d);
    } else {
        return false;
    }
}

const showIsHidden = () => {
    setTimeout(() => {
        showIsHidden()
    }, 200)
}
