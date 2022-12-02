import { actionTypes } from './actions'
import IndexPage from '../../pages/IndexPage';

const initialState = {
  path: "/",
  pages:[{
    path: "/",
    name:"网络测试工具",
    component: IndexPage,
  }]
}

function reducer(state: any = initialState, action: any) {
  switch (action.type) {
    case actionTypes.PUSH:
      return {
        ...state,
        path: action.path
      }
    default:
      return state
  }
}

export default reducer
