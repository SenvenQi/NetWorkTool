import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import {
  FolderOutlined,
  LockOutlined,
  TerminalOutlined,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import ConnectionHeader from "./connectionHeader";
import RemoteConnectDialog, { remoteError } from "./remoteConnectDialog";
import SshTerminal from "./sshTerminal";
import SftpBrowser from "./sftpBrowser";
import { mono } from "../styles/mainTheme";

export default function RemoteWorkspace({ device }: any) {
  const [connecting, setConnecting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const notify = (message: string, variant: any = "error") =>
    enqueueSnackbar(message, { variant });
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <ConnectionHeader
        device={device}
        onConnect={() =>
          device.state
            ? window.api
                .send("device/closeDevice", device.address)
                .catch((error: any) => notify(remoteError(error)))
            : setConnecting(true)
        }
      />
      {device.deviceChannelType === 5 ? (
        <>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              m: 2,
              mb: 1,
              borderRadius: 2,
              bgcolor: "#111e28",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 2,
                py: 1,
                borderBottom: "1px solid #ffffff0c",
                color: "#8aa1ae",
              }}
            >
              <TerminalOutlined sx={{ fontSize: 16 }} />
              <Typography
                sx={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 1,
                  flex: 1,
                }}
              >
                TERMINAL
              </Typography>
              <LockOutlined sx={{ fontSize: 12 }} />
              <Typography variant="caption" sx={{ fontSize: 10 }}>
                SSH
              </Typography>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
              <SshTerminal device={device} onError={notify} />
              {!device.state && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    right: 16,
                    bgcolor: "#1b303b",
                    borderRadius: 1.5,
                    p: 1.5,
                    color: "#a9c2cc",
                    pointerEvents: "none",
                  }}
                >
                  <Typography variant="caption">
                    终端未连接 · 点击右上角“连接”开始会话
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ px: 2.5, pb: 1.5, flexShrink: 0 }}
          >
            <Typography
              variant="caption"
              sx={{ fontFamily: mono, fontSize: 10, color: "text.secondary" }}
            >
              UTF-8 · xterm-256color
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: 10 }}
            >
              Ctrl+C 中断 · Ctrl+D 退出
            </Typography>
          </Stack>
        </>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {device.state ? (
            <SftpBrowser device={device} notify={notify} />
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: "100%", p: 3 }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#edf4f1",
                  borderRadius: "50%",
                  mb: 2,
                  color: "#78a28c",
                }}
              >
                <FolderOutlined sx={{ fontSize: 32, display: "block" }} />
              </Box>
              <Typography variant="subtitle2">
                你的远端文件，近在眼前
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                连接 SFTP 后浏览远端文件
              </Typography>
            </Stack>
          )}
        </Box>
      )}
      {connecting && (
        <RemoteConnectDialog
          device={device}
          close={() => setConnecting(false)}
        />
      )}
    </Box>
  );
}
