export class HTMLCustomElement extends HTMLElement {
	
	static tagName = 'custom-element';
	
	static $assignedBind = Symbol('HTMLCustomElement.assignedBind');
	static $attribute = Symbol('HTMLCustomElement.attribute');
	static $bind = Symbol('HTMLCustomElement.bind');
	static $binder = Symbol('HTMLCustomElement.binder');
	static $boundArgs = Symbol('HTMLCustomElement.boundArgs');
	static $boundAt = Symbol('HTMLCustomElement.boundAt');
	static $define = Symbol('HTMLCustomElement.define');
	static $observedAttributes = Symbol('HTMLCustomElement.observedAttributes');
	static $observedAttributeNames = Symbol('HTMLCustomElement.observedAttributeNames');
	
	static get observedAttributes() {
		
		return this[HTMLCustomElement.$observedAttributeNames];
		
	}
	
	// target から辿れるプロトタイプが持つ propertyName に一致するプロパティが object であれば、
	// それらが持つプロパティをすべて Object.assign を通じて統合した新しい object を返す。
	// 既定では object 内のプロパティで名前衝突が起きた場合は、 target に近い object のプロパティが、より遠い object のプロパティに優先される。
	// inverts に true を指定すると、この優先順を反転させられる。
	static assignStatic(target, propertyName, inverts) {
		
		const { getPrototypeOf, hasOwn } = Object, sources = [];
		let i, constructor, source;
		
		i = -1, (constructor = getPrototypeOf(target).constructor) === Function || (target = constructor);
		do	hasOwn(target, propertyName) &&
			(source = target[propertyName]) &&
			typeof source === 'object' &&
			(sources[++i] = source);
		while (target = getPrototypeOf(target));
		
		if (i !== -1) {
			
			const { assign } = Object, merged = {};
			
			++i, inverts && sources.reverse();
			while (--i > -1) assign(merged, sources[i]);
			
			return merged;
			
		}
		
		return null;
		
	}
	
	// handlers に指定した object 内の function を、binder に指定した object で束縛し、
	// すべての束縛した function を boundAt に指定した object のプロパティとする。
	// boundAt が未指定であれば、boundAt の値は binder になる。その際、binder が未指定であれば、新規作成された object が戻り値になる。
	// handlers には特殊なプロパティとしてシンボル @@$boundAt, @@$boundArgs, @@$binder が指定できる。
	// @@$boundArgs は、handlers 内のすべての束縛関数に実行時に与えられる引数を指定する。
	// これは Function.prototype.bind の第三引数に相当する。
	// @@binder は、handlers 内のすべての関数を束縛する object を指定する。
	// この関数の第二引数 binder と異なる値を指定することができるが、通常は binder の値が優先される。
	// handlers は入れ子することができ、入れ子内でも @@boundArgs, @@binder を任意に設定可能である。
	// 入れ子した場合、binder の値は入れ子内に指定された @@binder の値が優先される。未指定の場合、binder がそのまま使われる。
	// また入れ子した時の boundAt の値は、指定されていれば @@$boundAt の値、そうでなければ関数実行時に指定された boundAt が使われる。
	static bindAll(handlers, binder, boundAt = handlers?.[HTMLCustomElement.$boundAt] || binder || {}) {
		
		if (handlers && typeof handlers === 'object') {
			
			const	{ isArray } = Array,
					{ assign } = Object,
					{ $binder, $boundAt, $boundArgs, bindAll, ownKeys } = HTMLCustomElement,
					ks = ownKeys(handlers),
					ksLength = ks.length;
			let i, k, handler, args;
			
			i = -1, (k = handlers?.[HTMLCustomElement.$binder]) && (binder = k);
			while (++i < ksLength)	(k = ks[i]) !== $binder &&
											k !== $boundArgs &&
											k !== $boundAt &&
												(
													typeof (handler = handlers[k]) === 'function' ?
														(
															boundAt[k] =	isArray(args = handler[$boundArgs]) ?
																					handler.bind(binder, ...args) : handler.bind(binder)
														) :
														bindAll(handler, handlers[$binder] || binder, handlers[$boundAt] || boundAt)
												);
			
			return boundAt;
			
		}
		
	}
	
