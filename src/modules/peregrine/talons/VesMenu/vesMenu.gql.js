import { gql } from '@apollo/client';

export const VesMenuItemParents = gql`
    fragment VesMenuItemParents on VesMenuParent {
        id
        category_id
        content_type
        link
        link_type
        menu_id
        name
        dropdown_bgimage
    }
`;
export const VesMenuItemChildrens = gql`
    fragment VesMenuItemChildrens on VesMenuChildren {
        id
        category_id
        link
        link_type
        name
    }
`;

export const GetVesMenu = gql`
    query getVesMenu ($alias: String!) {
        vesMenu (alias: $alias){
            menu_id
            name
            items {
              ...VesMenuItemParents
              children {
                ...VesMenuItemChildrens
                children {
                  ...VesMenuItemChildrens
                  children {
                    ...VesMenuItemChildrens
                  }
                }
              }
            }
        }
    }
    ${VesMenuItemParents}
    ${VesMenuItemChildrens}
`;

export default {
    getVesMenuQuery: GetVesMenu
};
