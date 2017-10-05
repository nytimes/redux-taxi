/**
* ReduxTaxi
*
* Returns the ReduxTaxi instance to be instantiated server-side and passed to the middleware.
*
**/

export default function ReduxTaxi() {
  const registeredActions = new Set();
  const promises = [];

  return {
    register(actionType) {
      registeredActions.add(actionType);
    },

    getRegisteredActions() {
      return registeredActions;
    },

    isRegistered(actionType) {
      return registeredActions.has(actionType);
    },

    collectPromise(promise) {
      promises.push(promise);
    },

    getAllPromises() {
      return promises;
    },
  };
}
