  export const actionTypes = {
    PUSH: 'PUSH',
  }
  

  export function push(path: string) {
    return {
      type: actionTypes.PUSH,
      path,
    }
  }
