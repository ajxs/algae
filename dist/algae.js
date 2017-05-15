'use strict';

var parseDomElement = function parseDomElement(current) {
	var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	if (!current) return null;
	var parentNode = current.parentNode,
	    refNode = current.nextSibling;

	if (current.dataset.displayCondition) {
		parentNode.removeChild(current);
		try {
			if (new Function('$self', 'return ' + current.dataset.displayCondition)(data)) {
				current.innerHTML = parseDomElementInner(current.innerHTML, data);
				parentNode.insertBefore(current, refNode);
			}
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	if (current.dataset.loopSource) {
		var loopContainer = document.createDocumentFragment();
		data[current.dataset.loopSource].forEach(function (s) {
			var newTemplateItem = current.cloneNode(true);
			delete newTemplateItem.dataset.loopSource;
			parseDomElement(newTemplateItem, s);
			loopContainer.appendChild(newTemplateItem);
		});
		parentNode.removeChild(current);
		parentNode.insertBefore(loopContainer, refNode);
		// child elements have already been parsed with their own data context during creation
		return;
	}

	Array.from(current.attributes).forEach(function (a) {
		return a.nodeValue = parseDomElementInner(a.nodeValue, data);
	});
	if (!current.firstChild) return;
	current.firstChild.nodeValue = parseDomElementInner(current.firstChild.nodeValue, data);

	// Recursive call at end to avoid accidentally clobbering child scope with parent in loops
	Array.from(current.children).forEach(function (i) {
		return parseDomElement(i, data);
	});
};

var htmlParser = new DOMParser();
var parseDomElementInner = function parseDomElementInner() {
	var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var ret = text.replace(/\#\!\$([^\<\>\s]*)/g, function (match, key) {
		return data[key] || '';
	}); // parse vars
	ret = ret.replace(/\#\!\^\(([^\<\>\s]*)\)/g, function (match, key) {
		// parse 'functions'
		try {
			// wrap evaluation in try/catch to avoid breakage if passed invalid data
			return new Function('$self', 'return ' + key)(data);
		} catch (e) {
			console.error(e);
			return null;
		}
	});
	return ret;
};

var loadComponentTemplate = function loadComponentTemplate(template) {
	return htmlParser.parseFromString((template.innerHTML || '').replace('\n', ''), "text/html").body.firstChild;
};
var loadComponent = function loadComponent(componentInfo) {
	componentInfo.templateInstance = loadComponentTemplate(document.getElementById(componentInfo.template));
	var tempContainer = document.createDocumentFragment();
	// add to temporary container so that the 'template' instance becomes mutable
	tempContainer.appendChild(componentInfo.templateInstance);
	parseDomElement(componentInfo.templateInstance, componentInfo.data);
	document.getElementById(componentInfo.container).appendChild(tempContainer);
};
