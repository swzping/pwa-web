import React, { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl, FormattedNumber } from 'react-intl';
import { arrayOf, bool, number, shape, string } from 'prop-types';
import { Form } from 'informed';
import { Info, Mail, Plus, Minus, ChevronDown, ChevronUp, ArrowUp, Share2, ChevronRight, Loader } from 'react-feather';
import {
    TwitterShareButton,
    FacebookShareButton,
    EmailShareButton,
    WhatsappShareButton
} from 'react-share';
import Rating from 'react-rating';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwipeCore, { Navigation } from 'swiper';
import { Tab, Tabs as TabWrapper, TabList, TabPanel } from 'react-tabs';
import { debounce } from 'lodash'

import Tabs from '@magento/pagebuilder/lib/ContentTypes/Tabs';
import TabItem from '@magento/pagebuilder/lib/ContentTypes/TabItem';
import GalleryItem from '@magento/venia-ui/lib/components/Gallery/item';
import ProductQuickviewDialog from '../../../../modules/swift-pwa-ui/components/ProductQuickviewDialog';
import { Accordion, Section } from '@magento/venia-ui/lib/components/Accordion';
import Price from '@magento/venia-ui/lib/components/Price';
import { useProductFullDetail } from '@magento/peregrine/lib/talons/ProductFullDetail/useProductFullDetail';
import { isProductConfigurable } from '@magento/peregrine/lib/util/isProductConfigurable';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { useGallery } from '@magento/peregrine/lib/talons/Gallery/useGallery';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import Breadcrumbs from '@magento/venia-ui/lib/components/Breadcrumbs';
import Carousel from '@magento/venia-ui/lib/components/ProductImageCarousel';
import FormError from '@magento/venia-ui/lib/components/FormError';
import Dialog from '@magento/venia-ui/lib/components/Dialog';
import AddToCart from '../../../../modules/swift-pwa-ui/components/Gallery/addToCart';
import RichContent from '@magento/venia-ui/lib/components/RichContent/richContent';
import { ProductOptionsShimmer } from '@magento/venia-ui/lib/components/ProductOptions';
import defaultClasses from './productFullDetail.module.css';
import ProductReview from '../../../../modules/swift-pwa-ui/components/ProductReview';
import ProductReviewDetail from '../../../../modules/swift-pwa-ui/components/ProductReviewDetail';
import {
    isCustomizableDropdown,
    isCustomizableRadio,
    isCustomizableCheckbox,
    isCustomizableMultiple,
    CustomizableDropdown,
    CustomizableRadio,
    CustomizableCheckbox,
    CustomizableMultiple
} from '../../../../modules/swift-pwa-ui/components/CustomizableOptions';
import LabelPromotion from '../../../../modules/swift-pwa-ui/components/Gallery/labelPromotion';
import 'swiper/swiper-bundle.min.css';
import 'swiper/swiper.min.css';
import Button from '@magento/venia-ui/lib/components/Button';
import BundleOption from '../../../../modules/swift-pwa-ui/components/BundleOption.js';
import { useProductNotifyMe } from '../../../../modules/peregrine/talons/ProductNotifyMe/useProductNotifyMe';
import { useToasts } from '@magento/peregrine';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useHistory } from 'react-router-dom';
import { trackSkuComponentView, trackProductShare } from '@/utils/track';
import { useAllowGuestCheckout } from '../../../../modules/peregrine/talons/AllowGuestCheckout/useAllowGuestCheckout';
import { productDetailTracking } from '../../../../lib/ThirdPartyTracking';
import { GET_ITEM_COUNT_QUERY } from '@magento/venia-ui/lib/components/Header/cartTrigger.gql';
import { useCartTrigger } from '../../../peregrine/talons/Header/useCartTrigger';
import FreeGift from '../../../../modules/swift-pwa-ui/components/FreeGift';
import ProductRecommend from '../../../../modules/swift-pwa-ui/components/ProductRecommend';
import { CountDown, CountdownDisplay } from './countDown'
import { getFlashSaleCountdown } from '../../../../modules/swift-pwa-ui/components/Gallery/addToCartModal.flashSale';
import { useLocalStorageListener } from '../../../../helpers/hooks'
import ProductBadges from '../../../../modules/swift-pwa-ui/components/Gallery/productBadges';
import { findPurchasableCartItemBySku } from '../../../../overrides/peregrine/talons/Gallery/cartItemMatching';
import DetailOptions from './detailOptions';
import useConfigurableDetailOptions from './useConfigurableDetailOptions';
import { isSelectedProductInCart } from './buyNow';
import { getPdpOffers } from './variantOffers';


SwipeCore.use([Navigation]);

const WishlistButton = React.lazy(() =>
    import('@magento/venia-ui/lib/components/Wishlist/AddToListButton')
);
const Options = React.lazy(() =>
    import('@magento/venia-ui/lib/components/ProductOptions')
);

