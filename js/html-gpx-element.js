import { default as ElementShadow } from './element-shadow.js';
import { default as ToggleButton } from './toggle-button.js';

class HTMLTextAreaControllerElement extends ElementShadow {
	
	static tagName = 'text-area';
	
	constructor() {
		
		super();
		
		const { changedTextArea, textarea } = this;
		
		textarea.addEventListener('change', changedTextArea);
		
	}
	
	attributeChangedCallback(name, last, current) {
		
		ElementShadow.prototype.attributeChangedCallback.apply(this, arguments);
		
		switch (name) {
			
			case 'placeholder':
			hi(name,current);
			this.textarea.placeholder = current;
			
			break;
			
			case 'value':
			
			if (last !== current) {
				
				const { textarea } = this;
				
				this.dispatchEvent(new CustomEvent('changed', { detail: { current: textarea.value = current, last } }));
				
			}
			
			break;
			
		}
		
	}
	
	get placeholder() {
		
		return this.getAttribute('placeholder');
		
	}
	set placeholder(v) {
		
		this.setAttribute('placeholder', v);
		
	}
	
	get value() {
		
		return this.getAttribute('value');
		
	}
	set value(v) {
		
		this.setAttribute('value', v);
		
	}
	
}
HTMLTextAreaControllerElement[ElementShadow.$bind] = {
	
	changedTextArea({ target: { value } }) {
		
		this.value = value;
		
	}
	
},
HTMLTextAreaControllerElement[ElementShadow.$observedAttributes] =
	[ ...ElementShadow[ElementShadow.$observedAttributes], 'placeholder', 'value' ],
HTMLTextAreaControllerElement[ElementShadow.$required] = {
	
	clearElement: '#ctrl clear-element[source="#textarea"]#clear',
	copyElement: '#ctrl copy-element[source="#textarea"]#copy',
	ctrl: '#ctrl',
	textarea: 'textarea#textarea',
	
},
customElements.define(HTMLTextAreaControllerElement.tagName, HTMLTextAreaControllerElement);

export class HTMLGPXInputElement extends ElementShadow {
	
	static tagName = 'gpx-input';
	
	static $update = Symbol('HTMLGPXInputElement.$update');
	
	static visualizers = [ [ 'Stringifier', 'stringifier', false, true ] ];
	
	constructor() {
		
		super();
		
	}
	
	[ElementShadow.$updatedShadow]() {
		
		const	{
					
					changedInput,
					changedInputFile,
					clickedAddButton,
					clickedInputFileButton,
					
					inputArea,
					
				} = this,
				inputFile = this.inputFile = document.createElement('input'),
				inputFileButton = document.createElement('button'),
				addButton = this.addButton = document.createElement('button'),
				selectorNode = document.createElement('div'),
				selectorLabel = document.createElement('label'),
				selector = this.selector = document.createElement('select'),
				visualizers = this.visualizers ||= [ ...this.constructor.visualizers ],
				visualizersLength = visualizers.length,
				eventOption = { signal: (this.ac = new AbortController()).signal };
		let i, option;
		
		inputFile.slot = 'ctrl-before-copy',
		inputFile.id = 'input-file',
		inputFile.type = 'file',
		inputFile.accept = '.gpx, application/gpx+xml, application/octet-stream',
		inputFile.addEventListener('change', changedInputFile, eventOption),
		
		inputFileButton.id = 'input-file-button',
		inputFileButton.classList.add('custom-button'),
		inputFileButton.slot = 'ctrl-before-copy',
		inputFileButton.type = 'button',
		inputFileButton.textContent = 'Load GPX',
		inputFileButton.addEventListener('click', clickedInputFileButton, eventOption),
		
		addButton.id = 'stringify-button',
		addButton.classList.add('custom-button'),
		addButton.type = 'button',
		addButton.textContent = 'Create',
		addButton.addEventListener('click', clickedAddButton, eventOption),
		
		selectorNode.id = 'selector-node',
		selectorNode.classList.add('select-node'),
		selectorNode.slot = 'ctrl-before-copy',
		selectorLabel.htmlFor = 'selector'
		selectorLabel.textContent = 'Visualizer',
		
		i = -1, selector.id = 'selector';
		while (++i < visualizersLength) selector.appendChild(new Option(...visualizers[i]));
		
		selectorNode.append(selectorLabel, selector, addButton),
		
		inputArea.append(inputFile, selectorNode, inputFileButton),
		
		inputArea.addEventListener('changed', changedInput, eventOption);
		
	}
	
