import {
  LuLayoutDashboard,
  LuHandCoins,
  LuWalletMinimal,
  LuTarget,
  LuPiggyBank,
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "02",
    label: "Income",
    icon: LuWalletMinimal,
    path: "/income",
  },
  {
    id: "03",
    label: "Expense",
    icon: LuHandCoins,
    path: "/expense",
  },
  {
    id: "04",
    label: "Budgets",
    icon: LuTarget,
    path: "/budgets",
  },
  {
    id: "05",
    label: "Goals",
    icon: LuPiggyBank,
    path: "/goals",
  },
];

// Logout intentionally isn't part of SIDE_MENU_DATA — it's rendered as its
// own, visually separated control (see SideMenu.jsx) with a confirmation
// step, rather than sitting in the regular nav list where it's one
// mis-click away from the other items.
