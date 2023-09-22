import { HTMLCustomElement, default as ElementShadow } from './element-shadow.js';
import { default as HTMLLabeledElement } from './HTMLLabeledElement/html-labeled-element.js';
import { default as ToggleButton } from './toggle-button.js';

class HTMLTextAreaTemplateElement extends ElementShadow {
	
	static tagName = 'text-area';
	
	static [HTMLCustomElement.$attribute] = {
		
		code: {
			
			get: true,
			set: true,
			
			observed(name, last, current) {
				
				const	{ blurredCodeEditor, focusedCodeEditor, keyDownOnCodeEditor, keyUpOnCodeEditor, textarea } = this,
						method = (typeof current === 'string' ? 'add' : 'remove') + 'EventListener';
				
				textarea[method]('keydown', keyDownOnCodeEditor),
				textarea[method]('keyup', keyUpOnCodeEditor);
				
			}
			
		},
		
		observe: {
			
			get: true,
			set: true,
			
			observed(name, last, current) {
				
				const { pressedKeyOnTextArea, textarea } = this;
				
				textarea[(typeof current === 'string' ? 'add' : 'remove') + 'EventListener']('keyup', pressedKeyOnTextArea);
				
			}
			
		},
		
		placeholder: {
			
			observed(name, last, current) {
				
				this.textarea.placeholder = current;
				
			}
			
		},
		
		value: {
			
			observed(name, last, current) {
				
				if (last !== current) {
					
					const { textarea } = this;
					
					this.dispatchEvent(new CustomEvent('changed', { detail: { current: textarea.value = current, last } }));
					
				}
				
			}
			
		}
	};
	
	static [HTMLCustomElement.$bind] = {
		
		changedTextArea(event) {
			
			this.value = event.target.value;
			
		},
		
		keyDownOnCodeEditor(event) {
			
			const { ctrlKey, key, altKey } = event, { textarea } = this;
			
			if (key === 'Tab' && !altKey && !ctrlKey) {
				
				// https://stackoverflow.com/questions/14444938/append-text-to-textarea-with-javascript
				
				const { selectionEnd, selectionStart, value } = textarea;
				
				textarea.value = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd),
				
				textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
				
				event.preventDefault();
				
			} else if (key === 's' && ctrlKey) {
				
				event.preventDefault(), this.dispatchEvent(new CustomEvent('keydown-ctrl-s', { detail: event }));
				
			}
			
		},
		
		keyUpOnCodeEditor(event) {
			
			const { ctrlKey, key, altKey } = event, { textarea } = this;
			
			
		},
		
		pressedKeyOnTextArea(event) {
			
			event.host = this,
			
			this.dispatchEvent(new CustomEvent('releasedKey', { detail: event }));
			
		}
		
	};
	static [ElementShadow.$required] = {
		
		textarea: 'textarea#textarea',
		
	};
	
	constructor() {
		
		super();
		
		const { changedTextArea, pressedKeyOnTextArea, textarea } = this;
		
		textarea.addEventListener('change', changedTextArea);
		
	}
	
}
HTMLTextAreaTemplateElement.define();

export class HTMLGPXInputElement extends ElementShadow {
	
	static tagName = 'gpx-input';
	
	static $update = Symbol('HTMLGPXInputElement.$update');
	
	static [HTMLCustomElement.$bind] = {
		
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
				
				case 'dom':
				v = this.createGPXDOM();
				break;
				
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
									deleteButton.addEventListener(
											'click',
											() =>	{
														visualizer.remove(),
														outputsContainer.children.length || (outputsToggle.checked = false);
													},
											{ once: true }
										),
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
		
	};
	static [ElementShadow.$required] = {
		
		inputArea: 'text-area#input',
		
		outputsContainer: '#outputs-container',
		outputsToggle: 'input#outputs-toggle[type="checkbox"]'
		
	};
	
	static visualizers = [
									[ 'Stringifier', 'stringifier', false, true ],
									[ 'DOM (Experimental)', 'dom', false, false ],
								];
	
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
	
	createGPXDOM() {
		
		const { inputArea: { value } } = this, dom = document.createElement('gpx-dom');
		
		dom.links = '#gpx-dom-css',
		dom.template = 'gpx-dom',
		
		dom.addEventListener('updated-shadow', () => dom[HTMLGPXInputElement.$update]?.(value), { once: true });
		
		return dom;
		
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
	
	async parse() {
		
		const { gpx, outputArea } = this;
		
		outputArea.value = await gpx.parse(),
		outputArea.dispatchEvent(new Event('change'));
		
	}
	
	get value() {
		
		return this.inputArea.value;
		
	}
	set value(v) {
		
		this.inputArea.value = v;
		
	}
	
}
HTMLGPXInputElement.define();

export class HTMLGPXVisualizerElement extends ElementShadow {
	
