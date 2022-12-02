export const actionTypes = {
    SEND_MESSAGE: 'SEND_MESSAGE',
    ADD_DEVICE: 'ADD_DEVICE',
    REMOVE_DEVICE: 'REMOVE_DEVICE',
    RECIVE_MESSAGE: 'RECIVE_MESSAGE',
    SET_PORTS: 'SET_PORTS',
    INIT_DATA: "INIT_DATA",
    GET_PORTS: 'GET_PORTS',
    DIS_CONECT_DEVICE: 'DIS_CONECT_DEVICE',
    GET_HID_DEVICE: 'GET_HID_DEVICE',
    SET_HID_DEVCIE: 'SET_HID_DEVCIE',
    CALL_BACK_ADD_DEVICE: 'CALL_BACK_ADD_DEVICE',
    CALL_BACK_REMOVE_DEVICE: 'CALL_BACK_REMOVE_DEVICE',
    CONNECT_DEVICE: 'CONNECT_DEVICE',
    SELECT_DEVICE: 'SELECT_DEVICE',
    CALL_BACK_INIT_DATA: 'CALL_BACK_INIT_DATA',
    CLEAR_DEVICE_MESSAGE: 'CLEAR_DEVICE_MESSAGE',
    LOAD_COMMAND: 'CALL_BACK_INIT_COMMAND_DATA',
    CALL_BACK_ADD_COMMAND:'CALL_BACK_ADD_COMMAND',
    COPY_TEXT:"COPY_TEXT",
    ADD_COMMAND:"ADD_COMMAND"
}

export function addCallBackCommand(data: any) {
    return {
        type: actionTypes.CALL_BACK_ADD_COMMAND,
        data
    }
}

export function addCommand(data: any) {
    return {
        type: actionTypes.ADD_COMMAND,
        data
    }
}

export function initData(data: any) {
    return {
        type: actionTypes.INIT_DATA,
        data
    }
}

export function copyText(data: any) {
    return {
        type: actionTypes.COPY_TEXT,
        data
    }
}

export function getHidDevice() {
    return {
        type: actionTypes.GET_HID_DEVICE
    }
}

export function clearDeviceMessage(data: any) {
    return {
        type: actionTypes.CLEAR_DEVICE_MESSAGE,
        data
    }
}

export function disConnectDevice(data: any) {
    return {
        type: actionTypes.DIS_CONECT_DEVICE,
        data
    }
}

export function getPorts() {
    return {
        type: actionTypes.GET_PORTS
    }
}

export function setPorts(data: any) {
    return {
        type: actionTypes.SET_PORTS,
        data
    }
}

export function removeDevice(data: any) {
    return {
        type: actionTypes.REMOVE_DEVICE,
        data,
    }
}

export function connectDevice(data: any) {
    return {
        type: actionTypes.CONNECT_DEVICE,
        data,
    }
}

export function sendMessage(data: any) {
    return {
        type: actionTypes.SEND_MESSAGE,
        data,
    }
}

export function selectDevice(data: any) {
    return {
        type: actionTypes.SELECT_DEVICE,
        data,
    }
}

export function loadCommand(data: any) {
    return {
        type: actionTypes.LOAD_COMMAND,
        data,
    }
}

export function addDevice(data: any) {
    return {
        type: actionTypes.ADD_DEVICE,
        data,
    }
}

export function recieveMessage(data: any) {
    return {
        type: actionTypes.RECIVE_MESSAGE,
        data,
    }
}
