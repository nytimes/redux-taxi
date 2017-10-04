import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

export default class ReduxTaxiProvider extends Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
        reduxTaxi: PropTypes.object.isRequired,
    };

    static childContextTypes = {
        reduxTaxi: PropTypes.object.isRequired,
    };

    getChildContext() {
        return {
            reduxTaxi: this.props.reduxTaxi,
        };
    }

    render() {
        const { children } = this.props;
        return Children.only(children);
    }
}
