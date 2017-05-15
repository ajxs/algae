'use strict'

const parseDomElement = (current, data = {}) => {
	if(!current) return null;
	let parentNode = current.parentNode, refNode = current.nextSibling;

	if(current.dataset.displayCondition) {
		parentNode.removeChild(current);
		try {
			if(new Function('$self', `return ${current.dataset.displayCondition}`)(data)) {
				current.innerHTML = parseDomElementInner(current.innerHTML, data);
				parentNode.insertBefore(current, refNode);
			}
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	if(current.dataset.loopSource) {
		let loopContainer = document.createDocumentFragment();
		data[current.dataset.loopSource].forEach(s => {
			let newTemplateItem = current.cloneNode(true);
			delete newTemplateItem.dataset.loopSource;
			parseDomElement(newTemplateItem, s);
			loopContainer.appendChild(newTemplateItem);
		});
		parentNode.removeChild(current);
		parentNode.insertBefore(loopContainer, refNode);
		// child elements have already been parsed with their own data context during creation
		return;
	}

	Array.from(current.attributes).forEach(a => a.nodeValue = parseDomElementInner(a.nodeValue, data));
	if(!current.firstChild) return;
	current.firstChild.nodeValue = parseDomElementInner(current.firstChild.nodeValue, data);

	// Recursive call at end to avoid accidentally clobbering child scope with parent in loops
	Array.from(current.children).forEach(i => parseDomElement(i, data));
};

const htmlParser = new DOMParser();
const parseDomElementInner = (text = '', data = {}) => {
	let ret = text.replace(/\#\!\$([^\<\>\s]*)/g, (match, key) => (data[key] || ''));    // parse vars
	ret = ret.replace(/\#\!\^\(([^\<\>\s]*)\)/g, (match, key) => {                       // parse 'functions'
		try {    // wrap evaluation in try/catch to avoid breakage if passed invalid data
			return (new Function('$self', `return ${key}`)(data));
		} catch(e) {
			console.error(e);
			return null;
		}
	});
	return ret;
};

const loadComponentTemplate = template => htmlParser.parseFromString((template.innerHTML || '').replace('\n',''), "text/html").body.firstChild;
const loadComponent = componentInfo => {
	componentInfo.templateInstance = loadComponentTemplate(document.getElementById(componentInfo.template));
	let tempContainer = document.createDocumentFragment();
	// add to temporary container so that the 'template' instance becomes mutable
	tempContainer.appendChild(componentInfo.templateInstance);
	parseDomElement(componentInfo.templateInstance, componentInfo.data);
	document.getElementById(componentInfo.container).appendChild(tempContainer);
};
