import React from "react";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";

export const Layout = ({ children }) => {
    return (
        <div className="App">
            <HeaderSection />
            {children}
            <FooterSection />
        </div>
    );
};
