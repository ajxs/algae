'use strict';

var $_algae = {
	htmlParser: new DOMParser()
};

$_algae.parseDomElement = function (current) {
	var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var parentNode = current.parentNode,
	    refNode = current.nextSibling;

	if (current.dataset.loopSource) {
		var loopContainer = document.createDocumentFragment(),
		    loopSource = data[current.dataset.loopSource] || [];
		loopSource.forEach(function (source) {
			var newTemplateItem = current.cloneNode(true);
			delete newTemplateItem.dataset.loopSource;
			loopContainer.appendChild(newTemplateItem);
			$_algae.parseDomElement(newTemplateItem, source);
		});

		parentNode.removeChild(current); // replace 'loop template' with parsed loop items
		parentNode.insertBefore(loopContainer, refNode);
		return; // child elements have already been parsed with their own data context during creation
	}

	if (current.dataset.displayCondition) {
		parentNode.removeChild(current);
		try {
			if (new Function('$self', 'return ' + current.dataset.displayCondition)(data)) {
				// no need to parse the element here, it will be parsed anyway
				delete current.dataset.displayCondition;
				parentNode.insertBefore(current, refNode);
			}
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	// parse attributes
	Array.from(current.attributes).forEach(function (a) {
		return a.value = $_algae.parseText(a.value, data);
	});
	// parse inner text
	current.firstChild.nodeValue = $_algae.parseText(current.firstChild.nodeValue || '', data);

	// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
	Array.from(current.children).forEach(function (i) {
		return $_algae.parseDomElement(i, data);
	});
};

$_algae.parseText = function () {
	var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var ret = text.replace(/\#\!\$([^\<\>\s]*)/g, function (match, key) {
		return data[key] || '';
	}); // parse vars
	ret = ret.replace(/\#\!\%/g, function (match, key) {
		return data || '';
	}); // 'this'
	ret = ret.replace(/\#\!\^\((.*)\)/, function (match, key) {
		// parse 'functions'
		try {
			// avoid breakage if passed invalid data
			return new Function('$self', 'return ' + key)(data) || '';
		} catch (e) {
			console.error(e);
			return null;
		}
	});
	return ret;
};

$_algae.loadComponentTemplate = function (template) {
	var container = document.createElement('div');
	var parsedTemplate = template.innerHTML.replace(/\n/g, '').replace(/>\s+|\s+</g, function (m) {
		return m.trim();
	});
	var parsed = $_algae.htmlParser.parseFromString(parsedTemplate, "text/html").body;
	Array.from(parsed.children).forEach(function (i) {
		return container.appendChild(i).cloneNode(true);
	});
	return container;
};

$_algae.loadComponent = function (componentInfo) {
	componentInfo.templateInstance = $_algae.loadComponentTemplate(document.getElementById(componentInfo.template));
	var tempContainer = document.createDocumentFragment();
	// add to temporary container so that the 'template' instance becomes mutable
	tempContainer.appendChild(componentInfo.templateInstance);
	$_algae.parseDomElement(componentInfo.templateInstance, componentInfo.data);
	document.getElementById(componentInfo.container).appendChild(tempContainer);
};
