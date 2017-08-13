"use strict";

const $_ALGAE_REGEX_VAR = /\#\!\$(.*)/;
const $_ALGAE_REGEX_THIS = /\#\!\%/;
const $_ALGAE_REGEX_EXPR = /\#\!\^\((.*)\)/;

/*
Function for parsing algae attribute strings, returns the data referenced within
*/
$_algae.parseAttributeString = (text = "", data = {}, parentData = {}) => {
	if(!text) return null;

	let test = null;

	// variable reference
	test = $_ALGAE_REGEX_VAR.exec(text);
	if(test) {
		return data[test[1]];
	}

	// 'this' reference
	if($_ALGAE_REGEX_THIS.exec(text)) {
		return data;
	}

	// evaluate expression
	test = $_ALGAE_REGEX_EXPR.exec(text);
	if(test) {
		try {
			return new Function(["$self", "$parent"], `return ${test[1]}`)(data, parentData);
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	return null;
};


/*
Function for evaluating text values within markup.
*/
$_algae.parseText = (text = "", data = {}, parentData = {}) => {
		// parse variables.
		let ret = text.replace($_ALGAE_REGEX_VAR, (match, key) => {
			return data[key] != null ? data[key] : "";    // only omit variables if null
		});

		// parse 'this'
		ret = ret.replace($_ALGAE_REGEX_THIS, (match, key) => data || "");

		// parse expressions
		ret = ret.replace($_ALGAE_REGEX_EXPR, (match, key) => {
			try {
				return new Function(["$self", "$parent"], `return ${key}`)(data, parentData) || "";
			} catch(e) {
				console.error(e);
				return null;
			}
		});

		return ret;
};


/*
Function for parsing each DOM element within a template.
Elements need to exist on the DOM prior to parsing
*/
$_algae.parseDomElement = (currentNode, data = {}, parentData = data) => {
	let parentNode = currentNode.parentNode;

	/* Note: on an element with a loop directive, any display directive belongs to the
		individual elements in the loop, and their corresponding data */
	if(currentNode.dataset.loopSource) {
		let loopSourceArray = null;
		try {
			loopSourceArray = $_algae.parseAttributeString(currentNode.dataset.loopSource, data, parentData);
		} catch(e) {
			console.error(e);
			loopSourceArray = null;
		}

		if(!loopSourceArray) {
			console.warn(`loop-source iterable "${currentNode.dataset.loopSource}" evaluates as 'null'.\nIgnoring.`);
			loopSourceArray = [];    // break out
		}

		let loopContainer = document.createDocumentFragment();
		loopSourceArray.forEach(source => {
			// create a clone of the 'template node', from which we will create the looped element.
			let newTemplateItem = currentNode.cloneNode(true);

			delete newTemplateItem.dataset.loopSource;    // avoid bad recursion
			loopContainer.appendChild(newTemplateItem);

			// newly generated children are parsed independently with their own context
			// from the loop source array. - we parse this here so we can control it's context
			$_algae.parseDomElement(newTemplateItem, source, parentData);
		});

		// replace 'loop template' with parsed loop items
		parentNode.replaceChild(loopContainer, currentNode);

		return;    // child elements have already been parsed with their own data context
	}

	if(currentNode.dataset.displayCondition) {
		try {
			if(!$_algae.parseAttributeString(currentNode.dataset.displayCondition, data, parentData)) {
				// Remove the child if the expression evaluates as false
				// no need to parse the element here, it will be parsed anyway
				parentNode.removeChild(currentNode);
			}
			delete currentNode.dataset.displayCondition;
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	// currentNode.childNodes.forEach(n => {
	// 	console.log(n);
	// });

	// parse attributes
	Array.from(currentNode.attributes).forEach(a => a.value = $_algae.parseText(a.value, data, parentData));
	// parse inner text
	currentNode.firstChild.nodeValue = $_algae.parseText(currentNode.firstChild.nodeValue || "", data, parentData);
	// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
	Array.from(currentNode.children).forEach(i => $_algae.parseDomElement(i, data, parentData));
};
