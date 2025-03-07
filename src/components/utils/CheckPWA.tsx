"use client";

import React, { useEffect } from "react";
import { set } from "react-hook-form";

export default function CheckPWA() {
    const [isNotPWA, setIsNotPWA] = React.useState(false);

    useEffect(() => {
        // const iOSCanInstall = "standalone" in window.navigator;
        const iOSIsInstalled = (window.navigator as any).standalone === true;

        if (!iOSIsInstalled) {
            setIsNotPWA(true);
            console.log("Installer meg som PWA!!!");
        }
    }, []);
    // if (isNotPWA) return <h1 className="text-white">Installer meg som PWA!!!</h1>;
    return null;
}