	static define() {
		
		this[HTMLCustomElement.$define](this);
		
	}
	
	static ownKeys(target) {
		
		return	target && typeof target === 'object' ?
						[ ...Object.getOwnPropertySymbols(target), ...Object.keys(target) ] : null;
		
	}
	
	// target から辿れるプロトタイプが持つ propertyName に一致するプロパティが Array であれば、
	// それらの Array 内のすべての要素を target から近い順に新しい配列に Array.prototype.push を通じて追加される。
	// inverts に true を指定すると、遠い順に追加される。
	static pushStatic(target, propertyName, inverts) {
		
		const { isArray } = Array, { getPrototypeOf, hasOwn } = Object, sources = [];
		let i, constructor, source;
		
		i = -1, (constructor = getPrototypeOf(target).constructor) === Function || (target = constructor);
		do	hasOwn(target, propertyName) && isArray(source = target[propertyName]) && (sources[++i] = source);
		while (target = getPrototypeOf(target));
		
		if (i !== -1) {
			
			const { assign } = Object, merged = [];
			let i0;
			
			i0 = -1, ++i, inverts && sources.reverse();
			while (++i0 < i) merged.push(...sources[i0]);
			
			return merged;
			
		}
		
		return null;
		
	}
	
	//static a = {a:0};
	//static aa = [0];
	
	constructor() {
		
		super();
		
		const { $assignedBind, $observedAttributes, bindAll } = HTMLCustomElement, { constructor } = this;
		
		this[$observedAttributes] = bindAll(constructor[$observedAttributes], this, {}),
		
		bindAll(constructor[$assignedBind], this);
		
	}
	
	attributeChangedCallback(name, last, current) {
		
		this[HTMLCustomElement.$observedAttributes][name]?.call(this, name, last, current);
		
	}
	
}

// HTMLCustomElement を継承するカスタム要素は必ずこのメソッド define でカスタム要素を定義する必要がある。
// 第一引数 customElement には、カスタム要素を示すオブジェクトを指定する。
// このメソッド内では主に静的プロパティ @@CustomElement.$attribute が処理の対象になる。
// 同プロパティは、対象のカスタム要素の独自属性を定義する記述子で、
// 独自属性の名前をキーにした object が最上位になり、
// そのキーの値に、独自属性の設定を示す object を指定する。
// 例えば属性 sample を指定する場合、以下のようになる。
// static [CustomElement.$attribute] = { sample: { observed() { ... } } }
// 属性設定のプロパティ observed には、同属性が変更された時に、attributeChangedCallback を通じて実行されるコールバック関数を指定する。
// 同コールバック関数には、attributeChangedCallback に与えられた引数がそのままの順番、値で渡される。
// さらに同コールバック関数の実行コンテキスト(this)はカスタム要素のインスタンスを示す。
// 属性設定には、他に Object.defineProperty の第三引数と同じ値が指定できる。
// 設定のプロパティに value, writable がなく、get、または set が存在しないか、それらの値が function か null 以外である場合、
// get には該当する属性の現在の値を返す関数、set には該当する属性に指定された値を設定する関数が自動的に指定される。
// この自動設定を無効化したい場合は、前述のように value, writable を設定するか、{ get: null, set: null } などとする。
// 属性名とプロパティ名を異なるものにしたい場合、属性設定にプロパティ propertyName を設定する。
// 例えば以下のようにすると、プロパティ a に代入した時、カスタム要素の属性 b に a に代入した値が設定される。
// { a: { propertyName: 'b' } }
HTMLCustomElement[HTMLCustomElement.$define] = function (customElement) {
	
	const	{ defineProperties, keys } = Object,
			{
				$assignedBind,
				$attribute,
				$bind,
				$observedAttributes,
				$observedAttributeNames,
				assignStatic,
				ownKeys
			} = HTMLCustomElement,
			attribute = assignStatic(customElement, $attribute),
			observed = customElement[$observedAttributes] = {},
			property = {},
			bind = assignStatic(customElement, $bind);
	let k, ks, attr, prop, name;
	
	for (k in attribute) {
		
		if ((attr = attribute[k]) && typeof attr === 'object') {
			
			typeof attr.observed === 'function' && (observed[k] = attr.observed),
			
			delete (prop = { ...attr }).observed,
			
			typeof prop.get === 'function' || prop.get === null || 'value' in prop || 'writable' in prop ||
				(
					prop.get =	(
										k =>	typeof prop.get === 'boolean' ?
													function () { return this.hasAttribute(k); } :
													function () { return this.getAttribute(k); }
									)(k)
				),
			typeof prop.set === 'function' || prop.set === null || 'value' in prop || 'writable' in prop ||
				(
					prop.set =	(
										k =>	typeof prop.set === 'boolean' ?
													function (v) { return this.toggleAttribute(k, !!v); } :
													function (v) { return this.setAttribute(k, v); }
									)(k)
				),
			
			delete prop.propertyName,
			
			keys(prop).length && (property[typeof (name = attr.propertyName) === 'string' ? name : k] = prop);
			
		}
		
	}
	
	ownKeys(property)?.length && defineProperties(customElement.prototype, property),
	
	(ks = keys(observed)).length && (customElement[$observedAttributeNames] = ks),
	
	ownKeys(bind)?.length && (customElement[$assignedBind] = bind),
	
	customElements.define(customElement.tagName, customElement);
	
},
HTMLCustomElement.define();

