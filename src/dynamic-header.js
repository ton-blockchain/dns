function handleScroll() {
    const headerEl = document.querySelector('nav')
    const borderOffset = 0

    if (!headerEl) {
        return
    }

    if (window.scrollY > borderOffset) {
        if (!headerEl.classList.contains('fixed-header')) {
            headerEl.classList.add('fixed-header')
        }

        return
    }

    if (headerEl.classList.contains('fixed-header')) {
        headerEl.classList.remove('fixed-header')
    }
}

handleScroll()

window.addEventListener('scroll', handleScroll)