	static tagName = 'gpx-visualizer';
	
	static [ElementShadow.$required] = {
		
		ctrlSlot: 'slot[name="ctrl"]',
		fieldset: 'fieldset',
		legendSlot: 'slot[name="legend"]',
		visualizerSlot: 'slot[name="visualizer"]'
		
	};
	
	constructor() {
		
		super();
		
	}
	
	get visualizer() {
		
		return this.visualizerSlot.assignedElements()[0];
		
	}
	
}
HTMLGPXVisualizerElement.define();

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
HTMLGPXElement.define();

export class HTMLGPXDOMElement extends HTMLGPXElement {
	
	static tagName = 'gpx-dom';
	
	static domMutatedInitOption = { childList: true, subtree: true };
	
	static [ElementShadow.$required] = {
		
		dom: 'div#dom',
		domStyle: 'style#dom-style',
		domToggle: 'input[type="checkbox"]#dom-toggle',
		
		domRenderButton: 'button#dom-render',
		
		settingsStyleArea: 'text-area#dom-style-textarea',
		settingsToggle: 'input[type="checkbox"]#settings-toggle',
		
	};
	
	static [HTMLCustomElement.$bind] = {
		
		changedEditArea({ target }) {
			
			this.gpx.str = target.value;
			
		},
		
		changedSettingsStyleArea(event) {
			
			const { domStyle, settingsToggle, settingsStyleArea: { value } } = this;
			
			domStyle.textContent = value, settingsToggle.checked = true;
			
		},
		
		clickedDomRenderButton(event) {
			
			const	{ dom, settingsStyleArea: { value } } = this,
					canvas = document.createElement('canvas'),
					ctx = canvas.getContext('2d'),
					img = new Image(),
					data =	'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
								`<style>#dom{background:blue;height:200px;display: flex; flex: 1 0 auto; width: 100%;}${value}</style>` +
								'<foreignObject width="100%" height="100%">' +
								`<div id="dom" xmlns="http://www.w3.org/1999/xhtml">${dom.innerHTML}</div>` +
								'</foreignObject></svg>',
					_data =	'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
								'<style>#a{background:blue;width:2rem;height:2rem;}</style>' +
								'<foreignObject width="100%" height="100%">' +
								`<div xmlns="http://www.w3.org/1999/xhtml"><div id="a"></div></div>` +
								'</foreignObject></svg>',
					svg = new Blob([ data ], { type: 'image/svg+xml;charset=utf-8' }),
					url = URL.createObjectURL(svg);
			
			img.addEventListener('load', () => (ctx.drawImage(img, 0,0), URL.revokeObjectURL(url))),
			img.src = url,
			hi(data);
			
			document.body.prepend(canvas);
			
		},
		
		mutatedDom(mrs) {
			
			this.domToggle.checked = true;
			
		}
		
	}
	
	static toHTML(element, root, prefix = '') {
		
		const	{ children, tagName } = element,
				childrenLength = children.length,
				tag = tagName.toLowerCase().replace(':', '-'),
				node = document.createElement('div'),
				{ classList, style } = node,
				{ style: rootStyle } = root ||= node;
		let i, attrName;
		
		classList.add('gpx-' + tag), prefix = (prefix ? prefix + '-' : '') + tag;
		
		if (childrenLength) {
			
			const { toHTML } = HTMLGPXDOMElement, nodes = [];
			
			i = -1;
			while (++i < childrenLength) nodes[i] = toHTML(children[i], root, prefix);
			
			node.append(...nodes);
			
		} else {
			
			const { textContent } = element;
			
			rootStyle.setProperty('--' + prefix, tag === 'time' ? new Date(textContent).getTime() : textContent),
			
			node.dataset.content = textContent;
			
		}
		
		const attrNames = element.getAttributeNames(), attrLength = attrNames.length;
		
		i = -1;
		while (++i < attrLength)
			style.setProperty('--' + (attrName = attrNames[i]), element.getAttribute(attrName)),
			style === rootStyle || rootStyle.setProperty('--' + prefix + '-' + attrName, element.getAttribute(attrName));
		
		return node;
		
	}
	