//class B extends HTMLCustomElement {
//	
//	static tagName = 'b-b';
//	static a = {b:1};
//	static aa = [1];
//	static [HTMLCustomElement.$bind] = {
//		b() {
//			return 'b';
//		}
//	};
//	
//	constructor() {
//		
//		super();
//		
//	}
//	cc() {
//		return 1;
//	}
//	
//}
//HTMLCustomElement.define(B);
//
//class C extends B {
//	
//	static tagName = 'c-c';
//	static a = {a:4,c:2};
//	static aa = [2];
//	static [HTMLCustomElement.$bind] = {
//		[HTMLCustomElement.$binder]: new B(),
//		c() {
//			return 'c';
//		},
//		d() {
//			return this.cc();
//		}
//	};
//	
//	constructor() {
//		
//		super();
//		
//	}
//	
//	cc(){return 0;}
//	
//}
//HTMLCustomElement.define(C);
//
//const c = new C();
//
//hi(HTMLCustomElement.assignStatic(C, 'a'), HTMLCustomElement.pushStatic(C, 'aa'), c.b,c.c,c.d?.(),C[HTMLCustomElement.$bind][HTMLCustomElement.$binder]);

export default class ElementShadow extends HTMLCustomElement {
	
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
	static $received = Symbol('ElementShadow.received');
	static $receivedEventNamePrefix = Symbol('ElementShadow.receivedEventNamePrefix');
	static $receiverAC = Symbol('ElementShadow.receiverAC');
	static $required = Symbol('ElementShadow.required');
	static $requiredAll = Symbol('ElementShadow.requiredAll');
	static $requiredElementsResolver = Symbol('ElementShadow.requiredElementsResolver');
	static $requiring = Symbol('ElementShadow.requiring');
	static $updateAttributeAllSelector = Symbol('ElementShadow.updateAttributeAllSelector');
	static $updateShadow = Symbol('ElementShadow.updateShadow');
	static $updatedShadow = Symbol('ElementShadow.updatedShadow');
	
	static attachShadowOption = { mode: 'open' };
	
	static assignedNodesOption = { flatten: true };
	
	static mutationInitOption = { childList: true, subtree: true };
	
	static observeAttributeTemplateInitOption = { attributeFilter: [ 'template' ] };
	
