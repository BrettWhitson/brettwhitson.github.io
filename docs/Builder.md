# Documentation for JavaScript class "Builder":

## The "Builder" class is a utility class that provides methods to create and manipulate DOM elements.

1. "build" method:

    - Syntax: `Builder.build(tag, options)`
    - Description: Creates a new DOM element with the specified tag and options. The tag parameter is a string representing the HTML tag name of the element to be created. The options parameter is an object containing key-value pairs that represent the element's attributes, innerHTML, and children.
    - Parameters:
        - `tag`: The tag name of the element to be created (string)
        - `options`: An object containing the attributes, innerHTML, and children of the element (object)
    - Return value: The newly created DOM element (object)

2. "multibuild" method:

    - Syntax: `Builder.multibuild(tag, num, options)`
    - Description: Creates a document fragment containing multiple copies of the same DOM element created using the "build" method.
    - Parameters:
        - `tag`: The tag name of the element to be created (string)
        - `num`: The number of times to create the element (number)
        - `options`: An object containing the attributes, innerHTML, and children of the element (object)
    - Return value: A document fragment containing multiple copies of the same DOM element (object)

3. "mod" object:

    - Description: An object containing methods to modify elements' ID, class, and attributes.
    - Properties:
        - `id`: An object containing methods to add, remove, and toggle an element's ID.
        - `class`: An object containing methods to add, remove, and toggle an element's class.
        - `attribute`: An object containing methods to add and remove an element's attributes.

4. "pack" method:

    - Syntax: `Builder.pack(elementArr, ...elements)`
    - Description: Creates a document fragment containing the specified elements.
    - Parameters:
        - `elementArr`: An array or a single DOM element to be packed (array or object)
        - `elements`: Additional DOM elements to be packed (object)
    - Return value: A document fragment containing the specified elements (object)

5. "chain" method:

    - Syntax: `Builder.chain(...elements)`
    - Description: Chains the specified elements together as children.
    - Parameters:
        - `elements`: DOM elements to be chained (object)
    - Return value: A document fragment containing the chained elements (object)

6. "emmet" method:
    - Syntax: `Builder.emmet(emmetString, options)`
    - Description: Parses an Emmet string and returns the corresponding DOM element.
    - Parameters:
        - `emmetString`: A string representing the Emmet notation of the element to be created (string)
        - `options`: An object containing the attributes, innerHTML, and children of the element (object)
    - Return value: The corresponding DOM element (object)
