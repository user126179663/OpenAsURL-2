class OpenUrls extends WX {
	
	static {
		
		this.tagName = 'open-urls',
		this.apiKeys = [ 'contextMenus', 'extension', 'notifications', 'permissions', 'runtime', 'storage', 'tabs', 'windows' ],
		
		this.CFG_PATH = 'cfg.json',
		
		this.defaultProtocol = 'https',
		this.secondaryProtocol = 'http',
		
		this.fixProtocolRx = /^(((h)?t)?tp(s)?)?(:\/\/)?/;
		
	}
	
	static getUrls(urls, ignoresNoScheme, upgradesToHttps, usesHttpByDefault) {
		
		if (urls && typeof urls === 'string' && (urls = urls.match(re_weburl_mod))) {
			
			let l;
			
			if (l = urls.length) {
				
				const	{ defaultProtocol, fixProtocolRx, secondaryProtocol } = this,
						definedDefaultProtocol = usesHttpByDefault ? secondaryProtocol : defaultProtocol;
				let i, url,matched;
				
				i = -1;
				while (++i < l)	urls[i] = url = (matched = (url = urls[i]).match(fixProtocolRx))[5] ?
											(
												matched[1] ?
													(matched[2] && matched[3]) || (matched[1] = 'http' + (matched[4] ?? '')) :
													(matched[1] = ignoresNoScheme || definedDefaultProtocol),
												matched[1] === ignoresNoScheme ?
													ignoresNoScheme :
													(
														matched[1] === 'http' && upgradesToHttps && (matched[1] += 's'),
														matched[1] + '://' + url.substring(matched[0].length)
													)
											) :
											ignoresNoScheme || (urls[i] = definedDefaultProtocol + '://' + url),
											url === true && (urls.splice(i--,1), --l);
				
				return urls;
				
			}
			
		}
		
		return null;
		
	}
	
	constructor(browser, apiKeys) {
		
		super(browser, apiKeys);
		
		this.init();
		
	}
	
	init() {
		
		return this.inizitalized || !this.booted ?
			(
				
				this.initialized = false,
				this.available.then(() => this.booted = new Promise(async rs => {
					
					this.notification = {
						noUrl: {
								iconUrl: 'icon.svg',
								message: 'URL はありません。',
								title: this.meta?.name,
								type: 'basic'
							},
						notAllowedIncognitoAccess:	{
								iconUrl: 'icon.svg',
								message: 'プライベートウィンドウでの実行が許可されていないと、URL をプライベートウィンドウで開くことはできません。実行の許可は、この拡張機能の管理から行なえます。',
								title: this.meta?.name,
								type: 'basic'
							},
						requireClipboardWritePermission: {
								iconUrl: 'icon.svg',
								message: 'URL をコピーするには、この拡張機能の管理から「クリップボードへのデータ入力」を許可する必要があります。',
								title: this.meta?.name,
								type: 'basic'
							}
						
					},
					
					this.setting = {};
					
					const { CFG_PATH } = OpenUrls,
							{ browser, setting } = this,
							{ contextMenus, storage } = this.browser;
					let i,k, saves, storedStorage, v;
					
					await fetch(CFG_PATH).then(fetched => fetched.json()).then(json => this.cfg = json),
					
					await this.getStorage().then(storage => storedStorage = storage);
					
					const	{ cfg: { ['main-item-in-context-menu']: mainMenuItem, values } } = this, l = values.length,
							{ setting: stored = {} } = storedStorage;
					
					i = -1;
					while (++i < l) setting[k = (v = values[i]).key] = k in stored ? stored[k] : (saves ||= true, v.value);
					
					await this.setStorage({ setting, cfg: this.cfg }),
					
					this.updateMenu?.((this.mainMenuItem = mainMenuItem).option, true),
					
					this.initialized = true,
					
					rs(this);
					
				}))
				
			) :
			this.booted;
		
	}
	
	updateMenu(option = this.mainMenuItemOption, creates) {
		
		const	{
					browser: { contextMenus },
					meta: { name },
					setting: { ['show-selected-text']: showsText },
					mainMenuItem: { extendedMenuItemText, accessKey }
				} = this;
		let id, v;
		
		contextMenus && typeof contextMenus === 'object' && (
				
				(option = { ...option }).title = name + (showsText ? extendedMenuItemText : '') + accessKey,
				
				creates ?	(v = contextMenus.create?.(this.mainMenuItemOption = option)) :
								(id = option.id, delete option.id, v = contextMenus.update?.(id, option))
				
			);
		
		return v;
		
	}
	
	openUrls(urls, tabIndex, incognito) {
		
		const l = urls && (Array.isArray(urls) ? urls : (urls = [ urls ])).length,
				{ browser: { extension, tabs, notifications, windows }, notification, setting } = this;
		
		if (l) {
			
			const	hasTabIndex = typeof tabIndex === 'number',
					tabOption = { active: !!setting['move-tab-opened'] };
			let i;
			
			if (setting['open-incognito'] ? !incognito : incognito) {
				
				extension.isAllowedIncognitoAccess().then(
						allowedIncognitoAccess =>
							allowedIncognitoAccess ?	windows.create?.({ incognito: true, url: urls }) :
																setting['enabled-notifications'] &&
																	notifications?.create?.(notification.notAllowedIncognitoAccess)
					);
				
			} else {
				
				i = -1, hasTabIndex && (tabOption.index = tabIndex - 1);
				while (++i < l)	hasTabIndex && ++tabOption.index,
										tabOption.url = urls[i],
										tabs?.create?.(tabOption),
										i || (tabOption.active &&= false);
				
			}
			
		} else {
			
			setting['enabled-notifications'] && (notifications?.create?.(notification.noUrl));
			
		}
		
	}
	
	update(updated, forces) {
		
		const { setting } = this;
		let k;
		
		for (k in updated) (forces || k in setting) && (setting[k] = updated[k]);
		
		this.updateMenu();
		
	}
	
}

