import { createTheme } from "@mui/material/styles";
import "@fontsource/jetbrains-mono";

export const mono = '"JetBrains Mono", "SFMono-Regular", Consolas, monospace';
export default createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#087f70",
      dark: "#06665b",
      light: "#e8f5f1",
      contrastText: "#ffffff",
    },
    secondary: { main: "#52647a" },
    background: { default: "#f5f7f9", paper: "#ffffff" },
    text: { primary: "#1d2d3d", secondary: "#738192" },
    divider: "#e6ebef",
    success: { main: "#16816a" },
    error: { main: "#d34e57" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif',
    fontSize: 13,
    h5: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" },
    h6: { fontSize: 17, fontWeight: 700 },
    subtitle2: { fontSize: 13, fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, whiteSpace: "nowrap", minHeight: 34 },
        outlined: { borderColor: "#dce4e8" },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8, color: "#738192" } },
    },
    MuiTextField: { defaultProps: { size: "small", variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: "#fff" },
        notchedOutline: { borderColor: "#dce4e8" },
      },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: "0 24px 80px #172b4d26" },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: 19, fontWeight: 700, padding: "24px 24px 16px" },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "16px 24px", gap: 8, borderTop: "1px solid #edf0f3" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#edf0f3", padding: "12px 16px" },
        head: {
          background: "#f8fafb",
          color: "#738192",
          fontSize: 12,
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: { defaultProps: { arrow: true, disableInteractive: true } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 600 } } },
    MuiCssBaseline: {
      styleOverrides: {
        "*": { scrollbarWidth: "thin", scrollbarColor: "#c8d3db transparent" },
        "::selection": { backgroundColor: "#c7ebe2" },
      },
    },
  },
});
