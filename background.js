class OpenAsUrl extends WX {
	
	static {
		
		this.tagName = 'open-as-url',
		this.apiKeys = [ 'contextMenus', 'notifications', 'permissions', 'runtime', 'storage', 'tabs' ],
		
		this.DEFAULT_SETTINGS_PATH = 'default-settings.json',
		
		this.defaultProtocol = 'https',
		this.secondaryProtocol = 'http',
		
		this.fixProtocolRx = /^(((h)?t)?tp(s)?)?(:\/\/)?/;
		
	}
	
	static getUrls(urls, upgradesToHttps, usesHttpByDefault) {
		
		if (urls && typeof urls === 'string' && (urls = urls.match(re_weburl_mod))) {
			
			const l = urls.length;
			
			if (l) {
				
				const	{ defaultProtocol, fixProtocolRx, secondaryProtocol } = this,
						definedDefaultProtocol = usesHttpByDefault ? secondaryProtocol : defaultProtocol;
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
	
	constructor(browser, apiKeys) {
		
		super(browser, apiKeys);
		
		this.notification = {
			noUrl:	{
							iconUrl: 'icon.svg',
							message: 'URL はありません。',
							title: this.meta?.name,
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
		
		await fetch(DEFAULT_SETTINGS_PATH).then(fetched => fetched.json()).then(json => defaultSetting = json),
		
		await this.getStorage().then(storage => stored = storage);
		
		for (k in defaultSetting) setting[k] = k in stored ? stored[k] : (saves ||= true, defaultSetting[k]);
		
		this.updateMenu?.(setting["main-item-in-context-menu"].option, true),
		
		saves && await this.setStorage(setting);
		
	}
	
	updateMenu(option = this.mainMenuItemOption, creates) {
		
		const	{
					browser: { contextMenus },
					meta: { name },
					setting: {
						['show-selected-text']: showsText,
						['main-item-in-context-menu']: { extendedMenuItemText, accessKey }
					}
				} = this;
		let id;
		
		contextMenus && typeof contextMenus === 'object' && (
				
				(option = { ...option }).title = name + (showsText ? extendedMenuItemText : '') + accessKey,
				
				creates ?	contextMenus.create?.(this.mainMenuItemOption = option) :
								(id = option.id, delete option.id, contextMenus.update?.(id, option))
				
			);
		
	}
	
	openUrls(urls, tabIndex) {
		
		const l = urls && (Array.isArray(urls) ? urls : (urls = [ urls ])).length,
				{ browser: { tabs, notifications }, setting } = this;
		
		if (l) {
			
			const	hasTabIndex = typeof tabIndex === 'number',
					tabOption = { active: !!setting['move-tab-opened'] };
			let i;
			
			i = -1, hasTabIndex && (tabOption.index = tabIndex - 1);
			while (++i < l)	hasTabIndex && ++tabOption.index,
									tabOption.url = urls[i],
									tabs?.create?.(tabOption),
									i || (tabOption.active &&= false);
			
		} else {
			
			setting['enabled-notifications'] && notifications?.create?.(this.notification.noUrl);
			
		}
		
	}
	
	update(updated) {
		
		const { setting } = this;
		let k;
		
		for (k in updated) setting[k] = updated[k];
		
		this.updateMenu();
		
	}
	
}

customElements.define(OpenAsUrl.tagName, OpenAsUrl);

const openAsUrl = new OpenAsUrl(browser || chrome), { browser: wx } = openAsUrl;

wx.storage.onChanged?.addListener?.(storageChange => {
		
		const setting = WX.getCurrentStorage(storageChange);
		
		openAsUrl.update(setting);
		
	}),
wx.contextMenus.onClicked?.addListener?.((info, tab) => {
		
		openAsUrl.openUrls(
				OpenAsUrl.getUrls(
						info.selectionText,
						openAsUrl.setting['upgrade-https'],
						openAsUrl.setting['default-protocol']
					),
				tab.index + 1
			);
		
	});