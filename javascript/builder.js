class Builder {
    static build(tag, options) {
        let element = document.createElement(tag);
        let ops = {
            inner: (v) => {
                element.innerHTML = v;
            },
            children: (v) => {
                v.forEach((child) => {
                    element.appendChild(child);
                });
            },
        };
        for (let key in options) {
            if (ops[key]) {
                ops[key](options[key]);
            } else {
                element.setAttribute(key, options[key]);
            }
        }
        return element;
    }
    static multibuild(tag, num, options) {
        let frag = document.createDocumentFragment();
        let element = Builder.build(tag, options);
        for (let i = 0; i < num; i++) {
            frag.appendChild(element.cloneNode(true));
        }
        return frag;
    }
    static mod = {
        id: {
            add: (node, idString) => {
                node.setAttribute("id", idString);
            },
            remove: (node, idString) => {
                node.removeAttribute("id");
            },
        },
        class: {
            add: (node, classString) => {
                let newClasses = classString.split(" ");
                node.classList.add(...newClasses);
            },
            remove: (node, classString) => {
                let newClasses = classString.split(" ");
                node.classList.remove(...newClasses);
            },
            toggle: (node, classString) => {
                let toggles = classString.split(" ");
                node.classList.toggle(...toggles);
            },
        },
        attribute: {
            add: (node, options) => {
                for (let key in options) {
                    node.setAttribute(key, options[key]);
                }
            },
            remove: (node, attributeString) => {
                let attributes = attributeString.split(" ");
                node.removeAttribute(...attributes);
            },
        },
    };
    static pack(elementArr, ...elements) {
        console.log("pack called:", elementArr, elements);
        let pack = document.createDocumentFragment();
        console.log("typeof elementArr:", typeof elementArr);
        if (typeof elementArr === "object" && elementArr.length) {
            for (let element of elementArr) {
                pack.appendChild(element);
            }
        } else {
            pack.appendChild(elementArr);
            for (let element of elements) {
                pack.appendChild(element);
            }
        }
        console.log("pack:", pack);
        return pack;
    }
    static chain(...elements) {
        let chain = document.createDocumentFragment();
        let lowest;
        for (let element of elements) {
            if (!chain.lastElementChild) {
                chain.appendChild(element);
                lowest = element;
            } else {
                lowest.appendChild(element);
                lowest = element;
            }
        }
        return chain;
    }
    static emmet(emmetString, options) {}
}
