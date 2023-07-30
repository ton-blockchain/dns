const THEME = TON_CONNECT_UI.THEME;

const COLORS_SET = {
	[THEME.LIGHT]: {
		connectButton: {
			background: '#0098EA',
			foreground: '#FFFFFF',
		},
		accent: '#0098EA',
		icon: {
			primary: '#232328',
			secondary: '#98B2BF',
			tertiary: '#C0D1D9',
			success: '#47C58A',
			error: '#ED6767',
		},
		background: {
			primary: '#FFFFFF',
			secondary: '#F5F7FA',
			segment: '#FFFFFF',
		},
		text: {
			primary: '#04060B',
			secondary: '#728A96',
		},
	},
  [THEME.DARK]: {
		connectButton: {
			background: '#0098EA',
			foreground: '#FFFFFF',
		},
		accent: '#F3F3F6',
		icon: {
			primary: '#E5E5EA',
			secondary: '#606069',
			tertiary: '#45454B',
			success: '#32D583',
			error: '#FF5C5C',
		},
		background: {
			primary: '#232328',
			secondary: '#2D2D32',
			segment: '#232328',
		},
		text: {
			primary: '#F3F3F6',
			secondary: '#ACACAF',
		},
	},
}

const CHAIN = {
  MAINNET: "-239",
  TESTNET: "-3"
}