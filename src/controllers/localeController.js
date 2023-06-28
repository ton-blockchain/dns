class LocaleController {
	constructor(props) {
		this.registerLocaleDict('index', INDEX_LOCALES)
		this.registerLocaleDict('about', ABOUT_LOCALES)

		this.store = props.store
		this.store.subscribe(this, 'setLocale', (locale) => {
			this.store.dispatch('setLocaleDict', this[props.localeDict][locale])
		})
		this.store.subscribe(this, 'setLocaleDict', (localeDict) => {
			if (this.store.locale !== 'en') {
				document.querySelectorAll('[data-locale]').forEach((node) => {
					const key = node.attributes['data-locale'].value
					node.innerHTML = localeDict[key]
				})

				document
					.querySelectorAll('[data-placeholder-locale]')
					.forEach((input) => {
						const key = input.attributes['data-placeholder-locale'].value
						input.placeholder = localeDict[key]
					})
			}
		})
	}

	init() {
		const browserLang = navigator.language || navigator.userLanguage
		const lang =
			browserLang === 'ru-RU' ||
			browserLang === 'ru' ||
			browserLang === 'be-BY' ||
			browserLang === 'be' ||
			browserLang === 'kk-KZ' ||
			browserLang === 'kk'
				? 'ru'
				: 'en'

		this.store.dispatch('setLocale', lang)

		return this
	}

	registerLocaleDict(locale, localeDict) {
		this[locale] = this[locale] || localeDict
	}
}

