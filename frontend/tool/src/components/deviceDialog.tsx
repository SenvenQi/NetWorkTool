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
import { DeviceType } from "../models/deviceType";
import { protocols } from "./connectionHeader";

export default function DeviceDialog(props: any) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [channel, setChannel] = useState(0);
  const [options, setOptions] = useState<any>({});
  const changeChannel = (value: number) => {
    setChannel(value);
    setAddress("");
    setOptions(
      value === 1
        ? { baudRate: 9600, stopBits: 1, dataBits: 8, parity: "none" }
        : value === 4
          ? { remoteAddress: "255.255.255.255", remotePort: 1500 }
          : {},
    );
  };
  useEffect(() => {
    if (props.open) {
      setName("");
      changeChannel(props.initialChannel ?? 0);
    }
  }, [props.open, props.initialChannel]);
  const nativeDevice = channel === 1 || channel === 3;
  const addresses = channel === 1 ? props.ports : props.hidPaths;
  const hints = [
    "格式：host:port 或 [IPv6]:port",
    "选择本机串口设备",
    "输入本地 HTTP 监听端口",
    "选择本机 HID 设备",
    "输入本地 UDP 监听端口",
    "格式：host:port，省略端口时使用 22",
    "格式：host:port，省略端口时使用 22",
  ];
  return (
    <Dialog
      open={props.open}
      onClose={props.pending ? undefined : props.handleOpen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        新建连接
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.7, fontWeight: 400 }}
        >
          选择协议，保存你的设备与服务。
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="名称"
            placeholder="例如：开发服务器"
            value={name}
            disabled={props.pending}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="协议"
            select
            SelectProps={{ native: true }}
            value={channel}
            disabled={props.pending}
            onChange={(event) => changeChannel(Number(event.target.value))}
          >
            {protocols.map((protocol, index) => (
              <option key={index} value={index}>
                {protocol.name} · {protocol.description}
              </option>
            ))}
          </TextField>
          {nativeDevice ? (
            <TextField
              label="地址"
              select
              SelectProps={{ native: true }}
              value={address}
              disabled={props.pending}
              helperText={
                addresses.length
                  ? hints[channel]
                  : "暂未检测到设备，请连接设备后重新打开此窗口"
              }
              onChange={(event) => setAddress(event.target.value)}
            >
              <option value="">
                请选择{channel === 1 ? "串口" : "HID 设备"}
              </option>
              {addresses.map((item: any) => (
                <option key={item.path} value={item.path}>
                  {channel === 1 ? item.path : item.product || item.path}
                </option>
              ))}
            </TextField>
          ) : (
            <TextField
              label="地址"
              value={address}
              disabled={props.pending}
              helperText={hints[channel]}
              placeholder={
                channel === 0
                  ? "host:port 或 [IPv6]:port"
                  : channel >= 5
                    ? "192.168.1.10:22"
                    : "例如：8080"
              }
              onChange={(event) => setAddress(event.target.value)}
            />
          )}
          {channel === 1 && (
            <TextField
              label="波特率"
              select
              SelectProps={{ native: true }}
              value={options.baudRate ?? 9600}
              disabled={props.pending}
              onChange={(event) =>
                setOptions({ ...options, baudRate: Number(event.target.value) })
              }
            >
              {[
                115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600,
                300, 200, 150, 134, 110, 75, 50,
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </TextField>
          )}
          {channel === 4 && (
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="目标地址"
                value={options.remoteAddress ?? ""}
                disabled={props.pending}
                onChange={(event) =>
                  setOptions({ ...options, remoteAddress: event.target.value })
                }
              />
              <TextField
                label="目标端口"
                type="number"
                sx={{ width: 150, flexShrink: 0 }}
                value={options.remotePort ?? 1500}
                disabled={props.pending}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    remotePort: Number(event.target.value),
                  })
                }
              />
            </Stack>
          )}
          {channel >= 5 && (
            <TextField
              label="默认用户名（可选）"
              value={options.username || ""}
              disabled={props.pending}
              onChange={(event) => setOptions({ username: event.target.value })}
              helperText="密码或私钥在连接时填写，不保存到配置。"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={props.pending} onClick={props.handleOpen}>
          取消
        </Button>
        <Button
          variant="contained"
          disabled={props.pending}
          onClick={() =>
            props.handleSubmite(
              name,
              address,
              DeviceType.base,
              channel,
              options,
            )
          }
        >
          {props.pending ? "保存中…" : "确定"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
