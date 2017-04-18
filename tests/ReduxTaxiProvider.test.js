import {assert} from 'chai';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TestUtils from 'react-dom/test-utils';
import {ReduxTaxiProvider} from '../src/index';

import sinon from 'sinon';

describe('ReduxTaxiProvider', () => {
    class Child extends Component {
        static contextTypes = {
            reduxTaxi: PropTypes.object.isRequired
        };

        render() {
            return <div />;
        }
    }

    // Ignore propTypes warnings
    const propTypes = ReduxTaxiProvider.propTypes;
    ReduxTaxiProvider.propTypes = {};

    it('should enforce a single child', () => {
        // const warn = sinon.spy(console, 'warn');
        const error = sinon.spy(console, 'error');

        try {
            assert.doesNotThrow(() => TestUtils.renderIntoDocument(
                <ReduxTaxiProvider reduxTaxi={{}}>
                    <div />
                </ReduxTaxiProvider>
            ));

            // TestUtils.renderIntoDocument(
            //     <ReduxTaxiProvider reduxTaxi={{}} />
            // )

            TestUtils.renderIntoDocument(
                <ReduxTaxiProvider reduxTaxi={{}}>
                    <div />
                    <div />
                </ReduxTaxiProvider>
            )

            assert.isTrue(error.calledOnce);
            // assert.throws(() => TestUtils.renderIntoDocument(
            //     <ReduxTaxiProvider reduxTaxi={{}} />
            // ), /exactly one child/);

            // assert.isTrue(warn.calledOnce);


            // assert.throws(() => TestUtils.renderIntoDocument(
            //     <ReduxTaxiProvider reduxTaxi={{}}>
            //         <div />
            //         <div />
            //     </ReduxTaxiProvider>
            // ), /exactly one child/);
        } finally {
            ReduxTaxiProvider.propTypes = propTypes;
        }
    });

    it('should add the reduxTaxi to the child context', () => {
        const reduxTaxi = {};

        const tree = TestUtils.renderIntoDocument(
            <ReduxTaxiProvider reduxTaxi={reduxTaxi}>
                <Child />
            </ReduxTaxiProvider>
        );

        const child = TestUtils.findRenderedComponentWithType(tree, Child);
        assert.strictEqual(child.context.reduxTaxi, reduxTaxi);
    });
});
