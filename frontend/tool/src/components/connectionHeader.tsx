import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import {
  CableOutlined,
  DnsOutlined,
  FolderOutlined,
  Http,
  LanOutlined,
  PowerSettingsNew,
  TerminalOutlined,
  UsbOutlined,
} from "@mui/icons-material";
import { mono } from "../styles/mainTheme";

export const protocols = [
  {
    name: "TCP",
    description: "连接与调试网络服务",
    icon: LanOutlined,
    color: "#4878ba",
  },
  {
    name: "串口",
    description: "串口设备数据通信",
    icon: CableOutlined,
    color: "#b58139",
  },
  {
    name: "HTTP",
    description: "接收与检查 HTTP 请求",
    icon: Http,
    color: "#588bb2",
  },
  {
    name: "HID",
    description: "USB HID 设备调试",
    icon: UsbOutlined,
    color: "#9272b7",
  },
  {
    name: "UDP",
    description: "数据报收发与广播",
    icon: DnsOutlined,
    color: "#b87768",
  },
  {
    name: "SSH",
    description: "交互式远程终端",
    icon: TerminalOutlined,
    color: "#158676",
  },
  {
    name: "SFTP",
    description: "浏览与传输远端文件",
    icon: FolderOutlined,
    color: "#638169",
  },
];
export function ProtocolIcon({
  channel,
  size = 38,
}: {
  channel: number;
  size?: number;
}) {
  const protocol = protocols[channel] || protocols[0];
  const Icon = protocol.icon;
  return (
    <Box
      title={protocol.name}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "10px",
        bgcolor: `${protocol.color}12`,
        color: protocol.color,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Icon sx={{ fontSize: size * 0.53 }} />
    </Box>
  );
}
export function ConnectionState({ connected }: { connected: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={0.7}
      alignItems="center"
      sx={{ flexShrink: 0 }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: connected ? "success.main" : "#b0bac5",
          boxShadow: connected ? "0 0 0 3px #16816a12" : "none",
        }}
      />
      <Typography
        variant="caption"
        color={connected ? "success.main" : "text.secondary"}
      >
        {connected ? "已连接" : "未连接"}
      </Typography>
    </Stack>
  );
}
export default function ConnectionHeader({ device, onConnect }: any) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        px: { xs: 2, md: 3 },
        py: 2.25,
        borderBottom: "1px solid",
        borderColor: "divider",
        flexShrink: 0,
      }}
    >
      <ProtocolIcon channel={device.deviceChannelType} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" noWrap title={device.name}>
            {device.name}
          </Typography>
          <Chip
            size="small"
            label={protocols[device.deviceChannelType]?.name}
            sx={{
              height: 20,
              fontSize: 10,
              bgcolor: "#f0f4f6",
              color: "text.secondary",
              display: { xs: "none", md: "flex" },
            }}
          />
        </Stack>
        <Typography
          noWrap
          variant="caption"
          title={device.address}
          sx={{
            color: "text.secondary",
            fontFamily: mono,
            display: "block",
            mt: 0.4,
          }}
        >
          {device.address}
        </Typography>
      </Box>
      <ConnectionState connected={device.state} />
      <Button
        variant={device.state ? "outlined" : "contained"}
        size="small"
        startIcon={<PowerSettingsNew sx={{ fontSize: "16px !important" }} />}
        onClick={onConnect}
      >
        {device.state ? "断开连接" : "连接"}
      </Button>
    </Stack>
  );
}
