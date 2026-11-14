import { Box, List, ListItemButton, Stack, Typography } from "@mui/material";
import IDevice from "../models/device";
import { ProtocolIcon } from "./connectionHeader";
import { mono } from "../styles/mainTheme";

export default function DeviceList({
  data,
  handleClick,
  selected,
}: {
  data: IDevice[];
  handleClick: any;
  selected: IDevice;
}) {
  return (
    <List disablePadding sx={{ px: 1.5 }} aria-label="设备列表">
      {data.map((device) => (
        <ListItemButton
          key={device.address}
          selected={device.address === selected?.address}
          onClick={() => handleClick(device)}
          sx={{
            p: 1.25,
            mb: 0.7,
            gap: 1.2,
            borderRadius: 2,
            border: "1px solid transparent",
            alignItems: "flex-start",
            "&.Mui-selected": { bgcolor: "#eaf5f1", borderColor: "#cde5dc" },
            "&.Mui-selected:hover": { bgcolor: "#e1f1eb" },
          }}
        >
          <ProtocolIcon channel={device.deviceChannelType} size={32} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.7}>
              <Typography
                noWrap
                variant="subtitle2"
                title={device.name}
                sx={{ flex: 1 }}
              >
                {device.name}
              </Typography>
              <Box
                component="span"
                aria-label={device.state ? "已连接" : "未连接"}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  flexShrink: 0,
                  bgcolor: device.state ? "success.main" : "#c2cad2",
                }}
              />
            </Stack>
            <Typography
              noWrap
              title={device.address}
              sx={{
                fontFamily: mono,
                fontSize: 11,
                color: "text.secondary",
                mt: 0.4,
              }}
            >
              {device.address}
            </Typography>
          </Box>
        </ListItemButton>
      ))}
    </List>
  );
}
