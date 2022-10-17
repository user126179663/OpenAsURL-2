class OpenAsUrl extends WX {
	
	static {
		
		this.tagName = 'open-as-url',
		this.apiKeys = [ 'contextMenus', 'notifications', 'permissions', 'runtime', 'storage', 'tabs' ],
		
		this.DEFAULT_SETTINGS_PATH = 'default-settings.json',
		
		this.defaultProtocol = 'https',
		this.secondaryProtocol = 'http',
		
		this.accessKey = '(&U)',
		this.selectedTextInMenu = ': "%s"',
		this.menu = {
			contexts: [ 'selection' ],
			title: 'URL として開く'
		},
		
		this.fixProtocolRx = /^(((h)?t)?tp(s)?)?(:\/\/)?/;
		
	}
	
	static getUrls(urls, disableNotice) {
		
		if (urls && typeof urls === 'string' && (urls = urls.match(re_weburl_mod))) {
			
			const l = urls.length;
			
			if (l) {
				
				const	{ 'upgrade-https': upgradesToHttps, 'default-protocol': defaultProtocol, fixProtocolRx } = this,
						definedDefaultProtocol = defaultProtocol ? OpenAsUrl.secondaryProtocol : OpenAsUrl.defaultProtocol;
				let i, url,matched;
				
				i = -1;
				while (++i < l)	urls[i] = (matched = (url = urls[i]).match(fixProtocolRx))[5] ?
											(
												matched[1] ?
													(matched[2] && matched[3]) || (matched[1] = 'http' + (matched[4] ?? '')) :
													(matched[1] = definedDefaultProtocol),
												matched[1] === 'http' && upgradesToHttps && (matched[1] += 's'),
												matched[1] + '://' + url.substring(matched[0].length)
											) :
											definedDefaultProtocol + '://' + url;
				
				return urls;
				
			}
			
		}
		
		return null;
		
	}
	static changedSetting(storageChange) {
		hi(storageChange);
		this.update(WX.getCurrentStorage(storageChange));
		
	}
	
	static onMenuClicked(info, tab) {
		
		this.openUrls(OpenAsUrl.getUrls(info.selectionText), tab.index + 1);
		
	}
	
	constructor(browser, apiKeys) {
		
		super(browser, apiKeys);
		
		const { changedSetting, onMenuClicked } = OpenAsUrl;
		
		this.changedSetting = changedSetting.bind(this),
		this.onMenuClicked = onMenuClicked.bind(this),
		
		this.notification = {
			noUrl:	{
							title: this.meta?.name,
							message: 'URL はありません。',
							type: 'basic'
						}
		},
		
		this.init();
		
	}
	
	async init() {
		
		this.setting = {};
		
		const { DEFAULT_SETTINGS_PATH } = OpenAsUrl,
				{ browser, setting } = this,
				{ contextMenus, storage } = this.browser;
		let k, saves, stored, defaultSetting;
		
		storage.onChanged?.removeListener?.(this.changedSetting),
		
		await fetch(DEFAULT_SETTINGS_PATH).then(fetched => defaultSetting = fetched),
		
		await defaultSetting.json().then(json => defaultSetting = json),
		
		await this.getStorage().then(storage => stored = storage);
		
		for (k in defaultSetting) setting[k] = k in stored ? stored[k] : (saves ||= true, defaultSetting[k]);
		
		saves && await this.setStorage(setting),
		
		storage.onChanged?.addListener?.(this.changedSetting),
		hi(setting),
		this.MENU_ID && contextMenus?.remove?.(this.MENU_ID),
		contextMenus.onClicked?.addListener?.(this.onMenuClicked),
		contextMenus.create?.({
				
				...setting["main-item-in-context-menu"].option,
				
				title:	this.meta.name +
							(setting['show-selected-text'] ? setting["main-item-in-context-menu"].extendedMenuItemText : '') +
							setting["main-item-in-context-menu"].accessKey
				
			});
		
	}
	
	updateMenu(option = this.MENU, id = this.MENU_ID) {
		
		const { contextMenus } = browser;
		
		contextMenus &&	(
									'id' in option && (option = { ...option }, delete option.id),
									contextMenus.update?.(id, option)
								)
		
	}
	
	openUrls(urls, tabIndex) {
		
		const l = urls && (Array.isArray(urls) ? urls : (urls = [ urls ])).length;
		
		if (l) {
			
			const hasTabIndex = typeof tabIndex === 'number', tabOption = { active: !!this['move-tab-opened'] };
			let i;
			
			i = -1, hasTabIndex && (tabOption.index = tabIndex - 1);
			while (++i < l)	hasTabIndex && ++tabOption.index,
									tabOption.url = urls[i],
									browser.tabs?.create?.(tabOption),
									i || (tabOption.active &&= false);
			
		} else {
			
			this.getStorage('enabled-notifications').then(storage => {
					
					storage['enabled-notifications'] && browser.notifications?.create?.(this.notification.noUrl);
					
				});
			
		}
		
	}
	
	update(updated) {
		
		const { setting } = this;
		let k;
		
		for (k in updated) setting[k] = updated[k];
		
		this.updateMenu();
		
	}
	
}

customElements.define(OpenAsUrl.tagName, OpenAsUrl), new OpenAsUrl(browser || chrome);