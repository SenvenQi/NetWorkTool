import {all, takeEvery} from 'redux-saga/effects'

function* connectDeviceAsync(action) {
    yield window.api.send('device/connectDevice', {
        address: action.data.address,
        deviceType: parseInt(action.data.deviceType),
        deviceChannelType: parseInt(action.data.deviceChannelType),
        options: {}
    })
}

function* sendMessageAsync(action) {
    yield window.api.send('device/sendMessage', {
        address: action.data.address,
        message: action.data.message
    })
}

function* copyText(action){
    yield window.api.send('device/copyToClipborard',action.data)
}

function* getPortsAsync() {
    yield window.api.send('device/getPorts')
}


function* removeDeviceAsync(action) {
    if (action.data) {
        yield window.api.send('device/removeDevice', action.data)
    }
}

function* addDeviceAsync(action) {
    if (action.data) {
        yield window.api.send('device/addDevice', action.data)
    }
}


function* initDataAsync() {
    yield window.api.send('device/loadData')
    yield window.api.send('device/loadCommand')
}

function* disConnectDeviceAsync(action) {
    yield window.api.send('device/closeDevice', action.data)
}

function* getHidDeviceAsync() {
    yield window.api.send('device/getHidDevices');
}

function* addCommandAsyc(action) {
    yield window.api.send('device/addCommand',action.data);
}

function* rootSaga() {
    yield all([
        yield takeEvery("GET_HID_DEVICE", getHidDeviceAsync),
        yield takeEvery("CONNECT_DEVICE", connectDeviceAsync),
        yield takeEvery("SEND_MESSAGE", sendMessageAsync),
        yield takeEvery("REMOVE_DEVICE", removeDeviceAsync),
        yield takeEvery("GET_PORTS", getPortsAsync),
        yield takeEvery("DIS_CONECT_DEVICE", disConnectDeviceAsync),
        yield takeEvery("ADD_DEVICE", addDeviceAsync),
        yield takeEvery("INIT_DATA", initDataAsync),
        yield takeEvery("COPY_TEXT", copyText),
        yield takeEvery("ADD_COMMAND", addCommandAsyc)
    ])
}

export default rootSaga
