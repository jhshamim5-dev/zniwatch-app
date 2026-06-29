import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let handler: any;
    (async () => {
      handler = await CapApp.addListener("backButton", ({ canGoBack }) => {
        if (location.pathname !== "/" && window.history.length > 1) {
          navigate(-1);
        } else if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      });
    })();

    return () => {
      if (handler && handler.remove) handler.remove();
    };
  }, [navigate, location.pathname]);

  return null;
}
