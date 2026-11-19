import { getAdvanced, getBackgroundImages } from '@magento/pagebuilder/lib/utils';

export default node => {
    return {
        text: node.textContent,
        headingType: node.nodeName.toLowerCase(),
        viewAllTitle: node.getAttribute('data-view-all-title'),
        viewAllLink: node.getAttribute('data-view-all-url'),
        ...getBackgroundImages(node),
        ...getAdvanced(node),
    };
};
