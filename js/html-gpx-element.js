export class ElementShadow extends HTMLElement {
	
	static tagName = 'element-shadow';
	
	static $bind = Symbol('ElementShadow.bind');
	static $construct = Symbol('ElementShadow.construct');
	static $forcesInit = Symbol('ElementShadow.forcesInit');
	static $initialize = Symbol('ElementShadow.initialize');
	static $mutated = Symbol('ElementShadow.mutated');
	static $mutationObserver = Symbol('ElementShadow.mutationObserver');
	static $observedAttributes = Symbol('ElementShadow.observedAttributes');
	static $required = Symbol('ElementShadow.required');
	static $requiredAll = Symbol('ElementShadow.requiredAll');
	static $resizeObserver = Symbol('ElementShadow.resizeObserver');
	static $resized = Symbol('ElementShadow.resized');
	static $updateShadow = Symbol('ElementShadow.updateShadow');
	
	static attachShadowOption = { mode: 'open' };
	
	static assignedNodesOption = { flatten: true };
	
	static mutationInitOption = { childList: true, subtree: true };
	
	static get observedAttributes() {
		
		return this[ElementShadow.$observedAttributes];
		
	}
	
	static new(constructor = this, ...args) {
		
		const { $initialize } = ElementShadow, element = new constructor(...args);
		
		element[$initialize]?.();
		
		return element;
		
	}
	static requireElements(required, all, target = document, optional) {
		
		const difference = {};
		
		if (
			(target instanceof HTMLElement || target instanceof Document) &&
			required &&
			typeof required === 'object'
		) {
			
			const	{ dataset, shadowRoot } = target,
					warnings = optional && [],
					keys = [ ...Object.keys(required), ...Object.getOwnPropertySymbols(required) ],
					keysLength = keys.length;
			let i,i0,i1,l1, k, current,last;
			
			i = i0 = -1;
			while (++i < keysLength)
				difference[k = keys[i]] =	(current = shadowRoot.querySelectorAll(required[k])).length &&
														(all ? current : current[0]);
			
			i = i0 = -1;
			while (++i < keysLength) {
				
				current = difference[k = keys[i]];
				
				if (
					(last = target[k]) instanceof NodeList &&
					current instanceof NodeList &&
					(l1 = last.length) === difference[k]?.length
				) {
					
					i1 = -1, current = difference[k];
					while (++i1 < l1 && current[i1] === last[i1]);
					difference[k] = i1 === l1 || current;
					
				} else difference[k] = last === current || current;
				
				if (current) (target[k] = current);
					else if (optional)	warnings[++i0] = typeof k === 'symbol' ? Symbol.keyFor(k) : k;
					else						throw new Error(`No element for "${required[k]}".`);
				
			}
			
			i0 === -1 || (dataset.elementShadowNoRequiredElements = warnings.join(' '));
			
		}
		
		return difference;
		
	}
	
	// https://stackoverflow.com/questions/54520554/custom-element-getrootnode-closest-function-crossing-multiple-parent-shadowd
	static composeClosest(selector, scope) {
		
		return typeof scope?.closest === 'function' &&
			(scope.closest(selector) || (scope = scope?.getRootNode?.()?.host) && this.composeClosest(selector, scope)) ||
				null;
		
	}
	static closestObject(object, scope) {
		
		let parent;
		
		parent = scope;
		while (!(parent instanceof object) && (parent = parent.parentElement));
		
		return !parent && (scope = scope.getRootNode()?.host) ? ElementShadow.closestObject(object, scope) : scope;
		
	}
	
	static getRect(target) {
		
		if (target instanceof Element) {
			
			const rect = target.getBoundingClientRect(), v = {};
			let k,v0;
			
			for (k in rect) typeof (v0 = rect[k]) === 'number' && (v[k] = rect[k] + 'px');
			v['scroll-left'] = rect.left + scrollX + 'px', v['scroll-top'] = rect.top + scrollY + 'px';
			
			return v;
			
		}
		
	}
	
	static bindAll(handlers, thisArg, bound = thisArg || {}, ...args) {
		
		(thisArg && typeof thisArg === 'object') || (thisArg = bound);
		
		if (handlers && handlers.constructor === Object && thisArg && typeof thisArg === 'object') {
			
			const keys = [ ...Object.keys(handlers), ...Object.getOwnPropertySymbols(handlers) ], l = keys.length;
			let i, handler, k;
			
			i = -1;
			while (++i < l)
				typeof (handler = handlers[k = keys[i]]) === 'function' && (bound[k] = handler.bind(thisArg, ...args));
			
		}
		
		return bound;
		
	}
	
	static setAC(target, key, handler, option = { once: true }) {
		
		(target[key] = new AbortController()).signal.addEventListener('abort', handler, option);
		
	}
	
	static uid4() {
		
		const UID4F = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
		let i = -1, id = '', c;
		
		while (c = UID4F[++i]) id +=	c === 'x' ? Math.floor(Math.random() * 16).toString(16) :
												c === 'y' ? (Math.floor(Math.random() * 4) + 8).toString(16) : c;
		
		return id;
		
	}
	
	constructor() {
		
		super();
		
		const	{
					$bind,
					$forcesInit,
					$initialize,
					$mutated,
					$mutationObserver,
					$resized,
					$resizeObserver,
					bindAll,
					mutationInitOption
				} = ElementShadow;
		
		bindAll(this.constructor[$bind], this),
		
		this[$mutationObserver] = new MutationObserver(() => this[$mutated]()),
		this[$resizeObserver] = new ResizeObserver(() => this[$resized]()),
		
		(this.constructor[$forcesInit] || this.isConnected) && (this[$initialize]?.());
		
	}
	
	async attributeChangedCallback(name, last, current) {
		
		const { $resized, $resizeObserver, $updateShadow } = ElementShadow
		
		switch (name) {
			
			case 'shadow-css':
			this.updateShadowCSS();
			break;
			
			case 'template':
			this[$updateShadow]();
			break;
			
			case 'requires':
			current && this.requireElements(current);
			break;
			
			case 'resize-observer':
			this[$resizeObserver][(current === null ? 'un' : '') + 'observe'](this),
			current === null || this[$resized]();
			break;
			
		}
		
	}
	
	updateShadowCSS() {
		
		const { shadowRoot } = this;
		
		if (shadowRoot instanceof ShadowRoot) {
			
			const { links, shadowCSS } = this;
			let i,l;
			
			if (l = shadowCSS.length) {
				
				i = -1;
				while (++i < l) shadowCSS[i].remove();
				shadowCSS.length = 0;
				
			}
			
			if (l = links.length) {
				
				i = -1;
				while (++i < l) (shadowCSS[i] = links[i].cloneNode(false)).removeAttribute('disabled');
				
				shadowRoot.append(...shadowCSS);
				
			}
			
		}
		
	}
	requireElements(requires = this.requires) {
		
		const	{ $required, $requiredAll, requireElements } = ElementShadow,
				{ constructor } = this,
				required = requireElements(constructor[$required], false, this, !requires),
				requiredAll = requireElements(constructor[$requiredAll], true, this, !requires);
		let k,v;
		
		for (k in required) if ((v = required[k]) !== true) break;
		
		if (v === true) for (k in requiredAll) if ((v = requiredAll[k]) !== true) break;
		
		v === true ||
			this.dispatchEvent(new CustomEvent('changed-required-elements', { detail: { required, requiredAll } }));
		
		
	}
	
	composeClosest(selector) {
		
		return ElementShadow.composeClosest(selector, this);
		
	}
	closestObject(object) {
		
		return ElementShadow.closestObject(object, this);
		
	}
	
	get links() {
		
		return document.querySelectorAll(this.getAttribute('shadow-css'));
		
	}
	set links(v) {
		
		this.setAttribute('shadow-css', v);
		
	}
	get requires() {
		
		return this.hasAttribute('requires');
		
	}
	set requires(v) {
		
		return this.setAttribute('requires', v);
		
	}
	get template() {
		
		return document.getElementById(this.getAttribute('template'));
		
	}
	set template(v) {
		
		return this.setAttribute('template', v);
		
	}
	get resizeObserver() {
		
		return this.hasAttribute('resize-observer');
		
	}
	set resizeObserver(v) {
		
		return this.toggleAttribute('resize-observer', !!v);
		
	}
	
}
ElementShadow[ElementShadow.$observedAttributes] = [ 'shadow-css', 'requires', 'template', 'resize-observer' ],
ElementShadow.prototype[ElementShadow.$mutated] = function () {
	
	this.requireElements();
	
},
ElementShadow.prototype[ElementShadow.$resized] = function () {
	
	const	{ constructor: { getRect }, id } = this,
			rect = getRect(this), prefix = '--rect-' + (id ? id + '-' : '');
	let k;
	
	for (k in rect) this.style.setProperty(prefix + k, rect[k]);
	
},
ElementShadow.prototype[ElementShadow.$updateShadow] = function () {
	
	const	{ $construct, $mutationObserver, attachShadowOption, mutationInitOption } = ElementShadow,
			{ shadowRoot, template } = this,
			shadow =	template?.content.cloneNode(true) ?? this[$construct]?.();
	
	(shadow || shadowRoot) &&
		(
			(this.shadowCSS ||= []).length = 0,
			//coco
			// この処理はコンストラクターの super() を経由して実行されるため、
			// 以下のような DOM を操作する処理は、super() が終了していないため Operation Not Supported の原因になる。
			// 遅延実行などの何かしらの対策が必要。
			(shadowRoot || this.attachShadow(attachShadowOption)).replaceChildren(shadow),
			shadow && this.updateShadowCSS(),
			this[$mutationObserver].observe(this.shadowRoot, mutationInitOption)
		)
	
},
customElements.define(ElementShadow.tagName, ElementShadow);

