import { HTMLCustomElement, default as ElementShadow } from '../element-shadow.js';

export default class HTMLLabeledElement extends ElementShadow {
	
	static tagName = 'labeled-element';
	static [ElementShadow.$receivedEventNamePrefix] = 'labeled';
	
	static $labeledSelector = Symbol('HTMLLabeledElement.labeledSelector');
	static $labeledCheckSelector = Symbol('HTMLLabeledElement.labeledCheckSelector');
	
	static [ElementShadow.$attribute] = {
		
		['checked-all']: {
			
			get() {
				
				return this.getLabeled(HTMLLabeledElement[HTMLLabeledElement.$labeledCheckSelector]);
				
			},
			set(value) {
				
				const labeled = this.getLabeled(HTMLLabeledElement[HTMLLabeledElement.$labeledCheckSelector]),
						l = labeled.length;
				
				if (l) {
					
					let i, target;
					
					i = -1;
					while (++i < l) (target = labeled[i]).toggleAttribute('checked', target.checked = !!value);
					
				}
				
			},
			
			observed(name, last, current) {
				
				this['checked-all'] = current;
				
			}
			
		},
		
		['disabled-all']: {
			
			get() {
				
				return this.getLabeled();
				
			},
			set(value) {
				
				this.setAttributeAll(undefined, 'disabled', value);
				
			},
			
			observed(name, last, current) {
				
				this['input-all'] = current;
				
			}
			
		},
		
		['input-all']: {
			
			get() {
				
				return this.getLabeled();
				
			},
			set(value) {
				
				this.setAttributeAll(undefined, 'value', value);
				
			},
			
			observed(name, last, current) {
				
				this['input-all'] = current;
				
			}
			
		}
		
	}
	
	constructor() {
		
		super(...arguments);
		
	}
	
	[ElementShadow.$updateAttributeAllSelector](selector) {
		
		const { shadowRoot } = this, labeled = this.selectAll(selector), l = labeled.length, gathered = {};
		
		if (l) {
			
			let i, id,target;
			
			i = -1;
			while (++i < l)	(id = (target = labeled[i]).id) && shadowRoot.querySelector(`label[for="${id}"]`) &&
										(gathered[id] = target);
			
		}
		
		return gathered;
		
	}
	
	getLabeled(selector) {
		
		return this[ElementShadow.$updateAttributeAllSelector](selector);
		
	}
	
	selectAll(selector = HTMLLabeledElement[HTMLLabeledElement.$labeledSelector]) {
		
		return typeof selector === 'string' ? this.shadowRoot.querySelectorAll(selector) : [];
		
	}
	
}
HTMLLabeledElement[HTMLLabeledElement.$labeledCheckSelector] = 'input[type="checkbox"], input[type="radio"]',
HTMLLabeledElement[HTMLLabeledElement.$labeledSelector] = 'input, textarea',
HTMLLabeledElement.define();

//class HTMLLabeledElement_ extends ElementShadow {
//	
//	static tagName = 'labeled-element';
//	static $labeled = Symbol('HTMLLabeledElement.labeled');
//	static labeledSelector = 'input, textarea';
//	
//	static [ElementShadow.$required] = {
//		
//		labelNode: 'label',
//		labeledNode: '#labeled',
//		
//	};
//	
//	static [ElementShadow.$attribute] = {
//		
//		checked: {
//			
//			get() {
//				
//				return this.labeled?.checked;
//				
//			},
//			set: true,
//			
//			observed(name, last, current) {
//				
//				this.labeled.checked = typeof current === 'string';
//				
//			}
//			
//		},
//		
//		constraint: {
//			
//			get() {
//				
//				return this.labeled?.id;
//				
//			},
//			
//			observed(name, last, current) {
//				
//				const { label, labeled, labeledNode } = this;
//				
//				if (label && labeled) {
//					
//					if (labeled === labeledNode) {
//						
//						throw new Error('To constrain "for" and "id", the labeled node and the labeled input must be different.');
//						
//					} else label.htmlFor = labeled.id = current;
//					
//				}
//				
//			}
//			
//		},
//		
//		disabled: {
//			
//			get() {
//				
//				return this.labeled?.disabled;
//				
//			},
//			set: true,
//			
//			observed(name, last, current) {
//				
//				this.labeled.disabled = typeof current === 'string';
//				
//			}
//			
//		},
//		
//		value: {
//			
//			get() {
//				hi(this.labeled);
//				return this.labeled?.value;
//				
//			},
//			
//			observed(name, last, current) {
//				
//				this.labeled.value = current;
//				
//			}
//			
//		}
//		
//	};
//	static [ElementShadow.$bind] = {
//		
//		changedLabeled(event) {
//			
//			this.dispatchEvent(new CustomEvent('changed', { detail: event }));
//			
//		}
//		
//	};
//	
//	constructor() {
//		
//		super();
//		
//	}
//	
//	[ElementShadow.$updatedShadow]() {
//		
//		const labeled = this[HTMLLabeledElement.$labeled];
//		
//		labeled instanceof Element && (this.labelNode.appendChild(this[HTMLLabeledElement.$labeled]), this.setLabeled());
//		
//	}
//	//coco
//	// labeled をプロパティに保存して updatedShadow 実行毎に対象の要素へプロパティ上の labeled を挿入する？
//	setLabeled(labeled = this[HTMLLabeledElement.$labeled]) {
//		
//		if (this.getLabeled(labeled)) {
//			
//			const { ac, changedLabeled, checked, constraint, disabled, label, labeledNode, value } = this;
//			
//			ac?.abort?.(),
//			
//			label && (input.id = label.htmlFor = constraint),
//			input.checked = checked,
//			input.disabled = disabled,
//			input.value = value,
//			input.addEventListener('change', changedLabeled, { signal: (this.ac = new AbortController()).signal }),
//			labeledNode?.replaceChildren?.(this[HTMLLabeledElement.$labeled] = labeled);
//			
//		}
//		
//	}
//	
//	getLabeled(labeledNode = this.labeledNode || this.shadowRoot) {
//		
//		const	{ labeledSelector } = HTMLLabeledElement;
//		
//		return labeledNode?.matches?.(labeledSelector) ? labeledNode : labeledNode?.querySelector?.(labeledSelector);
//		
//	}
//	
//	get label() {
//		
//		return this.labelNode;
//		
//	}
//	set label(v) {
//		
//		this.labelNode?.replaceChildren?.(v);
//		
//	}
//	get labeled() {
//		
//		return this.getLabeled();
//		
//	}
//	set labeled(v) {
//		
//		this.setLabeled(v);
//		
//	}
//	get valueAsDate() {
//		
//		return this.labeled.valueAsDate;
//		
//	}
//	set valueAsDate(v) {
//		
//		this.labeled.valueAsDate = v;
//		
//	}
//	get valueAsNumber() {
//		
//		return this.labeled.valueAsNumber;
//		
//	}
//	set valueAsNumber(v) {
//		
//		this.labeled.valueAsNumber = v;
//		
//	}
//	
//}
//HTMLLabeledElement.define();