	static [HTMLCustomElement.$attribute] = {
		
		['shadow-css']: {
			
			propertyName: 'links',
			
			get() {
				
				return document.querySelectorAll(this.getAttribute('shadow-css'));
				
			},
			
			observed(name, last, currnet) {
				
				this.updateShadowCSS();
				
			}
		},
		
		template: {
			
			get() {
				
				const template = document.getElementById(this.getAttribute('template'));
				
				return template instanceof HTMLTemplateElement ? template : null;
				
			},
			
			observed(name, last, currnet) {
				
				//this[$updateShadow]();
				
			}
			
		},
		
		requires: {
			
			observed(name, last, currnet) {
				
				//current && this.requireElements(current);
				
			}
			
		},
		
		// 同名の属性に指定された半角スペース区切りのイベント名リストに基づいて、
		// その中に含まれるイベントを shadowRoot で捕捉し、それをその shadowRoot を所有するカスタム要素に通知し、
		// そのカスタム要素自身のイベントとして元のイベント名に ElementShadow.$receivedEventNamePrefix に指定された接頭辞を加えて通知する。
		// 既定では ElementShadow.$receivedEventNamePrefix の値は shadow になる。
		// カスタム要素から通知されたイベントは、コールバック関数に与えるイベントオブジェクトのプロパティ detail に、
		// 元のイベントのコールバック関数に与えられたイベントオブジェクトへの参照を設定される。
		// コールバック関数はインスタンスのプロパティ @@ElementShadow.$received で上書きできる。
		// 属性 reveive の値を変更すると、以前のイベントリスナーはすべて AbortController.signal.abort() を通じて削除される。
		receive: {
			
			get() {
				
				return this.getAttribute('receive').split(' ');
				
			},
			set(value) {
				
				this.setAttribute('receive', typeof value === 'string' ? value : Array.isArray(value) ? value.join() : '');
				
			},
			
			observed(name, last, current) {
				
				const { $receiverAC } = ElementShadow, cv = current && current?.split(' ');
				
				this[$receiverAC]?.signal.abort?.();
				
				if (cv) {
					
					const	{ $received } = ElementShadow,
							{ shadowRoot } = this,
							received = this[$received],
							l = cv.length,
							option = { signal: (this[$receiverAC] = new AbortController()).signal };
					let i;
					
					i = -1;
					while (++i < l) shadowRoot.addEventListener(cv[i], received, option);
					
				} else delete this[$receiverAC];
				
			}
			
		}
		
	};
	
	static composeClosest(selector, scope) {
		
		return typeof scope?.closest === 'function' &&
			(scope.closest(selector) || (scope = scope?.getRootNode?.()?.host) && this.composeClosest(selector, scope)) ||
				null;
		
	}
	
	//static [HTMLCustomElement.$observedAttributes] = {
	//	
	//	['shadow-css'](name, last, currnet) {
	//		
	//		this.updateShadowCSS();
	//		
	//	},
	//	
	//	['template'](name, last, currnet) {
	//		
	//		//this[$updateShadow]();
	//		
	//	},
	//	
	//	requires(name, last, currnet) {
	//		
	//		//current && this.requireElements(current);
	//		
	//	}
	//	
	//};
	
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
	
	constructor() {
		
		super();
		
		const	{
					
					$attributeTemplateObserver,
					$forcesInit,
					$initialize,
					$mutated,
					$mutationObserver,
					$observedAttributeTemplate,
					bindAll,
					mutationInitOption,
					observeAttributeTemplateInitOption
					
				} = ElementShadow;
		
		//this[$mutationObserver] = new MutationObserver(() => this[$mutated]()),
		
		this.defineRequiredElements(),
		
		this.updateShadow(),
		
		(
			this[$attributeTemplateObserver] =
				new MutationObserver(this[$observedAttributeTemplate] = ElementShadow[$observedAttributeTemplate].bind(this))
		).observe(this, observeAttributeTemplateInitOption),
		
		($forcesInit || this.isConnected) && this[$initialize]?.();
		
	}
	