const INDEX_LOCALES = {
	ru: {
		about: 'О сервисе',
		dark_mode: 'Темная тема',
		address: 'Адрес',
		adnl: 'ADNL адрес',
		testnet_badge_message: 'Внимание, это тестовая сеть! Не отправляйте настоящие TON. Тестовые домены могут быть удалены.',
		open_auction: 'Купить домены .ton',
		start_input_placeholder: 'Введите домен',
		start_splash: 'Зарегистрируйте короткие читаемые имена для кошельков, смарт-контрактов и веб-сайтов.',
		more_info: 'Подробнее<span class="icon arrow__right unbreak"></span>',
		highest_bid: 'Текущая ставка',
		from: 'От',
		bid_step: 'Шаг ставки',
		minimum_bid: 'Минимальная ставка',
		auction_ends: 'Аукцион закончится через',
		place_bid: 'Сделать ставку',
		sale_price: 'Цена покупки',
		owner: 'Владелец',
		wallet_address: 'Адрес кошелька',
		save: 'Сохранить',
		ton_site: 'TON Site',
		subdomains: 'Поддомены',
		expires: 'Истекает <span id="expiresDate"></span>',
		edit: 'Редактировать',
		bet_price: 'Ставка',
		start_bid: 'Домен можно приобрести на открытом аукционе. Сделайте первую ставку, чтобы начать аукцион.',
		auction_duration: 'Длительность аукциона',
		bid_to_start: 'Сделайте ставку и начните аукцион',
		enter_amount: 'Введите вашу ставку',
		small_bid_error: 'Ставка слишком маленькая.',
		place_label: 'Поставить',
		place_label_2: '',
		scan_qr: 'Отсканируйте QR-код и отправьте',
		pay_mobile: 'К оплате',
		scan_qr_link: 'через Tonkeeper.',
		pay_attention: 'Используйте только <a class="unbreak" href="https://ton.org/wallets?filterBy=wallets_non_custodial" target="_blank">некастодиальные</a> кошельки для&nbsp;оплаты.',
		sent_to: 'Адрес',
		message: 'Комментарий',
		place_with_extension: 'Открыть кошелек',
		copy_link: 'Скопировать ссылку для оплаты',
		copy_link_copied: 'Ссылка скопирована!',
		place_with_app: 'Сделать ставку через Tonkeeper',
		error_length: 'Домен должен быть не менее 4 и не более 126 символов.',
		subdomains_not_allowed: 'Поддомены запрещены.',
		invalid_chars: 'В домене можно использовать английские символы (a-z), цифры (0-9) и дефис (-). Дефис не может находиться в начале и конце.',
		not_owner: 'Вы не владелец домена',
		login_extention: 'Войдите и авторизуйтесь в расширении TON Wallet для редактирования домена',
		invalid_address: 'Неправильный адрес',
		install_extension: 'Установите расширение TON Wallet для управления доменом',
		auction: 'Аукцион',
		free: 'Свободен',
		busy: 'Занят',
		update_extension: 'Обновите расширение TON Wallet',
		install_web_extension: 'Установить TON Wallet',
		install_tonkeeper: 'Установить Tonkeeper',
		claim_your_domain: 'Что такое Ton Domains?',
		renew_this_domain: 'Продлить этот домен',
		renew_domain: 'Продлить домен',
		renew_domain_explanation: 'Внесите депозит, чтобы продлить ваш домен.',
		use_other_payments: 'Другие способы оплаты <svg class="arrow icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
				'                    <path d="M16 15L11.5 10L7 15" stroke="#0088CC" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
				'                </svg>',
		storage_checkbox: "Хостинг на TON Storage",
		footer_support: "Помощь",
		wallet_connect_button: 'Подключить кошелёк',
		wallet_connect_button_mobile: 'Подключить',
		wallet_modal_first_title: 'Подключить кошелёк',
		wallet_modal_first_description: 'Выберете кошелёк из списка, чтобы начать работу.',
		wallet_modal_first_footer: 'У вас нет кошелька?',
		wallet_modal_first_setup: 'Установите кошелёк',
		wallet_modal_second_title_1: 'Подключить',
		wallet_modal_second_title_2: 'кошелёк',
		wallet_modal_second_description_1: 'Отсканируйте QR-код с помощью мобильного телефона или',
		wallet_modal_second_description_2: 'app.',
		wallet_modal_second_back_button: 'Назад',
		wallet_logout: 'Выйти',
		payment_subheader_1: 'Откройте приложение',
		payment_subheader_2: 'и подтвердите',
		payment_subheader_3: 'транзакцию',
		payment_loading_header: 'Проверка оплаты',
		payment_loading_description: 'Проверяем оплату. Это может занять некоторое время.',
		payment_success_header: 'Оплата прошла успешно',
		payment_success_description: 'Если ваша ставка будет перебита, деньги вернутся на кошелек.',
		payment_failure_rejection_header: 'Транзакция отклоненна',
		payment_failure_rejection_description: 'Вы отклонили транзакцию. Пожалуйста, повторите попытку.',
		payment_failure_error_header: 'Произошла ошибка',
		payment_failure_error_description: 'Пожалуйста перезагрузите страницу и попробуйте еще раз',
		payment_done_button: 'Готово',
		wallet_connect_mytonwallet_unknown_error: 'Пожалуйста проверьте свой кошелек. Попробуйте сменить сеть в настройках кошелька.',
		my_domains: 'Мои домены',
		my_domains_empty_title: 'У вас пока нет доменов',
		my_domains_empty_caption: 'Участвуйте в аукционах и покупайте домены.',
		my_domains_empty_button: 'Начать сейчас',
		my_domains_list_domain_column: 'Домен',
		my_domains_list_price_column: 'Цена продажи',
		my_domains_list_date_column: 'Истекает через',
		pay: 'Оплатить',
		months: ["янв.", "февр.", "март", "апр.", "май", "июнь", "июль", "авг.", "сент.", "окт.", "нояб.", "дек."],
		at: 'в',
		day: 'день',
		days: 'дней',
		today: 'Сегодня',
		hours: 'часов',
		min: 'минут',
		manage_domain: 'Редактировать',
		manage_domain_go_back: 'Вернуться на страницу домена',
		manage_domain_mobile: 'Редактировать в Tonkeeper',
		manage_domain_unavailable: 'Что-то пошло не так. Пожалуйста, повторите попытку.'
	},
	en: {
		address: 'Address',
		adnl: 'ADNL address',
		save: 'Save',
		start_input_placeholder: 'Enter a domain',
		start_splash: 'Give crypto wallets, smart contracts or websites short readable names.',
		error_length: 'The domain name must be at least 4 characters and no more than 126 characters.',
		subdomains_not_allowed: 'Subdomains are not allowed.',
		invalid_chars: 'English letters (a-z), numbers (0-9), and hyphens (-) are allowed. A hyphen cannot be at the beginning or the end.',
		not_owner: 'You are not the owner of this domain.',
		login_extention: 'Open and log in to the TON Wallet extension for domain management.',
		invalid_address: 'The address is invalid.',
		install_extension: 'Please install the TON Wallet extension to edit the domain',
		auction: 'On auction',
		free: 'Available',
		busy: 'Taken',
		update_extension: 'Please update your TON Wallet extension',
		claim_your_domain: 'What is Ton Domains?',
		renew_this_domain: 'Renew this domain',
		renew_domain: 'Renew domain',
		renew_domain_explanation: 'Pay a deposit to renew your domain ownership',
		footer_support: 'Support',
		wallet_connect_button: 'Connect wallet',
		wallet_connect_button_mobile: 'Connect',
		wallet_modal_first_title: 'Connect wallet',
		wallet_modal_first_description: 'Choose your preferred wallet from the options to get started.',
		wallet_modal_first_footer: 'Don\'t have a crypto wallet?',
		wallet_modal_first_setup: 'Set up wallet',
		wallet_modal_second_title_1: 'Connect',
		wallet_modal_second_title_2: 'wallet',
		wallet_modal_second_description_1: 'Scan QR code with your mobile phone',
		wallet_modal_second_description_2: 'app.',
		wallet_modal_second_back_button: 'Back',
		wallet_logout: 'Log out',
		payment_loading_header: 'Checking Payment',
		payment_loading_description: 'We are checking your payment. It may take some time.',
		payment_success_header: 'Payment completed successfully',
		payment_success_description: 'If your bid is outbid, the money will be returned to the wallet.',
		payment_failure_rejection_header: 'Payment rejected',
		payment_failure_rejection_description: 'You have rejected the payment. Please try again.',
		payment_failure_error_header: 'Something went wrong',
		payment_failure_error_description: 'Please reload the page or try again later.',
		payment_done_button: 'Done',
		wallet_connect_mytonwallet_unknown_error: 'Please check your wallet. Try to switch network in the wallet settings.',
		my_domains: 'My domains',
		my_domains_empty_title: 'You have no domains yet',
		my_domains_empty_caption: 'Participate in the auction and buy domains.',
		my_domains_empty_button: 'Start now',
		my_domains_list_domain_column: 'Domain',
		my_domains_list_price_column: 'Sale price',
		my_domains_list_date_column: 'Expiry date',
		pay: 'Pay',
		enter_amount: 'Enter your bid amount',
		place_label: 'Place a ',
		place_label_2: 'bid',
		place_bid: 'Place a bid',
		months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		at: 'at',
		day: 'day',
		days: 'days',
		today: 'Today',
		hours: 'hours',
		min: 'min',
		manage_domain: 'Manage domain',
		manage_domain_go_back: 'Go back',
		manage_domain_mobile: 'Manage domain via Tonkeeper',
		manage_domain_unavailable: 'Service is temporarily unavailable. Please try again.'
	},
}

