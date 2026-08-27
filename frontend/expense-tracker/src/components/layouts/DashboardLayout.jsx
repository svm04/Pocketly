import React, { useContext } from "react";
import { UserContext } from "../../context/userContextValue";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import Footer from "./Footer";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);
  return (
    <div className="dark:bg-gray-950 min-h-screen flex flex-col">
      <Navbar activeMenu={activeMenu} />

      {user && (
        <>
          <div className="flex grow">
            <div className="max-[1080px]:hidden">
              <SideMenu activeMenu={activeMenu} />
            </div>

            <div className="grow mx-5">{children}</div>
          </div>
          <Footer />
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
