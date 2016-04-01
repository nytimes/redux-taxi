import {assert} from 'chai';
import React, {Component, PropTypes} from 'react';
import TestUtils from 'react-addons-test-utils';
import {ReduxTaxiProvider} from '../index';

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
        try {
            assert.doesNotThrow(() => TestUtils.renderIntoDocument(
                <ReduxTaxiProvider reduxTaxi={{}}>
                    <div />
                </ReduxTaxiProvider>
            ));

            assert.throws(() => TestUtils.renderIntoDocument(
                <ReduxTaxiProvider reduxTaxi={{}} />
            ), /exactly one child/);

            assert.throws(() => TestUtils.renderIntoDocument(
                <ReduxTaxiProvider reduxTaxi={{}}>
                    <div />
                    <div />
                </ReduxTaxiProvider>
            ), /exactly one child/);
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
