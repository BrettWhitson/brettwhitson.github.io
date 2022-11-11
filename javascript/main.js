document.addEventListener("DOMContentLoaded", main);

function main() {
	get = (x) => document.querySelector(x);
	getAll = (x) => document.querySelectorAll(x);
	loadPageData().then((data) => {
		dom = {
			linklist: get(".linklist"),
			content: get("#content"),
		};
		buildLinks(data.sections);
		buildSections(data.sections);
		buildDevIcons(data.icons);
	});
}

async function loadPageData() {
	let data = await fetch("./data/data.json");
	let pageData = await data.json();
	return pageData;
}

function buildLinks(sections) {
	for (let section of sections) {
		let link = document.createElement("a");
		link.href = "#" + section.section + "-section";
		link.innerHTML = section.title;
		link.setAttribute("data-text", section.title);
		let li = document.createElement("li");
		li.appendChild(link);
		dom.linklist.appendChild(li);
	}
}

async function buildSections(sections) {
	console.log("building sections");
	for (let section of sections) {
		switch (section.type) {
			case "pg":
				buildPgSection(section);
				break;
			case "ls":
				buildLsSection(section);
				break;
			case "rs":
				buildRsSection(section);
				break;
		}
	}
}

function buildDevIcons(icons) {
	console.log(icons);
	let skills = get(".lang-icon-list");
	for (let icon of icons.languages) {
		let icotag = document.createElement("i");
		icotag.classList.add("devicon-" + icon + "-plain");
		skills.appendChild(icotag);
	}
	let tools = get(".tool-icon-list");
	for (let icon of icons.tools) {
		let icotag = document.createElement("i");
		icotag.classList.add("devicon-" + icon + "-plain");
		tools.appendChild(icotag);
	}
}

function buildPgSection(section) {
	let div = document.createElement("div");
	let title = document.createElement("h2");
	let body = document.createElement("p");
	div.id = section.section + "-section";
	div.classList.add("section");
	title.innerHTML = section.title;
	title.classList.add("section-title");
	body.innerHTML = section.body;
	body.classList.add("section-body");
	div.appendChild(title);
	div.appendChild(body);
	dom.content.appendChild(div);
}

function buildLsSection(section) {
	let buildListItem = (item) => {
		let element = {
			li: document.createElement("li"),
			header: document.createElement("h4"),
			subheader: document.createElement("h4"),
			subsubheader: document.createElement("h6"),
			main: document.createElement("p"),
		};
		element.li.classList.add("section-list-item");
		if (item.header) {
			element.header.innerHTML = item.header;
			element.header.classList.add("list-item-header");
			element.li.appendChild(element.header);
		}
		if (item.subheader) {
			element.subheader.innerHTML = item.subheader;
			element.subheader.classList.add("list-item-subheader");
			element.li.appendChild(element.subheader);
		}
		if (item.subsubheader) {
			element.subsubheader.innerHTML = item.subsubheader;
			element.subsubheader.classList.add("list-item-subsubheader");
			element.li.appendChild(element.subsubheader);
		}
		if (item.main) {
			element.main.innerHTML = item.main;
			element.main.classList.add("list-item-main");
			element.li.appendChild(element.main);
		}
		return element.li;
	};
	let element = {
		div: document.createElement("div"),
		title: document.createElement("h2"),
		list: document.createElement("ul"),
	};
	element.div.id = section.section + "-section";
	element.div.classList.add("section");
	element.title.innerHTML = section.title;
	element.title.classList.add("section-title");
	element.list.classList.add("section-body-list");
	for (let item of section.body) {
		element.list.appendChild(buildListItem(item));
	}
	element.div.appendChild(element.title);
	element.div.appendChild(element.list);
	dom.content.appendChild(element.div);
}

function buildRsSection(section) {
	let element = {
		div: document.createElement("div"),
		title: document.createElement("h2"),
		frame: {
			iframe: document.createElement("iframe"),
			file: section.file,
		},
	};
	let mobileElement = {
		div: document.createElement("div"),
		title: document.createElement("h2"),
		anchor: document.createElement("a"),
	};
	element.div.id = section.section + "-section";
	element.div.classList.add("section");
	element.div.classList.add("mobile-hide");
	element.title.innerHTML = section.title;
	element.title.classList.add("section-title");
	element.div.appendChild(element.title);
	element.frame.iframe.src = element.frame.file + "#navpanes=0&toolbar=0";
	element.frame.iframe.classList.add("section-body-iframe");
	element.frame.iframe.id = "pdfFrame";
	element.div.appendChild(element.frame.iframe);
	mobileElement.div.id = section.section + "-section";
	mobileElement.div.classList.add("section");
	mobileElement.div.classList.add("mobile");
	mobileElement.title.classList.add("section-title");
	mobileElement.anchor.href = element.frame.file;
	mobileElement.anchor.innerHTML = "Download Resume PDF";
	mobileElement.anchor.download = "whitson_resume_21.pdf";
	mobileElement.title.appendChild(mobileElement.anchor);
	mobileElement.div.appendChild(mobileElement.title);
	if (window.screen.width > 980) {
		dom.content.appendChild(element.div);
	}
	dom.content.appendChild(mobileElement.div);
}