	createStringifier() {
		
		const { inputArea: { value } } = this, stringifier = document.createElement('gpx-stringifier');
		
		stringifier.links = '#gpx-stringifier-css',
		stringifier.template = 'gpx-stringifier',
		
		stringifier.addEventListener	(
												'updated-shadow',
												() => stringifier[HTMLGPXInputElement.$update]?.(value),
												{ once: true }
											);
		
		return stringifier;
		
	}
	
	parse() {
		
		const { gpx, outputArea } = this;
		
		outputArea.value = gpx.parse(),
		outputArea.dispatchEvent(new Event('change'));
		
	}
	
	get value() {
		
		return this.inputArea.value;
		
	}
	set value(v) {
		
		this.inputArea.value = v;
		
	}
	
}
HTMLGPXInputElement[ElementShadow.$bind] = {
	
	changedInput({ detail }) {
		
		const	{ current } = detail,
				{ outputsContainer: { children } } = this,
				childrenLength = children.length;
		let i, child;
		
		i = -1;
		while (++i < childrenLength)
			(child = children[i].visualizer) instanceof HTMLGPXElement && (child.source = current);
		
		this.dispatchEvent(new CustomEvent('changed', { detail }));
		
	},
	
	changedInputFile({ target: { files } }) {
		
		files[0].text().then(text => (this.value = text));
		
	},
	
	clickedAddButton(event) {
		
		const	{ outputsContainer, outputsToggle, selector: { options, selectedIndex } } = this,
				selected = options[selectedIndex];
		let i,l, v, visualizer, legend, ctrl, deleteButton;
		
		switch (selected.value) {
			
			case 'stringifier':
			v = this.createStringifier();
			break;
			
		}
		
		i = -1, l = (Array.isArray(v) ? v : (v = [ v ])).length;
		while (++i < l)	visualizer = document.createElement('gpx-visualizer'),
								(legend = document.createElement('legend')).slot = 'legend',
								legend.textContent = selected.textContent,
								(ctrl = document.createElement('div')).slot = 'ctrl',
								(deleteButton = document.createElement('button')).type = 'button',
								deleteButton.textContent = '🗑',
								deleteButton.addEventListener('click', () => visualizer.remove(), { once: true }),
								ctrl.append(deleteButton),
								v[i].slot = 'visualizer',
								visualizer.append(legend, ctrl, v[i]),
								(v[i] = visualizer).links = '#gpx-visualizer-css',
								visualizer.template = 'gpx-visualizer';
		
		outputsContainer.prepend(...v), outputsToggle.checked = true;
		
	},
	
	clickedInputFileButton(event) {
		
		this.inputFile.click();
		
	}
	
},
HTMLGPXInputElement[ElementShadow.$required] = {
	
	inputArea: 'text-area#input',
	
	outputsContainer: '#outputs-container',
	outputsToggle: 'input#outputs-toggle[type="checkbox"]'
	
};
customElements.define(HTMLGPXInputElement.tagName, HTMLGPXInputElement);

export class HTMLGPXVisualizerElement extends ElementShadow {
	
	static tagName = 'gpx-visualizer';
	
	constructor() {
		
		super();
		
	}
	
	get visualizer() {
		
		return this.visualizerSlot.assignedElements()[0];
		
	}
	
}
HTMLGPXVisualizerElement[ElementShadow.$required] = {
	
	ctrlSlot: 'slot[name="ctrl"]',
	fieldset: 'fieldset',
	legendSlot: 'slot[name="legend"]',
	visualizerSlot: 'slot[name="visualizer"]'
	
};
customElements.define(HTMLGPXVisualizerElement.tagName, HTMLGPXVisualizerElement);

export class HTMLGPXElement extends ElementShadow {
	
	static tagName = 'gpx-element';
	
	static $source = Symbol('HTMLGPXElement.source');
	
	static devices = [ 'Android', 'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod' ];
	
	static repogitoryUrl = 'https://user126179663.github.io/GPX-Visualizer/';
	
