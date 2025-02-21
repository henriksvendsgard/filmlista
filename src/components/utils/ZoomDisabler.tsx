"use client";

import { useEffect } from "react";

export default function ZoomDisabler() {
	useEffect(() => {
		document.addEventListener("gesturestart", function (event) {
			event.preventDefault();
		});
	}, []);

	return null;
}
