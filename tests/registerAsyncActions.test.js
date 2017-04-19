import {assert} from 'chai';
import sinon from 'sinon';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TestUtils from 'react-dom/test-utils';
import {registerAsyncActions} from '../src/index';

describe('registerAsyncActions', () => {
    const TEST_ACTION1 = 'TEST_ACTION1';
    const TEST_ACTION2 = 'TEST_ACTION2';
    const TEST_ACTION3 = 'TEST_ACTION3';

    const mockReduxTaxi = {
        register() {}
    };

    class StaticComponent extends Component {
        render() {
            return <div />;
        }
    }

    class MockReduxTaxiProvider extends Component {
        static propTypes = {
            children: PropTypes.node.isRequired
        };

        static childContextTypes = {
            reduxTaxi: PropTypes.object
        };

        getChildContext() {
            return {
                reduxTaxi: mockReduxTaxi
            };
        }

        render() {
            return React.Children.only(this.props.children);
        }
    }

    beforeEach(() => {
        sinon.spy(mockReduxTaxi, 'register');
    });

    afterEach(() => {
        mockReduxTaxi.register.restore();
    });

    it('should register a single action passed in', () => {
        @registerAsyncActions(TEST_ACTION1)
        class TestComponent extends StaticComponent {}

        TestUtils.renderIntoDocument(
            <MockReduxTaxiProvider>
                <TestComponent />
            </MockReduxTaxiProvider>
        );

        assert.isTrue(mockReduxTaxi.register.calledOnce);
        assert(mockReduxTaxi.register.calledWith(TEST_ACTION1));
    });

    it('should register a list of actions passed in', () => {
        @registerAsyncActions(TEST_ACTION1, TEST_ACTION2, TEST_ACTION3)
        class TestComponent extends StaticComponent {}

        TestUtils.renderIntoDocument(
            <MockReduxTaxiProvider>
                <TestComponent />
            </MockReduxTaxiProvider>
        );

        assert.isTrue(mockReduxTaxi.register.calledThrice);

        assert.strictEqual(mockReduxTaxi.register.getCall(0).args[0], TEST_ACTION1);
        assert.strictEqual(mockReduxTaxi.register.getCall(1).args[0], TEST_ACTION2);
        assert.strictEqual(mockReduxTaxi.register.getCall(2).args[0], TEST_ACTION3);
    });

    it('should not register actions when reduxTaxi context is not available', () => {
        @registerAsyncActions(TEST_ACTION1, TEST_ACTION2, TEST_ACTION3)
        class TestComponent extends StaticComponent {}

        TestUtils.renderIntoDocument(<TestComponent />);

        assert.strictEqual(mockReduxTaxi.register.callCount, 0);
    });
});
