import React from 'react';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Dialog from '@magento/venia-ui/lib/components/Dialog';
import defaultClasses from './modalMedical.module.css';

const ModalMedical = props => {
    const {
        isOpen,
		setIsOpen,
		handleRegisterMedical,
    } = props;
    const { formatMessage } = useIntl();

	const history = useHistory();
    const classes = useStyle(defaultClasses);
	const [isChecked, setIsChecked] = React.useState(false);
	
	const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Dialog
            classes={defaultClasses}
            isForm={false}
            isOpen={isOpen}
            onCancel={handleClose}
			shouldShowButtons={false}
            title={formatMessage({
                id: 'terms.modal',
                defaultMessage: 'Syarat & Ketentuan'
            })}
        >
            <div className={classes.term}>
				<p>Saya mengetahui dan menyetujui dengan mengklik tombol terima ini, dengan ini saya memberikan persetujuan tegas saya kepada Guardian Indonesia
					dan/atau pemasok/pemroses/pengecer pihak ketiga lainnya yang telah dikontrak oleh Guardian Indonesia, untuk memperoleh, mengumpulkan, memproses,
					menganalisis, menyimpan, mengubah, memperbarui, menampilkan, mengumumkan, mentransfer, mengungkapkan, menghapus atau memusnahkan setiap dan
					seluruh informasi dan/atau Data Pribadi, secara elektronik atau dengan cara lain yang saya berikan, baik di dalam maupun di luar wilayah Republik Indonesia.
				</p>
			</div>
			<div className={classes.divCheck}>
				<input
					className={classes.checkedTerm}
					type="checkbox"
					name="terms"
					checked={isChecked}
					onChange={() => setIsChecked(!isChecked)}
				/>
				<span>Saya setuju</span>
			</div>
			<button
				className={classes.btnRegis}
				disabled={!isChecked}
				onClick={() => {
					handleRegisterMedical(),
					history.push('/medical-test/registersuccess'),
					setIsOpen(false);
				}}
				style={{margin: '0 auto'}}
			>
				<span>Daftar Check Kesehatan</span>
			</button>
        </Dialog>
    );
};

export default ModalMedical;
