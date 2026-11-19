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

export const popUpAdsRow = currentNode => {
  try {
    const adsRows = findNodes(
      currentNode,
      node => node.contentType === 'row' && node.cssClasses?.includes('homePage-ads-row')
    );
    currentNode.children = [
        {
          contentType: 'popUp',
          items: adsRows.map(node => {
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
            
            return {
              link,
              image: desktopImageNode?.src || mobileImageNode?.src,
              mobileImage:mobileImageNode?.src || desktopImageNode?.src
            };
          }),
        },
      ];
  } catch (error) {
    return {
       link:'',
       image: '',
       mobileImage:''
    }
  }
};
