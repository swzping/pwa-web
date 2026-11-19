import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { bool, func, shape, string } from 'prop-types';
import { Form } from 'informed';

import {
    displayStates,
    useShippingMethod
} from '@magento/peregrine/lib/talons/CheckoutPage/ShippingMethod/useShippingMethod';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Button from '@magento/venia-ui/lib/components/Button';
import FormError from '@magento/venia-ui/lib/components/FormError';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import CompletedView from '@magento/venia-ui/lib/components/CheckoutPage/ShippingMethod/completedView';
import ShippingRadios from './shippingRadios';
import UpdateModal from '@magento/venia-ui/lib/components/CheckoutPage/ShippingMethod/updateModal';
import defaultClasses from './shippingMethod.module.css';

const initializingContents = (
    <LoadingIndicator>
        <FormattedMessage
            id={'shippingMethod.loading'}
            defaultMessage={'Loading shipping methods...'}
        />
    </LoadingIndicator>
);

const ShippingMethod = props => {
    const { onSave, onSuccess, pageIsUpdating, setPageIsUpdating, selectedMethod, refetch } = props;

    const talonProps = useShippingMethod({
        onSave,
        onSuccess,
        setPageIsUpdating,
        refetch,
    });

    const {
        displayState,
        errors,
        handleCancelUpdate,
        handleSubmit,
        isLoading,
        isUpdateMode,
        selectedShippingMethod,
        shippingMethods,
        showUpdateMode,
        isLoadingMethod,
    } = talonProps;

    const classes = useStyle(defaultClasses, props.classes);

    const filterShippingMethods = selectedMethod === "home" ?
        shippingMethods.filter(method => method.method_code !== "pickup") :
        shippingMethods.filter(method => method.method_code === "pickup");

    React.useEffect(() => {
        refetch();
        const tampRadio = document.querySelectorAll('div[class*="radioRoot"] label input');
        if (tampRadio.length > 0) {
            if(tampRadio.length > 1) {
                tampRadio.forEach((radio) => {
                    if(selectedShippingMethod === radio.value) {
                        radio.click();
                    }
                })
            } else{
                tampRadio[0].click();
            }
        }
    }, [pageIsUpdating]);

    React.useEffect(() => {
        const tampRadio = document.querySelectorAll('div[class*="radioRoot"] label:first-child input');
        if (tampRadio.length > 0) {
            tampRadio[0].click();
        }
    }, [selectedMethod]);

    let contents;

    if (displayState === displayStates.DONE) {
        const updateFormInitialValues = {
            shipping_method: selectedShippingMethod.serializedValue
        };

        // contents = (
        //     <Fragment>
        //         <div className={classes.done}>
        //             <CompletedView
        //                 selectedShippingMethod={selectedShippingMethod}
        //                 showUpdateMode={showUpdateMode}
        //             />
        //         </div>
        //         <UpdateModal
        //             formErrors={Array.from(errors.values())}
        //             formInitialValues={updateFormInitialValues}
        //             handleCancel={handleCancelUpdate}
        //             handleSubmit={handleSubmit}
        //             isLoading={isLoading}
        //             isOpen={isUpdateMode}
        //             pageIsUpdating={pageIsUpdating}
        //             shippingMethods={shippingMethods}
        //         />
        //     </Fragment>
        // );
        contents = (
            <Fragment>
                <Form
                    className={classes.form}
                    initialValues={updateFormInitialValues}
                    // onSubmit={handleSubmit}
                    onChange={handleSubmit}
                >
                    <div className={classes.titleWrapper}>
                        <div className={classes.editingHeading}>
                            <FormattedMessage
                                id={'shippingMethod.heading'}
                                defaultMessage={'Shipping Method'}
                            />
                        </div>
                        {/* <Button
                            priority="normal"
                            type="submit"
                            className={classes.btn}
                            disabled={pageIsUpdating || isLoading}
                        >
                            <FormattedMessage
                                id={'shippingMethod.continueToNextStep1'}
                                defaultMessage={'Add Method'}
                            />
                        </Button> */}
                    </div>
                    <ShippingRadios
                        disabled={isLoadingMethod}
                        shippingMethods={filterShippingMethods}
                    />
                </Form>
            </Fragment>
        );
    } else {
        // We're either initializing or editing.
        let bodyContents = initializingContents;

        if (displayState === displayStates.EDITING && !pageIsUpdating) {
            const lowestCostShippingMethodSerializedValue = shippingMethods.length
                ? shippingMethods[0].serializedValue
                : '';
            const lowestCostShippingMethod = {
                shipping_method: lowestCostShippingMethodSerializedValue
            };
            contents = (
                <Form
                    className={classes.form}
                    // initialValues={lowestCostShippingMethod}
                    // onSubmit={handleSubmit}
                    onChange={handleSubmit}
                >
                    <div className={classes.titleWrapper}>
                        <div className={classes.editingHeading}>
                            <FormattedMessage
                                id={'shippingMethod.heading'}
                                defaultMessage={'Shipping Method'}
                            />
                        </div>
                        {/* <Button
                            priority="normal"
                            type="submit"
                            className={classes.btn}
                            disabled={pageIsUpdating || isLoading}
                        >
                            <FormattedMessage
                                id={'shippingMethod.continueToNextStep1'}
                                defaultMessage={'Add Method'}
                            />
                        </Button> */}
                    </div>
                    <ShippingRadios
                        disabled={isLoadingMethod}
                        shippingMethods={filterShippingMethods}
                    />
                </Form>
            );
        } else {
            contents = (
                <div className={classes.root}>
                    <FormError errors={Array.from(errors.values())} />
                    <FormattedMessage
                        id={'shippingMethod.loading'}
                        defaultMessage={'Loading shipping methods...'}
                    />
                </div>
            )
        }

        console.log(errors);

        // contents = (
        //     <div className={classes.root}>
        //         <FormError errors={Array.from(errors.values())} />
        //         {
        //             shippingMethods && shippingMethods.length ? (
        //                 <Form
        //                     className={classes.form}
        //                     // initialValues={lowestCostShippingMethod}
        //                     // onSubmit={handleSubmit}
        //                     onChange={handleSubmit}
        //                 >
        //                     <div className={classes.titleWrapper}>
        //                         <h3 className={classes.editingHeading}>
        //                             <FormattedMessage
        //                                 id={'shippingMethod.heading'}
        //                                 defaultMessage={'Shipping Method'}
        //                             />
        //                         </h3>
        //                         {/* <Button
        //                             priority="normal"
        //                             type="submit"
        //                             className={classes.btn}
        //                             disabled={pageIsUpdating || isLoading}
        //                         >
        //                             <FormattedMessage
        //                                 id={'shippingMethod.continueToNextStep1'}
        //                                 defaultMessage={'Add Method'}
        //                             />
        //                         </Button> */}
        //                     </div>
        //                     <ShippingRadios
        //                         disabled={isLoading}
        //                         shippingMethods={filterShippingMethods}
        //                     />
        //                 </Form>
        //             ) : (
        //                 <FormattedMessage
        //                     id={'shippingMethod.loading'}
        //                     defaultMessage={'Loading shipping methods...'}
        //                 />
        //             )
        //         }
        //     </div>
        // );
    }

    return <Fragment>{contents}</Fragment>;
};

ShippingMethod.propTypes = {
    classes: shape({
        done: string,
        editingHeading: string,
        form: string,
        formButtons: string,
        root: string
    }),
    onSave: func.isRequired,
    onSuccess: func.isRequired,
    pageIsUpdating: bool,
    setPageIsUpdating: func.isRequired
};

export default ShippingMethod;
