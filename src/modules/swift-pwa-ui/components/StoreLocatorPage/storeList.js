import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search as SearchIcon } from 'react-feather';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Icon from '@magento/venia-ui/lib/components/Icon';
import Image from '@magento/venia-ui/lib/components/Image';
import { CloseCircleFilled, StoreSearch } from '../../../../assets/icons';

import defaultClasses from './storeList.module.css';

const StoreList = ({
    storeList, totalAllStore, onClickListItem
}) => {
    const classes = useStyle(defaultClasses);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const debounceTimerRef = useRef(null);

    // 1.1 查询规范化
    const normalizeQuery = useCallback((query) => {
        return query.toLowerCase().trim().replace(/\s+/g, ' ');
    }, []);

    // 1.2 字段规范化（仅用于匹配，去除所有空格）
    const normalizeField = useCallback((field) => {
        return (field || '').toLowerCase().replace(/\s+/g, '');
    }, []);

    // 1.3 词元化
    const tokenizeQuery = useCallback((query) => {
        return query.split(' ').filter(token => token.length > 0);
    }, []);

    // 检查所有词元是否在任意字段中匹配（AND逻辑）
    const checkAllTokensMatch = useCallback((item, tokens) => {
        const normalizedFields = {
            store_name: normalizeField(item.store_name),
            address: normalizeField(item.address),
            city: normalizeField(item.city),
            zipcode: normalizeField(item.zipcode || '')
        };

        return tokens.every(token => {
            const normalizedToken = normalizeField(token);
            return normalizedFields.store_name.includes(normalizedToken) ||
                   normalizedFields.address.includes(normalizedToken) ||
                   normalizedFields.city.includes(normalizedToken) ||
                   (normalizedFields.zipcode && normalizedFields.zipcode.includes(normalizedToken));
        });
    }, [normalizeField]);

    // 检查所有词元是否都在指定字段中匹配
    const checkFieldMatch = useCallback((fieldValue, tokens) => {
        const normalizedField = normalizeField(fieldValue);
        return tokens.every(token => {
            const normalizedToken = normalizeField(token);
            return normalizedField.includes(normalizedToken);
        });
    }, [normalizeField]);

    // 检查精确短语匹配
    const checkExactPhrase = useCallback((fieldValue, normalizedQuery) => {
        const normalizedField = normalizeField(fieldValue);
        return normalizedField.includes(normalizedQuery);
    }, [normalizeField]);

    // 计算字段中匹配的词元数量
    const countTokensInField = useCallback((fieldValue, tokens) => {
        const normalizedField = normalizeField(fieldValue);
        return tokens.filter(token => {
            const normalizedToken = normalizeField(token);
            return normalizedField.includes(normalizedToken);
        }).length;
    }, [normalizeField]);

    // 组内排序
    const sortGroup = useCallback((items, normalizedQuery, tokens) => {
        const itemsCopy = [...items]; // 创建副本避免修改原数组
        return itemsCopy.sort((a, b) => {
            // 1. 精确短语匹配优先（有精确短语匹配的排在前面）
            const aStoreNamePhrase = checkExactPhrase(a.store_name, normalizedQuery);
            const bStoreNamePhrase = checkExactPhrase(b.store_name, normalizedQuery);
            if (aStoreNamePhrase !== bStoreNamePhrase) {
                return aStoreNamePhrase ? -1 : 1; // a有精确匹配则排在前面
            }

            const aAddressPhrase = checkExactPhrase(a.address, normalizedQuery);
            const bAddressPhrase = checkExactPhrase(b.address, normalizedQuery);
            if (aAddressPhrase !== bAddressPhrase) {
                return aAddressPhrase ? -1 : 1;
            }

            const aCityPhrase = checkExactPhrase(a.city, normalizedQuery);
            const bCityPhrase = checkExactPhrase(b.city, normalizedQuery);
            if (aCityPhrase !== bCityPhrase) {
                return aCityPhrase ? -1 : 1;
            }

            // 2. 标记数量（数量多的排在前面）
            const aStoreNameCount = countTokensInField(a.store_name, tokens);
            const bStoreNameCount = countTokensInField(b.store_name, tokens);
            if (aStoreNameCount !== bStoreNameCount) {
                return bStoreNameCount - aStoreNameCount;
            }

            const aAddressCount = countTokensInField(a.address, tokens);
            const bAddressCount = countTokensInField(b.address, tokens);
            if (aAddressCount !== bAddressCount) {
                return bAddressCount - aAddressCount;
            }

            const aCityCount = countTokensInField(a.city, tokens);
            const bCityCount = countTokensInField(b.city, tokens);
            if (aCityCount !== bCityCount) {
                return bCityCount - aCityCount;
            }

            // 3. 字母顺序
            return (a.store_name || '').localeCompare(b.store_name || '');
        });
    }, [checkExactPhrase, countTokensInField]);

    // 查找匹配位置（去除空格匹配，映射回原始文本位置）
    const findMatchPositions = useCallback((text, token) => {
        if (!text || !token || typeof text !== 'string' || typeof token !== 'string') {
            return [];
        }

        // 步骤1：规范化处理
        const normalizedText = normalizeField(text);
        const normalizedToken = normalizeField(token);

        if (!normalizedToken || normalizedText.length === 0) {
            return [];
        }

        // 步骤2：构建字符映射表
        // charMap[i] 记录原始文本位置i对应的规范化文本位置
        // 如果是空格，normalizedIndex为-1
        const charMap = [];
        let normalizedIndex = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                charMap.push({ originalIndex: i, normalizedIndex: -1 });
            } else {
                charMap.push({ originalIndex: i, normalizedIndex: normalizedIndex++ });
            }
        }

        // 步骤3：在规范化文本中查找匹配
        const positions = [];
        let searchIndex = 0;
        let index;

        while ((index = normalizedText.indexOf(normalizedToken, searchIndex)) !== -1) {
            // 步骤4：映射回原始文本位置
            // 查找起始位置
            let startPos = -1;
            for (let i = 0; i < charMap.length; i++) {
                if (charMap[i].normalizedIndex === index) {
                    startPos = charMap[i].originalIndex;
                    break;
                }
            }

            // 查找结束位置
            // 从startPos开始，跳过空格，统计normalizedToken.length个字符
            if (startPos !== -1) {
                let charCount = 0;
                let endPos = startPos;

                for (let i = startPos; i < text.length && charCount < normalizedToken.length; i++) {
                    if (text[i] !== ' ') {
                        charCount++;
                    }
                    endPos = i;
                }

                // endPos + 1 因为 substring 是左闭右开
                positions.push({ start: startPos, end: endPos + 1 });
            }

            searchIndex = index + 1;
        }

        return positions;
    }, [normalizeField]);

    // 高亮匹配文本的函数（与搜索逻辑完全一致，支持去除空格匹配）
    const highlightText = useCallback((text, searchText, shouldHighlight = true) => {
        // 步骤1：输入验证
        if (!text || !shouldHighlight) {
            return text;
        }

        if (typeof text !== 'string') {
            return text;
        }

        if (!searchText || typeof searchText !== 'string') {
            return text;
        }

        // 步骤2：词元化
        const normalizedQuery = normalizeQuery(searchText);
        const tokens = tokenizeQuery(normalizedQuery);

        if (tokens.length === 0) {
            return text;
        }

        // 步骤3：查找所有匹配位置
        const allPositions = [];
        tokens.forEach(token => {
            if (!token) return;
            const positions = findMatchPositions(text, token);
            allPositions.push(...positions);
        });

        if (allPositions.length === 0) {
            return text;
        }

        // 步骤4：合并重叠位置
        // 按起始位置排序
        allPositions.sort((a, b) => a.start - b.start);

        const mergedPositions = [];
        let currentRange = null;

        allPositions.forEach(position => {
            if (!currentRange) {
                currentRange = { ...position };
            } else if (position.start <= currentRange.end) {
                // 重叠，合并
                currentRange.end = Math.max(currentRange.end, position.end);
            } else {
                // 不重叠，保存当前并开始新的
                mergedPositions.push(currentRange);
                currentRange = { ...position };
            }
        });

        if (currentRange) {
            mergedPositions.push(currentRange);
        }

        if (mergedPositions.length === 0) {
            return text;
        }

        // 步骤5：构建文本片段
        const textLength = text.length;
        let result = '';
        let lastIndex = 0;

        mergedPositions.forEach(range => {
            // 添加匹配前的文本（如果有）
            if (range.start > lastIndex) {
                result += text.substring(lastIndex, range.start);
            }
            // 添加匹配的文本（高亮）
            const highlightText = text.substring(range.start, range.end);
            result += `<span style="color: #FF8200; font-weight: bold;">${highlightText}</span>`;
            lastIndex = range.end;
        });

        // 添加剩余的文本（如果有）
        if (lastIndex < textLength) {
            result += text.substring(lastIndex);
        }

        // 步骤6：渲染高亮文本
        return <span dangerouslySetInnerHTML={{ __html: result }} />;
    }, [normalizeQuery, tokenizeQuery, findMatchPositions]);

    // 防抖处理
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!searchQuery.trim()) {
            // 如果搜索文本为空，立即显示所有数据
            setDebouncedQuery('');
            return;
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery]);

    // 过滤和排序后的商店列表
    const filteredStoreList = useMemo(() => {
        if (!debouncedQuery.trim()) return storeList;

        const normalizedQuery = normalizeQuery(debouncedQuery);
        const tokens = tokenizeQuery(normalizedQuery);
        const normalizedQueryNoSpaces = normalizeField(debouncedQuery);

        if (tokens.length === 0) return storeList;

        const matchedSet = new Set();
        const resultGroups = {
            store_name: [],
            address: [],
            city: [],
            postal_code: []
        };

        // 第一遍：Store_name 字段匹配
        storeList.forEach((item, index) => {
            if (matchedSet.has(index)) return;
            if (!checkAllTokensMatch(item, tokens)) return;
            if (checkFieldMatch(item.store_name, tokens)) {
                resultGroups.store_name.push(item);
                matchedSet.add(index);
            }
        });

        // 第二遍：Address 字段匹配
        storeList.forEach((item, index) => {
            if (matchedSet.has(index)) return;
            if (!checkAllTokensMatch(item, tokens)) return;
            if (checkFieldMatch(item.address, tokens)) {
                resultGroups.address.push(item);
                matchedSet.add(index);
            }
        });

        // 第三遍：City 字段匹配
        storeList.forEach((item, index) => {
            if (matchedSet.has(index)) return;
            if (!checkAllTokensMatch(item, tokens)) return;
            if (checkFieldMatch(item.city, tokens)) {
                resultGroups.city.push(item);
                matchedSet.add(index);
            }
        });

        // 第四遍：Postal_code 字段匹配
        storeList.forEach((item, index) => {
            if (matchedSet.has(index)) return;
            if (!checkAllTokensMatch(item, tokens)) return;
            if (item.zipcode && checkFieldMatch(item.zipcode, tokens)) {
                resultGroups.postal_code.push(item);
                matchedSet.add(index);
            }
        });

        // 对每个组进行排序
        Object.keys(resultGroups).forEach(group => {
            resultGroups[group] = sortGroup(resultGroups[group], normalizedQueryNoSpaces, tokens);
        });

        // 按优先级顺序合并结果
        return [
            ...resultGroups.store_name,
            ...resultGroups.address,
            ...resultGroups.city,
            ...resultGroups.postal_code
        ];
    }, [storeList, debouncedQuery, normalizeQuery, tokenizeQuery, normalizeField, checkAllTokensMatch, checkFieldMatch, sortGroup]);

    // 计算当前查询的搜索文本（用于高亮，使用原始查询以实时显示高亮）
    const highlightSearchText = useMemo(() => {
        return searchQuery.trim();
    }, [searchQuery]);

    return (
        <div className={classes.store_locator_wrapper}>
            <div className={classes.search_container}>
                <div className={classes.search_wrapper}>
                    <div className={classes.search_icon}>
                        <Icon src={SearchIcon} size={20} />
                    </div>
                    <input
                        type="text"
                        className={classes.search_input}
                        placeholder="Find the nearest store to you"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className={classes.search_clear}
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                        >
                            <CloseCircleFilled style={{ fontSize: '24px', color: 'rgba(0, 0, 0, 0.4)' }} />
                        </button>
                    )}
                </div>
            </div>
            <div className={classes.store_list}>
                <ul className="list">
                    {filteredStoreList.map((store, i) => (
                        <div key={i}>
                            <hr style={{ display: i ? 'block' : 'none', marginTop: 0, marginBottom: 4 }} />
                            <div
                                className="list_item"
                                onClick={() => onClickListItem(store)}
                            >
                                <div className="list_item_avatar">
                                    <div className="avatar">
                                        {<Image
                                            alt={`avatar-${i}`}
                                            src={store.baseimage || "/venia-static-assets/images/icon-building.svg"}
                                        />}
                                    </div>
                                    <p className="list_item_text_primary">
                                        {highlightText(store.store_name, highlightSearchText, true)}
                                    </p>
                                </div>
                                <div className="list_item_text">
                                    <small className="list_item_text_secondary">
                                        <div className={classes.address_label}>ADDRESS:</div>
                                        <div className={classes.address_content}>
                                            {store.state && (store.state + ', ').toUpperCase()}
                                            {highlightText(store.city, highlightSearchText, true)}
                                            {store.city && ', '}
                                            {highlightText(store.address, highlightSearchText, true)}
                                            {store.zipcode && highlightText(' ' + store.zipcode, highlightSearchText, true)}
                                        </div>
                                        {store.phone && (
                                            <div className={classes.unit_content}>
                                                <span className={classes.unit_label}>UNIT:</span>
                                                <span>{store.phone}</span>
                                            </div>
                                        )}
                                    </small>
                                {store.store_description && <br />}
                                <small style={{ marginTop: -6 }} className="list_item_text_secondary" dangerouslySetInnerHTML={{ __html: store.store_description }} />
                                <div className="direction_bot">
                                    <Image
                                        alt="icon-map"
                                        src="/venia-static-assets/images/icon-map.svg"
                                        width="20px"
                                        height="20px"
                                    />
                                    <a
                                        className="direction_button"
                                        href={`https://www.google.com/maps/dir/Current+Location/${store.lat},${store.lng}`}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        Lihat Maps
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                </ul>
                {!filteredStoreList.length && (
                    <div className={classes.no_results}>
                        <StoreSearch style={{ width: '53px', height: '49px' }} />
                        <p className={classes.no_results_text}>
                            {searchQuery.trim() ? 'Sorry, there are currently no search results.' : 'No data'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreList;