	static async _upgrade(element, root, prefix = '') {
		
		const	{ children, tagName } = element,
				childrenLength = children.length,
				tag = tagName.toLowerCase().replace(':', '-'),
				upgradedName = 'gpx-' + tag;
		let i, attrName;
		
		customElements.get(upgradedName) ||
			customElements.define(upgradedName, class extends HTMLElement { constructor() { super(); } });
		
		await customElements.whenDefined(upgradedName);
		
		const	upgraded = document.createElement(upgradedName),
				{ style } = upgraded,
				{ style: rootStyle } = root ||= upgraded;
		
		prefix = (prefix ? prefix + '-' : '') + tag;
		
		if (childrenLength) {
			
			const { upgrade } = HTMLGPXDOMElement, upgradedChildren = [];
			
			i = -1;
			while (++i < childrenLength) upgradedChildren[i] = await upgrade(children[i], root, prefix);
			
			upgraded.append(...upgradedChildren);
			
		} else {
			
			const { textContent } = element;
			
			rootStyle.setProperty('--' + prefix, tag === 'time' ? new Date(textContent).getTime() : textContent),
			
			upgraded.dataset.content = textContent;
			
		}
		
		const attrNames = element.getAttributeNames(), attrLength = attrNames.length;
		
		i = -1;
		while (++i < attrLength)
			style.setProperty('--' + (attrName = attrNames[i]), element.getAttribute(attrName)),
			style === rootStyle || rootStyle.setProperty('--' + prefix + '-' + attrName, element.getAttribute(attrName));
		
		//element.replaceWith(upgraded);
		
		return upgraded;
		
	}
	
	constructor() {
		
		super();
		
	}
	
	[ElementShadow.$updatedShadow]() {
		
		this.ac?.abort?.();
		
		const	{
					changedSettingsStyleArea,
					clickedDomRenderButton,
					constructor: { domMutatedInitOption },
					dom,
					domObserver,
					domRenderButton,
					domStyle,
					releasedKeyOnSettingsStyleArea,
					mutatedDom,
					settingsStyleArea
				} = this,
				eventOption = { signal: (this.ac = new AbortController()).signal },
				renderNode = document.createElement('div'),
				renderButton = document.createElement('button'),
				updateButton = document.createElement('button'),
				renderLabeledNode = document.createElement('labeled-element');
		
		domObserver?.disconnect?.(),
		
		(this.domObserver ||= new MutationObserver(mutatedDom)).observe(dom, domMutatedInitOption),
		
		//domRenderButton.addEventListener('click', clickedDomRenderButton, eventOption),
		
		renderNode.classList.add('sub'),
		renderNode.slot = 'ctrl-before-copy',
		
		renderButton.classList.add('custom-button'),
		renderButton.type = 'button',
		renderButton.textContent = 'Render',
		renderButton.addEventListener('click', clickedDomRenderButton, eventOption),
		
		renderLabeledNode.template = 'labeled-element',
		renderLabeledNode.label = 'Width',
		renderLabeledNode.labeled = document.createElement('input'),
		renderLabeledNode.constraint = 'labeled',
		
		renderNode.append(renderButton, renderLabeledNode),
		
		updateButton.classList.add('custom-button'),
		updateButton.type = 'button',
		updateButton.textContent = 'Update',
		updateButton.slot = 'ctrl-before-copy',
		updateButton.addEventListener('click', changedSettingsStyleArea, eventOption),
		
		settingsStyleArea.addEventListener('changed', changedSettingsStyleArea, eventOption),
		settingsStyleArea.code = true,
		settingsStyleArea.value = domStyle.textContent,
		settingsStyleArea.addEventListener('keydown-ctrl-s', changedSettingsStyleArea),
		
		settingsStyleArea.append(renderNode, updateButton);
		
	}
	
