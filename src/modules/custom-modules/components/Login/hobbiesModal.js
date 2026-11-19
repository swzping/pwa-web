import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classes from './hobbiesModal.module.css';
import { useHistory } from 'react-router-dom';
import DEFAULT_OPERATIONS from '../../../../overrides/peregrine/talons/SignIn/signIn.gql'
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import Button from '@magento/venia-ui/lib/components/Button';
import { ChevronLeft, Loader } from 'react-feather';
import { FormattedMessage, useIntl } from 'react-intl';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';



const SignUpInterestsModal = ({ open, categories, initialSelected = [], onConfirm, onSkip, onClose }) => {
    const history = useHistory();

    const [selected, setSelected] = useState(() => new Set(initialSelected));
    const [busy, setBusy] = useState(false);

    // reset when open toggles
    useEffect(() => {
        if (open) {

            const selectedOptions = initialSelected.reduce((prev, curr) => {
                curr.selectedOptions.map(subItem => `${curr.category}::${subItem}`)
                return prev.concat(curr.selectedOptions.map(subItem => `${curr.category}::${subItem}`));
            }, [])
            setSelected(new Set(selectedOptions));
        }
    }, [open, initialSelected]);

    const { data, loading, error } = useQuery(DEFAULT_OPERATIONS.getCustomerHobbies, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        skip: !open,
    });

    const customerHobbieOption = useMemo(() => data && data?.customerHobbies?.items?.length ? data?.customerHobbies?.items : (categories || []), [data]);


    const toggle = (key) => {
        setSelected(prev => {
            const s = new Set(prev);
            if (s.has(key)) s.delete(key);
            else s.add(key);
            return s;
        });
    };

    // 批量转换函数
    function convertStringsToCategoryArray(strings) {
        const categoryMap = new Map();

        strings.forEach(str => {
            const [category, option] = str.split('::');

            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }

            if (option && !categoryMap.get(category).includes(option)) {
                categoryMap.get(category).push(option);
            }
        });

        // 将Map转换为数组
        return Array.from(categoryMap, ([category, selectedOptions]) => ({
            category,
            selectedOptions
        }));
    }

    const handleConfirm = async () => {
        const selectHobbiesList = convertStringsToCategoryArray(selected)
        if (onConfirm) {
            setBusy(true)
            const isSuccess = await onConfirm(selectHobbiesList);
            setBusy(false)
            isSuccess && onClose && onClose();
        }
    };

    const handleSkip = () => {
        if (onSkip) {
            onSkip();
            return
        }
    };

    if (!open) return null;

    return (
        <div className={classes.overlay} role="dialog" aria-modal="true">
            <div className={classes.card}>
                <div className={classes.cardContent}>
                    <div className={classes.header}>
                        <div className={classes.title}>What Are You Into?</div>
                        <div className={classes.subTitle}>Tell us what you love for better recommendations.</div>
                    </div>

                    <div className={classes.body}>
                        {!customerHobbieOption?.length && loading ? (<LoadingIndicator className={classes.loadingIndicator}>
                            <FormattedMessage
                                id={'myAccountPersonallInfo.loadingText'}
                                defaultMessage={'loading...'}
                            />
                        </LoadingIndicator>)
                            : null}

                        {customerHobbieOption.map((cat, index) => (
                            <div
                                key={cat.category}
                                className={classes.section}
                                style={index === customerHobbieOption.length - 1 ? { marginBottom: 0 } : undefined}
                            >
                                <div className={classes.sectionTitle}>{cat.category}</div>
                                <div className={classes.pillsRow}>
                                    {(cat.options || []).map((it, idx) => {
                                        const key = `${cat.category}::${it}`;
                                        const isSel = selected.has(key);
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                aria-pressed={isSel}
                                                onClick={() => toggle(key)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        toggle(key);
                                                    }
                                                }}
                                                className={isSel ? classes.pillSelected : classes.pill}
                                            >
                                                {it}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={classes.footer}>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={busy}
                        className={classes.confirmButton}
                    >
                        {busy && <Loader size={14} color="#fff" />}
                        <FormattedMessage
                            id={'signIn.Confirm'}
                            defaultMessage="Confirm"
                        />
                    </Button>

                    <div
                        onClick={() => { handleSkip(); }}
                        role="button"
                        tabIndex={0}
                        className={classes.skip}
                    >
                        Skip for now
                    </div>
                </div>
            </div>
        </div>
    );
};

SignUpInterestsModal.propTypes = {
    open: PropTypes.bool,
    categories: PropTypes.array,
    initialSelected: PropTypes.array,
    onConfirm: PropTypes.func,
    onSkip: PropTypes.func,
    onClose: PropTypes.func
};

SignUpInterestsModal.defaultProps = {
    open: false,
    categories: [],
    initialSelected: []
};

export default SignUpInterestsModal;
