import {all, takeEvery, call, put} from 'redux-saga/effects'

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

function* safely(worker, action) {
    try {
        yield call(worker, action);
    } catch (error) {
        yield put({type: "REQUEST_FAILED", data: {message: error.message || String(error)}});
    }
}

function* rootSaga() {
    yield all([
        takeEvery("GET_HID_DEVICE", safely, getHidDeviceAsync),
        takeEvery("CONNECT_DEVICE", safely, connectDeviceAsync),
        takeEvery("SEND_MESSAGE", safely, sendMessageAsync),
        takeEvery("REMOVE_DEVICE", safely, removeDeviceAsync),
        takeEvery("GET_PORTS", safely, getPortsAsync),
        takeEvery("DIS_CONECT_DEVICE", safely, disConnectDeviceAsync),
        takeEvery("ADD_DEVICE", safely, addDeviceAsync),
        takeEvery("INIT_DATA", safely, initDataAsync),
        takeEvery("COPY_TEXT", safely, copyText),
        takeEvery("ADD_COMMAND", safely, addCommandAsyc)
    ])
}

export default rootSaga
