const
{ storage: { local: storage } } = browser,
hi = console.log.bind(console, 'hi');

addEventListener('DOMContentLoaded', () => {
	
	const inputs = document.querySelectorAll('[data-default-value]'), l = inputs.length, defaultSetting = {};
	let i,i0,l0, input, disabled;
	
	i = -1;
	while (++i < l) defaultSetting[(input = inputs[i]).dataset.key ||= input.id] = input.dataset.defaultValue === 'true';
	
	storage.get(defaultSetting).then(setting => {
		
		const	defaultProtocol = document.getElementById('default-protocol'),
				inputs = document.querySelectorAll('[data-key], #restore-default-settings'),
				inputsLength = inputs.length,
				save = () => {
					
					const data = {};
					let i,k;
					
					i = -1;
					while (++i < l)
						(k = (input = inputs[i]).dataset.key) &&
							(data[k] = input.hasAttribute('disabled') ? !!input.dataset.disabledValue : input.checked),
						input.setAttribute('disabled', '');
					
					update(data, true);
					
				},
				update = (setting, disableInputsUpdate) =>
					storage.set(setting).then(() => apply(setting, disableInputsUpdate)),
				apply = (setting, disableInputsUpdate) => {
					
					let i;
					
					i = -1;
					while (++i < inputsLength)
						(input = inputs[i]).removeEventListener(input.dataset.eventType || 'change', changed),
						input.removeAttribute('disabled');
					
					i = -1;
					while (++i < inputsLength) constrain(inputs[i]);
					
					i = -1;
					while (++i < inputsLength) disableInputsUpdate ||
						((input = inputs[i]).checked = setting[input.dataset.key], constrain(input));
					
					i = -1;
					while (++i < inputsLength)
						(input = inputs[i]).addEventListener(input.dataset.eventType || 'change', changed);
					
				},
				constrain = ({ checked, dataset }) => {
					
					let i,l,nodes;
					
					i = -1, l = (nodes = document.querySelectorAll(dataset.disableTrue)).length;
					while (++i < l) nodes[i][(checked ? 'set' : 'remove') + 'Attribute']('disabled', '');
					
					i = -1, l = (nodes = document.querySelectorAll(dataset.disableFalse)).length;
					while (++i < l) nodes[i][(checked ? 'remove' : 'set') + 'Attribute']('disabled', '');
					
				},
				changed = ({ target }) => {
					
					switch (target.id) {
						
						case 'restore-default-settings': update(defaultSetting); break;
						
						default: save();
						
					}
					
				};
		
		apply(setting);
		
	});
	
});