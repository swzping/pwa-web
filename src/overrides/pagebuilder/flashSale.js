export const flashSale = currentNode => {
  try {
    currentNode.children = [
      {
        contentType: 'flashSale'
      },
    ];
  } catch (error) {}
};