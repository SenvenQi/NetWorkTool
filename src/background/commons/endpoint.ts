export function parsePort(value: string): number {
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
        throw new Error("端口必须为 1 到 65535 的整数");
    }
    return Number(value);
}
export function parseEndpoint(value: string): { host: string; port: number } {
    const match = /^(?:\[([^\]]+)\]|([^:\s]+)):(\d+)$/.exec(value);
    if (!match) throw new Error("地址格式应为 host:port 或 [IPv6]:port");
    return { host: match[1] || match[2], port: parsePort(match[3]) };
}
