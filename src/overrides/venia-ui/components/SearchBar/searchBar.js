import React from 'react';
import { bool, shape, string } from 'prop-types';
import { Form } from 'informed';
import { useLocation } from 'react-router-dom';
import { useSearchBar } from '@magento/peregrine/lib/talons/SearchBar';
import { trackSearchClick } from '@/utils/track';
import { useStyle } from '@magento/venia-ui/lib/classify';
import RecentSearch from './newRecentSearch';
import Autocomplete from './autocomplete';
import SearchField from './searchField';
import defaultClasses from '@magento/venia-ui/lib/components/SearchBar/searchBar.module.css';

const SearchBar = React.forwardRef((props, ref) => {
    const { isOpen } = props;
    const { search: locationSearch } = useLocation();
    const talonProps = useSearchBar();
    const {
        containerRef,
        handleChange,
        handleFocus,
        handleSubmit,
        initialValues,
        isAutoCompleteOpen,
        setIsAutoCompleteOpen,
        valid
    } = talonProps;

    // 关键字搜索进入 PLP：把 URL 的 query 关键字预填进搜索框
    // （informed 的 initialValues 只在挂载时生效，路由进入时
    // 搜索页的搜索框是全新挂载，正好承接）
    const urlSearchTerm = new URLSearchParams(locationSearch).get('query') || '';
    const initialValuesWithQuery = urlSearchTerm
        ? { ...initialValues, search_query: urlSearchTerm }
        : initialValues;

    const classes = useStyle(defaultClasses, props.classes);
    const rootClassName = isOpen ? classes.root_open : classes.root;

    const handleCustomSubmit = (values) => {
        handleSubmit(values); // 调用原始提交逻辑
        trackSearchClick(values.search_query || '')
    };

    return (
        <div className={rootClassName} ref={ref}>
            <div ref={containerRef} className={classes.container}>
                <Form
                    autoComplete="off"
                    className={`${classes.form} ${isAutoCompleteOpen ? classes.searchPop : ''}`}
                    initialValues={initialValuesWithQuery}
                    onSubmit={handleCustomSubmit}
                >
                    { isAutoCompleteOpen && <RecentSearch setVisible={setIsAutoCompleteOpen} /> }
                    {/* <div className={classes.autocomplete}>
                        <Autocomplete
                            setVisible={setIsAutoCompleteOpen}
                            valid={valid}
                            visible={isAutoCompleteOpen}
                        />
                    </div> */}
                    <div className={classes.search}>
                        <SearchField
                            isSearchOpen={isOpen}
                            onChange={handleChange}
                            onFocus={handleFocus}
                        />
                    </div>
                </Form>
            </div>
        </div>
    );
});

export default SearchBar;

SearchBar.propTypes = {
    classes: shape({
        autocomplete: string,
        container: string,
        form: string,
        root: string,
        root_open: string,
        search: string
    }),
    isOpen: bool
};
