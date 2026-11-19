export const couponCampaignVoucher = currentNode => {
    try {
        currentNode.children = [
            {
                contentType: 'couponCampaign',
            },
        ];
    } catch (error) { }
};
