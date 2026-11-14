import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { remoteError } from "./remoteConnectDialog";

export default function SshTerminal({ device, onError }: any) {
  const container = useRef<HTMLDivElement>(null);
  const connected = useRef(device.state);
  connected.current = device.state;
  const errorHandler = useRef(onError);
  errorHandler.current = onError;
  useEffect(() => {
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      scrollback: 5000,
      theme: {
        background: "#111e28",
        foreground: "#d3e4ed",
        cursor: "#70d5b4",
        selectionBackground: "#32545d",
      },
      allowProposedApi: false,
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container.current!);
    let active = true;
    let initialized = false;
    let session = "";
    let sequence = 0;
    const queued: any[] = [];
    const output = (data: any) => {
      if (!active) return;
      if (data.sessionId !== session) {
        session = data.sessionId;
        sequence = 0;
        terminal.reset();
      }
      if (data.sequence <= sequence) return;
      sequence = data.sequence;
      terminal.write(new Uint8Array(data.bytes));
    };
    const unsubscribe = window.api.receive("PackageMessage", (event: any) => {
      if (
        event.type === "REMOTE_OUTPUT" &&
        event.data.address === device.address
      ) {
        initialized ? output(event.data) : queued.push(event.data);
      }
      if (
        event.type === "RECIVE_MESSAGE" &&
        event.data.message?.address === device.address &&
        event.data.message.success === true
      )
        resize();
    });
    window.api
      .send("device/remoteSnapshot", device.address)
      .then((snapshot: any) => {
        if (!active) return;
        session = snapshot.sessionId;
        sequence = snapshot.sequence;
        terminal.write(new Uint8Array(snapshot.bytes));
        initialized = true;
        queued.forEach(output);
        queued.length = 0;
      })
      .catch((error: any) => {
        if (active) {
          initialized = true;
          queued.forEach(output);
          errorHandler.current(remoteError(error));
        }
      });
    const input = terminal.onData((text) => {
      if (connected.current)
        window.api
          .send("device/remoteWrite", { address: device.address, text })
          .catch((error: any) => errorHandler.current(remoteError(error)));
    });
    function resize() {
      if (
        !active ||
        !container.current?.clientWidth ||
        !container.current?.clientHeight
      )
        return;
      fit.fit();
      window.api
        .send("device/remoteResize", {
          address: device.address,
          cols: terminal.cols,
          rows: terminal.rows,
        })
        .catch(() => {});
    }
    const observer = new ResizeObserver(resize);
    observer.observe(container.current!);
    resize();
    return () => {
      active = false;
      unsubscribe();
      observer.disconnect();
      input.dispose();
      terminal.dispose();
    };
  }, [device.address]);
  return (
    <Box
      role="region"
      aria-label="SSH 终端"
      ref={container}
      sx={{
        height: "100%",
        minHeight: 0,
        p: 1,
        bgcolor: "#111e28",
        overflow: "hidden",
      }}
    />
  );
}
