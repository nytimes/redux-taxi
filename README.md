# redux-taxi :taxi:

> NOTE: We're in the process of refactoring to reflect the new name, `redux-taxi` from the internally used name, `AsyncRegister`.

The AsyncRegister provides a mechanism to signal to the server when it should wait for asynchronous actions to complete before processing and sending the initial markup to the client.

## Use case

When you have asynchronous actions that you want to be processed on the server (at instantiation time, e.g. in the `constructor`) before responding to the client, you'll need to explicitly register them to avoid an `Error` being thrown. The motivation behind this throw is explained later in this document.

## Usage

###### Decorator
```js
/* SomePage.jsx */

// ...
import {SOME_ASYNC_ACTION} from 'action/types';
import {registerAsyncActions} from '../AsyncRegister';

@registerAsyncActions(SOME_ASYNC_ACTION)
@connect( // ... usual store connection decorator
    state => state.somePageState,
    SomePageActions
)
export default class SomePage extends Component {

    constructor(props, context) {
        super(props, context);

        // Dispatch async action
        this.props.someAsyncAction(this.props.data);
    }

    // ... render() and other methods
}
```

If you're not using ES7 style decorators, you could also call it and export like so:
```js
class SomePage extends Component {
    // ...
}

export default registerAsyncActions(SOME_ASYNC_ACTION)(connect(
    state => state.somePageState,
    somePageActions
)(SomePage))
```

But this is obviously awkward, and ES7 decorators are recommended :)

###### Asynchronous Action Format

Currently, `AsyncRegister` expects asynchronous actions to have a `promise` property attached to them.

> TODO: In the future, we may be able to make this configurable by adding a 'promise' check function that can be passed in to do the sniffing/collecting of promises.

```js
/* SomePageActions.js */

import {SOME_ASYNC_ACTION} from 'action/types';
import api from 'api';

export function someAsyncAction(data) {
    return {
        type: SOME_ASYNC_ACTION,
        promise: api.someAsyncRequest(data) // Promise collected by AsyncRegister
    };
}
```

### Server Setup

Since `AsyncRegister` is not opinionated about how your server rendering works, it's left up to you to wire in the functionality.

> TODO: This may change as this project grows and if common patterns start to emerge it may be provided for you, but for now it's up to you. Below is an example of how your server-rending might make use of `AsyncRegister`:

```js
/* server.js */
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import express from 'express';

// redux imports
import {Provider} from 'react-redux';

// react-router imports
import {match, RouterContext} from 'react-router';

// app imports
import configureStore from './store/configureStore'; // Your store configurator

const server = express();
server.use((req, res) => {
    match({routes, location}, (error, redirectLocation, renderProps) => {
        // ... some error handling ...

        if (renderProps) {
            const asyncRegister = AsyncRegister();

            // Your configureStore signature may be different, but here we are passing asyncRegister as part of an object with a property name of `asyncRegister`
            // to signal to configureStore to include it when configuring the store for the server (as opposed to the client where asyncRegister is not needed,
            // and something else may be provided, e.g. browserHistory). This allows us to write configureStore in an "isomorphic" fashion, without having
            // to explicitly signal that its running in server or client contexts.
            const store = configureStore(initialState, {asyncRegister});

            const initialComponent = (
                <Provider store={store}>
                    <AsyncRegisterProvider asyncRegister={asyncRegister}>
                        <RouterContext {...renderProps} />
                    </AsyncRegisterProvider>
                </Provider>
            );

            // Render once to instantiate all components (at the given route)
            // and collect any promises that may be registered.
            let content = ReactDOMServer.renderToString(initialComponent);

            const allPromises = asyncRegister.getAllPromises();
            if (allPromises.length) {
                // If we have some promises, we need to delay server rendering
                Promise
                    .all(allPromises)
                    .then(() => {
                        content = ReactDOMServer.renderToString(initialComponent);
                        res.end(content)
                    })
                    .catch(() => {
                        // some error happened, respond with error page
                    })
            } else {
                // otherwise, we can just respond with our rendered app
                res.end(content);
            }
        }
    });
});
```

### configureStore

Your configure store just needs to apply the `AsyncRegisterMiddleware` with the `AsyncRegister` instance passed in from server.js. Here's a real-world example:

```js
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {syncHistory} from 'react-router-redux';
import {AsyncRegisterMiddleware, PromiseMiddleware} from 'AsyncRegister';
import rootReducer from './reducers'; // Your app reducers

export default function configureStore(initialState, instance) {
    const middleware = applyMiddleware(
        // In a server context, asyncRegister will be provided,
        // in a client context, history will be provided.
        // This keeps configureStore "isomorphic" in the sense that it's basically unaware of what context it's being rendered in.
        instance.asyncRegister ? AsyncRegisterMiddleware(instance.asyncRegister) : syncHistory(instance.history),

        // You do not have to use `AsyncRegister`'s PromiseMiddleware, but it's provided for convenience
        // TODO: Should we actually provide this?
        PromiseMiddleware,

        // Your other middleware...
        thunk
    );

    return createStore(rootReducer, initialState, middleware);
}
```

## Motivation

Because `ReactDOMServer.renderToString()` is synchronous, we need a way to signal to the server that it should wait for any asynchronous actions to complete before responding to the client. Without this, asynchronous actions will be fired and forgotten.

#### But why the `@registerAsyncActions()` decorator?

We wanted the decision to slow the server response down to be a very deliberate decision. To achieve this, we opted for a simple decorator where you can explicitly register which asynchronous actions you want to allow to slow down server rendering. Without explicitly registering your asynchronous actions, a fatal `Error` will be thrown.

#### Ok, but what if I don't want to block the server rendering, but fire the action as soon as the page loads?

Simply put your action dispatching in `componentDidMount()` lifecycle method, since this method only executes in a client context. This actually follows Facebook's recommended pattern.

```js
/* SomePage.jsx
   (Modified to only dispatch async action on client)
*/

// (Notice no need to import action type and ../AsyncRegister)

@connect( // ... usual store connection decorator
    state => state.somePageState,
    SomePageActions
)
export default class SomePage extends Component {

    // This will only execute in a client context
    componentDidMount() {
        // Dispatch async action
        this.props.someAsyncAction(this.props.data);
    }

    // ... render() and other methods
}
```

## How does it work?

All the code can be inspected in `../AsyncRegister/*`, but in a nutshell, there's special middleware (`AsyncRegisterMiddleware.js` along with `PromiseMiddleware.js`) that intercepts all actions that have a `promise` defined and checks to see if they're registered with `AsyncRegister.js` (which is provided at the request-level via `AsyncRegisterProvider.js`). Then, when rendering on the server, any promises that have been collected will be `.all().then()`'d and then the server re-renders the markup and finally responds to the client.

>NOTE: This re-rendering (rendering twice) is necessary because React does not currently provide a way to instantiate React Components without actually rendering them to something (e.g. the `constructor` does not get called). To mitigate any (albeit marginal) time cost to this, the re-rendering should _only_ be done when there are actually asynchronous actions that fired. A completely synchronous page should render immediately.
