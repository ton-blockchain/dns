const backdrop = $('.alert--backdrop')

const dnsAlert = async (message = '', buttonMessage = 'Ok', onclick = () => {}) => {
  if (backdrop.children.length > 0) {
    await until(() => backdrop.children.length === 0)
  }

  toggle('.alert--backdrop', true)
  $('body').classList.add('scroll__disabled')

  const alertId = makeid(5)

  const alert = createAlert(message, buttonMessage, onclick, alertId)
  alert.classList.add('fade')

  alert.onclick = (e) => e.stopPropagation()
	backdrop.appendChild(alert)
  backdrop.onclick = (e) => closeAlert(e, alertId)
  
  setTimeout(() => toggle(`#${alertId}`, true), 50)
}


const createAlert = (message, buttonMessage, onclick, alertId) => {
  const container = document.createElement('div');
  container.setAttribute('id', alertId)
  container.classList.add('alert--container')

  const template = `
      <div class="alert--message">
        ${message}
      </div>
      <div class="alert--button--container">
          <button class="alert--button btn outline" id="alert--button--id">${buttonMessage}</button>
      </div>
    `
  container.innerHTML = template

  const button = container.querySelector('#alert--button--id')
  const extendedOnclick = (e) => { 
    closeAlert(e, alertId); 
    onclick();
  }
  button.onclick = extendedOnclick

  return container
}

const closeAlert = (e, alertId) => {
  e.preventDefault()
  e.stopPropagation()

  const alert = document.getElementById(alertId)
  alert.remove()

  toggle('.alert--backdrop', false, 'flex', true, 200)
  $('body').classList.remove('scroll__disabled')
}

