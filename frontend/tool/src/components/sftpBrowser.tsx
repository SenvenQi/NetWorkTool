import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowForward,
  Refresh,
  Upload,
  Download,
  CreateNewFolderOutlined,
  DriveFileRenameOutline,
  DeleteOutline,
  FolderOutlined,
  InsertDriveFileOutlined,
  Link as LinkIcon,
} from "@mui/icons-material";
import { mono } from "../styles/mainTheme";
import { remoteError } from "./remoteConnectDialog";

type Entry = {
  name: string;
  size: number;
  modified: number;
  directory: boolean;
  link: boolean;
};
const join = (base: string, name: string) =>
  `${base.replace(/\/$/, "")}/${name}`;
const sizeLabel = (size: number) => {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const index = Math.min(
    4,
    size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0,
  );
  return `${(size / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

export default function SftpBrowser({ device, notify }: any) {
  const [directory, setDirectory] = useState(".");
  const [pathInput, setPathInput] = useState(".");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [transfer, setTransfer] = useState<any>(null);
  const [operation, setOperation] = useState("");
  const [name, setName] = useState("");
  const generation = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const unsubscribe = window.api.receive("PackageMessage", (event: any) => {
      if (
        event.type === "REMOTE_TRANSFER" &&
        event.data.address === device.address
      )
        setTransfer(event.data);
    });
    return () => {
      alive.current = false;
      generation.current++;
      unsubscribe();
    };
  }, [device.address]);
  const load = async (target: string) => {
    const token = ++generation.current;
    setBusy(true);
    try {
      const result = await window.api.send("device/sftpAction", {
        address: device.address,
        action: "list",
        path: target,
      });
      if (alive.current && generation.current === token) {
        setDirectory(result.path);
        setPathInput(result.path);
        setEntries(result.entries);
        setSelected(null);
      }
    } catch (error) {
      if (alive.current && generation.current === token)
        notify(remoteError(error), "error");
    } finally {
      if (alive.current && generation.current === token) setBusy(false);
    }
  };
  useEffect(() => {
    if (device.state) void load(".");
    else {
      generation.current++;
      setEntries([]);
      setSelected(null);
      setBusy(false);
    }
    // A reconnect starts at the account's home directory.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.state]);
  const transferFile = async (direction: string) => {
    setBusy(true);
    setTransfer(null);
    try {
      const result = await window.api.send("device/sftpTransfer", {
        address: device.address,
        direction,
        path:
          direction === "upload" ? directory : join(directory, selected!.name),
      });
      if (result && alive.current) {
        notify(direction === "upload" ? "上传完成" : "下载完成", "success");
        await load(directory);
      }
    } catch (error) {
      if (alive.current) notify(remoteError(error), "error");
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const mutate = async () => {
    if (
      operation !== "remove" &&
      (!name.trim() ||
        name.includes("/") ||
        name.includes("\0") ||
        name === "." ||
        name === "..")
    ) {
      notify("请输入有效名称，不能包含 /", "error");
      return;
    }
    setBusy(true);
    try {
      await window.api.send("device/sftpAction", {
        address: device.address,
        action: operation,
        path:
          operation === "mkdir"
            ? join(directory, name)
            : join(directory, selected!.name),
        destination: join(directory, name),
      });
      if (alive.current) {
        setOperation("");
        await load(directory);
      }
    } catch (error) {
      if (alive.current) notify(remoteError(error), "error");
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  if (!device.state)
    return (
      <Typography sx={{ p: 3 }} color="text.secondary">
        连接 SFTP 后浏览远端文件
      </Typography>
    );
  const transferring = transfer?.status === "running";
  return (
    <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, pt: 2.5, pb: 1.5, alignItems: "center" }}
      >
        <Tooltip title="返回上级">
          <span>
            <IconButton
              aria-label="上级"
              disabled={busy || directory === "/"}
              onClick={() => load(join(directory, ".."))}
            >
              <ArrowUpward sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          label="远端路径"
          size="small"
          value={pathInput}
          disabled={busy}
          onChange={(event) => setPathInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void load(pathInput);
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            "& input": { fontFamily: mono, fontSize: 12 },
          }}
        />
        <Tooltip title="前往路径">
          <span>
            <IconButton
              aria-label="前往"
              disabled={busy}
              onClick={() => load(pathInput)}
            >
              <ArrowForward sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Stack
        direction="row"
        useFlexGap
        flexWrap="wrap"
        spacing={1}
        sx={{ px: 2, pb: 2, alignItems: "center" }}
      >
        <Tooltip title="刷新">
          <span>
            <IconButton
              size="small"
              aria-label="刷新"
              disabled={busy}
              onClick={() => load(directory)}
            >
              <Refresh sx={{ fontSize: 19 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Button
          size="small"
          variant="contained"
          startIcon={<Upload />}
          disabled={busy}
          onClick={() => transferFile("upload")}
        >
          上传
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Download />}
          disabled={busy || !selected || selected.directory}
          onClick={() => transferFile("download")}
        >
          下载
        </Button>
        <Tooltip title="新建目录">
          <span>
            <IconButton
              size="small"
              aria-label="新建目录"
              disabled={busy}
              onClick={() => {
                setName("");
                setOperation("mkdir");
              }}
            >
              <CreateNewFolderOutlined sx={{ fontSize: 19 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="重命名">
          <span>
            <IconButton
              size="small"
              aria-label="重命名"
              disabled={busy || !selected}
              onClick={() => {
                setName(selected!.name);
                setOperation("rename");
              }}
            >
              <DriveFileRenameOutline sx={{ fontSize: 19 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="删除">
          <span>
            <IconButton
              size="small"
              aria-label="删除"
              disabled={busy || !selected}
              color="error"
              onClick={() => setOperation("remove")}
            >
              <DeleteOutline sx={{ fontSize: 19 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      {busy && !transferring && <LinearProgress />}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table
          stickyHeader
          size="small"
          aria-label="远端文件"
          sx={{ tableLayout: "fixed" }}
        >
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell sx={{ width: 110, whiteSpace: "nowrap" }}>
                大小
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.name}
                hover
                selected={selected?.name === entry.name}
                tabIndex={busy ? -1 : 0}
                onClick={() => {
                  if (!busy) setSelected(entry);
                }}
                onDoubleClick={() => {
                  if (!busy && (entry.directory || entry.link))
                    void load(join(directory, entry.name));
                }}
                onKeyDown={(event) => {
                  if (!busy && event.key === "Enter") {
                    setSelected(entry);
                    if (entry.directory || entry.link)
                      void load(join(directory, entry.name));
                  }
                }}
                sx={{
                  cursor: "pointer",
                  "&.Mui-selected": { bgcolor: "#eaf5f1" },
                  "&.Mui-selected:hover": { bgcolor: "#e1f1eb" },
                }}
              >
                <TableCell
                  title={entry.name}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    {entry.directory ? (
                      <FolderOutlined sx={{ fontSize: 20, color: "#b39358" }} />
                    ) : entry.link ? (
                      <LinkIcon
                        sx={{ fontSize: 19, color: "text.secondary" }}
                      />
                    ) : (
                      <InsertDriveFileOutlined
                        sx={{ fontSize: 19, color: "#8d9baa" }}
                      />
                    )}
                    <Typography variant="body2" noWrap title={entry.name}>
                      {entry.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{
                    whiteSpace: "nowrap",
                    fontFamily: mono,
                    color: "text.secondary",
                    fontSize: 11,
                  }}
                >
                  {entry.directory ? "目录" : sizeLabel(entry.size)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!busy && entries.length === 0 && (
          <Typography sx={{ p: 2 }} color="text.secondary">
            目录为空
          </Typography>
        )}
      </Box>
      <Stack
        direction="row"
        sx={{
          px: 2,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "#fafcfd",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {entries.length} 个项目{selected ? ` · 已选择 ${selected.name}` : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          双击打开目录
        </Typography>
      </Stack>
      {transfer && (
        <Box
          sx={{
            p: 2,
            bgcolor: "#f5faf8",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <LinearProgress
            variant="determinate"
            value={
              transfer.total
                ? Math.min(100, (transfer.completed / transfer.total) * 100)
                : transfer.status === "complete"
                  ? 100
                  : 0
            }
          />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="caption">
              {transfer.direction === "upload" ? "上传" : "下载"}{" "}
              {sizeLabel(transfer.completed)} / {sizeLabel(transfer.total)} ·{" "}
              {
                (
                  {
                    running: "传输中",
                    complete: "已完成",
                    cancelled: "已取消",
                    failed: "失败",
                  } as Record<string, string>
                )[transfer.status]
              }
            </Typography>
            {transferring && (
              <Button
                size="small"
                onClick={() =>
                  window.api
                    .send("device/cancelSftpTransfer", device.address)
                    .catch((error: any) => notify(remoteError(error), "error"))
                }
              >
                取消传输
              </Button>
            )}
          </Stack>
        </Box>
      )}
      <Dialog
        open={!!operation}
        onClose={busy ? undefined : () => setOperation("")}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {
            (
              {
                mkdir: "新建目录",
                rename: "重命名",
                remove: "确认删除",
              } as Record<string, string>
            )[operation]
          }
        </DialogTitle>
        <DialogContent>
          {operation === "remove" ? (
            <Typography sx={{ overflowWrap: "anywhere" }}>
              删除“{selected?.name}”？目录仅支持删除空目录。
            </Typography>
          ) : (
            <TextField
              autoFocus
              fullWidth
              label="新名称"
              sx={{ mt: 1 }}
              value={name}
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOperation("")}>
            取消
          </Button>
          <Button
            variant="contained"
            disabled={busy}
            color={operation === "remove" ? "error" : "primary"}
            onClick={mutate}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
