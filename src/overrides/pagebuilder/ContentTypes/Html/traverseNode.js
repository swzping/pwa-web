const traverseNode = node => {
    if (!node) return;

    const cls =
        node.attribs?.class
            ?.trim()
            ?.split(/\s+/)
            ?.filter(Boolean) || [];

    if (cls.includes('item-catalog-wrapper')) {
        node.attribs.class =
            cls.includes('hide') || cls.includes('web-hide') ? 'item-catalog-wrapper hide' : 'item-catalog-wrapper';
    }

    node.children?.forEach(traverseNode);
    return node;
};

export default traverseNode;
