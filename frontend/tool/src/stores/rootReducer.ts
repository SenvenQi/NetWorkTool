import { combineReducers } from 'redux'
import device from './device/reducer';
import router from './router/reducer';
export default combineReducers({
    device,
    router
})