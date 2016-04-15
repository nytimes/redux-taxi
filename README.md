# redux-taxi :taxi:

ReduxTaxi allows for component-driven asynchronous server-side rendering in isomorphic/universal React+Redux apps.

## Use case

When you have asynchronous actions that you want to be processed on the server (at instantiation time, e.g. in the `constructor`) before responding to the client, you'll need to explicitly register them to avoid an `Error` being thrown. The motivation behind this throw is explained later in this document.

## Installation

```
npm install --save redux-taxi
```

## Usage

Use the decorator to signal at the component level when the component relies on an asynchronous action server-side.

###### Decorator
```js
/* SomePage.jsx */
import SomePageActions from 'action/SomePageActions';
import {SOME_ASYNC_ACTION} from 'action/types';
import {registerAsyncActions} from 'redux-taxi';

// explicitly register the async action
@registerAsyncActions(SOME_ASYNC_ACTION)
// usual redux store connection decorator
@connect(state => state.somePageState, SomePageActions)
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

Currently, `ReduxTaxi` expects asynchronous actions to have a `promise` property attached to them. The `PromiseMiddleware` is provided for convenience, but you're free to use your own. `ReduxTaxi` detects promises by looking for `action.promise`.

> TODO: In the future, we may be able to make this configurable by adding a 'promise' check function that can be passed in to do the sniffing/collecting of promises.

```js
/* SomePageActions.js */

import {SOME_ASYNC_ACTION} from 'action/types';
import api from 'api';

export function someAsyncAction(data) {
    return {
        type: SOME_ASYNC_ACTION,
        promise: api.someAsyncRequest(data) // Promise collected by ReduxTaxi
    };
}
```

### Server Setup

Since `ReduxTaxi` is not opinionated about how your server rendering works, it's left up to you to wire in the functionality.

> TODO: This may change as this project grows and if common patterns start to emerge it may be provided for you, but for now it's up to you. Below is an example of how your server-rending might make use of `ReduxTaxi`:

```js
/* server.js */
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import express from 'express';

// react-router imports
import {match, RouterContext} from 'react-router';

// redux imports
import {Provider} from 'react-redux';
import {ReduxTaxi, ReduxTaxiProvider} from 'redux-taxi';

// app imports
import configureStore from './store/configureStore'; // Your store configurator

const server = express();
server.use((req, res) => {
    match({routes, location}, (error, redirectLocation, renderProps) => {
        // ... some error handling ...

        if (renderProps) {
            const reduxTaxi = ReduxTaxi();

            // Your configureStore signature may be different, but here we are passing reduxTaxi as part of an object with a property name of `reduxTaxi`
            // to signal to configureStore to include it when configuring the store for the server (as opposed to the client where reduxTaxi is not needed,
            // and something else may be provided, e.g. browserHistory). This allows us to write configureStore in an "isomorphic" fashion, without having
            // to explicitly signal that its running in server or client contexts.
            const store = configureStore(initialState, {reduxTaxi});

            const initialComponent = (
                <Provider store={store}>
                    <ReduxTaxiProvider reduxTaxi={reduxTaxi}>
                        <RouterContext {...renderProps} />
                    </ReduxTaxiProvider>
                </Provider>
            );

            // Render once to instantiate all components (at the given route)
            // and collect any promises that may be registered.
            let content = ReactDOMServer.renderToString(initialComponent);

            const allPromises = reduxTaxi.getAllPromises();
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

Your configure store just needs to apply the `ReduxTaxiMiddleware` with the `ReduxTaxi` instance passed in from server.js. Here's a real-world example:

```js
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {syncHistory} from 'react-router-redux';
import {ReduxTaxiMiddleware, PromiseMiddleware} from 'redux-taxi';
import rootReducer from './reducers'; // Your app reducers

export default function configureStore(initialState, instance) {
    const middleware = applyMiddleware(
        // In a server context, reduxTaxi will be provided,
        // in a client context, history will be provided.
        // This keeps configureStore "isomorphic" in the sense that it's basically unaware of what context it's being rendered in.
        instance.reduxTaxi ? ReduxTaxiMiddleware(instance.reduxTaxi) : syncHistory(instance.history),

        // You do not have to use `ReduxTaxi`'s PromiseMiddleware, but it's provided for convenience
        PromiseMiddleware,

        // Your other middleware...
        thunk
    );

    return createStore(rootReducer, initialState, middleware);
}
```

## Motivation

Because `ReactDOMServer.renderToString()` is synchronous, we need a way to signal to the server that it should wait for any asynchronous actions to complete before responding to the client. Without this, asynchronous actions will be fired and forgotten on the server, and repeated on the client.

#### But why the `@registerAsyncActions()` decorator?

We wanted the decision to slow the server response down to be a very deliberate decision. To achieve this, we opted for a simple decorator where you can explicitly register which asynchronous actions you want to allow to slow down server rendering. Without explicitly registering your asynchronous actions, a fatal `Error` will be thrown.

#### Ok, but what if I don't want to block the server rendering, but fire the action as soon as the page loads?

Simply put your action dispatching in `componentDidMount()` lifecycle method, since this method only executes in a client context. This actually follows Facebook's recommended pattern.

```js
/* SomePage.jsx
   (Modified to only dispatch async action on client)
*/

// (Notice no need to import action type and redux-taxi)

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

In a nutshell, there's special middleware (`ReduxTaxiMiddleware.js` along with `PromiseMiddleware.js`) that intercepts all actions that have a `promise` defined and checks to see if they're registered with `ReduxTaxi.js` (which is provided at the request-level via `ReduxTaxiProvider.js`). Then, when rendering on the server, any promises that have been collected will be `.all().then()`'d and then the server re-renders the markup and finally responds to the client.

>NOTE: This re-rendering (rendering twice) is necessary because React does not currently provide a way to instantiate React Components without actually rendering them to something (e.g. the `constructor` does not get called). To mitigate any (albeit marginal) time cost to this, the re-rendering should _only_ be done when there are actually asynchronous actions that fired. A completely synchronous page should render immediately.
