renderTimer = function ($, start) {
    $(document).ready(function () {
        const container = $('.flip-clock-container')
        container.addClass('show')
        container.each(function () {
            var result = prepareFlipItems($(this))
            var flipElements = result.flipElements
            var timestamp = result.timestamp
            if (start) {
                setState(flipElements, timestamp, $(this))
            }
        })
    })

    function completeUpdateState(flipElements, values, flipContainer) {
        return setTimeout(function () {
            for (var key in flipElements)
                for (var i = 0; i < flipElements[key].digits.length; i++)
                    if (flipElements[key].digits[i].flipping) {
                        flipElements[key].digits[i].currentValue =
                            flipElements[key].digits[i].nextValue
                        const currentValue = flipElements[key].digits[i].currentValue
                        var preparedCurrentValue = 0
                        if (key === 'days') {
                            const postfix = getDaysPostfix(currentValue)
                            preparedCurrentValue = currentValue + postfix
                        } else {
                            preparedCurrentValue = currentValue
                        }
                        flipElements[key].digits[i].element
                            .children('.flip-digit-current')
                            .attr('data-digit', preparedCurrentValue)
                        var number = 0

                        if (key === 'days') {
                            number = flipElements[key].digits[0].nextValue
                        } else {
                            number =
                                flipElements[key].digits[1].nextValue * 10 +
                                flipElements[key].digits[0].nextValue
                        }

                        var nextValue = computeNextValue(number, key)
                        for (var j = i; j < flipElements[key].digits.length; j++) {
                            if (flipElements[key].digits[j].nextValue != nextValue[j]) {
                                flipElements[key].digits[j].nextValue = nextValue[j]
                                const unpreparedValue = flipElements[key].digits[j].nextValue
                                var preparedNextValue = 0
                                if (key === 'days') {
                                    const postfix = getDaysPostfix(unpreparedValue)
                                    preparedNextValue = unpreparedValue + postfix
                                } else {
                                    preparedNextValue = unpreparedValue
                                }
                                flipElements[key].digits[j].element
                                    .children('.flip-digit-next')
                                    .attr('data-digit', preparedNextValue)
                            }
                        }
                        flipElements[key].digits[i].flipping = false
                        flipElements[key].digits[i].element.removeClass('flipping')
                    }
            flipContainer.trigger('afterFlipping', values)
        }, 900)
    }

    function updateState(flipElements, timestamp, flipContainer) {
        var values = {}
        var digitValues = {}
        values.seconds = timestamp % 60
        values.minutes = Math.floor((timestamp / 60) % 60)
        values.hours = Math.floor((timestamp / 60 / 60) % 24)
        values.days = Math.floor(timestamp / 60 / 60 / 24)
        digitValues.seconds = numberToDigits(values.seconds)
        digitValues.minutes = numberToDigits(values.minutes)
        digitValues.hours = numberToDigits(values.hours)
        digitValues.days = numberToDigits(values.days, 'days')
        for (var key in flipElements)
            for (var i = 0; i < digitValues[key].digits.length; i++)
                if (
                    digitValues[key].digits[i] != flipElements[key].digits[i].currentValue
                ) {
                    flipElements[key].digits[i].flipping = true
                    flipElements[key].digits[i].element.addClass('flipping')
                }
        flipContainer.trigger('beforeFlipping', values)
        return completeUpdateState(flipElements, values, flipContainer)
    }

    function setState(flipElements, timestamp, flipContainer) {
        var countDown = setInterval(function () {
            if (!$('.flip-clock-container').children('li').length) {
                flipContainer.trigger('done')
                return clearInterval(countDown)
            }
            if (!timestamp || timestamp < 0) {
                flipContainer.trigger('done')
                return clearInterval(countDown)
            }
            updateState(flipElements, --timestamp, flipContainer)
        }, 1000)
        return
    }

    function prepareFlipItems(flipContainer) {
        var flipElements = {}
        var timestamp = 0
        var itemCount = 0
        const timerId = flipContainer[0]?.parentElement?.id || ''

        flipContainer.children().each(function () {
            var element = $(this)
            var number = parseInt(element.text())

            if (isNaN(number)){
                setTimerLoadingScreen(timerId)
            } else{
                removeTimerLoadingScreen(timerId)
            }

            var getFlipItemChildObj = prepareFlipItemChild(element, number)

            if (element.hasClass('flip-item-seconds')) {
                timestamp += number
                flipElements.seconds = getFlipItemChildObj('seconds')
            } else if (element.hasClass('flip-item-minutes')) {
                timestamp += number * 60
                flipElements.minutes = getFlipItemChildObj('minutes')
            } else if (element.hasClass('flip-item-hours')) {
                timestamp += number * 60 * 60
                flipElements.hours = getFlipItemChildObj('hours')
            } else if (element.hasClass('flip-item-days')) {
                timestamp += number * 24 * 60 * 60
                flipElements.days = getFlipItemChildObj('days')
            }
        })
        flipContainer[0].style.setProperty('--item-count', itemCount)
        return {
            flipElements: flipElements,
            timestamp: timestamp,
        }
        function prepareFlipItemChild(element, number) {
            return function (flipType) {
                var digitsComponent = new DigitsComponent(number, flipType)
                element.html(digitsComponent.render())
                for (var i = 0; i < digitsComponent.digits.length; i++) {
                    $.extend(digitsComponent.digits[i], {
                        element: $(element.children()[i]),
                        flipping: false,
                    })
                }
                itemCount++
                return {
                    parentElement: element,
                    digits: digitsComponent.digits,
                }
            }
        }
    }

    function DigitsComponent(number, flipType) {
        (function constructor(number, flipType) {
            $.extend(this, setDigitValues(number, flipType))
        }.call(this, number, flipType))

        if (flipType === 'days') {
            const currentPostfix = getDaysPostfix(this.digits[0].currentValue)
            const nextPostfix = getDaysPostfix(this.digits[0].nextValue)
            const currentString = this.digits[0].currentValue + currentPostfix
            const nextString = this.digits[0].nextValue + nextPostfix
            this.render = function () {
                return document.createRange().createContextualFragment(`
          <div class="flip-digit">
            <span class="flip-digit-next" data-digit="${nextString}"></span>
            <span class="flip-digit-current" data-digit="${currentString}"></span>
          </div>
        `)
            }
            return
        }

        this.render = function () {
            return document.createRange().createContextualFragment(`
        <div class="flip-digit">
          <span class="flip-digit-next" data-digit="${this.digits[0].nextValue}"></span>
          <span class="flip-digit-current" data-digit="${this.digits[0].currentValue}"></span>
        </div>
        <div class="flip-digit">
          <span class="flip-digit-next" data-digit="${this.digits[1].nextValue}"></span>
          <span class="flip-digit-current" data-digit="${this.digits[1].currentValue}"></span>
        </div>
      `)
        }
    }

    function setDigitValues(number, flipType) {
        let nextValue = computeNextValue(number, flipType);

        if (flipType === 'days') {
            return {
                digits: [
                    {
                        currentValue: number,
                        nextValue: nextValue[0],
                    },
                ],
            }
        }

        return {
            digits: [
                {
                    currentValue: number % 10,
                    nextValue: nextValue[0],
                },
                {
                    currentValue: Math.floor(number / 10),
                    nextValue: nextValue[1],
                },
            ],
        }
    }

    function computeNextValue(number, flipType) {
        let nextNumber = number - 1;

        if (flipType === 'days') {
            return [nextNumber]
        }

        if (!number) nextNumber = flipType === 'hours' ? 23 : 59
        return [nextNumber % 10, Math.floor(nextNumber / 10)]
    }

    function numberToDigits(number, flipType = '') {
        if (flipType === 'days') {
            return {
                digits: [number],
            }
        }

        return {
            digits: [number % 10, Math.floor(number / 10)],
        }
    }

    function getDaysPostfix(days) {
        const lang = (browserLang === 'ru-RU') || (browserLang === 'ru') || (browserLang === 'be-BY')
        || (browserLang === 'be') || (browserLang === 'kk-KZ') || (browserLang === 'kk') ? 'ru' : 'en'

        if (lang === 'ru') {
            let forms = [' день', ' дня', ' дней']
            let n1 = Math.abs(days) % 100
            let n2 = n1 % 10

            if (n1 > 10 && n1 < 20) return forms[2]
            if (n2 > 1 && n2 < 5) return forms[1]
            if (n2 === 1) return forms[0]

            return forms[2]
        } else {
            if (days === 1) return ' day'

            return ' days'
        }
    }
}
