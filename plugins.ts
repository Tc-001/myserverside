//Plugins are functions that manipulate the DOM in a specific way 
// (Replacing <prop /> tags, adding JS, etc.)
//Plugins get activated by default-exporting an array of them.
//Server then runs each function in turn.

import { HTMLDocument } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

function AllowJsFromServerFunc(doc:HTMLDocument, props: Record<string, string>) {
	//Allows JS fromServer() to work
	const fromserver = doc.createElement("script")
	doc.head.appendChild(fromserver)
	fromserver.innerHTML = [
		"",
		"//Code added by MyServerside",
		"function fromServer(from) {",
		`  var props = JSON.parse(atob("${btoa(JSON.stringify(props))}"))`,
		"  return props[from]",
		"}",
		""
	].join("\n")
}

function AllowPropsToWork(doc:HTMLDocument, props: Record<string, string>) {
	//Replaces <prop /> tags
	const tags = doc.getElementsByTagName("prop")
	tags.forEach((tag) => {
		const type = tag.attributes.getNamedItem("type").value ?? "text"
		const from = tag.attributes.getNamedItem("from").value
		if (from == undefined) return
		if(type === "text"){
			//If need to insert text
			tag.replaceWith(doc.createTextNode(props[from] ?? "unknown"))
			console.log(tag.outerHTML);
		} else if (type === "html") {
			//If need to insert HTML
			//I create a div, add the HTML in it, then extract them out
			//This is so the HTML is in the correct position, wihout messing up the CSS
			const div = doc.createElement("div")
			div.innerHTML = props[from] ?? "unknown"
			tag.replaceWith(div)
			//Extract children from div
			Array.from(div.children).forEach(child => div.parentElement?.insertBefore(child, div))
			div.remove()
		} else {
			tag.replaceWith(doc.createComment("Error rendering prop! Unknown \"from\" attribute"))
		}
	})
}

export default [AllowJsFromServerFunc, AllowPropsToWork]