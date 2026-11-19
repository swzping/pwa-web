const getAbsolutePath = (importPath, filePath) => {
    const path = require('path');
    const SOURCE_PATH = path.resolve();
    if (importPath.indexOf('.') == 0) {
        return path
            .resolve(path.dirname(filePath), importPath)
            .replace(`${SOURCE_PATH}\\`, '')
            .replace('src\\overrides\\venia-ui', '@magento\\venia-ui\\lib')
            .replace('src\\overrides\\peregrine', '@magento\\peregrine\\lib')
            .replace('src\\overrides\\pagebuilder', '@magento\\pagebuilder\\lib')
            .replace(/\\/g, '/');
    }
    return importPath;
};

const replaceImportPath = (j, node, filePath) => {
    const ret = j.importDeclaration(
        node.value.specifiers,
        j.literal(getAbsolutePath(node.value.source.value, filePath))
    );
    return ret;
}

export default function(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    const getFirstNode = () => root.find(j.Program).get('body', 0).node;
    
    // Save the comments attached to the first node
    const firstNode = getFirstNode();
    const { comments } = firstNode;

    // transforming
    root
        .find(j.ImportDeclaration)
        .replaceWith(node => replaceImportPath(j, node, file.path));

    // If the first node has been modified or deleted, reattach the comments
    const firstNode2 = getFirstNode();
    if (firstNode2 !== firstNode) {
        firstNode2.comments = comments;
    }

    return root.toSource();
};