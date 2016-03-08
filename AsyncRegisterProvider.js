import React, {Component, PropTypes, Children} from 'react';

export default class AsyncRegisterProvider extends Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
        asyncRegister: PropTypes.object.isRequired
    };

    static childContextTypes = {
        asyncRegister: PropTypes.object.isRequired
    };

    getChildContext() {
        return {
            asyncRegister: this.props.asyncRegister
        };
    }

    render() {
        const {children} = this.props;
        return Children.only(children);
    }
}
