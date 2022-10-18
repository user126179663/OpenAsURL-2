class OpenAsUrlOptions extends WX {
	
	static {
		
		this.tagName = 'open-as-url-options',
		this.template = this.tagName,
		
		this.DEFAULT_SETTINGS_PATH = 'default-settings.json',
		
		this.apiKeys = [ 'contextMenus', 'permissions', 'runtime', 'storage' ];
		
	}
	
	static getPermissionsListFromNodes(nodes) {
		
		const	permissionsList = [], l = nodes.length;
		let i,i0,l0,i1, node, permissions,permission;
		
		i = i1 = -1;
		while (++i < l) {
			
			if ((node = nodes[i]) instanceof HTMLElement) {
				
				i0 = -1, l0 = (permissions = node.dataset.permissions.split(' ')).length;
				while (++i0 < l0)
					permissionsList.indexOf(permission = permissions[i0]) === -1 && (permissionsList[++i1] = permission);
				
			}
			
		}
		
		return permissionsList;
		
	}
	
	static
	flatPermissionsLists(
		granted,
		grantNodes = document.querySelectorAll(':checked[data-permissions]'),
		revokeNodes = document.querySelectorAll(':not(:checked)[data-permissions]')
	) {
		
		const	{ getPermissionsListFromNodes } = OpenAsUrlOptions,
				grants = getPermissionsListFromNodes(grantNodes),
				revocation = getPermissionsListFromNodes(revokeNodes);
		let i,i0,l, grant;
		
		i = -1, l = grants.length;
		while (++i < l)	grant = grants[i],
								granted && (granted.indexOf(grant) === -1 || (grants.splice(i--,1), --l)),
								(i0 = revocation.indexOf(grant)) === -1 || revocation.split(i0, 1);
		
		return { grants, revocation };
		
	}
	
	static getCtrlValue(ctrl) {
		
		return ctrl.disabled ? !!ctrl.dataset.disabledValue : ctrl.checked;
		
	}
	
	static applied({ detail: event }) {
		
		if (event && typeof event === 'object') {
			
			const { detail, setting } = event;
			
			if (detail && typeof detail === 'object') {
				
				const { target } = detail;
				
				//coco target がシャドウルート内の要素ではなくインスタンスが示すカスタム要素そのものになっている
				switch (target?.id) {
					
					case 'show-selected-text':
					
					if (target.checked === detail.beforeApplied) {
						
						const	mainMenuItemSetting = setting['main-item-in-context-menu'],
								mainMenuItemOption = { ...mainMenuItemSetting.option };
						
						delete mainMenuItemOption.id,
						
						mainMenuItemOption.title =	this.meta.name +
															(target.checked ? mainMenuItemSetting.extendedMenuItemText : '') +
															mainMenuItemSetting.accessKey,
						
						this.browser.contextMenus.update(mainMenuItemSetting.option.id, mainMenuItemOption);
						
					}
					
					break;
					
					default:
					
				}
				
			}
			
		}
		
	}
	static async changedCtrl({ target }) {
		
		const	{ flatPermissionsLists } = OpenAsUrlOptions,
				grantedPermissions = await this.getGrantedApiKeys(),
				ctrls = this.getControllers(), l = ctrls.length;
		let i, ctrl, reflection, permissionLists, callback;
		
		switch (target.id) {
			
			case 'restore-default-settings':
			
			const { lastSetting } = this;
			let i0,i1,k, json, defaultSetting, current;
			
			await fetch(OpenAsUrlOptions.DEFAULT_SETTINGS_PATH).
				then(async fetched => fetched.json()).then(async json => defaultSetting = json),
			
			i = i0 = i1 = -1, permissionLists = [];
			while (++i < l)	(ctrl = ctrls[i]).dataset.permissions &&
										(current = defaultSetting[k = ctrl.dataset.key]) &&
										lastSetting[k] !== current &&
										(permissionLists[++i0] = ctrl);
			
			permissionLists = flatPermissionsLists(grantedPermissions, permissionLists).additional,
			reflection = [ this.apply, this, [ defaultSetting ] ];
			
			break;
			
			case 'show-selected-text':
			
			reflection = [ this.save, this, [ { target, beforeApplied: target.checked } ] ];
			
			default:
			
			permissionLists = flatPermissionsLists(grantedPermissions).additional,
			reflection ||= [ this.save, this, [] ];
			
		}
		
		if (Array.isArray(permissionLists) && permissionLists.length) {
			
			i = -1;
			while (++i < l) (ctrl = ctrls[i]).hasAttribute('disabled') ||
				(ctrl.classList.add('disabled-temporary'), ctrl.disabled = true);
			
			await permissions.request({ permissions: permissionLists }).
				then(result => result || (target instanceof HTMLInputElement && (target.checked = false))),
			
			i = -1;
			while (++i < l) (ctrl = ctrls[i]).classList.contains('disabled-temporary') &&
				(ctrl.classList.remove('disabled-temporary'), ctrl.disabled = false);
			
		}
		
		reflection && Reflect.apply(...reflection);
		
	}
	
	static changedPermissions({ detail: { changed, current, type } }) {
		
		this.apply();
		
	}
	
	constructor(wxApi = browser || chrome, apiKeys) {
		
		super(wxApi, apiKeys);
		
		const { applied, changedCtrl, changedPermissions } = OpenAsUrlOptions;
		
		this.applied = applied.bind(this),
		this.changedCtrl = changedCtrl.bind(this),
		this.changedPermissions = changedPermissions.bind(this),
		
		(this.shadow = this.attachShadow({ mode: 'open' })).
			appendChild(document.getElementById(OpenAsUrlOptions.template).cloneNode(true).content);
		
	}
	connectedCallback() {
		
		this.setting || this.init();
		
	}
	
	async init() {
		
		await this.getStorage().then(setting => this.setting = setting),
		
		this.addEventListener('applied', this.applied),
		this.addEventListener('changed-permissions', this.changedPermissions),
		
		this.lastSetting = {},
		
		this.apply();
		
	}
	
	getValueNodes() {
		
		const nodes = this.shadow.querySelectorAll('.configurable'), l = nodes.length;
		let i, node;
		
		i = -1;
		while (++i < l) (node = nodes[i]).dataset.key = node.id;
		
		return nodes;
		
	}
	
	getControllers() {
		
		const	ctrls = [
					...this.getValueNodes(),
					...this.shadow.querySelectorAll('input:not(.configurable), button')
				],
				l = ctrls.length;
		let i, ctrl;
		
		i = -1;
		while (++i < l) (ctrl = ctrls[i]).dataset.eventType ||= 'change';
		
		return ctrls;
		
	}
	
	save(detail) {
		
		const { getCtrlValue } = OpenAsUrlOptions, { setting } = this, ctrls = this.getControllers(), l = ctrls.length;
		let i,k, ctrl;
		
		i = -1;
		while (++i < l) this.constrain(ctrl = ctrls[i]);
		
		i = -1;
		while (++i < l) (k = (ctrl = ctrls[i]).dataset.key) && (ctrl,setting[k] = getCtrlValue(ctrl));
		
		this.apply(setting, true, detail);
		
	}
	
	async apply(setting = this.setting, disablesUpdate, detail) {
		
		const { lastSetting } = this, ctrls = this.getControllers(), removalNodes = [];
		let i,l,i0,l0,k, ctrl, current, changedSetting;
		
		i = -1, l = ctrls.length;
		while (++i < l)	(ctrl = ctrls[i]).setAttribute('disabled', ''),
								ctrl.removeEventListener(ctrl.dataset.eventType, this.changedCtrl);
		
		i = i0 = -1;
		while (++i < l)
			current = setting[k = (ctrl = ctrls[i]).dataset.key],
			disablesUpdate || (ctrl.checked = current),
			ctrl.dataset.permissions && !current && lastSetting[k] !== current && (removalNodes[++i0] = ctrl);
		
		if (i0 !== -1) {
			
			const	{ permissions } = this.browser,
					{ removal } = getNormalizedPLists(null, granted = await this.getGrantedApiKeys(), removalNodes);
			
			await permissions.remove({ permissions: removal }).then(async result => {
					
					if (result) {
						
						const l = removal.length;
						let i,i0;
						
						i = -1;
						while (++i < l) (i0 = granted.indexOf(removal[i])) === -1 || granted.splice(i0,1);
						
					} else granted = await this.getGrantedApiKeys();
					
				});
			
			const grantNodes = document.querySelectorAll(`[data-permissions]`);
			let plist, ds;
			
			// setting と対応する input との値の整合性を確認しているが、
			// 値の変化が他の input と連動している可能性があるため、不整合が確認できても
			// このブロック内では input の値は変化させず、このブロック後に再帰処理してすべての input の値を setting に準じさせる。
			
			i = -1, l = grantNodes.length;
			while (++i < l) {
				i0 = -1, l0 = (plist = (ds = grantNodes[i].dataset).permissions.split(' ')).length;
				while (++i0 < l0 && granted.indexOf(plist[i0]) !== -1);
				i0 === l0 || (k = ds.key, changedSetting ||= setting[k] !== false, setting[k] &&= false);
			}
			
		}
		
		this.lastSetting = setting;
		
		if (changedSetting) {
			
			await this.apply(setting, disablesUpdate, detail);
			
		} else {
			
			await this.setStorage(setting);
			
			i = -1, l = ctrls.length;
			while (++i < l)	(ctrl = ctrls[i]).addEventListener(ctrl.dataset.eventType, this.changedCtrl),
									ctrl.removeAttribute('disabled');
			
			i = -1;
			while (++i < l) this.constrain(ctrl = ctrls[i]);
			
			this.dispatchEvent(new CustomEvent('applied', { detail: { setting, detail } }));
			
			//hi(setting);
			
		}
		
	}
	
	constrain({ checked, dataset }) {
		
		let i,l,nodes;
		
		i = -1, l = (nodes = this.shadow.querySelectorAll(dataset.disableTrue)).length;
		while (++i < l) nodes[i][(checked ? 'set' : 'remove') + 'Attribute']('disabled', '');
		
		i = -1, l = (nodes = this.shadow.querySelectorAll(dataset.disableFalse)).length;
		while (++i < l) nodes[i][(checked ? 'remove' : 'set') + 'Attribute']('disabled', '');
		
	}
	
}

customElements.define(OpenAsUrlOptions.tagName, OpenAsUrlOptions);

//addEventListener('DOMContentLoaded', () => {
//
//const	openAsUrlOptions = document.getElementsByTagName('open-as-url-options')[0],
//		{ browser: { permissions } } = openAsUrlOptions;
//
//permissions.onAdded?.removeListener?.(openAsUrlOptions.apply.bind(openAsUrlOptions)),
//permissions.onRemoved?.removeListener?.(openAsUrlOptions.apply.bind(openAsUrlOptions));
//
//}, { once: true });