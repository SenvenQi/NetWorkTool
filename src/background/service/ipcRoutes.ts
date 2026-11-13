export const deviceActions = new Set([
    "close", "min", "max", "addDevice", "addCommand", "loadCommand", "copyToClipborard",
    "connectDevice", "closeDevice", "removeDevice", "sendMessage", "loadData", "getHidDevices", "getPorts"
]);
export function getDeviceAction(route: unknown): string {
    if (typeof route !== "string" || !route.startsWith("device/") || !deviceActions.has(route.slice(7))) {
        throw new Error("Unknown device action");
    }
    return route.slice(7);
}
