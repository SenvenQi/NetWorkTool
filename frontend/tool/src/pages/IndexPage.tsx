import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowDownward,
  Close,
  ContentCopy,
  DeleteOutline,
  HubOutlined,
  Search,
  Send,
  TerminalOutlined,
  WifiTethering,
} from "@mui/icons-material";
import { withSnackbar } from "notistack";
import {
  addCommand,
  addDevice,
  clearDeviceMessage,
  connectDevice,
  copyText,
  disConnectDevice,
  getHidDevice,
  getPorts,
  initData,
  removeDevice,
  selectDevice,
  sendMessage,
} from "../stores/device/actions";
import Device from "../components/device";
import DeviceDialog from "../components/deviceDialog";
import RemoteWorkspace from "../components/remoteWorkspace";
import ConnectionHeader, { protocols } from "../components/connectionHeader";
import { Command } from "../components/command";
import CommandDialog from "../components/commandDialog";
import { DeviceChannelType } from "../models/deviceChannelType";
import { DeviceType } from "../models/deviceType";
import { CommandType } from "../models/commandType";
import { mono } from "../styles/mainTheme";

const hex = (bytes: any) =>
  Array.from(
    bytes as Uint8Array,
    (byte) => "0x" + byte.toString(16).padStart(2, "0"),
  ).join(" ");
