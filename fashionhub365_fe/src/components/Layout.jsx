import React from "react";
import { useLocation } from "react-router-dom";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import { ChatProvider } from "../contexts/ChatContext";
import { ChatWidget } from "./Chat/ChatWidget";
import { useAuth } from "../contexts/AuthContext";
import Chatbot from "./Chatbot/Chatbot";

const LayoutInner = ({ children }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");
    const isSellerRoute = location.pathname.startsWith("/seller");
    const { isAuthenticated } = useAuth();
    
    // Hide footer and header on seller routes if needed, but the original logic didn't.
    // We definitely want to hide the global ChatWidget on seller route because we have a dedicated page.
    const showChatWidget = isAuthenticated && !isSellerRoute && !isAdminRoute;

    return (
        <div className="App">
            {!isAdminRoute && <HeaderSection />}
            {children}
            {!isAdminRoute && <FooterSection />}
            {showChatWidget && <ChatWidget />}
            {!isAdminRoute && <Chatbot />}
        </div>
    );
};

export const Layout = ({ children }) => (
    <ChatProvider>
        <LayoutInner>{children}</LayoutInner>
    </ChatProvider>
);