export class HTMLGPXStringifyElement extends ElementShadow {
	
	static tagName = 'gpx-stringify';
	
	static devices = [ 'Android', 'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod' ];
	
	constructor() {
		
		super();
		
		this.gpx = new GPXPlaceholder('', '', GPXPlaceholderExtensions),
		
		this.addEventListener('changed-required-elements', this.changedRequiredElements);
		
	}
	
	parse() {
		
		const { gpx, outputArea } = this;
		
		outputArea.value = gpx.parse(),
		outputArea.dispatchEvent(new Event('change'));
		
	}
	
	get input() {
		
		return this.inputArea.value;
		
	}
	set input(v) {
		
		const { gpx, inputArea } = this;
		
		//inputArea.value === v || (inputArea.value = v, inputArea.dispatchEvent(new Event('change')));
		inputArea.value === v || gpx.setXml(inputArea.value = v);
		
	}
	get edit() {
		
		return this.editArea.value;
		
	}
	set edit(v) {
		
		this.editArea.value = this.gpx.str = v;
		
	}
	get output() {
		
		return this.outputArea.value;
		
	}
	set output(v) {
		
		this.outputArea.valu = v;
		
	}
	
}
HTMLGPXStringifyElement[ElementShadow.$bind] = {
	
	changedInput(event) {
		
		const { gpx, inputArea } = this;
		
		gpx.setXml(inputArea.value);
		//this.parse();
		
	},
	changedEditArea(event) {
		
		const { editArea, gpx } = this;
		
		gpx.str = editArea.value;
		//this.parse();
		
	},
	changedOutputArea(event) {
		
		this.outputToggle.checked = true;
		
	},
	
	clickedOutputButton(event) {
		
		this.parse();
		
	},
	clickedOutputTweetButton(event) {
		
		// https://stackoverflow.com/questions/62107827/window-open-blank-doesnt-open-new-tab-on-ios-only
		
		const openedWindow = open();
		
		openedWindow.location = `https://twitter.com/intent/tweet?text=${this.output}`,
		
		HTMLGPXStringifyElement.devices.includes(navigator.platform) && openedWindow.close();
		
	},
	
	clickedViewSpecButton(event) {
		
		const { inputArea, gpx: { gpx } } = this;
		
		inputArea.value = '<!--\n' +
									'\nExamples:\n\n' +
									'  The name of this GPX file is "{name}.gpx".\n' +
									`    = The name of this GPX file is "${gpx?.tracks?.[0]?.name}.gpx"\n` +
									'  The total length of this track is {distance-total("km")}km\n' +
									`    = The total length of this track is ${gpx?.tracks?.[0]?.['distance-total']?.get?.('km')}km\n` +
									'  The max elevation in the track is {elevation("cm", "max")}cm\n' +
									`    = The max elevation in the track is ${gpx?.tracks?.[0]?.elevation?.get?.('cm', 'max')}cm\n\n` +
									JSON.stringify(this.gpx?.toJSON?.() ?? {}, null, '  ') +
								'\n-->' +
								inputArea.value;
		
	},
	
	changedRequiredElements() {
		
		this?.ac?.abort?.();
		
		const	{
					changedOutputArea,
					changedInput,
					changedEditArea,
					clickedOutputButton,
					outputUpdateButton,
					clickedOutputTweetButton,
					clickedViewSpecButton,
					
					outputArea,
					outputTweetButton,
					inputArea,
					editArea,
					inputOutputButton,
					editOutputButton,
					inputViewSpecButton
					
				} = this,
				{ signal } = (this.ac = new AbortController()).signal, eventOption = { signal };
		
		outputArea.addEventListener('change', changedOutputArea, eventOption),
		inputArea.addEventListener('change', changedInput, eventOption),
		editArea.addEventListener('change', changedEditArea, eventOption),
		
		inputOutputButton.addEventListener('click', clickedOutputButton),
		editOutputButton.addEventListener('click', clickedOutputButton),
		
		inputViewSpecButton.addEventListener('click', clickedViewSpecButton),
		
		outputUpdateButton.addEventListener('click', clickedOutputButton)
		outputTweetButton.addEventListener('click', clickedOutputTweetButton),
		
		this.edit = this.getAttribute('preset');
		
	}
	
},
HTMLGPXStringifyElement[ElementShadow.$required] = {
	
	editArea: '#edit-area',
	editOutputButton: '#edit-output-button',
	inputArea: '#input-area',
	inputOutputButton: '#input-output-button',
	inputViewSpecButton: '#input-view-spec-button',
	outputArea: '#output-area',
	outputNode: 'div#output',
	outputToggle: '#output-toggle',
	outputUpdateButton: '#output button.update',
	outputTweetButton: '#output button.tweet',
	
};
customElements.define(HTMLGPXStringifyElement.tagName, HTMLGPXStringifyElement);

