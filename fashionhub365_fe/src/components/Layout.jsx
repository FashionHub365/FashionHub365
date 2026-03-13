import React from "react";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import Chatbot from "./Chatbot/Chatbot";

export const Layout = ({ children }) => {
  return (
    <div className="App">
      <HeaderSection />
      {children}
      <FooterSection />
      <Chatbot />
    </div>
  );
};
