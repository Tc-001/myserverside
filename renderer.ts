import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

import plugins from "./plugins.ts"

//Use a shim for async functions to allow awaiting and such
//https://davidwalsh.name/async-function-class
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
type intermediateObject = Record<string, string>

//Transform the html to include the previously run scripts
export async function render(filetxt:string): Promise<[string, string|null]> {
	filetxt = filetxt.replaceAll("	", "  ")
	const doc = new DOMParser().parseFromString(filetxt, "text/html")
	if(!doc) return ["", "Could not parse document!"]
	//Runs the server-side script
	const script = doc.querySelector(`script[context="server"]`) //get the serverside script
	var props:intermediateObject | undefined = undefined
	if (script) {
		//Executes the script
		const serverSideFunc = new AsyncFunction(script.innerHTML)
		props = await serverSideFunc()
		//Removes the script from html
		script.remove()
	}
	//Runs the plugins
	if(props !== undefined) {
		for (const plugin of plugins) {
			plugin(doc, props)
		}
	}
	let rawHTML = doc.body.parentElement?.innerHTML ?? ""
	//Some last minute formatting so it is nicer to read
	//Collapses newlines
	while (rawHTML.includes("\n\n")) {
		rawHTML = rawHTML.replaceAll("\n\n", "\n")
	}
	return [rawHTML,null]
}

console.log((await render(Deno.readTextFileSync("index.html")))[0]);
