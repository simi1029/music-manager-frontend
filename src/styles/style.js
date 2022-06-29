import { createTheme } from "@mui/material/styles";

const Colors = {
    primary: "#546e7a",
    secondary: "#fbc02d",
    success: "",
    info: "",
    danger: "",
    warning: "",
    dark: "",
    light: "",
    muted: "",
    border: "",
    inverse: "",
    shaft: "",
    dove_grey: "",
    body_bg: "",
    ///////////////
    // Solid Color
    ///////////////
    white: "#fff",
    black: "#000"
};

const theme = createTheme({
    palette: {
        primary: {
            main: Colors.primary
        },
        secondary: {
            main: Colors.secondary
        }
    }
})

export default theme;