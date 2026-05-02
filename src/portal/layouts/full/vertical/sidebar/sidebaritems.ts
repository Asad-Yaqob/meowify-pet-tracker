export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: string;
  children?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: string;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  isPro?: boolean;
}

import { uniqueId } from 'lodash';

const SidebarContent: MenuItem[] = [
  {
    heading: 'Meowify',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/portal/dashboard',
        isPro: false,
      },
      {
        name: 'Pet Profiles',
        icon: 'solar:cat-linear',
        id: uniqueId(),
        children: [
          {
            id: uniqueId(),
            name: 'Pet List',
            url: '/portal/pets',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Create Pet',
            url: '/portal/pets/create',
            isPro: false,
          },
        ],
      },
    ],
  },
];

export default SidebarContent;
