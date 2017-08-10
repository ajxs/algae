"use strict";

const $_algae = {
	htmlParser: new DOMParser()
};

$_algae.parseDomElement = (currentNode, data = {}, parentData = data) => {
	// Elements need to exist on the DOM prior to parsing
	let parentNode = currentNode.parentNode;

	if(currentNode.dataset.loopSource) {
		let loopSourceArray = null;
		try {
			loopSourceArray = $_algae.parseExpression(currentNode.dataset.loopSource, data, parentData);
		} catch(e) {
			console.error(e);
			loopSourceArray = null;
		}

		//let loopSourceArray = data[loopSourceKey];
		if(!loopSourceArray) {
			console.warn(`loop-source iterable "${currentNode.dataset.loopSource}" evaluates as 'null'.\nIgnoring.`);
			loopSourceArray = [];    // break out
		}

		let loopContainer = document.createDocumentFragment();
		loopSourceArray.forEach(source => {
			let newTemplateItem = currentNode.cloneNode(true);

			// remove the data from the generated children.
			delete newTemplateItem.dataset.loopSource;
			loopContainer.appendChild(newTemplateItem);

			// newly generated children are parsed independently with their own context
			// from the loop source array. - we parse this here so we can control it's context
			$_algae.parseDomElement(newTemplateItem, source, parentData);
		});

		// replace 'loop template' with parsed loop items
		parentNode.insertBefore(loopContainer, currentNode);
		parentNode.removeChild(currentNode);

		// child elements have already been parsed with their own data context during creation
		return;
	}

	if(currentNode.dataset.displayCondition) {
		try {
			if($_algae.parseExpression(currentNode.dataset.displayCondition, data, parentData)) {
				// no need to parse the element here, it will be parsed anyway
				delete currentNode.dataset.displayCondition;
			} else {
				// Remove the child if the expression evaluates as false
				parentNode.removeChild(currentNode);
			}
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	// parse attributes
	Array.from(currentNode.attributes).forEach(a => a.value = $_algae.parseText(a.value, data, parentData));
	// parse inner text
	currentNode.firstChild.nodeValue = $_algae.parseText(currentNode.firstChild.nodeValue || "", data, parentData);
	// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
	Array.from(currentNode.children).forEach(i => $_algae.parseDomElement(i, data, parentData));
};


/*
This function is only to be used for parsing certain attributes,
which are predetermined to return data and not strings.
@TODO: document this properly.
*/
$_algae.parseExpression = (text = "", data = {}, parentData = {}) => {
	if(!text) return null;

	// variable reference
	let varTest = /\#\!\$([^\<\>\s]*)/g.exec(text);
	if(varTest) {
		return data[varTest[1]];
	}

	if(/\#\!\%/g.exec(text)) {   // 'this' reference
		return data;
	}

	// evaluate expression
	let exprTest = /\#\!\^\((.*)\)/g.exec(text);
	if(exprTest) {
		try {
			return new Function(["$self", "$parent"], `return ${exprTest[1]}`)(data, parentData);
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	// if not an expression, just attempt to match to a variable
	return text;
};


$_algae.parseText = (text = "", data = {}, parentData = {}) => {
	// parse variables.
	let ret = text.replace(/\#\!\$([^\<\>\s]*)/g, (match, key) => {
		return data[key] != null ? data[key] : "";    // only omit variables if null
	});

	ret = ret.replace(/\#\!\%/g, (match, key) => data || "");    // 'this'
	ret = ret.replace(/\#\!\^\((.*)\)/g, (match, key) => {        // parse 'functions'
		try {
			// avoid breakage if passed invalid data
			// this just returns the string as an expression, with "$self" and "$parent"
			// as operators.
			return new Function(["$self", "$parent"], `return ${key}`)(data, parentData) || "";
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
	// return the parsed template as a DOM component
	return tempContainer;
};
