import {
  Banknote,
  BookOpenText,
  Building2,
  CircleDollarSign,
  ContactRound,
  FolderTree,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "finance",
    items: [
      {
        title: "overview",
        url: "/dashboard/finance",
        icon: LayoutDashboard,
      },
      {
        title: "transactions",
        url: "/dashboard/finance/transactions",
        icon: ReceiptText,
      },
      {
        title: "expenses",
        url: "/dashboard/finance/expenses",
        icon: Banknote,
      },
      {
        title: "incomes",
        url: "/dashboard/finance/incomes",
        icon: CircleDollarSign,
      },
    ],
  },
  {
    id: 2,
    label: "manage",
    items: [
      {
        title: "customers",
        url: "/dashboard/finance/customers",
        icon: ContactRound,
      },
      {
        title: "suppliers",
        url: "/dashboard/finance/suppliers",
        icon: Building2,
      },
      {
        title: "categories",
        url: "/dashboard/finance/categories",
        icon: FolderTree,
      },
      {
        title: "reports",
        url: "/dashboard/coming-soon",
        icon: BookOpenText,
        comingSoon: true,
      },
    ],
  },
];