	constructor() {
		
		super();
		
		this.gpx = null;
		
	}
	
	get source() {
		
		return this[HTMLGPXElement.$source];
		
	}
	set source(v) {
		
		const { $source } = HTMLGPXElement;
		
		v === this[$source] || (this.gpx = new gpxParser()).parse(this[$source] = v);
		
	}
	
}
customElements.define(HTMLGPXElement.tagName, HTMLGPXElement);

export class HTMLGPXPlaceholderElement extends HTMLGPXElement {
	
	static tagName = 'gpx-placeholder';
	
	constructor() {
		
		super();
		
		this.gpx = new GPXPlaceholder('', '', GPXPlaceholderExtensions);
		
	}
	
	parse() {
		
		return this.gpx.parse();
		
	}
	
	set source(v) {
		
		const { $source } = HTMLGPXElement;
		
		v === this[$source] || this.gpx.setXml(this[$source] = v);
		
	}
	
}
customElements.define(HTMLGPXPlaceholderElement.tagName, HTMLGPXPlaceholderElement);

export class HTMLGPXStringifierElement extends HTMLGPXPlaceholderElement {
	
	static tagName = 'gpx-stringifier';
	
	constructor() {
		
		super();
		
	}
	
	[ElementShadow.$updatedShadow]() {
		
		this.ac?.abort?.();
		
		const	{
					changedEditArea,
					changedOutputArea,
					clickedStringifyButton,
					clickedTweetButton,
					clickedUpdateButton,
					clickedViewSpecButton,
					editArea,
					gpx,
					outputArea
				} = this,
				eventOption = { signal: (this.ac = new AbortController()).signal },
				tweetButton = document.createElement('button'),
				updateButton = document.createElement('button'),
				stringifyButton = document.createElement('button'),
				viewSpecButton = document.createElement('button'),
				creditToggle = this.creditToggle = document.createElement('toggle-button');
		
		editArea.addEventListener('changed', changedEditArea, eventOption),
		outputArea.addEventListener('changed', changedOutputArea, eventOption),
		
		viewSpecButton.id = 'view-spec-button',
		viewSpecButton.classList.add('custom-button'),
		viewSpecButton.type = 'button',
		viewSpecButton.slot = 'ctrl-before-copy',
		viewSpecButton.textContent = 'View Spec',
		viewSpecButton.addEventListener('click', clickedViewSpecButton, eventOption),
		
		tweetButton.classList.add('tweet', 'custom-button'),
		tweetButton.type = 'button'
		tweetButton.slot = 'ctrl-before-copy',
		tweetButton.textContent = 'Tweet',
		tweetButton.addEventListener('click', clickedTweetButton, eventOption),
		
		updateButton.classList.add('update', 'custom-button'),
		updateButton.type = 'button'
		updateButton.slot = 'ctrl-before-copy',
		updateButton.textContent = 'Update',
		updateButton.addEventListener('click', clickedUpdateButton, eventOption),
		
		creditToggle.toggleCSS = '#toggle-css',
		creditToggle.title = 'Share the URL to this page.',
		creditToggle.slot = 'ctrl-after-clear',
		
		outputArea.append(tweetButton, updateButton, viewSpecButton, creditToggle),
		
		stringifyButton.classList.add('stringifier', 'custom-button'),
		stringifyButton.type = 'button'
		stringifyButton.slot = 'ctrl-before-copy',
		stringifyButton.textContent = 'Stringify',
		stringifyButton.addEventListener('click', clickedStringifyButton, eventOption),
		
		editArea.append(stringifyButton),
		
		gpx.str = editArea.value;
		
	}
	
	parse() {
		
		return this.outputArea.value = Object.getPrototypeOf(this.constructor.prototype).parse.call(this);
		
	}
	