const Home = (props: any) => {
  const [open, setOpen] = useState(false);
  const [initialChannel, setInitialChannel] = useState(0);
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [encoding, setEncoding] = useState("hex");
  const [display, setDisplay] = useState("hex");
  const [autoScroll, setAutoScroll] = useState(true);
  const [openCommand, setOpenCommand] = useState(false);
  const [openCommandDialog, setOpenCommandDialog] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const messageArea = useRef<HTMLDivElement>(null);
  const device = props.selectedDevice;
  const messages = props.messages.filter(
    (item: any) => item.address === device?.address,
  );
  const http = device?.deviceChannelType === DeviceChannelType.HttpServer;
  const remote = device && device.deviceChannelType >= DeviceChannelType.Ssh;
  const canSend = device?.state && !http;
  const connectedCount = props.devices.filter((item: any) => item.state).length;
  const filteredDevices = props.devices.filter(
    (item: any) =>
      (!onlineOnly || item.state) &&
      `${item.name} ${item.address} ${protocols[item.deviceChannelType]?.name}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const { initData } = props;
  useEffect(() => {
    initData();
  }, [initData]);
  useEffect(() => {
    if (props.deviceSaveStatus === "success") {
      setOpen(false);
      setSearch("");
      setOnlineOnly(false);
    }
  }, [props.deviceSaveStatus]);
  useEffect(() => {
    if (props.commandSaveStatus === "success") setOpenCommandDialog(false);
  }, [props.commandSaveStatus]);
  useEffect(() => {
    if (autoScroll && messageArea.current)
      messageArea.current.scrollTop = messageArea.current.scrollHeight;
  }, [messages[messages.length - 1], device?.address, autoScroll, display]);
  useEffect(() => {
    setMessage("");
    setOpenCommand(false);
  }, [device?.address]);
  const openDevice = (channel = 0) => {
    setInitialChannel(channel);
    props.getPorts();
    props.getHidDevices();
    setOpen(true);
  };
  const send = (value: any) => {
    if (!canSend) {
      props.enqueueSnackbar("请先连接可发送数据的设备", { variant: "error" });
      return;
    }
    props.sendMessage({ address: device.address, message: value });
  };
  const submitMessage = () => {
    if (!message.trim()) return;
    if (
      encoding === "hex" &&
      !/^(?:[0-9a-fA-F]{2})+$/.test(message.replace(/\s/g, ""))
    ) {
      props.enqueueSnackbar("请输入完整的十六进制字节，例如 01 0A FF", {
        variant: "error",
      });
      return;
    }
    send(encoding === "hex" ? message : new TextEncoder().encode(message));
  };
  const saveDevice = (
    name: string,
    address: string,
    deviceType: DeviceType,
    deviceChannelType: DeviceChannelType,
    option: any,
  ) => {
    if (!name.trim() || !address.trim()) {
      props.enqueueSnackbar("请填写名称和地址", { variant: "error" });
      return;
    }
    if (props.devices.some((item: any) => item.address === address.trim())) {
      props.enqueueSnackbar("不可添加同地址设备", { variant: "error" });
      return;
    }
    props.addDevice({
      name: name.trim(),
      address: address.trim(),
      deviceType,
      deviceChannelType,
      option,
    });
  };
  const saveCommand = (name: string, type: CommandType, command: string) => {
    if (!name.trim() || !command.trim()) {
      props.enqueueSnackbar("请填写命令名称和内容", { variant: "error" });
      return;
    }
    props.addCommand({ name, type, command });
  };
  return (
    <Box sx={{ height: "100%", display: "flex" }}>
      <Box
        component="aside"
        aria-label="连接管理"
        sx={{
          width: "clamp(220px, 23vw, 280px)",
          flexShrink: 0,
          bgcolor: "#fcfdfd",
          borderRight: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box sx={{ p: 2.25, pb: 1.5 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">我的连接</Typography>
            <Chip
              label={props.devices.length}
              size="small"
              sx={{ height: 22, bgcolor: "#edf1f4", color: "text.secondary" }}
            />
          </Stack>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add />}
            aria-label="添加设备"
            onClick={() => openDevice()}
          >
            新建连接
          </Button>
          <TextField
            fullWidth
            placeholder="搜索名称、地址或协议"
            inputProps={{ "aria-label": "搜索设备" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": { bgcolor: "#f3f6f7", fontSize: 12 },
              "& fieldset": { borderColor: "transparent" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 17 }} />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="清除搜索"
                    onClick={() => setSearch("")}
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ px: 2.25, pb: 1.5 }}>
          <Button
            size="small"
            onClick={() => setOnlineOnly(false)}
            sx={{
              minWidth: 0,
              px: 1.5,
              bgcolor: !onlineOnly ? "#eaf0f3" : "transparent",
              color: !onlineOnly ? "text.primary" : "text.secondary",
            }}
          >
            全部
          </Button>
          <Button
            size="small"
            onClick={() => setOnlineOnly(true)}
            sx={{
              minWidth: 0,
              px: 1.5,
              bgcolor: onlineOnly ? "#e8f5f1" : "transparent",
              color: onlineOnly ? "primary.main" : "text.secondary",
            }}
          >
            已连接 {connectedCount}
          </Button>
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <Device
            data={filteredDevices}
            selected={device}
            handleClick={props.selectDevice}
          />
          {!filteredDevices.length && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 3, py: 4, textAlign: "center" }}
            >
              {props.devices.length ? "没有匹配的连接" : "你的连接会显示在这里"}
            </Typography>
          )}
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: connectedCount ? "success.main" : "#b0bac5",
              mr: 1,
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {connectedCount} 个连接运行中
          </Typography>
          <Tooltip title="删除选中的连接">
            <span>
              <IconButton
                size="small"
                aria-label="删除设备"
                disabled={!device}
                onClick={() => setDeleting(device)}
              >
                <DeleteOutline sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          <Typography variant="caption" color="text.secondary">
            工作台
          </Typography>
          <Typography color="text.disabled">/</Typography>
          <Typography variant="caption" color="text.primary">
            {device ? protocols[device.deviceChannelType]?.name : "开始连接"}
          </Typography>
          <Box sx={{ flex: "1 !important" }} />
          <Typography variant="caption" color="text.secondary">
            本地工作空间
          </Typography>
        </Stack>
        <Paper
          sx={{
            flex: 1,
            minHeight: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 3px 16px #18304803",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {remote ? (
            <RemoteWorkspace key={device.address} device={device} />
          ) : device ? (
            <>
              <ConnectionHeader
                device={device}
                onConnect={() =>
                  device.state
                    ? props.disConnectDevice(device.address)
                    : props.connectDevice(device)
                }
              />
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 2.5,
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <ArrowDownward sx={{ fontSize: 16, color: "primary.main" }} />
                <Typography variant="subtitle2">接收记录</Typography>
                <Typography variant="caption" color="text.secondary">
                  {messages.length}
                </Typography>
                <Box sx={{ flex: "1 !important" }} />
                {!http && (
                  <TextField
                    select
                    value={display}
                    onChange={(event) => setDisplay(event.target.value)}
                    SelectProps={{ native: true }}
                    inputProps={{ "aria-label": "显示格式" }}
                    sx={{
                      width: 74,
                      "& .MuiInputBase-input": { fontSize: 11, py: 0.6 },
                      "& fieldset": { border: 0 },
                    }}
                  >
                    <option value="hex">HEX</option>
                    <option value="text">文本</option>
                  </TextField>
                )}
                <Tooltip title="清空接收记录">
                  <IconButton
                    size="small"
                    aria-label="清空"
                    onClick={() => props.clearDeviceMessage(device.address)}
                  >
                    <DeleteOutline sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
                {!http && (
                  <Tooltip title="常用命令">
                    <IconButton
                      size="small"
                      aria-label="常用命令"
                      aria-expanded={openCommand}
                      onClick={() => setOpenCommand((value) => !value)}
                      sx={{
                        bgcolor: openCommand ? "primary.light" : "transparent",
                        color: openCommand ? "primary.main" : "text.secondary",
                      }}
                    >
                      <TerminalOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
                  display: "flex",
                }}
              >
                <Box
                  ref={messageArea}
                  aria-label="接收消息"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "auto",
                    px: 2.5,
                    py: 1.5,
                    bgcolor: "#fafcfd",
                  }}
                >
                  {!messages.length ? (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        height: "100%",
                        minHeight: 140,
                        color: "text.secondary",
                      }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          mb: 1.5,
                          borderRadius: "50%",
                          bgcolor: "#edf4f4",
                          color: "#78a99f",
                        }}
                      >
                        <WifiTethering
                          sx={{ fontSize: 30, display: "block" }}
                        />
                      </Box>
                      <Typography variant="subtitle2" color="text.primary">
                        {device.state ? "等待数据到达" : "准备就绪，开始连接"}
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 0.7 }}>
                        {http
                          ? "HTTP 请求内容将在这里显示"
                          : "连接设备后，接收的数据将在这里显示"}
                      </Typography>
                    </Stack>
                  ) : (
                    messages.map((item: any, index: number) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          border: "1px solid",
                          borderColor: "#e7edf1",
                          borderRadius: 2,
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ mb: 1 }}
                        >
                          <Box
                            sx={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: 10,
                              color: "primary.main",
                              fontWeight: 700,
                              letterSpacing: 0.8,
                            }}
                          >
                            RECEIVED
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: mono,
                              fontSize: 10,
                              color: "text.secondary",
                            }}
                          >
                            {new Date(item.time).toLocaleTimeString("zh-CN", {
                              hour12: false,
                            })}
                          </Typography>
                          <Box sx={{ flex: "1 !important" }} />
                          <Tooltip
                            title={
                              http || display === "text"
                                ? "复制文本"
                                : "复制数组到剪切板"
                            }
                          >
                            <IconButton
                              size="small"
                              aria-label={
                                http || display === "text"
                                  ? "复制文本"
                                  : "复制数组到剪切板"
                              }
                              onClick={() =>
                                props.copyText(
                                  !http && display === "text"
                                    ? new TextDecoder().decode(
                                        new Uint8Array(item.message),
                                      )
                                    : item.message,
                                )
                              }
                            >
                              <ContentCopy sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Typography
                          component="div"
                          sx={{
                            fontFamily: mono,
                            fontSize: 12,
                            lineHeight: 1.9,
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {http
                            ? item.message
                            : display === "hex"
                              ? hex(item.message)
                              : new TextDecoder().decode(
                                  new Uint8Array(item.message),
                                )}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </Box>
                {openCommand && !http && (
                  <Paper
                    aria-label="常用命令面板"
                    sx={{
                      position: "absolute",
                      inset: "0 0 0 auto",
                      width: "min(310px, 90%)",
                      borderLeft: "1px solid",
                      borderColor: "divider",
                      borderRadius: 0,
                      boxShadow: "-8px 0 24px #1a314410",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ flex: 1 }}>
                        常用命令
                      </Typography>
                      <Tooltip title="添加命令">
                        <IconButton
                          size="small"
                          aria-label="添加命令"
                          onClick={() => setOpenCommandDialog(true)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        aria-label="关闭命令面板"
                        onClick={() => setOpenCommand(false)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Box sx={{ flex: 1, overflow: "auto" }}>
                      <Command
                        data={props.commands}
                        sendMessage={send}
                        disabled={!canSend}
                      />
                    </Box>
                  </Paper>
                )}
              </Box>
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  px: 2.5,
                  minHeight: 34,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#fafcfd",
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  {http
                    ? device.state
                      ? "正在监听 HTTP 请求"
                      : "连接后开始监听 HTTP 请求"
                    : "仅显示当前设备的数据"}
                </Typography>
                <FormControlLabel
                  sx={{ mr: -1 }}
                  control={
                    <Switch
                      size="small"
                      checked={autoScroll}
                      onChange={(event) => setAutoScroll(event.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="caption" color="text.secondary">
                      自动滚动
                    </Typography>
                  }
                />
              </Stack>
              {!http && (
                <Box
                  sx={{
                    p: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TextField
                      select
                      value={encoding}
                      onChange={(event) => {
                        setEncoding(event.target.value);
                        setMessage("");
                      }}
                      SelectProps={{ native: true }}
                      inputProps={{ "aria-label": "发送编码" }}
                      sx={{
                        width: 90,
                        flexShrink: 0,
                        "& .MuiInputBase-input": { fontSize: 12 },
                      }}
                    >
                      <option value="hex">HEX</option>
                      <option value="text">UTF-8</option>
                    </TextField>
                    <TextField
                      fullWidth
                      value={message}
                      disabled={!canSend}
                      placeholder={
                        encoding === "hex"
                          ? "输入十六进制字节，如 01 0A FF"
                          : "输入 UTF-8 文本"
                      }
                      inputProps={{
                        "aria-label":
                          encoding === "hex" ? "16进制字符串" : "UTF-8 文本",
                      }}
                      sx={{
                        minWidth: 0,
                        "& input": { fontFamily: mono, fontSize: 12 },
                      }}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.nativeEvent.isComposing
                        )
                          submitMessage();
                      }}
                    />
                    <Button
                      variant="contained"
                      aria-label="发送"
                      disabled={!canSend || !message.trim()}
                      onClick={submitMessage}
                      startIcon={<Send sx={{ fontSize: "15px !important" }} />}
                    >
                      发送
                    </Button>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1, fontSize: 10 }}
                  >
                    {canSend
                      ? "Enter 发送 · 使用常用命令快速重发"
                      : "连接设备后即可发送数据"}
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                p: { xs: 2.5, md: 5 },
                overflow: "auto",
                m: "auto",
                width: "100%",
                maxWidth: 760,
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  p: 1.5,
                  bgcolor: "primary.light",
                  color: "primary.main",
                  borderRadius: 3,
                  mb: 2,
                }}
              >
                <HubOutlined sx={{ fontSize: 26 }} />
              </Box>
              <Typography variant="h5">每一次连接，都从这里开始</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, mb: 2 }}
              >
                添加或选择设备，开始通信测试
              </Typography>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                快速创建连接
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1.25,
                  mt: 1,
                }}
              >
                {protocols.map((protocol, index) => (
                  <Button
                    key={protocol.name}
                    variant="outlined"
                    onClick={() => openDevice(index)}
                    sx={{
                      p: 1.5,
                      justifyContent: "flex-start",
                      textAlign: "left",
                      color: "text.primary",
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "primary.light",
                        borderColor: "#aed5c9",
                      },
                    }}
                  >
                    <protocol.icon
                      sx={{ color: protocol.color, fontSize: 22, mr: 1.5 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2">
                        {protocol.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: 10, whiteSpace: "normal" }}
                      >
                        {protocol.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
      <DeviceDialog
        open={open}
        initialChannel={initialChannel}
        pending={props.deviceSaveStatus === "pending"}
        ports={props.ports}
        hidPaths={props.hidPaths}
        handleOpen={() => setOpen(false)}
        handleSubmite={saveDevice}
      />
      <CommandDialog
        open={openCommandDialog}
        pending={props.commandSaveStatus === "pending"}
        handleSubmite={saveCommand}
        close={() => setOpenCommandDialog(false)}
      />
      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>删除连接</DialogTitle>
        <DialogContent>
          <Typography sx={{ overflowWrap: "anywhere" }}>
            确定删除“{deleting?.name}”？连接配置和当前接收记录将被移除。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>取消</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              props.removeDevice(deleting.address);
              setDeleting(null);
            }}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
const mapDispatchToProps = (dispatch: any) => {
  return {
    initData: bindActionCreators(initData, dispatch),
    sendMessage: bindActionCreators(sendMessage, dispatch),
    addDevice: bindActionCreators(addDevice, dispatch),
    selectDevice: bindActionCreators(selectDevice, dispatch),
    connectDevice: bindActionCreators(connectDevice, dispatch),
    removeDevice: bindActionCreators(removeDevice, dispatch),
    getPorts: bindActionCreators(getPorts, dispatch),
    disConnectDevice: bindActionCreators(disConnectDevice, dispatch),
    clearDeviceMessage: bindActionCreators(clearDeviceMessage, dispatch),
    getHidDevices: bindActionCreators(getHidDevice, dispatch),
    copyText: bindActionCreators(copyText, dispatch),
    addCommand: bindActionCreators(addCommand, dispatch),
  };
};

const mapStateToProps = (state: any) => {
  return {
    devices: state.device.devices,
    messages: state.device.messages,
    selectedDevice: state.device.selectedDevice,
    ports: state.device.ports,
    hidPaths: state.device.hidPaths,
    commands: state.device.commands,
    deviceSaveStatus: state.device.deviceSaveStatus,
    commandSaveStatus: state.device.commandSaveStatus,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withSnackbar(Home));
