"use strict";

const $_algae = {
	htmlParser: new DOMParser()
};

$_algae.loadComponentTemplate = template => {
	let container = document.createElement("div");
	let parsedTemplate = template.innerHTML.replace(/\n/g, '');
	parsedTemplate = parsedTemplate.replace(/>\s+|\s+</g, m => m.trim());
	let parsed = $_algae.htmlParser.parseFromString(parsedTemplate, "text/html").body;
	while(parsed.lastChild) {
		container.prepend(parsed.removeChild(parsed.lastChild));
	}
	return container;
};


$_algae.loadComponent = (componentTemplate, componentData) => {
	let templateInstance = $_algae.loadComponentTemplate(componentTemplate);
	$_algae.parseDomElement(templateInstance, componentData);
	return templateInstance;
};
