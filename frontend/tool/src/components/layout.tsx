import {
  Box,
  CssBaseline,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { HubOutlined, Close, Remove, CropSquare } from "@mui/icons-material";

const Titlebar = styled(Box)({ WebkitAppRegion: "drag" });
const WindowButton = styled(IconButton)({ WebkitAppRegion: "no-drag" });
export default function Layout({ children }: any) {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CssBaseline />
      <Titlebar
        sx={{
          height: 52,
          flexShrink: 0,
          px: 2.5,
          display: "flex",
          alignItems: "center",
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box
            sx={{
              width: 28,
              height: 28,
              bgcolor: "primary.main",
              color: "#fff",
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
            }}
          >
            <HubOutlined sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle2">网络测试工具</Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              letterSpacing: 1.5,
              ml: "12px !important",
              fontSize: 10,
            }}
          >
            NETWORK TOOL
          </Typography>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="最小化">
          <WindowButton
            size="small"
            aria-label="最小化"
            onClick={() => window.api.send("device/min")}
          >
            <Remove fontSize="small" />
          </WindowButton>
        </Tooltip>
        <Tooltip title="切换全屏">
          <WindowButton
            size="small"
            aria-label="切换全屏"
            onClick={() => window.api.send("device/max")}
          >
            <CropSquare sx={{ fontSize: 16 }} />
          </WindowButton>
        </Tooltip>
        <Tooltip title="关闭窗口">
          <WindowButton
            size="small"
            aria-label="关闭窗口"
            sx={{
              ml: 0.5,
              "&:hover": { bgcolor: "error.main", color: "#fff" },
            }}
            onClick={() => window.api.send("device/close")}
          >
            <Close fontSize="small" />
          </WindowButton>
        </Tooltip>
      </Titlebar>
      <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {children}
      </Box>
    </Box>
  );
}
