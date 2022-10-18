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
	
	init() {
		
		return this.inizitalized || !this.available ?
			(
				this.initialized = false,
				this.available = new Promise(async rs => {
					
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
					
					this.initialized = true,
					
					rs(this);
					
				})
			) :
			this.available;
		
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
			
			setting['enabled-notifications'] && (notifications?.create?.(this.notification.noUrl));
			
		}
		
	}
	
	update(updated) {
		
		const { setting } = this;
		let k;
		
		for (k in updated) setting[k] = updated[k];
		
		this.updateMenu();
		
	}
	
}

// オブジェクトが HTMLElement を継承する場合、インスタンスを作る前にオブジェクトを CustomElementRegistry.define で要素として定義する必要がある。
// でなければ Illigal constructor. のエラーになる。
customElements.define(OpenAsUrl.tagName, OpenAsUrl);

// オブジェクト OpenAsUrl は、初期化処理内に非同期処理が含まれている。
// これは background が実行中の時は問題になりにくいが、
// background は一度停止したあとにイベントなどを通じて再び実行されると、起動時と同じ処理を再び繰り返す。
// これは実質的な再起動で、停止前の変数の値などはすべて失われており、クロージャなどを通じて停止前と後での直接的な値の受け渡しもできない。
// こうした仕様そのものは実際にはあまり問題にならないかもしれないが、
// 以下のようにインスタンスを作成する時に、コンストラクター内に先に述べたような非同期処理が含まれていた場合、
// その非同期処理の完了前にイベントリスナーの実行が行なわれ、かつリスナーの中にインスタンスを使用する処理が含まれていると、
// インスタンスのプロパティの作成が間に合わなかった場合に処理に不整合を引き起こす恐れが生じる。
// そのため、ここではインスタンスの初期化処理の完了で解決する Promise を示すプロパティをインスタンスに作成し、
// イベントリスナー内ではそのプロパティが持つ Promise の解決後に続く処理を実行するようにしている。
// 具体的には openAsUrl.available が初期化処理の完了を確認できるプロパティで、
// openAsUrl.available.then(...) で、イベントが通知されたリスナー内ののインスタンスを使う処理を実行している。
const openAsUrl = new OpenAsUrl(browser || chrome);

browser.action.onClicked.addListener(() => browser.runtime.openOptionsPage()),

browser.storage?.onChanged?.addListener?.(storageChange => {
		
		const setting = WX.getCurrentStorage(storageChange);
		
		openAsUrl.available.then(() => openAsUrl.update(setting));
		
	}),
browser.contextMenus?.onClicked?.addListener?.((info, tab) => {
		
		openAsUrl.available.then(() =>
				openAsUrl.openUrls(
						OpenAsUrl.getUrls(
								info.selectionText,
								openAsUrl.setting['upgrade-https'],
								openAsUrl.setting['default-protocol']
							),
						tab.index + 1
					)
			);
		
	});