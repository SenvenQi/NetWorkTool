import React from 'react';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NetworkWifi from '@mui/icons-material/NetworkWifi';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
});

const DrawerFooter = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 'auto',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const AppBar = styled(MuiAppBar)({
  "-webkit-app-region": "drag"
})


const AppBarIconButton = styled(IconButton)({
  "-webkit-app-region": "no-drag"
})

const ContentBox = styled(Box)({
  overflow: "auto",
  height: 'calc(100vh - 44px)'
})
export default function MiniDrawer(props: any) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerClose = () => {
    setOpen(!open);
  };

  const exist = () => {
    window.api.send("device/close");
  }

  const min = () => {
    window.api.send("device/min");
  }

  const max = () => {
    window.api.send("device/max");
  }
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer variant="permanent" open={open}>
        <List style={{ padding: 0 }}>
          {props.data.map((item: any, index: any) => (
            <ListItem button key={index} onClick={() => props.push(item.path)}>
              <ListItemIcon>
                <NetworkWifi />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </List>
        <DrawerFooter>
          <IconButton onClick={handleDrawerClose} aria-label="delete" size="medium">
            {open ? <ArrowBackIosNewIcon fontSize="inherit" /> : <ArrowForwardIosIcon fontSize="inherit" />}
          </IconButton>
        </DrawerFooter>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <AppBar position={"relative"}>
          <Toolbar variant="dense">
            <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }} component="div">
              网络测试工具
            </Typography>
            <AppBarIconButton onClick={min} aria-label="delete" size="medium">
              <MinimizeIcon />
            </AppBarIconButton>
            <AppBarIconButton onClick={max} aria-label="delete" size="medium">
              <ZoomOutMapIcon />
            </AppBarIconButton>
            <AppBarIconButton onClick={exist} aria-label="delete" size="medium">
              <CloseIcon />
            </AppBarIconButton>
          </Toolbar>
        </AppBar>
        <ContentBox component={"div"}>
          {props.children}
        </ContentBox>
      </Box>
    </Box>
  );
}
