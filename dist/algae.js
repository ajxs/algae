'use strict';

var $_algae = {};

$_algae.htmlParser = new DOMParser();

$_algae.parseDomElement = function (current) {
	var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var parentNode = current.parentNode,
	    refNode = current.nextSibling;

	//@TODO: Allow list item to have condition

	if (current.dataset.displayCondition) {
		// this condition is to allow programmatically created elements to be parsed here
		if (parentNode) parentNode.removeChild(current);
		try {
			
			if (new Function('$self', 'return ' + current.dataset.displayCondition)(data)) {
				// no need to parse the element here, it will be parsed anyway
				delete current.dataset.displayCondition;
				parentNode.insertBefore(current, refNode);
			} else {
				return; // condition not passed
			}
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	if (current.dataset.loopSource) {
		var loopContainer = document.createDocumentFragment(),
		    loopSource = data[current.dataset.loopSource] || [];
		loopSource.forEach(function (source) {
			var newTemplateItem = current.cloneNode(true);
			delete newTemplateItem.dataset.loopSource;
			$_algae.parseDomElement(newTemplateItem, source);
			loopContainer.appendChild(newTemplateItem);
		});
		parentNode.removeChild(current);
		parentNode.insertBefore(loopContainer, refNode);
		// child elements have already been parsed with their own data context during creation
		return;
	}

	Array.from(current.attributes).forEach(function (a) {
		return a.nodeValue = $_algae.parseDomElementInner(a.nodeValue, data);
	});
	if (!current.firstChild) return;
	current.firstChild.nodeValue = $_algae.parseDomElementInner(current.firstChild.nodeValue, data);

	// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
	Array.from(current.children).forEach(function (i) {
		return $_algae.parseDomElement(i, data);
	});
};

$_algae.parseDomElementInner = function () {
	var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var ret = text.replace(/\#\!\$([^\<\>\s]*)/g, function (match, key) {
		return data[key] || '';
	}); // parse vars
	ret = ret.replace(/\#\!\^\(([^\<\>\s]*)\)/g, function (match, key) {
		// parse 'functions'
		try {
			// wrap evaluation in try/catch to avoid breakage if passed invalid data
			return new Function('$self', 'return ' + key)(data) || '';
		} catch (e) {
			console.error(e);
			return null;
		}
	});
	return ret;
};

$_algae.loadComponentTemplate = function (template) {
	return $_algae.htmlParser.parseFromString((template.innerHTML || '').replace('\n', ''), "text/html").body.firstChild;
};
$_algae.loadComponent = function (componentInfo) {
	componentInfo.templateInstance = $_algae.loadComponentTemplate(document.getElementById(componentInfo.template));
	var tempContainer = document.createDocumentFragment();
	// add to temporary container so that the 'template' instance becomes mutable
	tempContainer.appendChild(componentInfo.templateInstance);
	$_algae.parseDomElement(componentInfo.templateInstance, componentInfo.data);
	document.getElementById(componentInfo.container).appendChild(tempContainer);
};
