import reducer from './reducer';
const first = {address:'a', state:true};
const second = {address:'b', state:true};
const state = {devices:[first, second], selectedDevice:first, messages:[]};
test('errors mark the device disconnected without changing selection', () => {
    const next = reducer(state, {type:'RECIVE_MESSAGE', data:{messageType:2, message:{address:'b', success:false}}});
    expect(next.devices[1].state).toBe(false);
    expect(next.selectedDevice.address).toBe('a');
    expect(second.state).toBe(true);
});
test('deleting selected device selects a remaining device and eventually null', () => {
    const next = reducer(state, {type:'CALL_BACK_REMOVE_DEVICE', data:'a'});
    expect(next.selectedDevice.address).toBe('b');
    expect(reducer(next, {type:'CALL_BACK_REMOVE_DEVICE', data:'b'}).selectedDevice).toBeNull();
});
test('selection does not mutate previous state', () => {
    reducer(state, {type:'SELECT_DEVICE', data:{address:'b'}});
    expect(first).toEqual({address:'a', state:true});
});
test('receive history is bounded', () => {
    const next = reducer({...state, messages:Array(1000).fill({})}, {type:'RECIVE_MESSAGE', data:{messageType:0, message:{address:'a'}}});
    expect(next.messages).toHaveLength(1000);
});
test('reloading device data restores live states and preserves the selected address', () => {
    const next = reducer({...state, selectedDevice:second}, {type:'CALL_BACK_INIT_DATA', data:[
        {address:'a', name:'A', state:false, type:0, channelType:0},
        {address:'b', name:'B', state:true, type:0, channelType:0},
    ]});
    expect(next.selectedDevice.address).toBe('b');
    expect(next.selectedDevice.state).toBe(true);
});
test('operation errors without a disconnect flag preserve connection state', () => {
    const next = reducer(state, {type:'RECIVE_MESSAGE', data:{messageType:2, message:{address:'a', info:'send failed'}}});
    expect(next.selectedDevice.state).toBe(true);
});
test('device save failure permits retry and only success marks the dialog complete', () => {
    const pending = reducer(undefined, {type: 'ADD_DEVICE'});
    expect(pending.deviceSaveStatus).toBe('pending');
    const failed = reducer(pending, {type: 'REQUEST_FAILED', data: {actionType: 'ADD_DEVICE', message: 'invalid port'}});
    expect(failed.deviceSaveStatus).toBe('failed');
    expect(failed.devices).toEqual([]);
    const retry = reducer(failed, {type: 'ADD_DEVICE'});
    const saved = reducer(retry, {type: 'CALL_BACK_ADD_DEVICE', data: {address: 'localhost:1234', name: 'test', type: 0, channelType: 0}});
    expect(saved.deviceSaveStatus).toBe('success');
    expect(saved.devices).toHaveLength(1);
});
test('unrelated request failures do not complete or cancel a pending command save', () => {
    const pending = reducer(undefined, {type: 'ADD_COMMAND'});
    const unrelated = reducer(pending, {type: 'REQUEST_FAILED', data: {actionType: 'GET_PORTS', message: 'unavailable'}});
    expect(unrelated.commandSaveStatus).toBe('pending');
    const failed = reducer(unrelated, {type: 'REQUEST_FAILED', data: {actionType: 'ADD_COMMAND', message: 'invalid hex'}});
    expect(failed.commandSaveStatus).toBe('failed');
    const saved = reducer(reducer(failed, {type: 'ADD_COMMAND'}), {type: 'CALL_BACK_ADD_COMMAND', data: {id: 1, name: 'test', hexString: [0]}});
    expect(saved.commandSaveStatus).toBe('success');
    expect(saved.commands).toHaveLength(1);
});
