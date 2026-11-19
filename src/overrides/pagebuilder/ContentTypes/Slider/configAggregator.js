import { getAdvanced, getMediaQueries } from '@magento/pagebuilder/lib/utils';

export default node => {
    const autoplaySpeed = parseInt(node.getAttribute('data-autoplay-speed'));
    const mode = parseInt(node.getAttribute('data-responsive-layout'));
    
    return {
        minHeight: node.style.minHeight || 500,
        autoplay: node.getAttribute('data-autoplay') === 'true',
        fade: node.getAttribute('data-fade') === 'true',
        infinite: node.getAttribute('data-infinite-loop') === 'true',
        showArrows: node.getAttribute('data-show-arrows') === 'true',
        showDots: node.getAttribute('data-show-dots') === 'true',
        showSmallBanner: node.getAttribute('data-show-small-banner') === 'true',
        behavior: node.getAttribute('data-responsive-behavior'),

        ...(!isNaN(mode) && { mode }),
        ...(!isNaN(autoplaySpeed) && { autoplaySpeed }),
        ...getAdvanced(node),
        ...getMediaQueries(node)
    };
};