// オブジェクトが HTMLElement を継承する場合、インスタンスを作る前にオブジェクトを CustomElementRegistry.define で要素として定義する必要がある。
// でなければ Illigal constructor. のエラーになる。
customElements.define(OpenUrls.tagName, OpenUrls);

// オブジェクト OpenUrls は、初期化処理内に非同期処理が含まれている。
// これは background が実行中の時は問題になりにくいが、
// background は一度停止したあとにイベントなどを通じて再び実行されると、起動時と同じ処理を再び繰り返す。
// これは実質的な再起動で、停止前の変数の値などはすべて失われており、クロージャなどを通じて停止前と後での直接的な値の受け渡しもできない。
// こうした仕様そのものは実際にはあまり問題にならないかもしれないが、
// 以下のようにインスタンスを作成する時に、コンストラクター内に先に述べたような非同期処理が含まれていた場合、
// その非同期処理の完了前にイベントリスナーの実行が行なわれ、かつリスナーの中にインスタンスを使用する処理が含まれていると、
// インスタンスのプロパティの作成が間に合わなかった場合に処理に不整合を引き起こす恐れが生じる。
// そのため、ここではインスタンスの初期化処理の完了で解決する Promise を示すプロパティをインスタンスに作成し、
// イベントリスナー内ではそのプロパティが持つ Promise の解決後に続く処理を実行するようにしている。
// 具体的には openUrls.booted が初期化処理の完了を確認できるプロパティで、
// openUrls.booted.then(...) で、イベントが通知されたリスナー内ののインスタンスを使う処理を実行している。
const openUrls = new OpenUrls(browser || chrome);

browser.action?.onClicked?.addListener?.(() => browser.runtime.openOptionsPage()),

browser.permissions?.onRemoved?.addListener?.(removed => {
		
		openUrls.booted.then(() => {
			
			const	{ permissions } = removed, l = permissions.length,
					{ cfg: { values }, setting } = openUrls, l0 = values.length;
			let i,i0,v, pList;
			
			i = -1;
			while (++i < l) {
				i0 = -1;
				while (++i0 < l0) Array.isArray(pList = (v = values[i0]).permissions) &&
					(pList.indexOf(permissions[i]) === -1 || (setting[v.key] = false));
			}
			
			openUrls.setStorage({ setting });
			
		});
		
	}),
browser.storage?.onChanged?.addListener?.(storageChange => {
		
		openUrls.booted.then(() => {
			
			openUrls.getStorage('setting').then(storage => openUrls.update(storage.setting));
			
		});
		
	}),
browser.contextMenus?.onClicked?.addListener?.(async (info, tab) => {
		
		const	{
					apiKeys,
					booted,
					browser: { notifications },
					notification: { requireClipboardWritePermission },
					setting: {
						['enable-copying-urls']: copiesUrls,
						['ignore-no-scheme']: ignoresNoScheme,
						['upgrade-https']: upgradesHttps,
						['default-protocol']: defaultProtocol,
					}
				} = openUrls,
				urls = OpenUrls.getUrls(info.selectionText, upgradesHttps, defaultProtocol),
				{ modifiers } = info,
				copies = modifiers.indexOf('Ctrl') !== -1;
		
		await booted.then(() => copies || openUrls.openUrls(urls, tab.index + 1, modifiers.indexOf('Shift') !== -1));
		
		copiesUrls && copies && urls?.length &&
			(
				apiKeys.indexOf('clipboardWrite') === -1 ?
					notifications?.create?.(requireClipboardWritePermission) :
					navigator.clipboard.writeText(urls.join('\n'))
			);
		
	});
//browser.commands?.onCommand?.addListener?.(command => {
//		
//		const { setting } = openUrls;
//		
//		if (setting['disable-commands']) return;
//		
//		switch (command) {
//			case 'open-urls':
//			
//			break;
//		}
//		
//	});