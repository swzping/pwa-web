import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import { useToasts } from '@magento/peregrine';
import { useBrands } from '../../../peregrine/talons/Brands/useBrands';
import FeaturedBrands from '../../../swift-pwa-ui/components/HomePage/Brands';
import defaultClasses from './brands.module.css';

const Brands = props => {
    const { brands } = props;
    const classes = useStyle(defaultClasses);
    const [, { addToast }] = useToasts();

    const {
        brandsList,
        brandsLoading,
        startWith,
        setStartWith,
        availableChars,
        errors,
        storeConfigData
    } = useBrands({ brands });

    const brandsListError = deriveErrorMessage([errors.get('getBrandsQuery')]);

    const categorytUrlSuffix = storeConfigData && 
        storeConfigData.storeConfig &&
        storeConfigData.storeConfig.category_url_suffix;

    useEffect(() => {
        if (brandsListError) {
            addToast({
                type: 'error',
                message: brandsListError,
                dismissable: true,
                timeout: 10000
            });
        }
    }, [addToast, brandsListError]);

    if (brandsLoading) {
        return fullPageLoadingIndicator;
    }

    let brandListItems;
    let showAlphabet = true;

    if (brandsList && brandsList.length) {
        brandListItems = [];
        let currentChar = '';

        brandsList
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(item => {
                if (
                    showAlphabet &&
                    (!currentChar || currentChar !== item.name.toLowerCase()[0])
                ) {
                    currentChar = item.name.toLowerCase()[0];
                    brandListItems.push(
                        <div
                            className={classes.alphabetHeader}
                            key={`char` + item.attribute_id}
                        >
                            {currentChar}
                        </div>
                    );
                }

                const urlKey = (item.category_url || item.category_url !== null ) ? 
                    `${item.category_url}${categorytUrlSuffix}` :
                    `/brand/${item.name.replace(/[^\w]/g, '-').toLowerCase()}${categorytUrlSuffix}`;

                brandListItems.push(
                    <div key={item.attribute_id} className={classes.brandItem}>
                        <div className={classes.brandItemInfo}>
                            <Link className={classes.brandItemLink} to={urlKey}>
                                {item.name}
                            </Link>
                        </div>
                    </div>
                );
            });
    } else {
        brandListItems = (
            <div className={classes.brandError}>
                <FormattedMessage
                    id={'brand.NoBrandFound'}
                    defaultMessage={'No Brand Found'}
                />
            </div>
        );
    }

    const dictionaryOptions = 'abcdefghijklmnopqrstuvwxyz'
        .split('')
        .map(dictionaryOption => (
            <div
                key={dictionaryOption}
                onClick={() => {
                    if (availableChars.indexOf(dictionaryOption) !== -1) {
                        setStartWith(dictionaryOption);
                    }
                }}
                className={`${classes.dictOption} ${dictionaryOption ===
                    startWith && classes.selected} ${availableChars.indexOf(
                    dictionaryOption
                ) === -1 && classes.disabled}`}
            >
                {dictionaryOption.toUpperCase()}
            </div>
        ));

    return (
        <div className={classes.brandPageRoot}>
            <div className={classes.brandPageHeader}>
                <div className={classes.brandPageTitle}>
                    <strong>
                        <FormattedMessage
                            id={'brand.Brands'}
                            defaultMessage={'Brands'}
                        />
                    </strong>
                </div>
            </div>
            <div className="container mb-5">
                <FeaturedBrands isBrandPage={true} />
            </div>
            <div className={classes.dictList}>
                <div
                    key="all"
                    onClick={() => setStartWith('')}
                    className={`${classes.dictOption} ${!startWith &&
                        classes.selected}`}
                >{`All`}</div>
                {dictionaryOptions}
            </div>
            <div className={classes.brandListContent}>{brandListItems}</div>
        </div>
    );
};

export default Brands;