// Correlate a GQL error message to a field. GQL could return a longer error
// string but it may contain contextual info such as product id. We can use
// parts of the string to check for which field to apply the error.
const ERROR_MESSAGE_TO_FIELD_MAPPING = {
    'The requested qty is not available': 'quantity',
    'Product that you are trying to add is not available.': 'quantity',
    "The product that was requested doesn't exist.": 'quantity'
};

// Field level error messages for rendering.
const ERROR_FIELD_TO_MESSAGE_MAPPING = {
    quantity: 'The requested quantity is not available.'
};

// Fetch the cart items so "Buy Now" can tell whether the current product
// has already been added to the cart. `uid` is required by the Apollo cache
// keyFields for CartItemInterface / product types.
const GET_CART_ITEMS_QUERY = gql`
    query getCartItemsForBuyNow($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            items {
                id
                uid
                product {
                    sku
                    uid
                }
                ... on ConfigurableCartItem {
                    configurable_options {
                        configurable_product_option_value_uid
                        value_uid
                        value_id
                    }
                }
            }
        }
    }
`;

const ProductFullDetail = props => {
    const currentSavaIsEnd = useLocalStorageListener('savaIsEnd')
    const [isPhone, setIsPhone] = useState(window.innerWidth < 1024);
    const {
        storeConfig,
        handleQuickviewClose,
        handleQuickviewOpen,
        isOpenQuickview,
        quickviewDataUrlKey,
    } = useGallery();

    const location = window.location.href;
    const [{ isSignedIn }] = useUserContext();
    const history = useHistory();
    const {
        product,
        productLink,
        disableDescription = false,
        disableRelatedProducts = false,
        initialSelectedOptionUids = product?.variant_preselected_options || [],
        urlKey
    } = props;
    const talonProps = useProductFullDetail({ product });

    const {
        breadcrumbCategoryId,
        errorMessage,
        currentSku,
        handleAddToCart,
        handleSelectionChange,
        isOutOfStock,
        isAddToCartDisabled,
        isSupportedProductType,
        mediaGalleryEntries,
        productDetails,
        wishlistButtonProps,
        handleDropdownChange,
        handleRadioChange,
        handleCheckboxChange,
        handleMultipleChange,
        selectedValue,
        selectedCheckbox,
        selectedRadio,
        selectedMultipleValue,
        isRequired,
        items,
        selectOptions,
        generateBundlePrice,
        addProductData,
        errorQtyMessage,
        dataCustomer,
    } = talonProps;
    const { formatMessage } = useIntl();

    const {
        productAlertNotifyResponse,
        errorProductAlertNotify,
        isDisableProductAlertNotify,
        handleSubmit
    } = useProductNotifyMe({
        item: product, view: 'pdp',
    });

    const {
        isAllowGuestCheckout,
        isLoadingAllowGuestCheckout,
    } = useAllowGuestCheckout();


    const {
        handleTriggerClick,
        handleLinkClick
    } = useCartTrigger({
        queries: {
            getItemCountQuery: GET_ITEM_COUNT_QUERY
        }
    });

    useEffect(() => {
        const timer = setInterval(() => {
            if (window?.QDTracker?.track) {
                trackSkuComponentView(props);
                clearInterval(timer);
            }
        }, 200);

        return () => clearInterval(timer);
    }, []);

    const handleProductNotify = () => {
        if (!isSignedIn) {
            history.push(`/sign-in?redirect=/${product.url_key}.html`);
        }
        else if (isSignedIn && dataCustomer && dataCustomer.customer && dataCustomer.customer.email) {
            handleSubmit(dataCustomer.customer)
        }
    }

    const handleRedirectSignIn = () => {
        history.push(`/sign-in?redirect=/${product.url_key}.html`)
    }

    const [{ cartId }] = useCartContext();
    const [, { addToast }] = useToasts();
    const { refetch: refetchCartItems } = useQuery(GET_CART_ITEMS_QUERY, {
        skip: !cartId,
        variables: { cartId },
        fetchPolicy: 'cache-and-network'
    });

    const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);

    // Buy Now 点击逻辑：
    // - 商品已在购物车中：保留现有逻辑，直接跳转结账
    // - 商品未加购：立即显示 spinner 并禁点，加购成功后再跳转结账
    //
    // 加购的选择状态由 DetailOptions（useConfigurableDetailOptions）的
    // selectedOptions 驱动，因此加购也必须使用同一套 selectedDetailOptionUids，
    // 避免 selected_options 为空——旧 talon 的 optionSelections 从未被更新。
    const handleBuyNow = async () => {
        // addProductsToCart 不接受 variant 子 sku（会报 PRODUCT_NOT_FOUND），
        // 必须用父级 sku + selected_options；购物车中的 configurable 条目
        // product.sku 同样为父级 sku，因此"已加购"判断也统一用父级 sku。
        const buyNowSku = product.sku;
        let isInCart = false;

        if (cartId) {
            try {
                const { data } = await refetchCartItems();
                const items = data?.cart?.items || [];
                isInCart = isSelectedProductInCart(
                    items,
                    buyNowSku,
                    selectedDetailOptionUids
                );
            } catch {
                // 购物车查询失败时按"未加购"处理，交由加购逻辑处理
            }
        }

        if (isInCart) {
            // 已加购：直接跳转结账
            handleLinkClick();
            return;
        }

        // 未加购：spinner + 禁点，加购完成后再跳转
        setIsBuyNowLoading(true);
        try {
            // 复用 useAddToCartButton 的默认数量逻辑：起购量优先于 1
            const minSaleQty = Number(product?.stock_item?.min_sale_qty);
            const quantity = minSaleQty > 1 ? minSaleQty : 1;
            const result = await handleAddToCart({
                quantity,
                sku: buyNowSku,
                selectedOptions: selectedDetailOptionUids
            });
            if (result?.success) {
                addToast({
                    type: 'info',
                    message:
                        result.successMessage ||
                        'Item added to cart successfully',
                    timeout: 3000
                });
                handleLinkClick();
            } else {
                addToast({
                    type: 'error',
                    message:
                        result?.errorMessage ||
                        'Could not add item to cart. Please try again.',
                    timeout: 3000
                });
            }
        } catch {
            // 加购异常：停留在当前页
            addToast({
                type: 'error',
                message: 'Could not add item to cart. Please try again.',
                timeout: 3000
            });
        } finally {
            setIsBuyNowLoading(false);
        }
    };

    const resizePhone = () => {
        window.onresize = function() {
            const width = window.innerWidth;
            const newIsPhone = width < 1024;
            if (isPhone !== newIsPhone) {
                setIsPhone(newIsPhone);
            }
        };
    };

    useEffect(() => {
        resizePhone();
    }, [isPhone]);

    useEffect(() => {
        if (productAlertNotifyResponse) {
            const elementNotify = document.getElementById("product-notify-wrapper");
            setTimeout(function() {
                elementNotify.style.display = "none"
            }, 3000);
        }
    }, [productAlertNotifyResponse]);

    const classes = useStyle(defaultClasses, props.classes);

    const options = isProductConfigurable(product) ? (
        <Suspense fallback={<ProductOptionsShimmer />}>
            <Options
                onSelectionChange={handleSelectionChange}
                options={product.configurable_options}
            />
        </Suspense>
    ) : null;

    const {
        displayDetails,
        groups: detailOptionGroups,
        handleOptionSelect: handleDetailOptionSelect,
        hasOptions: hasProductDetailOptions,
        isCartActionDisabled: isPdpCartActionDisabled,
        isSelectedVariantOutOfStock,
        selectedVariant,
        selectedOptions: selectedDetailOptions,
        selectedOptionUids: selectedDetailOptionUids
    } = useConfigurableDetailOptions({
        isAddToCartDisabled,
        initialSelectedOptionUids,
        mediaGalleryEntries,
        product,
        productDetails
    });
    const currentStockStatus = isSelectedVariantOutOfStock ? 'OUT_OF_STOCK' : productDetails.stockStatus;
    const [flashSaleNow, setFlashSaleNow] = useState(Date.now);
    useEffect(() => {
        if (selectedVariant?.is_flash_sale !== 1) return;
        setFlashSaleNow(Date.now());
        const timer = setInterval(() => setFlashSaleNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [selectedVariant]);
    const variantFlashSaleCountdown = getFlashSaleCountdown(selectedVariant, flashSaleNow);

    const productDetailOptions = hasProductDetailOptions ? (
        <DetailOptions
            classes={classes}
            product={product}
            groups={detailOptionGroups}
            onSelect={handleDetailOptionSelect}
            selectedOptions={selectedDetailOptions}
        />
    ) : null;
    const productOffers = getPdpOffers(productDetails, selectedVariant);

    // Customizable Options
    const customizableOptions =
        product.options && product.options.length > 0 ? (
            <Suspense fallback={<ProductOptionsShimmer />}>
                {isCustomizableDropdown(product) ? (
                    <CustomizableDropdown
                        options={product.options}
                        isRequired={isRequired}
                        handleChange={handleDropdownChange}
                        selectedValue={selectedValue}
                    />
                ) : null}
                {isCustomizableRadio(product) ? (
                    <CustomizableRadio
                        options={product.options}
                        isRequired={isRequired}
                        selectedValue={selectedRadio}
                        handleChange={handleRadioChange}
                    />
                ) : null}
                {isCustomizableCheckbox(product) ? (
                    <CustomizableCheckbox
                        options={product.options}
                        isRequired={isRequired}
                        selectedValue={selectedCheckbox}
                        handleChange={handleCheckboxChange}
                    />
                ) : null}
                {isCustomizableMultiple(product) ? (
                    <CustomizableMultiple
                        options={product.options}
                        isRequired={isRequired}
                        handleChange={handleMultipleChange}
                        selectedValue={selectedMultipleValue}
                    />
                ) : null}
            </Suspense>
        ) : null;

    // Bundle Options
    const bundleOptions =
        product.__typename === 'BundleProduct' ? (
            <BundleOption items={items} selectOptions={selectOptions} />
        ) : null;

    const breadcrumbs = breadcrumbCategoryId ? (
        <Breadcrumbs
            categoryId={breadcrumbCategoryId}
            currentProduct={productDetails.name}
        />
    ) : null;

    // quick view modal
    const maybeQuickviewDialog = useMemo(() => {
        if (isOpenQuickview) {
            return (
                <ProductQuickviewDialog
                    storeConfig={storeConfig}
                    urlKey={quickviewDataUrlKey}
                    onClose={handleQuickviewClose}
                />
            );
        }

        return null;
    }, [
        isOpenQuickview,
        quickviewDataUrlKey,
        handleQuickviewClose,
    ]);

    // Fill a map with field/section -> error.
    const errors = new Map();
    if (errorMessage) {
        Object.keys(ERROR_MESSAGE_TO_FIELD_MAPPING).forEach(key => {
            if (errorMessage.includes(key)) {
                const target = ERROR_MESSAGE_TO_FIELD_MAPPING[key];
                const message = ERROR_FIELD_TO_MESSAGE_MAPPING[target];
                errors.set(target, message);
            }
        });

        // Handle cases where a user token is invalid or expired. Preferably
        // this would be handled elsewhere with an error code and not a string.
        if (errorMessage.includes('The current user cannot')) {
            errors.set('form', [
                new Error(
                    formatMessage({
                        id: 'productFullDetail.errorToken',
                        defaultMessage:
                            'There was a problem with your cart. Please sign in again and try adding the item once more.'
                    })
                )
            ]);
        }

        // Handle cases where a cart wasn't created properly.
        if (
            errorMessage.includes('Variable "$cartId" got invalid value null')
        ) {
            errors.set('form', [
                new Error(
                    formatMessage({
                        id: 'productFullDetail.errorCart',
                        defaultMessage:
                            'There was a problem with your cart. Please refresh the page and try adding the item once more.'
                    })
                )
            ]);
        }

        // An unknown error should still present a readable message.
        if (!errors.size) {
            errors.set('form', [
                new Error(
                    formatMessage({
                        id: 'productFullDetail.errorUnknown',
                        defaultMessage:
                            'Could not add item to cart. Please check required options and try again.'
                    })
                )
            ]);
        }
    }

    const isBuyNowFlashSale = hasProductDetailOptions
        ? !!variantFlashSaleCountdown
        : product?.is_flash_sale === 1 && !currentSavaIsEnd;
    const cartCallToActionText = currentStockStatus !== "OUT_OF_STOCK" ? (
        isBuyNowFlashSale ? <FormattedMessage
            id="productFullDetail.addFlashItemToCart"
            defaultMessage="Flash Buy Now"
        /> : <FormattedMessage
            id="productFullDetail.addItemToCart"
            defaultMessage="Buy Now"
        />
    ) : (
        <FormattedMessage
            id= "addToCartButton.notifyMe"
            defaultMessage= "Notify Me"
        />
    );

    const cartActionContent = isSupportedProductType ? (
        <div className={classes.cartAction}>
            <Button
                disabled={isPdpCartActionDisabled || isLoadingAllowGuestCheckout || isBuyNowLoading}
                onClick={
                    productDetails.stockStatus !== "OUT_OF_STOCK"
                        ? ((!isSignedIn && !isAllowGuestCheckout) ? handleRedirectSignIn : handleBuyNow)
                        : handleProductNotify
                }
                className={currentStockStatus !== "OUT_OF_STOCK" ? classes.btn2 : classes.btnNotify}
            >
                    {isBuyNowLoading && <Loader size={14} color="#fff" />}
                    {cartCallToActionText}
            </Button>
        </div>
    ) : (
        <div className={classes.unavailableContainer}>
            <Info />
            <p>
                <FormattedMessage
                    id={'productFullDetail.unavailableProduct'}
                    defaultMessage={
                        'This product is currently unavailable for purchase.'
                    }
                />
            </p>
        </div>
    );

    // app parity — the brand line above the title links to the
    // brand's category page (brand_info.category_url); falls
    // back to the plain brand attribute when no category url
    const brandInfo = product?.brand_info;
    const brandHref = brandInfo?.category_url
        ? resourceUrl(
              `/${brandInfo.category_url.replace(/\.html$/, '').replace(/^\//, '')}.html`
          )
        : null;
    const brandNode = brandInfo?.name && brandHref ? (
        <span style={{fontSize: '12px', fontWeight: 'bold'}}>{'by '}
        <Link className={classes.brandBy} to={brandHref}>
            <span className={classes.brandByName}>{brandInfo.name}</span>
        </Link>
        </span>
    ) : productDetails.brand ? (
        <span className={classes.brandName}>{productDetails.brand}</span>
    ) : null;

    const productName = productLink ? (
        <div className={classes.wrapperName}>
            <Link to={productLink}>
                {brandNode}
                <h1 className={classes.productName}>{productDetails.name}</h1>
            </Link>
        </div>
    ) : (
        <div className={classes.wrapperName}>
            {brandNode}
            <h1 className={classes.productName}>{productDetails.name}</h1>
        </div>
    );

    const [activeTab, setActiveTab] = useState(0);
    const tabHeader = ['Description', 'How to Use', 'Reviews'].map((v, i) => {
        return (
            <Tab
                className={[classes.tab, i == activeTab ? classes.activeTab : '']}
                key={i}
                onClick={() => setActiveTab(i)}
            >
                {v}
            </Tab>
        )
    })

    const ShowMoreWrapper = props => {
        const richRef = useRef()
        const [height, setHeight] = useState(0)

        const [isShowMore, setIsShowMore] = useState(false);
        const richSectionClass = isShowMore ? classes.richSectionShowmore : classes.richSection

        useEffect(() => {
            if (richRef.current) {
                setHeight(richRef.current.offsetHeight)
            }
        }, []);

        return ( <div>
            <section className={richSectionClass}>
                <div ref={richRef} className={classes.richContent}>
                    {props.html ? (
                        <RichContent
                            html={props.html}
                        />
                    ) : (
                        <p>No product description</p>
                    )}
                </div>
            </section>
            {height > 132 ? <div className={`${classes.moreBtn}`} onClick={() => setIsShowMore(!isShowMore)}>
                {isShowMore ? 'Show Less' : 'Show More'}
                {isShowMore ? <ChevronUp size="16"/> : <ChevronDown size="16"/>}
            </div> : <></>}
        </div>)
    }

    const [isOpen , setIsOpen] = useState(false)

    const maybeProductDescription = !disableDescription ? (
        <>
            {/* {isPhone && ( */}
                <div className={`${classes.accordion}`}>
                    <TabWrapper>
                        <TabList className={`${classes.tabList}`}>
                            {tabHeader}
                        </TabList>
                        <TabPanel>
                            <ShowMoreWrapper html={productDetails.description}></ShowMoreWrapper>
                        </TabPanel>
                        <TabPanel>
                            <ShowMoreWrapper html={productDetails.howToUse}></ShowMoreWrapper>
                        </TabPanel>
                        <TabPanel>
                            <ProductReviewDetail
                                isOpen={isOpen}
                                onBack={() => setIsOpen(false)}
                                productDetails={productDetails}
                            >
                            </ProductReviewDetail>
                            <ProductReview
                                sku={productDetails.sku}
                                id={productDetails.id}
                                productName={productDetails.name}
                                seemore = {
                                    isPhone ? <div className={`${classes.seemore}`} onClick={() => setIsOpen(true)}>
                                        <div>
                                            See More <ChevronRight size="14"/>
                                        </div>
                                    </div> : null
                                }
                            />
                        </TabPanel>
                    </TabWrapper>
                    {/* <Accordion canOpenMultiple={true}>
                        <Section
                            iconOpen={Plus}
                            iconClose={Minus}
                            classNames={classes.iconSection}
                            iconSize={12}
                            id={'descriptions'}
                            title={formatMessage({
                                id: 'pdp.desc',
                                defaultMessage: 'Description'
                            })}
                        >
                            <div style={{ margin: '1rem 1.5rem' }}>
                                {productDetails.description ? (
                                    <RichContent
                                        html={productDetails.description}
                                    />
                                ) : (
                                    <p>No product description</p>
                                )}
                            </div>
                        </Section>

                        <Section
                            id={'use'}
                            iconOpen={Plus}
                            iconClose={Minus}
                            classNames={classes.iconSection}
                            iconSize={12}
                            title={formatMessage({
                                id: 'pdp.use',
                                defaultMessage: 'How to Use'
                            })}
                        >
                            <div style={{ margin: '1rem 1.5rem' }}>
                                {productDetails.howToUse ? (
                                    <RichContent
                                        html={productDetails.howToUse}
                                    />
                                ) : (
                                    <p>Not found how to use</p>
                                )}
                            </div>
                        </Section>

                        <Section
                            id={'reviews'}
                            iconOpen={Plus}
                            iconClose={Minus}
                            iconSize={12}
                            classNames={classes.iconSection}
                            title={formatMessage({
                                id: 'pdp.reviews',
                                defaultMessage: 'Reviews'
                            })}
                        >
                            <ProductReview
                                sku={productDetails.sku}
                                id={productDetails.id}
                                productName={productDetails.name}
                            />
                        </Section>
                    </Accordion> */}
                </div>
            {/* )} */}

            {/* <section className={classes.description}>
                <Tabs headers={['Description', 'How to Use', 'Reviews']}>
                    <TabItem
                        cssClasses={[classes.tabItem]}
                        tabName="Description"
                    >
                        <section>
                            {productDetails.description ? (
                                <RichContent
                                    html={productDetails.description}
                                />
                            ) : (
                                <p>No product description</p>
                            )}
                        </section>
                    </TabItem>

                    <TabItem
                        cssClasses={[classes.tabItem]}
                        tabName="How to Use"
                    >
                        <section>
                            {productDetails.howToUse ? (
                                <RichContent html={productDetails.howToUse} />
                            ) : (
                                <p>Not found how to use</p>
                            )}
                        </section>
                    </TabItem>

                    <TabItem cssClasses={[classes.tabItem]} tabName="Reviews">
                        <ProductReview
                            sku={productDetails.sku}
                            id={productDetails.id}
                            productName={productDetails.name}
                        />
                    </TabItem>
                </Tabs>
            </section> */}
        </>
    ) : null;

    const [isMaxQty, setIsMaxQty] = useState(false);

    useEffect(() => {
        if (productDetails) {
            productDetailTracking(productDetails);
        }
        return () => {
            localStorage.setItem('detailsPageReloaded', '')
        }
    }, []);

    const TopJumper = () => {
        const [show, switchShow] = useState(false);

        useEffect(()=>{
            const listener = debounce(() => {
                switchShow(window.scrollY > 200)
            });
            document.addEventListener('scroll', listener);
            return () => document.removeEventListener('scroll', listener);
        }, [show])

        return show ? (
            <div className={classes.topJumper} onClick={()=>window.scrollTo(0, 0)}>
                <ArrowUp></ArrowUp>
            </div>) : null;
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: productDetails.name,
                text: productDetails.name,
                url: window.location.href,
            })
            .then(() => {
                console.log('分享成功')
            })
            .catch((error) => console.log('分享失败:', error))
            .finally(() => trackProductShare(productDetails));
        } else {
            console.log('当前浏览器不支持 Web Share API');
            trackProductShare(productDetails)
        }
    }
    return (
        <div className={classes.wrapper}>
            { !localStorage.getItem('detailsPageReloaded') && currentSavaIsEnd && product?.is_flash_sale === 1 && <div className={classes.mask}>
                <div className={classes.maskContent}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#212121' }}>Flash sales have ended</span>
                    <p className={classes.maskContentText}>Current flash sales items will return to their original prices！</p>
                    <div className={classes.sureBtn} onClick={() => {
                        window.location.reload()
                        localStorage.setItem('detailsPageReloaded', true)
                    }}>OK</div>
                </div>
            </div>}
            <TopJumper></TopJumper>
            {!isPhone ? breadcrumbs : null}
            {
                productAlertNotifyResponse &&  (
                    <div className={`${classes.productNotify}`} id="product-notify-wrapper">
                        <img className={classes.productNotifyImage} src="/venia-static-assets/images/check-circle.png" />
                        <p className={classes.productNotifyText}>{productAlertNotifyResponse && productAlertNotifyResponse.message}</p>
                    </div>
                )
            }
            <div
                className={classes.root}
            >
                <section className={classes.imageCarousel}>
                    <Carousel
                        currentStockStatus={currentStockStatus}
                        productDetails={product}
                        isFlashSaleActive={hasProductDetailOptions ? !!variantFlashSaleCountdown : undefined}
                        images={displayDetails.mediaGalleryEntries}
                    />
                    {productDetails.sale && (
                        <div className={classes.labelPromoWrapper}>
                            <LabelPromotion label={productDetails.sale} />
                        </div>
                    )}
                    {productDetails.promo && (
                        <div className={classes.labelPromoWrapper2}>
                            <span>{productDetails.promo}</span>
                        </div>
                    )}
                </section>
                <div className={classes.productInfo}>
                <FormError
                    classes={{
                        root: classes.formErrors
                    }}
                    errors={errors.get('form') || []}
                />
                <section className={classes.title}>
                    {hasProductDetailOptions ? (
                        variantFlashSaleCountdown ? <CountdownDisplay countdown={variantFlashSaleCountdown} /> : null
                    ) : (
                        product?.is_flash_sale === 1 && !currentSavaIsEnd ?
                            <CountDown specialFromDate={product?.special_from_date} specialToDate={product?.special_to_date} /> : null
                    )}
                    {productName}
                </section>
                <section className={classes.options}>
                    {productDetailOptions ? null : options}
                    {customizableOptions}
                    {bundleOptions}
                </section>
                <section className={`${classes.quantity}`}>
                    {product.__typename === 'BundleProduct' ? (
                        <div>
                            <p className="mb-0 text-uppercase">from</p>
                            <p className={classes.productPrice}>
                                <Price
                                    currencyCode={productDetails.price.currency}
                                    value={
                                        productDetails.priceRange.minimum_price
                                            .final_price.value
                                    }
                                />
                            </p>
                            <p className="mb-0 text-uppercase">to</p>
                            <p className={classes.productPrice}>
                                <Price
                                    currencyCode={productDetails.price.currency}
                                    value={
                                        productDetails.priceRange.maximum_price
                                            .final_price.value
                                    }
                                />
                            </p>
                            <div className={classes.bundlePriceWrapper}>
                                <p className={classes.bundlePriceTitle}>
                                    Your Customization
                                </p>
                                <div className={classes.bundlePriceValue}>
                                    {generateBundlePrice(items)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={classes.discountPriceWrapper}>
                            <div className={classes.priceWrapper}>
                                <p className={classes.productPrice}>
                                    {displayDetails.finalPriceValue && !currentSavaIsEnd ? (
                                            <Price
                                                currencyCode={
                                                    displayDetails.priceCurrency
                                                }
                                                value={displayDetails.finalPriceValue}
                                            />
                                        ) : (
                                            <Price
                                                currencyCode={
                                                    displayDetails.priceCurrency
                                                }
                                                value={displayDetails.regularPriceValue}
                                            />
                                        )}
                                </p>
                            </div>
                            {
                                displayDetails.finalPriceValue &&
                                displayDetails.discountPercent &&
                                !currentSavaIsEnd
                            ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ marginRight: '4px' }}>
                                        <span className={classes.priceDiscount}>
                                            <Price
                                                currencyCode={
                                                    displayDetails.priceCurrency
                                                }
                                                value={
                                                    displayDetails.regularPriceValue
                                                }
                                            />
                                        </span>
                                    </div>
                                    <div>
                                        <span className={classes.discount}>
                                            <FormattedNumber
                                                maximumFractionDigits={0}
                                                value={displayDetails.discountPercent}
                                            />
                                            % OFF
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* <div class={classes.statusStoks}>
                        {productDetails.stockStatus === 'OUT_OF_STOCK' ? (
                            <div><span>Habis Terjual</span></div>
                        ) : (
                            <div><span>Stok Tersedia</span></div>
                        )}
                    </div> */}
                </section>
                {/* app parity — compliance badges above the rating row */}
                {(product?.halal_indicator || product?.bpom_number) && (
                    <div className={classes.complianceRow}>
                        {product?.halal_indicator && (
                            <div className={classes.complianceItem}>
                                <img alt="" className={classes.complianceIcon} src="/venia-static-assets/images/safeguard.svg" />
                                <span>Halal Certified</span>
                            </div>
                        )}
                        {product?.bpom_number && (
                            <div className={classes.complianceItem}>
                                <img alt="" className={classes.complianceIcon} src="/venia-static-assets/images/safeguard.svg" />
                                <span>No. Izin Edar : {product.bpom_number}</span>
                            </div>
                        )}
                    </div>
                )}
                {product?.allergens && (
                    <div className={classes.complianceRow}>
                        <div className={classes.complianceItem}>
                            <img alt="" className={classes.complianceIcon} src="/venia-static-assets/images/warningTriangle.svg" />
                            <span>{product.allergens}</span>
                        </div>
                    </div>
                )}
                <section className={classes.infoTitle}>
                    <div className={classes.productOfferDetails}>
                        <ProductBadges badges={productOffers} isDetails />
                    </div>
                    <div className={classes.infoTitleWrapper}>
                        {/* <div class={classes.productSKU}
                            style={{
                                marginRight: '1.2rem'
                            }}
                        >
                            <p>SKU #{productDetails.sku}</p>
                        </div> */}
                        <div className={classes.infoReview}>
                            <Rating
                                readonly
                                emptySymbol={
                                    <i
                                        className="fa fa-star"
                                        style={{
                                            color: '#D6D6D6',
                                            width: '12px',
                                            fontSize: '14px'
                                        }}
                                    />
                                }
                                fullSymbol={
                                    <i
                                        className="fa fa-star"
                                        style={{
                                            color: '#F7BF09',
                                            width: '12px',
                                            fontSize: '14px'
                                        }}
                                    />
                                }
                                initialRating={
                                    productDetails.rating > 0 &&
                                    productDetails.rating
                                        ? productDetails.rating / 20
                                        : 0
                                }
                            />
                            <p className={classes.reviewRate}>
                                {productDetails.rating > 0 && productDetails.rating ? productDetails.rating / 20 : 0}
                            </p>
                            <p className={classes.reviewLabel}>
                                {productDetails.reviews || 0} REVIEWS
                            </p>
                        </div>
                    </div>
                </section>
                {productDetailOptions}
                <section className={`${classes.quantity}`}>
                    {!isPhone ? (
                        <div className={classes.quantityWrapper}>
                            {/* <div
                                style={{
                                    marginTop: '0.5rem',
                                }}
                            >
                                <span className={productDetails.stockStatus !== "OUT_OF_STOCK" ? classes.quantityTitle : classes.oosTtile}>
                                    {
                                        productDetails.stockStatus !== "OUT_OF_STOCK"
                                            ? (
                                                <FormattedMessage
                                                    id={'global.quantity'}
                                                    defaultMessage={'Quantity'}
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    id={'global.outOfStock'}
                                                    defaultMessage={'Out of Stock'}
                                                />
                                            )
                                    }
                                </span>
                            </div> */}
                            <div
                                className={classes.btnWrapper}
                            >
                                {
                                    currentStockStatus !== "OUT_OF_STOCK" && (
                                        <div className={classes.addToCart}>
                                            <AddToCart
                                                productData={product}
                                                productLink={productLink}
                                                isSelectionDisabled={isPdpCartActionDisabled}
                                                selectedOptions={selectedDetailOptionUids}
                                            />
                                        </div>
                                    )
                                }
                                {cartActionContent}
                                {/* <Suspense fallback={null}>
                                    <WishlistButton {...wishlistButtonProps} />
                                </Suspense> */}
                            </div>
                        </div>
                    ) : (
                        <div className="hidden-md">
                            <nav className={
                                currentStockStatus !== "OUT_OF_STOCK"
                                ? 'navbar gap-3 fixed-bottom navbar-light bg-light shadow'
                                : 'notify-bottom gap-3 navbar fixed-bottom navbar-light bg-light shadow'
                            }
                            style={{ padding: '1.2rem' }}
                            >
                                {
                                    currentStockStatus !== "OUT_OF_STOCK" && (
                                        <div className={classes.addToCart}>
                                            <AddToCart
                                                productData={product}
                                                productLink={productLink}
                                                isSelectionDisabled={isPdpCartActionDisabled}
                                                selectedOptions={selectedDetailOptionUids}
                                            />
                                        </div>
                                    )
                                }
                                {cartActionContent}
                            </nav>
                        </div>
                    )}

                    {addProductData && errorQtyMessage && (
                        <div className={classes.errorQty}>
                            <span className={classes.errorQtyText}>
                                {errorQtyMessage}
                            </span>
                        </div>
                    )}

                    {isMaxQty && (
                        <div className={classes.errorQtyCustom}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0
                                    0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905
                                    0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                                />
                            </svg>
                            <span className={classes.errorQtyCustomText}>
                                Max quantity allowed of product add to cart is {product.stock_item.max_sale_qty}
                            </span>
                        </div>
                    )}
                </section>

                </div>
                <section className={classes.quantity2}>
                    <div className={classes.quantity2Top}>
                        <div className={classes.whistlistMobile}>
                            <Suspense fallback={null}>
                                <WishlistButton {...wishlistButtonProps} />
                            </Suspense>
                        </div>
                        <div className={classes.share} onClick={handleShare}>
                            <Share2 size="16"></Share2>
                        </div>
                    </div>
                </section>
                {product?.is_gwp ? <FreeGift product={product} /> : null}

            </div>

            {maybeProductDescription}

            {!disableRelatedProducts &&
                productDetails.relatedProducts &&
                productDetails.relatedProducts.length > 0 && (
                    <section className={`${classes.swiper} container`}>
                        <center>
                            <h2>You May Also Like</h2>
                        </center>
                        <Swiper
                            slidesPerView={2}
                            spaceBetween={10}
                            freeMode
                            navigation={isPhone ? false : true}
                            breakpoints={{
                                '360': {
                                    slidesPerView: 2,
                                    spaceBetween: 10
                                },
                                '480': {
                                    slidesPerView: 3,
                                    spaceBetween: 15
                                },
                                '1024': {
                                    slidesPerView: 5,
                                    spaceBetween: 15
                                }
                            }}
                        >
                            {productDetails.relatedProducts.map(
                                (item, index) => (
                                    <SwiperSlide key={index}>
                                        <GalleryItem
                                            key={item.id}
                                            item={item}
                                            storeConfig={storeConfig}
                                            onClickQuickviewAction={handleQuickviewOpen}
                                        />
                                    </SwiperSlide>
                                )
                            )}
                        </Swiper>
                        {maybeQuickviewDialog}
                    </section>
                )}

            {!disableRelatedProducts ? <ProductRecommend urlKey={urlKey} /> : null}
        </div>
    );
};

ProductFullDetail.propTypes = {
    classes: shape({
        cartActions: string,
        description: string,
        descriptionTitle: string,
        details: string,
        detailsTitle: string,
        imageCarousel: string,
        options: string,
        productName: string,
        productPrice: string,
        quantity: string,
        quantityTitle: string,
        root: string,
        title: string,
        unavailableContainer: string
    }),
    product: shape({
        __typename: string,
        id: number,
        stock_status: string,
        sku: string.isRequired,
        price: shape({
            regularPrice: shape({
                amount: shape({
                    currency: string.isRequired,
                    value: number.isRequired
                })
            }).isRequired
        }).isRequired,
        media_gallery_entries: arrayOf(
            shape({
                uid: string,
                label: string,
                position: number,
                disabled: bool,
                file: string.isRequired
            })
        ),
        description: string
    }).isRequired
};

export default ProductFullDetail;
