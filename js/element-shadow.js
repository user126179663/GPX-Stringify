export default class ElementShadow extends HTMLElement {
	
	static tagName = 'element-shadow';
	
	static $attributeTemplateObserver = Symbol('ElementShadow.$attributeTemplateObserver');
	static $bind = Symbol('ElementShadow.bind');
	static $construct = Symbol('ElementShadow.construct');
	static $forcesInit = Symbol('ElementShadow.forcesInit');
	static $initialize = Symbol('ElementShadow.initialize');
	static $mutated = Symbol('ElementShadow.mutated');
	static $mutationObserver = Symbol('ElementShadow.mutationObserver');
	static $observedAttributes = Symbol('ElementShadow.observedAttributes');
	static $observedAttributeTemplate = Symbol('ElementShadow.$observedAttributeTemplate');
	static $required = Symbol('ElementShadow.required');
	static $requiredAll = Symbol('ElementShadow.requiredAll');
	static $requiredElementsResolver = Symbol('ElementShadow.requiredElementsResolver');
	static $requiring = Symbol('ElementShadow.requiring');
	static $resizeObserver = Symbol('ElementShadow.resizeObserver');
	static $resized = Symbol('ElementShadow.resized');
	static $updateShadow = Symbol('ElementShadow.updateShadow');
	static $updatedShadow = Symbol('ElementShadow.updatedShadow');
	
	static attachShadowOption = { mode: 'open' };
	
	static assignedNodesOption = { flatten: true };
	
	static mutationInitOption = { childList: true, subtree: true };
	
	static observeAttributeTemplateInitOption = { attributeFilter: [ 'template' ] };
	
	static get observedAttributes() {
		
		return this[ElementShadow.$observedAttributes];
		
	}
	
	static new(constructor = this, ...args) {
		
		const { $initialize } = ElementShadow, element = new constructor(...args);
		
		element[$initialize]?.();
		
		return element;
		
	}
	//static requireElements(required, all, target = document, optional) {
	//	
	//	const difference = {};
	//	
	//	if (
	//		(target instanceof HTMLElement || target instanceof Document) &&
	//		required &&
	//		typeof required === 'object'
	//	) {
	//		
	//		const	{ dataset, shadowRoot } = target,
	//				warnings = optional && [],
	//				keys = [ ...Object.keys(required), ...Object.getOwnPropertySymbols(required) ],
	//				keysLength = keys.length;
	//		let i,i0,i1,l1, k, current,last;
	//		
	//		i = i0 = -1;
	//		while (++i < keysLength)
	//			difference[k = keys[i]] =	(current = shadowRoot.querySelectorAll(required[k])).length &&
	//													(all ? current : current[0]);
	//		
	//		i = i0 = -1;
	//		while (++i < keysLength) {
	//			
	//			current = difference[k = keys[i]];
	//			
	//			if (
	//				(last = target[k]) instanceof NodeList &&
	//				current instanceof NodeList &&
	//				(l1 = last.length) === difference[k]?.length
	//			) {
	//				
	//				i1 = -1, current = difference[k];
	//				while (++i1 < l1 && current[i1] === last[i1]);
	//				difference[k] = i1 === l1 || current;
	//				
	//			} else difference[k] = last === current || current;
	//			
	//			if (current) (target[k] = current);
	//				else if (optional)	warnings[++i0] = typeof k === 'symbol' ? Symbol.keyFor(k) : k;
	//				else						throw new Error(`No element for "${required[k]}".`);
	//			
	//		}
	//		
	//		i0 === -1 || (dataset.elementShadowNoRequiredElements = warnings.join(' '));
	//		
	//	}
	//	
	//	return difference;
	//	
	//}
	
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
					
					$attributeTemplateObserver,
					$bind,
					$forcesInit,
					$initialize,
					$mutated,
					$mutationObserver,
					$observedAttributeTemplate,
					$resized,
					$resizeObserver,
					bindAll,
					mutationInitOption,
					observeAttributeTemplateInitOption
					
				} = ElementShadow;
		
		bindAll(this.constructor[$bind], this),
		
		//this[$mutationObserver] = new MutationObserver(() => this[$mutated]()),
		this[$resizeObserver] = new ResizeObserver(() => this[$resized]()),
		
		this.defineRequiredElements(),
		
		this.updateShadow(),
		
		(
			this[$attributeTemplateObserver] =
				new MutationObserver(this[$observedAttributeTemplate] = ElementShadow[$observedAttributeTemplate].bind(this))
		).observe(this, observeAttributeTemplateInitOption),
		
		($forcesInit || this.isConnected) && this[$initialize]?.();
		
	}
	
	async attributeChangedCallback(name, last, current) {
		
		const { $definedRequiredElementsByConstructor, $resized, $resizeObserver } = ElementShadow
		
		switch (name) {
			
			case 'shadow-css':
			this.updateShadowCSS();
			break;
			
			//case 'template':
			//this[$updateShadow]();
			//break;
			
			//case 'requires':
			//current && this.requireElements(current);
			//break;
			
			case 'resize-observer':
			this[$resizeObserver][(current === null ? 'un' : '') + 'observe'](this),
			current === null || this[$resized]();
			break;
			
		}
		
	}
	
	updateShadow() {
		
		this[ElementShadow.$updateShadow]?.();
		
	}
	
	updateShadowCSS() {
		
		const { shadowRoot } = this;
		
		if (shadowRoot instanceof ShadowRoot) {
			
			const { links } = this;
			let i,l, shadowCSS;
			
			if (l = (shadowCSS = this.shadowCSS ||= []).length) {
				
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
	
	defineRequiredElements() {
		
		const { $required } = ElementShadow, requirement = this.constructor[$required];
		
		if (requirement) {
			
			const property = {};
			let k;
			
			for (k in requirement)
				property[k] =	{
										
										configurable: true,
										enumerable: true,
										get: (k => () => this.shadowRoot?.querySelector?.(this.constructor[$required][k]))(k),
										set: (k => v => (this.constructor[$required][k] = v))(k)
										
									};
			
			Object.defineProperties(this, property);
			
		}
		
	}
	
	//requireElements(requires = this.requires) {
	//	
	//	const	{ $required, $requiredAll, requireElements } = ElementShadow,
	//			{ constructor } = this,
	//			required = requireElements(constructor[$required], false, this, !requires),
	//			requiredAll = requireElements(constructor[$requiredAll], true, this, !requires);
	//	let k,v;
	//	
	//	for (k in required) if ((v = required[k]) !== true) break;
	//	
	//	if (v === true) for (k in requiredAll) if ((v = requiredAll[k]) !== true) break;
	//	
	//	(v = v === true) ||
	//		this.dispatchEvent(new CustomEvent('changed-required-elements', { detail: { required, requiredAll } }));
	//	
	//	return v;
	//	
	//}
	
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
	//get requires() {
	//	
	//	return this.hasAttribute('requires');
	//	
	//}
	//set requires(v) {
	//	
	//	return this.setAttribute('requires', v);
	//	
	//}
	get template() {
		
		const template = document.getElementById(this.getAttribute('template'));
		
		return template instanceof HTMLTemplateElement ? template : null;
		
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
ElementShadow[ElementShadow.$observedAttributeTemplate] = function (mrs) {
	
	this.updateShadow();
	
},
//ElementShadow.prototype[ElementShadow.$mutated] = function (mrs) {
//	
//	const { $requiredElementsResolver, $requiring } = ElementShadow, requiring = this[$requiring];
//	let resolver;
//	
//	(resolver = this[$requiredElementsResolver]) ||
//		(this.requiredElementsAvailable = new Promise(rs => (resolver = this[$requiredElementsResolver] = rs))),
//	
//	requiring[requiring.length] = mrs,
//	
//	this.requireElements(),
//	
//	requiring.splice(requiring.indexOf(mrs), 1),
//	
//	requiring.length || (resolver?.(), delete this[$requiredElementsResolver]);
//	
//},
ElementShadow.prototype[ElementShadow.$resized] = function () {
	
	const	{ constructor: { getRect }, id } = this,
			rect = getRect(this), prefix = '--rect-' + (id ? id + '-' : '');
	let k;
	
	for (k in rect) this.style.setProperty(prefix + k, rect[k]);
	
},
ElementShadow.prototype[ElementShadow.$updateShadow] = function () {
	
	const	{ $construct, $mutationObserver, $updatedShadow, attachShadowOption, mutationInitOption } = ElementShadow,
			{ shadowRoot, template } = this,
			shadow =	template?.content.cloneNode?.(true) ?? this[$construct]?.();
	
	(shadow || shadowRoot) &&
		(
			(this.shadowCSS ||= []).length = 0,
			//coco
			// この処理はコンストラクターの super() を経由して実行されるため、
			// 以下のような DOM を操作する処理は、super() が終了していないため Operation Not Supported の原因になる。
			// 遅延実行などの何かしらの対策が必要。
			(shadowRoot || this.attachShadow(attachShadowOption)).replaceChildren(shadow),
			shadow && this.updateShadowCSS(),
			this[$updatedShadow]?.(),
			this.dispatchEvent(new CustomEvent('updated-shadow'))
			//this[$mutationObserver].observe(this.shadowRoot, mutationInitOption)
		)
	
},
customElements.define(ElementShadow.tagName, ElementShadow);