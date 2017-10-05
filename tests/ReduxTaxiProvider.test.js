import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TestUtils from 'react-dom/test-utils';
import { ReduxTaxiProvider } from '../src/index';

describe('ReduxTaxiProvider', () => {
  class Child extends Component {
    static contextTypes = {
      reduxTaxi: PropTypes.object.isRequired,
    };

    render() {
      return <div />;
    }
  }

  // Ignore propTypes warnings
  const propTypes = ReduxTaxiProvider.propTypes;
  ReduxTaxiProvider.propTypes = {};

  it('should not throw an error with a single child', () => {
    try {
      TestUtils.renderIntoDocument(
        <ReduxTaxiProvider reduxTaxi={{}}>
          <div />
        </ReduxTaxiProvider>
      );
    } catch (err) {
      fail('Render throw an error.');
    } finally {
      ReduxTaxiProvider.propTypes = propTypes;
    }
  });
  it('should thow an error if no child is present.', () => {
    try {
      TestUtils.renderIntoDocument(
        <ReduxTaxiProvider reduxTaxi={{}} children="" />
      );
    } catch (err) {
      expect(err.message).toEqual(
        expect.stringMatching(
          /only expected to receive a single React element child/
        )
      );
    } finally {
      ReduxTaxiProvider.propTypes = propTypes;
    }
  });
  it('should enforce a single child', () => {
    try {
      TestUtils.renderIntoDocument(
        <ReduxTaxiProvider reduxTaxi={{}}>
          <div />
          <div />
        </ReduxTaxiProvider>
      );
    } catch (err) {
      expect(err.message).toEqual(
        expect.stringMatching(
          /expected to receive a single React element child/
        )
      );
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
    expect(child.context.reduxTaxi).toEqual(reduxTaxi);
  });
});
