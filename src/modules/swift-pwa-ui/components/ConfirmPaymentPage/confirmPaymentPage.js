import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Form } from 'informed';
import { useStyle } from '@magento/venia-ui/lib/classify';
import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import { StoreTitle } from '@magento/venia-ui/lib/components/Head';
import Button from '@magento/venia-ui/lib/components/Button';
import FormError from '@magento/venia-ui/lib/components/FormError';
import Field from '@magento/venia-ui/lib/components/Field';
import Select from '@magento/venia-ui/lib/components/Select';
import TextInput from '@magento/venia-ui/lib/components/TextInput';

import { useConfirmPaymentPage } from '../../../peregrine/talons/ConfirmPaymentPage/useConfirmPaymentPage';
import DatePicker from '../DatePicker';
import DropFile from '../DropFile';
import defaultClasses from './confirmPaymentPage.module.css';

const confirmPaymentPage = (props) => {
    const classes = useStyle(defaultClasses, props.classes);
    const { formatMessage } = useIntl();
    const { 
        formValidationSchema,
        handleDroppedFiles,
        handleSubmit, 
        loading,
        paymentBankList,
        errors 
    } = useConfirmPaymentPage();

    const pageTitle = formatMessage({
        id: 'confirmPaymentPage.title',
        defaultMessage: 'Confirm Payment'
    });
    const orderNumberLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:orderNumber', 
        defaultMessage: 'Order Number'
    });
    const paymentLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:bankName', 
        defaultMessage: 'Bank Name'
    });
    const accountNumberLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:bankAccountNumber', 
        defaultMessage: 'Your Bank Account Number'
    });
    const accountNameLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:bankAccountName', 
        defaultMessage: 'Your Bank Account Name'
    });
    const amountLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:amountTranfer', 
        defaultMessage: 'Amount Transfered'
    });
    const confirmationPaymentLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:button', 
        defaultMessage: 'Confirm Payment'
    });
    const dateLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:tranferDate', 
        defaultMessage: 'Transfer Date'
    });
    const fileLabel = formatMessage({ 
        id: 'confirmPaymentPage:form:labelFile', 
        defaultMessage: 'Upload Receipt Image'
    });

    const bankInput = useMemo(() => {
        return paymentBankList.length > 0
        ? (
            <Select
                field="payment"
                items={paymentBankList}
                style={{ textTransform: 'capitalize' }}
            />
        )
        : (<TextInput field="payment" />); 
    }, [paymentBankList]);

    if (loading) {
        return (
            <div className={classes.modal}>
                <LoadingIndicator>
                    {formatMessage({
                        id: 'confirmPaymentPage.submit',
                        defaultMessage: 'Process to Confirm Payment'
                    })}
                </LoadingIndicator>
            </div>
        );
    }

    return (
        <div>
            <StoreTitle>{pageTitle}</StoreTitle>
            <h1>{pageTitle}</h1>
            <div className={classes.container}>
                <FormError errors={Array.from(errors.values())} />
                <Form
                    className="col-12 col-md-6"
                    onSubmit={handleSubmit}
                    validationSchema={formValidationSchema}
                >
                    <Field id="order_number" label={orderNumberLabel}>
                        <TextInput field="order_number" />
                    </Field>
                    <Field id="payment" label={paymentLabel}>                                    
                        {bankInput}
                    </Field>
                    <Field id="account_number" label={accountNumberLabel}>                      
                        <TextInput field="account_number"/>
                    </Field>
                    <Field id="account_name" label={accountNameLabel}>
                        <TextInput field="account_name" />                       
                    </Field>
                    <Field id="amount" label={amountLabel}>                        
                        <TextInput field="amount" />
                    </Field>
                    <Field id="date" label={dateLabel}>                        
                        <DatePicker field="date" format="MMMM d, yyyy" />
                    </Field>
                    <Field id="file" label={fileLabel}>                        
                        <DropFile
                            acceptedFile=".jpg,.jpeg,.png,.pdf,.gif"
                            multiple={false}
                            onGetFileBase64={handleDroppedFiles}
                        />
                    </Field>
                    <div className={classes.action_container}>
                        <Button priority="high" type="submit">
                            {confirmationPaymentLabel}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}

export default confirmPaymentPage;
