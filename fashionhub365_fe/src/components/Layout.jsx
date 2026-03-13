import React from "react";
import { useLocation } from "react-router-dom";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";

export const Layout = ({ children }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");

    return (
        <div className="App">
            {!isAdminRoute && <HeaderSection />}
            {children}
            {!isAdminRoute && <FooterSection />}
        </div>
    );
};