	[HTMLGPXInputElement.$update](source) {
		
		this.source = source, this.parse();
		
	}
	
}
HTMLGPXStringifierElement[ElementShadow.$bind] = {
	
	changedEditArea({ target }) {
		
		this.gpx.str = target.value;
		
	},
	
	changedOutputArea(event) {
		
		this.outputToggle.checked = true;
		
	},
	
	clickedStringifierButton(event) {
		
		this.parse()
		
	},
	
	clickedTweetButton(event) {
		
		// https://stackoverflow.com/questions/62107827/window-open-blank-doesnt-open-new-tab-on-ios-only
		
		const { constructor: { devices, repogitoryUrl }, creditToggle: { activated }, outputArea: { value } } = this,
				text = value + (activated ? '%0A%0A❤️': ''),
				url = activated ? '&url=' + repogitoryUrl : '',
				openedWindow = open();
		
		openedWindow.location =	`https://twitter.com/intent/tweet?text=${text}${url}`,
		
		devices.includes(navigator.platform) && openedWindow.close();
		
	},
	
	clickedUpdateButton(event) {
		
		this.parse();
		
	},
	
	clickedViewSpecButton(event) {
		
		const gpxInput = this.composeClosest('gpx-input');
		
		if (gpxInput) {
			
			const { inputArea } = gpxInput, { gpx: { gpx } } = this;
			
			inputArea.value =
				'<!--\n' +
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
			
		}
		
	}
	
},
HTMLGPXStringifierElement[ElementShadow.$required] = {
	
	editArea: 'text-area#edit',
	outputArea: 'text-area#output',
	outputToggle: 'input[type="checkbox"]#output-toggle'
	
};
customElements.define(HTMLGPXStringifierElement.tagName, HTMLGPXStringifierElement);

class HTMLDeleteElement extends HTMLElement {
	
	static tagName = 'delete-element';
	static clickedEventOption = { once: true };
	
	constructor() {
		
		super();
		
		const { clickedEventOption } = HTMLDeleteElement;
		
		this.boundAC = [],
		
		this.addEventListener('click', this.clicked, clickedEventOption);
		
	}
	
	abort() {
		
		const { boundAC } = this, boundACLength = boundAC.length;
		let i;
		
		i = -1;
		while (++i < boundACLength) boundAC[i]?.abort?.();
		
		boundAC.length = 0;
		
	}
	
	bindAC(...acs) {
		
		const { boundAC } = this, acsLength = acs.length;
		let i,i0, acs0;
		
		i = -1, i0 = boundAC.length - 1;
		while (++i < acsLength)	(acs0 = acs[i]) instanceof AbortController ?
											(boundAC[++i0] = acs0.signal) : acs0 instanceof AbortSignal && (boundAC[++i0] = acs0);
		
		
	}
	
	deleteTargets() {
		
		const { targets } = this, targetsLLength = targets.length;
		let i;
		
		i = -1;
		while (++i < targetsLength) targets[i].remove();
		
		this.abort();
		
	}
	
	get targets() {
		
		return this.getRootNode().querySelectorAll(this.getAttribute('targets'));
		
	}
	set targets(v) {
		
		this.setAttribute('targets', v);
		
	}
	
}
HTMLDeleteElement[ElementShadow.$bind] = {
	
	clicked(event) {
		
		this.deleteTargets();
		
	}
	
},
customElements.define(HTMLDeleteElement.tagName, HTMLDeleteElement);

class Abort {
	
	static $aborting = Symbol('HTMLDeleteButton.$aborting');
	static $ac = Symbol('HTMLDeleteButton.$ac');
	static $available = Symbol('HTMLDeleteButton.$available');
	
	static abortedEventOption = { once: true };
	
	static aborting(rs, rj) {
		
		const { $ac, abortedEventOption } = HTMLDeleteButton, ac = this[$ac];
		
		ac.signal.addEventListener('abort', rs, abortedEventOption), this[$ac] = new AbortController(), ac.abort();
		
	}
	
	constructor() {
		
		const { $aborting, $ac, $available, abortedEventOption, aborting } = HTMLDeleteButton;
		
		this[$aborting] = aborting.bind(this),
		
		this[$ac] = new AbortController(),
		
		this[$available] = Promise.resolve();
		
	}
	
	abort() {
		
		const { $aborting, $available } = HTMLDeleteButton;
		
		return this[$available] = new Promise(this[$aborting]);
		
	}
	
	get signal() {
		
		const { $ac, $available } = HTMLDeleteButton, ac = this[$ac];
		
		this[$available];
		
		return ac instanceof AbortController && !ac.signal.aborted ? ac.signal : null;
		
	}
	
}

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