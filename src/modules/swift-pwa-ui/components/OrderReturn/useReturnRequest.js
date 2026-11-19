import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import { ensureOAuthAccessFresh } from '../../../../lib/customerSessionToken';
import { GET_RETURN_OPTIONS, REQUEST_RETURN } from './orderReturn.gql';
import { buildReturnInput, getAllowedReasons, getAllowedSolutions, getReturnQuantity, validateEvidence, validateUpload, resolveReturnItems, validateMediaCounts } from './returnRules';

const storage = new BrowserPersistence();

export const useReturnRequest = ({ order, selectedItemIds, isViewMode }) => {
    const [solutionValue, setSolutionValue] = useState('');
    const [reasonValue, setReasonValue] = useState('');
    const [otherText, setOtherText] = useState('');
    const [notes, setNotes] = useState('');
    const [quantities, setQuantities] = useState({});
    const [uploadedMedia, setUploadedMedia] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [requestError, setRequestError] = useState('');
    const [submittedReturn, setSubmittedReturn] = useState(null);
    const busy = useRef(false);
    const previews = useRef(new Set());
    const { data, loading: optionsLoading, error: optionsError } = useQuery(GET_RETURN_OPTIONS, {
        skip: isViewMode, fetchPolicy: 'network-only'
    });
    const [requestReturn, { loading: submitting }] = useMutation(REQUEST_RETURN, {
        refetchQueries: ['GetCustomerOrders', 'GetCustomerOrder']
    });
    const eligibility = order?.return_eligibility;
    const options = data?.dfiReturnOptions;
    const media = options?.media;
    const solutions = useMemo(() => getAllowedSolutions(options, eligibility), [options, eligibility]);
    const solution = solutions.find(item => item.code === solutionValue);
    const reasons = getAllowedReasons(solution, eligibility);
    const reason = reasons.find(item => item.uid === reasonValue);
    const selectedItems = resolveReturnItems(order?.items || [], selectedItemIds, quantities);

    useEffect(() => {
        if (!solutions.some(item => item.code === solutionValue)) {
            setSolutionValue(solutions[0]?.code || '');
            setReasonValue('');
            setOtherText('');
        }
    }, [solutions, solutionValue]);

    useEffect(() => () => previews.current.forEach(url => URL.revokeObjectURL(url)), []);

    const validationMessage = eligibility?.can_return !== true
        ? eligibility?.message || 'This order cannot be returned.'
        : !solutions.length ? 'Return options are not available.'
        : !selectedItems.length ? 'Please select at least one item.'
        : !reason ? 'Please choose a reason.'
        : reason.requires_text && (!otherText.trim() || otherText.trim().length > 255) ? 'Please describe the reason (up to 255 characters).'
        : selectedItems.some(item => {
            const quantity = (quantities[item.id] == null ? getReturnQuantity(item) : quantities[item.id]);
            return !Number.isInteger(quantity) || quantity < 1 || quantity > getReturnQuantity(item);
        }) ? 'Please choose a valid return quantity.'
        : validateEvidence(uploadedMedia, media);
    const canSubmit = !isViewMode && !optionsLoading && !optionsError && !!media && !validationMessage && !uploading && !submitting && !submittedReturn;

    const handleUploadMedia = async event => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (busy.current || submittedReturn || !media?.enabled || !files.length) return;
        const incoming = files.map(file => ({ type: media.video_extensions.includes(file.name.split('.').pop().toLowerCase()) ? 'video' : 'image' }));
        const validation = files.map(file => validateUpload(file, media)).find(Boolean) || validateMediaCounts([...uploadedMedia, ...incoming], media);
        if (validation) { setRequestError(validation); return; }
        busy.current = true;
        setUploading(true);
        setRequestError('');
        try {
            await ensureOAuthAccessFresh('/graphql');
            const token = storage.getItem('signin_token');
            if (!token) throw new Error('Please sign in again.');
            // Upload sequentially so successful tokens survive a later file failure.
            for (const file of files) {
                const body = new FormData();
                body.append('file', file);
                const response = await fetch('/rest/V1/dfi-rma/attachments', {
                    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body
                });
                let result;
                try { result = await response.json(); } catch (_) { throw new Error('Evidence upload failed. Please try again.'); }
                if (!response.ok || !result.token) throw new Error(result.message || 'Evidence upload failed. Please try again.');
                const url = URL.createObjectURL(file);
                previews.current.add(url);
                setUploadedMedia(current => [...current, {
                    id: result.token, token: result.token, name: result.file_name || file.name,
                    type: result.type, url
                }]);
            }
        } catch (error) { setRequestError(error.message); }
        finally { busy.current = false; setUploading(false); }
    };

    const handleRemoveMedia = id => {
        if (busy.current || submittedReturn) return;
        setUploadedMedia(current => current.filter(file => {
            if (file.id !== id) return true;
            URL.revokeObjectURL(file.url);
            previews.current.delete(file.url);
            return false;
        }));
    };

    const handleSubmit = async () => {
        if (busy.current || !canSubmit) return;
        busy.current = true;
        setRequestError('');
        try {
            const input = buildReturnInput({ order, items: selectedItems, quantities, solution: solutionValue, reason, otherText, notes, attachments: uploadedMedia, media });
            const result = await requestReturn({ variables: { input } });
            const created = result.data?.requestReturn?.return;
            if (!created?.uid) throw new Error('Return request failed. Please try again.');
            setSubmittedReturn(created);
        } catch (error) { setRequestError(error.message); }
        finally { busy.current = false; }
    };

    return {
        solutionValue, setSolutionValue, reasonValue, setReasonValue, otherText, setOtherText,
        notes, setNotes, quantities, setQuantities, uploadedMedia, uploading, submitting,
        requestError, submittedReturn, optionsLoading, optionsError, solutions, reasons,
        reason, solution, selectedItems, media, validationMessage, canSubmit,
        handleUploadMedia, handleRemoveMedia, handleSubmit
    };
};
