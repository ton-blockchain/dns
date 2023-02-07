;(function () {
    const mobileMenu = {
        isOpened: false,
        element: document.getElementById('mobile-menu'),
    }

    function openMenu() {
        mobileMenu.element.classList.add('mobile-menu-opened')
        mobileMenu.element.classList.remove('mobile-menu-closed')
        mobileMenu.isOpened = true
        document.body.style.overflow = 'hidden'
        toggleThemeSwitcher()
    }

    function toggleThemeSwitcher() {
        const themeSwitcher = document.getElementById('mobile-theme-switch')
        const currentTheme = themeController.getTheme()
        if (currentTheme === 'light') {
            themeSwitcher.checked = false
            return
        }

        themeSwitcher.checked = true
    }

    closeMenu = function () {
        mobileMenu.element.classList.remove('mobile-menu-opened')
        mobileMenu.element.classList.add('mobile-menu-closed')
        mobileMenu.isOpened = false
        document.body.style.overflow = ''
        toggleThemeSwitcher()
    }

    toggleMobileMenu = function () {
        if (window.location.pathname !== '/about.html') {
            scrollToTop()
        }

        if (mobileMenu.isOpened) {
            closeMenu()
            return
        }

        openMenu()
    }

    window.addEventListener('resize', function () {
        if (window.innerWidth <= 750) {
            closeMenu()
        }
    })
})()
