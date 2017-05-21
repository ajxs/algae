# AlgaeJS
Inspired by what can only be described as an 'algal bloom' of Javascript frameworks providing MVC-like functionality, I decided to experiment for myself in what was involved in creating a simple templating/component framework with a declarative syntax in HTML.

Example Template Syntax:

    <ul>
		<li class="#!^($self.name.replace(' ','-'))" data-loop-source="list">
			<h1>#!$name</h1>
			<div>#!$description</div>
			<div data-display-condition="$self.status">
				RESOLVED
			</div>
		</li>
    </ul>

## Functionality
* Data is inserted into a template using the syntax `#!$member`. Data is scoped to the parent object, or the current looped item, if contained within a loop directive.

* Looping is accomplished by declaring a container element with the `data-loop-source` 'dataset attribute'.

* Lines using the `#!^(expression)` syntax will be evaluated prior to insertion into the template, with `$self` as a reference to the parent scope.

* Conditional expressions for displaying elements can be declared by using the `data-display-condition` dataset attribute.
