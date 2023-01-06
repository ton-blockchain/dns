THEME_LIGHT = 'light'
THEME_DARK = 'dark'

const themes = [THEME_LIGHT, THEME_DARK]

let mountTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme)
};

let setTheme = function (theme) {
    window.localStorage.setItem('theme', theme)
    mountTheme(theme)
};

let isThemeSet = function () {
    const theme = window.localStorage.getItem('theme')

    if (!theme || !themes.includes(theme)) {
        return false
    }

    return true
};

let getTheme = function () {
    return window.localStorage.getItem('theme')
};

let isThemeMounted = function () {
    const mountedTheme = document.documentElement.getAttribute('data-theme')

    if (!mountedTheme || !themes.includes(mountedTheme)) {
        return false
    }

    return true
};

let initTheme = function () {
    if (!isThemeSet()) {
        setTheme(THEME_LIGHT)
        return
    }

    const theme = getTheme()
    if (!isThemeMounted()) {
        mountTheme(theme)
        return
    }
};

let toggleTheme = function () {
    if (!isThemeSet()) {
        initTheme()
    }

    isThemeMounted()

    const currentTheme = getTheme()

    if (currentTheme === THEME_LIGHT) {
        setTheme(THEME_DARK)
        return
    }

    setTheme(THEME_LIGHT)
};

initTheme()
