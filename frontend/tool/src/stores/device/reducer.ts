import {actionTypes} from './actions'
import {MessageType} from "../../models/messageType";

const initialState = {
    error: false,
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
            let selectDevice = null;
            if (action.data.length > 0) {
                selectDevice = {
                    deviceType: action.data[0].type,
                    state: false,
                    name: action.data[0].name,
                    selected: false,
                    deviceChannelType: action.data[0].channelType,
                    address: action.data[0].address
                };
            }
            return {
                ...state,
                selectedDevice:selectDevice,
                devices: action.data.map((item: any) => {
                    return {
                        deviceType: item.type,
                        state: false,
                        name: item.name,
                        selected: false,
                        deviceChannelType: item.channelType,
                        address: item.address
                    }
                })
            }
        case actionTypes.RECIVE_MESSAGE:
            switch (action.data.messageType) {
                case MessageType.Info:
                    return {
                        ...state,
                        messages: [...state.messages,action.data.message]
                    }
                case MessageType.ChangeState || MessageType.Error:
                    const tempDevices = state.devices.map((device: any) => {
                        if (device.address === action.data.message.address) {
                            return {...device, state: action.data.message.success}
                        }
                        return device;
                    });
                    const tempSelectedDevice = tempDevices.find((item: any) => item.address == action.data.message.address);
                    return {
                        ...state,
                        devices: tempDevices,
                        selectedDevice: tempSelectedDevice
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
                devices: [...state.devices.map((item: any) => {
                    item.selected = false
                    return item
                }), device],
                selectedDevice: device
            };
        case actionTypes.CALL_BACK_REMOVE_DEVICE:
            if (action.data) {
                let selectDevice = null;
                if (state.devices.length > 0) {
                    selectDevice = state.devices[0];
                }
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
                devices: state.devices.map((item: any) => {
                    item.selected = item.address == action.data.address;
                    return item
                }),
                selectedDevice: state.devices.find((item: any) => item.address == action.data.address)
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
