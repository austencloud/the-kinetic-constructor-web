import React from "react";
import SocialMediaWidget from "./SocialMediaWidget";
import NavigationWidget from "./NavigationWidget";
import SettingsButton from "./SettingsButton";

const MenuBar = ({ onBackgroundChange }) => {
    const menuBarStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#333',
        color: 'white',
        position: 'fixed', /* Stay at the top */
        top: '0',
        left: '0',
        width: '100%', /* Full width */
        zIndex: 10, /* Layer above other content */
      };
      

    const menuBarSectionStyle = {
        flex: 1,
        textAlign: 'center'
    };

    const firstChildStyle = {
        textAlign: 'left'
    };

    const lastChildStyle = {
        textAlign: 'right'
    };

    return (
        <header style={menuBarStyle}>
            <div style={{ ...menuBarSectionStyle, ...firstChildStyle }}>
                <SocialMediaWidget />
            </div>
            <div style={menuBarSectionStyle}>
                <NavigationWidget />
            </div>
            <div style={{ ...menuBarSectionStyle, ...lastChildStyle }}>
                <SettingsButton/>
            </div>
        </header>
    );
};

export default MenuBar;
