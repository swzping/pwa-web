import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ContentTypeFactory from '@magento/pagebuilder/lib/factory';
import parseStorageHtml from '@magento/pagebuilder/lib/parseStorageHtml';
import { promoSection2SmallIcon } from './promoSection';
import { popUpAdsRow } from './popUpAds';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import { useHistory } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { GET_HEALTHCHECKS } from '../../modules/custom-modules/components/CustomAccountInformation/health.gpl';

import {couponCampaignVoucher} from './couponCampaign';
import { flashSale } from './flashSale'
import AccountInfo from '../../overrides/venia-ui/components/Header/components/AccountInfo/index.js';
const traverse = (node) => {
    if (!node) return
    if (node?.cssClasses?.includes('promo-section')) {
        promoSection2SmallIcon(node)
    }
    if (node?.cssClasses?.includes('homePage-ads-row')) {
        popUpAdsRow(node)
    }
    if (node?.cssClasses?.includes("coupon-content")) {
        couponCampaignVoucher(node)
    }
    if(node?.cssClasses?.includes('flash-sale-product')) {
        flashSale(node)
    }
    if(node?.cssClasses?.includes('health-check-service-app')) {
        return node.children = []
    }
    node?.children?.forEach(v => {
        traverse(v)
    })
};
/**
 * Page Builder component for rendering Page Builder master storage format in React
 *
 * @param data
 * @returns {*}
 * @constructor
 */
export default function PageBuilder({ html, classes }) {
    const location = useLocation();
    const data = useMemo(() => {
        const res = parseStorageHtml(html);
        traverse(res);
        return res;
    }, [html]);

    const [isHealthVis, setIsHealthVis] = useState(true)
    const history = useHistory();

    // TODO: 待删除，临时处理
    const isHomePage = useMemo(() => {
        if (html.length < 30000) {
            return false;
        }
        return location.pathname === '/' || location.pathname === '/home';
    }, [location.pathname, html]);

    return (
        <>
            { isHomePage && <AccountInfo type={'home'} onCallBack={() => {
                history.push({
                    pathname: '/my-account-information',
                    state: { tabId: 'myPoints' }
                });
            }}/> }
            {isHomePage && data.children.length > 1 && (
                <div className="floorWrapper">
                    {window.innerWidth >= 760 && isHealthVis && <div style={{ display: 'none' }} className="health">
                        <div style={{ display: 'flex' }}>
                            <svg
                                width="19"
                                height="18"
                                viewBox="0 0 19 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M9.42188 18C6.1875 18 3.23438 16.3125 1.61719 13.5C0 10.7227 0 7.3125 1.61719 4.5C3.23438 1.72266 6.1875 0 9.42188 0C12.6211 0 15.5742 1.72266 17.1914 4.5C18.8086 7.3125 18.8086 10.7227 17.1914 13.5C15.5742 16.3125 12.6211 18 9.42188 18ZM8.01562 11.8125C7.52344 11.8125 7.17188 12.1992 7.17188 12.6562C7.17188 13.1484 7.52344 13.5 8.01562 13.5H10.8281C11.2852 13.5 11.6719 13.1484 11.6719 12.6562C11.6719 12.1992 11.2852 11.8125 10.8281 11.8125H10.5469V8.71875C10.5469 8.26172 10.1602 7.875 9.70312 7.875H8.01562C7.52344 7.875 7.17188 8.26172 7.17188 8.71875C7.17188 9.21094 7.52344 9.5625 8.01562 9.5625H8.85938V11.8125H8.01562ZM9.42188 4.5C8.78906 4.5 8.29688 5.02734 8.29688 5.625C8.29688 6.25781 8.78906 6.75 9.42188 6.75C10.0195 6.75 10.5469 6.25781 10.5469 5.625C10.5469 5.02734 10.0195 4.5 9.42188 4.5Z"
                                    fill="white"
                                />
                            </svg>
                            <div
                                style={{
                                    marginLeft: 6,
                                    marginTop: -7
                                }}
                            >
                                <span>Your Laporan Kesahatan is ready!</span>
                                <Link
                                    style={{
                                        display: 'block',
                                        cursor: 'pointer'
                                    }}
                                    to={resourceUrl('/account-information')}
                                    onClick={() => {
                                        localStorage.setItem('accountTab', 2)
                                    }}
                                >
                                    Check it now
                                </Link>
                            </div>
                        </div>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                setIsHealthVis(false)
                            }}
                        >
                            <path
                                d="M11.1094 1.51172L6.89062 5.73047L11.0742 9.91406C11.4258 10.2305 11.4258 10.7578 11.0742 11.0742C10.7578 11.4258 10.2305 11.4258 9.91406 11.0742L5.69531 6.89062L1.51172 11.0742C1.19531 11.4258 0.667969 11.4258 0.351562 11.0742C0 10.7578 0 10.2305 0.351562 9.87891L4.53516 5.69531L0.351562 1.51172C0 1.19531 0 0.667969 0.351562 0.316406C0.667969 0 1.19531 0 1.54688 0.316406L5.73047 4.53516L9.91406 0.351562C10.2305 0 10.7578 0 11.1094 0.351562C11.4258 0.667969 11.4258 1.19531 11.1094 1.51172Z"
                                fill="white"
                            />
                        </svg>
                    </div>}
                    <div className={classes.root}>
                        <ContentTypeFactory data={data.children[0]} />
                    </div>
                    <div className={classes.root}>
                        <ContentTypeFactory data={data.children[1]} />
                    </div>
                </div>
            )}

            {data.children.slice(isHomePage ? 2 : 0).map((child, i) => (
                <div className={classes.root} key={i + (isHomePage ? 2 : 0)}>
                    <ContentTypeFactory data={child} />
                </div>
            ))}
        </>
    );
}
