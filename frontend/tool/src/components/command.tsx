import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Send, TerminalOutlined } from "@mui/icons-material";
import { mono } from "../styles/mainTheme";
export function Command({ data, sendMessage, disabled }: any) {
  if (!data.length)
    return (
      <Stack
        alignItems="center"
        sx={{ p: 4, color: "text.secondary", textAlign: "center" }}
      >
        <TerminalOutlined sx={{ fontSize: 30, mb: 1.5, color: "#acb9c4" }} />
        <Typography variant="subtitle2">保存常用指令</Typography>
        <Typography variant="caption" sx={{ mt: 1 }}>
          点击右上角 + 添加命令，下一次一键发送。
        </Typography>
      </Stack>
    );
  return (
    <Box sx={{ p: 1.5 }}>
      {data.map((item: any) => (
        <Paper
          key={item.id}
          variant="outlined"
          sx={{ p: 1.5, mb: 1.25, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
            {item.name}
          </Typography>
          <Typography
            sx={{
              fontFamily: mono,
              fontSize: 11,
              color: "text.secondary",
              mt: 1,
              overflowWrap: "anywhere",
              lineHeight: 1.8,
            }}
          >
            {Array.from(
              item.hexString as Uint8Array,
              (value) => "0x" + value.toString(16).padStart(2, "0"),
            ).join(" ")}
          </Typography>
          <Button
            size="small"
            disabled={disabled}
            startIcon={<Send sx={{ fontSize: "13px !important" }} />}
            onClick={() => sendMessage(item.hexString)}
            sx={{ mt: 1 }}
          >
            发送
          </Button>
        </Paper>
      ))}
    </Box>
  );
}
