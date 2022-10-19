const hi = console.log.bind(console, 'hi');

class WX extends HTMLElement {
	
	static changedStorage(storageChange) {
		
		const { current, last } = WX.getCurrentStorage(storageChange, true);
		
		this.dispatchEvent(new CustomEvent('changed-values', { detail: { current, last, storageChange } }));
		
	}
	static getCurrentStorage(storageChange, both) {
		
		const l = storageChange.length, current = {}, last = both && {};
		let k,v;
		
		for (k in storageChange) current[k] = (v = storageChange[k]).newValue, last && (last[k] = v.oldValue);
		
		return last ? { current, last } : current;
		
	}
	static async changedPermissions(isAdd, changed) {
		
		const type = isAdd ? 'add' : 'remove';
		
		this[type + 'Apis'](changed.permissions);
		
		await (this.permissions.getAll || this.resolver)().then((current = {}) => {
			
			this.dispatchEvent(new CustomEvent('changed-permissions', { detail: { type, changed, current } }));
			
		});
		
	}
	
	// 第一引数 data の再帰可能な記述子に基づいて構築した HTML 要素を第二引数 parent に指定された要素に追加する。
	// 戻り値は作成した要素の最上位の要素。data は記述子か配列に入れた記述子を指定できるため、
	// 配列の場合は要素、配列に入れた記述子の場合は配列に列挙された要素が返る。
	// ファイル記述子として任意の HTML 要素を指定すると、 記述子はその要素のクローンで代替される。
	// クローンは cloneNode で作成されるが、要素に属性 dataset.sharrowCloneNode があれば、その第一引数 false で実行する。
	// また、要素が dataset.immigrates を持っていれば、クローンは作成されず、その要素がそのまま用いられる。
	// プロパティ callback には、関数実行中に特定の状況で実行するコールバック関数を指定できる。
	// callback に関数を指定すると、その関数は処理の最初に呼び出される。
	// callback にオブジェクトを指定すると、プロパティ begin, end にコールバック関数を設定でき、それぞれ処理の最初と最後に実行される。
	// 処理の最初の場合、関数の引数にはこの関数に与えられた引数 data, parent がそのまま渡される。
	// このコールバック関数は戻り値を指定でき、その値は end に指定されたコールバック関数に第四引数として与えられる。
	// 処理の最後に実行されるコールバック関数には、作成した要素 elm に続き
	// この関数に与えられた引数 data, parent、そして前述の begin が返した戻り値 returnValue が渡される。
	// callback など、一部のプロパティには非 JSON な値も指定できるが、引数 data は概ね JSON と互換性がある。
	// 以下は記述子の一例
	// {
	//		tag: 'div',
	// 	events: [ { type: 'click', handler: 'alert('hi')', argsNames: [ 'event' ] } ],
	//		attr: { 'class': 'sample' },
	//		style: { 'background-color': 'transparent' },
	//		contents: [ { $: 'hi' }, 'ho' ],
	//		children: [ ... ]
	// }
	static construct(data, parent, begin, end) {
		
		if (data === null || data === undefined) return;
		
		if (data instanceof Node)
			return data.hasAttribute('data-wx-construct-immigrates') ? data : data.cloneNode(data.hasAttribute('data-wx-construct-deep-clone'));
		
		let i,l,k, returnValue, elm;
		
		returnValue = begin?.(data, parent);
			
		if (Array.isArray(data)) {
			
			const { construct } = WX, constructed = new DocumentFragment();
			
			i = -1, l = data.length;
			while (++i < l) (elm = construct(data[i], parent, begin, end)) && constructed.appendChild(elm);
			parent instanceof Node && parent.appendChild(constructed);
			
			return constructed;
			
		} else if (typeof data !== 'object') data = { tag: 'text', contents: data };
		
		const { tag = 'div' } = data;
		
		if (tag === 'text' || typeof tag !== 'string') {
			
			elm = document.createTextNode(data.contents);
			
		} else {
			
			const	{ attr, children, ds, events, style, tag = 'div' } = data,
					{ style: $style, dataset } = elm = document.createElement(tag);
			
			if (typeof attr === 'string') {
				
				attr[0] === '#' ? (elm.id = attr.slice(1)) : (elm.className = attr);
				
			} else if (attr && typeof attr === 'object') {
				
				for (k in attr) elm.setAttribute(k === '_' ? 'class' : k, attr[k]);
				
			}
			
			if (ds && typeof ds === 'object') {
				
				for (k in ds) dataset[k] = ds[k];
				
			}
			
			if (style && typeof style === 'object') for (k in style) $style.setProperty(k, style[k]);
			
			if (events && typeof events === 'object') {
				
				const evs = Array.isArray(events) ? events : [ events ], args = [];
				let ev;
				
				i = -1, l = evs.length;
				while (++i < l) {
					
					if ((ev = evs[i]) && typeof ev === 'object') {
						
						const { bind, argsNames, handler, option = false, type = 'DOMContentLoaded', untrusts = false } = ev;
						let f, names, body;
						
						switch (typeof handler) {
							
							case 'function': f = handler; break;
							
							case 'string':
							
							argsNames &&	(
													names = Array.isArray(argsNames) ?
														argsNames : typeof argsNames === 'string' ? [ argsNames ] : []
												),
							body = handler;
							
						}
						
						f ||= new Function(...(names || [ 'event' ]), body || 'console.log(event)'),
						
						elm.addEventListener(
								type,
								bind ? 'args' in ev ? Array.isArray(ev.args) ?
												f.bind(bind, ...ev.args) :
												f.bind(bind, ev.args) :
												f.bind(bind) :
												f,
								option,
								untrusts
							);
						
					}
					
				}
				
			}
			
			children && WX.construct(children, elm, begin, end);
			
			if ('contents' in data) {
				
				let contents, content, isStr;
				
				i = -1, l = (Array.isArray(contents = data.contents) || (contents = [ contents ])).length;
				while (++i < l) {
					elm[
							'insertAdjacent' +
							(
								(isStr = !((content = contents[i]) && typeof content === 'object')) ||
									content.is !== 'text' ? 'HTML' : 'Text'
							)
						]
						(isStr ? 'afterbegin' : content.position || 'afterbegin', isStr ? content : content.$);
				}
				
			}
			
		}
		
		parent instanceof Node && parent.appendChild(elm),
		
		end?.(elm, data, parent, returnValue);
		
		return elm;
		
	};
	
