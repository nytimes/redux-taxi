import {assert} from 'chai';
import sinon from 'sinon';
import React, {Component, PropTypes} from 'react';
import TestUtils from 'react-addons-test-utils';
import {registerAsyncActions} from '../index';

describe('registerAsyncActions', () => {
    const TEST_ACTION1 = 'TEST_ACTION1';
    const TEST_ACTION2 = 'TEST_ACTION2';
    const TEST_ACTION3 = 'TEST_ACTION3';

    const mockAsyncRegister = {
        register() {}
    };

    class StaticComponent extends Component {
        render() {
            return <div />;
        }
    }

    class MockAsyncRegisterProvider extends Component {
        static propTypes = {
            children: PropTypes.node.isRequired
        };

        static childContextTypes = {
            asyncRegister: PropTypes.object
        };

        getChildContext() {
            return {
                asyncRegister: mockAsyncRegister
            };
        }

        render() {
            return React.Children.only(this.props.children);
        }
    }

    beforeEach(() => {
        sinon.spy(mockAsyncRegister, 'register');
    });

    afterEach(() => {
        mockAsyncRegister.register.restore();
    });

    it('should register a single action passed in', () => {
        @registerAsyncActions(TEST_ACTION1)
        class TestComponent extends StaticComponent {}

        TestUtils.renderIntoDocument(
            <MockAsyncRegisterProvider>
                <TestComponent />
            </MockAsyncRegisterProvider>
        );

        assert.isTrue(mockAsyncRegister.register.calledOnce);
        assert(mockAsyncRegister.register.calledWith(TEST_ACTION1));
    });

    it('should register a list of actions passed in', () => {
        @registerAsyncActions(TEST_ACTION1, TEST_ACTION2, TEST_ACTION3)
        class TestComponent extends StaticComponent {}

        TestUtils.renderIntoDocument(
            <MockAsyncRegisterProvider>
                <TestComponent />
            </MockAsyncRegisterProvider>
        );

        assert.isTrue(mockAsyncRegister.register.calledThrice);

        assert.strictEqual(mockAsyncRegister.register.getCall(0).args[0], TEST_ACTION1);
        assert.strictEqual(mockAsyncRegister.register.getCall(1).args[0], TEST_ACTION2);
        assert.strictEqual(mockAsyncRegister.register.getCall(2).args[0], TEST_ACTION3);
    });

    it('should not register actions when asyncRegister context is not available', () => {
        @registerAsyncActions(TEST_ACTION1, TEST_ACTION2, TEST_ACTION3)
        class TestComponent extends StaticComponent {}

        TestUtils.renderIntoDocument(<TestComponent />);

        assert.strictEqual(mockAsyncRegister.register.callCount, 0);
    });
});
