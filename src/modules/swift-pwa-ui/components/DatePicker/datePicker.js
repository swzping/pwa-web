import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import TextInput from '@magento/venia-ui/lib/components/TextInput';

import 'react-datepicker/dist/react-datepicker.css';

import { useDatePicker } from '../../../peregrine/talons/DatePicker/useDatePicker';
import defaultClasses from './datePicker.module.css';

const datePicker = (props = {}) => {
    const { field = 'date', format = 'dd/MM/YYYY' } = props;
    const { handleDateChange, selectedDate } = useDatePicker({ field, format });

    const CustomInput = forwardRef(({ value, onClick }, ref) => (
        <div
            className={defaultClasses.datepicker_input}
            onClick={onClick}
            ref={ref}
        >
            {value}
        </div>
    ));

    return (
        <div className={defaultClasses.datepicker_container}>
            <DatePicker 
                dateFormat={format}
                customInput={<CustomInput />}
                onChange={handleDateChange}
                selected={selectedDate}
            />
            <TextInput field={field} />
        </div>
    );
}

export default datePicker;