	// https://stackoverflow.com/questions/2732488/how-can-i-convert-an-html-element-to-a-canvas-element
	construct() {
		
		const	{ toHTML } = HTMLGPXDOMElement,
				{ dom, gpx, shadowRoot } = this,
				{ tracks: gpxTrks, xmlSource } = gpx,
				tracks = xmlSource.querySelectorAll('gpx > trk'),
				tracksLength = tracks.length,
				df = new DocumentFragment(),
				nodes = [],
				trackNodes = [];
		let	i,i0,l0, trk, trkpts,trkpt, trackNode,
				gpxTrk, distance,cumul, ele,eleMax,eleMin,relEle, points,point, from,to,dur;
		
		i = -1;
		while (++i < tracksLength) df.appendChild(document.importNode(tracks[i], true));
		
		const trks = df.querySelectorAll('trk');
		
		i = -1;
		while (++i < tracksLength) {
			
			i0 = -1, l0 = (trkpts = (trk = trks[i]).querySelectorAll('trkpt')).length,
			distance = (gpxTrk = gpxTrks[i]).distance.total, cumul = gpxTrk.distance.cumul,
			eleMax = (ele = gpxTrk.elevation).max, eleMin = ele.min, relEle = eleMax - eleMin,
			from = (points = gpxTrk.points)?.[0].time.getTime?.() ?? 0, to = points?.[l0 - 1]?.time.getTime() ?? 0,
			dur = to - from;
			while (++i0 < l0)	trackNode = trackNodes[i0] = toHTML(trkpt = trkpts[i0]),
									trackNode.style.setProperty('--distance', cumul[i0]),
									trackNode.style.setProperty('--rel-distance', cumul[i0] / distance),
									trackNode.style.setProperty('--rel-ele', ((point = points[i0]).ele - eleMin) / relEle),
									trackNode.style.setProperty('--rel-dur', (point.time.getTime() - from) / dur),
									trkpt.remove();
									//trackNode.style.setProperty('--lat', trackNode.getAttribute('lat')),
									//trackNode.style.setProperty('--lon', trackNode.getAttribute('lon'));
			
			(nodes[i] = toHTML(trk)).querySelector('.gpx-trkseg').append(...trackNodes),
			
			trackNodes.length = 0;
			
		}
		
		dom.replaceChildren(...nodes);
		
		//hi(dom,gpx);
		
	}
	
	[HTMLGPXInputElement.$update](source) {
		
		this.source = source, this.construct();
		
	}
	
}
HTMLGPXDOMElement.define();

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
HTMLGPXPlaceholderElement.define();

export class HTMLGPXStringifierElement extends HTMLGPXPlaceholderElement {
	
	static tagName = 'gpx-stringifier';
	static [HTMLCustomElement.$bind] = {
		
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
			
			const { constructor: { devices, repogitoryUrl }, shareUrlToggle: { activated }, outputArea: { value } } = this,
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
		
	};
	static [ElementShadow.$required] = {
		
		editArea: 'text-area#edit',
		outputArea: 'text-area#output',
		outputToggle: 'input[type="checkbox"]#output-toggle'
		
	};
	
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
				tweetNode = document.createElement('div'),
				tweetButton = document.createElement('button'),
				shareUrlToggle = this.shareUrlToggle = document.createElement('toggle-button'),
				updateButton = document.createElement('button'),
				stringifyButton = document.createElement('button'),
				viewSpecButton = document.createElement('button');
		
		editArea.addEventListener('changed', changedEditArea, eventOption),
		outputArea.addEventListener('changed', changedOutputArea, eventOption),
		
		tweetNode.classList.add('tweet'),
		tweetNode.slot = 'ctrl-before-copy',
		
		tweetButton.classList.add('custom-button'),
		tweetButton.type = 'button'
		tweetButton.textContent = 'Post to 𝕏',
		tweetButton.addEventListener('click', clickedTweetButton, eventOption),
		
		shareUrlToggle.toggleCSS = '#toggle-css',
		shareUrlToggle.title = 'Share the URL to this page.',
		
		tweetNode.append(tweetButton, shareUrlToggle),
		
		viewSpecButton.id = 'view-spec-button',
		viewSpecButton.classList.add('custom-button'),
		viewSpecButton.type = 'button',
		viewSpecButton.slot = 'ctrl-before-copy',
		viewSpecButton.textContent = 'View Spec',
		viewSpecButton.addEventListener('click', clickedViewSpecButton, eventOption),
		
		updateButton.classList.add('update', 'custom-button'),
		updateButton.type = 'button'
		updateButton.slot = 'ctrl-before-copy',
		updateButton.textContent = 'Update',
		updateButton.addEventListener('click', clickedUpdateButton, eventOption),
		
		outputArea.append(tweetNode, updateButton, viewSpecButton),
		
		stringifyButton.classList.add('stringifier', 'custom-button'),
		stringifyButton.type = 'button'
		stringifyButton.slot = 'ctrl-before-copy',
		stringifyButton.textContent = 'Stringify',
		stringifyButton.addEventListener('click', clickedStringifyButton, eventOption),
		
		editArea.append(stringifyButton),
		
