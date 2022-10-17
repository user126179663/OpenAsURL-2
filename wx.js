const hi = console.log.bind(console, 'hi');

class WX extends HTMLElement {
	
	static changedStorage(storageChange) {
		
		const { current, last } = WX.getCurrentStorage(storageChange, true);
		
		this.dispatchEvent(new CustomEvent('changed-values', { detail: { current, last, storageChange } }));
		
	}
	static getCurrentStorage(storageChange, both) {
		
		const { changes } = storageChange, l = changes.length, current = {}, last = both && {};
		let k,v;
		
		for (k in changes) current[k] = (v = changes[k]).newValue, both && (last[k] = v.oldValue);
		
		return both ? { current, last } : current;
		
	}
	static async changedPermissions(isAdd, changed) {
		
		const type = isAdd ? 'add' : 'remove';
		
		this[type + 'Apis'](changed.permissions);
		
		await (this.permissions.getAll || this.resolver)().then((current = {}) => {
			
			this.dispatchEvent(new CustomEvent('changed-permissions', { detail: { type, changed, current } }));
			
		});
		
	}
	
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