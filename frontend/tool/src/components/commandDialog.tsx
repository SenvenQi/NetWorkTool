import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { mono } from "../styles/mainTheme";
export default function CommandDialog({
  open,
  pending,
  close,
  handleSubmite,
}: any) {
  const [name, setName] = useState("");
  const [type, setType] = useState(0);
  const [command, setCommand] = useState("");
  useEffect(() => {
    if (open) {
      setName("");
      setType(0);
      setCommand("");
    }
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : close}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        添加命令
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>
          保存常用数据，下次一键发送。
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="名称"
            value={name}
            disabled={pending}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="编码"
            select
            SelectProps={{ native: true }}
            value={type}
            disabled={pending}
            onChange={(event) => setType(Number(event.target.value))}
          >
            <option value={0}>16进制字符串</option>
            <option value={1}>纯字符串</option>
          </TextField>
          <TextField
            label="命令"
            multiline
            minRows={3}
            maxRows={8}
            value={command}
            disabled={pending}
            onChange={(event) => setCommand(event.target.value)}
            sx={{ "& textarea": { fontFamily: mono } }}
            helperText={
              type === 0
                ? "填写完整字节，例如 01 0A FF，字节间可以使用空格。"
                : "文本将按 UTF-8 编码发送。"
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={pending} onClick={close}>
          取消
        </Button>
        <Button
          variant="contained"
          disabled={pending}
          onClick={() => handleSubmite(name, type, command)}
        >
          {pending ? "保存中…" : "确定"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