	constructor(browser, apiKeys) {
		
		super();
		
		const { changedStorage, changedPermissions } = WX;
		
		this.resolver = Promise.resolve.bind(Promise),
		
		this.changedStorage = changedStorage.bind(this),
		this.addedPermissions = changedPermissions.bind(this, true),
		this.removedPermissions = changedPermissions.bind(this, false),
		
		this.setBrowser(browser, apiKeys);
		
	}
	
	setBrowser(browser, apiKeys = this.constructor.apiKeys) {
		
		const last = this.browser;
		
		last && typeof last === 'object' && this.removeApis(Object.keys(last)),
		
		this.browser = browser = browser && typeof browser === 'object' ? browser : {},
		
		this.addApis(apiKeys);
		
	}
	addApis(keys) {
		
		const l = (keys = Array.isArray(keys) ? keys : [ ...arguments ]).length, { browser } = this;
		let i,k,api;
		
		i = -1;
		while (++i < l) {
			
			if (!(k = keys[i]) || typeof k !== 'string' || !(api = browser[k])) continue;
			
			api = browser[k] ||= {};
			
			switch (k) {
				
				case 'permissions':
				
				api.onAdded?.addListener?.(this.addedPermissions),
				api.onRemoved?.addListener?.(this.removedPermissions);
				
				break;
				
				case 'runtime':
				
				this.meta = api.getManifest?.() || {};
				
				break;
				
				case 'storage':
				
				this.getStorage = (api = api.local ||= {}).get.bind(api) || this.resolver,
				this.setStorage = api.set.bind(api) || this.resolver,
				
				browser.storage.onChanged?.addListener?.(this.changedStorage);
				
				break;
				
			}
			
		}
		
	}
	async removeApis(keys) {
		
		const l = (keys = Array.isArray(keys) ? keys : [ ...arguments ]).length, { browser } = this;
		let i,i0,k,api;
		
		i = -1;
		while (++i < l) {
			
			if (browser[k]) continue;
			
			switch (k) {
				
				case 'permissions':
				
				browser.permissions.onAdded?.removeListener?.(this.addedPermissions),
				browser.permissions.onRemoved?.removeListener?.(this.removedPermissions);
				
				break;
				
				case 'storage':
				
				browser.storage.onChange?.removeListener?.(this.changedStorage),
				
				delete this.getStorage, delete this.setStorage;
				
				break;
				
				case 'runtime':
				
				delete this.meta;
				
				break;
				
			}
			
			delete this[k];
			
		}
		
	}
	
	async getValue(key, defaultValue, asynchronous) {
		
		let value;
		const promise =	(
									this.getStorage || typeof key === 'string' ?
										this.getStorage(defaultValue === undefined ? key : { key: defaultValue }) :
										this.resolver
								).then(v => value = v[key]);
		
		return asynchronous ? promise : (await promise, value);
		
	}
	async setValue(key, value, asynchronous) {
		
		const promise = this.setStorage ? this.setStorage(key, value) : this.resolver;
		
		return asynchronous ? promise : await promise;
		
	}
	
	async getGrantedApiKeys(asynchronous) {
		
		let keys;
		const	{ permissions } = this.browser,
				promise = (permissions ? permissions.getAll() : this.resolver).then(all => keys = all?.permissions ?? []);
		
		return asynchronous ? promise : (await promise, keys);
		
	}
	
}