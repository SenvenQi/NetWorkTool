import {actionTypes} from './actions'
import {MessageType} from "../../models/messageType";

const initialState = {
    error: false,
    requestError: null,
    devices: [],
    messages: [],
    selectedMessages: [],
    ports: [],
    selectedDevice: null,
    hidPaths: [],
    commands: []
}

function reducer(state: any = initialState, action: any) {

    switch (action.type) {
        case "REQUEST_FAILED":
            return {...state, requestError: action.data};
        case actionTypes.CALL_BACK_ADD_COMMAND:
            return {
                ...state,
                commands:[...state.commands,action.data]
            }
        case actionTypes.SET_HID_DEVCIE:
            return {
                ...state,
                hidPaths: action.data
            }
        case actionTypes.CALL_BACK_INIT_DATA:
            const loadedDevices = action.data.map((item: any) => ({
                deviceType: item.type,
                state: item.state === true,
                name: item.name,
                selected: false,
                deviceChannelType: item.channelType,
                address: item.address
            }));
            return {
                ...state,
                selectedDevice: loadedDevices.find((item: any) => item.address === state.selectedDevice?.address) ?? loadedDevices[0] ?? null,
                devices: loadedDevices
            };
        case actionTypes.RECIVE_MESSAGE:
            switch (action.data.messageType) {
                case MessageType.Info:
                    return {
                        ...state,
                        messages: [...state.messages,action.data.message].slice(-1000)
                    }
                case MessageType.ChangeState:
                case MessageType.Error:
                    const tempDevices = state.devices.map((device: any) => {
                        if (device.address === action.data.message.address && typeof action.data.message.success === "boolean") {
                            return {...device, state: action.data.message.success}
                        }
                        return device;
                    });
                    const tempSelectedDevice = tempDevices.find((item: any) => item.address === state.selectedDevice?.address);
                    return {
                        ...state,
                        devices: tempDevices,
                        selectedDevice: tempSelectedDevice ?? null
                    }
                default:
                    return state;
            }
        case actionTypes.CALL_BACK_ADD_DEVICE:
            const device = {
                deviceType: action.data.type,
                state: false,
                name: action.data.name,
                selected: false,
                deviceChannelType: action.data.channelType,
                address: action.data.address
            }
            return {
                ...state,
                devices: [...state.devices.map((item: any) => ({...item, selected: false})), device],
                selectedDevice: device
            };
        case actionTypes.CALL_BACK_REMOVE_DEVICE:
            if (action.data) {
                const remaining = state.devices.filter((item: any) => item.address !== action.data);
                const selectDevice = remaining.find((item: any) => item.address === state.selectedDevice?.address) ?? remaining[0] ?? null;
                return {
                    ...state,
                    devices: state.devices.filter((item: any) => {
                        return item.address !== action.data
                    }),
                    selectedDevice: selectDevice,
                    messages: state.messages.filter((item: any) => item.address !== action.data)
                }
            }
            return state;
        case actionTypes.SELECT_DEVICE:
            return {
                ...state,
                devices: state.devices.map((item: any) => ({...item, selected: item.address === action.data.address})),
                selectedDevice: state.devices.find((item: any) => item.address === action.data.address)
            };
        case actionTypes.SET_PORTS:
            return {
                ...state,
                ports: action.data
            };
        case actionTypes.CLEAR_DEVICE_MESSAGE:
            return {
                ...state,
                messages: state.messages.filter((item: any) => item.address !== action.data)
            }
        case actionTypes.LOAD_COMMAND:
            return {
                ...state,
                commands: action.data
            }
        default:
            return state
    }
}

export default reducer
