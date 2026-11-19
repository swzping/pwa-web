import { Grid, List } from 'react-feather';

export const LAYOUT_SWITCHER_OPTION_GRID = 'grid';

export const LAYOUT_SWITCHER_OPTION_LIST = 'list';

export const LAYOUT_SWITCHER_OPTIONS = [
    {
        value: LAYOUT_SWITCHER_OPTION_GRID,
        icon: Grid,
        size: 18,
    },
    {
        value: LAYOUT_SWITCHER_OPTION_LIST,
        icon: List,
    },
];

export const LAYOUT_SWITCHER_DEFAULT_VALUE = LAYOUT_SWITCHER_OPTION_GRID;

export { default } from './layoutSwitcher';