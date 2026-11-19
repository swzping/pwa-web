import { useCallback, useState, useEffect } from 'react';
import { useFieldApi } from 'informed';

import { formatDate } from '../../util/date';

export const useDatePicker = (props) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const dateFieldApi = useFieldApi(props.field);

    const handleDateChange = useCallback((date) => {
        setSelectedDate(date);
    }, [dateFieldApi, setSelectedDate]);

    useEffect(() => {
        dateFieldApi.setValue(selectedDate);
    }, [selectedDate]);

    return {
        handleDateChange,
        selectedDate,
    };
}