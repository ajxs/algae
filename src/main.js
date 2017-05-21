'use strict';

const $_algae = {};

$_algae.htmlParser = new DOMParser();

$_algae.parseDomElement = (current, data = {}) => {
	let parentNode = current.parentNode,
		refNode = current.nextSibling;

		if(current.dataset.loopSource) {
			let loopContainer = document.createDocumentFragment(),
				loopSource = data[current.dataset.loopSource] || [];
			loopSource.forEach(source => {
				let newTemplateItem = current.cloneNode(true);
				delete newTemplateItem.dataset.loopSource;
				loopContainer.appendChild(newTemplateItem);
				$_algae.parseDomElement(newTemplateItem, source);
			});
			parentNode.removeChild(current);
			parentNode.insertBefore(loopContainer, refNode);
			// child elements have already been parsed with their own data context during creation
			return;
		}

	if(current.dataset.displayCondition) {
		parentNode.removeChild(current);
		try {
			if(new Function('$self', `return ${current.dataset.displayCondition}`)(data)) {
				// no need to parse the element here, it will be parsed anyway
				delete current.dataset.displayCondition;
				parentNode.insertBefore(current, refNode);
			}
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	Array.from(current.attributes).forEach(a => {                     // parse attributes
		a.value = $_algae.parseText(a.value, data);
	});

	current.firstChild.nodeValue = $_algae.parseText((current.firstChild.nodeValue || ''), data);

	// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
	Array.from(current.children).forEach(i => $_algae.parseDomElement(i, data));
};


$_algae.parseText = (text = '', data = {}) => {
	let ret = text.replace(/\#\!\$([^\<\>\s]*)/g, (match, key) => data[key] || '');    // parse vars
	ret = ret.replace(/\#\!\^\((.*)\)/, (match, key) => {                       // parse 'functions'
		try {    // wrap evaluation in try/catch to avoid breakage if passed invalid data
			return new Function('$self', `return ${key}`)(data) || '';
		} catch(e) {
			console.error(e);
			return null;
		}
	});
	ret = ret.replace(/\#\!\%/g, (match, key) => data || '');    // 'this'
	return ret;
};


$_algae.loadComponentTemplate = template => {
	let container = document.createElement('div');
	let parsedTemplate = template.innerHTML.replace(/\n/g, '').replace(/>\s+|\s+</g, m => m.trim());
	let parsed = $_algae.htmlParser.parseFromString(parsedTemplate, "text/html").body;
	Array.from(parsed.children).forEach(i => container.appendChild(i).cloneNode(true));
	return container;
};


$_algae.loadComponent = componentInfo => {
	componentInfo.templateInstance = $_algae.loadComponentTemplate(document.getElementById(componentInfo.template));
	let tempContainer = document.createDocumentFragment();
	// add to temporary container so that the 'template' instance becomes mutable
	tempContainer.appendChild(componentInfo.templateInstance);
	$_algae.parseDomElement(componentInfo.templateInstance, componentInfo.data);
	document.getElementById(componentInfo.container).appendChild(tempContainer);
};
