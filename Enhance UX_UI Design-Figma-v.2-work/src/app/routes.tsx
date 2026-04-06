import { createBrowserRouter } from "react-router";
import { AppRoot } from "./AppRoot";
import { RegistrationForm } from "./components/RegistrationForm";
import { MembershipCard } from "./components/MembershipCard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppRoot,
    children: [
      { index: true, Component: RegistrationForm },
      { path: "member", Component: MembershipCard },
    ],
  },
]);
