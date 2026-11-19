import { useAppContext } from '@magento/peregrine/lib/context/app';

export const useAddModal = () => {
    const [{ drawer }, { closeDrawer }] = useAppContext();
    const isOpen = drawer === 'shippingInformation.add';

    return {
        handleClose: closeDrawer,
        isOpen
    };
};
