import { createTheme } from '@mui/material/styles';
import "@fontsource/jetbrains-mono";
export default createTheme({
    palette: {
      mode: 'dark',
      // primary: {
        // main: red[500],
      // },
    },
    typography: {
        fontFamily: [
            "JetBrains Mono"
        ].join(','),

    },
  });
