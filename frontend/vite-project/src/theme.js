import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
    createTheme({
        palette: {
            mode,
            ...(mode === "light"
                ? {
                    background: { default: "#f5f5f5" },
                }
                : {
                    background: { default: "#121212" },
                }),
        },
        typography: {
            fontFamily: "Inter, Roboto, sans-serif",
        },
        shape: {
            borderRadius: 10,
        },
    });