	removeAttributeAll(selector, attrName) {
		
		this.updateAttributeAll('remove', ...arguments);
		
	}
	
	setAttributeAll(selector, attrName, attrValue) {
		
		this.updateAttributeAll('set', ...arguments);
		
	}
	setPropertyAll(selector, propertyName, propertyValue) {
		
		const labeled = this.getLabeled(selector);
		let k;
		
		for (k in labeled) labeled[propertyName] = propertyValue;
		
	}
	
	toggleAttributeAll(selector, attrName, attrValue) {
		
		this.updateAttributeAll('toggle', attrName, !!attrValue);
		
	}
	
	// selector が示す shadowRoot 内の要素に対して、methodName に指定された操作を一括して実行する。
	// selector は、このメソッド内で任意に実装されるメソッド [ElementShadow.$updateAttributeAllSelector] に与えられ、
	// methodName が指定する操作は、それが返す HTMLCollection 内の要素に対して行われる。
	// 既定では、[ElementShadow.$updateAttributeAllSelector] は、selector を引数にした shadowRoot.querySelectorAll の戻り値となる。
	updateAttributeAll(methodName, selector, ...args) {
		
		const selected = this[ElementShadow.$updateAttributeAllSelector](selector), method = methodName + 'Attribute';
		let k;
		
		for (k in selected) selected[k]?.[method]?.(...args);
		
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
	
}
ElementShadow[ElementShadow.$receivedEventNamePrefix] = 'shadow',
ElementShadow[HTMLCustomElement.$bind] = {
	
	[ElementShadow.$received](event) {
		
		this.dispatchEvent(
				new CustomEvent(this.constructor[ElementShadow.$receivedEventNamePrefix] + '-' + event.type,
				{ detail: event })
			);
		
	}
	
},
ElementShadow[ElementShadow.$observedAttributeTemplate] = function (mrs) {
	
	this.updateShadow();
	
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
ElementShadow.prototype[ElementShadow.$updateAttributeAllSelector] = function (selector) {
	
	return this.shadowRoot.querySelectorAll(selector)
	
},
ElementShadow.define();

//export default class ElementShadow extends HTMLElement {
//	
//	static tagName = 'element-shadow';
//	
//	static $attributeTemplateObserver = Symbol('ElementShadow.$attributeTemplateObserver');
//	static $bind = Symbol('ElementShadow.bind');
//	static $construct = Symbol('ElementShadow.construct');
//	static $forcesInit = Symbol('ElementShadow.forcesInit');
//	static $initialize = Symbol('ElementShadow.initialize');
//	static $mutated = Symbol('ElementShadow.mutated');
//	static $mutationObserver = Symbol('ElementShadow.mutationObserver');
//	static $observedAttributes = Symbol('ElementShadow.observedAttributes');
//	static $observedAttributeTemplate = Symbol('ElementShadow.$observedAttributeTemplate');
//	static $required = Symbol('ElementShadow.required');
//	static $requiredAll = Symbol('ElementShadow.requiredAll');
//	static $requiredElementsResolver = Symbol('ElementShadow.requiredElementsResolver');
//	static $requiring = Symbol('ElementShadow.requiring');
//	static $resizeObserver = Symbol('ElementShadow.resizeObserver');
//	static $resized = Symbol('ElementShadow.resized');
//	static $updateShadow = Symbol('ElementShadow.updateShadow');
//	static $updatedShadow = Symbol('ElementShadow.updatedShadow');
//	
//	static attachShadowOption = { mode: 'open' };
//	
//	static assignedNodesOption = { flatten: true };
//	
//	static mutationInitOption = { childList: true, subtree: true };
//	
//	static observeAttributeTemplateInitOption = { attributeFilter: [ 'template' ] };
//	
//	static get observedAttributes() {
//		
//		return this[ElementShadow.$observedAttributes];
//		
//	}
//	
//	static new(constructor = this, ...args) {
//		
//		const { $initialize } = ElementShadow, element = new constructor(...args);
//		
//		element[$initialize]?.();
//		
//		return element;
//		
//	}
//	//static requireElements(required, all, target = document, optional) {
//	//	
//	//	const difference = {};
//	//	
//	//	if (
//	//		(target instanceof HTMLElement || target instanceof Document) &&
//	//		required &&
//	//		typeof required === 'object'
//	//	) {
//	//		
//	//		const	{ dataset, shadowRoot } = target,
//	//				warnings = optional && [],
//	//				keys = [ ...Object.keys(required), ...Object.getOwnPropertySymbols(required) ],
//	//				keysLength = keys.length;
//	//		let i,i0,i1,l1, k, current,last;
//	//		
//	//		i = i0 = -1;
//	//		while (++i < keysLength)
//	//			difference[k = keys[i]] =	(current = shadowRoot.querySelectorAll(required[k])).length &&
//	//													(all ? current : current[0]);
//	//		
//	//		i = i0 = -1;
//	//		while (++i < keysLength) {
//	//			
//	//			current = difference[k = keys[i]];
//	//			
//	//			if (
//	//				(last = target[k]) instanceof NodeList &&
//	//				current instanceof NodeList &&
//	//				(l1 = last.length) === difference[k]?.length
//	//			) {
//	//				
//	//				i1 = -1, current = difference[k];
//	//				while (++i1 < l1 && current[i1] === last[i1]);
//	//				difference[k] = i1 === l1 || current;
//	//				
//	//			} else difference[k] = last === current || current;
//	//			
//	//			if (current) (target[k] = current);
//	//				else if (optional)	warnings[++i0] = typeof k === 'symbol' ? Symbol.keyFor(k) : k;
//	//				else						throw new Error(`No element for "${required[k]}".`);
//	//			
//	//		}
//	//		
//	//		i0 === -1 || (dataset.elementShadowNoRequiredElements = warnings.join(' '));
//	//		
//	//	}
//	//	
//	//	return difference;
//	//	
//	//}
//	
//	// https://stackoverflow.com/questions/54520554/custom-element-getrootnode-closest-function-crossing-multiple-parent-shadowd
//	static composeClosest(selector, scope) {
//		
//		return typeof scope?.closest === 'function' &&
//			(scope.closest(selector) || (scope = scope?.getRootNode?.()?.host) && this.composeClosest(selector, scope)) ||
//				null;
//		
//	}
//	static closestObject(object, scope) {
//		
//		let parent;
//		
//		parent = scope;
//		while (!(parent instanceof object) && (parent = parent.parentElement));
//		
//		return !parent && (scope = scope.getRootNode()?.host) ? ElementShadow.closestObject(object, scope) : scope;
//		
//	}
//	
//	static getRect(target) {
//		
//		if (target instanceof Element) {
//			
//			const rect = target.getBoundingClientRect(), v = {};
//			let k,v0;
//			
//			for (k in rect) typeof (v0 = rect[k]) === 'number' && (v[k] = rect[k] + 'px');
//			v['scroll-left'] = rect.left + scrollX + 'px', v['scroll-top'] = rect.top + scrollY + 'px';
//			
//			return v;
//			
//		}
//		
//	}
//	
//	static bindAll(handlers, thisArg, bound = thisArg || {}, ...args) {
//		
//		(thisArg && typeof thisArg === 'object') || (thisArg = bound);
//		
//		if (handlers && handlers.constructor === Object && thisArg && typeof thisArg === 'object') {
//			
//			const keys = [ ...Object.keys(handlers), ...Object.getOwnPropertySymbols(handlers) ], l = keys.length;
//			let i, handler, k;
//			
//			i = -1;
//			while (++i < l)
//				typeof (handler = handlers[k = keys[i]]) === 'function' && (bound[k] = handler.bind(thisArg, ...args));
//			
//		}
//		
//		return bound;
//		
//	}
//	
//	static setAC(target, key, handler, option = { once: true }) {
//		
//		(target[key] = new AbortController()).signal.addEventListener('abort', handler, option);
//		
//	}
//	
//	static uid4() {
//		
//		const UID4F = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
//		let i = -1, id = '', c;
//		
//		while (c = UID4F[++i]) id +=	c === 'x' ? Math.floor(Math.random() * 16).toString(16) :
//												c === 'y' ? (Math.floor(Math.random() * 4) + 8).toString(16) : c;
//		
//		return id;
//		
//	}
//	
//	constructor() {
//		
//		super();
//		
//		const	{
//					
//					$attributeTemplateObserver,
//					$bind,
//					$forcesInit,
//					$initialize,
//					$mutated,
//					$mutationObserver,
//					$observedAttributeTemplate,
//					$resized,
//					$resizeObserver,
//					bindAll,
//					mutationInitOption,
//					observeAttributeTemplateInitOption
//					
//				} = ElementShadow;
//		
//		bindAll(this.constructor[$bind], this),
//		
//		//this[$mutationObserver] = new MutationObserver(() => this[$mutated]()),
//		this[$resizeObserver] = new ResizeObserver(() => this[$resized]()),
//		
//		this.defineRequiredElements(),
//		
//		this.updateShadow(),
//		
//		(
//			this[$attributeTemplateObserver] =
//				new MutationObserver(this[$observedAttributeTemplate] = ElementShadow[$observedAttributeTemplate].bind(this))
//		).observe(this, observeAttributeTemplateInitOption),
//		
//		($forcesInit || this.isConnected) && this[$initialize]?.();
//		
//	}
//	
//	async attributeChangedCallback(name, last, current) {
//		
//		const { $definedRequiredElementsByConstructor, $resized, $resizeObserver } = ElementShadow
//		
//		switch (name) {
//			
//			case 'shadow-css':
//			this.updateShadowCSS();
//			break;
//			
//			//case 'template':
//			//this[$updateShadow]();
//			//break;
//			
//			//case 'requires':
//			//current && this.requireElements(current);
//			//break;
//			
//			case 'resize-observer':
//			this[$resizeObserver][(current === null ? 'un' : '') + 'observe'](this),
//			current === null || this[$resized]();
//			break;
//			
//		}
//		
//	}
//	
//	updateShadow() {
//		
//		this[ElementShadow.$updateShadow]?.();
//		
//	}
//	
//	updateShadowCSS() {
//		
//		const { shadowRoot } = this;
//		
//		if (shadowRoot instanceof ShadowRoot) {
//			
//			const { links } = this;
//			let i,l, shadowCSS;
//			
//			if (l = (shadowCSS = this.shadowCSS ||= []).length) {
//				
//				i = -1;
//				while (++i < l) shadowCSS[i].remove();
//				shadowCSS.length = 0;
//				
//			}
//			
//			if (l = links.length) {
//				
//				i = -1;
//				while (++i < l) (shadowCSS[i] = links[i].cloneNode(false)).removeAttribute('disabled');
//				
//				shadowRoot.append(...shadowCSS);
//				
//			}
//			
//		}
//		
//	}
//	
//	defineRequiredElements() {
//		
//		const { $required } = ElementShadow, requirement = this.constructor[$required];
//		
//		if (requirement) {
//			
//			const property = {};
//			let k;
//			
//			for (k in requirement)
//				property[k] =	{
//										
//										configurable: true,
//										enumerable: true,
//										get: (k => () => this.shadowRoot?.querySelector?.(this.constructor[$required][k]))(k),
//										set: (k => v => (this.constructor[$required][k] = v))(k)
//										
//									};
//			
//			Object.defineProperties(this, property);
//			
//		}
//		
//	}
//	
//	//requireElements(requires = this.requires) {
//	//	
//	//	const	{ $required, $requiredAll, requireElements } = ElementShadow,
//	//			{ constructor } = this,
//	//			required = requireElements(constructor[$required], false, this, !requires),
//	//			requiredAll = requireElements(constructor[$requiredAll], true, this, !requires);
//	//	let k,v;
//	//	
//	//	for (k in required) if ((v = required[k]) !== true) break;
//	//	
//	//	if (v === true) for (k in requiredAll) if ((v = requiredAll[k]) !== true) break;
//	//	
//	//	(v = v === true) ||
//	//		this.dispatchEvent(new CustomEvent('changed-required-elements', { detail: { required, requiredAll } }));
//	//	
//	//	return v;
//	//	
//	//}
//	
//	composeClosest(selector) {
//		
//		return ElementShadow.composeClosest(selector, this);
//		
//	}
//	closestObject(object) {
//		
//		return ElementShadow.closestObject(object, this);
//		
//	}
//	
//	get links() {
//		
//		return document.querySelectorAll(this.getAttribute('shadow-css'));
//		
//	}
//	set links(v) {
//		
//		this.setAttribute('shadow-css', v);
//		
//	}
//	//get requires() {
//	//	
//	//	return this.hasAttribute('requires');
//	//	
//	//}
//	//set requires(v) {
//	//	
//	//	return this.setAttribute('requires', v);
//	//	
//	//}
//	get template() {
//		
//		const template = document.getElementById(this.getAttribute('template'));
//		
//		return template instanceof HTMLTemplateElement ? template : null;
//		
//	}
//	set template(v) {
//		
//		return this.setAttribute('template', v);
//		
//	}
//	get resizeObserver() {
//		
//		return this.hasAttribute('resize-observer');
//		
//	}
//	set resizeObserver(v) {
//		
//		return this.toggleAttribute('resize-observer', !!v);
//		
//	}
//	
//}
//ElementShadow[ElementShadow.$observedAttributes] = [ 'shadow-css', 'requires', 'template', 'resize-observer' ],
//ElementShadow[ElementShadow.$observedAttributeTemplate] = function (mrs) {
//	
//	this.updateShadow();
//	
//},
////ElementShadow.prototype[ElementShadow.$mutated] = function (mrs) {
////	
////	const { $requiredElementsResolver, $requiring } = ElementShadow, requiring = this[$requiring];
////	let resolver;
////	
////	(resolver = this[$requiredElementsResolver]) ||
////		(this.requiredElementsAvailable = new Promise(rs => (resolver = this[$requiredElementsResolver] = rs))),
////	
////	requiring[requiring.length] = mrs,
////	
////	this.requireElements(),
////	
////	requiring.splice(requiring.indexOf(mrs), 1),
////	
////	requiring.length || (resolver?.(), delete this[$requiredElementsResolver]);
////	
////},
//ElementShadow.prototype[ElementShadow.$resized] = function () {
//	
//	const	{ constructor: { getRect }, id } = this,
//			rect = getRect(this), prefix = '--rect-' + (id ? id + '-' : '');
//	let k;
//	
//	for (k in rect) this.style.setProperty(prefix + k, rect[k]);
//	
//},
//ElementShadow.prototype[ElementShadow.$updateShadow] = function () {
//	
//	const	{ $construct, $mutationObserver, $updatedShadow, attachShadowOption, mutationInitOption } = ElementShadow,
//			{ shadowRoot, template } = this,
//			shadow =	template?.content.cloneNode?.(true) ?? this[$construct]?.();
//	
//	(shadow || shadowRoot) &&
//		(
//			(this.shadowCSS ||= []).length = 0,
//			//coco
//			// この処理はコンストラクターの super() を経由して実行されるため、
//			// 以下のような DOM を操作する処理は、super() が終了していないため Operation Not Supported の原因になる。
//			// 遅延実行などの何かしらの対策が必要。
//			(shadowRoot || this.attachShadow(attachShadowOption)).replaceChildren(shadow),
//			shadow && this.updateShadowCSS(),
//			this[$updatedShadow]?.(),
//			this.dispatchEvent(new CustomEvent('updated-shadow'))
//			//this[$mutationObserver].observe(this.shadowRoot, mutationInitOption)
//		)
//	
//},
//customElements.define(ElementShadow.tagName, ElementShadow);