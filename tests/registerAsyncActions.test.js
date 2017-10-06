import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TestUtils from 'react-dom/test-utils';
import { registerAsyncActions } from '../src/index';

describe('registerAsyncActions', () => {
  const TEST_ACTION1 = 'TEST_ACTION1';
  const TEST_ACTION2 = 'TEST_ACTION2';
  const TEST_ACTION3 = 'TEST_ACTION3';

  const mockReduxTaxi = {
    register() {},
  };

  class StaticComponent extends Component {
    render() {
      return <div />;
    }
  }

  class MockReduxTaxiProvider extends Component {
    static propTypes = {
      children: PropTypes.node.isRequired,
    };

    static childContextTypes = {
      reduxTaxi: PropTypes.object,
    };

    getChildContext() {
      return {
        reduxTaxi: mockReduxTaxi,
      };
    }

    render() {
      return React.Children.only(this.props.children);
    }
  }

  beforeEach(() => {
    mockReduxTaxi.register = jest.fn();
  });

  it('should register a single action passed in', () => {
    @registerAsyncActions(TEST_ACTION1)
    class TestComponent extends StaticComponent {}

    TestUtils.renderIntoDocument(
      <MockReduxTaxiProvider>
        <TestComponent />
      </MockReduxTaxiProvider>
    );

    expect(mockReduxTaxi.register).toHaveBeenCalledTimes(1);
    expect(mockReduxTaxi.register).toHaveBeenCalledWith(TEST_ACTION1);
  });

  it('should register a list of actions passed in', () => {
    @registerAsyncActions(TEST_ACTION1, TEST_ACTION2, TEST_ACTION3)
    class TestComponent extends StaticComponent {}

    TestUtils.renderIntoDocument(
      <MockReduxTaxiProvider>
        <TestComponent />
      </MockReduxTaxiProvider>
    );

    const { register } = mockReduxTaxi;

    expect(register).toHaveBeenCalledTimes(3);
    expect(register.mock.calls[0][0]).toEqual(TEST_ACTION1);
    expect(register.mock.calls[1][0]).toEqual(TEST_ACTION2);
    expect(register.mock.calls[2][0]).toEqual(TEST_ACTION3);
  });

  it('should not register actions when reduxTaxi context is not available', () => {
    @registerAsyncActions(TEST_ACTION1, TEST_ACTION2, TEST_ACTION3)
    class TestComponent extends StaticComponent {}

    TestUtils.renderIntoDocument(<TestComponent />);

    expect(mockReduxTaxi.register).toHaveBeenCalledTimes(0);
  });
});
