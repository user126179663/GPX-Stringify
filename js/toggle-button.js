export default class ToggleButton extends HTMLElement {
	
	static $observedAttributes = Symbol('ToggleButton.observedAttributes');
	static $construct = Symbol('ToggleButton.construct');
	static $changed = Symbol('ToggleButton.changed');
	static $resized = Symbol('ToggleButton.resized');
	static $links = Symbol('ToggleButton.links');
	static $trigger = Symbol('ToggleButton.trigger');
	static $id = Symbol('ToggleButton.id');
	static $mutated = Symbol('ToggleButton.mutated');
	
	static tagName = 'toggle-button';
	
	static get observedAttributes() {
		
		return ToggleButton[ToggleButton.$observedAttributes];
		
	}
	
	constructor() {
		
		super();
		
		const { $changed, $construct, $id, $links, $ready, $resized } = ToggleButton;
		
		this[$changed] = ToggleButton[$changed].bind(this),
		
		this.attachShadow({ mode: 'open' }),
		
		ToggleButton[$construct].call(this);
		
		const checkbox = this.checkbox = this.shadowRoot.querySelector(`input#${ToggleButton[$id]}[type="checkbox"]`),
				label = this.label = this.shadowRoot.querySelector(`input#${ToggleButton[$id]}[type="checkbox"] + label`);
		
		if (!checkbox || !label) throw new Error();
		
		this[$links] = [],
		
		(this.resizeObserver = new ResizeObserver(this.resized = ToggleButton[$resized].bind(this))).observe(this);
		
	}
	connectedCallback() {
		
		const { constructor } = this, { $changed, $mutated, $trigger } = constructor;
		
		this.label.toggleAttribute(constructor[$mutated], true),
		
		this.checkbox.addEventListener(ToggleButton[$trigger], this[$changed]);
		
	}
	disconnectedCallback() {
		
		const { $changed, $trigger } = ToggleButton;
		
		this.checkbox.removeEventListener(ToggleButton[$trigger], this[$changed]);
		
	}
	attributeChangedCallback(name, last, current) {
		
		switch (name) {
			
			case 'activated':
			last ?? (this.activated = true), this.checkbox.checked = this.hasAttribute('activated');
			break;
			
			case 'disabled':
			this.checkbox.toggleAttribute('disabled', this.hasAttribute('disabled'));
			break;
			
			case 'toggle-css':
			this.updateShadowCSS();
			break;
			
		}
		
	}
	
	updateShadowCSS() {
		
		const { $links: $ } = ToggleButton, { toggleCSS: links, shadowRoot } = this, $links = this[$];
		let i,l,i0, link;
		
		i = -1, l = $links.length;
		while (++i < l) $links[i].remove();
		
		i = i0 = -1, l = links.length, $links.length = 0;
		while (++i < l) (link = links[i]) instanceof HTMLLinkElement && link.rel === 'stylesheet' &&
			($links[++i0] = link.cloneNode()).removeAttribute('disabled');
		
		shadowRoot.prepend(...$links);
		
	}
	
	get activated() {
		
		return this.checkbox.checked;
		
	}
	set activated(v) {
		
		this.toggleAttribute('activated', !!v);
		
	}
	
	get disabled() {
		
		return this.hasAttribute('disabled');
		
	}
	set disabled(v) {
		
		this.toggleAttribute('disabled', !!v);
		
	}
	
	get toggleCSS() {
		
		return document.querySelectorAll(this.getAttribute('toggle-css'));
		
	}
	set toggleCSS(v) {
		
		this.setAttribute('toggle-css', v);
		
	}
	
}
ToggleButton[ToggleButton.$trigger] = 'change',
ToggleButton[ToggleButton.$id] = 'toggle',
ToggleButton[ToggleButton.$mutated] = 'data-toggle-button-mutated',
ToggleButton[ToggleButton.$changed] = function ({ isTrusted, target: detail }) {
	
	const { constructor } = this, { $mutated } = constructor;
	
	this.label.toggleAttribute(constructor[$mutated], false),
	
	this.activated = detail.checked,
	
	this.dispatchEvent(new CustomEvent('toggled', { detail: { isTrusted, detail } }));
	
},
ToggleButton[ToggleButton.$construct] = function () {
	
	const	{ constructor: { $id } } = this,
			checkbox = document.createElement('input'),
			label = document.createElement('label'),
			content = document.createElement('slot'),
			id = ToggleButton[$id];
	
	checkbox.type = 'checkbox',
	checkbox.hidden = true,
	checkbox.id = label.htmlFor = content.name = id,
	
	label.appendChild(content),
	
	this.shadowRoot.append(checkbox, label);
	
},
ToggleButton[ToggleButton.$resized] = function () {
	
	const	{ height, width } = this.getBoundingClientRect(),
			{ constructor } = this, { $mutated } = constructor;
	
	this.label.toggleAttribute(constructor[$mutated], true),
	
	this.label.style.setProperty('--height', height + 'px'),
	this.label.style.setProperty('--width', width + 'px');
	
},
ToggleButton[ToggleButton.$observedAttributes] = [ 'activated', 'disabled', 'toggle-css' ],
customElements.define(ToggleButton.tagName, ToggleButton);