const ABOUT_LOCALES = {
	ru: {
		about: 'О сервисе',
		dark_mode: 'Темная тема',
		what_is_ton_domains: 'Что такое домены .ton?',
		what_is_ton_domains_p1:
			'TON DNS — сервис, который позволяет задать криптокошелькам, смарт-контрактам или сайтам короткие читаемые имена. С TON DNS доступ к децентрализованным сервисам аналогичен доступу к веб-сайтам в интернете.',
		your_nickname_on_a_decentralized_network:
			'Ваш никнейм в децентрализованной сети',
		your_nickname_on_a_decentralized_network_p1:
			'В социальных сетях или мессенджерах вы можете зарегистрировать себе имя пользователя (юзернейм), по которому вас легко найти другим людям.',
		your_nickname_on_a_decentralized_network_p2:
			'Теперь вы можете зарегистрировать домен в блокчейне TON и прописать туда адрес вашего кошелька — это станет вашим юзернеймом в сети TON.',
		your_nickname_on_a_decentralized_network_video1:
			'Вводите домен вместо адреса получателя при отправке монет.',
		your_nickname_on_a_decentralized_network_video2:
			'Вводите домен в поисковой строке обозревателя сети.',
		your_nickname_on_a_decentralized_network_p3:
			'Сервисы <a href="https://tonkeeper.com/" target="_blank">Tonkeeper</a>, <a href="https://wallet.ton.org/" target="_blank">TON Web Wallet</a> и <a href="https://tonscan.org/" target="_blank">Tonscan</a> уже сделали поддержку TON DNS. Большинство других приложений в TON также планирует реализовать поддержку, так что домен можно будет использовать повсеместно.',
		your_nickname_on_a_decentralized_network_p4:
			'Домены могут регистрировать не только пользователи, но и разработчики для смарт-контрактов своих децентрализованных сервисов. Теперь у смарт-контрактов тоже будут свои юзернеймы, как у ботов в мессенджерах.',
		a_simple_and_convenient_blockchain: 'Удобный и простой блокчейн',
		a_simple_and_convenient_blockchain_p1:
			'TON ставит своей целью достичь массового использования так, чтобы даже неопытные пользователи могли получить преимущества и безопасность от децентрализованных технологий.',
		a_simple_and_convenient_blockchain_p2:
			'Разработчики в сети TON только усилили работу в этом направлении — например, последнее <a href="https://t.me/toncoin/400">обновление</a> <a href="https://t.me/wallet">@wallet</a> позволяет отправлять монеты собеседнику прямо в мессенджере Telegram, а <a href="https://t.me/toncoin/441">интеграция</a> NFT в Tonkeeper задает новый стандарт качества для криптокошельков.',
		a_simple_and_convenient_blockchain_p3:
			'Вы могли заметить, что в TON-приложениях почти нет технической информации — мы не забиваем голову пользователей номерами блоков и хешами транзакций.',
		footer_support: "Помощь",
		a_simple_and_convenient_blockchain_p4:
			'Единственная техническая деталь, которую сразу видел пользователь — это адрес кошелька, и хоть он не сильно сложнее номера телефона или адреса банковской карты, мы рады, что с запуском TON DNS это тоже удалось упростить.',
		but_we_are_taking_a_step_even_closer_toward:
			'Еще один шаг к децентрализованному интернету',
		but_we_are_taking_a_step_even_closer_toward_p1:
			'В третьем квартале 2022 года запустились TON Sites и TON Proxy.',
		but_we_are_taking_a_step_even_closer_toward_p2:
			'Это технология децентрализованных сайтов, которая обеспечивает больше приватности и безопасности как пользователям, так и владельцам сайтов.',
		but_we_are_taking_a_step_even_closer_toward_p3:
			'Помимо этого появятся инструменты для взаимодействия смарт-контрактов блокчейна с интернет-ресурсами и наоборот.',
		but_we_are_taking_a_step_even_closer_toward_p4:
			'К домену TON DNS можно привязать не только адрес кошелька, но также и подключить TON-сайт.',
		but_we_are_taking_a_step_even_closer_toward_p5:
			'Мы видим в TON DNS хорошую альтернативу централизованным доменным регистраторам, которые зачастую могут заблокировать домен вашего сайта не по самым объективным причинам или же просто по ошибке.',
		ton_domain_names_are_nft: 'Домены .ton — это NFT',
		ton_domain_names_are_nft_p1:
			'Доменная зона TON DNS называется ".ton". Пользователи регистрируют свои домены в этой зоне: например, "alice.ton".',
		ton_domain_names_are_nft_p2:
			'Домены в зоне TON — это NFT. Это значит, что вы сможете хранить, дарить или продавать свои домены так же, как вы это делаете с обычными NFT.',
		ton_domain_names_are_nft_p3:
			'Домен отображается в кошельках и его можно выставить на продажу на NFT-маркетплейсах, таких как <a href="https://getgems.io/">Getgems</a> или <a href="https://beta.disintar.io/">Disintar</a> — они уже это поддерживают.',
		ton_domain_names_are_nft_image1: 'Домены в NFT-маркетплейсе Getgems',
		rules_for_ton_domain_names: 'Правила доменов .ton',
		rules_for_ton_domain_names_p1:
			'Домен в зоне ".ton" должен быть не менее 4 символов и не более 126 символов. Регистрация доменов менее 4 символов недоступна, чтобы не вносить дополнительную путаницу со стандартными интернет-доменами вроде "com", "org", "gov" и т.п.',
		rules_for_ton_domain_names_p2:
			'В домене можно использовать английские символы, цифры и дефис.',
		rules_for_ton_domain_names_p3:
			'Хотя технически можно было сделать доменные имена даже в виде эмоджи, они недоступны, т.к многие символы выглядят одинаково (например, 😗 и 😙), что могло бы быть использовано мошенниками.',
		rules_for_ton_domain_names_p4:
			'Раз в год владельцу домена требуется отправить хотя бы одну нанокопейку на смарт-контракт домена и продлить таким образом домен еще на год. Если домен не продлить, он перейдет в режим аукциона. Это сделано для того, чтобы домены не были потеряны навечно, если их владельцы каким-либо образом утратили к ним доступ.',
		decentralization: 'Децентрализация',
		decentralization_p1:
			'TON DNS — это децентрализованная доменная система. Не существует "администратора", который сможет заблокировать ваш домен.',
		decentralization_p2:
			'Для исключительных случаев предусмотрена возможность смены владельца или удаление домена посредством общесетевого голосования. Заметим, что большинством в сети можно поменять не только DNS, но и любую конфигурацию блокчейна, но т.к. в сети несколько сотен независимых валидаторов, то для таких изменений нужен исключительно веский повод.',
		auction_rules: 'Условия аукциона',
		auction_rules_li1:
			'Аукцион на домен длится неделю. В будущем длительность аукциона может быть снижена для удобства пользователей.',
		auction_rules_li2:
			'Любой пользователь может сделать ставку в Toncoin на приобретение любого домена.',
		auction_rules_li3:
			'Если ставка делается менее чем за час до окончания аукциона, то аукцион продлевается на час, чтобы другие пользователи могли успеть совершить ответные ставки.',
		auction_rules_li4:
			'Каждая новая ставка должна не менее чем на 5% превышать предыдущую.',
		auction_rules_li5:
			'После окончания аукциона пользователь, сделавший лучшую ставку, забирает домен.',
		claim_your_ton_domain:
			'Как забрать TON-домен с аукциона и привязать к нему кошелёк',
		claim_your_ton_domain_h1: 'Убедитесь, что вы выиграли аукцион',
		claim_your_ton_domain_h2: 'Заберите домен с аукциона',
		claim_your_ton_domain_h3:
			'Установка адреса вашего кошелька в домен с помощью Tonkeeper',
		claim_your_ton_domain_h4:
			'Установка адреса вашего кошелька в домен с помощью расширения TON Wallet',
		claim_your_ton_domain_p1:
			'Зайдите на <a target="_blank" href="https://dns.ton.org/">TON DNS</a> и введите ваш домен. Если аукцион закончился, то вы должны увидеть следующее:',
		claim_your_ton_domain_p2:
			'Проверьте, что адрес владельца совпадает с адресом кошелька, с помощью которого вы делали ставки. Домен ваш, поздравляем!',
		claim_your_ton_domain_p3:
			'Чтобы забрать домен с аукциона и стать его полноценным владельцем, необходимо совершить с ним любое действие.',
		claim_your_ton_domain_p4:
			'Проще всего проставить в него адрес вашего кошелька. После этого вы сможете использовать короткое имя .ton вместо адреса кошелька во всех приложениях, которые поддерживают эту функцию.',
		claim_your_ton_domain_p5:
			'В <a target="_blank" href="https://tonkeeper.com/">Tonkeeper</a> у пользователей есть возможность хранить домены во вкладке "NFT". Также у каждого TON DNS появится кнопка "Link" ("Привязать", т.е проставить адрес кошелька в этот домен).',
		claim_your_ton_domain_p6:
			'1. Откройте браузер Google Chrome на компьютере.',
		claim_your_ton_domain_p7:
			'2. Установите TON-расширение для Google Chrome по этой <a target="_blank" href="https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd">ссылке</a>.',
		claim_your_ton_domain_p8:
			'3. Откройте расширение, нажмите "Import wallet" и зайдите в кошелек, с помощью которого делались ставки, с помощью фразы восстановления.',
		claim_your_ton_domain_p9:
			'4. Теперь откройте ваш домен на <a target="_blank" href="https://dns.ton.org/">TON DNS</a> и нажмите кнопку "Редактировать".',
		claim_your_ton_domain_p10:
			'5. Скопируйте адрес вашего кошелька в поле "Адрес кошелька" и нажмите "Сохранить".',
		claim_your_ton_domain_p11:
			'6. Подтвердите отправку транзакции в расширении.',
		claim_your_ton_domain_a1:
			'Настройка TON Sites и поддоменов  <svg class="arrow" width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'                <path d="m2 11 5-4.5L2 2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
			'            </svg>',
		developers: 'Разработчикам',
		developers_p1:
			'Каждый домен хранит до 2^256 DNS-записей, в нем можно хранить не только адрес кошелька и сайта, но и все что угодно.',
		developers_p2: 'Вы можете использовать это в своих продуктах.',
		developers_p3:
			'Домену можно назначить произвольный смарт-контракт, отвечающий за менеджмент субдоменов. Он может реализовывать любую функциональность, что может быть использовано для создания новых механик.',
		developers_p4:
			'Мы приветствуем написание вспомогательных сервисов, которые могли бы упростить пользователям участие в аукционах, например, чтобы у пользователей не было необходимости просыпаться рано утром, если аукцион проходит в неудобное время. Такие сервисы могли бы брать небольшую комиссию в Toncoin за свою работу.',
		developers_a1: 'Документация',
	},
	en: {
		about: 'About',
		dark_mode: 'Dark mode',
		what_is_ton_domains: 'What are .ton domains?',
		what_is_ton_domains_p1:
			'TON DNS is a service that allows users to assign a human-readable name to crypto wallets, smart contracts, and websites. With TON DNS, access to decentralized services is analogous to access to websites on the internet.',
		your_nickname_on_a_decentralized_network:
			'Your nickname on a decentralized network',
		your_nickname_on_a_decentralized_network_p1:
			'You can create an account on social media and some messenger apps by registering a username, enabling others to find you more easily.',
		your_nickname_on_a_decentralized_network_p2:
			'Now you can register a domain name on the TON blockchain and assign it to your crypto wallet. This domain name will be your nickname on The Open Network.',
		your_nickname_on_a_decentralized_network_video1:
			'Enter the domain name instead of the recipient’s wallet address when sending TON.',
		your_nickname_on_a_decentralized_network_video2:
			'Enter the domain name in the search field of a TON explorer.',
		your_nickname_on_a_decentralized_network_p3:
			'The <a href="https://tonkeeper.com/" target="_blank">Tonkeeper</a>, <a href="https://wallet.ton.org/" target="_blank">TON Web Wallet</a>, and <a href="https://tonscan.org/" target="_blank">Tonscan</a> services have already integrated support for TON DNS. Most other TON-based apps also plan to implement support so that nicknames (domain names) can be used across the entirety of the TON ecosystem.',
		your_nickname_on_a_decentralized_network_p4:
			'In addition to users registering domain names, developers can also register domain names for the smart contracts of their decentralized services. Now, smart contracts will also have their own nicknames, just like bots in messenger apps.',
		a_simple_and_convenient_blockchain: 'A simple and convenient blockchain',
		a_simple_and_convenient_blockchain_p1:
			'TON has made it its mission to attain mass adoption to the point where even complete beginners will be able to reap the benefits of the network and the security provided by decentralized technologies.',
		a_simple_and_convenient_blockchain_p2:
			'TON developers have recently increased their output to achieve this goal. For example, the <a href="https://t.me/toncoin/400">latest update</a> of the <a href="https://t.me/wallet">@wallet</a> Telegram bot allows users to send Toncoin to other users directly within chats in the messenger, and the <a href="https://t.me/toncoin/441">NFT integration</a> in Tonkeeper has set a new standard for crypto wallets.',
		a_simple_and_convenient_blockchain_p3:
			'We’ve emphasized avoiding technical jargon and information in TON-based apps — we won’t inundate you with block numbers and transaction hashes.',
		a_simple_and_convenient_blockchain_p4:
			'The only technical detail immediately visible to the user is the wallet’s address. And although it’s simpler than a telephone or bank card number, we’re excited to know that the launch of TON DNS will simplify this process even more.',
		but_we_are_taking_a_step_even_closer_toward:
			'But we’re taking a step even closer toward a fully decentralized internet',
		but_we_are_taking_a_step_even_closer_toward_p1:
			'In Q3 2022, TON Sites and TON Proxy were launched.',
		but_we_are_taking_a_step_even_closer_toward_p2:
			'This decentralized technology provides more privacy and security to both the users and website owners.',
		but_we_are_taking_a_step_even_closer_toward_p3:
			'Besides these releases, there will also be tools to facilitate the interaction between blockchain smart contracts and internet resources and vice versa.',
		but_we_are_taking_a_step_even_closer_toward_p4:
			'Although you can assign a wallet address to a TON DNS, you’ll also be able to assign TON site.',
		but_we_are_taking_a_step_even_closer_toward_p5:
			'What we see in TON DNS is a welcome alternative to centralized domain registries, which can often block your site’s domain either for arbitrary reasons or erroneously.',
		ton_domain_names_are_nft: '.ton domain names are NFTs',
		ton_domain_names_are_nft_p1:
			'The domain zone for TON DNS is called “.ton”. Users will register their domain name like this: “alice.ton”, “.ton” domain names are NFTs.',
		ton_domain_names_are_nft_p2:
			'That means that once you obtain a domain name, you’ll be able to store, gift, or sell it — the same way you’d handle regular NFTs.',
		ton_domain_names_are_nft_p3:
			'Your domain will be stored in your wallet, and you’ll be able to put it up for sale on NFT marketplaces, such as <a href="https://getgems.io/">Getgems</a> or <a href="https://beta.disintar.io/">Disintar</a>, which already support TON DNS.',
		ton_domain_names_are_nft_image1:
			'Domain names for sale on NFT marketplace Getgems.',
		rules_for_ton_domain_names: 'Rules for .ton domain names',
		rules_for_ton_domain_names_p1:
			'The “.ton” domain name must be at least 4 characters and no more than 126 characters. Registering a domain name with fewer than 4 characters is unavailable to avoid confusion with well-known internet domain names, such as “com”, “org”, “gov”, etc.',
		rules_for_ton_domain_names_p2:
			'The domain must contain English letters, digits, and hyphen.',
		rules_for_ton_domain_names_p3:
			'However, technically, a domain name could depict an emoji, but they’re unavailable because a lot of them look the same — e.g., 😗 and 😙 — which scammers would use to trick unsuspecting users easily.',
		rules_for_ton_domain_names_p4:
			'Once per year, the domain’s owner will have to send a nanoton to the domain’s smart contract to extend the domain for a year. If the owner fails to extend their domain, it will go up for auction. Such is to prevent losing a domain forever in the event its owner loses access.',
		decentralization: 'Decentralization',
		decentralization_p1:
			'TON DNS is a decentralized domain name system. There is no “administrator” who can block your domain name.',
		decentralization_p2:
			'For exceptional cases, it is possible to change the owner or delete the domain by means of network-wide voting. Note that most of the network can change not only DNS, but also any configuration of the blockchain, but since there are several hundred independent validators on the network, then such changes need an exceptionally good reason.',
		auction_rules: 'Auction rules',
		auction_rules_li1:
			'The domain auction will last one week. In the future, the auction period may be shortened to make the process more convenient for all users.',
		auction_rules_li2:
			'All users will be able to place bids in Toncoin to win a domain name.',
		auction_rules_li3:
			'If a bid is placed with less than an hour left in the auction, it will be prolongated by one hour to allow other users to place counterbids.',
		auction_rules_li4:
			'Every new bid must be at least 5% higher than the previous.',
		auction_rules_li5:
			'When the auction closes, the user who placed the highest bid will collect their domain name.',
		claim_your_ton_domain:
			'How to claim your TON domain from the auction and assign a wallet to it',
		claim_your_ton_domain_h1:
			'Make sure you’ve won the auction for your domain name',
		claim_your_ton_domain_h2: 'Claim your domain from the auction',
		claim_your_ton_domain_h3: 'Assign your wallet address with Tonkeeper',
		claim_your_ton_domain_h4:
			'Assign your wallet address with TON Wallet extension',
		claim_your_ton_domain_p1:
			'Go to <a target="_blank" href="https://dns.ton.org/">TON DNS</a> and enter your domain. If the auction has closed, you’ll see this:',
		claim_your_ton_domain_p2:
			'Check whether the owner’s address is the same as your wallet address from which you placed bids. The domain is yours. Congratulations!',
		claim_your_ton_domain_p3:
			'To claim your domain from the auction and become its full owner, you need to complete one final step.',
		claim_your_ton_domain_p4:
			'You need to assign your wallet address to your domain name. Once you’ve completed this, you’ll be able to use your short .ton domain name instead of your long wallet address in all applications that support this function.',
		claim_your_ton_domain_p5:
			'<a target="_blank" href="https://tonkeeper.com/">Tonkeeper</a> allows users to store domain names in the “NFT” tab. Also, every TON DNS has a “Link” button — i.e., an “Assign” button to connect a wallet address to a domain.',
		claim_your_ton_domain_p6:
			'1. Open the Google Chrome web browser on your computer.',
		claim_your_ton_domain_p7:
			'2. Install the TON extension for Google Chrome by clicking on this <a target="_blank" href="https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd">link</a>.',
		claim_your_ton_domain_p8:
			'3. Open the extension, click on “Import wallet”, and go to your wallet from which you were bidding and where you have your recovery phrase.',
		claim_your_ton_domain_p9:
			'4. Now open your domain on <a target="_blank" href="https://dns.ton.org/">TON DNS</a> and click on “Manage your domain”.',
		claim_your_ton_domain_p10:
			'5. Copy the address of your wallet, paste it into the “Wallet address” field, and click “Save”.',
		claim_your_ton_domain_p11:
			'6. Confirm the transaction in the TON extension.',
		claim_your_ton_domain_a1:
			'How to link a domain for TON Sites and subdomains  <svg class="arrow" width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'                <path d="m2 11 5-4.5L2 2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
			'            </svg>',
		developers: 'Developers',
		developers_p1:
			'Each domain can store up to 2^256 DNS records where you can store not only your wallet addresses and websites but anything you want also.',
		developers_p2: 'You can use this in your products.',
		developers_p3:
			'A domain can be assigned an arbitrary smart contract responsible for the management of subdomains. It can implement any functionality that can be used to create new mechanics.',
		developers_p4:
			'We welcome the writing of auxiliary services that could simplify user participation in auctions; for example, so that users do not have to wake up early in the morning if the auction is held at an inconvenient time. Also, services could collect a small commission fee in Toncoin for their work.',
		developers_a1: 'Documentation',
	},
}