		gpx.str = editArea.value;
		
	}
	
	async parse() {
		
		return this.outputArea.value = await Object.getPrototypeOf(this.constructor.prototype).parse.call(this);
		
	}
	
	[HTMLGPXInputElement.$update](source) {
		
		this.source = source, this.parse();
		
	}
	
}
HTMLGPXStringifierElement.define();

//class HTMLDeleteElement extends HTMLElement {
//	
//	static tagName = 'delete-element';
//	static clickedEventOption = { once: true };
//	
//	constructor() {
//		
//		super();
//		
//		const { clickedEventOption } = HTMLDeleteElement;
//		
//		this.boundAC = [],
//		
//		this.addEventListener('click', this.clicked, clickedEventOption);
//		
//	}
//	
//	abort() {
//		
//		const { boundAC } = this, boundACLength = boundAC.length;
//		let i;
//		
//		i = -1;
//		while (++i < boundACLength) boundAC[i]?.abort?.();
//		
//		boundAC.length = 0;
//		
//	}
//	
//	bindAC(...acs) {
//		
//		const { boundAC } = this, acsLength = acs.length;
//		let i,i0, acs0;
//		
//		i = -1, i0 = boundAC.length - 1;
//		while (++i < acsLength)	(acs0 = acs[i]) instanceof AbortController ?
//											(boundAC[++i0] = acs0.signal) : acs0 instanceof AbortSignal && (boundAC[++i0] = acs0);
//		
//		
//	}
//	
//	deleteTargets() {
//		
//		const { targets } = this, targetsLLength = targets.length;
//		let i;
//		
//		i = -1;
//		while (++i < targetsLength) targets[i].remove();
//		
//		this.abort();
//		
//	}
//	
//	get targets() {
//		
//		return this.getRootNode().querySelectorAll(this.getAttribute('targets'));
//		
//	}
//	set targets(v) {
//		
//		this.setAttribute('targets', v);
//		
//	}
//	
//}
//HTMLDeleteElement[ElementShadow.$bind] = {
//	
//	clicked(event) {
//		
//		this.deleteTargets();
//		
//	}
//	
//},
//HTMLCustomElement.define(HTMLDeleteElement);
//
//class Abort {
//	
//	static $aborting = Symbol('HTMLDeleteButton.$aborting');
//	static $ac = Symbol('HTMLDeleteButton.$ac');
//	static $available = Symbol('HTMLDeleteButton.$available');
//	
//	static abortedEventOption = { once: true };
//	
//	static aborting(rs, rj) {
//		
//		const { $ac, abortedEventOption } = HTMLDeleteButton, ac = this[$ac];
//		
//		ac.signal.addEventListener('abort', rs, abortedEventOption), this[$ac] = new AbortController(), ac.abort();
//		
//	}
//	
//	constructor() {
//		
//		const { $aborting, $ac, $available, abortedEventOption, aborting } = HTMLDeleteButton;
//		
//		this[$aborting] = aborting.bind(this),
//		
//		this[$ac] = new AbortController(),
//		
//		this[$available] = Promise.resolve();
//		
//	}
//	
//	abort() {
//		
//		const { $aborting, $available } = HTMLDeleteButton;
//		
//		return this[$available] = new Promise(this[$aborting]);
//		
//	}
//	
//	get signal() {
//		
//		const { $ac, $available } = HTMLDeleteButton, ac = this[$ac];
//		
//		this[$available];
//		
//		return ac instanceof AbortController && !ac.signal.aborted ? ac.signal : null;
//		
//	}
//	
//}

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

//class HTMLLabeledElement extends ElementShadow {
//	
//	static tagName = 'labeled-element';
//	static $labeled = Symbol('HTMLLabeledElement.input');
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
//				const { label, labeled } = this;
//				
//				label && labeled && (label.htmlFor = labeled.id = current);
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
//				
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
//		this.labelNode.appendChild(this[HTMLLabeledElement.$labeled]);
//		
//		this.setLabeled();
//		
//	}
//	//coco
//	// labeled をプロパティに保存して updatedShadow 実行毎に対象の要素へプロパティ上の labeled を挿入する？
//	setLabeled(labeled = this[HTMLLabeledElement.$labeled]) {
//		
//		const input = labeled?.matches?.('input') ? labeled : labeled?.querySelector?.('input');
//		
//		if (input) {
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
//		return this.labeledNode?.querySelector?.('input');
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
//HTMLCustomElement.define(HTMLLabeledElement);