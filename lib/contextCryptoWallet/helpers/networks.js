const networks = {
	1: {
		chainId: '0x1', // A 0x-prefixed hexadecimal chainId
	},
	42: {
		chainId: '0x2a', // A 0x-prefixed hexadecimal chainId
		chainName: 'Kovan Ethereum Testnet',
		nativeCurrency: {
			name: 'Ethereum',
			symbol: 'ETH',
			decimals: 18,
		},
		rpcUrls: ['https://kovan.infura.io/v3/undefined'],
		blockExplorerUrls: ['https://kovan.etherscan.io'],
	},
	56: {
		chainId: '0x38', // A 0x-prefixed hexadecimal chainId
		chainName: 'Binance Smart Chain',
		nativeCurrency: {
			name: 'Binance Coin',
			symbol: 'BNB',
			decimals: 18,
		},
		rpcUrls: ['https://bsc-dataseed.binance.org'],
		blockExplorerUrls: ['https://bscscan.com'],
	},
	100: {
		chainId: '0x64', // A 0x-prefixed hexadecimal chainId
		chainName: 'xDai',
		nativeCurrency: {
			name: 'xDai',
			symbol: 'xDai',
			decimals: 18,
		},
		rpcUrls: ['https://xdai.poanetwork.dev'],
		blockExplorerUrls: ['https://blockscout.com/poa/xdai'],
	},
	137: {
		chainId: '0x89', // A 0x-prefixed hexadecimal chainId
		chainName: 'Polygon',
		nativeCurrency: {
			name: 'Matic',
			symbol: 'MATIC',
			decimals: 18,
		},
		rpcUrls: ['https://matic-mainnet.chainstacklabs.com'],
		blockExplorerUrls: ['https://explorer.matic.network'],
	},
	10001: {
		chainId: '0x2711',
		chainName: 'EthereumPOW',
		nativeCurrency: {
			name: 'EthereumPOW',
			symbol: 'ETHW',
			decimals: 18,
		},
		rpcUrls: ['https://mainnet.ethereumpow.org'],
		blockExplorerUrls: ['https://mainnet.ethwscan.com'],
	},
	39797: {
		chainId: '0x9b75',
		chainName: 'Energi',
		nativeCurrency: {
			name: 'Energi',
			symbol: 'NRG',
			decimals: 18,
		},
		rpcUrls: ['https://nodeapi.energi.network'],
		blockExplorerUrls: ['https://explorer.energi.network'],
	},
	49797: {
		chainId: '0xc285', // A 0x-prefixed hexadecimal chainId
		chainName: 'Energi Testnet',
		nativeCurrency: {
			name: 'Energi',
			symbol: 'tNRG',
			decimals: 18,
		},
		rpcUrls: ['https://nodeapi.test.energi.network'],
		blockExplorerUrls: ['https://explorer.test.energi.network'],
	},
};

export default networks;
