"use strict";var $_algae={htmlParser:new DOMParser};$_algae.loadComponentTemplate=function(template){var container=document.createElement("div");var parsedTemplate=template.innerHTML.replace(/\n/g,"").replace(/>\s+|\s+</g,function(m){return m.trim()});var parsed=$_algae.htmlParser.parseFromString(parsedTemplate,"text/html").body;while(parsed.lastChild){container.prepend(parsed.removeChild(parsed.lastChild))}return container};$_algae.loadComponent=function(componentTemplate,componentData){var templateInstance=$_algae.loadComponentTemplate(componentTemplate);$_algae.parseDomElement(templateInstance,componentData);return templateInstance};
"use strict";var $_ALGAE_REGEX_VAR=/\#\!\$(.*)/;var $_ALGAE_REGEX_THIS=/\#\!\%/;var $_ALGAE_REGEX_EXPR=/\#\!\^\((.*)\)/;/*
Function for parsing algae attribute strings, returns the data referenced within
*/$_algae.parseAttributeString=function(){var text=arguments.length>0&&arguments[0]!==undefined?arguments[0]:"";var data=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};var parentData=arguments.length>2&&arguments[2]!==undefined?arguments[2]:{};if(!text)return null;var test=null;// variable reference
test=$_ALGAE_REGEX_VAR.exec(text);if(test){return data[test[1]]||null}// 'this' reference
if($_ALGAE_REGEX_THIS.exec(text)){return data}// evaluate expression
test=$_ALGAE_REGEX_EXPR.exec(text);if(test){try{return new Function(["$self","$parent"],"return "+test[1])(data,parentData)}catch(e){console.error(e);return null}}return null};/*
Function for evaluating text values within markup.
*/$_algae.parseText=function(){var text=arguments.length>0&&arguments[0]!==undefined?arguments[0]:"";var data=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};var parentData=arguments.length>2&&arguments[2]!==undefined?arguments[2]:{};// parse variables.
var ret=text.replace($_ALGAE_REGEX_VAR,function(match,key){return data[key]!=null?data[key]:"";// only omit variables if null
});// parse 'this'
ret=ret.replace($_ALGAE_REGEX_THIS,function(match,key){return data||""});// parse expressions
ret=ret.replace($_ALGAE_REGEX_EXPR,function(match,key){try{return new Function(["$self","$parent"],"return "+key)(data,parentData)||""}catch(e){console.error(e);return null}});return ret};/*
Function for parsing each DOM element within a template.
Elements need to exist on the DOM prior to parsing
*/$_algae.parseDomElement=function(currentNode){var data=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};var parentData=arguments.length>2&&arguments[2]!==undefined?arguments[2]:data;var parentNode=currentNode.parentNode;/* Note: on an element with a loop directive, any display directive belongs to the
		individual elements in the loop, and their corresponding data */if(currentNode.dataset.loopSource){var loopSourceArray=null;try{loopSourceArray=$_algae.parseAttributeString(currentNode.dataset.loopSource,data,parentData)}catch(e){console.error(e);loopSourceArray=null}if(!loopSourceArray){console.warn("loop-source iterable \""+currentNode.dataset.loopSource+"\" evaluates as 'null'.\nIgnoring.");loopSourceArray=[];// break out
}var loopContainer=document.createDocumentFragment();loopSourceArray.forEach(function(source){// create a clone of the 'template node', from which we will create the looped element.
var newTemplateItem=currentNode.cloneNode(true);delete newTemplateItem.dataset.loopSource;// avoid bad recursion
loopContainer.appendChild(newTemplateItem);// newly generated children are parsed independently with their own context
// from the loop source array. - we parse this here so we can control it's context
$_algae.parseDomElement(newTemplateItem,source,parentData)});// replace 'loop template' with parsed loop items
parentNode.replaceChild(loopContainer,currentNode);return;// child elements have already been parsed with their own data context
}if(currentNode.dataset.displayCondition){try{if(!$_algae.parseAttributeString(currentNode.dataset.displayCondition,data,parentData)){// Remove the child if the expression evaluates as false
// no need to parse the element here, it will be parsed anyway
parentNode.removeChild(currentNode);return}delete currentNode.dataset.displayCondition}catch(e){console.error(e);return null}}// parse attributes
Array.from(currentNode.attributes).forEach(function(a){return a.value=$_algae.parseText(a.value,data,parentData)});// parse inner text
currentNode.firstChild.nodeValue=$_algae.parseText(currentNode.firstChild.nodeValue||"",data,parentData);// Recursive call at end to avoid accidentally clobbering child scope with parent in scoped directives
Array.from(currentNode.children).forEach(function(i){return $_algae.parseDomElement(i,data,parentData)})};

//# sourceMappingURL=algae.js.map