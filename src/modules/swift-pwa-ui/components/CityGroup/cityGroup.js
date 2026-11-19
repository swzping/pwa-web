
import React from 'react';
import { useIntl } from 'react-intl';
import { shape, string } from 'prop-types';

import { useStyle } from '@magento/venia-ui/lib/classify';
import { isRequired, withLabel } from '@magento/venia-ui/lib/util/formValidators';

import Field from '@magento/venia-ui/lib/components/Field';
import Postcode from '@magento/venia-ui/lib/components/Postcode';

import { useCityGroup } from '../../../peregrine/talons/CityGroup/useCityGroup';
import AutoComplete from '../AutoComplete';
import defaultClasses from './cityGroup.module.css';

/**
 * Form component for CityGroup that is seeded with backend data.
 *
 */
const CityGroup = props => {
    const { regionCodeField, initialValues } = props;

    const talonProps = useCityGroup({ regionCodeField, initialValues });
    const { loading, cityData, districtData, subDistrictData } = talonProps;

    const { formatMessage } = useIntl();
    const classes = useStyle(defaultClasses);

    const cityLabel = formatMessage({
        id: 'global.city2',
        defaultMessage: 'City'
    });

    return (
        <div className={classes.root}>
            <div className={classes.city}>
                <Field id="city" label={'City'}>
                    <AutoComplete
                        data={cityData}
                        disabled={loading}
                        field="city"
                        fieldConstraints={[
                            'district',
                            'subdistrict',
                            'postcode'
                        ]}
                        isOpen={false}
                        validate={withLabel(isRequired, 'City')}
                    />
                </Field>
            </div>
            <div className={classes.city}>
                <Field id="district" label={'District'}>
                    <AutoComplete
                        data={districtData}
                        disabled={loading}
                        field="district"
                        fieldConstraints={['subdistrict', 'postcode']}
                        isOpen={false}
                        validate={withLabel(isRequired, 'District')}
                    />
                </Field>
            </div>
            <div className={classes.city}>
                <Field id="subdistrict" label={'Subdistrict'}>
                    <AutoComplete
                        data={subDistrictData}
                        disabled={loading}
                        field="subdistrict"
                        fieldConstraints={['postcode']}
                        isOpen={false}
                        validate={withLabel(isRequired, 'Subdistrict')}
                    />
                </Field>
            </div>
            <div className={classes.postcode}>
                <Postcode
                    autoComplete="new-password"
                    disabled={loading}
                    validate={withLabel(isRequired, 'Postal Code')}
                />
            </div>
        </div>
    );
};

export default CityGroup;

CityGroup.defaultProps = {
    regionCodeField: 'region'
};

CityGroup.propTypes = {
    classes: shape({
        root: string
    }),
    regionCodeField: string
};
