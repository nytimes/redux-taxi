import {assert} from 'chai';
import React, {Component, PropTypes} from 'react';
import TestUtils from 'react-addons-test-utils';
import {AsyncRegisterProvider} from '../index';

describe('AsyncRegisterProvider', () => {
    class Child extends Component {
        static contextTypes = {
            asyncRegister: PropTypes.object.isRequired
        };

        render() {
            return <div />;
        }
    }

    // Ignore propTypes warnings
    const propTypes = AsyncRegisterProvider.propTypes;
    AsyncRegisterProvider.propTypes = {};

    it('should enforce a single child', () => {
        try {
            assert.doesNotThrow(() => TestUtils.renderIntoDocument(
                <AsyncRegisterProvider asyncRegister={{}}>
                    <div />
                </AsyncRegisterProvider>
            ));

            assert.throws(() => TestUtils.renderIntoDocument(
                <AsyncRegisterProvider asyncRegister={{}} />
            ), /exactly one child/);

            assert.throws(() => TestUtils.renderIntoDocument(
                <AsyncRegisterProvider asyncRegister={{}}>
                    <div />
                    <div />
                </AsyncRegisterProvider>
            ), /exactly one child/);
        } finally {
            AsyncRegisterProvider.propTypes = propTypes;
        }
    });

    it('should add the asyncRegister to the child context', () => {
        const asyncRegister = {};

        const tree = TestUtils.renderIntoDocument(
            <AsyncRegisterProvider asyncRegister={asyncRegister}>
                <Child />
            </AsyncRegisterProvider>
        );

        const child = TestUtils.findRenderedComponentWithType(tree, Child);
        assert.strictEqual(child.context.asyncRegister, asyncRegister);
    });
});
