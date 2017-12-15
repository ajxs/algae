"use strict";

const $_ALGAE_REGEX_VAR = /\#\!\$(.*)/;
const $_ALGAE_REGEX_THIS = /\#\!\%/;
const $_ALGAE_REGEX_EXPR = /\#\!\^\((.*)\)/;

/*
Function for parsing algae attribute strings, returns the data referenced within
*/
// $_algae.parseAttributeString = (text = "", data = {}, parentData = {}) => {
$_algae.parseAttributeString = (text = "",
	componentData = {},
	currentScope = componentData) => {


	if(!text) return null;

	// variable reference
	let test = $_ALGAE_REGEX_VAR.exec(text);
	if(test) {
		return currentScope[test[1]] || null;
	}

	// 'this' reference
	if($_ALGAE_REGEX_THIS.exec(text)) {
		return currentScope;
	}

	// evaluate expression
	test = $_ALGAE_REGEX_EXPR.exec(text);
	if(test) {
		try {
			return new Function(["$self", "$parent"], `return ${test[1]}`)(currentScope, componentData);
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
// $_algae.parseText = (text = "", data = {}, parentData = {}) => {
$_algae.parseText = (text = "",
	componentData = {},
	currentScope = componentData) => {

	// parse variables.
	let ret = text.replace($_ALGAE_REGEX_VAR, (match, key) => {
		return currentScope[key] != null ? currentScope[key] : "";    // only omit variables if null
	});

	// parse 'this'
	ret = ret.replace($_ALGAE_REGEX_THIS, (match, key) => currentScope || "");

	// parse expressions
	ret = ret.replace($_ALGAE_REGEX_EXPR, (match, key) => {
		try {
			return new Function(["$self", "$parent"], `return ${key}`)(currentScope, componentData) || "";
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
$_algae.parseDomElement = (currentNode,
	componentData = {},
	currentScope = componentData) => {

	let parentNode = currentNode.parentNode;

	/* Note: on an element with a loop directive, any display directive belongs to the
		individual elements in the loop, and their corresponding data */
	if(currentNode.dataset.loopSource) {
		let loopSourceArray = null;
		try {
			loopSourceArray = $_algae.parseAttributeString(currentNode.dataset.loopSource,
				componentData, currentScope);
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
			$_algae.parseDomElement(newTemplateItem, componentData, source);
		});

		// replace 'loop template' with parsed loop items
		parentNode.replaceChild(loopContainer, currentNode);
		return;    // child elements have already been parsed with their own data context
	}

	if(currentNode.dataset.displayCondition) {
		try {
			if(!$_algae.parseAttributeString(currentNode.dataset.displayCondition,
				componentData, currentScope)) {

				// Remove the child if the expression evaluates as false
				// no need to parse the element here, it will be parsed anyway
				parentNode.removeChild(currentNode);
				return;
			}
			delete currentNode.dataset.displayCondition;
		} catch(e) {
			console.error(e);
			return null;
		}
	}

	// parse attributes
	Array.from(currentNode.attributes).forEach(a => a.value = $_algae.parseText(a.value,
		componentData, currentScope));

	// parse inner text
	currentNode.firstChild.nodeValue = $_algae.parseText(currentNode.firstChild.nodeValue || "",
		componentData, currentScope);
	// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
	Array.from(currentNode.children).forEach(i => $_algae.parseDomElement(i, componentData, currentScope));
};