class HTMLCopyElement extends HTMLElement {
	
	static tagName = 'copy-element';
	
	static clicked(event) {
		
		const { source } = this, v = source.value ?? source.textContent;
		
		navigator.clipboard.writeText(v).then(() => this.dispatchEvent(new CustomEvent('copied', { detail: v })));
		
	}
	
	constructor() {
		
		super();
		
		this.addEventListener('click', this.clicked = this.constructor.clicked.bind(this));
		
	}
	
	get source() {
		
		return this.getRootNode().querySelector(this.getAttribute('source'));
		
	}
	set source(v) {
		
		this.setAttribute('source', v);
		
	}
	
}
customElements.define(HTMLCopyElement.tagName, HTMLCopyElement);

class HTMLClearElement extends HTMLCopyElement {
	
	static tagName = 'clear-element';
	
	static clicked(event) {
		
		const { source } = this;
		
		'value' in source ?	(source.value = '', source.dispatchEvent(new Event('change'))) :
									'textContent' in source && (source.textContent = '');
		
	}
	
	constructor() {
		
		super();
		
	}
	
}
customElements.define(HTMLClearElement.tagName, HTMLClearElement);
//class CopyButton extends HTMLButtonElement {
//	
//	static tagName = 'copy-button';
//	
//	static new() {
//		
//		return document.createElement('button', { is: this.tagName });
//		
//	}
//	static clicked(event) {
//		
//		const { source } = this, v = source.value ?? source.textContent;
//		
//		navigator.clipboard.writeText(v).then(() => this.dispatchEvent(new CustomEvent('copied', { detail: v })));
//		
//	}
//	
//	constructor() {
//		
//		super();
//		
//		this.addEventListener('click', this.clicked = this.constructor.clicked.bind(this));
//		
//	}
//	
//	get source() {
//		
//		return this.getRootNode().querySelector(this.getAttribute('source'));
//		
//	}
//	set source(v) {
//		
//		this.setAttribute('source', v);
//		
//	}
//	
//}
//customElements.define(CopyButton.tagName, CopyButton, { extends: 'button' });
//
//class ClearButton extends CopyButton {
//	
//	static tagName = 'clear-button';
//	
//	static clicked(event) {
//		
//		const { source } = this;
//		
//		'value' in source ? (source.value = '') : 'textContent' in source && (source.textContent = '');
//		
//	}
//	
//	constructor() {
//		
//		super();
//		
//	}
//	
//}
//customElements.define(ClearButton.tagName, ClearButton, { extends: 'button' });
