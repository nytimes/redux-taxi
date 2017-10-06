/**
* RegisterAsyncActions
*
* Registers the asynchronous actions passed in so that
* the server:
* a) Does not throw an error for expected asynchronous actions
* b) Waits to render the server side markup (for these actions to resolve)
*
**/
import React from 'react';
import PropTypes from 'prop-types';

export default function registerAsyncActions(...actionTypes) {
    return DecoratedComponent =>
        class AsyncDecorator extends React.Component {
            static contextTypes = {
                reduxTaxi: PropTypes.object, // not required because we don't define it for client context
            };

            constructor(props, context) {
                super(props, context);
                if (context.reduxTaxi) {
                    actionTypes.forEach(actionType => {
                        context.reduxTaxi.register(actionType);
                    });
                }
            }

            render() {
                return <DecoratedComponent {...this.props} />;
            }
        };
}
