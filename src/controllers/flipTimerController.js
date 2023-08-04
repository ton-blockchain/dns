const TIMER_CONFIG = [
    { type: 'seconds', accessor: 'secondsLeft' },
    { type: 'minutes', accessor: 'minutesLeft' },
    { type: 'hours', accessor: 'hoursLeft' },
    { type: 'days', accessor: 'daysLeft' },
];

class FlipTimer {
    static activeTimers = []
    
    constructor({ selector, start, store }) {
        this.selector = selector
        this.start = start
        this.store = store

        this.init(selector, start)
    }

    init(selector, start) {
        const container = $(selector)
        const endDate = this.getEndDate(container)

        if (!endDate) {
            return;
        }

        const expiresTime = this.calculateExpiresTime(endDate)

        container.innerHTML = TIMER_CONFIG.map(function ({ type, accessor }) {
            const currentExpires = expiresTime[accessor]
            return `<li class="flip-item-${type}">${currentExpires}</li>`
        }).join('')

        FlipTimer.activeTimers = [...FlipTimer.activeTimers, container];
        renderTimer(jQuery, start, store)
    }

    getEndDate(container) {
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

    calculateExpiresTime(endDate) {
        const todayDate = new Date()
        if (endDate.getTime() <= todayDate.getTime()) {
            return {
                daysLeft: 0,
                hoursLeft: 0,
                minutesLeft: 0,
                secondsLeft: 0,
            };
        }
        
        const ONE_SECOND = 1000
        const ONE_MINUTE = ONE_SECOND * 60
        const ONE_HOUR = ONE_MINUTE * 60
        const ONE_DAY = 24 * 60 * 60 * 1000

        const dateDifference = Math.abs(todayDate - endDate)

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

    showIsHidden() {
        setTimeout(() => { this.showIsHidden() }, 200);
    }
}

FlipTimer.unmountTimers = function () {
    FlipTimer.activeTimers.forEach((container) => {
        container.innerHTML = ''
        
    })
    FlipTimer.activeTimers = []
}

FlipTimer.addTimer = function (selector, start) {
    return new FlipTimer({ selector, start, store })
}
