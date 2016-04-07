/**
* ReduxTaxiMiddleware
*
* This middleware will Register asynchronous actions (actions with a 'promise')
* and throw an error when unregistered ones are dispatched.
*
* NOTE: This middleware needs to be first on the middleware chain
* e.g. before the PromiseMiddleware so that it can see and act on the 'promise'
* property and handle appropriately. If this is placed after PromiseMiddleware
* it will never see the asynchronous action.
*
* Also note, this middleware is only needed on the server.
*
* @param {object} reduxTaxi - an instance of ../ReduxTaxi
* @returns {function} Redux-compliant middleware
*
**/
export default function ReduxTaxiMiddleware(reduxTaxi) {
    return () => next => action => {
        const {promise, type} = action;

        if (!promise) {
            return next(action);
        }

        if (reduxTaxi.isRegistered(type)) {
            reduxTaxi.collectPromise(promise);
        } else {
            throw new Error(
`The async action ${type} was dispatched in a server context without being explicitly registered.

This usually means an asynchronous action (an action that contains a Promise) was dispatched in a component's instantiation.

If you DON'T want to delay pageload rendering on the server, consider moving the dispatch to the React component's componentDidMount() lifecycle method (which only executes in a client context).

If you DO want to delay the pageload rendering and wait for the action to resolve (or reject) on the server, then you must explicitly register this action via the @registerAsyncActions decorator.
    Like so:
    @registerAsyncActions(${type})
`
            );
        }

        return next(action);
    };
}
