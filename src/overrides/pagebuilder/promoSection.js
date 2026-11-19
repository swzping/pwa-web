function findNode(node, condition) {
  if (condition(node)) {
    return node;
  }

  for (let child of node.children || []) {
    const foundNode = findNode(child, condition);
    if (foundNode) {
      return foundNode;
    }
  }

  return null;
}

function findNodes(node, condition) {
  const results = [];
  function recurse(current) {
    if (condition(current)) {
      results.push(current);
    }
    current.children?.forEach(child => recurse(child));
  }
  recurse(node);
  return results;
}

export const promoSection2SmallIcon = currentNode => {
  try {
    const nodes = findNodes(
      currentNode,
      node => node.contentType === 'column' && node?.children?.length > 0,
    );
    currentNode.children = [
      {
        contentType: 'smallIcon',
        cssClasses: (currentNode.cssClasses || []).filter(
          className => className !== 'promo-section'
        ),
        items: nodes.map(node => {
          const desktopImageNode = findNode(
            node,
            childNode => childNode.contentType === 'image',
          )?.desktopImage;
          const mobileImageNode = findNode(
            node,
            childNode => childNode.contentType === 'image',
          )?.mobileImage;
          const link = findNode(
            node,
            childNode => childNode.contentType === 'image',
          )?.link;
          const textNode = findNode(
            node,
            childNode => childNode.contentType === 'text',
          );

          return {
            link,
            image: desktopImageNode?.src || mobileImageNode?.src,
            caption: textNode?.content
              ? String(textNode.content).replace(/<[^>]+>/g, '')
              : undefined,
          };
        }),
      },
    ];
  } catch (error) {}
};