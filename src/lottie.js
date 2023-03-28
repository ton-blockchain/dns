;(function () {
	let sunLottie = document.getElementById('sunLottie')
	let moonLottie = document.getElementById('moonLottie')

	let themeButton = document.getElementById('lottie-button')

	if (themeController.getTheme() === 'light') {
		sunLottie.seek(31)
	} else {
		moonLottie.seek(31)
	}

	themeButton.addEventListener('click', function () {
		if (themeController.getTheme() === 'light') {
			sunLottie.setDirection(1)
			sunLottie.play()
			moonLottie.stop()
			return
		}

		moonLottie.setDirection(1)
		moonLottie.play()
		sunLottie.stop()
	})

	let aboutButton = document.getElementById('aboutButton')
	let aboutLottieLight = document.getElementById('aboutLottieLight')
	let aboutLottieDark = document.getElementById('aboutLottieDark')

	aboutButton.addEventListener('mouseover', function () {
		aboutLottieLight.play()
		aboutLottieDark.play()
	})

	aboutButton.addEventListener('mouseleave', function () {
		aboutLottieLight.stop()
		aboutLottieDark.stop()
	})
})()
