const
{ contextMenus, tabs } = browser || chrome,
hi = console.log.bind(console, 'hi');

class OpenAsUrl {
	
	static {
		
		this.defaultProtocol = 'https',
		this.upgradesToHttps = false,
		
		this.menu = {
			contexts: [ 'selection' ],
			title: 'URL として開く: "%s"(&U)'
		},
		
		this.fixProtocolRx = /^(((h)?t)?tp(s)?)?(:\/\/)?/;
		
	}
	
	static getUrls(urls, disableNotice) {
		
		if (urls && typeof urls === 'string' && (urls = urls.match(re_weburl_mod))) {
			
			const l = urls.length;
			
			if (l) {
				
				const { defaultProtocol, fixProtocolRx, upgradesToHttps } = OpenAsUrl;
				let i, url,matched;
				
				i = -1;
				while (++i < l)	urls[i] = (matched = (url = urls[i]).match(fixProtocolRx))[5] ?
											(
												matched[1] ?
													(matched[2] && matched[3]) || (matched[1] = 'http' + (matched[4] ?? '')) :
													(matched[1] = defaultProtocol),
												matched[1] === 'http' && upgradesToHttps && (matched[1] += 's'),
												matched[1] + '://' + url.substring(matched[0].length)
											) :
											defaultProtocol + '://' + url;
				
				return urls;
				
			}
			
		}
		
		return null;
		
	}
	
	static onClicked(info, tab) {
		
		const urls = OpenAsUrl.getUrls(info.selectionText);
		
		urls && this.openUrls(urls, tab.index + 1);
		
	}
	
	constructor() {
		
		contextMenus.onClicked.addListener(this.onClicked = OpenAsUrl.onClicked.bind(this)),
		
		contextMenus.create({ ...OpenAsUrl.menu, id: this.MENU_ID = crypto.randomUUID() });
		
	}
	
	openUrls(urls, tabIndex) {
		
		const l = (Array.isArray(urls) ? urls : (urls = [ urls ])).length;
		
		if (l) {
			
			const hasTabIndex = typeof tabIndex === 'number', tabOption = { active: false };
			let i;
			
			i = -1, hasTabIndex && (tabOption.index = tabIndex - 1);
			while (++i < l) hasTabIndex && ++tabOption.index, tabOption.url = urls[i], tabs.create(tabOption);
			
		}
		
	}
	
}

new OpenAsUrl();