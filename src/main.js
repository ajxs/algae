'use strict';

const $_algae = {
	htmlParser: new DOMParser()
};


$_algae.parseDomElement = (current, data = {}, parentData = data) => {
	// Elements need to exist on the DOM prior to parsing
	let parentNode = current.parentNode,
		refNode = current.nextSibling;

	if(current.dataset.loopSource) {
		let loopSourceArray = data[current.dataset.loopSource];
		if(!loopSourceArray) {
			console.warn(`loop-source iterable "${current.dataset.loopSource}" evaluates as 'null'.\nIgnoring.`);
			loopSourceArray = [];    // break out
		}

		let loopContainer = document.createDocumentFragment();
		loopSourceArray.forEach(source => {
			let newTemplateItem = current.cloneNode(true);

			// remove the data from the generated children.
			delete newTemplateItem.dataset.loopSource;
			loopContainer.appendChild(newTemplateItem);

			// newly generated children are parsed independently with their own context
			// from the loop source array.
			$_algae.parseDomElement(newTemplateItem, source, parentData);
		});

		// replace 'loop template' with parsed loop items
		parentNode.removeChild(current);
		parentNode.insertBefore(loopContainer, refNode);

		// child elements have already been parsed with their own data context during creation
		return;
	}

	if(current.dataset.displayCondition) {
		parentNode.removeChild(current);
		try {
			if(new Function("$self", "$parent", `return ${current.dataset.displayCondition}`)(data, parentData)) {
				// no need to parse the element here, it will be parsed anyway
				delete current.dataset.displayCondition;
				parentNode.insertBefore(current, refNode);
			}
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	// parse attributes
	Array.from(current.attributes).forEach(a => a.value = $_algae.parseText(a.value, data, parentData));
	// parse inner text
	current.firstChild.nodeValue = $_algae.parseText((current.firstChild.nodeValue || ""), data, parentData);

	// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
	Array.from(current.children).forEach(i => $_algae.parseDomElement(i, data, parentData));
};


$_algae.parseText = (text = "", data = {}, parentData = {}) => {
	let ret = text.replace(/\#\!\$([^\<\>\s]*)/g, (match, key) => {
		// parse variables.
		return data[key] != null ? data[key] : "";    // only omit variables if null
	});

	ret = ret.replace(/\#\!\%/g, (match, key) => data || "");    // 'this'
	ret = ret.replace(/\#\!\^\((.*)\)/, (match, key) => {        // parse 'functions'
		try {
			// avoid breakage if passed invalid data
			// this just returns the string as an expression, with "$self" and "$parent"
			// as operators.
			return new Function(["$self", "$parent"], `return ${key}`)(data, parentData) || '';
		} catch(e) {
			console.error(e);
			return null;
		}
	});
	return ret;
};


$_algae.loadComponentTemplate = template => {
	let container = document.createElement("div");
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
